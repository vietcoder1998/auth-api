import { ThreadWorker } from './thread.worker';
import {Job, JobSuccessResult, JobErrorResult} from './job.worker'

export class Thread {
    private readonly threadId: string;
    public readonly jobList: Job[] = []
    private jobSuccessList: JobSuccessResult[] = []
    private jobErrorList: JobErrorResult[] = []
    private readonly threadWorkers: ThreadWorker[] = []

    public constructor(threadId: string, jobList: Job[], threadWorkers: ThreadWorker[]) {
        this.threadId = threadId
        this.jobList = jobList
        this.threadWorkers = threadWorkers
    }
}

export class Factory {
    private readonly thread: Thread

    public constructor(thread: Thread) {
        this.thread = thread
    }
}