import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        console.log('Login attempt for:', email);
        const users = await query('SELECT * FROM users WHERE email = ?', [email]);
        console.log('Users found:', users.length);

        if (users.length === 0) {
            console.log('Login failed: User not found');
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const user = users[0];
        console.log('User ID:', user.id);

        const passwordMatch = await verifyPassword(password, user.password_hash);
        console.log('Password match result:', passwordMatch);

        if (!passwordMatch) {
            console.log('Login failed: Password mismatch');
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // Prepare user document for response (excluding password hash)
        const { password_hash, ...userResponse } = user;

        // In a production environment, you would here:
        // 1. Generate a JWT token
        // 2. Set it in a secure HTTP-only cookie

        return NextResponse.json({
            user: {
                ...userResponse,
                assignedLocations: typeof user.assignedLocations === 'string' ? JSON.parse(user.assignedLocations) : user.assignedLocations
            },
            message: 'Logged in successfully'
        });

    } catch (error) {
        console.error('Login API Error:', error);
        return NextResponse.json({
            error: 'Ralat Pelayan (Server Error): ' + error.message,
            details: error.code // Will show 'ECONNREFUSED' etc.
        }, { status: 500 });
    }
}
