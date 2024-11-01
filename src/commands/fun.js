const axios = require('axios');

async function generateMeme() {
    const response = await axios.get('https://meme-api.com/gimme');
    return response.data.url;
}

async function getTriviaQuestion() {
    const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
    const question = response.data.results[0];
    return {
        question: question.question,
        correct: question.correct_answer,
        options: [...question.incorrect_answers, question.correct_answer].sort(() => Math.random() - 0.5)
    };
}

async function getDadJoke() {
    const response = await axios.get('https://icanhazdadjoke.com/', {
        headers: { Accept: 'application/json' }
    });
    return response.data.joke;
}

module.exports = {
    generateMeme,
    getTriviaQuestion,
    getDadJoke
};