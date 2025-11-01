import { ConversationDro, ConversationDto, ConversationModel } from '../interfaces';
import {
  ConversationController,
  conversationController,
} from './../controllers';
import { BaseRouter } from './base.route';

export class ConversationRouter extends BaseRouter<
  ConversationModel,
  ConversationDto,
  ConversationDro
> {
  constructor() {
    super('/conversations');
    this.initializeRoutes(conversationController);
  }

  protected override initializeRoutes(controller: ConversationController) {
    // Prompt CRUD for a conversation
    this.routes.post('/:id/prompts', controller.createPromptHistory.bind(controller));
    this.routes.get('/:id/prompts', controller.getPromptHistories.bind(controller));
    this.routes.put('/prompts/:id', controller.updatePromptHistory.bind(controller));
    this.routes.delete('/prompts/:id', controller.deletePromptHistory.bind(controller));

    // Override base CRUD with custom conversation operations
    this.routes.get('/', controller.getConversations.bind(controller));
    this.routes.post('/', controller.createConversation.bind(controller));
    this.routes.get('/:id', controller.getConversation.bind(controller));
    this.routes.put('/:id', controller.updateConversation.bind(controller));
    this.routes.delete('/:id', controller.deleteConversation.bind(controller));

    // Message operations
    this.routes.get('/:id/messages', controller.getMessages.bind(controller));
    this.routes.post('/:id/messages', controller.addMessage.bind(controller));

    // Command operations
    this.routes.post('/:id/command', controller.executeCommand.bind(controller));
  }
}

// Export an instance
export const conversationRouter = new ConversationRouter();
