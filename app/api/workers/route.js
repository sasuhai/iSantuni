import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const peranan = searchParams.get('peranan');
        const id = searchParams.get('id');

        if (id) {
            const results = await query('SELECT * FROM workers WHERE id = ?', [id]);
            if (results.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            return NextResponse.json(results[0]);
        }

        let sql = 'SELECT * FROM workers WHERE 1=1';
        const params = [];

        if (peranan) {
            sql += ' AND peranan = ?';
            params.push(peranan);
        }

        sql += ' ORDER BY nama ASC';
        const results = await query(sql, params);
        return NextResponse.json(results);
    } catch (error) {
        console.error('Workers GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const id = data.id || crypto.randomUUID();
        const processedData = { ...data, id };
        const keys = Object.keys(processedData);
        const values = Object.values(processedData);
        const placeholders = keys.map(() => '?').join(', ');

        const sql = `INSERT INTO workers (${keys.join(', ')}) VALUES (${placeholders})`;
        const result = await query(sql, values);

        return NextResponse.json({ id: result.insertId, message: 'Created successfully' });
    } catch (error) {
        console.error('Workers POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const data = await request.json();
        const { id, ...updates } = data;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const keys = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = keys.map(key => `${key} = ?`).join(', ');

        const sql = `UPDATE workers SET ${setClause} WHERE id = ?`;
        await query(sql, [...values, id]);

        return NextResponse.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error('Workers PUT Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await query('DELETE FROM workers WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Workers DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
