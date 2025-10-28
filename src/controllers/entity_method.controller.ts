import {
  EntityMethodDro,
  EntityMethodDto,
  EntityMethodModel,
} from '../interfaces/entitymethod.interface';
import { EntityMethodService, entityMethodService } from '../services';
import { BaseController } from './base.controller';

export class EntityMethodController extends BaseController<
  EntityMethodModel,
  EntityMethodDto,
  EntityMethodDro
> {
  constructor(entityMethodService: EntityMethodService) {
    super(entityMethodService);
  }
}
export const entityMethodController = new EntityMethodController(entityMethodService);
