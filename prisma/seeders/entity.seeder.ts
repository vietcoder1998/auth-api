
import { entityRepository } from "../../src/repositories/entity.repository";

/**
 * EntitySeeder
 * Seeds the database with common entities for the application
 */
export class EntitySeeder {
  /**
   * Get entities from database tables dynamically
   */
  private async getEntitiesFromTables() {
    try {
      // Get all tables from the database using raw SQL
      const tables: any[] = await entityRepository.rawQuery(`
        SELECT 
          TABLE_NAME as tableName,
          TABLE_COMMENT as tableComment
        FROM 
          INFORMATION_SCHEMA.TABLES 
        WHERE 
          TABLE_SCHEMA = DATABASE()
          AND TABLE_TYPE = 'BASE TABLE'
          AND TABLE_NAME NOT IN ('_prisma_migrations')
        ORDER BY TABLE_NAME
      `);

      // Convert table names to entity format
      return tables.map(table => {
        const entityName = this.tableNameToEntityName(table.tableName);
        return {
          name: entityName,
          description: table.tableComment || `${entityName} entity for managing ${table.tableName}`
        };
      });
    } catch (error) {
      console.error('❌ Error fetching tables from database:', error);
      // Fallback to empty array if database query fails
      return [];
    }
  }

  /**
   * Convert table name to entity name (snake_case to PascalCase)
   */
  private tableNameToEntityName(tableName: string): string {
    return tableName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Run the seeder
   * Creates sample entities in the database
   */
  async run(): Promise<void> {
    console.log('🌱 Starting Entity seeder...');
    
    try {
      const sampleEntities = await this.getEntitiesFromTables();
      
      if (!sampleEntities || sampleEntities.length === 0) {
        console.log('⚠️  No tables found in database.');
        return;
      }
      
      console.log(`📋 Found ${sampleEntities.length} tables to process`);
      let totalCreated = 0;
      let totalUpdated = 0;

      for (const entityData of sampleEntities) {
        console.log(`🔄 Processing entity: ${entityData.name}`);
        
        try {
          // Check if entity already exists
          const existingEntities: any[] = await entityRepository.findMany({
            name: entityData.name
          });
          
          if (existingEntities && existingEntities.length > 0) {
            // Update existing entity
            const existingEntity = existingEntities[0];
            await entityRepository.update(existingEntity.id, {
              description: entityData.description
            });
            totalUpdated++;
            console.log(`  ✏️  Updated entity: ${entityData.name}`);
          } else {
            // Create new entity
            await entityRepository.create(entityData);
            totalCreated++;
            console.log(`  ➕ Created entity: ${entityData.name}`);
          }
        } catch (error) {
          console.error(`❌ Error processing entity ${entityData.name}:`, error);
        }
      }

      console.log(`✅ Entity seeder completed!`);
      console.log(`📊 Created: ${totalCreated} entities`);
      console.log(`📊 Updated: ${totalUpdated} entities`);
      
    } catch (error) {
      console.error('❌ Entity seeder failed:', error);
      throw error;
    }
  }
}

// Export instance for easy usage
export const entitySeeder = new EntitySeeder();