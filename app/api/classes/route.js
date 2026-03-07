import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const results = await query('SELECT * FROM classes WHERE id = ?', [id]);
            if (results.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            return NextResponse.json(results[0]);
        }

        const results = await query('SELECT * FROM classes ORDER BY nama ASC');
        return NextResponse.json(results);
    } catch (error) {
        console.error('Classes GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const id = data.id || crypto.randomUUID();
        const { nama, negeri, lokasi, jenis, tahap } = data;

        const sql = 'INSERT INTO classes (id, nama, negeri, lokasi, jenis, tahap) VALUES (?, ?, ?, ?, ?, ?)';
        const result = await query(sql, [id, nama, negeri, lokasi, jenis, tahap]);

        return NextResponse.json({ id: result.insertId, message: 'Created successfully' });
    } catch (error) {
        console.error('Classes POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const data = await request.json();
        const { id, nama, negeri, lokasi, jenis, tahap } = data;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const sql = 'UPDATE classes SET nama = ?, negeri = ?, lokasi = ?, jenis = ?, tahap = ? WHERE id = ?';
        await query(sql, [nama, negeri, lokasi, jenis, tahap, id]);

        return NextResponse.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error('Classes PUT Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await query('DELETE FROM classes WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Classes DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
