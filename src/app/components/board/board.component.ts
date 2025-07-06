import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface Player {
  id: number;
  name: string;
  color: string;
  pieces: GamePiece[];
  isActive: boolean;
}

interface GamePiece {
  id: number;
  position: number; // -1 = home, 0-51 = board positions, 52-57 = home stretch
  isInSafeZone: boolean;
  isAtHome: boolean;
  isFinished: boolean;
}
interface Cell {
  x: number;
  y: number;
  type: 'path' | 'start' | 'home' | 'safe';
  color?: string;
  piece?: {
    id: string;
    color: string;
    playerId: number;
    position: number;
  };
}

@Component({
  selector: 'app-board',
  imports: [CommonModule],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css'
})
export class BoardComponent {
boxes = Array.from({ length: 18 }, (_, i) => i);
discs =Array.from({length:4},(_,i)=>i)
  
   players: Player[] = [
    { id: 0, name: 'Red', color: '#ff4444', pieces: [], isActive: true },
    { id: 1, name: 'Green', color: '#44ff44', pieces: [], isActive: false },
    { id: 2, name: 'Yellow', color: '#ffff44', pieces: [], isActive: false },
    { id: 3, name: 'Blue', color: '#4444ff', pieces: [], isActive: false }
  ];

  currentPlayerIndex = 0;
  diceValue = 1;
  isRolling = false;
  hasValidMove = false;
  animatingPiece = -1;
  consecutiveSixes = 0;

  boardPositions = Array.from({ length: 52 }, (_, i) => i);
  homeStretchPositions = Array.from({ length: 6 }, (_, i) => i);

  safePositions = [1, 9, 14, 22, 27, 35, 40, 48];
  startPositions = [1, 14, 27, 40];
  starPositions = [5, 18, 31, 44];

  constructor() {
    this.initializeGame();
  }

  get currentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  initializeGame() {
    this.players.forEach(player => {
      player.pieces = Array.from({ length: 4 }, (_, i) => ({
        id: i,
        position: -1,
        isInSafeZone: false,
        isAtHome: true,
        isFinished: false
      }));
    });
  }

  rollDice() {
    if (this.isRolling || this.hasValidMove) return;

    this.isRolling = true;
    this.diceValue = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      this.isRolling = false;
      this.checkForValidMoves();
    }, 500);
  }

  checkForValidMoves() {
    const player = this.currentPlayer;
    let hasMove = false;

    for (let piece of player.pieces) {
      if (this.canMovePiece(player.id, piece)) {
        hasMove = true;
        break;
      }
    }

    if (!hasMove) {
      this.endTurn();
    } else {
      this.hasValidMove = true;
    }
  }

  canMovePiece(playerId: number, piece: GamePiece): boolean {
    if (playerId !== this.currentPlayerIndex) return false;
    if (piece.isFinished) return false;

    // Can move out of home with 6
    if (piece.isAtHome && this.diceValue === 6) return true;

    // Can move on board
    if (!piece.isAtHome && !piece.isFinished) {
      const newPosition = this.calculateNewPosition(playerId, piece, this.diceValue);
      return newPosition !== -1;
    }

    return false;
  }

  calculateNewPosition(playerId: number, piece: GamePiece, steps: number): number {
    if (piece.isAtHome) {
      return this.startPositions[playerId];
    }

    const currentPos = piece.position;
    const playerStartPos = this.startPositions[playerId];

    // Check if entering home stretch
    if (currentPos < playerStartPos + 51 && currentPos + steps >= playerStartPos + 51) {
      const homeStretchPos = 52 + (currentPos + steps - (playerStartPos + 51));
      return homeStretchPos <= 57 ? homeStretchPos : -1;
    }

    // Normal board movement
    if (currentPos < 52) {
      return (currentPos + steps) % 52;
    }

    // Home stretch movement
    if (currentPos >= 52 && currentPos + steps <= 57) {
      return currentPos + steps;
    }

    return -1;
  }

  selectPiece(playerId: number, piece: GamePiece) {
    if (!this.canMovePiece(playerId, piece)) return;

    this.animatingPiece = piece.id;
    this.movePiece(playerId, piece);

    setTimeout(() => {
      this.animatingPiece = -1;
      this.checkForCapture(playerId, piece);
      this.checkGameEnd();
      
      if (this.diceValue === 6) {
        this.consecutiveSixes++;
        if (this.consecutiveSixes >= 3) {
          this.endTurn();
        } else {
          this.hasValidMove = false;
        }
      } else {
        this.endTurn();
      }
    }, 500);
  }

  movePiece(playerId: number, piece: GamePiece) {
    if (piece.isAtHome) {
      piece.isAtHome = false;
      piece.position = this.startPositions[playerId];
    } else {
      const newPos = this.calculateNewPosition(playerId, piece, this.diceValue);
      if (newPos === 58) {
        piece.isFinished = true;
        piece.position = 58;
      } else {
        piece.position = newPos;
      }
    }
  }

  checkForCapture(playerId: number, piece: GamePiece) {
    if (piece.isAtHome || piece.isFinished) return;
    if (this.isStarPosition(piece.position) || this.safePositions.includes(piece.position)) return;

    // Check if any opponent piece is on the same position
    for (let i = 0; i < this.players.length; i++) {
      if (i === playerId) continue;

      for (let opponentPiece of this.players[i].pieces) {
        if (opponentPiece.position === piece.position && !opponentPiece.isAtHome && !opponentPiece.isFinished) {
          // Send opponent piece back home
          opponentPiece.isAtHome = true;
          opponentPiece.position = -1;
          opponentPiece.isInSafeZone = false;
        }
      }
    }
  }

  checkGameEnd() {
    const finishedPieces = this.currentPlayer.pieces.filter(p => p.isFinished).length;
    if (finishedPieces === 4) {
      alert(`${this.currentPlayer.name} wins!`);
    }
  }

  endTurn() {
    this.hasValidMove = false;
    this.consecutiveSixes = 0;
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 4;
    this.players.forEach((p, i) => p.isActive = i === this.currentPlayerIndex);
  }

  skipTurn() {
    this.endTurn();
  }

  isStarPosition(position: number): boolean {
    return this.starPositions.includes(position);
  }

  getCellClass(position: number): string {
    let classes = '';
    if (this.safePositions.includes(position)) classes += 'safe ';
    if (this.startPositions.includes(position)) classes += 'start ';
    return classes;
  }

  getCellTransform(position: number): string {
    // Calculate position on the board (this is a simplified version)
    const row = Math.floor(position / 13);
    const col = position % 13;
    return `translate(${col * 40}px, ${row * 40}px)`;
  }

  getPiecesAtHome(player: Player): number {
    return player.pieces.filter(p => p.isAtHome).length;
  }

  getPiecesOnBoard(player: Player): number {
    return player.pieces.filter(p => !p.isAtHome && !p.isFinished).length;
  }

  getPiecesFinished(player: Player): number {
    return player.pieces.filter(p => p.isFinished).length;
  }
}
