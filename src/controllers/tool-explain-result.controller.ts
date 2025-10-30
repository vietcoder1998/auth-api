import { ToolExplainResultService } from '../services/tool-explain-result.service';
import { IToolExplainResult } from '../interfaces/tool-explain-result.interface';
import { BaseController } from './base.controller';

export class ToolExplainResultController extends BaseController<any, IToolExplainResult, IToolExplainResult> {
  constructor(service: ToolExplainResultService) {
    super(service);
  }
}
