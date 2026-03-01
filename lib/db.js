import mysql from 'mysql2/promise';

// NOTE: Hardcoded for Hostinger connection compatibility
const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'u311693590_admin_isantuni',
  password: 'iSantuni2026',
  database: 'u311693590_isantuni_v2',
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
