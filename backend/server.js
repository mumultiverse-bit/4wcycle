require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded photos as static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Admin login ──────────────────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (
        username === process.env.ADMIN_USER &&
        password === process.env.ADMIN_PASS
    ) {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
        return res.json({ token });
    }
    res.status(401).json({ error: 'Invalid credentials.' });
});

// ── API Routes ───────────────────────────────────────────────────────────────
const submissionsRouter = require('./routes/submissions');
app.use('/api/submissions', submissionsRouter);
// Convenience alias for the public endpoint
app.get('/api/published', (req, res) => res.redirect('/api/submissions/published'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`4wCycle API running on port ${PORT}`));
