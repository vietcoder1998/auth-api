import { PrismaClient, PromptTemplate } from '@prisma/client';
import { BaseService } from './base.service';
import { PromptTemplateRepository } from '../repositories/prompttemplate.repository';
import { PromptTemplateDto } from '../interfaces';

const prisma = new PrismaClient();

export class PromptTemplateService extends BaseService<any, PromptTemplateDto, PromptTemplateDto> {
  private promptTemplateRepository: PromptTemplateRepository;

  constructor() {
    const promptTemplateRepository = new PromptTemplateRepository();
    super(promptTemplateRepository);
    this.promptTemplateRepository = promptTemplateRepository;
  }

  async create(data: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptTemplate> {
    return this.promptTemplateRepository.create(data as any);
  }
  async findAll(): Promise<PromptTemplate[]> {
    return prisma.promptTemplate.findMany();
  }

  async findById(id: string): Promise<PromptTemplate | null> {
    return this.promptTemplateRepository.findById(id);
  }

  async update(id: string, data: Partial<Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PromptTemplate> {
    return this.promptTemplateRepository.update(id, data as any);
  }

  async delete(id: string): Promise<PromptTemplate> {
    return this.promptTemplateRepository.delete(id);
  }
}

export const promptTemplateService = new PromptTemplateService();
