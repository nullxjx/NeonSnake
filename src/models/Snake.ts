import { Position, Direction, SnakeType, DIRECTION_VECTORS, GRID_SIZE } from '../utils/constants';
import { getNextPosition, isValidDirection } from '../utils/collision';

export class Snake {
  body: Position[];
  direction: Direction;
  nextDirection: Direction;
  type: SnakeType;
  growing: number;
  ammo: number;
  alive: boolean;
  color: string;
  glowColor: string;

  constructor(
    startPos: Position,
    type: SnakeType = SnakeType.PLAYER,
    initialLength: number = 3
  ) {
    this.body = [];
    this.type = type;
    this.direction = Direction.RIGHT;
    this.nextDirection = Direction.RIGHT;
    this.growing = 0;
    this.ammo = type === SnakeType.PLAYER ? 10 : 0;
    this.alive = true;

    if (type === SnakeType.PLAYER) {
      this.color = '#00ff88';
      this.glowColor = '#00ff88';
    } else {
      this.color = '#aa00ff';
      this.glowColor = '#aa00ff';
    }

    // 初始化蛇身
    for (let i = 0; i < initialLength; i++) {
      this.body.push({
        x: startPos.x - i,
        y: startPos.y,
      });
    }
  }

  // 获取头部位置
  getHead(): Position {
    return this.body[0];
  }

  // 获取尾部位置
  getTail(): Position {
    return this.body[this.body.length - 1];
  }

  // 设置方向
  setDirection(direction: Direction): void {
    if (isValidDirection(this.direction, direction)) {
      this.nextDirection = direction;
    }
  }

  // 移动
  move(): void {
    if (!this.alive) return;

    this.direction = this.nextDirection;
    const newHead = getNextPosition(this.getHead(), this.direction);
    this.body.unshift(newHead);

    if (this.growing > 0) {
      this.growing--;
    } else {
      this.body.pop();
    }
  }

  // 增加长度
  grow(amount: number = 1): void {
    this.growing += amount;
  }

  // 增加弹药
  addAmmo(amount: number): void {
    this.ammo += amount;
  }

  // 消耗弹药
  useAmmo(): boolean {
    if (this.ammo > 0) {
      this.ammo--;
      return true;
    }
    return false;
  }

  // 获取蛇占据的所有位置（包括头）
  getOccupiedPositions(): Position[] {
    return [...this.body];
  }

  // 死亡
  die(): void {
    this.alive = false;
  }

  // 检查是否可以发射子弹
  canShoot(): boolean {
    return this.ammo > 0;
  }

  // AI 移动（由外部控制）
  moveTo(position: Position): void {
    if (!this.alive) return;
    this.body.unshift(position);
    if (this.growing > 0) {
      this.growing--;
    } else {
      this.body.pop();
    }
  }
}