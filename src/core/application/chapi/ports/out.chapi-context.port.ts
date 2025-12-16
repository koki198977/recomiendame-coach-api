import { MessageClassification, ConversationContext, ChapiContextualResponse } from '../../../domain/chapi/entities';

export const CHAPI_CONTEXT_MANAGER = 'CHAPI_CONTEXT_MANAGER';

export interface ChapiContextManagerPort {
  classifyMessage(params: {
    message: string;
    userId: string;
    context?: ConversationContext;
  }): Promise<MessageClassification>;

  generateContextualResponse(params: {
    message: string;
    userId: string;
    classification: MessageClassification;
    context: ConversationContext;
    userProfile: any;
  }): Promise<ChapiContextualResponse>;

  updateContext(params: {
    userId: string;
    message: string;
    classification: MessageClassification;
    response: ChapiContextualResponse;
  }): Promise<ConversationContext>;

  getContext(userId: string): Promise<ConversationContext | null>;
}