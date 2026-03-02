/**
 * Fix MariaDB Schema
 * 1. Renames 'submissions' to 'mualaf'
 * 2. Creates missing lookup and business tables
 */

const mysql = require('mysql2/promise');

const dbConfig = {
    host: '151.106.124.161',
    user: 'u311693590_admin_isantuni',
    password: 'HIDDEN_PASSWORD',
    database: 'u311693590_isantuni_v2',
};

async function run() {
    const c = await mysql.createConnection(dbConfig);
    console.log('🛠 Fixing MariaDB Schema...');

    try {
        // 1. Rename submissions if it exists and mualaf doesn't
        const [tables] = await c.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);

        if (tableNames.includes('submissions') && !tableNames.includes('mualaf')) {
            console.log('   🔄 Renaming submissions to mualaf...');
            await c.query('RENAME TABLE `submissions` TO `mualaf`');
        }

        // 2. Create missing tables
        const queries = [
            `CREATE TABLE IF NOT EXISTS \`banks\` (
                \`id\` VARCHAR(36) PRIMARY KEY,
                \`name\` VARCHAR(255) UNIQUE NOT NULL,
                \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            `CREATE TABLE IF NOT EXISTS \`class_levels\` (
                \`id\` VARCHAR(36) PRIMARY KEY,
                \`name\` VARCHAR(255) UNIQUE NOT NULL,
                \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            `CREATE TABLE IF NOT EXISTS \`class_types\` (
                \`id\` VARCHAR(36) PRIMARY KEY,
                \`name\` VARCHAR(255) UNIQUE NOT NULL,
                \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            `CREATE TABLE IF NOT EXISTS \`races\` (
                \`id\` VARCHAR(36) PRIMARY KEY,
                \`name\` VARCHAR(255) UNIQUE NOT NULL,
                \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            `CREATE TABLE IF NOT EXISTS \`religions\` (
                \`id\` VARCHAR(36) PRIMARY KEY,
                \`name\` VARCHAR(255) UNIQUE NOT NULL,
                \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            `CREATE TABLE IF NOT EXISTS \`kawasan_cawangan\` (
                \`id\` VARCHAR(36) PRIMARY KEY,
                \`state_name\` VARCHAR(100),
                \`name\` VARCHAR(255) NOT NULL,
                \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(\`state_name\`, \`name\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            `CREATE TABLE IF NOT EXISTS \`sub_kategori\` (
                \`id\` VARCHAR(36) PRIMARY KEY,
                \`name\` VARCHAR(255) UNIQUE NOT NULL,
                \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            `CREATE TABLE IF NOT EXISTS \`other_kpis\` (
                \`id\` VARCHAR(36) PRIMARY KEY,
                \`category\` VARCHAR(100) NOT NULL,
                \`year\` INT NOT NULL,
                \`state\` VARCHAR(100),
                \`location\` VARCHAR(100),
                \`month\` INT,
                \`data\` JSON,
                \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
                \`createdBy\` VARCHAR(36),
                \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`updatedBy\` VARCHAR(36),
                \`deletedAt\` DATETIME
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
        ];

        for (const q of queries) {
            await c.query(q);
        }

        console.log('✅ Schema fixed successfully!');
    } catch (err) {
        console.error('❌ Error fixing schema:', err.message);
    } finally {
        await c.end();
    }
}

run().catch(console.error);
