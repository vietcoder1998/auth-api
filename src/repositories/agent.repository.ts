import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { AgentDto, AgentModel } from '../interfaces';

export class AgentRepository extends BaseRepository<AgentModel, AgentDto, AgentDto> {
    constructor(agentDelegate = prisma.agent) {
        super(agentDelegate);
    }

    async findByIdWithRelations(id: string) {
        return this.model.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, email: true, nickname: true },
                },
                model: true,
                memories: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                tools: {
                    include: {
                        tool: true
                    }
                },
                _count: {
                    select: {
                        conversations: true,
                        memories: true,
                        tools: true,
                        tasks: true,
                    },
                },
            },
        });
    }

    async findByUserId(userId: string, skip: number = 0, take: number = 20, search?: string) {
        const where: any = { userId };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        return this.model.findMany({
            where,
            skip,
            take,
            include: {
                model: true,
                tools: {
                    include: {
                        tool: {
                            include: {
                                commands: {
                                    where: { enabled: true },
                                    orderBy: { createdAt: 'desc' },
                                },
                            },
                        },
                    },
                },
                conversations: {
                    orderBy: { updatedAt: 'desc' },
                    take: 5,
                    include: {
                        _count: {
                            select: {
                                messages: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        conversations: true,
                        memories: true,
                        tools: true,
                        tasks: true,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async countByUserId(userId: string, search?: string) {
        const where: any = { userId };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        return this.model.count({ where });
    }

    async createWithRelations(data: any) {
        return this.model.create({
            data,
            include: {
                user: {
                    select: { id: true, email: true, nickname: true },
                },
                model: true,
                _count: {
                    select: {
                        conversations: true,
                        memories: true,
                        tools: true,
                        tasks: true,
                    },
                },
            },
        });
    }

    async updateWithRelations(id: string, data: any) {
        return this.model.update({
            where: { id },
            data,
            include: {
                user: {
                    select: { id: true, email: true, nickname: true },
                },
                model: true,
                _count: {
                    select: {
                        conversations: true,
                        memories: true,
                        tools: true,
                        tasks: true,
                    },
                },
            },
        });
    }
}
