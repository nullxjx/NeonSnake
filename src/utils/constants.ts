// 游戏常量
export const GRID_SIZE = 20;
export const CELL_SIZE = 25;
export const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

// 游戏速度（毫秒）
export const SPEED_LEVELS = {
  slow: 200,
  normal: 150,
  fast: 100,
  very_fast: 70,
};

// 纯AI模式速度（更慢，方便观察）
export const AI_ONLY_SPEED = {
  slow: 300,
  normal: 250,
  fast: 200,
  very_fast: 150,
};

// AI寻路算法类型
export enum PathfindingAlgorithm {
  ASTAR = 'astar',           // A*算法（最短路径）
  BFS = 'bfs',               // 广度优先搜索
  GREEDY = 'greedy',         // 贪心算法（只看距离）
  LONGEST_PATH = 'longest',  // 最长路径（绕远路）
}

// 食物类型
export enum FoodType {
  NORMAL = 'normal',    // 🍎 +1分
  PREMIUM = 'premium',  // 🍋 +3分
  AMMO = 'ammo',        // 🔫 子弹
}

export const FOOD_CONFIG = {
  [FoodType.NORMAL]: {
    score: 1,
    color: '#ff3366',
    glowColor: '#ff3366',
    probability: 0.7,
    emoji: '🍎',
  },
  [FoodType.PREMIUM]: {
    score: 3,
    color: '#ffcc00',
    glowColor: '#ffcc00',
    probability: 0.2,
    emoji: '🍋',
  },
  [FoodType.AMMO]: {
    score: 0,
    color: '#00ccff',
    glowColor: '#00ccff',
    probability: 0.25,
    emoji: '🔫',
  },
};

// 方向
export enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

export const DIRECTION_VECTORS = {
  [Direction.UP]: { x: 0, y: -1 },
  [Direction.DOWN]: { x: 0, y: 1 },
  [Direction.LEFT]: { x: -1, y: 0 },
  [Direction.RIGHT]: { x: 1, y: 0 },
};

// 游戏模式
export enum GameMode {
  CLASSIC = 'classic',       // 经典模式
  CHALLENGE = 'challenge',   // 挑战模式（有障碍物）
  VS_AI = 'vs-ai',          // 对战AI模式
  AI_ONLY = 'ai-only',      // 纯AI模式（观察AI行为）
}

// 游戏状态
export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
}

// 坐标类型
export interface Position {
  x: number;
  y: number;
}

// 蛇类型
export enum SnakeType {
  PLAYER = 'player',
  AI = 'ai',
}

// AI 行为状态
export enum AIStatus {
  CHASING_FOOD = 'chasing_food',       // 🍎 追击食物
  SAFE_CRUISE = 'safe_cruise',         // 🛡️ 安全巡航（跟随尾巴）
  CIRCUITOUS = 'circuitous',           // 🔄 绕路中（最长路径）
  PATHFINDING = 'pathfinding',         // 🔍 寻路中
  SPACE_LIMITED = 'space_limited',     // ⚠️ 空间受限
  EMERGENCY_ESCAPE = 'emergency_escape', // 🚨 紧急逃生
  APPROACHING_TARGET = 'approaching_target', // 📍 接近目标
  LOCKED_ON = 'locked_on',             // 🎯 锁定食物（下一步吃到）
  DEAD = 'dead',                       // 💀 已死亡
}