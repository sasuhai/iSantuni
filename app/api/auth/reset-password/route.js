import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Sila masukkan alamat emel.' }, { status: 400 });
        }

        // Verify if user exists
        const users = await query('SELECT id, name FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            // Return success even if not found to prevent email enumeration
            return NextResponse.json({ success: true, message: 'Jika akaun wujud, pautan reset telah dihantar.' });
        }

        const user = users[0];

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // Delete old tokens for this email
        await query('DELETE FROM password_reset_tokens WHERE email = ?', [email]);

        // Insert new token
        await query(`
            INSERT INTO password_reset_tokens (id, email, token, expiresAt, createdAt)
            VALUES (UUID(), ?, ?, ?, NOW())
        `, [email, resetToken, expiresAt]);

        // Send email using Hostinger SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.hostinger.com',
            port: process.env.SMTP_PORT || 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Use custom host if deployed, otherwise localhost
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const resetLink = `${appUrl}/login?token=${resetToken}&email=${encodeURIComponent(email)}`;

        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"Admin iSantuni" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Reset Kata Laluan - iSantuni',
            html: `
                <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #059669;">Menetapkan Semula Kata Laluan</h2>
                    <p>Hai ${user.name || 'Pengguna'},</p>
                    <p>Kami menerima permohonan untuk menetapkan semula kata laluan anda bagi sistem HCF iSantuni.</p>
                    <p>Sila klik butang di bawah untuk menukar kata laluan anda:</p>
                    <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 25px 0; font-weight: bold;">Reset Kata Laluan</a>
                    <p>Pautan ini sah selama <strong>1 jam</strong> dari sekarang.</p>
                    <p>Jika anda tidak membuat permohonan ini, anda boleh mengabaikan emel ini. Kata laluan anda tidak akan ditukar.</p>
                    <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                    <p style="color: #888; font-size: 13px;">Terima kasih,<br>Pasukan Sistem HCF iSantuni</p>
                </div>
            `,
        });

        return NextResponse.json({ success: true, message: 'Pautan reset berjaya dihantar.' });

    } catch (error) {
        console.error('Reset Password API Error:', error);
        return NextResponse.json({ error: 'Ralat Pelayan: Gagal menghantar emel. Sila pastikan SMTP dikonfigurasi dengan betul.' }, { status: 500 });
    }
}
