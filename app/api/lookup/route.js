import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const table = searchParams.get('table');

        if (!table) return NextResponse.json({ error: 'Table name is required' }, { status: 400 });

        const allowedTables = ['states', 'locations', 'class_levels', 'class_types', 'rateCategories', 'banks', 'program_status', 'program_categories', 'program_organizers', 'program_types'];
        if (!allowedTables.includes(table)) return NextResponse.json({ error: 'Invalid table' }, { status: 403 });

        let sql = `SELECT * FROM ${table}`;
        if (table === 'rateCategories') {
            sql += ` ORDER BY kategori ASC`;
        } else {
            sql += ` ORDER BY name ASC`;
        }

        const results = await query(sql);
        return NextResponse.json(results);
    } catch (error) {
        console.error('Lookup GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { table, name, extraData } = await request.json();
        const allowedTables = ['states', 'locations', 'class_levels', 'class_types', 'rateCategories', 'banks', 'workers', 'classes'];
        if (!allowedTables.includes(table)) return NextResponse.json({ error: 'Invalid table' }, { status: 403 });

        let sql, params;
        if (table === 'rateCategories') {
            sql = `INSERT INTO rateCategories (id, kategori, jenis, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())`;
            params = [crypto.randomUUID(), name, extraData?.jenis || 'mualaf'];
        } else {
            const columns = ['name', ...Object.keys(extraData || {})];
            const placeholders = columns.map(() => '?').join(', ');
            sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
            params = [name, ...Object.values(extraData || {})];
        }

        const result = await query(sql, params);
        return NextResponse.json({ id: result.insertId || params[0], message: 'Created successfully' });
    } catch (error) {
        console.error('Lookup POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const table = searchParams.get('table');
        const id = searchParams.get('id');
        const data = await request.json();

        if (!table || !id) return NextResponse.json({ error: 'Table and ID required' }, { status: 400 });

        const allowedTables = ['states', 'locations', 'class_levels', 'class_types', 'rateCategories', 'banks', 'workers', 'classes'];
        if (!allowedTables.includes(table)) return NextResponse.json({ error: 'Invalid table' }, { status: 403 });

        let sql, params;
        if (table === 'rateCategories') {
            sql = `UPDATE rateCategories SET kategori = ?, jenis = ?, updatedAt = NOW() WHERE id = ?`;
            params = [data.kategori || data.name, data.jenis, id];
        } else {
            const columns = Object.keys(data);
            const setClause = columns.map(col => `${col} = ?`).join(', ');
            sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
            params = [...Object.values(data), id];
        }

        await query(sql, params);
        return NextResponse.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error('Lookup PUT Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const table = searchParams.get('table');
        const id = searchParams.get('id');

        if (!table || !id) return NextResponse.json({ error: 'Table and ID required' }, { status: 400 });

        const allowedTables = ['states', 'locations', 'class_levels', 'class_types', 'rateCategories', 'banks', 'workers', 'classes'];
        if (!allowedTables.includes(table)) return NextResponse.json({ error: 'Invalid table' }, { status: 403 });

        await query(`DELETE FROM ${table} WHERE id = ?`, [id]);
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Lookup DELETE Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
