const { query } = require('./lib/db');
async function test() {
    const classes = await query('SELECT * FROM classes LIMIT 3');
    const records = await query('SELECT * FROM attendance_records LIMIT 3');
    console.log(classes[0]?.id);
    console.log(records[0]?.id);
    console.log(records[0]?.classId);
}
test().catch(console.error);
