class TicTacToe {
    constructor() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
    }

    makeMove(position) {
        if (position < 0 || position > 8 || this.board[position]) {
            return false;
        }
        this.board[position] = this.currentPlayer;
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        return true;
    }

    getBoard() {
        let display = '';
        for (let i = 0; i < 9; i += 3) {
            display += `${this.board[i] || '⬜'}${this.board[i + 1] || '⬜'}${this.board[i + 2] || '⬜'}\n`;
        }
        return display;
    }

    checkWinner() {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        for (const [a, b, c] of lines) {
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return this.board[a];
            }
        }
        return null;
    }
}

const games = new Map();

module.exports = {
    TicTacToe,
    games
};