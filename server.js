const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

// Render bazasiga ulanish sozlamasi
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Jadvalni bazada majburiy yaratish va viloyatlarni qo'shish
async function initDatabase() {
    try {
        // Avval jadval bormi yoki yo'q, tekshirib yaratamiz
        await pool.query("CREATE TABLE IF NOT EXISTS click_stats (link_id VARCHAR(50) PRIMARY KEY, clicks INT DEFAULT 0);");
        
        // Buxoro va Navoiy viloyatlarini bazaga joylaymiz
        await pool.query("INSERT INTO click_stats (link_id, clicks) VALUES ('buxoro', 0) ON CONFLICT (link_id) DO NOTHING;");
        await pool.query("INSERT INTO click_stats (link_id, clicks) VALUES ('navoiy', 0) ON CONFLICT (link_id) DO NOTHING;");
        console.log("Ma'lumotlar bazasi muvaffaqiyatli tayyorlandi.");
    } catch (err) {
        console.error("Bazani yaratishda xato bo'ldi:", err.message);
    }
}
// Agar oxirida hech qanday ID bo'lmasa, to'g'ri ilovaga o'tkazish
app.get('/', (req, res) => {
    res.redirect(TARGET_URL);
});
const TARGET_URL = 'https://play.google.com/store/apps/details?id=com.baxtiyorov.security'; 

// 1. Ilovaga yo'naltirish linki
app.get('/r/:linkId', async (req, res) => {
    const linkId = req.params.linkId;
    try {
        await initDatabase(); // Bazani tekshirib olish
        const resUpdate = await pool.query("UPDATE click_stats SET clicks = clicks + 1 WHERE link_id = $1 RETURNING *;", [linkId]);
        if (resUpdate.rowCount === 0) {
            await pool.query("INSERT INTO click_stats (link_id, clicks) VALUES ($1, 1);", [linkId]);
        }
    } catch (err) {
        console.error("Klik yozishda xato:", err.message);
    }
    res.redirect(TARGET_URL);
});

// 2. Jonli statistika sahifasi
app.get('/stats', async (req, res) => {
    try {
        await initDatabase(); // Har safar kirganda jadvalni tekshirish
        const result = await pool.query('SELECT link_id, clicks FROM click_stats;');
        const statistika = {};
        
        result.rows.forEach(row => {
            statistika[row.link_id] = row.clicks;
        });
        
        res.json({
            tizim: "Havolar statistikasi",
            statistika: statistika
        });
    } catch (err) {
        res.status(500).json({ xato: "Baza bilan bog'lanishda xato: " + err.message });
    }
});

app.listen(PORT, () => {
    console.log("Server ishga tushdi.");
});
