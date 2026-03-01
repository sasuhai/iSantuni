// DUMMY CLIENT FOR MARIADB MIGRATION
// This prevents errors while we refactor the code to use our new API routes.
export const supabase = {
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        signInWithPassword: async () => ({ data: {}, error: new Error('Use custom login API') }),
        signOut: async () => ({ error: null }),
    },
    from: () => ({
        select: () => ({
            eq: () => ({
                single: async () => ({ data: null, error: null }),
                order: async () => ({ data: [], error: null }),
            }),
            order: async () => ({ data: [], error: null }),
        }),
    }),
};
