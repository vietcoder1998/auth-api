import { EntityMethodDro, EntityMethodDto, EntityMethodModel } from '../interfaces';
import { EntityMethodRepository, entityMethodRepository } from '../repositories';
import { BaseService } from './base.service';

export class EntityMethodService extends BaseService<
  EntityMethodModel,
  EntityMethodDto,
  EntityMethodDro
> {
  constructor(entityMethodRepository: EntityMethodRepository) {
    super(entityMethodRepository);
  }
}

export const entityMethodService = new EntityMethodService(entityMethodRepository);
