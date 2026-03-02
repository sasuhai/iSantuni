import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const results = await query('SELECT * FROM attendance_records WHERE id = ?', [id]);
            const row = results[0];
            if (!row) return NextResponse.json(null);

            return NextResponse.json({
                ...row,
                students: row.students ? (typeof row.students === 'string' ? JSON.parse(row.students) : row.students) : [],
                workers: row.workers ? (typeof row.workers === 'string' ? JSON.parse(row.workers) : row.workers) : []
            });
        }

        let sql = 'SELECT * FROM attendance_records WHERE 1=1';
        const params = [];

        for (const [key, value] of searchParams.entries()) {
            if (['id', '_order', '_dir', '_limit', '_from', '_to', 'table'].includes(key)) continue;

            let col = key;
            let op = '=';

            if (key.endsWith('_gte')) {
                col = key.replace('_gte', '');
                op = '>=';
            } else if (key.endsWith('_lte')) {
                col = key.replace('_lte', '');
                op = '<=';
            } else if (key.endsWith('_eq')) {
                col = key.replace('_eq', '');
                op = '=';
            }

            sql += ` AND \`${col}\` ${op} ?`;
            params.push(value);
        }

        const results = await query(sql, params);
        const parsed = results.map(row => ({
            ...row,
            students: row.students ? (typeof row.students === 'string' ? JSON.parse(row.students) : row.students) : [],
            workers: row.workers ? (typeof row.workers === 'string' ? JSON.parse(row.workers) : row.workers) : []
        }));
        return NextResponse.json(parsed);
    } catch (error) {
        console.error('Attendance GET Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { id, classId, year, month, students, workers } = await request.json();

        const sql = `INSERT INTO attendance_records (\`id\`, \`classId\`, \`year\`, \`month\`, \`students\`, \`workers\`, \`createdAt\`, \`updatedAt\`) 
                     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`;

        await query(sql, [id, classId, year, month, JSON.stringify(students || []), JSON.stringify(workers || [])]);

        return NextResponse.json([{ id, classId, year, month, students: students || [], workers: workers || [], createdAt: new Date(), updatedAt: new Date() }]);
    } catch (error) {
        console.error('Attendance POST Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { students, workers } = await request.json();

        const sql = `UPDATE attendance_records SET \`students\` = ?, \`workers\` = ?, \`updatedAt\` = NOW() WHERE \`id\` = ?`;
        await query(sql, [JSON.stringify(students || []), JSON.stringify(workers || []), id]);

        return NextResponse.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error('Attendance PUT Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await query('DELETE FROM attendance_records WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Attendance DELETE Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
