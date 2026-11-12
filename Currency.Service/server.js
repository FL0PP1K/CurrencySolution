const express = require('express');

const app = express();
const PORT = 3001;
const NBU_URL =
    'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchangenew';

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

async function getNbuRates(code) {
    const url = `${NBU_URL}?json&valcode=${encodeURIComponent(code)}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('НБУ не повернув дані');
    }

    return response.json();
}

app.get('/api/rate/:code', async (req, res) => {
    const code = req.params.code.toUpperCase();

    if (!/^[A-Z]{3}$/.test(code)) {
        return res.status(400).json({
            message: 'Введіть трилітерний код валюти, наприклад USD.'
        });
    }

    try {
        // Офіційний курс гривні до гривні дорівнює 1.
        // Беремо дату останнього опублікованого курсу USD.
        if (code === 'UAH') {
            const rows = await getNbuRates('USD');

            if (!rows.length) {
                return res.status(502).json({
                    message: 'Не вдалося отримати дату курсу від НБУ.'
                });
            }

            return res.json({
                code: 'UAH',
                name: 'Українська гривня',
                rate: 1,
                updatedAt: rows[0].exchangedate
            });
        }

        const rows = await getNbuRates(code);

        if (!rows.length) {
            return res.status(404).json({
                message: `Валюту ${code} не знайдено.`
            });
        }

        const row = rows[0];

        res.json({
            code: row.cc,
            name: row.txt,
            rate: row.rate,
            updatedAt: row.exchangedate
        });
    } catch (error) {
        console.error(error);
        res.status(502).json({
            message: 'Не вдалося зв’язатися із сервісом НБУ.'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Currency.Service працює на http://localhost:${PORT}`);
});