const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let clickStats = {
    "buxoro": 0,
    "navoiy": 0
};

const TARGET_URL = "https://google.com";

app.get('/r/:linkId', (req, res) => {
    const linkId = req.params.linkId;
    if (clickStats[linkId] !== undefined) {
        clickStats[linkId] += 1;
    } else {
        clickStats[linkId] = 1;
    }
    res.redirect(TARGET_URL);
});

app.get('/stats', (req, res) => {
    res.json({
        tizim: "Havolar statistikasi",
        statistika: clickStats
    });
});

app.listen(PORT, () => {
    console.log("Server yonishga tayyor");
});
