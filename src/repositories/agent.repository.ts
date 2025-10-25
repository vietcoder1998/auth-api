import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { AgentDto, AgentModel } from '../interfaces';

export class AgentRepository extends BaseRepository<AgentModel, AgentDto, AgentDto> {
    constructor(agentDelegate = prisma.agent) {
        super(agentDelegate);
    }
    // Add custom methods for Agent if needed
}
