
const mysql = require('mysql2');
const pool = mysql.createPool({
    host: '151.106.124.161',
    user: 'u311693590_admin_isantuni',
    password: 'iSantuni2026',
    database: 'u311693590_isantuni_v2',
    port: 3306
}).promise();

async function check() {
    try {
        const [rows] = await pool.query('SHOW CREATE TABLE other_kpis');
        console.log(rows[0]['Create Table']);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}
check();
