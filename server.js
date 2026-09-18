const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

// ⚠️ SHU YERGA O'ZINGIZNING ASOSIY HAVOLANGIZNI YOZING:
const TARGET_URL = 'https://play.google.com/store/apps/details?id=com.baxtiyorov.security'; 

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
    try {
        await pool.query("CREATE TABLE IF NOT EXISTS click_stats (link_id VARCHAR(50) PRIMARY KEY, clicks INT DEFAULT 0);");
        await pool.query("INSERT INTO click_stats (link_id, clicks) VALUES ('buxoro', 0) ON CONFLICT (link_id) DO NOTHING;");
        await pool.query("INSERT INTO click_stats (link_id, clicks) VALUES ('navoiy', 0) ON CONFLICT (link_id) DO NOTHING;");
        console.log("Baza tayyor.");
    } catch (err) {
        console.error("Bazada xato:", err);
    }
}
initDatabase();

app.get('/r/:linkId', async (req, res) => {
    const linkId = req.params.linkId;
    try {
        const resUpdate = await pool.query("UPDATE click_stats SET clicks = clicks + 1 WHERE link_id = $1 RETURNING *;", [linkId]);
        if (resUpdate.rowCount === 0) {
            await pool.query("INSERT INTO click_stats (link_id, clicks) VALUES ($1, 1);", [linkId]);
        }
    } catch (err) {
        console.error(err);
    }
    res.redirect(TARGET_URL);
});

app.get('/stats', async (req, res) => {
    try {
        const result = await pool.query('SELECT link_id, clicks FROM click_stats;');
        const statistika = {};
        result.rows.forEach(row => {
            statistika[row.link_id] = row.clicks;
        });
        res.json({ tizim: "Havolar statistikasi", statistika: statistika });
    } catch (err) {
        res.status(500).json({ xato: "Xatolik bo'ldi" });
    }
});

app.listen(PORT, () => {
    console.log("Server ishga tushdi.");
});
