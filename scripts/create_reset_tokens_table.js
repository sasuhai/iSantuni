const { query } = require('../lib/db');
async function run() {
    try {
        await query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id VARCHAR(36) PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            token VARCHAR(255) NOT NULL,
            expiresAt DATETIME NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        `);
        console.log("Table password_reset_tokens created successfully");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
