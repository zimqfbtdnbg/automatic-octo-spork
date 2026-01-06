import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/db';
import { verifyToken } from '$lib/auth';
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

    const videos = db.prepare('SELECT id, user_id, title, description, thumbnail_url, duration, views, is_18, created_at FROM videos').all();
    return json({ videos });
};

export const PUT: RequestHandler = async ({ request }) => {
    const check = await requireModerator(request);
    if (!check.ok) return json({ error: 'Forbidden' }, { status: 403 });

    const { id, title, description, is_18 } = await request.json();
    if (!id) return json({ error: 'Missing id' }, { status: 400 });

    try {
        const stmt = db.prepare(`
            UPDATE videos SET
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                is_18 = COALESCE(?, is_18)
            WHERE id = ?
        `);
        stmt.run(title || null, description || null, typeof is_18 === 'number' ? is_18 : null, id);
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
        db.prepare('DELETE FROM videos WHERE id = ?').run(id);
        return json({ ok: true });
    } catch (e) {
        return json({ error: 'Delete failed' }, { status: 500 });
    }
};
