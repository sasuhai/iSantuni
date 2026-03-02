import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        console.log(`🛠 Deleting local user ${id} from MariaDB...`);

        // 1. Delete from MariaDB 'users' table
        try {
            await query('DELETE FROM users WHERE id = ?', [id]);
            console.log(`✅ User profile deleted from MariaDB.`);
        } catch (dbError) {
            console.error('❌ MariaDB Delete Error:', dbError.message);
            return NextResponse.json({ error: "Database error: " + dbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('❌ Unhandled Exception:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
