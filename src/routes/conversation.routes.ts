import { BaseRouter } from './base.route';
import { conversationController } from '../controllers/conversation.controller';

class ConversationRouter extends BaseRouter<any, any, any> {
  constructor() {
    super('conversations', conversationController);
    this.initializeCustomRoutes();
  }

  private initializeCustomRoutes() {
    // Prompt CRUD for a conversation
    this.routes.post('/:id/prompts', conversationController.createPromptHistory.bind(conversationController));
    this.routes.get('/:id/prompts', conversationController.getPromptHistories.bind(conversationController));
    this.routes.put('/prompts/:id', conversationController.updatePromptHistory.bind(conversationController));
    this.routes.delete('/prompts/:id', conversationController.deletePromptHistory.bind(conversationController));

    // Override base CRUD with custom conversation operations
    this.routes.get('/', conversationController.getConversations.bind(conversationController));
    this.routes.post('/', conversationController.createConversation.bind(conversationController));
    this.routes.get('/:id', conversationController.getConversation.bind(conversationController));
    this.routes.put('/:id', conversationController.updateConversation.bind(conversationController));
    this.routes.delete('/:id', conversationController.deleteConversation.bind(conversationController));

    // Message operations
    this.routes.get('/:id/messages', conversationController.getMessages.bind(conversationController));
    this.routes.post('/:id/messages', conversationController.addMessage.bind(conversationController));

    // Command operations
    this.routes.post('/:id/command', conversationController.executeCommand.bind(conversationController));
  }
}

// Export an instance
const conversationRouter = new ConversationRouter();
export default conversationRouter.routes;
