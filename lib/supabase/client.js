class MockQuery {
    constructor(table) {
        this.table = table;
        this.method = 'GET';
        this.params = new URLSearchParams();
        this.bodyData = null;
        this.isSingle = false;
        this.idFilter = null;
    }

    select(columns) {
        if (this.method === 'GET' || !this.method) this.method = 'GET';
        if (columns && columns !== '*') this.params.append('select', columns);
        return this;
    }

    insert(data) {
        this.method = 'POST';
        this.bodyData = Array.isArray(data) ? data[0] : data;
        return this;
    }

    upsert(data) {
        this.method = 'PATCH';
        this.bodyData = Array.isArray(data) ? data[0] : data;
        return this;
    }

    update(data) {
        this.method = 'PUT';
        this.bodyData = data;
        return this;
    }

    delete() {
        this.method = 'DELETE';
        return this;
    }

    eq(col, val) {
        if (col === 'id') {
            this.idFilter = val;
            this.params.append('id', val);
        } else {
            this.params.append(col, val);
        }
        return this;
    }

    order(col, opts) {
        this.params.append('order', col);
        if (opts && opts.ascending !== undefined) {
            this.params.append('ascending', opts.ascending);
        }
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    range(from, to) {
        this.params.append('offset', from);
        this.params.append('limit', to - from + 1);
        return this;
    }

    gte(col, val) {
        this.params.append(col, `gte.${val}`);
        return this;
    }
    lte(col, val) {
        this.params.append(col, `lte.${val}`);
        return this;
    }
    gt(col, val) {
        this.params.append(col, `gt.${val}`);
        return this;
    }
    lt(col, val) {
        this.params.append(col, `lt.${val}`);
        return this;
    }
    not() { return this; }

    async then(onResolve, onReject) {
        try {
            let endpoint = '';
            const lookupTables = ['states', 'locations', 'class_levels', 'class_types', 'races', 'religions', 'banks', 'program_status', 'program_categories', 'program_organizers', 'program_types', 'rateCategories', 'cawangan'];

            if (lookupTables.includes(this.table)) {
                endpoint = '/api/lookup?table=' + this.table;
            } else if (this.table === 'mualaf' || this.table === 'submissions') {
                endpoint = '/api/mualaf';
            } else if (this.table === 'attendance_records') {
                endpoint = '/api/attendance';
            } else if (this.table === 'kpi_settings') {
                endpoint = '/api/kpi_settings';
            } else {
                endpoint = '/api/' + this.table;
            }

            let url = endpoint;

            // Try to extract ID from eq('id', ...) if not already set manually via some other way
            if (!this.idFilter && this.params.has('id')) {
                this.idFilter = this.params.get('id');
            }

            const qs = this.params.toString();

            if (this.method === 'GET') {
                if (qs && !url.includes('?')) {
                    url += '?' + qs;
                } else if (qs) {
                    url += '&' + qs;
                }
            } else {
                if (this.idFilter) {
                    url += (url.includes('?') ? '&' : '?') + 'id=' + this.idFilter;
                }
            }

            const fetchOpts = {
                method: this.method,
                headers: { 'Content-Type': 'application/json' }
            };

            if (this.bodyData && (this.method === 'POST' || this.method === 'PUT' || this.method === 'PATCH' || this.method === 'DELETE')) {
                if (this.method === 'PUT' || this.method === 'PATCH') {
                    if (endpoint.includes('lookup')) {
                        fetchOpts.body = JSON.stringify({ table: this.table, id: this.idFilter, ...this.bodyData });
                    } else if (endpoint.includes('workers') || endpoint.includes('mualaf') || endpoint.includes('programs') || endpoint.includes('kpi_settings')) {
                        fetchOpts.body = JSON.stringify({ id: this.idFilter, ...this.bodyData });
                    } else {
                        fetchOpts.body = JSON.stringify(this.bodyData);
                    }
                } else {
                    if (endpoint.includes('lookup')) {
                        fetchOpts.body = JSON.stringify({ table: this.table, ...this.bodyData });
                    } else {
                        fetchOpts.body = JSON.stringify(this.bodyData);
                    }
                }
            }

            console.log(`MockQuery fetching: [${this.method}] ${url}`);
            const res = await fetch(url, fetchOpts);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(`${url}: ${err.error || 'API Error'}`);
            }

            const totalCount = res.headers.get('x-total-count');
            let data = await res.json();

            if (this.method === 'GET' && this.isSingle) {
                if (Array.isArray(data)) data = data[0] || null;
            }
            // Many routes return `{ message: '...', id: '...' }` instead of array data on POST/PUT
            if (this.method !== 'GET') {
                if (data.id && !data.data) {
                    data = [data]; // return format commonly expected by inserts
                }
            }

            const result = { data, error: null, count: totalCount ? parseInt(totalCount) : (Array.isArray(data) ? data.length : null) };
            if (onResolve) return onResolve(result);
            return result;

        } catch (error) {
            console.error('MockClient Error:', error);
            const result = { data: null, error: error };
            if (onResolve) return onResolve(result);
            if (onReject) return onReject(error);
            return result;
        }
    }
}

export const supabase = {
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        signInWithPassword: async () => ({ data: {}, error: new Error('Use custom login API') }),
        signOut: async () => ({ error: null }),
    },
    from: (table) => new MockQuery(table),
    rpc: async (name) => {
        if (name === 'get_public_tables') {
            return {
                data: [
                    'mualaf', 'classes', 'workers', 'programs', 'attendance_records', 'other_kpis',
                    'states', 'locations', 'class_levels', 'class_types', 'races',
                    'religions', 'banks', 'program_status', 'program_categories',
                    'program_organizers', 'program_types', 'rateCategories', 'users'
                ],
                error: null
            };
        }
        return { data: [], error: null };
    },
};
