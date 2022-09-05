const jobs = new Set<() => void>();
let process = false;

export const queueJob = (job: () => void) => {
  if (!jobs.has(job)) {
    jobs.add(job);
  }
  Promise.resolve().then(flushQueue);
};

export const flushQueue = () => {
  if (!process) {
    process = true;
    const all = [...jobs.values()].slice(0);
    jobs.clear();
    for (const job of all) {
      job();
    }
    process = false;
  }
};
