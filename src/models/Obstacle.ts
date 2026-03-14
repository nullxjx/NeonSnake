import { Position } from '../utils/constants';

export class Obstacle {
  positions: Position[];
  color: string;
  glowColor: string;

  constructor(positions: Position[]) {
    this.positions = positions;
    this.color = '#666666';
    this.glowColor = '#444444';
  }

  // 获取所有位置
  getPositions(): Position[] {
    return this.positions;
  }

  // 检查是否包含某位置
  contains(position: Position): boolean {
    return this.positions.some(
      pos => pos.x === position.x && pos.y === position.y
    );
  }

  // 获取位置集合（用于快速查找）
  getPositionSet(): Set<string> {
    return new Set(this.positions.map(pos => `${pos.x},${pos.y}`));
  }
}