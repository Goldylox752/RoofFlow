const sessions = new Map();

/* ===============================
   CREATE SESSION
=============================== */
const createSession = (jti, data) => {
  sessions.set(jti, {
    ...data,
    createdAt: Date.now(),
  });
};

/* ===============================
   GET SESSION
=============================== */
const getSession = (jti) => {
  return sessions.get(jti);
};

/* ===============================
   DELETE SESSION (LOGOUT)
=============================== */
const deleteSession = (jti) => {
  sessions.delete(jti);
};

/* ===============================
   REVOKE ALL USER SESSIONS
=============================== */
const revokeUserSessions = (userId) => {
  for (const [jti, session] of sessions.entries()) {
    if (session.userId === userId) {
      sessions.delete(jti);
    }
  }
};

module.exports = {
  createSession,
  getSession,
  deleteSession,
  revokeUserSessions,
};