import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const table = searchParams.get('table');
        const id = searchParams.get('id');
        console.log(`Lookup GET Table:`, table, `ID:`, id);

        if (!table) return NextResponse.json({ error: 'Table name is required' }, { status: 400 });

        const allowedTables = ['states', 'locations', 'class_levels', 'class_types', 'rateCategories', 'banks', 'program_status', 'program_categories', 'program_organizers', 'program_types', 'races', 'religions', 'users', 'kawasan_cawangan', 'sub_kategori', 'workers', 'classes', 'kpi_settings'];
        if (!allowedTables.includes(table)) return NextResponse.json({ error: 'Invalid table' }, { status: 403 });

        let sql, params;
        if (id) {
            sql = `SELECT * FROM ${table} WHERE id = ?`;
            params = [id];
        } else {
            sql = `SELECT * FROM ${table}`;

            // Handle sorting from parameters or defaults
            const orderParam = searchParams.get('_order');
            const dirParam = searchParams.get('_dir') || 'ASC';

            let orderBy = orderParam || 'name';

            // Special cases for tables with different default columns
            if (!orderParam) {
                if (table === 'workers' || table === 'classes') orderBy = 'nama';
                else if (table === 'rateCategories') orderBy = 'kategori';
                else if (table === 'kpi_settings') orderBy = 'category';
            }

            // Safety check for basic columns
            const resultsForColumns = await query(`DESCRIBE ${table}`, []);
            const validColumns = resultsForColumns.map(c => c.Field);
            if (!validColumns.includes(orderBy)) {
                orderBy = validColumns.includes('name') ? 'name' : (validColumns.includes('nama') ? 'nama' : (validColumns.includes('category') ? 'category' : validColumns[0]));
            }

            sql += ` ORDER BY \`${orderBy}\` ${dirParam.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
            params = [];
        }

        const results = await query(sql, params);

        // Parse JSON fields if necessary
        const processedResults = results.map(row => {
            const newRow = { ...row };
            if (table === 'users' && newRow.assignedLocations && typeof newRow.assignedLocations === 'string') {
                try { newRow.assignedLocations = JSON.parse(newRow.assignedLocations); } catch (e) { }
            }
            if (table === 'states' && newRow.cawangan && typeof newRow.cawangan === 'string') {
                try { newRow.cawangan = JSON.parse(newRow.cawangan); } catch (e) { }
            }
            return newRow;
        });

        // If searching for a single record, return just that object
        if (id) {
            return NextResponse.json(processedResults[0] || null);
        }

        return NextResponse.json(processedResults);
    } catch (error) {
        console.error('Lookup GET Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { table, name, extraData } = await request.json();
        const allowedTables = ['states', 'locations', 'class_levels', 'class_types', 'rateCategories', 'banks', 'program_status', 'program_categories', 'program_organizers', 'program_types', 'races', 'religions', 'users', 'kawasan_cawangan', 'sub_kategori', 'workers', 'classes', 'kpi_settings'];
        if (!allowedTables.includes(table)) return NextResponse.json({ error: 'Invalid table' }, { status: 403 });

        let sql, params;
        if (table === 'rateCategories') {
            sql = `INSERT INTO rateCategories (id, kategori, jenis, jumlahElaun, jenisPembayaran, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;
            params = [crypto.randomUUID(), name, extraData?.jenis || 'mualaf', extraData?.jumlahElaun || 0, extraData?.jenisPembayaran || 'bayaran/kelas'];
        } else {
            const columns = ['name', ...Object.keys(extraData || {})];
            const placeholders = columns.map(() => '?').join(', ');
            sql = `INSERT INTO ${table} (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`;
            params = [name, ...Object.values(extraData || {}).map(v => typeof v === 'object' ? JSON.stringify(v) : v)];
        }

        const result = await query(sql, params);
        return NextResponse.json({ id: result.insertId || params[0], message: 'Created successfully' });
    } catch (error) {
        console.error('Lookup POST Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const table = searchParams.get('table');
        const id = searchParams.get('id');
        const data = await request.json();

        if (!table || !id) return NextResponse.json({ error: 'Table and ID required' }, { status: 400 });

        const allowedTables = ['states', 'locations', 'class_levels', 'class_types', 'rateCategories', 'banks', 'program_status', 'program_categories', 'program_organizers', 'program_types', 'races', 'religions', 'users', 'kawasan_cawangan', 'sub_kategori', 'workers', 'classes', 'kpi_settings'];
        if (!allowedTables.includes(table)) return NextResponse.json({ error: 'Invalid table' }, { status: 403 });

        let sql, params;
        if (table === 'rateCategories') {
            sql = `UPDATE rateCategories SET kategori = ?, jenis = ?, jumlahElaun = ?, jenisPembayaran = ?, updatedAt = NOW() WHERE id = ?`;
            params = [data.kategori || data.name, data.jenis, data.jumlahElaun || 0, data.jenisPembayaran || 'bayaran/kelas', id];
        } else {
            const columns = Object.keys(data);
            const setClause = columns.map(col => `\`${col}\` = ?`).join(', ');
            sql = `UPDATE \`${table}\` SET ${setClause} WHERE id = ?`;
            params = [...Object.values(data).map(v => typeof v === 'object' ? JSON.stringify(v) : v), id];
        }

        await query(sql, params);
        return NextResponse.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error('Lookup PUT Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const table = searchParams.get('table');
        const id = searchParams.get('id');

        if (!table || !id) return NextResponse.json({ error: 'Table and ID required' }, { status: 400 });

        const allowedTables = ['states', 'locations', 'class_levels', 'class_types', 'rateCategories', 'banks', 'program_status', 'program_categories', 'program_organizers', 'program_types', 'races', 'religions', 'users', 'kawasan_cawangan', 'sub_kategori', 'workers', 'classes', 'kpi_settings'];
        if (!allowedTables.includes(table)) return NextResponse.json({ error: 'Invalid table' }, { status: 403 });

        await query(`DELETE FROM ${table} WHERE id = ?`, [id]);
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Lookup DELETE Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
