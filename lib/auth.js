import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// Simple session check (can be expanded with JWT or NextAuth)
export async function getSession(req) {
    // Logic to retrieve session from cookie/header will be added with NextAuth or custom logic
    return null;
}
