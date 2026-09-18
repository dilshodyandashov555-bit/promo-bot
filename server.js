const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

// Render'dagi PostgreSQL bazasiga ulanish
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Server yonganda jadval borligini tekshirish va yo'q bo'lsa yaratish
async function initDatabase() {
    const createTableQuery = 
        CREATE TABLE IF NOT EXISTS click_stats (
            link_id VARCHAR(50) PRIMARY KEY,
            clicks INT DEFAULT 0
        );
    ;
    await pool.query(createTableQuery);
    
    // Boshlang'ich hududlarni avtomatik bazaga qo'shish
    const initialRegions = ['buxoro', 'navoiy'];
    for (const region of initialRegions) {
        await pool.query(
            INSERT INTO click_stats (link_id, clicks) VALUES ($1, 0) ON CONFLICT (link_id) DO NOTHING,
            [region]
        );
    }
}
initDatabase().catch(err => console.error("Bazani yaratishda xato:", err));

const TARGET_URL = 'https://play.google.com/store/apps/details?id=com.baxtiyorov.security';

// 1. Dinamik yo'naltirish (Ilovaga olib o'tish)
app.get('/r/:linkId', async (req, res) => {
    const linkId = req.params.linkId;
    
    try {
        const resUpdate = await pool.query(
            UPDATE click_stats SET clicks = clicks + 1 WHERE link_id = $1 RETURNING *,
            [linkId]
        );
        
        if (resUpdate.rowCount === 0) {
            await pool.query(
                INSERT INTO click_stats (link_id, clicks) VALUES ($1, 1),
                [linkId]
            );
        }
    } catch (err) {
        console.error("Klikni yozishda xatolik:", err);
    }

    res.redirect(TARGET_URL);
});

// 2. Jonli statistikani ko'rish
app.get('/stats', async (req, res) => {
    try {
        const result = await pool.query('SELECT link_id, clicks FROM click_stats');
        const statistika = {};
        result.rows.forEach(row => {
            statistika[row.link_id] = row.clicks;
        });

        res.json({
            tizim: "Havolar statistikasi (PostgreSQL)",
            statistika: statistika
        });
    } catch (err) {
        console.error("Statistikani olishda xatolik:", err);
        res.status(500).json({ xato: "Baza bilan bog'lanishda muammo bo'ldi" });
    }
});

app.listen(PORT, () => {
    console.log(Server ${PORT}-portda ishlamoqda...);
});
