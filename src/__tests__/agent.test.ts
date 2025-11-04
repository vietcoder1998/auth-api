import { GEMINI_API_KEY, GEMINI_API_URL } from '../env';
import { logger } from '../middlewares/logger.middle';
import { GeminiService } from '../services';

class ToolPlan {
  private _tool: Tool;
  private _step: string;
  private _index: number;
  public get step() {
    return this._step;
  }
  private get index() {
    return this._index;
  }
  public get tool() {
    return this._tool;
  }

  public constructor(tool: Tool, step: string, index: number) {
    this._tool = tool;
    this._step = step;
    this._index = index;
  }
}
// ExectionToolJob
class GeminiTestService {
  private apiUrl: string;
  private apiKey: string;
  private _geminiService: GeminiService;
  public get geminiService(): GeminiService {
    return this._geminiService;
  }
  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this._geminiService = new GeminiService({ apiUrl, apiKey, defaultModel: 'gemini-1.5-flash' });
  }
  public async generateToolPlan(toolPlanPrompt: string): Promise<ToolPlan[]> {
    const response: string = await this.fetchPrompt(toolPlanPrompt);
    const toolPlans: ToolPlan[] = JSON.parse(response).map(
      (toolPlan: ToolPlan, index: number) => new ToolPlan(toolPlan.tool, toolPlan.step, index),
    );
    return toolPlans;
  }
  async fetchPrompt(prompt: string) {
    const messages = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    return await GeminiService.callGemini(
      messages,
      {
        temperature: 0.2,
        maxTokens: 512,
        model: 'gemini-2.5-flash',
      },
      {
        apiUrl: GEMINI_API_URL,
        apiKey: GEMINI_API_KEY,
      },
      this.apiKey,
    ).then((res) => {
      if (res && res.choices && res.choices.length > 0) {
        return res.choices[0].message.content;
      }
      throw new Error('No response from Gemini API');
    });
  }
}

class ToolResult {
  private _message: string = 'unknown';
  public get message() {
    return this._message;
  }
  private _data: Record<string, any>;
  public get data(): Record<string, any> {
    return this._data;
  }
  private _isSuccess: boolean = false;
  public get isSuccess(): boolean {
    return this._isSuccess;
  }
  private _isEnd: boolean = false;
  public constructor(
    data: Record<string, any>,
    isSuccess: boolean,
    message: string,
    isEnd: boolean,
  ) {
    this._data = data;
    this._isSuccess = isSuccess;
    this._message = message;
    this._isEnd = isEnd;
  }
  public get isEnd(): boolean {
    return this._isEnd;
  }
  public toJSON(): Record<string, string | object | boolean> {
    const jsonData: Record<string, string | object | boolean> = {
      message: this.message,
      data: this.data,
      isSuccess: this.isSuccess,
      isEnd: this.isEnd,
    };

    return jsonData;
  }

  public get toolPlanData(): ToolPlan[] {
    return this.data.toolPlans;
  }
}

class Tool {
  public get type(): string {
    return 'Tool';
  }
  private _name: string;
  private get name(): string {
    return this._name;
  }
  public constructor(name: string) {
    this._name = name;
  }
  public async execute(
    toolParameter: ToolParameter,
    plans: ToolPlan[],
    index: number,
  ): Promise<ToolResult> {
    if (index === plans.length - 1) {
      const lastResult: ToolResult = new ToolResult({ index }, true, 'Process has ended', true);

      return lastResult;
    }

    const currentStep: ToolPlan = plans[index];
    const nextTool: Tool = currentStep.tool;

    try {
      const actionResult: Record<string, any> = {};
      const newToolParamester: ToolParameter = {
        ...toolParameter,
        ...actionResult,
      };
      const nextResult: ToolResult = await nextTool.execute(newToolParamester, plans, index++);

      return nextResult;
    } catch (error) {
      const errorResult: ToolResult = new ToolResult(
        error as Record<string, any>,
        false,
        'Error on execute' + index + JSON.stringify(error),
        true,
      );
      const nextErrorParamester: ToolParameter = {
        ...toolParameter,
        [this.name]: errorResult,
      };

      return errorResult;
    }
  }
}

class ToolContext {
  private toolNames =  [
      'update_permission',
      'create_permission',
      'delete_permission',
      'create_user',
      'update_user',
    ] as string[];
  private params = {
    userId: 1,
    userName: 'test user',
    permission: 'read_write',
    role: 'admin',
  };
  private goals: string[] = [ 
    'If do not role, create new role',
    'If role existed, create',
    'Update user with return only values as a string of json',
  ];
  constructor(toolNames: string[] = []) {
    if (toolNames.length) {
      this.toolNames = toolNames;
    }
  }
  private _context: Record<string, any> = {
    params: {} as Record<string, any>,
    prompts: [
      `From tools: ${JSON.stringify(this.toolNames)}`,
      `With params: ${JSON.stringify(this.params)}`,
      `Generate steps with format: [{step: [command.name], toolName: [tool] }] }`,
      `With goals: ${JSON.stringify(this.goals)}`,
    ],
  };
  public get prompts(): string[] {
    return this._context.prompts;
  }
  public get context() {
    return this._context;
  }
  public get goalContext(): string {
    return this.goals.join(' ');
  }
  public get contextPrompt(): string {
    return this.context.prompts.join('');
  }
  public get fullPrompt(): string {
    return [this.goalContext, this.contextPrompt].join('/n');
  }
}

class ExecuteTool extends Tool {
  public override async execute(
    parameter: ToolParameter,
    plans: ToolPlan[],
    index: number,
  ): Promise<ToolResult> {
    // Fill the context
    return {} as ToolResult;
  }
}

interface ToolParameter extends Object {
  toolContext?: ToolContext;
  prompt?: string;
  toolPlans?: ToolPlan[];
}

class PlanTool extends Tool {
  private _type: string = 'PlanTool';
  public get type(): string {
    return this._type;
  }
  private _geminiService: GeminiTestService;
  public get geminiService(): GeminiTestService {
    return this._geminiService;
  }

  public constructor(name: string, geminiService: GeminiTestService) {
    super(name);
    this._geminiService = geminiService;
  }
  public override async execute(
    toolParameter: ToolParameter,
    plans: ToolPlan[],
    index: number,
  ): Promise<ToolResult> {
    const toolContext: ToolContext | undefined = toolParameter?.toolContext;
    const toolParameterPrompt: string = toolParameter.prompt ?? '';
    const toolPlans: ToolPlan[] = await this.geminiService.generateToolPlan(toolParameterPrompt);
    const toolResultData: ToolParameter = {
      toolContext,
      toolPlans,
    };
    const toolResult: ToolResult = new ToolResult(
      toolResultData,
      true,
      'Plan tool successfully',
      true,
    );

    return toolResult;
  }
}
class ExplainTool extends Tool {}

class Agent {
  private _tools: Tool[];
  private _toolContext: ToolContext;
  public constructor(tools: Tool[], toolContext: ToolContext) {
    this._tools = tools;
    this._toolContext = toolContext;
  }

  private get planTool(): PlanTool | undefined {
    return this._tools.find((tool: Tool) => tool.type === 'PlanTool') as unknown as PlanTool;
  }
  private get toolContext(): ToolContext {
    return this._toolContext;
  }
  private get explainTool(): ExplainTool | undefined {
    return this._tools.find((tool: Tool) => tool.type === 'ExplainTool');
  }
  public async executeTools(): Promise<ToolResult> {
    const toolPrompt = this.toolContext.fullPrompt;
    const excutePlanToolParameter: ToolParameter = {
      prompt: toolPrompt,
    };
    let index: number = 0;

    if (!this.planTool) {
      throw new Error('Tool Plan is not found');
    }
    const planToolResult: ToolResult = await this.planTool.execute(excutePlanToolParameter, [], 0);
    const toolPlans: ToolPlan[] = planToolResult.toolPlanData;

    if (!toolPlans.length) {
      throw new Error('Error on find a plan');
    }
    const firstExecuteTool: ExecuteTool = toolPlans[0].tool;
    const firstExecuteToolParameter: ToolParameter = {};

    const toolResult: ToolResult = await firstExecuteTool.execute(
      firstExecuteToolParameter,
      toolPlans,
      index,
    );

    return toolResult;
  }
}

describe('Auth API', () => {
  it('should return ok on root', async () => {
    const executeTools: Tool[] = [
      'update_permission',
      'create_permission',
      'delete_permission',
      'create_user',
      'update_user',
    ].map((toolName: string) => new ExecuteTool(toolName));
    const tools: Tool[] = [
      new PlanTool('plan_tool', new GeminiTestService(GEMINI_API_URL, GEMINI_API_URL)),
      ...executeTools,
      new ExplainTool('explain_tool'),
    ];

    const agent: Agent = new Agent(tools, new ToolContext());
    const result: ToolResult = await agent.executeTools();

    logger.info('Tool execution result: %o', result.toJSON());
    expect(result.isSuccess).toBe(true);
  }, 30000);
});
