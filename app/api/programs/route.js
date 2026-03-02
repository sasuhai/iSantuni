import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const results = await query('SELECT * FROM programs WHERE id = ?', [id]);
            const row = results[0];
            if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            return NextResponse.json({
                ...row,
                kawasan_cawangan: typeof row.kawasan_cawangan === 'string' ? JSON.parse(row.kawasan_cawangan) : (row.kawasan_cawangan || []),
                jenis_program: typeof row.jenis_program === 'string' ? JSON.parse(row.jenis_program) : (row.jenis_program || []),
                sub_kategori: typeof row.sub_kategori === 'string' ? JSON.parse(row.sub_kategori) : (row.sub_kategori || []),
                anjuran: typeof row.anjuran === 'string' ? JSON.parse(row.anjuran) : (row.anjuran || []),
                selesai_laporan: !!row.selesai_laporan
            });
        }

        let sql = 'SELECT * FROM programs WHERE 1=1';
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

            // Map frontend field names to DB names if different
            const fieldMap = { 'tahun': 'tahun', 'bulan': 'bulan', 'negeri': 'negeri' };
            const dbCol = fieldMap[col] || col;

            sql += ` AND \`${dbCol}\` ${op} ?`;
            params.push(value);
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

        const escapedKeys = keys.map(k => `\`${k}\``);
        const processedValues = values.map(v => v === undefined ? null : v);
        const sql = `INSERT INTO programs (${escapedKeys.join(', ')}) VALUES (${placeholders})`;
        await query(sql, processedValues);

        return NextResponse.json([{ ...data, id, createdAt: new Date(), updatedAt: new Date() }]);
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
        const setClause = keys.map(key => `\`${key}\` = ?`).join(', ');
        const processedValues = values.map(v => v === undefined ? null : v);

        const sql = `UPDATE programs SET ${setClause} WHERE \`id\` = ?`;
        await query(sql, [...processedValues, id]);

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
