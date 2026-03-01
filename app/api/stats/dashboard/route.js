import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role') || 'editor';
        const assignedLocations = searchParams.get('locations')?.split(',') || [];

        const stats = {
            mualaf: { total: 0, byState: [], byStateCounts: {}, stateTrends: {}, trend: [], recent: [] },
            classes: { total: 0, byState: {} },
            workers: { total: 0, byRole: {} },
            attendance: { trend: [] }
        };

        const isRestricted = role !== 'admin' && !assignedLocations.includes('All');

        // 1. Fetch Mualaf (Submissions)
        let mualafSql = "SELECT id, negeriCawangan, createdAt, lokasi, namaPenuh, namaAsal, status, bangsa, tarikhPengislaman, kategori FROM submissions WHERE status = 'active'";
        let mualafParams = [];

        if (isRestricted && assignedLocations.length > 0) {
            mualafSql += ` AND lokasi IN (${assignedLocations.map(() => '?').join(',')})`;
            mualafParams.push(...assignedLocations);
        }
        mualafSql += " ORDER BY createdAt DESC";

        const mualafData = await query(mualafSql, mualafParams);

        // Process Mualaf logic (Yearly/Monthly Trends)
        const now = new Date();
        const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        let absMinYear = 2012;
        mualafData.forEach(item => {
            if (item.createdAt) {
                const y = new Date(item.createdAt).getFullYear();
                if (y < absMinYear && y > 1900) absMinYear = y;
            }
        });

        const minYear = absMinYear;
        const currentYear = now.getFullYear();
        stats.mualaf.availableYears = Array.from({ length: currentYear - minYear + 1 }, (_, i) => minYear + i);

        const yearlyTrendMap = {};
        for (let y = minYear; y <= currentYear; y++) {
            yearlyTrendMap[y] = { registrations: 0, conversions: 0 };
        }

        const monthlyTrendMap = {};
        let tempDate = new Date(minYear, 0, 1);
        while (tempDate <= now) {
            const key = getMonthKey(tempDate);
            monthlyTrendMap[key] = { registrations: 0, conversions: 0 };
            tempDate.setMonth(tempDate.getMonth() + 1);
        }

        const mualafByLocation = {};
        const stateTrendMap = {};
        stats.mualaf.total = mualafData.length;

        mualafData.forEach(item => {
            const state = item.negeriCawangan || 'Lain-lain';
            stats.mualaf.byStateCounts[state] = (stats.mualaf.byStateCounts[state] || 0) + 1;

            const loc = item.lokasi || 'Tiada Lokasi';
            mualafByLocation[loc] = (mualafByLocation[loc] || 0) + 1;

            if (item.createdAt) {
                const date = new Date(item.createdAt);
                const year = date.getFullYear();
                const monKey = getMonthKey(date);

                if (yearlyTrendMap[year]) yearlyTrendMap[year].registrations++;
                if (monthlyTrendMap[monKey]) monthlyTrendMap[monKey].registrations++;

                if (monthlyTrendMap[monKey]) {
                    if (!stateTrendMap[state]) stateTrendMap[state] = {};
                    if (!stateTrendMap[state][monKey]) stateTrendMap[state][monKey] = { registrations: 0, conversions: 0 };
                    stateTrendMap[state][monKey].registrations++;
                }
            }

            if (item.kategori === 'Pengislaman') {
                const convDateStr = item.tarikhPengislaman || item.createdAt;
                if (convDateStr) {
                    const date = new Date(convDateStr);
                    const year = date.getFullYear();
                    const monKey = getMonthKey(date);
                    if (yearlyTrendMap[year]) yearlyTrendMap[year].conversions++;
                    if (monthlyTrendMap[monKey]) monthlyTrendMap[monKey].conversions++;

                    if (monthlyTrendMap[monKey]) {
                        if (!stateTrendMap[state]) stateTrendMap[state] = {};
                        if (!stateTrendMap[state][monKey]) stateTrendMap[state][monKey] = { registrations: 0, conversions: 0 };
                        stateTrendMap[state][monKey].conversions++;
                    }
                }
            }
        });

        const monthNames = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];

        // Recent 5
        stats.mualaf.recent = mualafData.slice(0, 5).map(item => ({
            ...item,
            displayName: item.namaPenuh || item.namaAsal || 'Tiada Nama'
        }));

        stats.mualaf.byState = Object.entries(stats.mualaf.byStateCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, value]) => ({ name, value }));

        stats.mualaf.trend = Object.entries(yearlyTrendMap)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([year, data]) => ({
                name: year,
                registrations: data.registrations,
                conversions: data.conversions
            }));

        // 2. Classes
        let classSql = "SELECT * FROM classes";
        let classParams = [];
        if (isRestricted && assignedLocations.length > 0) {
            classSql += ` WHERE lokasi IN (${assignedLocations.map(() => '?').join(',')})`;
            classParams.push(...assignedLocations);
        }
        const classData = await query(classSql, classParams);
        stats.classes.total = classData.length;

        // 3. Workers
        let workerSql = "SELECT * FROM workers";
        let workerParams = [];
        if (isRestricted && assignedLocations.length > 0) {
            workerSql += ` WHERE lokasi IN (${assignedLocations.map(() => '?').join(',')})`;
            workerParams.push(...assignedLocations);
        }
        const workerData = await query(workerSql, workerParams);
        stats.workers.total = workerData.length;

        return NextResponse.json(stats);

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
