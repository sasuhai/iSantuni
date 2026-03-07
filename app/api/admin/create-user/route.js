import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password, name, role, assignedLocations } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // 1. Check if user already exists
        const existingUsers = await query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
        }

        // 2. Hash password
        const password_hash = await hashPassword(password);
        const id = crypto.randomUUID();

        // 3. Insert into DB
        const sql = 'INSERT INTO users (id, email, password_hash, name, role, assignedLocations) VALUES (?, ?, ?, ?, ?, ?)';
        const params = [
            id,
            email,
            password_hash,
            name || '',
            role || 'editor',
            JSON.stringify(assignedLocations || [])
        ];

        await query(sql, params);

        return NextResponse.json({ id, message: 'User created successfully' });

    } catch (error) {
        console.error('Admin Create User Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
