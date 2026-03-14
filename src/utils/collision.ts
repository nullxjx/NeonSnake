import { Position, Direction, DIRECTION_VECTORS, GRID_SIZE } from './constants';

// 检查两个位置是否相同
export function isSamePosition(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

// 检查位置是否在边界内
export function isInBounds(pos: Position): boolean {
  return pos.x >= 0 && pos.x < GRID_SIZE && pos.y >= 0 && pos.y < GRID_SIZE;
}

// 检查蛇是否撞到自己
export function checkSelfCollision(head: Position, body: Position[]): boolean {
  return body.some(segment => isSamePosition(segment, head));
}

// 检查蛇是否撞到墙
export function checkWallCollision(head: Position): boolean {
  return !isInBounds(head);
}

// 检查蛇是否撞到障碍物
export function checkObstacleCollision(head: Position, obstacles: Set<string>): boolean {
  return obstacles.has(`${head.x},${head.y}`);
}

// 检查蛇是否撞到另一条蛇
export function checkSnakeCollision(head: Position, otherSnakeBody: Position[]): boolean {
  return otherSnakeBody.some(segment => isSamePosition(segment, head));
}

// 获取下一个位置
export function getNextPosition(pos: Position, direction: Direction): Position {
  const vector = DIRECTION_VECTORS[direction];
  return {
    x: pos.x + vector.x,
    y: pos.y + vector.y,
  };
}

// 获取相反方向
export function getOppositeDirection(direction: Direction): Direction {
  const opposites = {
    [Direction.UP]: Direction.DOWN,
    [Direction.DOWN]: Direction.UP,
    [Direction.LEFT]: Direction.RIGHT,
    [Direction.RIGHT]: Direction.LEFT,
  };
  return opposites[direction];
}

// 检查方向是否有效（不能直接掉头）
export function isValidDirection(currentDir: Direction, newDir: Direction): boolean {
  return getOppositeDirection(currentDir) !== newDir;
}