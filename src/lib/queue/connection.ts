import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as {
  campaignRedisConnection?: IORedis;
};

export function getRedisConnection(): IORedis {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL belum dikonfigurasi");
  }

  const connection =
    globalForRedis.campaignRedisConnection ??
    new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForRedis.campaignRedisConnection = connection;
  }

  return connection;
}
