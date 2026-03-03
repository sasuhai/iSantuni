/* 
  MARIADB MIGRATION COMPATIBILITY LAYER - v1.1
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

const createSubmission = async (data, userId) => {
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

const updateSubmission = async (id, data, userId) => {
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

const deleteSubmission = async (id) => {
    try {
        await apiFetch(`mualaf?id=${id}`, { method: 'DELETE' });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

const getSubmission = async (id) => {
    try {
        const data = await apiFetch(`mualaf?id=${id}`);
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error.message };
    }
};

const getSubmissions = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        // Map to MariaDB column names
        if (filters.category) params.append('kategori', filters.category);
        if (filters.state) params.append('negeriCawangan', filters.state);
        if (filters.startDate) params.append('tarikhPengislaman_gte', filters.startDate);
        if (filters.endDate) params.append('tarikhPengislaman_lte', filters.endDate);
        if (filters.status) params.append('status', filters.status);

        const data = await apiFetch(`mualaf?${params.toString()}`);
        return { data, error: null, total: data.length };
    } catch (error) {
        return { data: [], error: error.message, total: 0 };
    }
};

const getOverallDashboardStats = async (role = 'admin', profile = {}) => {
    try {
        const locations = profile?.assignedLocations?.join(',') || '';
        const data = await apiFetch(`stats/dashboard?role=${role}&locations=${locations}`);
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error.message };
    }
};

const getLocations = async () => {
    try {
        const data = await apiFetch('lookup?table=locations');
        return { data: data.map(d => d.name), error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

const getStates = async () => {
    try {
        const data = await apiFetch('lookup?table=states');
        return { data, error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

const getLookupData = async (table) => {
    try {
        const data = await apiFetch(`lookup?table=${table}`);
        return { data, error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

const createLookupItem = async (table, name, extraData = {}) => {
    try {
        await apiFetch('lookup', {
            method: 'POST',
            body: JSON.stringify({ table, name, extraData }),
        });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

const updateLookupItem = async (table, id, name, extraData = {}) => {
    try {
        await apiFetch(`lookup?table=${table}&id=${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, ...extraData }),
        });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

const deleteLookupItem = async (table, id) => {
    try {
        await apiFetch(`lookup?table=${table}&id=${id}`, { method: 'DELETE' });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

const getRateCategories = async () => {
    try {
        const data = await apiFetch('lookup?table=rateCategories');
        return { data, error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

const createRateCategory = async (data) => {
    try {
        await apiFetch('lookup', {
            method: 'POST',
            body: JSON.stringify({
                table: 'rateCategories',
                name: data.kategori,
                extraData: {
                    jenis: data.jenis,
                    jumlahElaun: data.jumlahElaun,
                    jenisPembayaran: data.jenisPembayaran
                }
            }),
        });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

const updateRateCategory = async (id, data) => {
    try {
        await apiFetch(`lookup?table=rateCategories&id=${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                kategori: data.kategori,
                jenis: data.jenis,
                jumlahElaun: data.jumlahElaun,
                jenisPembayaran: data.jenisPembayaran
            }),
        });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

const deleteRateCategory = async (id) => {
    try {
        await apiFetch(`lookup?table=rateCategories&id=${id}`, { method: 'DELETE' });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

const initializeDefaultRates = async () => {
    return { error: null };
};

const fetchAll = async (supabaseQuery) => {
    try {
        const table = supabaseQuery?.table || 'workers';
        const data = await apiFetch(`lookup?table=${table}`);
        return { data, error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

const getLocationsTable = async () => {
    return getLookupData('locations');
};

const getClassLevels = async () => {
    return getLookupData('class_levels');
};

const getClassTypes = async () => {
    return getLookupData('class_types');
};

const getScoreboardStats = async (year) => {
    try {
        const data = await apiFetch(`stats/scoreboard?year=${year}`);
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error.message };
    }
};

const getPrograms = async (filters = {}) => {
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

const updateProgram = async (id, data) => {
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

const deleteProgram = async (id) => {
    try {
        await apiFetch(`programs?id=${id}`, { method: 'DELETE' });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

// EXPORTS
export {
    createSubmission,
    updateSubmission,
    deleteSubmission,
    getSubmission,
    getSubmissions,
    getOverallDashboardStats,
    getLocations,
    getStates,
    getLookupData,
    createLookupItem,
    updateLookupItem,
    deleteLookupItem,
    getRateCategories,
    createRateCategory,
    updateRateCategory,
    deleteRateCategory,
    initializeDefaultRates,
    fetchAll,
    getLocationsTable,
    getClassLevels,
    getClassTypes,
    getScoreboardStats,
    getPrograms,
    updateProgram,
    deleteProgram
};

