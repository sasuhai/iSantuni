import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role') || 'editor';
        const assignedLocations = searchParams.get('locations')?.split(',') || [];

        const stats = {
            mualaf: { total: 0, byState: [], byStateCounts: {}, stateStats: {}, locationStats: {}, stateTrends: {}, trend: [], recent: [] },
            classes: { total: 0, byState: {} },
            workers: { total: 0, byRole: {} },
            attendance: { trend: [] }
        };

        const isRestricted = role !== 'admin' && !assignedLocations.includes('All');

        // 1. Fetch Mualaf (Submissions)
        let mualafSql = "SELECT id, negeriCawangan, createdAt, lokasi, namaPenuh, namaAsal, status, bangsa, tarikhPengislaman, kategori FROM mualaf WHERE status = 'active'";
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

        let absMinYear = now.getFullYear();
        mualafData.forEach(item => {
            if (item.createdAt) {
                const date = new Date(item.createdAt);
                const y = date.getFullYear();
                if (y > 1900 && y < absMinYear) absMinYear = y;
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
        const locationTrendMap = {};
        stats.mualaf.total = mualafData.length;

        mualafData.forEach(item => {
            const state = item.negeriCawangan || 'Lain-lain';
            stats.mualaf.byStateCounts[state] = (stats.mualaf.byStateCounts[state] || 0) + 1;

            const loc = item.lokasi || 'Tiada Lokasi';
            mualafByLocation[loc] = (mualafByLocation[loc] || 0) + 1;

            // Map Stats
            if (!stats.mualaf.stateStats[state]) stats.mualaf.stateStats[state] = { registrations: 0, conversions: 0 };
            stats.mualaf.stateStats[state].registrations++;

            if (!stats.mualaf.locationStats[loc]) stats.mualaf.locationStats[loc] = { registrations: 0, conversions: 0 };
            stats.mualaf.locationStats[loc].registrations++;

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

                    if (!locationTrendMap[loc]) locationTrendMap[loc] = {};
                    if (!locationTrendMap[loc][monKey]) locationTrendMap[loc][monKey] = { registrations: 0, conversions: 0 };
                    locationTrendMap[loc][monKey].registrations++;
                }
            }

            if (item.kategori === 'Pengislaman') {
                stats.mualaf.stateStats[state].conversions++;
                stats.mualaf.locationStats[loc].conversions++;

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

                        if (!locationTrendMap[loc]) locationTrendMap[loc] = {};
                        if (!locationTrendMap[loc][monKey]) locationTrendMap[loc][monKey] = { registrations: 0, conversions: 0 };
                        locationTrendMap[loc][monKey].conversions++;
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


        stats.mualaf.rawData = mualafData;

        stats.mualaf.monthlyTrend = Object.entries(monthlyTrendMap)
            .map(([key, data]) => ({ key, name: key, registrations: data.registrations, conversions: data.conversions }))
            .sort((a, b) => a.key.localeCompare(b.key));

        const formattedStateTrends = {};
        for (const [s, tMap] of Object.entries(stateTrendMap)) {
            formattedStateTrends[s] = Object.entries(tMap).map(([mon, vals]) => ({
                key: mon, name: mon, ...vals
            })).sort((a, b) => a.key.localeCompare(b.key));
        }
        stats.mualaf.stateTrends = formattedStateTrends;

        const formattedLocationTrends = {};
        for (const [loc, tMap] of Object.entries(locationTrendMap)) {
            formattedLocationTrends[loc] = Object.entries(tMap).map(([mon, vals]) => ({
                key: mon, name: mon, ...vals
            })).sort((a, b) => a.key.localeCompare(b.key));
        }
        stats.mualaf.locationTrends = formattedLocationTrends;

        stats.mualaf.trend = Object.entries(yearlyTrendMap)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([year, data]) => ({
                name: year,
                registrations: data.registrations,
                conversions: data.conversions
            }));

        stats.mualaf.rawData = mualafData;

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

        // 4. Attendance
        let accSql = "SELECT month, students, workers FROM attendance_records";
        const accData = await query(accSql);
        const attendanceMap = {};

        accData.forEach(item => {
            const m = item.month;
            if (!m) return;
            if (!attendanceMap[m]) {
                attendanceMap[m] = { mualafCount: 0, mualafVisits: 0, workerCount: 0, workerVisits: 0 };
            }
            try {
                const studs = typeof item.students === 'string' ? JSON.parse(item.students) : (item.students || []);
                attendanceMap[m].mualafCount += studs.length;
                let mVisits = 0;
                studs.forEach(s => mVisits += (s.attendance || []).length);
                attendanceMap[m].mualafVisits += mVisits;

                const wrks = typeof item.workers === 'string' ? JSON.parse(item.workers) : (item.workers || []);
                attendanceMap[m].workerCount += wrks.length;
                let wVisits = 0;
                wrks.forEach(w => wVisits += (w.attendance || []).length);
                attendanceMap[m].workerVisits += wVisits;
            } catch (e) { }
        });

        stats.attendance.trend = Object.entries(attendanceMap).map(([key, vals]) => ({
            key, name: key, ...vals
        })).sort((a, b) => a.key.localeCompare(b.key));

        return NextResponse.json(stats);

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
