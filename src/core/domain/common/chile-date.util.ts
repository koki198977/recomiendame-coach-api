/**
 * Utilidades para manejar fechas en zona horaria de Chile (UTC-3)
 * Todas las fechas del sistema deben usar estas funciones para consistencia
 */

const CHILE_OFFSET_MINUTES = -3 * 60; // UTC-3 (Chile continental)

/**
 * Obtiene la fecha actual en zona horaria de Chile
 * @returns string en formato YYYY-MM-DD
 */
export function getChileDateString(): string {
  const now = new Date();
  const utcOffset = now.getTimezoneOffset();
  const chileTime = new Date(now.getTime() + (utcOffset + CHILE_OFFSET_MINUTES) * 60000);
  return chileTime.toISOString().slice(0, 10);
}

/**
 * Obtiene la fecha y hora actual en zona horaria de Chile
 * @returns Date object ajustado a hora de Chile
 */
export function getChileDateTime(): Date {
  const now = new Date();
  const utcOffset = now.getTimezoneOffset();
  return new Date(now.getTime() + (utcOffset + CHILE_OFFSET_MINUTES) * 60000);
}

/**
 * Normaliza una fecha a medianoche UTC (00:00:00.000Z)
 * @param date - Fecha a normalizar o string YYYY-MM-DD
 * @returns Date normalizado a medianoche UTC
 */
export function normalizeToUTCMidnight(date: Date | string): Date {
  if (typeof date === 'string') {
    return new Date(date + 'T00:00:00.000Z');
  }
  return new Date(date.toISOString().slice(0, 10) + 'T00:00:00.000Z');
}

/**
 * Convierte una fecha/hora a string de fecha en zona horaria de Chile
 * @param date - Fecha a convertir
 * @returns string en formato YYYY-MM-DD
 */
export function toChileDateString(date: Date): string {
  const utcOffset = date.getTimezoneOffset();
  const chileTime = new Date(date.getTime() + (utcOffset + CHILE_OFFSET_MINUTES) * 60000);
  return chileTime.toISOString().slice(0, 10);
}

/**
 * Obtiene el inicio del día en Chile (00:00:00 hora Chile)
 * @param dateString - Fecha en formato YYYY-MM-DD (opcional, default: hoy)
 * @returns Date representando las 00:00:00 de ese día en Chile
 */
export function getChileDayStart(dateString?: string): Date {
  const date = dateString || getChileDateString();
  // En Chile (UTC-3), las 00:00 son las 03:00 UTC
  return new Date(date + 'T03:00:00.000Z');
}

/**
 * Obtiene el fin del día en Chile (23:59:59 hora Chile)
 * @param dateString - Fecha en formato YYYY-MM-DD (opcional, default: hoy)
 * @returns Date representando las 23:59:59 de ese día en Chile
 */
export function getChileDayEnd(dateString?: string): Date {
  const date = dateString || getChileDateString();
  // En Chile (UTC-3), las 23:59:59 son las 02:59:59 UTC del día siguiente
  const nextDay = new Date(date + 'T00:00:00.000Z');
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  nextDay.setUTCHours(2, 59, 59, 999);
  return nextDay;
}
