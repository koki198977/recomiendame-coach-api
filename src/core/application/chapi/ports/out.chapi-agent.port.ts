import { ChapiResponse } from '../../../domain/chapi/entities';

export const CHAPI_AGENT = 'CHAPI_AGENT';

export interface ChapiAgentPort {
  analyzeMood(params: {
    userId: string;
    message: string;
    userProfile: any;
  }): Promise<ChapiResponse>;
}
