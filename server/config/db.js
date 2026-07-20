import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️ WARNING: DATABASE_URL is not set in environment variables. Falling back to local default.');
}

const isRemote = connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString: connectionString || 'postgresql://localhost:5432/trsv',
  ssl: isRemote ? { rejectUnauthorized: false } : false,
  max: 20, // Max 20 connections in pool
  idleTimeoutMillis: 10000, // Close idle clients after 10s to prevent stale sockets from serverless DBs like Neon
  connectionTimeoutMillis: 15000 // 15s timeout for cold start waking
});

pool.on('connect', () => {
  console.log('🔌 [Database] PostgreSQL connection pool client connected.');
});

pool.on('error', (err) => {
  console.error('🚨 [Database] Unexpected error on idle database client:', err.message);
});

// Helper for transient network error detection
const isTransientError = (err) => {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = (err.code || '').toUpperCase();
  return (
    msg.includes('connection terminated') ||
    msg.includes('connection timeout') ||
    msg.includes('socket closed') ||
    msg.includes('econnreset') ||
    msg.includes('epipe') ||
    code === '57P01' || // admin_shutdown
    code === '57P02' || // crash_shutdown
    code === '57P03'    // cannot_connect_now
  );
};

export const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (isTransientError(err)) {
      console.warn('⚠️ [Database] Transient connection drop detected. Retrying query in 300ms...');
      await new Promise(resolve => setTimeout(resolve, 300));
      return await pool.query(text, params);
    }
    throw err;
  }
};

export default pool;
