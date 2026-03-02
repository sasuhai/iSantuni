import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password, name, role, assignedLocations } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        console.log(`🛠 Creating local user: ${email}`);

        // 1. Hash Password
        const passwordHash = await hashPassword(password);
        const userId = crypto.randomUUID();

        // 2. Insert into MariaDB 'users' table
        try {
            const mysqlSql = `INSERT INTO users (id, email, password_hash, name, role, assignedLocations, createdAt, updatedAt) 
                             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`;
            const params = [
                userId,
                email,
                passwordHash,
                name || '',
                role || 'editor',
                JSON.stringify(assignedLocations || [])
            ];

            await query(mysqlSql, params);
            console.log(`✅ User profile created in MariaDB.`);

            return NextResponse.json({ success: true, user: { id: userId, email, name, role } });

        } catch (dbError) {
            console.error('❌ MariaDB Error:', dbError.message);
            if (dbError.code === 'ER_DUP_ENTRY') {
                return NextResponse.json({ error: "E-mel ini telah wujud dalam pangkalan data." }, { status: 400 });
            }
            return NextResponse.json({ error: "Database error: " + dbError.message }, { status: 500 });
        }

    } catch (err) {
        console.error('❌ Unhandled Exception:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
