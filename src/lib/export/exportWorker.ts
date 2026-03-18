/// <reference lib="webworker" />

import JSZip from 'jszip';

interface ZipRequestMessage {
  jobId: number;
  files: Array<{ name: string; content: Blob | string }>;
}

interface ZipSuccessMessage {
  jobId: number;
  ok: true;
  blob: Blob;
}

interface ZipFailureMessage {
  jobId: number;
  ok: false;
  error: string;
}

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = async (event: MessageEvent<ZipRequestMessage>) => {
  const { jobId, files } = event.data;
  const zip = new JSZip();

  try {
    for (const file of files) {
      zip.file(file.name, file.content);
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const message: ZipSuccessMessage = { jobId, ok: true, blob };
    workerScope.postMessage(message);
  } catch (error) {
    const message: ZipFailureMessage = {
      jobId,
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown ZIP worker error.',
    };
    workerScope.postMessage(message);
  }
};

export {};
