const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Odamlar sonini va linklarni xotirada saqlash uchun oddiy baza (O'zgaruvchi)
let clickStats = {
    "buxoro": 0,
    "navoiy": 0
};

// Asosiy ilova yoki maqsadli sayt linki (Siz yo'naltirmoqchi bo'lgan havola)
const TARGET_URL = "https://google.com";

// 1. Havolani bosganda ishlaydigan bo'lim
app.get('/r/:linkId', (req, res) => {
    const linkId = req.params.linkId; // masalan: buxoro yoki navoiy

    // Agar baza ichida bu ID bo'lsa, sonini 1 taga oshiramiz
    if (clickStats[linkId] !== undefined) {
        clickStats[linkId] += 1;
    } else {
        clickStats[linkId] = 1; // Yangi ID bo'lsa bazaga qo'shadi
    }

    // Foydalanuvchini asosiy ilova yuklash sahifasiga yuborish
    res.redirect(TARGET_URL);
});

// 2. Kliklar statistikasini ko'rish bo'limi (Masalan: //://render.com)
app.get('/stats', (req, res) => {
    res.json({
        tizim: "Havolar statistikasi",
        statistika: clickStats
    });
});

app.listen(PORT, () => {
    console.log(Server ${PORT}-portda yonishga tayyor);
});