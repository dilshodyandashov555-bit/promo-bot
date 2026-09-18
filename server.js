const express = require('express');
const { Pool } = require('pg');
const QRCode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 10000;

// Render ma'lumotlar bazasiga ulanish sozlamasi
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Jadvalni bazada yaratish va viloyatlarni boshlang'ich kiritish funksiyasi
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

// Foydalanuvchilar o'tadigan yakuniy Google Play ilova manzili
const TARGET_URL = 'https://play.google.com/store/apps/details?id=com.baxtiyorov.security';

// 1. Brauzer avtomatik so'raydigan favicon.ico so'rovini bazaga qo'shmasdan bloklash
app.get('/favicon.ico', (req, res) => res.status(204).end());

// 2. Asosiy sahifa - to'g'ridan-to'g'ri ilovaga yo'naltiradi
app.get('/', (req, res) => {
    res.redirect(TARGET_URL);
});

// 3. JSON Statistika sahifasi (Dinamik :linkId dan tepada turishi shart)
app.get('/stats', async (req, res) => {
    try {
        await initDatabase();
        const result = await pool.query("SELECT link_id, clicks FROM click_stats;");
        const statistika = {};
        result.rows.forEach(row => {
            // Agar bazada eski favicon.ico ma'lumoti qolgan bo'lsa, uni filtrlab ko'rsatmaslik
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

// 4. Avtomatik QR-kod generatsiya qilish sahifasi (Slesh xatosi to'g'rilangan)
app.get('/qr/:linkId', async (req, res) => {
    const linkId = req.params.linkId.toLowerCase();
    
    if (linkId === 'favicon.ico') {
        return res.status(204).end();
    }

    // Har bir viloyat uchun to'g'ri va alohida dinamik havola (slesh qo'shildi)
    const dynamicLink = "https://onrender.com" + linkId;

    try {
        const qrBuffer = await QRCode.toBuffer(dynamicLink, {
            type: 'png',
            margin: 2,
            width: 300
        });

        res.type('png');
        res.send(qrBuffer);
    } catch (err) {
        console.error("QR Error:", err.message);
        res.status(500).send("QR-kod yaratishda xatolik yuz berdi");
    }
});

// 5. Ilovaga yo'naltirish va klikni hisoblash (Eng pastda bo'lishi shart)
app.get('/:linkId', async (req, res) => {
    const linkId = req.params.linkId.toLowerCase(); // Katta-kichik harflarni bir xil qiladi
    
    if (linkId === 'favicon.ico') {
        return res.status(204).end();
    }

    try {
        await initDatabase();
        
        // Klikni 1 taga oshirish
        const resUpdate = await pool.query("UPDATE click_stats SET clicks = clicks + 1 WHERE link_id = '" + linkId + "' RETURNING *;");
        
        // Agar bu yangi viloyat bo'lsa, bazaga yangi qator qilib qo'shish
        if (resUpdate.rowCount === 0) {
            await pool.query("INSERT INTO click_stats (link_id, clicks) VALUES ('" + linkId + "', 1);");
        }
        res.redirect(TARGET_URL);
    } catch (err) {
        console.error("Error:", err.message);
        res.redirect(TARGET_URL); // Xato bo'lsa ham foydalanuvchi ilovaga o'tib ketsin
    }
});

// Serverni ishga tushirish
app.listen(PORT, () => {
    console.log("Server running");
});
