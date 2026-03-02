
const mysql = require('mysql2');
const pool = mysql.createPool({
    host: '151.106.124.161',
    user: 'u311693590_admin_isantuni',
    password: 'HIDDEN_PASSWORD',
    database: 'u311693590_isantuni_v2',
    port: 3306
}).promise();

async function check() {
    try {
        const [columns] = await pool.query('SHOW COLUMNS FROM other_kpis');
        console.log('Columns in other_kpis table:');
        columns.forEach(c => console.log(`- ${c.Field} (${c.Type})`));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}
check();
