import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { crypto } from 'crypto';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('tahun');
        const month = searchParams.get('bulan');
        const state = searchParams.get('negeri');

        let sql = 'SELECT * FROM programs WHERE 1=1';
        const params = [];

        if (year && year !== '0') {
            sql += ' AND tahun = ?';
            params.push(year);
        }
        if (month && month !== '0') {
            sql += ' AND bulan = ?';
            params.push(month);
        }
        if (state) {
            sql += ' AND negeri = ?';
            params.push(state);
        }

        sql += ' ORDER BY tarikh_mula DESC';

        const results = await query(sql, params);

        // Parse JSON fields
        const parsedResults = results.map(p => ({
            ...p,
            kawasan_cawangan: typeof p.kawasan_cawangan === 'string' ? JSON.parse(p.kawasan_cawangan) : (p.kawasan_cawangan || []),
            jenis_program: typeof p.jenis_program === 'string' ? JSON.parse(p.jenis_program) : (p.jenis_program || []),
            sub_kategori: typeof p.sub_kategori === 'string' ? JSON.parse(p.sub_kategori) : (p.sub_kategori || []),
            anjuran: typeof p.anjuran === 'string' ? JSON.parse(p.anjuran) : (p.anjuran || []),
            selesai_laporan: !!p.selesai_laporan
        }));

        return NextResponse.json(parsedResults);
    } catch (error) {
        console.error('Programs GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const id = data.id || crypto.randomUUID();

        // Handle JSON fields
        const jsonFields = ['kawasan_cawangan', 'jenis_program', 'sub_kategori', 'anjuran'];
        const processedData = { ...data, id };

        jsonFields.forEach(field => {
            if (processedData[field]) {
                processedData[field] = JSON.stringify(processedData[field]);
            } else {
                processedData[field] = '[]';
            }
        });

        const keys = Object.keys(processedData);
        const values = Object.values(processedData);
        const placeholders = keys.map(() => '?').join(', ');

        const sql = `INSERT INTO programs (${keys.join(', ')}) VALUES (${placeholders})`;
        await query(sql, values);

        return NextResponse.json({ id, message: 'Program created successfully' });
    } catch (error) {
        console.error('Programs POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const data = await request.json();
        const { id, ...updates } = data;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        // Handle JSON fields
        const jsonFields = ['kawasan_cawangan', 'jenis_program', 'sub_kategori', 'anjuran'];
        jsonFields.forEach(field => {
            if (updates[field] !== undefined) {
                updates[field] = JSON.stringify(updates[field]);
            }
        });

        const keys = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = keys.map(key => `${key} = ?`).join(', ');

        const sql = `UPDATE programs SET ${setClause} WHERE id = ?`;
        await query(sql, [...values, id]);

        return NextResponse.json({ message: 'Program updated successfully' });
    } catch (error) {
        console.error('Programs PUT Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await query('DELETE FROM programs WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Program deleted successfully' });
    } catch (error) {
        console.error('Programs DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
