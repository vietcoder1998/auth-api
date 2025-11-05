import { PrismaClient } from '@prisma/client';
import { mockJobs } from '../../src/mock/jobs';
import BaseSeeder from './base.seeder';

interface JobCreateData {
  type: string;
  status?: string;
  result?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  description?: string | null;
  payload?: string | null;
  error?: string | null;
  retries?: number;
  maxRetries?: number;
  progress?: number;
  userId?: string | null;
}

export class JobSeeder extends BaseSeeder {
  public static instance = new JobSeeder();

  constructor() {
    super();
  }

  /**
   * Seed jobs with safe field handling for database schema compatibility
   */
  public async run(prisma: PrismaClient): Promise<any[]> {
    console.log('🧑‍💼 Seeding Jobs...');
    
    const createdJobs: any[] = [];

    for (const job of mockJobs) {
      try {
        // Create job data without problematic fields like priority
        // Use safe typing that only includes fields we know exist
        const jobData: JobCreateData = {
          type: job.type,
          status: job.status || 'pending',
          result: job.result === null ? null : job.result,
          description: (job as any).name || null, // Map 'name' from mock to 'description' in schema
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        };

        // Try to create the job with error handling for schema mismatches
        try {
          const createdJob = await prisma.job.create({ 
            data: jobData as any // Cast to any for Prisma compatibility
          });
          createdJobs.push(createdJob);
          console.log(`✓ Created job: ${jobData.type} (${jobData.status})`);
        } catch (priorityError: any) {
          // Handle specific database schema issues
          if (priorityError.code === 'P2022') {
            const missingColumn = priorityError.meta?.column;
            console.log(`⚠ Column '${missingColumn}' not found in database, using basic fields only`);
            
            // Retry with minimal fields that should definitely exist
            const minimalJobData = {
              type: job.type,
              status: job.status || 'pending',
            };
            
            const createdJob = await prisma.job.create({
              data: minimalJobData
            });
            createdJobs.push(createdJob);
            console.log(`✓ Created job with minimal data: ${minimalJobData.type}`);
          } else {
            throw priorityError;
          }
        }
      } catch (error) {
        console.log(`⚠ Error creating job:`, error);
      }
    }

    console.log(`✅ Successfully seeded ${createdJobs.length} jobs`);
    return createdJobs;
  }
}

export default JobSeeder;