import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const ALLOWED_TABLES = [
    'states', 'locations', 'class_levels', 'class_types', 'races',
    'religions', 'banks', 'program_status', 'program_categories',
    'program_organizers', 'program_types', 'rateCategories', 'users'
];

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const table = searchParams.get('table');
        const id = searchParams.get('id');

        if (!table) {
            return NextResponse.json({ error: 'Table name is required' }, { status: 400 });
        }

        if (!ALLOWED_TABLES.includes(table)) {
            return NextResponse.json({ error: 'Invalid table' }, { status: 403 });
        }

        if (id) {
            const results = await query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
            if (results.length > 0) {
                const item = results[0];
                if (table === 'states' && typeof item.cawangan === 'string') {
                    try { item.cawangan = JSON.parse(item.cawangan); } catch (e) { item.cawangan = []; }
                }
                if (table === 'users' && typeof item.assignedLocations === 'string') {
                    try { item.assignedLocations = JSON.parse(item.assignedLocations); } catch (e) { item.assignedLocations = []; }
                }
                return NextResponse.json(item);
            }
            return NextResponse.json(null);
        } else {
            const orderCol = table === 'rateCategories' ? 'kategori' : 'name';
            const results = await query(`SELECT * FROM ${table} ORDER BY ${orderCol} ASC`);
            const parsedResults = results.map(item => {
                if (table === 'states' && typeof item.cawangan === 'string') {
                    try { item.cawangan = JSON.parse(item.cawangan); } catch (e) { item.cawangan = []; }
                }
                if (table === 'users' && typeof item.assignedLocations === 'string') {
                    try { item.assignedLocations = JSON.parse(item.assignedLocations); } catch (e) { item.assignedLocations = []; }
                }
                return item;
            });
            return NextResponse.json(parsedResults, {
                headers: { 'x-total-count': results.length.toString() }
            });
        }

    } catch (error) {
        console.error('Lookup GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { table, name, extraData } = await request.json();

        if (!ALLOWED_TABLES.includes(table)) {
            return NextResponse.json({ error: 'Invalid table' }, { status: 403 });
        }

        const keys = ['name'];
        const values = [name];

        if (extraData) {
            Object.entries(extraData).forEach(([key, val]) => {
                keys.push(key);
                values.push(Array.isArray(val) ? JSON.stringify(val) : val);
            });
        }

        const placeholders = keys.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

        const result = await query(sql, values);
        return NextResponse.json({ id: result.insertId, message: 'Created successfully' });

    } catch (error) {
        console.error('Lookup POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { table, id, name, extraData } = await request.json();

        if (!ALLOWED_TABLES.includes(table)) {
            return NextResponse.json({ error: 'Invalid table' }, { status: 403 });
        }

        const updates = ['name = ?'];
        const values = [name];

        if (extraData) {
            Object.entries(extraData).forEach(([key, val]) => {
                updates.push(`${key} = ?`);
                values.push(Array.isArray(val) ? JSON.stringify(val) : val);
            });
        }

        values.push(id);
        const sql = `UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`;

        await query(sql, values);
        return NextResponse.json({ message: 'Updated successfully' });

    } catch (error) {
        console.error('Lookup PUT Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const table = searchParams.get('table');
        const id = searchParams.get('id');

        if (!ALLOWED_TABLES.includes(table)) {
            return NextResponse.json({ error: 'Invalid table' }, { status: 403 });
        }

        await query(`DELETE FROM ${table} WHERE id = ?`, [id]);
        return NextResponse.json({ message: 'Deleted successfully' });

    } catch (error) {
        console.error('Lookup DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
