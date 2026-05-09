module.exports = function errorHandler(err, req, res, next) {
  console.error("API Error:", err);

  res.status(500).json({
    success: false,
    error: err.message || "Server error",
  });
};