import mysql from 'mysql2/promise';

// NOTE: Hardcoded for Hostinger connection compatibility
// Enhanced for both local development and Hostinger production
const DB_CONFIG = {
  host: process.env.DB_HOST || '151.106.124.161', // Fallback to remote IP if not set
  user: process.env.DB_USER || 'u311693590_admin_isantuni',
  password: process.env.DB_PASSWORD || 'iSantuni2026',
  database: process.env.DB_NAME || 'u311693590_isantuni_v2',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

const pool = mysql.createPool(DB_CONFIG);

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
