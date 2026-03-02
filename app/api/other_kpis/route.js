import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const results = await query('SELECT * FROM other_kpis WHERE id = ?', [id]);
            const row = results[0];
            if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            return NextResponse.json({
                ...row,
                data: row.data ? (typeof row.data === 'string' ? JSON.parse(row.data) : row.data) : {}
            });
        }

        let sql = "SELECT * FROM other_kpis WHERE deletedAt IS NULL";
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

            sql += ` AND \`${col}\` ${op} ?`;
            params.push(value);
        }

        sql += " ORDER BY createdAt DESC";

        const results = await query(sql, params);

        const parsed = results.map(row => ({
            ...row,
            data: row.data ? (typeof row.data === 'string' ? JSON.parse(row.data) : row.data) : {}
        }));

        return NextResponse.json(parsed);

    } catch (error) {
        console.error('Other KPIs GET Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const payload = await request.json();
        const id = crypto.randomUUID();

        const columns = ['id', 'category', 'year', 'state', 'location', 'data', 'createdBy', 'createdAt', 'updatedAt'];
        const values = [
            id,
            payload.category,
            payload.year,
            payload.state,
            payload.location || null,
            JSON.stringify(payload.data || {}),
            payload.createdBy || null,
            new Date(),
            new Date()
        ];

        const escapedColumns = columns.map(c => `\`${c}\``);
        const sql = `INSERT INTO other_kpis (${escapedColumns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
        await query(sql, values);

        return NextResponse.json([{
            id,
            category: payload.category,
            year: payload.year,
            state: payload.state,
            location: payload.location || null,
            data: payload.data || {},
            createdBy: payload.createdBy || null,
            createdAt: values[7],
            updatedAt: values[8]
        }]);

    } catch (error) {
        console.error('Other KPIs POST Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const payload = await request.json();
        const columns = Object.keys(payload).filter(k => !['id', 'createdAt', 'updatedAt'].includes(k));
        const values = columns.map(k => {
            if (k === 'data') return JSON.stringify(payload[k] ?? {});
            return payload[k] ?? null;
        });

        const setClause = columns.map(c => `\`${c}\` = ?`).join(', ');
        const sql = `UPDATE other_kpis SET ${setClause}, \`updatedAt\` = NOW() WHERE \`id\` = ?`;

        await query(sql, [...values, id]);

        return NextResponse.json({ message: 'Updated successfully' });

    } catch (error) {
        console.error('Other KPIs PUT Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        // Soft delete
        await query("UPDATE other_kpis SET deletedAt = NOW() WHERE id = ?", [id]);

        return NextResponse.json({ message: 'Deleted successfully' });

    } catch (error) {
        console.error('Other KPIs DELETE Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
