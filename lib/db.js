import mysql from 'mysql2/promise';

// NOTE: Using hardcoded values for Hostinger environment compatibility
const pool = mysql.createPool({
  host: 'localhost',
  user: 'u311693590_sasuhai',
  password: 'iSantuni2026',
  database: 'u311693590_isantuni',
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
