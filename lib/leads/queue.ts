type Lead = any;

const leadQueue: Lead[] = [];

/**
 * ADD LEAD TO QUEUE
 */
export function enqueueLead(data: Lead) {
  leadQueue.push({
    ...data,
    queuedAt: Date.now(),
  });
}

/**
 * GET ALL QUEUED LEADS
 */
export function getQueuedLeads() {
  return leadQueue;
}

/**
 * CLEAR QUEUE (useful for workers)
 */
export function clearQueue() {
  leadQueue.length = 0;
}