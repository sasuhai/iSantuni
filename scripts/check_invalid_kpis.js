
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
        const [rows] = await pool.query('SELECT id, data FROM other_kpis');
        console.log(`Checking ${rows.length} rows for invalid JSON...`);
        for (const row of rows) {
            if (row.data && typeof row.data === 'string') {
                try {
                    JSON.parse(row.data);
                } catch (e) {
                    console.log(`❌ Invalid JSON at ID ${row.id}: ${row.data.substring(0, 50)}...`);
                }
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}
check();
