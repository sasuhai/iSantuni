import mysql from 'mysql2/promise';

// Debug: Check if env variables are loaded
console.log('DB Connection Check:', {
  host: process.env.DB_HOST ? 'Present' : 'MISSING',
  user: process.env.DB_USER ? 'Present' : 'MISSING',
  db: process.env.DB_NAME ? 'Present' : 'MISSING',
});

if (!process.env.DB_USER) {
  console.error('CRITICAL: DB_USER is not defined in environment variables!');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hcf_mualaf',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export default pool;

export async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database Query Error:', error);
    throw error;
  }
}
