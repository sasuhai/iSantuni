import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const table = searchParams.get('table');

        if (!table) {
            return NextResponse.json({ error: 'Table name is required' }, { status: 400 });
        }

        // White-list allowed lookup tables to prevent SQL injection
        const allowedTables = ['states', 'locations', 'class_levels', 'class_types', 'rateCategories'];
        if (!allowedTables.includes(table)) {
            return NextResponse.json({ error: 'Invalid table' }, { status: 403 });
        }

        const results = await query(`SELECT * FROM ${table} ORDER BY name ASC`);
        return NextResponse.json(results);

    } catch (error) {
        console.error('Lookup GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { table, name, extraData } = await request.json();

        const allowedTables = ['states', 'locations', 'class_levels', 'class_types'];
        if (!allowedTables.includes(table)) {
            return NextResponse.json({ error: 'Invalid table' }, { status: 403 });
        }

        const sql = `INSERT INTO ${table} (name ${extraData ? ', ' + Object.keys(extraData).join(', ') : ''}) 
                 VALUES (? ${extraData ? ', ' + Object.keys(extraData).map(() => '?').join(', ') : ''})`;
        const params = [name, ...Object.values(extraData || {})];

        const result = await query(sql, params);
        return NextResponse.json({ id: result.insertId, message: 'Created successfully' });

    } catch (error) {
        console.error('Lookup POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
