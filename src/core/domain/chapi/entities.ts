export class EmotionalLog {
  id?: string;
  userId: string;
  date: Date;
  message: string;
  emotion: string;
  advice: string;
  actions: ChapiAction[];
  createdAt?: Date;
}

export interface ChapiAction {
  title: string;
  type: 'PHYSICAL' | 'MENTAL' | 'BREATHING' | 'OTHER';
  durationMinutes: number;
}

export interface ChapiResponse {
  emotion: string;
  neuroscience: string;
  actions: ChapiAction[];
  miniTask?: string;
}
