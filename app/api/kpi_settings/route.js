import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const order = searchParams.get('order') || 'order_index';
        const ascending = searchParams.get('ascending') === 'true';

        let sql = 'SELECT * FROM kpi_settings';

        // Allowed columns for ordering to prevent SQL injection
        const allowedOrderCols = ['id', 'kpi_name', 'category', 'target', 'year', 'createdAt', 'perkara', 'source', 'order_index'];
        const orderCol = allowedOrderCols.includes(order) ? order : 'order_index';

        sql += ` ORDER BY ${orderCol} ${ascending ? 'ASC' : 'DESC'}`;

        const results = await query(sql);

        // Filter and Parse
        const parsedResults = results
            .filter(r => r.perkara !== null)
            .map(row => ({
                ...row,
                config: typeof row.config === 'string' ? JSON.parse(row.config) : (row.config || {})
            }));

        return NextResponse.json(parsedResults);
    } catch (error) {
        console.error('KPI Settings GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { kpi_name, category, target, year, perkara, source, config, order_index } = body;

        const sql = 'INSERT INTO kpi_settings (kpi_name, category, target, year, perkara, source, config, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const result = await query(sql, [
            kpi_name,
            category,
            target,
            year,
            perkara,
            source,
            config ? JSON.stringify(config) : null,
            order_index || 0
        ]);

        return NextResponse.json({ id: result.insertId, message: 'Created successfully' });
    } catch (error) {
        console.error('KPI Settings POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const body = await request.json();

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const fields = ['kpi_name', 'category', 'target', 'year', 'perkara', 'source', 'config', 'order_index'];
        const updates = [];
        const params = [];

        fields.forEach(field => {
            if (body[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(field === 'config' ? JSON.stringify(body[field]) : body[field]);
            }
        });

        if (updates.length === 0) return NextResponse.json({ message: 'No changes' });

        const sql = `UPDATE kpi_settings SET ${updates.join(', ')} WHERE id = ?`;
        await query(sql, [...params, id]);

        return NextResponse.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error('KPI Settings PUT Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await query('DELETE FROM kpi_settings WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('KPI Settings DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
