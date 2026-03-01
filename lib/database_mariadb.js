// COMPATIBILITY LAYER FOR MARIADB MIGRATION
// This file redirects existing Supabase calls to the new Next.js API routes

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
            method: 'PUT', // Need to implement PUT in API
            body: JSON.stringify({ ...data, updatedBy: userId }),
        });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

export const getSubmissions = async (filters = {}) => {
    try {
        // Construct query string from filters
        const params = new URLSearchParams(filters);
        const data = await apiFetch(`mualaf?${params.toString()}`);
        return { data, error: null, total: data.length }; // Simplified total for now
    } catch (error) {
        return { data: [], error: error.message, total: 0 };
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

export const getLocations = async () => {
    try {
        const data = await apiFetch('lookup?table=locations');
        return { data: data.map(d => d.name), error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

// ... More functions to be migrated as needed
