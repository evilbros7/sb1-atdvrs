const axios = require('axios');

async function translateText(text, targetLang = 'es') {
    // Note: In production, use a proper translation API
    return `Translation feature (${text} to ${targetLang})`;
}

async function getWordOfDay() {
    const response = await axios.get('https://random-word-api.herokuapp.com/word');
    const word = response.data[0];
    return word;
}

async function calculateMath(expression) {
    try {
        // Safe eval using Function constructor
        const calculate = new Function(`return ${expression}`);
        return calculate();
    } catch {
        return 'Invalid expression';
    }
}

module.exports = {
    translateText,
    getWordOfDay,
    calculateMath
};