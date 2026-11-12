const API_URL = 'http://localhost:3001/api/rate/';

async function getRate(code) {
    const response = await fetch(API_URL + encodeURIComponent(code));
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Не вдалося отримати курс.');
    }

    return data;
}

document.getElementById('searchButton').addEventListener('click', async () => {
    const code = document.getElementById('code').value.trim().toUpperCase();
    const result = document.getElementById('rateResult');

    try {
        const currency = await getRate(code);
        result.textContent =
            `${currency.name} (${currency.code}): ` +
            `${currency.rate} грн. за 1 одиницю. Дата курсу: ${currency.updatedAt}`;
    } catch (error) {
        result.textContent = error.message;
    }
});

document.getElementById('convertButton').addEventListener('click', async () => {
    const amount = Number(document.getElementById('amount').value);
    const fromCode = document.getElementById('from').value;
    const toCode = document.getElementById('to').value;
    const result = document.getElementById('conversionResult');

    if (!Number.isFinite(amount) || amount <= 0) {
        result.textContent = 'Введіть суму, більшу за нуль.';
        return;
    }

    try {
        const [fromCurrency, toCurrency] = await Promise.all([
            getRate(fromCode),
            getRate(toCode)
        ]);

        // rate — це кількість гривень за одну одиницю валюти.
        const converted = amount * fromCurrency.rate / toCurrency.rate;
        const formatted = converted.toLocaleString('uk-UA', {
            maximumFractionDigits: 2
        });

        result.textContent =
            `${amount} ${fromCode} = ${formatted} ${toCode}. ` +
            `Дата курсу: ${fromCurrency.updatedAt}`;
    } catch (error) {
        result.textContent = error.message;
    }
});