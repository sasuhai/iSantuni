import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const order = searchParams.get('order') || 'name';
        const ascending = searchParams.get('ascending') === 'true';

        // Protected by client-side admin check in /pengguna, but in production,
        // you should verify session/role here as well.

        const allowedOrderCols = ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'];
        const orderCol = allowedOrderCols.includes(order) ? order : 'name';

        const sql = `SELECT id, email, name, role, assignedLocations, createdAt, updatedAt FROM users ORDER BY ${orderCol} ${ascending ? 'ASC' : 'DESC'}`;
        const results = await query(sql);

        // Parse assignedLocations if string
        const parsedResults = results.map(row => ({
            ...row,
            assignedLocations: typeof row.assignedLocations === 'string' ? JSON.parse(row.assignedLocations) : (row.assignedLocations || [])
        }));

        return NextResponse.json(parsedResults);
    } catch (error) {
        console.error('Users GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const body = await request.json();

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const fields = ['name', 'role', 'assignedLocations'];
        const updates = [];
        const params = [];

        fields.forEach(field => {
            if (body[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(field === 'assignedLocations' ? JSON.stringify(body[field]) : body[field]);
            }
        });

        if (updates.length === 0) return NextResponse.json({ message: 'No changes' });

        const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        await query(sql, [...params, id]);

        return NextResponse.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error('Users PUT Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
