import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

const columns = [
    'kategori', 'namaAsal', 'namaIslam', 'noKP', 'jantina', 'bangsa', 'agamaAsal', 'umur',
    'tarikhLahir', 'warganegara', 'tarikhPengislaman', 'masaPengislaman', 'tempatPengislaman',
    'negeriPengislaman', 'namaPegawaiMengislamkan', 'noKPPegawaiMengislamkan', 'noTelPegawaiMengislamkan',
    'namaSaksi1', 'noKPSaksi1', 'noTelSaksi1', 'namaSaksi2', 'noKPSaksi2', 'noTelSaksi2',
    'noTelefon', 'alamatTinggal', 'poskod', 'bandar', 'negeri', 'alamatTetap',
    'maklumatKenalanPengiring', 'pekerjaan', 'pendapatanBulanan', 'tanggungan',
    'tahapPendidikan', 'lokasi', 'namaPenuh', 'registeredByName', 'bank', 'noAkaun',
    'namaDiBank', 'kategoriElaun', 'status', 'catatan', 'catatanAudit', 'pengislamanKPI',
    'gambarIC', 'gambarKadIslam', 'gambarSijilPengislaman', 'gambarMualaf', 'gambarSesiPengislaman',
    'dokumenLain1', 'dokumenLain2', 'dokumenLain3', 'createdBy', 'updatedBy'
];

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const results = await query('SELECT * FROM mualaf WHERE id = ?', [id]);
            const row = results[0];
            if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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
        let sql = 'SELECT * FROM mualaf WHERE 1=1';
        const params = [];

        // Supabase proxy sends filters with suffixes or exact match
        for (const [key, value] of searchParams.entries()) {
            if (key === 'status' || key === 'id' || key === '_order' || key === '_dir' || key === '_limit' || key === '_from' || key === '_to' || key === 'table') continue;

            if (key.endsWith('_gte')) {
                const col = key.replace('_gte', '');
                sql += ` AND \`${col}\` >= ?`;
                params.push(value);
            } else if (key.endsWith('_lte')) {
                const col = key.replace('_lte', '');
                sql += ` AND \`${col}\` <= ?`;
                params.push(value);
            } else if (key.endsWith('_eq')) {
                const col = key.replace('_eq', '');
                sql += ` AND \`${col}\` = ?`;
                params.push(value);
            } else if (key.endsWith('_in')) {
                const col = key.replace('_in', '');
                const values = value.split(',');
                if (values.length > 0) {
                    const placeholders = values.map(() => '?').join(',');
                    sql += ` AND \`${col}\` IN (${placeholders})`;
                    params.push(...values);
                }
            } else {
                // Exact match default
                sql += ` AND \`${key}\` = ?`;
                params.push(value);
            }
        }

        const status = searchParams.get('status') || 'active';
        sql += ' AND status = ?';
        params.push(status);

        const order = searchParams.get('_order') || 'createdAt';
        const dir = searchParams.get('_dir') || 'DESC';
        sql += ` ORDER BY \`${order}\` ${dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;

        const limit = searchParams.get('_limit');
        if (limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const results = await query(sql, params);

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
        console.error('GET mualaf Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const id = crypto.randomUUID();

        const escapedColumns = columns.map(col => `\`${col}\``);
        const values = columns.map(key => {
            const val = data[key];
            if (val === undefined) return null;
            if (typeof val === 'object' && val !== null) return JSON.stringify(val);
            return val;
        });

        const sql = `INSERT INTO mualaf (\`id\`, ${escapedColumns.join(', ')}, \`createdAt\`, \`updatedAt\`) 
                 VALUES (?, ${columns.map(() => '?').join(', ')}, NOW(), NOW())`;

        await query(sql, [id, ...values]);

        return NextResponse.json([{ id, ...data, createdAt: new Date(), updatedAt: new Date() }]);

    } catch (error) {
        console.error('POST mualaf Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const data = await request.json();
        const escapedColumns = columns.map(col => `\`${col}\``);
        const values = columns.map(key => {
            const val = data[key];
            if (val === undefined) return null;
            if (typeof val === 'object' && val !== null) return JSON.stringify(val);
            return val;
        });

        const setClause = columns.map(col => `\`${col}\` = ?`).join(', ');
        const sql = `UPDATE mualaf SET ${setClause}, \`updatedAt\` = NOW() WHERE \`id\` = ?`;

        await query(sql, [...values, id]);

        return NextResponse.json({ message: 'Updated successfully' });

    } catch (error) {
        console.error('PUT mualaf Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
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
        console.error('DELETE mualaf Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
