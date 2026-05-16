const db = {
  users: new Map(),
  leads: new Map(),
  funnels: new Map(),
  calls: new Map(),
  queue: [],
};

module.exports = db;