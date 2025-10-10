export interface NotificationPort {
  notify(userId: string, title: string, body: string): Promise<void>;
}
export const NOTIFICATION_PORT = Symbol('NOTIFICATION_PORT');
