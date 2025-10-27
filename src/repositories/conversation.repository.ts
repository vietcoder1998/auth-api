import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { ConversationDto, ConversationModel } from '../interfaces';

export class ConversationRepository extends BaseRepository<ConversationModel, ConversationDto, ConversationDto> {
    constructor(conversationDelegate = prisma.conversation) {
        super(conversationDelegate);
    }

    async findByUserId(userId: string) {
        return this.model.findMany({ 
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
    }

    async findByAgentId(agentId: string) {
        return this.model.findMany({ 
            where: { agentId },
            orderBy: { updatedAt: 'desc' }
        });
    }

    async findWithMessages(id: string) {
        return this.model.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
    }
}
