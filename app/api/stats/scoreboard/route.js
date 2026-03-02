import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year') || new Date().getFullYear();

        // 1. Fetch from other_kpis where category is 'kpi_utama'
        // This contains actual performance data
        const kpiSql = "SELECT id, category, year, state, month, data, createdAt FROM other_kpis WHERE category = 'kpi_utama' AND year = ?";
        const kpiData = await query(kpiSql, [year]);

        // 2. Fetch from kpi_settings
        // This contains targets
        const settingsSql = "SELECT id, kpi_name, category, target, year FROM kpi_settings WHERE year = ? OR year IS NULL";
        const settingsData = await query(settingsSql, [year]);

        // Merge logic: in the frontend, it expects stats.rawKpi to be an array of objects with:
        // kpi_name, jenis (category), sasaran (target), pencapaian (actual), month

        // Let's transform and merge
        const results = [];

        // For each kpi_utama record in other_kpis:
        kpiData.forEach(item => {
            let parsedData = {};
            try {
                parsedData = typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {});
            } catch (e) {
                console.error('Error parsing KPI data:', e);
            }

            // A 'kpi_utama' record typically has fields like 'nama_kpi', 'sasaran', 'pencapaian'
            // or it might be structured differently based on the UI.
            // Based on scoreboard page logic, it looks for:
            // kpi.kpi_name, kpi.jenis, kpi.sasaran, kpi.pencapaian, kpi.month

            results.push({
                id: item.id,
                kpi_name: parsedData.nama_kpi || parsedData.kpi_name || 'KPI Tanpa Nama',
                jenis: parsedData.jenis || parsedData.category || 'MUALAF',
                sasaran: parseFloat(parsedData.sasaran || 0),
                pencapaian: parseFloat(parsedData.pencapaian || 0),
                month: item.month,
                state: item.state,
                year: item.year
            });
        });

        // Also include targets from kpi_settings if they aren't already represented
        // (Though usually kpi_utama maps to these)

        return NextResponse.json({
            rawKpi: results,
            settings: settingsData
        });

    } catch (error) {
        console.error('Scoreboard Stats Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
