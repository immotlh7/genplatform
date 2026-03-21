'use client';
import { useEffect, useState } from 'react';

interface Job {
  id: string;
  type: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  progress: number;
  stage: string;
  result: any;
  error: string | null;
}

interface JobProgressProps {
  jobId: string;
  onDone?: (result: any) => void;
  onFailed?: (error: string) => void;
  labels?: {
    queued?: string;
    running?: string;
    done?: string;
    failed?: string;
  };
}

export function JobProgress({ jobId, onDone, onFailed, labels = {} }: JobProgressProps) {
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) return;
        const data: Job = await res.json();
        setJob(data);

        if (data.status === 'done') {
          onDone?.(data.result);
          return;
        }
        if (data.status === 'failed') {
          onFailed?.(data.error || 'Unknown error');
          return;
        }
        setTimeout(poll, 1000);
      } catch {
        setTimeout(poll, 2000);
      }
    };

    poll();
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    const es = new EventSource('/api/events');

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.jobId !== jobId) return;

        if (event.event === 'job_update') {
          setJob(prev => prev ? { ...prev, ...event } : null);
        }
        if (event.event === 'job_done') {
          setJob(prev => prev ? { ...prev, status: 'done', progress: 100, result: event.result } : null);
          onDone?.(event.result);
        }
        if (event.event === 'job_failed') {
          setJob(prev => prev ? { ...prev, status: 'failed', error: event.error } : null);
          onFailed?.(event.error);
        }
      } catch {}
    };

    return () => es.close();
  }, [jobId]);

  if (!job) return (
    <div style={{ padding: 12, fontSize: 12, color: 'var(--color-text-secondary)' }}>
      Loading job status...
    </div>
  );

  const statusColor = job.status === 'done' ? '#1D9E75'
    : job.status === 'failed' ? '#E24B4A'
    : job.status === 'running' ? '#185FA5'
    : 'var(--color-text-secondary)';

  return (
    <div style={{ padding: 16, borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: statusColor }}>
          {job.status === 'queued'  ? (labels.queued  || 'Queued...')   :
           job.status === 'running' ? (labels.running || job.stage)     :
           job.status === 'done'    ? (labels.done    || 'Complete')    :
                                      (labels.failed  || 'Failed')}
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {job.progress}%
        </span>
      </div>

      <div style={{ height: 4, borderRadius: 2, background: 'var(--color-border-tertiary)', overflow: 'hidden', marginBottom: 8 }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: statusColor,
          width: `${job.progress}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {job.status === 'running' && (
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
          {job.stage}
        </div>
      )}

      {job.status === 'failed' && job.error && (
        <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 6 }}>
          Error: {job.error}
        </div>
      )}
    </div>
  );
}
