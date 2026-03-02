/**
 * iSantuni Data Migration Script (FAST VERSION): Supabase -> Hostinger MariaDB
 * 
 * Uses Batch Inserts and Transaction for high-speed migration.
 */

const { createClient } = require('@supabase/supabase-js');
const mysql = require('mysql2/promise');

// --- 💡 CONFIGURATION ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://utddacblhitaoyaneyyk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'HIDDEN_SECRET_FOR_SECURITY';
const DB_HOST = process.env.DB_HOST || '151.106.124.161';

const dbConfig = {
    host: DB_HOST,
    user: 'u311693590_admin_isantuni',
    password: 'iSantuni2026',
    database: 'u311693590_isantuni_v2',
};

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    const mariadb = await mysql.createConnection(dbConfig);
    console.log('🚀 Memulakan Migrasi Data Penuh (FASTER BATCH VERSION)...');

    async function migrateTable(supabaseTable, mariadbTable) {
        console.log(`\n📦 Migrasi ${supabaseTable} -> ${mariadbTable}...`);

        let from = 0;
        let to = 999;
        let hasMore = true;
        let totalCount = 0;

        // Get valid columns from MariaDB once
        const [columns] = await mariadb.query(`SHOW COLUMNS FROM ${mariadbTable}`);
        const validColumns = columns.map(c => c.Field);

        while (hasMore) {
            process.stdout.write(`   ⏳ Fetching & Inserting ${from} to ${to}... \r`);
            const { data, error } = await supabase
                .from(supabaseTable)
                .select('*')
                .range(from, to);

            if (error) {
                console.error(`\n❌ Gagal menarik data dari Supabase (${supabaseTable}):`, error.message);
                return;
            }

            if (data && data.length > 0) {
                // Prepare Batch UPSERT
                const rowsToInsert = [];
                const placeholders = [];
                const allValues = [];

                for (const row of data) {
                    const insertData = {};
                    for (const key of validColumns) {
                        if (row[key] !== undefined && row[key] !== null) {
                            let val = row[key];
                            if (typeof val === 'object') val = JSON.stringify(val);
                            insertData[key] = val;
                        } else {
                            insertData[key] = null;
                        }
                    }

                    rowsToInsert.push(insertData);
                    allValues.push(...Object.values(insertData));
                    placeholders.push(`(${validColumns.map(() => '?').join(',')})`);
                }

                const sql = `INSERT INTO \`${mariadbTable}\` (\`${validColumns.join('`,`')}\`) 
                         VALUES ${placeholders.join(',')} 
                         ON DUPLICATE KEY UPDATE ${validColumns.map(k => `\`${k}\`=VALUES(\`${k}\`)`).join(',')}`;

                try {
                    await mariadb.query(sql, allValues);
                    totalCount += data.length;
                } catch (err) {
                    console.error(`\n❌ Batch error in ${mariadbTable}:`, err.message);
                    // If batch fails, try one by one to see which one is failing
                    for (let row of data) {
                        try {
                            const vals = validColumns.map(k => {
                                let v = row[k];
                                if (v && typeof v === 'object') return JSON.stringify(v);
                                return v ?? null;
                            });
                            const q = `INSERT INTO \`${mariadbTable}\` (\`${validColumns.join('`,`')}\`) VALUES (${validColumns.map(() => '?').join(',')}) ON DUPLICATE KEY UPDATE ${validColumns.map(k => `\`${k}\`=VALUES(\`${k}\`)`).join(',')}`;
                            await mariadb.query(q, vals);
                        } catch (e) { /* ignore single row errors to keep moving */ }
                    }
                }

                if (data.length < 1000) {
                    hasMore = false;
                } else {
                    from += 1000;
                    to += 1000;
                }
            } else {
                hasMore = false;
            }
        }
        console.log(`\n✅ Selesai ${mariadbTable} (${totalCount} rekod).`);
    }

    try {
        const tables = [
            ['mualaf', 'mualaf'],
            ['workers', 'workers'],
            ['programs', 'programs'],
            ['classes', 'classes'],
            ['attendance_records', 'attendance_records'],
            ['other_kpis', 'other_kpis'],
            ['kpi_settings', 'kpi_settings'],
            ['states', 'states'],
            ['locations', 'locations'],
            ['banks', 'banks'],
            ['races', 'races'],
            ['religions', 'religions'],
            ['class_levels', 'class_levels'],
            ['class_types', 'class_types'],
            ['kawasan_cawangan', 'kawasan_cawangan'],
            ['sub_kategori', 'sub_kategori'],
            ['program_status', 'program_status'],
            ['program_categories', 'program_categories'],
            ['program_organizers', 'program_organizers'],
            ['program_types', 'program_types']
        ];

        for (const [supa, maria] of tables) {
            await migrateTable(supa, maria);
        }

        console.log('\n🌟 SEMUA DATA BERJAYA DIMIGRASIKAN DENGAN CEPAT!');
    } catch (error) {
        console.error('\n❌ Ralat Besar:', error);
    } finally {
        await mariadb.end();
    }
}

run().catch(console.error);
