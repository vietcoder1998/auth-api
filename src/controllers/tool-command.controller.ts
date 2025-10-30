import { ToolCommandService } from '../services/tool-command.service';
import { IToolCommand } from '../interfaces/tool-command.interface';
import { BaseController } from './base.controller';

export class ToolCommandController extends BaseController<any, IToolCommand, IToolCommand> {
  constructor(service: ToolCommandService) {
    super(service);
  }
}
