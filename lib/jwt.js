const jwt = require("jsonwebtoken");

const getSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET");
  }
  return process.env.JWT_SECRET;
};

const signToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, getSecret(), { expiresIn });
};

const verifyToken = (token) => {
  return jwt.verify(token, getSecret());
};

module.exports = {
  signToken,
  verifyToken,
};