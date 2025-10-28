import {
  EntityMethodModel,
  EntityMethodDro,
  EntityMethodDto,
} from '../interfaces/entitymethod.interface';
import prisma from '../prisma';
import { BaseRepository } from './base.repository';

export class EntityMethodRepository extends BaseRepository<
  EntityMethodModel,
  EntityMethodDto,
  EntityMethodDro
> {
  constructor(entityModel: typeof prisma.entityMethod) {
    super(entityModel);
  }
}

export const entityMethodRepository = new EntityMethodRepository(prisma.entityMethod);
