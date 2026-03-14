import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Direction } from '../utils/constants';

export function useInputHandler() {
  const {
    gameState,
    playerSnake,
    togglePause,
    restartGame,
    shootBullet,
  } = useGameStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (gameState === 'game_over') {
        if (e.key === 'Escape') {
          restartGame();
        }
        return;
      }

      if (gameState === 'playing') {
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            e.preventDefault();
            playerSnake?.setDirection(Direction.UP);
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            e.preventDefault();
            playerSnake?.setDirection(Direction.DOWN);
            break;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            e.preventDefault();
            playerSnake?.setDirection(Direction.LEFT);
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            e.preventDefault();
            playerSnake?.setDirection(Direction.RIGHT);
            break;
          case 'Shift':
            e.preventDefault();
            shootBullet();
            break;
          case ' ':
            e.preventDefault();
            togglePause();
            break;
          case 'Escape':
            e.preventDefault();
            restartGame();
            break;
        }
      } else if (gameState === 'paused') {
        if (e.key === ' ') {
          e.preventDefault();
          togglePause();
        }
      } else if (gameState === 'menu') {
        if (e.key === 'Escape') {
          restartGame();
        }
      }
    },
    [gameState, playerSnake, togglePause, restartGame, shootBullet]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}