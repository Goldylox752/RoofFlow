const sessions = new Map();

/* ===============================
   CREATE SESSION
=============================== */
const createSession = (jti, data) => {
  sessions.set(jti, {
    ...data,
    createdAt: Date.now(),
    lastSeen: Date.now(),
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 min safety window
    revoked: false,
  });
};

/* ===============================
   GET SESSION (SAFE)
=============================== */
const getSession = (jti) => {
  const session = sessions.get(jti);

  if (!session) return null;

  // expired
  if (Date.now() > session.expiresAt) {
    sessions.delete(jti);
    return null;
  }

  // revoked
  if (session.revoked) return null;

  // update activity
  session.lastSeen = Date.now();

  return session;
};

/* ===============================
   DELETE SESSION (LOGOUT)
=============================== */
const deleteSession = (jti) => {
  return sessions.delete(jti);
};

/* ===============================
   REVOKE USER SESSIONS
=============================== */
const revokeUserSessions = (userId) => {
  for (const [jti, session] of sessions.entries()) {
    if (session.userId === userId) {
      session.revoked = true;
    }
  }
};

module.exports = {
  createSession,
  getSession,
  deleteSession,
  revokeUserSessions,
};