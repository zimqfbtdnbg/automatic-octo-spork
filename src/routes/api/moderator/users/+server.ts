import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/db';
import { hashPassword, verifyToken } from '$lib/auth';
import { parse } from 'cookie';

async function requireModerator(request: Request) {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return { ok: false };
    const cookies = parse(cookieHeader);
    const token = cookies.token;
    if (!token) return { ok: false };
    const payload = verifyToken(token as string);
    if (!payload) return { ok: false };
    const row = db.prepare('SELECT role FROM users WHERE id = ?').get(payload.id);
    if (!row || row.role !== 'moderator') return { ok: false };
    return { ok: true, userId: payload.id };
}

export const GET: RequestHandler = async ({ request }) => {
    const check = await requireModerator(request);
    if (!check.ok) return json({ error: 'Forbidden' }, { status: 403 });

    const users = db.prepare('SELECT id, username, email, avatar, description, role, is_scam, created_at FROM users').all();
    return json({ users });
};

export const POST: RequestHandler = async ({ request }) => {
    const check = await requireModerator(request);
    if (!check.ok) return json({ error: 'Forbidden' }, { status: 403 });

    const { username, email, password, role } = await request.json();
    if (!username || !email || !password) return json({ error: 'Missing fields' }, { status: 400 });

    const hashed = hashPassword(password);
    try {
        const result = db.prepare(`
            INSERT INTO users (username, email, password, avatar, description, role, is_scam)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(username, email, hashed, `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=7f8c8d&color=fff`, '', role || 'user', 0);

        return json({ id: result.lastInsertRowid });
    } catch (e) {
        return json({ error: 'Create failed' }, { status: 500 });
    }
};

export const PUT: RequestHandler = async ({ request }) => {
    const check = await requireModerator(request);
    if (!check.ok) return json({ error: 'Forbidden' }, { status: 403 });

    const { id, username, email, role, is_scam } = await request.json();
    if (!id) return json({ error: 'Missing id' }, { status: 400 });

    try {
        const stmt = db.prepare(`
            UPDATE users SET
                username = COALESCE(?, username),
                email = COALESCE(?, email),
                role = COALESCE(?, role),
                is_scam = COALESCE(?, is_scam)
            WHERE id = ?
        `);
        stmt.run(username || null, email || null, role || null, typeof is_scam === 'number' ? is_scam : null, id);
        return json({ ok: true });
    } catch (e) {
        return json({ error: 'Update failed' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ request }) => {
    const check = await requireModerator(request);
    if (!check.ok) return json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await request.json();
    if (!id) return json({ error: 'Missing id' }, { status: 400 });

    try {
        db.prepare('DELETE FROM users WHERE id = ?').run(id);
        return json({ ok: true });
    } catch (e) {
        return json({ error: 'Delete failed' }, { status: 500 });
    }
};
