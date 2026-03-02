import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
    try {
        const { email, token, newPassword } = await request.json();

        if (!email || !token || !newPassword) {
            return NextResponse.json({ error: 'Maklumat URL atau token tidak lengkap.' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Kata laluan mesti sekurang-kurangnya 6 aksara.' }, { status: 400 });
        }

        // Verify token exists and is valid
        const tokens = await query(`
            SELECT * FROM password_reset_tokens 
            WHERE email = ? AND token = ? AND expiresAt > NOW()
        `, [email, token]);

        if (tokens.length === 0) {
            return NextResponse.json({ error: 'Pautan reset telah tamat tempoh atau tidak sah. Sila mohon semula.' }, { status: 400 });
        }

        // Hash new password
        const passwordHash = await hashPassword(newPassword);

        // Update password in users table
        const updateResult = await query('UPDATE users SET password_hash = ?, updatedAt = NOW() WHERE email = ?', [passwordHash, email]);

        if (updateResult.affectedRows === 0) {
            return NextResponse.json({ error: 'Pengguna tidak dijumpai.' }, { status: 404 });
        }

        // Delete used token to prevent reuse
        await query('DELETE FROM password_reset_tokens WHERE email = ?', [email]);

        return NextResponse.json({ success: true, message: 'Kata laluan berjaya dikemaskini.' });

    } catch (error) {
        console.error('Update Password API Error:', error);
        return NextResponse.json({ error: 'Ralat Pelayan: ' + error.message }, { status: 500 });
    }
}
