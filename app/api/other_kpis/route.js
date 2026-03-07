import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const year = searchParams.get('year');
        const state = searchParams.get('state');

        let sql = 'SELECT * FROM other_kpis WHERE deletedAt IS NULL';
        const params = [];

        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }
        if (year && year !== '0') {
            sql += ' AND year = ?';
            params.push(year);
        }
        if (state) {
            sql += ' AND state = ?';
            params.push(state);
        }

        sql += ' ORDER BY createdAt DESC';

        const results = await query(sql, params);

        // Parse JSONB data
        const parsedResults = results.map(row => ({
            ...row,
            data: typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {})
        }));

        return NextResponse.json(parsedResults);
    } catch (error) {
        console.error('OtherKPIs GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { category, year, state, data } = body;
        const id = crypto.randomUUID();

        const sql = 'INSERT INTO other_kpis (id, category, year, state, data) VALUES (?, ?, ?, ?, ?)';
        await query(sql, [id, category, year, state, JSON.stringify(data || {})]);

        return NextResponse.json({ id, message: 'Created successfully' });
    } catch (error) {
        console.error('OtherKPIs POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const body = await request.json();
        const { year, state, data } = body;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const updates = [];
        const params = [];

        if (year !== undefined) {
            updates.push('year = ?');
            params.push(year);
        }
        if (state !== undefined) {
            updates.push('state = ?');
            params.push(state);
        }
        if (data !== undefined) {
            updates.push('data = ?');
            params.push(JSON.stringify(data));
        }

        updates.push('updatedAt = CURRENT_TIMESTAMP');

        if (updates.length === 0) return NextResponse.json({ message: 'No changes' });

        const sql = `UPDATE other_kpis SET ${updates.join(', ')} WHERE id = ?`;
        await query(sql, [...params, id]);

        return NextResponse.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error('OtherKPIs PUT Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        // Soft delete
        await query('UPDATE other_kpis SET deletedAt = CURRENT_TIMESTAMP WHERE id = ?', [id]);

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('OtherKPIs DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
