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

        // Initialize transporter with environment variables or safe defaults
        const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
        const smtpPort = parseInt(process.env.SMTP_PORT || '465');
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (!smtpUser || !smtpPass) {
            console.error('CRITICAL: SMTP credentials (USER/PASS) are missing in environment variables.');
            return NextResponse.json({
                error: 'Ralat Pelayan: Konfigurasi emel tidak lengkap di pihak pelayan. (Missing credentials)'
            }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify connection configuration
        try {
            await transporter.verify();
            console.log('SMTP connection verified successfully');
        } catch (smtpConfigError) {
            console.error('SMTP Config Error:', smtpConfigError);
            return NextResponse.json({
                error: `Ralat Konfigurasi Email: Gagal menyambung ke ${smtpHost}:${smtpPort} - ${smtpConfigError.message}`
            }, { status: 500 });
        }

        // Use custom host if deployed, otherwise localhost
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const resetLink = `${appUrl}/login?token=${resetToken}&email=${encodeURIComponent(email)}`;

        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || `"Admin iSantuni" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Reset Kata Laluan - iSantuni',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #059669;">Menetapkan Semula Kata Laluan</h2>
                        <p>Hai <strong>${user.name || 'Pengguna'}</strong>,</p>
                        <p>Kami menerima permohonan untuk menetapkan semula kata laluan anda bagi sistem iSantuni.</p>
                        <p>Sila klik butang di bawah untuk menukar kata laluan anda:</p>
                        <div style="text-align: center;">
                            <a href="${resetLink}" style="display: inline-block; padding: 14px 30px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: bold; font-size: 16px;">Reset Kata Laluan</a>
                        </div>
                        <p style="font-size: 14px; color: #666;">Pautan ini sah selama <strong>1 jam</strong> dari sekarang.</p>
                        <p style="font-size: 14px; color: #666;">Jika anda tidak membuat permohonan ini, anda boleh mengabaikan emel ini. Kata laluan anda tidak akan ditukar.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="color: #999; font-size: 12px; text-align: center;">Terima kasih,<br>Pasukan Sistem HCF iSantuni</p>
                    </div>
                `,
            });
            console.log('Reset email sent successfully to:', email);
        } catch (mailError) {
            console.error('Nodemailer Error:', mailError);
            return NextResponse.json({ error: 'Gagal menghantar emel: ' + mailError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Pautan reset berjaya dihantar.' });

    } catch (error) {
        console.error('Reset Password API Error:', error);
        return NextResponse.json({ error: 'Ralat Pelayan: ' + error.message }, { status: 500 });
    }
}
