import { ToolExecuteResultRepository } from '../repositories/tool-execute-result.repository';
import { IToolExecuteResult } from '../interfaces/tool-execute-result.interface';
import { BaseService } from './base.service';

export class ToolExecuteResultService extends BaseService<any, IToolExecuteResult, IToolExecuteResult> {
  constructor(repository: ToolExecuteResultRepository) {
    super(repository);
  }
}
