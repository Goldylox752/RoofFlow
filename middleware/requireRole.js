module.exports = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

    next();
  };
};