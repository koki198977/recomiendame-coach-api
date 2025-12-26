import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PrismaClient } from '@prisma/client';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: any;
  sound?: 'default' | null;
  badge?: number;
}

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);
  private expo: Expo;

  constructor(private prisma: PrismaService) {
    this.initializeExpo();
  }

  private initializeExpo() {
    // Inicializar Expo SDK
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
      useFcmV1: true,
    });
    
    this.logger.log('✅ Expo Push SDK inicializado');
  }

  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<void> {
    try {
      // Obtener todos los tokens del usuario
      const userTokens = await (this.prisma as any).userPushToken.findMany({
        where: { userId },
      });

      if (userTokens.length === 0) {
        this.logger.warn(`No hay push tokens para usuario ${userId}`);
        return;
      }

      const pushTokens = userTokens.map((token: any) => token.pushToken);
      await this.sendExpoNotifications(pushTokens, payload);

      // Actualizar lastUsedAt para todos los tokens
      await (this.prisma as any).userPushToken.updateMany({
        where: { userId },
        data: { lastUsedAt: new Date() },
      });

      this.logger.log(`📱 Notificación enviada a usuario ${userId}: ${payload.title}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando notificación a usuario ${userId}:`, error);
    }
  }

  private async sendExpoNotifications(tokens: string[], payload: PushNotificationPayload): Promise<void> {
    try {
      const messages: ExpoPushMessage[] = [];

      for (const pushToken of tokens) {
        // Verificar que el token sea válido
        if (!Expo.isExpoPushToken(pushToken)) {
          this.logger.error(`Token de Expo inválido: ${pushToken}`);
          continue;
        }

        messages.push({
          to: pushToken,
          sound: payload.sound || 'default',
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          badge: payload.badge,
          channelId: 'default',
          priority: 'high',
          ttl: 3600, // 1 hora
        });
      }

      if (messages.length === 0) return;

      // Enviar en chunks para evitar límites de rate
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          this.logger.error('Error enviando chunk de Expo:', error);
        }
      }

      // Procesar receipts (opcional, para tracking)
      await this.processExpoReceipts(tickets);

      this.logger.log(`✅ ${messages.length} notificaciones Expo enviadas`);
    } catch (error) {
      this.logger.error('❌ Error en sendExpoNotifications:', error);
    }
  }

  private async processExpoReceipts(tickets: ExpoPushTicket[]): Promise<void> {
    const receiptIds = tickets
      .filter(ticket => ticket.status === 'ok')
      .map(ticket => ticket.id);

    if (receiptIds.length === 0) return;

    try {
      const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);
      
      for (const chunk of receiptIdChunks) {
        const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
        
        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];
          if (receipt.status === 'error') {
            this.logger.error(`Expo receipt error: ${receipt.message}`);
            
            // Si el token es inválido, eliminarlo de la base de datos
            if (receipt.details?.error === 'DeviceNotRegistered') {
              // Aquí podrías implementar lógica para limpiar tokens inválidos
              this.logger.warn('Token inválido detectado, debería ser eliminado');
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Error procesando receipts de Expo:', error);
    }
  }

  // Método para registrar token de dispositivo (compatibilidad con controlador existente)
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'expo' | 'fcm' | 'apns'
  ): Promise<void> {
    // Mapear plataformas para compatibilidad
    const mappedPlatform = platform === 'expo' || platform === 'fcm' || platform === 'apns' 
      ? (platform === 'fcm' ? 'android' : 'ios')
      : platform;
    
    return this.registerPushToken(userId, token, mappedPlatform);
  }

  // Método para eliminar token (compatibilidad con controlador existente)
  async unregisterDeviceToken(token: string): Promise<void> {
    return this.unregisterPushToken(token);
  }

  // Método para registrar token de dispositivo
  async registerPushToken(
    userId: string,
    pushToken: string,
    platform: 'ios' | 'android'
  ): Promise<void> {
    try {
      // Verificar que el token sea válido
      if (!Expo.isExpoPushToken(pushToken)) {
        throw new Error('Token de Expo inválido');
      }

      await (this.prisma as any).userPushToken.upsert({
        where: {
          pushToken,
        },
        update: {
          userId,
          platform,
          lastUsedAt: new Date(),
        },
        create: {
          userId,
          pushToken,
          platform,
        },
      });

      this.logger.log(`✅ Push token registrado para usuario ${userId} (${platform})`);
    } catch (error) {
      this.logger.error('❌ Error registrando push token:', error);
      throw error;
    }
  }

  // Método para eliminar token (cuando usuario hace logout)
  async unregisterPushToken(pushToken: string, userId?: string): Promise<void> {
    try {
      const whereClause: any = { pushToken };
      if (userId) {
        whereClause.userId = userId;
      }

      await (this.prisma as any).userPushToken.delete({
        where: whereClause,
      });
      
      this.logger.log(`✅ Push token eliminado: ${pushToken}`);
    } catch (error) {
      this.logger.error('❌ Error eliminando push token:', error);
      throw error;
    }
  }

  // Método para limpiar tokens inválidos
  async cleanupInvalidTokens(): Promise<void> {
    try {
      // Eliminar tokens que no se han usado en más de 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await (this.prisma as any).userPushToken.deleteMany({
        where: {
          lastUsedAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      this.logger.log(`🧹 Limpieza completada: ${result.count} tokens eliminados`);
    } catch (error) {
      this.logger.error('❌ Error en limpieza de tokens:', error);
    }
  }

  // Método para enviar notificación de prueba
  async sendTestNotification(userId: string): Promise<void> {
    await this.sendToUser(userId, {
      title: '🍽️ Hora de comer',
      body: 'No olvides registrar tu almuerzo',
      data: { screen: 'nutrition' },
      sound: 'default',
    });
  }
}