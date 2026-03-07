import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        // 1. Check if user exists
        const users = await query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. Delete user from DB
        await query('DELETE FROM users WHERE id = ?', [id]);

        return NextResponse.json({ message: 'User deleted successfully' });

    } catch (error) {
        console.error('Admin Delete User Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
