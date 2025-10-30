import { ToolExecuteResultService } from '../services/tool-execute-result.service';
import { IToolExecuteResult } from '../interfaces/tool-execute-result.interface';
import { BaseController } from './base.controller';

export class ToolExecuteResultController extends BaseController<any, IToolExecuteResult, IToolExecuteResult> {
  constructor(service: ToolExecuteResultService) {
    super(service);
  }
}
