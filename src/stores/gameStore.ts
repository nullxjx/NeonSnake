import { create } from 'zustand';
import { Snake } from '../models/Snake';
import { Food } from '../models/Food';
import { Bullet, calculateBulletPath } from '../models/Bullet';
import { Obstacle } from '../models/Obstacle';
import {
  Position,
  Direction,
  GameState,
  GameMode,
  GRID_SIZE,
  SPEED_LEVELS,
  AI_ONLY_SPEED,
  SnakeType,
  FoodType,
  PathfindingAlgorithm,
  AIStatus,
} from '../utils/constants';
import {
  checkSelfCollision,
  checkWallCollision,
  checkObstacleCollision,
  checkSnakeCollision,
} from '../utils/collision';
import { findLongestPath, safeAStar, findSafestPathToTail, getBestMove, floodFill } from '../utils/pathfinding';

// 吃食物动画效果
interface EatEffect {
  x: number;
  y: number;
  type: FoodType;
  life: number;
  maxLife: number;
}

// AI路径显示
interface AIPath {
  path: Position[];
  targetFood: Position | null;
  life: number;
}

interface GameStore {
  // 游戏状态
  gameState: GameState;
  gameMode: GameMode;
  speed: number;
  normalSpeed: number; // 保存普通模式的速度选择
  score: number;
  aiScore: number; // AI得分
  gameTime: number;

  // 游戏对象
  playerSnake: Snake | null;
  aiSnake: Snake | null;
  foods: Food[];
  bullets: Bullet[];
  obstacles: Obstacle | null;

  // 特效
  eatEffects: EatEffect[];
  aiPath: AIPath | null; // AI当前路径

  // AI设置
  aiAlgorithm: PathfindingAlgorithm;
  aiStatus: AIStatus; // AI当前行为状态

  // 设置
  showGrid: boolean;
  soundEnabled: boolean;

  // 方法
  initGame: (mode?: GameMode) => void;
  startGame: () => void;
  togglePause: () => void;
  restartGame: () => void;
  gameOver: () => void;
  updateGame: () => void;
  shootBullet: () => void;
  setGameMode: (mode: GameMode) => void;
  setSpeed: (speed: number) => void;
  setAIAlgorithm: (algorithm: PathfindingAlgorithm) => void;
  backToMenu: () => void;
  toggleGrid: () => void;
  toggleSound: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: GameState.MENU,
  gameMode: GameMode.CLASSIC,
  speed: SPEED_LEVELS.normal,
  normalSpeed: SPEED_LEVELS.normal,
  score: 0,
  aiScore: 0,
  gameTime: 0,

  playerSnake: null,
  aiSnake: null,
  foods: [],
  bullets: [],
  obstacles: null,

  eatEffects: [],
  aiPath: null,

  aiAlgorithm: PathfindingAlgorithm.ASTAR,
  aiStatus: AIStatus.PATHFINDING,

  showGrid: true,
  soundEnabled: true,

  initGame: (mode?: GameMode) => {
    // 确定实际使用的游戏模式
    const actualMode = mode ?? GameMode.CLASSIC;
    const { normalSpeed } = get();

    // 纯AI模式使用更慢的速度
    let gameSpeed = normalSpeed;
    if (actualMode === GameMode.AI_ONLY) {
      // 根据normalSpeed选择对应的AI速度
      if (normalSpeed === SPEED_LEVELS.slow) gameSpeed = AI_ONLY_SPEED.slow;
      else if (normalSpeed === SPEED_LEVELS.normal) gameSpeed = AI_ONLY_SPEED.normal;
      else if (normalSpeed === SPEED_LEVELS.fast) gameSpeed = AI_ONLY_SPEED.fast;
      else if (normalSpeed === SPEED_LEVELS.very_fast) gameSpeed = AI_ONLY_SPEED.very_fast;
    }

    // 创建玩家蛇（纯AI模式下不需要玩家蛇）
    let playerSnake = null;
    if (actualMode !== GameMode.AI_ONLY) {
      playerSnake = new Snake({ x: 5, y: 10 }, SnakeType.PLAYER, 3);
    }

    // 创建AI蛇（在AI对战模式和纯AI模式下）
    let aiSnake = null;
    if (actualMode === GameMode.VS_AI || actualMode === GameMode.AI_ONLY) {
      aiSnake = new Snake({ x: 14, y: 10 }, SnakeType.AI, 3);
      aiSnake.direction = Direction.LEFT;
      aiSnake.nextDirection = Direction.LEFT;
    }

    // 创建障碍物（挑战模式、AI对战模式和纯AI模式）
    let obstacles = null;
    if (actualMode === GameMode.CHALLENGE || actualMode === GameMode.VS_AI || actualMode === GameMode.AI_ONLY) {
      obstacles = generateObstacles();
    }

    // 生成初始食物
    const foods = [generateFood([], obstacles, actualMode)];

    set({
      gameState: GameState.MENU,
      gameMode: actualMode,
      speed: gameSpeed,
      playerSnake,
      aiSnake,
      foods,
      bullets: [],
      obstacles,
      eatEffects: [],
      aiPath: null,
      score: 0,
      aiScore: 0,
      gameTime: 0,
      aiStatus: AIStatus.PATHFINDING,
    });
  },

  startGame: () => {
    set({ gameState: GameState.PLAYING });
  },

  togglePause: () => {
    const { gameState } = get();
    if (gameState === GameState.PLAYING) {
      set({ gameState: GameState.PAUSED });
    } else if (gameState === GameState.PAUSED) {
      set({ gameState: GameState.PLAYING });
    }
  },

  restartGame: () => {
    const { gameMode, initGame } = get();
    initGame(gameMode);
    set({ gameState: GameState.PLAYING });
  },

  gameOver: () => {
    set({ gameState: GameState.GAME_OVER });
  },

  updateGame: () => {
    const {
      playerSnake,
      aiSnake,
      foods,
      bullets,
      obstacles,
      score,
      aiScore,
      gameMode,
      aiAlgorithm,
      gameOver,
    } = get();

    const obstacleSet = obstacles?.getPositionSet() || new Set<string>();
    let newAISnake = aiSnake;
    let newAIPath: AIPath | null = get().aiPath;
    let newAIScore = aiScore;
    let newAIStatus: AIStatus = AIStatus.PATHFINDING;

    // AI蛇逻辑（在纯AI模式下优先执行）
    if (aiSnake && aiSnake.alive) {
      // AI寻路
      const aiHead = aiSnake.getHead();
      const aiBody = aiSnake.body;

      // 找到最近的食物
      let targetFood = foods[0];
      let minDistance = Infinity;

      for (const food of foods) {
        const dist = Math.abs(food.position.x - aiHead.x) + Math.abs(food.position.y - aiHead.y);
        if (dist < minDistance) {
          minDistance = dist;
          targetFood = food;
        }
      }

      // 根据选择的算法进行寻路
      let path: Position[] | null = null;
      let isChasingFood = false;
      let isFollowingTail = false;
      const tail = aiSnake.getTail();
      
      switch (aiAlgorithm) {
        case PathfindingAlgorithm.BFS:
          // BFS + 安全检查
          path = safeAStar(aiHead, targetFood.position, obstacleSet, aiBody);
          if (path) {
            isChasingFood = true;
          } else {
            path = findSafestPathToTail(aiHead, tail, obstacleSet, aiBody);
            isFollowingTail = true;
          }
          break;
        case PathfindingAlgorithm.GREEDY:
          // 贪心算法 + 安全检查
          path = safeAStar(aiHead, targetFood.position, obstacleSet, aiBody);
          if (path) {
            isChasingFood = true;
          } else {
            path = findSafestPathToTail(aiHead, tail, obstacleSet, aiBody);
            isFollowingTail = true;
          }
          break;
        case PathfindingAlgorithm.LONGEST_PATH:
          // 最长路径算法 - 故意绕远路，同时保持安全
          path = findLongestPath(aiHead, tail, obstacleSet, aiBody);
          if (!path || path.length <= 1) {
            path = findSafestPathToTail(aiHead, tail, obstacleSet, aiBody);
            isFollowingTail = true;
          }
          break;
        case PathfindingAlgorithm.ASTAR:
        default:
          // 使用智能最佳移动算法
          const bestMove = getBestMove(aiHead, targetFood.position, tail, obstacleSet, aiBody);
          if (bestMove) {
            path = bestMove.path;
            // 判断是追击食物还是跟随尾巴
            if (path[path.length - 1].x === targetFood.position.x && path[path.length - 1].y === targetFood.position.y) {
              isChasingFood = true;
            } else if (path[path.length - 1].x === tail.x && path[path.length - 1].y === tail.y) {
              isFollowingTail = true;
            }
          }
          break;
      }

      // 最后的备选方案：无论如何都要找一个安全的移动
      if (!path || path.length <= 1) {
        path = findSafestPathToTail(aiHead, tail, obstacleSet, aiBody);
        isFollowingTail = true;
      }

      // 计算可用空间比例来判断空间是否受限
      const availableSpace = floodFill(aiHead, obstacleSet, aiBody, false);
      const totalSpace = GRID_SIZE * GRID_SIZE;
      const spaceRatio = availableSpace / totalSpace;

      // 判断AI当前状态
      if (!path || path.length <= 1) {
        newAIStatus = AIStatus.EMERGENCY_ESCAPE;
      } else if (spaceRatio < 0.15) {
        newAIStatus = AIStatus.SPACE_LIMITED;
      } else if (path.length === 2) {
        newAIStatus = AIStatus.LOCKED_ON;
      } else if (path.length <= 4) {
        newAIStatus = AIStatus.APPROACHING_TARGET;
      } else if (aiAlgorithm === PathfindingAlgorithm.LONGEST_PATH && !isFollowingTail) {
        newAIStatus = AIStatus.CIRCUITOUS;
      } else if (isFollowingTail) {
        newAIStatus = AIStatus.SAFE_CRUISE;
      } else if (isChasingFood) {
        newAIStatus = AIStatus.CHASING_FOOD;
      } else {
        newAIStatus = AIStatus.PATHFINDING;
      }

      // 更新AI路径显示（用于纯AI模式可视化）
      if (path && path.length > 0) {
        newAIPath = {
          path: path,
          targetFood: targetFood.position,
          life: 5, // 显示5帧
        };
      }

      if (path && path.length > 1) {
        const nextPos = path[1];
        const dx = nextPos.x - aiHead.x;
        const dy = nextPos.y - aiHead.y;

        if (dx === 1) aiSnake.setDirection(Direction.RIGHT);
        else if (dx === -1) aiSnake.setDirection(Direction.LEFT);
        else if (dy === 1) aiSnake.setDirection(Direction.DOWN);
        else if (dy === -1) aiSnake.setDirection(Direction.UP);

        aiSnake.move();

        // 检查AI蛇是否撞到障碍物（安全检查）
        const newAIHead = aiSnake.getHead();
        if (checkObstacleCollision(newAIHead, obstacleSet) ||
            checkWallCollision(newAIHead) ||
            checkSelfCollision(newAIHead, aiSnake.body.slice(1))) {
          aiSnake.die();
          // 纯AI模式下AI死亡也结束游戏
          if (gameMode === GameMode.AI_ONLY) {
            gameOver();
          }
        }
      } else {
        // AI死亡
        aiSnake.die();
        newAIStatus = AIStatus.DEAD;
        if (gameMode === GameMode.AI_ONLY) {
          gameOver();
        }
      }
    }

    // 纯AI模式下不需要玩家蛇逻辑
    if (gameMode === GameMode.AI_ONLY) {
      // AI吃食物逻辑
      let newFoods = [...foods];

      if (aiSnake && aiSnake.alive) {
        const newAIHead = aiSnake.getHead();
        for (let i = newFoods.length - 1; i >= 0; i--) {
          if (
            newAIHead.x === newFoods[i].position.x &&
            newAIHead.y === newFoods[i].position.y
          ) {
            const food = newFoods[i];
            newAIScore += food.getScore();
            aiSnake.grow(1);
            newFoods.splice(i, 1);
            break;
          }
        }
      } else if (aiSnake && !aiSnake.alive) {
        // AI死亡时设置状态
        newAIStatus = AIStatus.DEAD;
      }

      // 补充食物
      while (newFoods.length < 5) {
        const occupiedPositions = [
          ...(aiSnake?.getOccupiedPositions() || []),
          ...newFoods.map(f => f.position),
        ];
        newFoods.push(generateFood(occupiedPositions, obstacles, gameMode));
      }

      // 更新AI路径生命周期
      if (newAIPath) {
        newAIPath.life--;
        if (newAIPath.life <= 0) {
          newAIPath = null;
        }
      }

      set({
        aiSnake: newAISnake,
        foods: newFoods,
        aiScore: newAIScore,
        aiPath: newAIPath,
        aiStatus: newAIStatus,
        gameTime: get().gameTime + get().speed / 1000,
      });
      return;
    }

    // 非纯AI模式下的原有逻辑
    if (!playerSnake || !playerSnake.alive) return;

    // 移动玩家蛇
    playerSnake.move();
    const playerHead = playerSnake.getHead();

    // 检查玩家蛇碰撞
    if (
      checkWallCollision(playerHead) ||
      checkSelfCollision(playerHead, playerSnake.body.slice(1)) ||
      checkObstacleCollision(playerHead, obstacleSet)
    ) {
      playerSnake.die();
      gameOver();
      return;
    }

    // 检查玩家蛇是否撞到AI蛇
    if (aiSnake) {
      if (checkSnakeCollision(playerHead, aiSnake.body)) {
        playerSnake.die();
        gameOver();
        return;
      }
    }

    // 检查玩家蛇吃食物
    let newFoods = [...foods];
    let newScore = score;
    const newEatEffects = [...get().eatEffects];

    for (let i = newFoods.length - 1; i >= 0; i--) {
      if (
        playerHead.x === newFoods[i].position.x &&
        playerHead.y === newFoods[i].position.y
      ) {
        const food = newFoods[i];
        newScore += food.getScore();
        playerSnake.grow(1);

        if (food.isAmmo()) {
          playerSnake.addAmmo(1);
        }

        // 添加吃食物动画效果
        newEatEffects.push({
          x: food.position.x,
          y: food.position.y,
          type: food.type,
          life: 20,
          maxLife: 20,
        });

        newFoods.splice(i, 1);
      }
    }

    // AI吃食物逻辑（在VS_AI模式下）
    if (aiSnake && aiSnake.alive) {
      const newAIHead = aiSnake.getHead();
      for (let i = newFoods.length - 1; i >= 0; i--) {
        if (
          newAIHead.x === newFoods[i].position.x &&
          newAIHead.y === newFoods[i].position.y
        ) {
          const food = newFoods[i];
          newAIScore += food.getScore();
          aiSnake.grow(1);
          newFoods.splice(i, 1);
          break;
        }
      }
    }

    // 补充食物（同时存在5个，更容易找到弹药）
    while (newFoods.length < 5) {
      const occupiedPositions = [
        ...playerSnake.getOccupiedPositions(),
        ...(aiSnake?.getOccupiedPositions() || []),
        ...newFoods.map(f => f.position),
      ];
      newFoods.push(generateFood(occupiedPositions, obstacles, gameMode));
    }

    // 更新AI路径生命周期
    // 更新AI路径生命周期
    if (newAIPath) {
      newAIPath.life--;
      if (newAIPath.life <= 0) {
        newAIPath = null;
      }
    }

    // 更新子弹（仅用于显示轨迹动画，碰撞已在发射时处理）
    const newBullets = bullets
      .map(bullet => {
        bullet.update();
        return bullet;
      })
      .filter(bullet => bullet.active);

    // 更新吃食物动画效果
    const updatedEatEffects = newEatEffects
      .map(effect => ({ ...effect, life: effect.life - 1 }))
      .filter(effect => effect.life > 0);

    set({
      playerSnake,
      aiSnake: newAISnake,
      foods: newFoods,
      bullets: newBullets,
      obstacles,
      score: newScore,
      aiScore: newAIScore,
      aiPath: newAIPath,
      eatEffects: updatedEatEffects,
      gameTime: get().gameTime + get().speed / 1000,
    });
  },

  shootBullet: () => {
    const { playerSnake, bullets, obstacles, gameMode } = get();

    // 经典模式下不能发射子弹
    if (gameMode === GameMode.CLASSIC) return;

    if (playerSnake && playerSnake.canShoot()) {
      playerSnake.useAmmo();
      const head = playerSnake.getHead();

      // 计算子弹路径（瞬间到达终点或击中障碍物）
      const path = calculateBulletPath(head, playerSnake.direction, obstacles);

      // 如果击中了障碍物，立即移除
      if (path.hitObstacle && path.hitPos && obstacles) {
        obstacles.positions = obstacles.positions.filter(
          pos => !(pos.x === path.hitPos!.x && pos.y === path.hitPos!.y)
        );
      }

      // 创建子弹（用于显示轨迹动画）
      const bullet = new Bullet(
        head,
        playerSnake.direction,
        path.endPos,
        path.hitObstacle,
        path.hitPos
      );

      set({ bullets: [...bullets, bullet] });
    }
  },

  setGameMode: (mode: GameMode) => {
    const { normalSpeed } = get();

    // 根据模式调整速度
    let gameSpeed = normalSpeed;
    if (mode === GameMode.AI_ONLY) {
      if (normalSpeed === SPEED_LEVELS.slow) gameSpeed = AI_ONLY_SPEED.slow;
      else if (normalSpeed === SPEED_LEVELS.normal) gameSpeed = AI_ONLY_SPEED.normal;
      else if (normalSpeed === SPEED_LEVELS.fast) gameSpeed = AI_ONLY_SPEED.fast;
      else if (normalSpeed === SPEED_LEVELS.very_fast) gameSpeed = AI_ONLY_SPEED.very_fast;
    }

    set({ gameMode: mode, speed: gameSpeed });
    get().initGame(mode);
  },

  setSpeed: (speed: number) => {
    const { gameMode } = get();

    // 保存普通模式的速度选择
    let gameSpeed = speed;
    if (gameMode === GameMode.AI_ONLY) {
      // 纯AI模式使用更慢的速度
      if (speed === SPEED_LEVELS.slow) gameSpeed = AI_ONLY_SPEED.slow;
      else if (speed === SPEED_LEVELS.normal) gameSpeed = AI_ONLY_SPEED.normal;
      else if (speed === SPEED_LEVELS.fast) gameSpeed = AI_ONLY_SPEED.fast;
      else if (speed === SPEED_LEVELS.very_fast) gameSpeed = AI_ONLY_SPEED.very_fast;
    }

    set({ speed: gameSpeed, normalSpeed: speed });
  },

  setAIAlgorithm: (algorithm: PathfindingAlgorithm) => {
    set({ aiAlgorithm: algorithm });
  },

  backToMenu: () => {
    set({ gameState: GameState.MENU });
  },

  toggleGrid: () => {
    set(state => ({ showGrid: !state.showGrid }));
  },

  toggleSound: () => {
    set(state => ({ soundEnabled: !state.soundEnabled }));
  },
}));

// 生成随机食物
function generateFood(
  occupiedPositions: Position[],
  obstacles: Obstacle | null,
  gameMode: GameMode = GameMode.CLASSIC
): Food {
  const obstacleSet = obstacles?.getPositionSet() || new Set<string>();
  const occupiedSet = new Set(occupiedPositions.map(p => `${p.x},${p.y}`));

  let position: Position;
  do {
    position = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (occupiedSet.has(`${position.x},${position.y}`) || obstacleSet.has(`${position.x},${position.y}`));

  // 经典模式和纯AI模式下不生成弹药食物
  if (gameMode === GameMode.CLASSIC || gameMode === GameMode.AI_ONLY) {
    // 随机选择普通或高级食物
    const rand = Math.random();
    const type = rand < 0.8 ? FoodType.NORMAL : FoodType.PREMIUM;
    return new Food(position, type);
  }

  return new Food(position);
}

// 生成障碍物（墙段形式）
function generateObstacles(): Obstacle {
  const positions: Position[] = [];
  const occupied = new Set<string>();
  
  // 定义保护区域（蛇初始位置）
  const protectedZones = [
    { xMin: 2, xMax: 8, yMin: 8, yMax: 12 },  // 玩家蛇区域
    { xMin: 12, xMax: 18, yMin: 8, yMax: 12 }, // AI蛇区域
  ];
  
  // 检查位置是否在保护区域
  const isProtected = (x: number, y: number): boolean => {
    return protectedZones.some(
      zone => x >= zone.xMin && x <= zone.xMax && y >= zone.yMin && y <= zone.yMax
    );
  };
  
  // 检查位置是否已被占用
  const isOccupied = (x: number, y: number): boolean => {
    return occupied.has(`${x},${y}`);
  };
  
  // 生成4-6堵墙
  const numWalls = 4 + Math.floor(Math.random() * 3);
  
  for (let w = 0; w < numWalls; w++) {
    // 随机选择墙类型：0=水平, 1=垂直
    const wallType = Math.random() < 0.5 ? 'horizontal' : 'vertical';
    const wallLength = 3 + Math.floor(Math.random() * 3); // 3-5格长
    
    // 找到有效起始位置
    let attempts = 0;
    let validStart = false;
    let startX = 0;
    let startY = 0;
    
    while (!validStart && attempts < 50) {
      startX = Math.floor(Math.random() * GRID_SIZE);
      startY = Math.floor(Math.random() * GRID_SIZE);
      
      // 检查起始位置和保护区域
      if (isProtected(startX, startY) || isOccupied(startX, startY)) {
        attempts++;
        continue;
      }
      
      // 检查整堵墙是否都能放置
      let canPlace = true;
      for (let i = 0; i < wallLength; i++) {
        const x = wallType === 'horizontal' ? startX + i : startX;
        const y = wallType === 'horizontal' ? startY : startY + i;
        
        // 检查边界
        if (x >= GRID_SIZE || y >= GRID_SIZE) {
          canPlace = false;
          break;
        }
        
        // 检查保护区域和占用
        if (isProtected(x, y) || isOccupied(x, y)) {
          canPlace = false;
          break;
        }
      }
      
      if (canPlace) {
        validStart = true;
      }
      attempts++;
    }
    
    // 放置墙
    if (validStart) {
      for (let i = 0; i < wallLength; i++) {
        const x = wallType === 'horizontal' ? startX + i : startX;
        const y = wallType === 'horizontal' ? startY : startY + i;
        positions.push({ x, y });
        occupied.add(`${x},${y}`);
      }
    }
  }
  
  return new Obstacle(positions);
}