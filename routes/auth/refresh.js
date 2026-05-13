const express = require("express");
const router = express.Router();

const { verifyRefreshToken, signAccessToken, signRefreshToken } = require("../../lib/jwt");
const { deleteSession, createSession } = require("../../lib/sessionStore");

router.post("/", (req, res) => {
  try {
    const { refreshToken } = req.body;

    const decoded = verifyRefreshToken(refreshToken);

    // 🔥 revoke old session
    deleteSession(decoded.jti);

    // 🔥 create new session
    const newAccess = signAccessToken(decoded);
    const newRefresh = signRefreshToken(decoded);

    createSession(decoded.jti, {
      userId: decoded.id,
      email: decoded.email,
    });

    return res.json({
      success: true,
      accessToken: newAccess,
      refreshToken: newRefresh,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Invalid refresh token",
    });
  }
});

module.exports = router;