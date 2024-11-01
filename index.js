const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');
const P = require('pino');
const { generateMeme, getTriviaQuestion, getDadJoke } = require('./src/commands/fun');
const { translateText, getWordOfDay, calculateMath } = require('./src/commands/tools');
const { TicTacToe, games } = require('./src/commands/games');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: P({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to:', lastDisconnect.error, 'Reconnecting:', shouldReconnect);
            
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('WhatsApp bot is ready!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const messageContent = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const command = messageContent.split(' ')[0].toLowerCase();
        const args = messageContent.split(' ').slice(1).join(' ');
        const chatId = m.key.remoteJid;

        const reply = (text) => sock.sendMessage(chatId, { text });

        switch(command) {
            case '!meme':
                const memeUrl = await generateMeme();
                await sock.sendMessage(chatId, { 
                    image: { url: memeUrl },
                    caption: '🎭 Here\'s your meme!'
                });
                break;

            case '!dadjoke':
                const joke = await getDadJoke();
                await reply('👨 ' + joke);
                break;

            case '!trivia':
                const trivia = await getTriviaQuestion();
                await reply(`🎯 Trivia Time!\n\nQuestion: ${trivia.question}\n\nOptions:\n${trivia.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nReply with !answer <number>`);
                games.set(chatId + '_trivia', { correct: trivia.correct, options: trivia.options });
                break;

            case '!answer':
                const triviaGame = games.get(chatId + '_trivia');
                if (!triviaGame) {
                    await reply('No active trivia question! Start one with !trivia');
                    return;
                }
                const answer = parseInt(args);
                if (triviaGame.options[answer - 1] === triviaGame.correct) {
                    await reply('🎉 Correct answer! You\'re a genius!');
                } else {
                    await reply(`❌ Wrong! The correct answer was: ${triviaGame.correct}`);
                }
                games.delete(chatId + '_trivia');
                break;

            case '!translate':
                const [text, lang] = args.split('|').map(s => s.trim());
                if (!text) {
                    await reply('Usage: !translate text|language-code\nExample: !translate hello|es');
                    return;
                }
                const translation = await translateText(text, lang || 'es');
                await reply(translation);
                break;

            case '!wordofday':
                const word = await getWordOfDay();
                await reply(`📚 Word of the Day: *${word}*`);
                break;

            case '!calc':
                if (!args) {
                    await reply('Please provide a mathematical expression\nExample: !calc 2 + 2');
                    return;
                }
                const result = await calculateMath(args);
                await reply(`🔢 ${args} = ${result}`);
                break;

            case '!tictactoe':
                if (!games.has(chatId)) {
                    games.set(chatId, new TicTacToe());
                    await reply(`🎮 TicTacToe game started!\n\nHow to play:\n1. Use !move <position> (1-9)\n2. Positions are numbered left to right, top to bottom\n\n${games.get(chatId).getBoard()}`);
                } else {
                    await reply('Game already in progress!');
                }
                break;

            case '!move':
                if (!games.has(chatId)) {
                    await reply('No game in progress! Start with !tictactoe');
                    return;
                }
                const game = games.get(chatId);
                const position = parseInt(args) - 1;
                
                if (game.makeMove(position)) {
                    const board = game.getBoard();
                    const winner = game.checkWinner();
                    
                    if (winner) {
                        await reply(`${board}\n\n🎉 Player ${winner} wins!`);
                        games.delete(chatId);
                    } else if (!game.board.includes(null)) {
                        await reply(`${board}\n\n🤝 It's a draw!`);
                        games.delete(chatId);
                    } else {
                        await reply(`${board}\n\nPlayer ${game.currentPlayer}'s turn`);
                    }
                } else {
                    await reply('Invalid move! Choose an empty position (1-9)');
                }
                break;

            case '!help':
                await reply(`🤖 *Enhanced Bot Commands*

🎯 *Fun & Games*
• !meme - Get a random meme
• !dadjoke - Get a dad joke
• !trivia - Start a trivia question
• !answer <number> - Answer trivia
• !tictactoe - Start TicTacToe game
• !move <1-9> - Make a move in TicTacToe

🛠️ *Utility Commands*
• !translate text|lang - Translate text
• !wordofday - Get word of the day
• !calc <expression> - Calculate math

Type any command to get started!`);
                break;
        }
    });
}

connectToWhatsApp().catch(err => console.log('Unexpected error:', err));

process.on('SIGINT', async () => {
    console.log('Shutting down...');
    process.exit(0);
});