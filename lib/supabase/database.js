/* 
  MARIADB MIGRATION COMPATIBILITY LAYER
  This file was originally calling Supabase directly. 
  It now routes all requests to our internal /api/ endpoints which connect to MariaDB.
*/

const apiFetch = async (endpoint, options = {}) => {
    const response = await fetch(`/api/${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
    }
    return response.json();
};

export const createSubmission = async (data, userId) => {
    try {
        const result = await apiFetch('mualaf', {
            method: 'POST',
            body: JSON.stringify({ ...data, createdBy: userId }),
        });
        return { id: result.id, error: null };
    } catch (error) {
        return { id: null, error: error.message };
    }
};

export const updateSubmission = async (id, data, userId) => {
    try {
        await apiFetch(`mualaf?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...data, updatedBy: userId }),
        });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

export const deleteSubmission = async (id) => {
    try {
        await apiFetch(`mualaf?id=${id}`, { method: 'DELETE' });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

export const getSubmission = async (id) => {
    try {
        const data = await apiFetch(`mualaf?id=${id}`);
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error.message };
    }
};

export const getSubmissions = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.state) params.append('state', filters.state);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.status) params.append('status', filters.status);

        const data = await apiFetch(`mualaf?${params.toString()}`);
        return { data, error: null, total: data.length };
    } catch (error) {
        return { data: [], error: error.message, total: 0 };
    }
};

export const getOverallDashboardStats = async (role = 'admin', profile = {}) => {
    try {
        let locations = '';
        if (profile?.assignedLocations) {
            try {
                const locs = typeof profile.assignedLocations === 'string'
                    ? JSON.parse(profile.assignedLocations)
                    : profile.assignedLocations;
                if (Array.isArray(locs)) {
                    locations = locs.join(',');
                } else if (typeof locs === 'string') {
                    locations = locs;
                }
            } catch (e) {
                console.error("Error parsing assignedLocations:", e);
                locations = String(profile.assignedLocations);
            }
        }
        const data = await apiFetch(`stats/dashboard?role=${role}&locations=${locations}`);
        return { data, error: null };
    } catch (error) {
        console.error("getOverallDashboardStats Error:", error);
        return { data: null, error: error.message };
    }
};

export const getLocations = async () => {
    try {
        const data = await apiFetch('lookup?table=locations');
        return { data: data.map(d => d.name), error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

export const getStates = async () => {
    try {
        const data = await apiFetch('lookup?table=states');
        return { data, error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

export const getLookupData = async (table) => {
    try {
        const data = await apiFetch(`lookup?table=${table}`);
        return { data, error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

export const createLookupItem = async (table, name, extraData = {}) => {
    try {
        const result = await apiFetch('lookup', {
            method: 'POST',
            body: JSON.stringify({ table, name, extraData }),
        });
        return { data: result, error: null };
    } catch (error) {
        return { data: null, error: error.message };
    }
};

export const updateLookupItem = async (table, id, name, extraData = {}) => {
    try {
        const result = await apiFetch('lookup', {
            method: 'PUT',
            body: JSON.stringify({ table, id, name, extraData }),
        });
        return { data: result, error: null };
    } catch (error) {
        return { data: null, error: error.message };
    }
};

export const deleteLookupItem = async (table, id) => {
    try {
        await apiFetch(`lookup?table=${table}&id=${id}`, {
            method: 'DELETE',
        });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};
export const getPrograms = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.tahun) params.append('tahun', filters.tahun);
        if (filters.bulan) params.append('bulan', filters.bulan);
        if (filters.negeri) params.append('negeri', filters.negeri);

        const data = await apiFetch(`programs?${params.toString()}`);
        return { data, error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

export const updateProgram = async (id, data) => {
    try {
        await apiFetch('programs', {
            method: 'PUT',
            body: JSON.stringify({ ...data, id }),
        });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

export const deleteProgram = async (id) => {
    try {
        await apiFetch(`programs?id=${id}`, { method: 'DELETE' });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

export const getClassesList = async () => {
    try {
        const data = await apiFetch('classes');
        return { data, error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

export const getClassLevels = async () => {
    return getLookupData('class_levels');
};

export const getClassTypes = async () => {
    return getLookupData('class_types');
};

export const getLocationsTable = async () => {
    return getLookupData('locations');
};

export const getWorkersList = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.peranan) params.append('peranan', filters.peranan);
        const data = await apiFetch(`workers?${params.toString()}`);
        return { data, error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

export const getOtherKPIs = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.year) params.append('year', filters.year);
        if (filters.state) params.append('state', filters.state);
        const data = await apiFetch(`other_kpis?${params.toString()}`);
        return { data, error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

export const getAttendance = async (classId, month) => {
    try {
        const data = await apiFetch(`attendance?classId=${classId}&month=${month}`);
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error.message };
    }
};

export const upsertAttendance = async (data) => {
    try {
        await apiFetch('attendance', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

export const fetchAll = async (queryBuilder) => {
    try {
        const { data, error } = await queryBuilder;
        return { data: data || [], error };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

export const getScoreboardStats = async (year) => {
    try {
        const data = await apiFetch(`other_kpis?category=kpi_utama&year=${year}`);
        const rawKpi = data.map(item => {
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
        return { data: { rawKpi }, error: null };
    } catch (error) {
        console.error("Scoreboard fetch error:", error);
        return { data: null, error: error.message };
    }
};
export const getRateCategories = async () => {
    try {
        const data = await apiFetch('lookup?table=rateCategories');
        return { data, error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

export const getRateCategoriesByType = async (jenis) => {
    try {
        const data = await apiFetch('lookup?table=rateCategories');
        const filtered = data.filter(d => d.jenis === jenis);
        return { data: filtered, error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

export const createRateCategory = async (data, userId) => {
    try {
        const result = await apiFetch('lookup', {
            method: 'POST',
            body: JSON.stringify({
                table: 'rateCategories',
                name: data.kategori,
                extraData: {
                    jenis: data.jenis,
                    jumlahElaun: data.jumlahElaun,
                    jenisPembayaran: data.jenisPembayaran,
                    createdBy: userId
                }
            }),
        });
        return { data: result, error: null };
    } catch (error) {
        return { data: null, error: error.message };
    }
};

export const updateRateCategory = async (id, data, userId) => {
    try {
        const result = await apiFetch('lookup', {
            method: 'PUT',
            body: JSON.stringify({
                table: 'rateCategories',
                id,
                name: data.kategori,
                extraData: {
                    jenis: data.jenis,
                    jumlahElaun: data.jumlahElaun,
                    jenisPembayaran: data.jenisPembayaran,
                    updatedBy: userId
                }
            }),
        });
        return { data: result, error: null };
    } catch (error) {
        return { data: null, error: error.message };
    }
};

export const initializeDefaultRates = async (defaults, userId) => {
    try {
        const { data: existing } = await getRateCategories();
        const existingNames = existing.map(r => r.kategori);

        for (const rate of defaults) {
            if (!existingNames.includes(rate.kategori)) {
                await createRateCategory(rate, userId);
            }
        }
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

export const deleteRateCategory = async (id) => {
    try {
        await apiFetch(`lookup?table=rateCategories&id=${id}`, { method: 'DELETE' });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};
