import { Position, Direction, DIRECTION_VECTORS, GRID_SIZE } from '../utils/constants';

export class Bullet {
  startPos: Position;
  endPos: Position;
  direction: Direction;
  active: boolean;
  lifeTime: number; // 用于显示动画
  hitObstacle: boolean; // 是否击中了障碍物
  hitPos: Position | null; // 击中位置

  constructor(startPos: Position, direction: Direction, endPos: Position, hitObstacle: boolean = false, hitPos: Position | null = null) {
    this.startPos = { ...startPos };
    this.endPos = { ...endPos };
    this.direction = direction;
    this.active = true;
    this.lifeTime = 10; // 显示10帧后消失
    this.hitObstacle = hitObstacle;
    this.hitPos = hitPos;
  }

  // 更新子弹（主要是生命周期）
  update(): void {
    if (!this.active) return;
    
    this.lifeTime--;
    if (this.lifeTime <= 0) {
      this.active = false;
    }
  }

  // 获取当前显示位置（用于动画）
  getCurrentPos(): Position {
    // 返回终点位置（瞬间到达）
    return this.endPos;
  }

  // 销毁子弹
  destroy(): void {
    this.active = false;
  }
}

// 计算子弹路径和终点
export function calculateBulletPath(
  startPos: Position,
  direction: Direction,
  obstacles: { contains: (pos: Position) => boolean } | null
): { endPos: Position; hitObstacle: boolean; hitPos: Position | null } {
  const vector = DIRECTION_VECTORS[direction];
  let x = startPos.x;
  let y = startPos.y;
  let hitObstacle = false;
  let hitPos: Position | null = null;

  // 沿着方向一直移动，直到边界或障碍物
  while (true) {
    x += vector.x;
    y += vector.y;

    // 检查边界
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      // 超出边界，返回边界前一个位置
      x -= vector.x;
      y -= vector.y;
      break;
    }

    // 检查障碍物
    if (obstacles?.contains({ x, y })) {
      hitObstacle = true;
      hitPos = { x, y };
      // 子弹停在障碍物前一个位置
      x -= vector.x;
      y -= vector.y;
      break;
    }
  }

  return {
    endPos: { x, y },
    hitObstacle,
    hitPos,
  };
}