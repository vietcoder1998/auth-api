import { EntityDto } from '../../src/interfaces';
import {
  EntityMethodRepository,
  entityMethodRepository,
  entityRepository,
  EntityRepository,
} from '../../src/repositories';

export class EntityMethodSeeder {
  private entityRepository: EntityRepository;
  private entityMethodRepository: EntityMethodRepository;

  constructor() {
    this.entityRepository = entityRepository;
    this.entityMethodRepository = entityMethodRepository;
  }

  /**
   * Get common CRUD methods that should be available for all entities
   */
  private getCommonMethods() {
    return [
      {
        name: 'getAll',
        description: 'Get all records of this entity',
        code: `
// Get all {entity} records
const get{Entity}All = async () => {
  try {
    const records = await {entity}Repository.findMany();
    return {
      success: true,
      data: records,
      total: records.length
    };
  } catch (error) {
    console.error('Error fetching {entity} records:', error);
    return {
      success: false,
      error: error.message
    };
  }
};`.trim()
      },
      {
        name: 'getById',
        description: 'Get a single record by ID',
        code: `
// Get {entity} by ID
const get{Entity}ById = async (id: string) => {
  try {
    const record = await {entity}Repository.findById(id);
    if (!record) {
      return {
        success: false,
        error: '{Entity} not found'
      };
    }
    return {
      success: true,
      data: record
    };
  } catch (error) {
    console.error('Error fetching {entity} by ID:', error);
    return {
      success: false,
      error: error.message
    };
  }
};`.trim()
      },
      {
        name: 'create',
        description: 'Create a new record',
        code: `
// Create new {entity}
const create{Entity} = async (data: any) => {
  try {
    const record = await {entity}Repository.create(data);
    return {
      success: true,
      data: record
    };
  } catch (error) {
    console.error('Error creating {entity}:', error);
    return {
      success: false,
      error: error.message
    };
  }
};`.trim()
      },
      {
        name: 'update',
        description: 'Update an existing record',
        code: `
// Update {entity} by ID
const update{Entity} = async (id: string, data: any) => {
  try {
    const record = await {entity}Repository.update(id, data);
    return {
      success: true,
      data: record
    };
  } catch (error) {
    console.error('Error updating {entity}:', error);
    return {
      success: false,
      error: error.message
    };
  }
};`.trim()
      },
      {
        name: 'delete',
        description: 'Delete a record by ID',
        code: `
// Delete {entity} by ID
const delete{Entity} = async (id: string) => {
  try {
    const record = await {entity}Repository.delete(id);
    return {
      success: true,
      data: record
    };
  } catch (error) {
    console.error('Error deleting {entity}:', error);
    return {
      success: false,
      error: error.message
    };
  }
};`.trim()
      },
      {
        name: 'search',
        description: 'Search records with filters',
        code: `
// Search {entity} records
const search{Entity} = async (params: any) => {
  try {
    const records = await {entity}Repository.search(params);
    const total = await {entity}Repository.count(params.where);
    return {
      success: true,
      data: records,
      total
    };
  } catch (error) {
    console.error('Error searching {entity} records:', error);
    return {
      success: false,
      error: error.message
    };
  }
};`.trim()
      },
      {
        name: 'count',
        description: 'Count records with optional filters',
        code: `
// Count {entity} records
const count{Entity} = async (where?: any) => {
  try {
    const total = await {entity}Repository.count({ where });
    return {
      success: true,
      total
    };
  } catch (error) {
    console.error('Error counting {entity} records:', error);
    return {
      success: false,
      error: error.message
    };
  }
};`.trim()
      }
    ];
  }

  /**
   * Run the seeder
   * Gets all entities from the database and creates/updates common methods for each
   */
  async run(): Promise<void> {
    console.log('🌱 Starting EntityMethod seeder...');

    try {
      // Get all entities from the database using findMany
      const entities: EntityDto[] = await this.entityRepository.findMany();
      console.log(`📋 Found ${entities.length} entities to process`);

      if (!entities || entities.length === 0) {
        console.log('⚠️  No entities found in database. Please run entity seeder first.');
        return;
      }

      const commonMethods = this.getCommonMethods();
      let totalProcessed = 0;

      for (const entity of entities) {
        console.log(`🔄 Processing entity: ${entity.name}`);

        for (const methodTemplate of commonMethods) {
          // Replace placeholders in the method template
          const method = {
            name: `${entity.name.toLowerCase()}_${methodTemplate.name}`,
            description: methodTemplate.description,
            code: methodTemplate.code
              .replace(/\{entity\}/g, entity.name.toLowerCase())
              .replace(/\{Entity\}/g, entity.name),
            entityId: entity.id
          };

          try {
            // Check if method already exists for this entity
            const existingMethods: any[] = await this.entityMethodRepository.findMany({
              entityId: entity.id,
              name: method.name
            });

            if (existingMethods && existingMethods.length > 0) {
              // Update existing method
              const existingMethod = existingMethods[0];
              await this.entityMethodRepository.update(existingMethod.id, {
                description: method.description,
                code: method.code
              });
              totalProcessed++;
              console.log(`  ✏️  Updated method: ${method.name}`);
            } else {
              // Create new method with only valid fields
              await this.entityMethodRepository.create({
                name: method.name,
                description: method.description,
                code: method.code,
                entityId: entity.id
              });
              totalProcessed++;
              console.log(`  ➕ Created method: ${method.name}`);
            }
          } catch (error) {
            console.error(
              `❌ Error processing method ${method.name} for entity ${entity.name}:`,
              error,
            );
          }
        }
      }

      console.log(`✅ EntityMethod seeder completed!`);
      console.log(`📊 Total methods processed: ${totalProcessed}`);
    } catch (error) {
      console.error('❌ EntityMethod seeder failed:', error);
      throw error;
    }
  }
}

export const entityMethodSeeder = new EntityMethodSeeder();