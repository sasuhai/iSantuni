import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        const safeParse = (val) => {
            if (!val) return null;
            if (typeof val !== 'string') return val;
            try { return JSON.parse(val); } catch (e) { return val; }
        };

        if (id) {
            const results = await query('SELECT * FROM mualaf WHERE id = ?', [id]);
            if (results.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            const row = results[0];
            return NextResponse.json({
                ...row,
                gambarIC: safeParse(row.gambarIC),
                gambarKadIslam: safeParse(row.gambarKadIslam),
                gambarSijilPengislaman: safeParse(row.gambarSijilPengislaman),
                gambarMualaf: safeParse(row.gambarMualaf),
                gambarSesiPengislaman: safeParse(row.gambarSesiPengislaman),
                pengislamanKPI: safeParse(row.pengislamanKPI) || {}
            });
        }

        // Handle full list with filters
        const status = searchParams.get('status') || 'active';
        const limitInt = parseInt(searchParams.get('limit')) || 1000;
        const offsetInt = parseInt(searchParams.get('offset')) || 0;

        let sql = 'SELECT * FROM mualaf WHERE status = ?';
        let params = [status];

        const countResult = await query('SELECT COUNT(*) as count FROM mualaf WHERE status = ?', [status]);
        const totalCount = countResult[0].count;

        sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
        params.push(limitInt, offsetInt);

        const results = await query(sql, params);

        // Parse JSON fields
        const parsedResults = results.map(row => ({
            ...row,
            gambarIC: safeParse(row.gambarIC),
            gambarKadIslam: safeParse(row.gambarKadIslam),
            gambarSijilPengislaman: safeParse(row.gambarSijilPengislaman),
            gambarMualaf: safeParse(row.gambarMualaf),
            gambarSesiPengislaman: safeParse(row.gambarSesiPengislaman),
            pengislamanKPI: safeParse(row.pengislamanKPI) || {}
        }));

        // To mimic Supabase response structure with count
        // Note: we usually return a simple array, but some callers expect data/count
        return NextResponse.json(parsedResults, {
            headers: {
                'x-total-count': totalCount.toString()
            }
        });

    } catch (error) {
        console.error('GET mualaf Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const id = crypto.randomUUID();

        const columns = Object.keys(data).filter(key => !['id', 'createdAt', 'updatedAt'].includes(key));
        const values = columns.map(key => {
            const val = data[key];
            if (typeof val === 'object' && val !== null) return JSON.stringify(val);
            return val;
        });

        const sql = `INSERT INTO mualaf (id, ${columns.join(', ')}, createdAt, updatedAt) 
                 VALUES (?, ${columns.map(() => '?').join(', ')}, NOW(), NOW())`;

        await query(sql, [id, ...values]);

        return NextResponse.json({ id, message: 'Created successfully' });

    } catch (error) {
        console.error('POST submission Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const data = await request.json();
        const columns = Object.keys(data).filter(key => !['id', 'createdAt', 'updatedAt'].includes(key));
        const values = columns.map(key => {
            const val = data[key];
            if (typeof val === 'object' && val !== null) return JSON.stringify(val);
            return val;
        });

        const setClause = columns.map(col => `${col} = ?`).join(', ');
        const sql = `UPDATE mualaf SET ${setClause}, updatedAt = NOW() WHERE id = ?`;

        await query(sql, [...values, id]);

        return NextResponse.json({ message: 'Updated successfully' });

    } catch (error) {
        console.error('PUT submission Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        // Soft delete
        await query("UPDATE mualaf SET status = 'deleted', deletedAt = NOW() WHERE id = ?", [id]);

        return NextResponse.json({ message: 'Deleted successfully' });

    } catch (error) {
        console.error('DELETE submission Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
