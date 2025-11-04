import request from 'supertest';

class ToolPlan {
	private _tool: Tool;
	private _step: string;
	private _index: number;
	public get step(){return this._step}
	private get index(){return this._index}
	public get tool() {
		return this._tool	
	}

	public constructor(tool: Tool, step: string, index: number) {
		this._tool = tool
		this._step = step
		this._index = index
	}
}
// ExectionToolJob
class GeminiService {
	private apiUrl: string;
	private apiKey:	string;
	constructor(apiUrl: string, apiKey: string){this.apiUrl=apiUrl,this.apiKey=apiKey};
	public async generateToolPlan(toolPlanPrompt: string): Promise<ToolPlan[]>{
    const response: string=await this.fetchPrompt(toolPlanPrompt);
    const toolPlans: ToolPlan[]=JSON.parse(response).map((toolPlan: ToolPlan, index:number) => new ToolPlan(toolPlan.tool, toolPlan.step, index));
    return toolPlans;
  }
  async fetchPrompt(prompt: string) {
    return prompt
  }
}
class ToolResult {
	private _message: string = "unknown";
	public get message() {
		return this._message;
	}
	private _data: Record<string, any>;
	public get data(): Record<string, any>{
		return this._data;	
	}
	private _isSuccess: boolean = false
	public get isSuccess(): boolean {
		return this._isSuccess;
	}
	private _isEnd: boolean = false
	public constructor(data: Record<string, any>,  isSuccess: boolean, message: string, isEnd: boolean){
		this._data= data;
		this._isSuccess = isSuccess;
		this._message = message;
		this._isEnd = isEnd;
	}
	public get isEnd(): boolean {
		return this._isEnd
	}
	public toJSON(): Record<string, string | object | boolean>  {
		const jsonData: Record<string, string | object | boolean> =  {
			message: this.message,
			data: this.data,
			isSuccess: this.isSuccess,
      isEnd: this.isEnd
		};

		return jsonData;
	}

  public get toolPlanData(): ToolPlan[] {
    return this.data.toolPlans;
  }
}

class Tool {	
	private _name: string;
  private _type: string = "type";
  public get type(): string {
    return this._type
  }
	private get name(): string {
		return this._name
	}
	public constructor(name: string){
		this._name = name
	}
	public async execute(toolParameter: ToolParameter, plans: ToolPlan[], index: number): Promise<ToolResult>{
		if (index === plans.length - 1) {
			const lastResult: ToolResult = new ToolResult({ index },true,"Process has ended",true)
			
			return lastResult
		}

		const currentStep: ToolPlan = plans[index]
		const nextTool: Tool = currentStep.tool

		try { 
			const actionResult: Record<string, any> = {}
			const newToolParamester: ToolParameter = {
				...toolParameter,
				...actionResult
			}
			const nextResult: ToolResult = await nextTool.execute(newToolParamester, plans, index++)
			
			return nextResult
		} catch (error) {
			const errorResult: ToolResult = new ToolResult(error as Record<string, any>, false, "Error on execute" + index + JSON.stringify(error), true)
			const nextErrorParamester: ToolParameter =  {
				...toolParameter,
				[this.name]: errorResult
			}

			return errorResult
		}
	}
}

class ToolContext {
	private _context: Record<string, any> = {
		params: {} as Record<string, any>,
		toolNames: ['update_permission','create_permission', 'delete_permission', 'create_user', 'update_user'] as string[],
		goals: [
			"If do not role, create new role",
			"If role existed, create",
			"Update user with ",
			this.context.prompt
		],
		prompt: [
			`From tools: ${JSON.stringify(this.context.toolNames)}`,
			`With prompt ${this.context.prompt}`,
			`With params ${this.context.params}`,
			`Generate steps with format: [{step: [command.name], toolName: [tool] }] }`,
			`With goals ${this.goalContext}`
		]
	}
	public get context() {
		return this._context
	}
	public get goalContext(): string {return this.context.goal.join(" ")}
	public get contextPrompt(): string{return this.context.prompt.join("")}
	public get fullPrompt(): string{return [this.goalContext, this.contextPrompt].join("/n")}
}

class ExecuteTool extends Tool{
	public override async execute(parameter: ToolParameter, plans: ToolPlan[], index: number): Promise<ToolResult>{// Fill the context
    
    return {} as ToolResult
  }
}

interface ToolParameter extends Object {
	toolContext?: ToolContext;
	prompt?: string;
	toolPlans?: ToolPlan[];
}

class PlanTool extends Tool {
	private _geminiService: GeminiService;
  public get geminiService(): GeminiService {
    return this._geminiService
  }

  public constructor(name: string, geminiService: GeminiService){
    super(name)
    this._geminiService = geminiService
  }
	public override async execute(toolParameter: ToolParameter, plans: ToolPlan[],index: number): Promise<ToolResult>{
		const toolContext: ToolContext | undefined = toolParameter?.toolContext;
		const toolParameterPrompt: string = toolParameter.prompt ?? "";
		const toolPlans: ToolPlan[] = await this.geminiService.generateToolPlan(toolParameterPrompt)
		const toolResultData: ToolParameter = {
			toolContext,
			toolPlans,
		};
		const toolResult: ToolResult = new ToolResult(toolResultData, true, "Plan tool successfully",true)
		
		return toolResult
	}
}
class ExplainTool extends Tool {}

class Agent {
	private _tools: Tool[];
	private _toolContext: ToolContext
	public constructor(tools: Tool[], toolContext: ToolContext) {
		this._tools = tools
		this._toolContext = toolContext
	}
	
	private get planTool(): PlanTool| undefined {
		return this._tools.find((tool: Tool) => tool.type === "PlanTool") as unknown  as PlanTool
	}
	private get toolContext(): ToolContext {
		return this._toolContext
	}
	private get explainTool(): ExplainTool | undefined{return this._tools.find((tool: Tool) => tool.type === "ExplainTool")}
	public async executeTools(): Promise<ToolResult>{
		const toolPrompt = this.toolContext.fullPrompt
		const excutePlanToolParameter: ToolParameter = {
			prompt: toolPrompt,
		} 
		let index: number = 0;

    if (!this.planTool) {
      throw new Error("Tool Plan is not found")
    }
		const planToolResult: ToolResult = await this.planTool.execute(excutePlanToolParameter,[],0)
    const toolPlans: ToolPlan[] = planToolResult.toolPlanData;

		if (!toolPlans.length){throw new Error("Error on find a plan")}
		const firstExecuteTool: ExecuteTool = toolPlans[0].tool;
		const firstExecuteToolParameter: ToolParameter = {}
		
		const toolResult: ToolResult = await firstExecuteTool.execute(firstExecuteToolParameter, toolPlans, index)

		return toolResult
	}
}

describe('Auth API', () => {
  it('should return ok on root', async () => {
    
  });
});
