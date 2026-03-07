import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const classId = searchParams.get('classId');
        const month = searchParams.get('month');

        if (id) {
            const results = await query('SELECT * FROM attendance_records WHERE id = ?', [id]);
            if (results.length === 0) return NextResponse.json(null);

            const row = results[0];
            return NextResponse.json({
                ...row,
                workers: typeof row.workers === 'string' ? JSON.parse(row.workers) : (row.workers || []),
                students: typeof row.students === 'string' ? JSON.parse(row.students) : (row.students || [])
            });
        } else if (classId && month) {
            const results = await query('SELECT * FROM attendance_records WHERE classId = ? AND month = ?', [classId, month]);
            if (results.length === 0) return NextResponse.json(null);

            const row = results[0];
            return NextResponse.json({
                ...row,
                workers: typeof row.workers === 'string' ? JSON.parse(row.workers) : (row.workers || []),
                students: typeof row.students === 'string' ? JSON.parse(row.students) : (row.students || [])
            });
        }

        const results = await query('SELECT * FROM attendance_records');
        return NextResponse.json(results.map(row => ({
            ...row,
            workers: typeof row.workers === 'string' ? JSON.parse(row.workers) : (row.workers || []),
            students: typeof row.students === 'string' ? JSON.parse(row.students) : (row.students || [])
        })));
    } catch (error) {
        console.error('Attendance GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const { id, classId, month, workers, students, ...rest } = data;

        const columns = ['id', 'classId', 'month', 'workers', 'students', ...Object.keys(rest)];
        const placeholders = columns.map(() => '?').join(', ');
        const values = [
            id, classId, month,
            JSON.stringify(workers || []),
            JSON.stringify(students || []),
            ...Object.values(rest)
        ];

        const sql = `INSERT INTO attendance_records (${columns.join(', ')}) VALUES (${placeholders})`;
        await query(sql, values);

        return NextResponse.json({ id, message: 'Created successfully' });
    } catch (error) {
        console.error('Attendance POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const data = await request.json();
        const updates = [];
        const params = [];

        for (const [key, value] of Object.entries(data)) {
            if (key !== 'id') {
                updates.push(`${key} = ?`);
                if (typeof value === 'object' && value !== null) {
                    params.push(JSON.stringify(value));
                } else {
                    params.push(value);
                }
            }
        }

        if (updates.length === 0) return NextResponse.json({ message: 'No changes' });

        const sql = `UPDATE attendance_records SET ${updates.join(', ')} WHERE id = ?`;
        await query(sql, [...params, id]);

        return NextResponse.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error('Attendance PUT Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const data = await request.json();
        const { id, ...rest } = data;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const existing = await query('SELECT id FROM attendance_records WHERE id = ?', [id]);

        if (existing.length > 0) {
            // Update
            const updates = [];
            const params = [];
            for (const [key, value] of Object.entries(rest)) {
                updates.push(`${key} = ?`);
                params.push(typeof value === 'object' && value !== null ? JSON.stringify(value) : value);
            }
            const sql = `UPDATE attendance_records SET ${updates.join(', ')} WHERE id = ?`;
            await query(sql, [...params, id]);
            return NextResponse.json({ message: 'Updated successfully' });
        } else {
            // Insert
            const columns = ['id', ...Object.keys(rest)];
            const placeholders = columns.map(() => '?').join(', ');
            const values = [id, ...Object.values(rest).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v)];
            const sql = `INSERT INTO attendance_records (${columns.join(', ')}) VALUES (${placeholders})`;
            await query(sql, values);
            return NextResponse.json({ message: 'Inserted successfully' });
        }
    } catch (error) {
        console.error('Attendance PATCH Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await query('DELETE FROM attendance_records WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Attendance DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
