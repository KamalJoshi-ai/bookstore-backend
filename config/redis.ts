import Redis from "ioredis";

export const redisClient = new Redis(process.env.REDIS_URL!);

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("error", (err) => {
  console.error(err);
});

export default redisClient;