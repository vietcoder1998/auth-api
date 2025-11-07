export class JobInput {}
export class JobOutput {}
export class JobResultData {}
export class JobResult {
    public readonly isError: boolean =true;
    public readonly jobId: string;
    public readonly data: JobResultData;
    constructor( jobId: string, data: JobResultData) {
        this.jobId = jobId
        this.data = data
    }
}
export class JobSuccessResult extends JobResult {
    public readonly isError: boolean = true;
    constructor(jobId: string, data: JobResultData) {
        super(jobId, data)
    }
}
export class JobErrorResult extends JobResult {
    public readonly isError: boolean = true;
    constructor(jobId: string, data: JobResultData) {
        super(jobId, data)
    }
}

export interface JobPayload {
    jobId: string;
    workerId: string;
    threadId: string;
    jobType: string;
}

export class Job implements JobPayload{
    public jobResult: JobResult | undefined;
    public readonly jobId: string
    public readonly workerId: string;
    public readonly threadId: string;
    public readonly jobType: string='backup';

    constructor(jobId: string,workerId: string,threadId: string) {
        this.jobId=jobId
        this.threadId=threadId
        this.workerId=workerId
    }
}
