
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
        const sql = "SELECT * FROM other_kpis WHERE deletedAt IS NULL AND `category` = ? ORDER BY createdAt DESC";
        const params = ['rh_aktif'];
        const [results] = await pool.query(sql, params);
        console.log(`Success! Found ${results.length} rows.`);

        const parsed = results.map((row, i) => {
            try {
                return {
                    ...row,
                    data: row.data ? (typeof row.data === 'string' ? JSON.parse(row.data) : row.data) : {}
                };
            } catch (e) {
                console.log(`❌ Error parsing JSON at row ${i} (ID: ${row.id}):`, e.message);
                return row;
            }
        });
        console.log('All rows processed.');
    } catch (err) {
        console.error('SQL Error:', err.message);
    } finally {
        await pool.end();
    }
}
check();
