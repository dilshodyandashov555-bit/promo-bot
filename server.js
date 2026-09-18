const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 10000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
    try {
        await pool.query("CREATE TABLE IF NOT EXISTS click_stats (link_id VARCHAR(50) PRIMARY KEY, clicks INT DEFAULT 0);");
        await pool.query("INSERT INTO click_stats (link_id, clicks) VALUES ('buxoro', 0) ON CONFLICT (link_id) DO NOTHING;");
        await pool.query("INSERT INTO click_stats (link_id, clicks) VALUES ('navoiy', 0) ON CONFLICT (link_id) DO NOTHING;");
        console.log("Database ready");
    } catch (err) {
        console.error("Database error:", err.message);
    }
}

const TARGET_URL = 'https://play.google.com/store/apps/details?id=com.baxtiyorov.security';

// Brauzer avtomatik so'raydigan favicon.ico so'rovini statistikaga qo'shmasdan bloklash
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', (req, res) => {
    res.redirect(TARGET_URL);
});

app.get('/stats', async (req, res) => {
    try {
        await initDatabase();
        const result = await pool.query("SELECT link_id, clicks FROM click_stats;");
        const statistika = {};
        result.rows.forEach(row => {
            // Agar bazada eski favicon.ico ma'lumoti qolgan bo'lsa, uni statistikada ko'rsatmaslik
            if (row.link_id !== 'favicon.ico') {
                statistika[row.link_id] = row.clicks;
            }
        });
        res.json({
            system: "Click Statistics",
            data: statistika
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/:linkId', async (req, res) => {
    const linkId = req.params.linkId.toLowerCase();
    
    // Agar linkId tasodifan favicon.ico bo'lib qolsa, davom ettirmaslik
    if (linkId === 'favicon.ico') {
        return res.status(204).end();
    }

    try {
        await initDatabase();
        
        const resUpdate = await pool.query("UPDATE click_stats SET clicks = clicks + 1 WHERE link_id = '" + linkId + "' RETURNING *;");
        
        if (resUpdate.rowCount === 0) {
            await pool.query("INSERT INTO click_stats (link_id, clicks) VALUES ('" + linkId + "', 1);");
        }
        res.redirect(TARGET_URL);
    } catch (err) {
        console.error("Error:", err.message);
        res.redirect(TARGET_URL);
    }
});

app.listen(PORT, () => {
    console.log("Server running");
});
