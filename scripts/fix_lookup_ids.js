/**
 * Fix Lookup Tables ID types
 * Changes INT IDs to VARCHAR(36) to support Supabase UUIDs
 */

const mysql = require('mysql2/promise');

const dbConfig = {
    host: '151.106.124.161',
    user: 'u311693590_admin_isantuni',
    password: 'iSantuni2026',
    database: 'u311693590_isantuni_v2',
};

async function run() {
    const c = await mysql.createConnection(dbConfig);
    console.log('🛠 Fixing Lookup Table ID types...');

    const tables = [
        'program_status',
        'program_categories',
        'program_organizers',
        'program_types',
        'locations',
        'states'
    ];

    try {
        for (const table of tables) {
            console.log(`   ⚙️ Updating ${table}...`);
            // Check if column is already VARCHAR
            const [cols] = await c.query(`SHOW COLUMNS FROM \`${table}\` LIKE 'id'`);
            if (cols[0] && cols[0].Type.includes('int')) {
                // Drop primary key/auto_increment and change type
                await c.query(`ALTER TABLE \`${table}\` MODIFY \`id\` VARCHAR(36) NOT NULL`);
            }
        }
        console.log('✅ Schema fixed successfully!');
    } catch (err) {
        console.error('❌ Error fixing schema:', err.message);
    } finally {
        await c.end();
    }
}

run().catch(console.error);
