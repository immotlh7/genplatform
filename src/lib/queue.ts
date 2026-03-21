import { LogRepo, NotificationRepo } from './repositories';

export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

export interface Job {
  id: string;
  type: string;
  payload: any;
  status: JobStatus;
  progress: number;
  stage: string;
  result: any | null;
  error: string | null;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
}

const jobs = new Map<string, Job>();

const sseClients = new Set<(data: string) => void>();

export function subscribeSSE(send: (data: string) => void) {
  sseClients.add(send);
  return () => sseClients.delete(send);
}

function broadcast(event: string, data: any) {
  const msg = `data: ${JSON.stringify({ event, ...data })}\n\n`;
  sseClients.forEach(send => { try { send(msg); } catch {} });
}

function createJob(type: string, payload: any): Job {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const job: Job = {
    id, type, payload,
    status: 'queued',
    progress: 0,
    stage: 'Queued...',
    result: null,
    error: null,
    createdAt: Date.now(),
    startedAt: null,
    finishedAt: null,
  };
  jobs.set(id, job);
  broadcast('job_queued', { jobId: id, type });
  return job;
}

function updateJob(id: string, patch: Partial<Job>) {
  const job = jobs.get(id);
  if (!job) return;
  Object.assign(job, patch);
  broadcast('job_update', {
    jobId: id,
    status: job.status,
    progress: job.progress,
    stage: job.stage,
    result: job.result,
    error: job.error,
  });
}

export function getJob(id: string): Job | null {
  return jobs.get(id) || null;
}

export function getJobsByType(type: string): Job[] {
  return Array.from(jobs.values()).filter(j => j.type === type);
}

const HANDLERS = new Map<string, (job: Job, update: (p: number, s: string) => void) => Promise<any>>();

export function registerHandler(type: string, handler: (job: Job, update: (p: number, s: string) => void) => Promise<any>) {
  HANDLERS.set(type, handler);
}

export function enqueue(type: string, payload: any): Job {
  const job = createJob(type, payload);
  setImmediate(() => processJob(job.id));
  return job;
}

async function processJob(id: string) {
  const job = jobs.get(id);
  if (!job) return;

  const handler = HANDLERS.get(job.type);
  if (!handler) {
    updateJob(id, { status: 'failed', error: `No handler for job type: ${job.type}`, finishedAt: Date.now() });
    return;
  }

  updateJob(id, { status: 'running', startedAt: Date.now(), stage: 'Starting...' });

  const update = (progress: number, stage: string) => {
    updateJob(id, { progress, stage });
    LogRepo.add(`[${job.type}] ${stage}`, 'info', job.payload?.projectId);
  };

  try {
    const result = await handler(job, update);
    updateJob(id, {
      status: 'done',
      progress: 100,
      stage: 'Complete',
      result,
      finishedAt: Date.now(),
    });

    NotificationRepo.create({
      type: `${job.type}_complete`,
      message: `${job.type} completed successfully`,
      projectId: job.payload?.projectId || null,
      link: job.payload?.redirectTo || null,
    });

    broadcast('job_done', { jobId: id, type: job.type, result });

  } catch (err: any) {
    updateJob(id, {
      status: 'failed',
      stage: 'Failed',
      error: err.message || 'Unknown error',
      finishedAt: Date.now(),
    });

    LogRepo.add(`[${job.type}] FAILED: ${err.message}`, 'error', job.payload?.projectId);
    broadcast('job_failed', { jobId: id, type: job.type, error: err.message });
  }
}
