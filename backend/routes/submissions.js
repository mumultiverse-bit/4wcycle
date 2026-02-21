const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// ── File upload config ──────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
    }
});

// ── PUBLIC: visitor submits a ride ──────────────────────────────────────────
router.post('/submit', upload.array('photos', 5), (req, res) => {
    const { name, email, title, route, experience } = req.body;
    if (!name || !email || !title || !route || !experience) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    const photos = JSON.stringify((req.files || []).map(f => f.filename));
    const stmt = db.prepare(
        'INSERT INTO submissions (name, email, title, route, experience, photos) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const info = stmt.run(name, email, title, route, experience, photos);
    res.status(201).json({ id: info.lastInsertRowid, message: 'Submission received! We will review it soon.' });
});

// ── PUBLIC: get approved (published) submissions ────────────────────────────
router.get('/published', (req, res) => {
    const rows = db.prepare(
        "SELECT id, name, title, route, experience, photos, created_at FROM submissions WHERE status = 'approved' ORDER BY updated_at DESC"
    ).all();
    rows.forEach(r => { r.photos = JSON.parse(r.photos); });
    res.json(rows);
});

// ── ADMIN: list all submissions (filter by status) ──────────────────────────
router.get('/', requireAuth, (req, res) => {
    const { status } = req.query;
    const validStatuses = ['pending', 'approved', 'rejected'];
    let query = 'SELECT * FROM submissions ORDER BY created_at DESC';
    let params = [];
    if (status && validStatuses.includes(status)) {
        query = 'SELECT * FROM submissions WHERE status = ? ORDER BY created_at DESC';
        params = [status];
    }
    const rows = db.prepare(query).all(...params);
    rows.forEach(r => { r.photos = JSON.parse(r.photos); });
    res.json(rows);
});

// ── ADMIN: get single submission ────────────────────────────────────────────
router.get('/:id', requireAuth, (req, res) => {
    const row = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    row.photos = JSON.parse(row.photos);
    res.json(row);
});

// ── ADMIN: approve or reject ────────────────────────────────────────────────
router.patch('/:id', requireAuth, (req, res) => {
    const { status, admin_note } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status must be approved or rejected.' });
    }
    const info = db.prepare(
        "UPDATE submissions SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(status, admin_note || '', req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: `Submission ${status}.` });
});

// ── ADMIN: delete a submission ──────────────────────────────────────────────
router.delete('/:id', requireAuth, (req, res) => {
    const row = db.prepare('SELECT photos FROM submissions WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    // Delete photo files
    const photos = JSON.parse(row.photos);
    photos.forEach(f => {
        const fpath = path.join(UPLOAD_DIR, f);
        if (fs.existsSync(fpath)) fs.unlinkSync(fpath);
    });
    db.prepare('DELETE FROM submissions WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted.' });
});

module.exports = router;
