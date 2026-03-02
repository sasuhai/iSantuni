import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const results = await query('SELECT * FROM workers WHERE id = ?', [id]);
            return NextResponse.json(results[0] || null);
        }

        let sql = 'SELECT * FROM workers WHERE 1=1';
        const params = [];

        for (const [key, value] of searchParams.entries()) {
            if (['id', '_order', '_dir', '_limit', '_from', '_to', 'table'].includes(key)) continue;

            if (key.endsWith('_in')) {
                const col = key.replace('_in', '');
                const values = value.split(',');
                if (values.length > 0) {
                    const placeholders = values.map(() => '?').join(',');
                    sql += ` AND \`${col}\` IN (${placeholders})`;
                    params.push(...values);
                }
            } else if (key.endsWith('_eq')) {
                const col = key.replace('_eq', '');
                sql += ` AND \`${col}\` = ?`;
                params.push(value);
            } else {
                sql += ` AND \`${key}\` = ?`;
                params.push(value);
            }
        }

        sql += ' ORDER BY nama';
        const results = await query(sql, params);
        return NextResponse.json(results);
    } catch (error) {
        console.error('Workers GET Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const id = crypto.randomUUID();
        const columns = Object.keys(data).filter(key => !['id', 'createdAt', 'updatedAt'].includes(key));
        const escapedColumns = columns.map(col => `\`${col}\``);
        const values = columns.map(key => data[key] ?? null);

        const sql = `INSERT INTO workers (\`id\`, ${escapedColumns.join(', ')}, \`createdAt\`, \`updatedAt\`) VALUES (?, ${columns.map(() => '?').join(', ')}, NOW(), NOW())`;
        await query(sql, [id, ...values]);

        return NextResponse.json([{ id, ...data, createdAt: new Date(), updatedAt: new Date() }]);
    } catch (error) {
        console.error('Workers POST Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const data = await request.json();
        const columns = Object.keys(data).filter(key => !['id', 'createdAt', 'updatedAt'].includes(key));
        const values = columns.map(key => data[key] ?? null);

        const setClause = columns.map(col => `\`${col}\` = ?`).join(', ');
        const sql = `UPDATE workers SET ${setClause}, \`updatedAt\` = NOW() WHERE \`id\` = ?`;
        await query(sql, [...values, id]);

        return NextResponse.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error('Workers PUT Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await query('DELETE FROM workers WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Workers DELETE Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
