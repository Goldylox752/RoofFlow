const express = require("express");
const router = express.Router();

const {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
} = require("../../lib/jwt");

const { deleteSession, createSession } = require("../../lib/sessionStore");

router.post("/", async (req, res) => {
  try {
    const refreshToken = req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "missing_refresh_token",
      });
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded?.jti || !decoded?.id) {
      return res.status(401).json({
        success: false,
        error: "invalid_refresh_token",
      });
    }

    // revoke old session
    await deleteSession(decoded.jti);

    const newPayload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      plan: decoded.plan,
    };

    // create new session id (important rotation safety)
    const newJti = crypto.randomUUID?.() || String(Date.now());

    const accessToken = signAccessToken({ ...newPayload, jti: newJti });
    const newRefreshToken = signRefreshToken({ ...newPayload, jti: newJti });

    await createSession(newJti, {
      userId: decoded.id,
      email: decoded.email,
    });

    return res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "invalid_refresh_token",
    });
  }
});

module.exports = router;