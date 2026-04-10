const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.on("connect", () => console.log("Redis Client Connected"));

// Connect asynchronously (we don't strictly await it here to avoid blocking app start, 
// modern redis client queues commands until connected)
redisClient.connect().catch(console.error);

module.exports = redisClient;
