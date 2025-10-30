import { ToolExplainResultRepository } from '../repositories/tool-explain-result.repository';
import { IToolExplainResult } from '../interfaces/tool-explain-result.interface';
import { BaseService } from './base.service';

export class ToolExplainResultService extends BaseService<any, IToolExplainResult, IToolExplainResult> {
  constructor(repository: ToolExplainResultRepository) {
    super(repository);
  }
}
