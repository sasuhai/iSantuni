/**
 * SMART SUPABASE PROXY FOR MARIADB MIGRATION
 * This client intercepts Supabase-style calls and routes them to our 
 * MariaDB /api/ endpoints, making all our tables functional immediately.
 */

const getApiUrl = (table) => {
    // Hard map for different endpoint names
    const mapping = {
        'submissions': 'mualaf',
        'mualaf': 'mualaf',
        'workers': 'workers',
        'programs': 'programs',
        'classes': 'classes',
        'attendance_records': 'attendance',
        'attendance': 'attendance',
        'other_kpis': 'other_kpis',
    };

    // Lookups if not in map
    const lookups = [
        'states', 'locations', 'class_levels', 'class_types',
        'races', 'religions', 'banks', 'program_status',
        'program_categories', 'program_organizers', 'program_types',
        'kawasan_cawangan', 'sub_kategori', 'users', 'rateCategories', 'kpi_settings'
    ];

    if (mapping[table]) return `/api/${mapping[table]}`;
    if (lookups.includes(table)) return `/api/lookup?table=${table}`;
    return `/api/${table}`; // Fallback
};

export const supabase = {
    rpc: async (fnName, params = {}) => {
        console.warn(`RPC Proxy intercept: ${fnName} not supported via API.`);
        return { data: null, error: { message: `RPC ${fnName} intercept: Not Implemented` } };
    },
    auth: {
        getSession: async () => ({
            data: {
                session: (typeof window !== 'undefined' && localStorage.getItem('isantuni_user'))
                    ? { user: JSON.parse(localStorage.getItem('isantuni_user')) }
                    : null
            },
            error: null
        }),
        onAuthStateChange: (cb) => {
            if (typeof window !== 'undefined' && localStorage.getItem('isantuni_user')) {
                cb('SIGNED_IN', { user: JSON.parse(localStorage.getItem('isantuni_user')) });
            }
            return { data: { subscription: { unsubscribe: () => { } } } };
        },
        getUser: async () => ({
            data: {
                user: (typeof window !== 'undefined' && localStorage.getItem('isantuni_user'))
                    ? JSON.parse(localStorage.getItem('isantuni_user'))
                    : null
            },
            error: null
        }),
    },

    from: (table) => {
        let filters = {};
        let orderConfig = null;
        let limitVal = null;
        let rangeConfig = null;

        const execute = async (method, body = null) => {
            let fullUrl = '';
            try {
                const url = getApiUrl(table);
                const params = new URLSearchParams(filters);
                if (orderConfig) {
                    params.append('_order', orderConfig.column);
                    params.append('_dir', orderConfig.ascending ? 'asc' : 'desc');
                }
                if (limitVal) params.append('_limit', limitVal);
                if (rangeConfig) {
                    params.append('_from', rangeConfig.from);
                    params.append('_to', rangeConfig.to);
                }

                const queryStr = params.toString();
                fullUrl = queryStr ? `${url}${url.includes('?') ? '&' : '?'}${queryStr}` : url;

                const res = await fetch(fullUrl, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: body ? JSON.stringify(body) : undefined,
                });

                if (!res.ok) {
                    let errorMessage = 'API request failed';
                    try {
                        const errorData = await res.json();
                        errorMessage = errorData.error || errorMessage;
                    } catch (e) {
                        // If not JSON, maybe get text
                        const text = await res.text().catch(() => '');
                        console.error(`Non-JSON Error from ${fullUrl}:`, text.slice(0, 200));
                    }
                    throw new Error(errorMessage);
                }

                const data = await res.json();
                return { data, error: null };
            } catch (err) {
                console.error(`Proxy Error [${table}] (${method} ${fullUrl}):`, err.message);
                return { data: null, error: err };
            }
        };

        const chain = {
            table: table,
            select: (columns = '*') => chain,
            eq: (col, val) => { filters[col] = val; return chain; },
            neq: (col, val) => { filters[`${col}_neq`] = val; return chain; },
            gt: (col, val) => { filters[`${col}_gt`] = val; return chain; },
            lt: (col, val) => { filters[`${col}_lt`] = val; return chain; },
            gte: (col, val) => { filters[`${col}_gte`] = val; return chain; },
            lte: (col, val) => { filters[`${col}_lte`] = val; return chain; },
            like: (col, val) => { filters[`${col}_like`] = val; return chain; },
            ilike: (col, val) => { filters[`${col}_ilike`] = val; return chain; },
            is: (col, val) => { filters[`${col}_is`] = val; return chain; },
            in: (col, val) => { filters[`${col}_in`] = Array.isArray(val) ? val.join(',') : val; return chain; },
            match: (obj) => { Object.assign(filters, obj); return chain; },
            order: (col, { ascending = true } = {}) => {
                orderConfig = { column: col, ascending };
                return chain;
            },
            limit: (val) => {
                limitVal = val;
                return chain;
            },
            range: (from, to) => {
                rangeConfig = { from, to };
                return chain;
            },
            single: async () => {
                const { data, error } = await execute('GET');
                return { data: (Array.isArray(data) ? data[0] : data), error };
            },
            then: (resolve, reject) => {
                execute('GET').then(resolve).catch(reject);
            },
            insert: (data) => {
                const promise = execute('POST', Array.isArray(data) ? data[0] : data);
                const insertChain = {
                    select: (cols = '*') => {
                        const selectChain = {
                            single: () => promise,
                            then: (resolve, reject) => promise.then(resolve).catch(reject)
                        };
                        return selectChain;
                    },
                    then: (resolve, reject) => promise.then(resolve).catch(reject)
                };
                return insertChain;
            },
            update: (data) => ({
                eq: async (col, val) => {
                    filters.id = val;
                    return execute('PUT', data);
                },
                match: async (obj) => {
                    Object.assign(filters, obj);
                    return execute('PUT', data);
                },
                select: () => ({
                    single: () => execute('PUT', data)
                })
            }),
            delete: () => ({
                eq: async (col, val) => {
                    filters.id = val;
                    return execute('DELETE');
                },
                match: async (obj) => {
                    Object.assign(filters, obj);
                    return execute('DELETE');
                }
            })
        };

        return chain;
    }
};
