import type { ExportFile } from './types';

interface QueueResponse {
  jobId: number;
  ok: boolean;
  blob?: Blob;
  error?: string;
}

let jobCounter = 0;
let pendingQueue = Promise.resolve();
let exportWorker: Worker | null = null;

const getWorker = () => {
  if (!exportWorker) {
    exportWorker = new Worker(new URL('./exportWorker.ts', import.meta.url), {
      type: 'module',
    });
  }

  return exportWorker;
};

const runZipJob = (files: ExportFile[]) =>
  new Promise<Blob>((resolve, reject) => {
    const worker = getWorker();
    const jobId = ++jobCounter;

    const handleMessage = (event: MessageEvent<QueueResponse>) => {
      if (event.data.jobId !== jobId) return;
      worker.removeEventListener('message', handleMessage);

      if (event.data.ok && event.data.blob) {
        resolve(event.data.blob);
      } else {
        reject(new Error(event.data.error ?? 'Failed to create ZIP archive.'));
      }
    };

    worker.addEventListener('message', handleMessage);
    worker.postMessage({ jobId, files });
  });

export const enqueueZipCreation = (files: ExportFile[]) => {
  const queuedJob = pendingQueue.then(() => runZipJob(files));
  pendingQueue = queuedJob.then(() => undefined, () => undefined);
  return queuedJob;
};
