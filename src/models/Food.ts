import { Position, FoodType, FOOD_CONFIG } from '../utils/constants';

export class Food {
  position: Position;
  type: FoodType;

  constructor(position: Position, type?: FoodType) {
    this.position = position;
    this.type = type || this.randomType();
  }

  // 随机生成食物类型
  private randomType(): FoodType {
    const rand = Math.random();
    let cumulative = 0;

    for (const [type, config] of Object.entries(FOOD_CONFIG)) {
      cumulative += config.probability;
      if (rand < cumulative) {
        return type as FoodType;
      }
    }

    return FoodType.NORMAL;
  }

  // 获取分值
  getScore(): number {
    return FOOD_CONFIG[this.type].score;
  }

  // 获取颜色
  getColor(): string {
    return FOOD_CONFIG[this.type].color;
  }

  // 获取发光颜色
  getGlowColor(): string {
    return FOOD_CONFIG[this.type].glowColor;
  }

  // 获取表情
  getEmoji(): string {
    return FOOD_CONFIG[this.type].emoji;
  }

  // 是否是弹药
  isAmmo(): boolean {
    return this.type === FoodType.AMMO;
  }
}