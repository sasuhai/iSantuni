import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // The log file is in the root of the nodejs app directory
        // In standalone mode, process.cwd() should point to the standalone folder
        const logPath = path.join(process.cwd(), 'deployment_history.log');

        if (!fs.existsSync(logPath)) {
            return NextResponse.json({ history: [] });
        }

        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.trim().split('\n').reverse(); // Newest first

        return NextResponse.json({ history: lines });
    } catch (error) {
        console.error('Error reading deployment log:', error);
        return NextResponse.json({ error: 'Failed to read deployment history' }, { status: 500 });
    }
}
