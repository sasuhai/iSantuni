const fs = require('fs');
const path = './app/api/stats/dashboard/route.js';
let content = fs.readFileSync(path, 'utf8');

// replace content to include locationTrends, monthlyTrend, etc.
content = content.replace('stats.mualaf.trend = Object.entries(yearlyTrendMap)', `
    stats.mualaf.rawData = mualafData;

    stats.mualaf.monthlyTrend = Object.entries(monthlyTrendMap)
        .map(([key, data]) => ({ key, name: key, registrations: data.registrations, conversions: data.conversions }))
        .sort((a,b) => a.key.localeCompare(b.key));

    const formattedStateTrends = {};
    for (const [s, tMap] of Object.entries(stateTrendMap)) {
        formattedStateTrends[s] = Object.entries(tMap).map(([mon, vals]) => ({
            key: mon, name: mon, ...vals
        })).sort((a,b) => a.key.localeCompare(b.key));
    }
    stats.mualaf.stateTrends = formattedStateTrends;

    stats.mualaf.locationTrends = {}; // Not tracking this deeply right now, but we can

    stats.mualaf.trend = Object.entries(yearlyTrendMap)`);

fs.writeFileSync(path, content, 'utf8');
