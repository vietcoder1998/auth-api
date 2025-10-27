import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { MessageDto, MessageModel } from '../interfaces';

export class MessageRepository extends BaseRepository<MessageModel, MessageDto, MessageDto> {
    constructor(messageDelegate = prisma.message) {
        super(messageDelegate);
    }

    async findByConversationId(conversationId: string) {
        return this.model.findMany({ 
            where: { conversationId },
            orderBy: { createdAt: 'asc' }
        });
    }

    async findByAgentId(agentId: string) {
        return this.model.findMany({ 
            where: { agentId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async countByConversationId(conversationId: string) {
        return this.model.count({ where: { conversationId } });
    }
}
