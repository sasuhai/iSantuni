const http = require('http');

http.get('http://localhost:3000/api/other_kpis?category=kpi_utama&year=2026', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const result = JSON.parse(data);
        const rawKpi = result.map(item => {
            const d = item.data || {};
            return {
                id: item.id,
                kpi_name: d.kpi || 'Tiada Nama',
                jenis: d.jenis || '-',
                sasaran: Number(d.sasaran) || 0,
                pencapaian: Number(d.pencapaian) || 0,
                month: item.month || d.month || null,
                year: item.year
            };
        });
        console.log(JSON.stringify(rawKpi, null, 2));
    });
});
