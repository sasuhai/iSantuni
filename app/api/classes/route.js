import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const results = await query('SELECT * FROM classes WHERE id = ?', [id]);
            return NextResponse.json(results[0] || null);
        }

        const results = await query('SELECT * FROM classes ORDER BY nama');
        return NextResponse.json(results);
    } catch (error) {
        console.error('Classes GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const id = crypto.randomUUID();
        const columns = Object.keys(data).filter(key => !['id', 'createdAt', 'updatedAt'].includes(key));
        const values = columns.map(key => data[key]);

        const sql = `INSERT INTO classes (id, ${columns.join(', ')}, createdAt, updatedAt) VALUES (?, ${columns.map(() => '?').join(', ')}, NOW(), NOW())`;
        await query(sql, [id, ...values]);

        return NextResponse.json({ id, message: 'Created successfully' });
    } catch (error) {
        console.error('Classes POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const data = await request.json();
        const columns = Object.keys(data).filter(key => !['id', 'createdAt', 'updatedAt'].includes(key));
        const values = columns.map(key => data[key]);

        const setClause = columns.map(col => `${col} = ?`).join(', ');
        const sql = `UPDATE classes SET ${setClause}, updatedAt = NOW() WHERE id = ?`;
        await query(sql, [...values, id]);

        return NextResponse.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error('Classes PUT Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await query('DELETE FROM classes WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Classes DELETE Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
