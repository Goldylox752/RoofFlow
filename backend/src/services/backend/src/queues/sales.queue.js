const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis(process.env.REDIS_URL);

const salesQueue = new Queue("sales", {
  connection,
});

module.exports = { salesQueue };