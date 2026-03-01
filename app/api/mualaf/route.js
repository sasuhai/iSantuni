import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const results = await query('SELECT * FROM submissions WHERE id = ?', [id]);
            if (results.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            const row = results[0];
            return NextResponse.json({
                ...row,
                gambarIC: row.gambarIC ? (typeof row.gambarIC === 'string' ? JSON.parse(row.gambarIC) : row.gambarIC) : null,
                gambarKadIslam: row.gambarKadIslam ? (typeof row.gambarKadIslam === 'string' ? JSON.parse(row.gambarKadIslam) : row.gambarKadIslam) : null,
                gambarSijilPengislaman: row.gambarSijilPengislaman ? (typeof row.gambarSijilPengislaman === 'string' ? JSON.parse(row.gambarSijilPengislaman) : row.gambarSijilPengislaman) : null,
                gambarMualaf: row.gambarMualaf ? (typeof row.gambarMualaf === 'string' ? JSON.parse(row.gambarMualaf) : row.gambarMualaf) : null,
                gambarSesiPengislaman: row.gambarSesiPengislaman ? (typeof row.gambarSesiPengislaman === 'string' ? JSON.parse(row.gambarSesiPengislaman) : row.gambarSesiPengislaman) : null,
                pengislamanKPI: row.pengislamanKPI ? (typeof row.pengislamanKPI === 'string' ? JSON.parse(row.pengislamanKPI) : row.pengislamanKPI) : {}
            });
        }

        // Handle full list with filters
        const status = searchParams.get('status') || 'active';
        const results = await query('SELECT * FROM submissions WHERE status = ? ORDER BY createdAt DESC', [status]);

        // Parse JSON fields
        const parsedResults = results.map(row => ({
            ...row,
            gambarIC: row.gambarIC ? (typeof row.gambarIC === 'string' ? JSON.parse(row.gambarIC) : row.gambarIC) : null,
            gambarKadIslam: row.gambarKadIslam ? (typeof row.gambarKadIslam === 'string' ? JSON.parse(row.gambarKadIslam) : row.gambarKadIslam) : null,
            gambarSijilPengislaman: row.gambarSijilPengislaman ? (typeof row.gambarSijilPengislaman === 'string' ? JSON.parse(row.gambarSijilPengislaman) : row.gambarSijilPengislaman) : null,
            gambarMualaf: row.gambarMualaf ? (typeof row.gambarMualaf === 'string' ? JSON.parse(row.gambarMualaf) : row.gambarMualaf) : null,
            gambarSesiPengislaman: row.gambarSesiPengislaman ? (typeof row.gambarSesiPengislaman === 'string' ? JSON.parse(row.gambarSesiPengislaman) : row.gambarSesiPengislaman) : null,
            pengislamanKPI: row.pengislamanKPI ? (typeof row.pengislamanKPI === 'string' ? JSON.parse(row.pengislamanKPI) : row.pengislamanKPI) : {}
        }));

        return NextResponse.json(parsedResults);

    } catch (error) {
        console.error('GET submissions Error:', error);
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

        const sql = `INSERT INTO submissions (id, ${columns.join(', ')}, createdAt, updatedAt) 
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
        const sql = `UPDATE submissions SET ${setClause}, updatedAt = NOW() WHERE id = ?`;

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
        await query("UPDATE submissions SET status = 'deleted', deletedAt = NOW() WHERE id = ?", [id]);

        return NextResponse.json({ message: 'Deleted successfully' });

    } catch (error) {
        console.error('DELETE submission Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
