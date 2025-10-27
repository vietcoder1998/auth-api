
import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../../src/repositories';

export class AgentSeeder {
    static async run({ prisma, mockAgents, superadminUser, adminUser, regularUser, mockLabelId }: any) {
        // Use UserRepository to fetch all users and build agentUserMapping
        const userRepo = new UserRepository(prisma.user);
        // Use repository method to fetch users by email
        const superadmin = await userRepo.findByEmail('superadmin@example.com');
        const admin = await userRepo.findByEmail('admin@example.com');
        const user = await userRepo.findByEmail('user@example.com');
        const agentUserMapping: Record<string, string> = {
            'super-admin-id': superadmin?.id || '',
            'admin-id': admin?.id || '',
            'user-id': user?.id || '',
        };

        // Explicitly type aiAgents as Prisma.AgentCrOFeateInput[]
        const aiAgents: any[] = [];
        for (const agent of mockAgents) {
            let modelConnect: any = undefined;
            if (agent.model) {
                const model = await prisma.aIModel.findUnique({ where: { name: agent.model } });
                if (model) modelConnect = { connect: { id: model.id } };
            }
            const { model, ownerId, id, ...agentData } = agent;
            aiAgents.push({
                ...agentData,
                user: { connect: { id: agentUserMapping[ownerId] || '' } },
                ...(modelConnect ? { model: modelConnect } : {}),
            });
        }

        const createdAgents: any[] = [];
        for (const agent of aiAgents) {
            if (agent.user && agent.user.connect && agent.user.connect.id) {
                try {
                    const existingAgent = await prisma.agent.findFirst({
                        where: { userId: agent.user.connect.id, name: agent.name },
                        include: {
                            user: {
                                select: { id: true, email: true, nickname: true, status: true },
                            },
                        },
                    });

                    if (!existingAgent) {
                        const createdAgent = await prisma.agent.create({ data: agent });
                        createdAgents.push(createdAgent);
                        console.log(
                            `✓ Created AI agent: ${agent.name} (Status: ${agent.isActive ? 'Active' : 'Inactive'})`,
                        );
                    } else {
                        createdAgents.push(existingAgent);
                        console.log(
                            `⚠ Agent already exists: ${agent.name} (Owner: ${existingAgent.user?.nickname}, Status: ${existingAgent.isActive ? 'Active' : 'Inactive'})`,
                        );
                    }
                } catch (error) {
                    console.log(`⚠ Error creating agent ${agent.name}:`, error);
                }
            }
        }

        // Add mock label to all agents
        if (mockLabelId && createdAgents.length > 0) {
            const agentLabels = createdAgents.map((agent: any) => ({
                entityId: agent.id,
                entityType: 'agent',
                labelId: mockLabelId,
            }));

            await prisma.entityLabel.createMany({
                data: agentLabels,
                skipDuplicates: true,
            });
        }

        return createdAgents;
    }
}
