import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { HydrationRepoPort } from '../../../core/application/hydration/ports/out.hydration-repo.port';
import { HydrationLog, HydrationGoal } from '../../../core/domain/hydration/entities';

@Injectable()
export class HydrationPrismaRepository implements HydrationRepoPort {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(log: Omit<HydrationLog, 'id' | 'createdAt'>): Promise<HydrationLog> {
    const created = await this.prisma.hydrationLog.create({
      data: {
        userId: log.userId,
        date: log.date,
        ml: log.ml,
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      date: created.date,
      ml: created.ml,
      createdAt: created.date, // Usar date como createdAt
    };
  }

  async getLogsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<HydrationLog[]> {
    const where: any = { userId };
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const logs = await this.prisma.hydrationLog.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return logs.map(log => ({
      id: log.id,
      userId: log.userId,
      date: log.date,
      ml: log.ml,
      createdAt: log.date, // Usar date como createdAt
    }));
  }

  async getLogsByDate(userId: string, date: Date): Promise<HydrationLog[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getLogsByUser(userId, startOfDay, endOfDay);
  }

  async updateLog(id: string, ml: number): Promise<HydrationLog> {
    const updated = await this.prisma.hydrationLog.update({
      where: { id },
      data: { ml },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      date: updated.date,
      ml: updated.ml,
      createdAt: updated.date, // Usar date como createdAt
    };
  }

  async deleteLog(id: string): Promise<void> {
    await this.prisma.hydrationLog.delete({
      where: { id },
    });
  }

  async setGoal(goal: HydrationGoal): Promise<HydrationGoal> {
    // Guardar en el perfil del usuario como JSON
    await this.prisma.user.update({
      where: { id: goal.userId },
      data: {
        hydrationGoal: goal as any,
      },
    });

    return goal;
  }

  async getGoal(userId: string): Promise<HydrationGoal | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { hydrationGoal: true },
    });

    if (!user?.hydrationGoal) {
      return null;
    }

    try {
      return user.hydrationGoal as unknown as HydrationGoal;
    } catch {
      return null;
    }
  }

  async updateGoal(userId: string, updates: Partial<HydrationGoal>): Promise<HydrationGoal> {
    const currentGoal = await this.getGoal(userId);
    const updatedGoal = { ...currentGoal, ...updates, userId };

    return this.setGoal(updatedGoal as HydrationGoal);
  }

  async getTotalByDate(userId: string, date: Date): Promise<number> {
    const logs = await this.getLogsByDate(userId, date);
    return logs.reduce((total, log) => total + log.ml, 0);
  }

  async getWeeklyStats(userId: string, weekStart: Date): Promise<Array<{ date: Date; ml: number }>> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const logs = await this.getLogsByUser(userId, weekStart, weekEnd);
    
    // Agrupar por día
    const dailyTotals = new Map<string, number>();
    
    logs.forEach(log => {
      const dateKey = log.date.toISOString().split('T')[0];
      const current = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(dateKey, current + log.ml);
    });

    // Crear array con todos los días de la semana
    const result: Array<{ date: Date; ml: number }> = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const ml = dailyTotals.get(dateKey) || 0;
      result.push({ date, ml });
    }

    return result;
  }

  async getMonthlyStats(userId: string, month: number, year: number): Promise<Array<{ date: Date; ml: number }>> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Último día del mes

    const logs = await this.getLogsByUser(userId, startDate, endDate);
    
    // Agrupar por día
    const dailyTotals = new Map<string, number>();
    
    logs.forEach(log => {
      const dateKey = log.date.toISOString().split('T')[0];
      const current = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(dateKey, current + log.ml);
    });

    // Crear array con todos los días del mes
    const result: Array<{ date: Date; ml: number }> = [];
    const daysInMonth = endDate.getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateKey = date.toISOString().split('T')[0];
      const ml = dailyTotals.get(dateKey) || 0;
      result.push({ date, ml });
    }

    return result;
  }
}