import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role') || 'editor';
        const assignedLocations = searchParams.get('locations')?.split(',') || [];

        const stats = {
            mualaf: {
                total: 0,
                byState: [],
                byStateCounts: {},
                stateTrends: {},
                stateStats: {}, // Added for map-intelligence
                locationStats: {}, // Added for map-intelligence
                trend: [],
                recent: []
            },
            classes: { total: 0, byState: {} },
            workers: { total: 0, byRole: {} },
            attendance: { trend: [] }
        };

        const isRestricted = role !== 'admin' && !assignedLocations.includes('All');

        // 1. Fetch Mualaf (Submissions)
        let mualafSql = "SELECT id, negeriCawangan, createdAt, lokasi, namaPenuh, namaAsal, status, bangsa, tarikhPengislaman, kategori FROM mualaf WHERE status = 'active'";
        let mualafParams = [];

        if (isRestricted) {
            if (assignedLocations.length > 0) {
                mualafSql += ` AND lokasi IN (${assignedLocations.map(() => '?').join(',')})`;
                mualafParams.push(...assignedLocations);
            } else {
                // If restricted but no locations assigned, they should see NOTHING
                mualafSql += " AND 1=0";
            }
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
        const stateTrendMap = {};
        const locationTrendMap = {};

        // Pre-fill monthly trend map for the last 5 years or since minYear
        let tempDate = new Date(minYear, 0, 1);
        while (tempDate <= now) {
            const key = getMonthKey(tempDate);
            monthlyTrendMap[key] = { registrations: 0, conversions: 0 };
            tempDate.setMonth(tempDate.getMonth() + 1);
        }

        stats.mualaf.total = mualafData.length;
        stats.mualaf.rawData = mualafData;

        mualafData.forEach(item => {
            const state = item.negeriCawangan || 'Lain-lain';
            stats.mualaf.byStateCounts[state] = (stats.mualaf.byStateCounts[state] || 0) + 1;

            const loc = item.lokasi || 'Tiada Lokasi';

            // Initialize stateStats for map-intelligence
            if (!stats.mualaf.stateStats[state]) {
                stats.mualaf.stateStats[state] = { registrations: 0, conversions: 0 };
            }
            stats.mualaf.stateStats[state].registrations++;

            // Initialize locationStats for map-intelligence
            if (!stats.mualaf.locationStats[loc]) {
                stats.mualaf.locationStats[loc] = { registrations: 0, conversions: 0 };
            }
            stats.mualaf.locationStats[loc].registrations++;

            if (item.createdAt) {
                const date = new Date(item.createdAt);
                const year = date.getFullYear();
                const monKey = getMonthKey(date);

                if (yearlyTrendMap[year]) yearlyTrendMap[year].registrations++;
                if (monthlyTrendMap[monKey]) monthlyTrendMap[monKey].registrations++;

                // State Trend logic
                if (!stateTrendMap[state]) stateTrendMap[state] = {};
                if (!stateTrendMap[state][monKey]) stateTrendMap[state][monKey] = { registrations: 0, conversions: 0 };
                stateTrendMap[state][monKey].registrations++;

                // Location Trend logic
                if (!locationTrendMap[loc]) locationTrendMap[loc] = {};
                if (!locationTrendMap[loc][monKey]) locationTrendMap[loc][monKey] = { registrations: 0, conversions: 0 };
                locationTrendMap[loc][monKey].registrations++;
            }

            if (item.kategori === 'Pengislaman') {
                const convDateStr = item.tarikhPengislaman || item.createdAt;
                if (convDateStr) {
                    const date = new Date(convDateStr);
                    const year = date.getFullYear();
                    const monKey = getMonthKey(date);
                    if (yearlyTrendMap[year]) yearlyTrendMap[year].conversions++;
                    if (monthlyTrendMap[monKey]) monthlyTrendMap[monKey].conversions++;

                    if (monKey) {
                        if (!stateTrendMap[state]) stateTrendMap[state] = {};
                        if (!stateTrendMap[state][monKey]) stateTrendMap[state][monKey] = { registrations: 0, conversions: 0 };
                        stateTrendMap[state][monKey].conversions++;

                        if (!locationTrendMap[loc]) locationTrendMap[loc] = {};
                        if (!locationTrendMap[loc][monKey]) locationTrendMap[loc][monKey] = { registrations: 0, conversions: 0 };
                        locationTrendMap[loc][monKey].conversions++;
                    }

                    // Count conversions for map-intelligence
                    if (stats.mualaf.stateStats[state]) {
                        stats.mualaf.stateStats[state].conversions++;
                    }
                    if (stats.mualaf.locationStats[loc]) {
                        stats.mualaf.locationStats[loc].conversions++;
                    }
                }
            }
        });

        const monthNamesShort = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];

        // Format Trends for Frontend
        const formatTrendObj = (map) => Object.entries(map)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, data]) => {
                const [y, m] = key.split('-');
                return {
                    key,
                    name: `${monthNamesShort[parseInt(m) - 1]} ${y}`,
                    registrations: data.registrations,
                    conversions: data.conversions
                };
            });

        stats.mualaf.monthlyTrend = formatTrendObj(monthlyTrendMap);

        stats.mualaf.stateTrends = {};
        Object.keys(stateTrendMap).forEach(state => {
            stats.mualaf.stateTrends[state] = formatTrendObj(stateTrendMap[state]);
        });

        stats.mualaf.locationTrends = {};
        Object.keys(locationTrendMap).forEach(loc => {
            stats.mualaf.locationTrends[loc] = formatTrendObj(locationTrendMap[loc]);
        });

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
        if (isRestricted) {
            if (assignedLocations.length > 0) {
                classSql += ` WHERE lokasi IN (${assignedLocations.map(() => '?').join(',')})`;
                classParams.push(...assignedLocations);
            } else {
                classSql += " WHERE 1=0";
            }
        }
        const classData = await query(classSql, classParams);
        stats.classes.total = classData.length;

        // 3. Workers
        let workerSql = "SELECT * FROM workers";
        let workerParams = [];
        if (isRestricted) {
            if (assignedLocations.length > 0) {
                workerSql += ` WHERE lokasi IN (${assignedLocations.map(() => '?').join(',')})`;
                workerParams.push(...assignedLocations);
            } else {
                workerSql += " WHERE 1=0";
            }
        }
        const workerData = await query(workerSql, workerParams);
        stats.workers.total = workerData.length;

        // 4. Attendance Trends
        const attendanceData = await query("SELECT year, month, students, workers FROM attendance_records");
        const attendTrendMap = {};
        attendanceData.forEach(row => {
            const key = `${row.year}-${String(row.month).padStart(2, '0')}`;
            if (!attendTrendMap[key]) {
                attendTrendMap[key] = { mualafCount: 0, workerCount: 0, mualafVisits: 0, workerVisits: 0 };
            }
            try {
                const students = JSON.parse(row.students || '[]');
                const workers = JSON.parse(row.workers || '[]');
                attendTrendMap[key].mualafCount += students.length;
                attendTrendMap[key].workerCount += workers.length;
                attendTrendMap[key].mualafVisits += students.filter(s => s.attended).length;
                attendTrendMap[key].workerVisits += workers.filter(w => w.attended).length;
            } catch (e) { }
        });

        stats.attendance.trend = Object.entries(attendTrendMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, data]) => {
                const [y, m] = key.split('-');
                return {
                    key,
                    name: `${monthNamesShort[parseInt(m) - 1]} ${y}`,
                    ...data
                };
            });

        return NextResponse.json(stats);

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
