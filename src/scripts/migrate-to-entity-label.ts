/**
 * Migration script to convert from individual junction tables to single EntityLabel table
 * 
 * This script should be run after:
 * 1. Running: npx prisma migrate dev --name "convert-to-single-entity-label-table"
 * 2. The new schema has been applied to the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToEntityLabel() {
  console.log('Starting migration to EntityLabel system...');

  try {
    // Get all existing labels to create default mock label assignments
    const mockLabel = await prisma.label.findFirst({
      where: { name: 'mock' }
    });

    if (!mockLabel) {
      console.log('Creating default mock label...');
      const newMockLabel = await prisma.label.create({
        data: {
          name: 'mock',
          description: 'Default label for mock/test data',
          color: '#6c757d'
        }
      });
      
      console.log('Mock label created:', newMockLabel.id);
    }

    // Since we removed the direct labelId fields, we'll need to create EntityLabel entries
    // for entities that should have the mock label by default
    
    const entities = [
      { table: 'user', type: 'user' },
      { table: 'role', type: 'role' },
      { table: 'permission', type: 'permission' },
      { table: 'token', type: 'token' },
      { table: 'mail_template', type: 'mailTemplate' },
      { table: 'notification_template', type: 'notificationTemplate' },
      { table: 'config', type: 'config' },
      { table: 'api_key', type: 'apiKey' },
      { table: 'api_usage_log', type: 'apiUsageLog' },
      { table: 'mail', type: 'mail' },
      { table: 'sso', type: 'sso' },
      { table: 'login_history', type: 'loginHistory' },
      { table: 'logic_history', type: 'logicHistory' },
      { table: 'agent', type: 'agent' },
      { table: 'agent_memory', type: 'agentMemory' },
      { table: 'conversation', type: 'conversation' },
      { table: 'message', type: 'message' },
      { table: 'agent_tool', type: 'agentTool' },
      { table: 'agent_task', type: 'agentTask' }
    ];

    const labelId = mockLabel?.id || (await prisma.label.findFirst({ where: { name: 'mock' } }))?.id;
    
    if (!labelId) {
      throw new Error('Mock label not found');
    }

    for (const entity of entities) {
      console.log(`Processing ${entity.type}...`);
      
      // Get all entities of this type
      const records = await (prisma as any)[entity.type].findMany({
        select: { id: true }
      });

      if (records.length > 0) {
        // Create EntityLabel entries for all records
        const entityLabelData = records.map((record: any) => ({
          entityId: record.id,
          entityType: entity.type,
          labelId: labelId
        }));

        await prisma.entityLabel.createMany({
          data: entityLabelData,
          skipDuplicates: true
        });

        console.log(`Created ${entityLabelData.length} EntityLabel entries for ${entity.type}`);
      }
    }

    console.log('Migration completed successfully!');
    
    // Verify the migration
    const totalEntityLabels = await prisma.entityLabel.count();
    console.log(`Total EntityLabel records created: ${totalEntityLabels}`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Usage examples for the new system
async function usageExamples() {
  console.log('\\n=== Usage Examples ===');
  
  // Example 1: Add labels to a user
  const user = await prisma.user.findFirst();
  if (user) {
    // Add multiple labels to a user
    await prisma.entityLabel.createMany({
      data: [
        { 
          entityId: user.id, 
          entityType: 'user', 
          labelId: 'some-label-id-1' 
        },
        { 
          entityId: user.id, 
          entityType: 'user', 
          labelId: 'some-label-id-2' 
        }
      ],
      skipDuplicates: true
    });
    console.log('Labels added to user');
  }

  // Example 2: Get all labels for a user
  if (user) {
    const userLabels = await prisma.entityLabel.findMany({
      where: {
        entityId: user.id,
        entityType: 'user'
      },
      include: {
        label: true
      }
    });
    console.log('User labels:', userLabels.map(ul => ul.label.name));
  }

  // Example 3: Get all users with a specific label
  const usersWithMockLabel = await prisma.entityLabel.findMany({
    where: {
      entityType: 'user',
      label: {
        name: 'mock'
      }
    }
  });
  console.log(`Found ${usersWithMockLabel.length} users with 'mock' label`);

  // Example 4: Remove labels from an entity
  if (user) {
    await prisma.entityLabel.deleteMany({
      where: {
        entityId: user.id,
        entityType: 'user',
        label: {
          name: 'mock'
        }
      }
    });
    console.log('Mock label removed from user');
  }

  // Example 5: Get label statistics by entity type
  const labelStats = await prisma.entityLabel.groupBy({
    by: ['entityType'],
    _count: {
      entityType: true
    }
  });
  console.log('Label usage by entity type:', labelStats);
}

// Run migration
if (require.main === module) {
  migrateToEntityLabel()
    .then(() => usageExamples())
    .catch(console.error);
}

export { migrateToEntityLabel, usageExamples };