import { ToolCommandRepository } from '../repositories/tool-command.repository';
import { IToolCommand } from '../interfaces/tool-command.interface';
import { BaseService } from './base.service';

export class ToolCommandService extends BaseService<any, IToolCommand, IToolCommand> {
  constructor(repository: ToolCommandRepository) {
    super(repository);
  }
}
