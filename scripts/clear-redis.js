const { Redis } = require('@upstash/redis');
require('dotenv').config();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function clearRedis() {
  console.log('Connecting to Redis...');
  try {
    console.log('Flushing all data...');
    await redis.flushall();
    console.log('✅ Redis database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing Redis:', error);
  }
}

clearRedis();
