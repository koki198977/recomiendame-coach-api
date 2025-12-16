import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import * as admin from 'firebase-admin';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

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
  private firebaseInitialized = false;

  constructor(private prisma: PrismaService) {
    this.initializeServices();
  }

  private initializeServices() {
    // Inicializar Expo SDK
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
      useFcmV1: true, // Usar FCM v1 API
    });

    // Inicializar Firebase Admin SDK
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        });
        
        this.firebaseInitialized = true;
        this.logger.log('✅ Firebase Admin SDK inicializado');
      }
    } catch (error) {
      this.logger.error('❌ Error inicializando Firebase:', error);
    }
  }

  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<void> {
    try {
      // Obtener todos los tokens del usuario
      const deviceTokens = await this.prisma.deviceToken.findMany({
        where: { userId },
      });

      if (deviceTokens.length === 0) {
        this.logger.warn(`No hay tokens de dispositivo para usuario ${userId}`);
        return;
      }

      // Separar tokens por plataforma
      const expoTokens = deviceTokens.filter(d => d.platform === 'expo').map(d => d.token);
      const fcmTokens = deviceTokens.filter(d => d.platform === 'fcm').map(d => d.token);
      const apnsTokens = deviceTokens.filter(d => d.platform === 'apns').map(d => d.token);

      // Enviar a Expo (React Native con Expo)
      if (expoTokens.length > 0) {
        await this.sendExpoNotifications(expoTokens, payload);
      }

      // Enviar a FCM (Android nativo)
      if (fcmTokens.length > 0 && this.firebaseInitialized) {
        await this.sendFCMNotifications(fcmTokens, payload);
      }

      // Enviar a APNs (iOS nativo)
      if (apnsTokens.length > 0 && this.firebaseInitialized) {
        await this.sendAPNSNotifications(apnsTokens, payload);
      }

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
          channelId: 'default', // Para Android
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

  private async sendFCMNotifications(tokens: string[], payload: PushNotificationPayload): Promise<void> {
    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ? this.stringifyData(payload.data) : {},
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'default',
            sound: payload.sound || 'default',
            priority: 'high' as const,
          },
        },
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      this.logger.log(`✅ FCM: ${response.successCount}/${tokens.length} enviadas`);
      
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.error(`FCM error para token ${tokens[idx]}: ${resp.error?.message}`);
          }
        });
      }
    } catch (error) {
      this.logger.error('❌ Error en sendFCMNotifications:', error);
    }
  }

  private async sendAPNSNotifications(tokens: string[], payload: PushNotificationPayload): Promise<void> {
    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ? this.stringifyData(payload.data) : {},
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              sound: payload.sound || 'default',
              badge: payload.badge || 0,
            },
          },
        },
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      this.logger.log(`✅ APNs: ${response.successCount}/${tokens.length} enviadas`);
    } catch (error) {
      this.logger.error('❌ Error en sendAPNSNotifications:', error);
    }
  }

  private async processExpoReceipts(tickets: ExpoPushTicket[]): Promise<void> {
    // Procesar receipts para tracking de entrega (opcional)
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
          }
        }
      }
    } catch (error) {
      this.logger.error('Error procesando receipts de Expo:', error);
    }
  }

  private stringifyData(data: any): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return result;
  }

  // Método para registrar token de dispositivo
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'expo' | 'fcm' | 'apns'
  ): Promise<void> {
    try {
      await this.prisma.deviceToken.upsert({
        where: {
          token,
        },
        update: {
          userId,
          platform,
        },
        create: {
          userId,
          token,
          platform,
        },
      });

      this.logger.log(`✅ Token registrado para usuario ${userId} (${platform})`);
    } catch (error) {
      this.logger.error('❌ Error registrando token:', error);
    }
  }

  // Método para eliminar token (cuando usuario hace logout)
  async unregisterDeviceToken(token: string): Promise<void> {
    try {
      await this.prisma.deviceToken.delete({
        where: { token },
      });
      
      this.logger.log(`✅ Token eliminado: ${token}`);
    } catch (error) {
      this.logger.error('❌ Error eliminando token:', error);
    }
  }

  // Método para limpiar tokens inválidos
  async cleanupInvalidTokens(): Promise<void> {
    try {
      // Aquí podrías implementar lógica para limpiar tokens que fallan consistentemente
      this.logger.log('🧹 Limpieza de tokens completada');
    } catch (error) {
      this.logger.error('❌ Error en limpieza de tokens:', error);
    }
  }
}