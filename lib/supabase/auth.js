/*
  MARIADB MIGRATION AUTH LAYER
  Redirects auth calls to our internal /api/auth/ routes.
*/

const apiFetch = async (endpoint, options = {}) => {
    const response = await fetch(`/api/${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || 'Request failed');
    }
    return result;
};

export const signIn = async (email, password) => {
    try {
        const data = await apiFetch('auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        // In a real app, we'd set a cookie here via the API.
        // For simplicity, we'll return user data and handle session in AuthContext.
        return { user: data.user, error: null };
    } catch (error) {
        return { user: null, error: error.message };
    }
};

export const signOut = async () => {
    try {
        // Just clear client side state usually.
        // We could call an API to clear cookies if we had them.
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

export const getUserProfile = async (id) => {
    try {
        const data = await apiFetch(`lookup?table=users&id=${id}`);
        return data;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
};

// Placeholder for other auth methods
export const resetPassword = async (email) => {
    return { error: 'Not implemented yet in MariaDB backend' };
};

export const updatePassword = async (newPassword) => {
    return { error: 'Not implemented yet in MariaDB backend' };
};

export const registerUser = async (email, password, userData) => {
    try {
        const result = await apiFetch('auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, ...userData }),
        });
        return { user: result.user, error: null };
    } catch (error) {
        return { user: null, error: error.message };
    }
};
