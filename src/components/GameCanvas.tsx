import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import {
  CANVAS_SIZE,
  CELL_SIZE,
  GRID_SIZE,
  GameState,
  Direction,
  GameMode,
} from '../utils/constants';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  
  const {
    gameState,
    playerSnake,
    aiSnake,
    foods,
    bullets,
    obstacles,
    eatEffects,
    aiPath,
    gameMode,
    showGrid,
    speed,
    updateGame,
  } = useGameStore();

  // 绘制网格
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return;
    
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.08)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = i * CELL_SIZE;
      
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, CANVAS_SIZE);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(CANVAS_SIZE, pos);
      ctx.stroke();
    }
  }, [showGrid]);

  // 获取方向角度
  const getDirectionAngle = (from: {x: number, y: number}, to: {x: number, y: number}): number => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.atan2(dy, dx);
  };

  // 绘制蛇 - 新的圆润风格
  const drawSnake = useCallback((ctx: CanvasRenderingContext2D, snake: typeof playerSnake) => {
    if (!snake || snake.body.length === 0) return;
    
    const body = snake.body;
    const isPlayer = snake.type === 'player';
    
    // 绘制蛇身连接线（让蛇看起来更连贯）
    ctx.strokeStyle = snake.color;
    ctx.lineWidth = CELL_SIZE * 0.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 发光效果
    ctx.shadowBlur = 15;
    ctx.shadowColor = snake.glowColor;
    
    // 绘制连接线
    ctx.beginPath();
    body.forEach((segment, index) => {
      const x = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const y = segment.y * CELL_SIZE + CELL_SIZE / 2;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // 绘制每个节点（圆润的球体）
    body.forEach((segment, index) => {
      const x = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const y = segment.y * CELL_SIZE + CELL_SIZE / 2;
      const isHead = index === 0;
      const isTail = index === body.length - 1;
      
      // 节点大小（头部更大，尾部更小）
      let radius = isHead ? CELL_SIZE * 0.45 : CELL_SIZE * 0.35;
      if (isTail) radius = CELL_SIZE * 0.25;
      
      // 发光强度
      ctx.shadowBlur = isHead ? 25 : 10;
      ctx.shadowColor = snake.glowColor;
      
      // 创建径向渐变（立体感）
      const gradient = ctx.createRadialGradient(
        x - radius * 0.3,
        y - radius * 0.3,
        0,
        x,
        y,
        radius
      );
      
      if (isHead) {
        // 头部：亮色中心
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, snake.color);
        gradient.addColorStop(1, snake.color + '80');
      } else {
        // 身体：渐变透明
        const alpha = Math.max(0.3, 1 - (index / body.length) * 0.5);
        gradient.addColorStop(0, lightenColor(snake.color, 30));
        gradient.addColorStop(0.5, snake.color);
        gradient.addColorStop(1, snake.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
      }
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // 头部绘制眼睛
      if (isHead) {
        ctx.shadowBlur = 0;
        
        // 根据方向确定眼睛位置
        const dir = snake.direction;
        let eyeOffsetX = 0, eyeOffsetY = 0;
        let eyeDist = 5;
        
        switch(dir) {
          case Direction.UP:
            eyeOffsetX = eyeDist; eyeOffsetY = -3;
            break;
          case Direction.DOWN:
            eyeOffsetX = eyeDist; eyeOffsetY = 3;
            break;
          case Direction.LEFT:
            eyeOffsetX = -3; eyeOffsetY = eyeDist;
            break;
          case Direction.RIGHT:
            eyeOffsetX = 3; eyeOffsetY = eyeDist;
            break;
        }
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x - eyeOffsetX * 0.6, y - eyeOffsetY * 0.6, 3, 0, Math.PI * 2);
        ctx.arc(x + eyeOffsetX * 0.6, y + eyeOffsetY * 0.6, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 眼睛高光
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - eyeOffsetX * 0.6 + 1, y - eyeOffsetY * 0.6 - 1, 1.5, 0, Math.PI * 2);
        ctx.arc(x + eyeOffsetX * 0.6 + 1, y + eyeOffsetY * 0.6 - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    ctx.shadowBlur = 0;
  }, []);

  // 绘制食物
  const drawFoods = useCallback((ctx: CanvasRenderingContext2D) => {
    foods.forEach(food => {
      const x = food.position.x * CELL_SIZE + CELL_SIZE / 2;
      const y = food.position.y * CELL_SIZE + CELL_SIZE / 2;
      const radius = CELL_SIZE / 2 - 4;
      
      // 发光效果
      ctx.shadowBlur = 20;
      ctx.shadowColor = food.getGlowColor();
      
      // 食物主体 - 更圆润的球体
      const gradient = ctx.createRadialGradient(
        x - radius * 0.3,
        y - radius * 0.3,
        0,
        x,
        y,
        radius
      );
      gradient.addColorStop(0, lightenColor(food.getColor(), 40));
      gradient.addColorStop(0.6, food.getColor());
      gradient.addColorStop(1, food.getColor() + 'aa');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // 高光
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
      
      // 绘制矢量图标（不使用emoji，更高清）
      if (food.type === 'normal') {
        // 苹果形状
        drawAppleIcon(ctx, x, y, radius);
      } else if (food.type === 'premium') {
        // 柠檬形状
        drawLemonIcon(ctx, x, y, radius);
      } else if (food.type === 'ammo') {
        // 弹药/枪图标
        drawAmmoIcon(ctx, x, y, radius);
      }
    });
  }, [foods]);

  // 绘制吃食物动画效果
  const drawEatEffects = useCallback((ctx: CanvasRenderingContext2D) => {
    eatEffects.forEach(effect => {
      const x = effect.x * CELL_SIZE + CELL_SIZE / 2;
      const y = effect.y * CELL_SIZE + CELL_SIZE / 2;
      const progress = effect.life / effect.maxLife;
      const alpha = progress;
      const scale = 1 + (1 - progress) * 2;

      let color = '#ffffff';
      if (effect.type === 'normal') color = '#ff3366';
      else if (effect.type === 'premium') color = '#ffcc00';
      else if (effect.type === 'ammo') color = '#00ccff';

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // 扩散的光环
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.strokeStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(0, 0, CELL_SIZE * 0.4, 0, Math.PI * 2);
      ctx.stroke();

      // 中心闪光
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, CELL_SIZE * 0.2, 0, Math.PI * 2);
      ctx.fill();

      // 飞溅粒子
      const particleCount = 6;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + (effect.life * 0.2);
        const dist = (1 - progress) * CELL_SIZE * 1.5;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        const particleSize = progress * 4;

        ctx.fillStyle = color + Math.floor(alpha * 200).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(px, py, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // 分数/弹药文字提示
      if (effect.life > 10) {
        ctx.scale(1 / scale, 1 / scale);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let text = '';
        if (effect.type === 'normal') text = '+1';
        else if (effect.type === 'premium') text = '+3';
        else if (effect.type === 'ammo') text = '+1🔫';
        ctx.fillText(text, 0, -CELL_SIZE * (1 - progress + 0.5));
      }

      ctx.restore();
    });
  }, [eatEffects]);

  // 绘制子弹（能量弹药轨迹 - 与弹药食物风格一致）
  const drawBullets = useCallback((ctx: CanvasRenderingContext2D) => {
    bullets.forEach(bullet => {
      const startX = bullet.startPos.x * CELL_SIZE + CELL_SIZE / 2;
      const startY = bullet.startPos.y * CELL_SIZE + CELL_SIZE / 2;
      const endX = bullet.endPos.x * CELL_SIZE + CELL_SIZE / 2;
      const endY = bullet.endPos.y * CELL_SIZE + CELL_SIZE / 2;

      // 计算透明度（随生命周期淡出）
      const alpha = bullet.lifeTime / 10;

      // 能量光束 - 蓝色系（与弹药食物一致）
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00ccff';

      // 绘制光束轨迹
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, `rgba(0, 204, 255, ${alpha * 0.3})`);
      gradient.addColorStop(0.5, `rgba(0, 204, 255, ${alpha * 0.8})`);
      gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // 内部细线
      ctx.lineWidth = 3;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // 击中点特效
      if (bullet.hitObstacle && bullet.hitPos) {
        const hitX = bullet.hitPos.x * CELL_SIZE + CELL_SIZE / 2;
        const hitY = bullet.hitPos.y * CELL_SIZE + CELL_SIZE / 2;

        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff6600';
        ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(hitX, hitY, 8 + (10 - bullet.lifeTime) * 2, 0, Math.PI * 2);
        ctx.fill();

        // 爆炸碎片
        ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI / 2) + (bullet.lifeTime * 0.5);
          const dist = 10 - bullet.lifeTime;
          const fx = hitX + Math.cos(angle) * dist;
          const fy = hitY + Math.sin(angle) * dist;
          ctx.beginPath();
          ctx.arc(fx, fy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 子弹头（能量核心）
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ffffff';
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(endX, endY, 5, 0, Math.PI * 2);
      ctx.fill();

      // 外圈光晕
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00ccff';
      ctx.fillStyle = `rgba(0, 204, 255, ${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(endX, endY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    });
  }, [bullets]);

  // 绘制AI路径（纯AI模式显示 - 更微妙的视觉效果）
  const drawAIPath = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!aiPath || !aiPath.path || aiPath.path.length < 2) return;

    const alpha = 0.3; // 固定低透明度，不闪烁

    // 绘制虚线路径线（更微妙）
    ctx.shadowBlur = 0; // 无发光效果
    ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`; // 淡蓝色，不刺眼
    ctx.lineWidth = 1; // 细线
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([4, 4]); // 虚线效果

    ctx.beginPath();
    aiPath.path.forEach((pos, index) => {
      const x = pos.x * CELL_SIZE + CELL_SIZE / 2;
      const y = pos.y * CELL_SIZE + CELL_SIZE / 2;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.setLineDash([]); // 重置为实线

    // 只在起点和终点绘制小点
    const startPos = aiPath.path[0];
    const endPos = aiPath.path[aiPath.path.length - 1];

    // 起点 - 小绿点
    ctx.fillStyle = `rgba(0, 255, 136, ${alpha + 0.2})`;
    ctx.beginPath();
    ctx.arc(
      startPos.x * CELL_SIZE + CELL_SIZE / 2,
      startPos.y * CELL_SIZE + CELL_SIZE / 2,
      2, 0, Math.PI * 2
    );
    ctx.fill();

    // 终点（目标食物）-  subtle pulsing ring
    if (aiPath.targetFood) {
      const tx = aiPath.targetFood.x * CELL_SIZE + CELL_SIZE / 2;
      const ty = aiPath.targetFood.y * CELL_SIZE + CELL_SIZE / 2;

      // 淡淡的圆圈标记目标
      ctx.strokeStyle = `rgba(255, 100, 100, ${alpha + 0.1})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(tx, ty, 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }, [aiPath]);

  // 绘制障碍物
  const drawObstacles = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!obstacles) return;
    
    obstacles.positions.forEach(pos => {
      const x = pos.x * CELL_SIZE + CELL_SIZE / 2;
      const y = pos.y * CELL_SIZE + CELL_SIZE / 2;
      const size = CELL_SIZE - 4;
      
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#444444';
      
      // 障碍物 - 圆角矩形风格
      const gradient = ctx.createLinearGradient(
        x - size/2, y - size/2,
        x + size/2, y + size/2
      );
      gradient.addColorStop(0, '#555555');
      gradient.addColorStop(0.5, '#444444');
      gradient.addColorStop(1, '#333333');
      
      ctx.fillStyle = gradient;
      roundRect(ctx, x - size/2, y - size/2, size, size, 4);
      ctx.fill();
      
      // 边框
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 1;
      roundRect(ctx, x - size/2 + 2, y - size/2 + 2, size - 4, size - 4, 3);
      ctx.stroke();
      
      // 内部纹理线条
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - size/4, y - size/4);
      ctx.lineTo(x + size/4, y + size/4);
      ctx.moveTo(x + size/4, y - size/4);
      ctx.lineTo(x - size/4, y + size/4);
      ctx.stroke();
    });
    
    ctx.shadowBlur = 0;
  }, [obstacles]);

  // 辅助函数：绘制圆角矩形
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // 辅助函数：提亮颜色
  const lightenColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  };

  // 辅助函数：绘制苹果图标
  const drawAppleIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    // 苹果主体
    ctx.ellipse(x, y + 2, radius * 0.5, radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    // 苹果梗
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.moveTo(x, y - radius * 0.3);
    ctx.quadraticCurveTo(x + 2, y - radius * 0.6, x + 4, y - radius * 0.5);
    ctx.stroke();
    // 叶子
    ctx.beginPath();
    ctx.fillStyle = '#00ff88';
    ctx.ellipse(x + 4, y - radius * 0.5, 3, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  };

  // 辅助函数：绘制柠檬图标
  const drawLemonIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    // 柠檬主体（椭圆）
    ctx.ellipse(x, y, radius * 0.6, radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    // 柠檬尖端
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.5, y);
    ctx.lineTo(x - radius * 0.7, y - 2);
    ctx.lineTo(x - radius * 0.7, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + radius * 0.5, y);
    ctx.lineTo(x + radius * 0.7, y - 2);
    ctx.lineTo(x + radius * 0.7, y + 2);
    ctx.closePath();
    ctx.fill();
  };

  // 辅助函数：绘制弹药图标（枪形）
  const drawAmmoIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#ffffff';

    // 枪身
    ctx.fillRect(-6, -3, 12, 5);

    // 枪管
    ctx.fillRect(4, -5, 3, 3);

    // 枪把
    ctx.beginPath();
    ctx.moveTo(-6, 2);
    ctx.lineTo(-4, 8);
    ctx.lineTo(-1, 8);
    ctx.lineTo(-1, 2);
    ctx.closePath();
    ctx.fill();

    // 能量光芒（表示弹药）
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ccff';
    ctx.fillStyle = '#00ccff';
    ctx.beginPath();
    ctx.arc(0, -1, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // 游戏循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (timestamp: number) => {
      // 清空画布
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
      // 绘制网格
      drawGrid(ctx);

      // 绘制游戏元素（经典模式不绘制障碍物和子弹）
      if (gameMode !== GameMode.CLASSIC) {
        drawObstacles(ctx);
      }
      drawFoods(ctx);
      drawEatEffects(ctx);
      // 纯AI模式绘制AI路径
      if (gameMode === GameMode.AI_ONLY) {
        drawAIPath(ctx);
      }
      if (gameMode !== GameMode.CLASSIC) {
        drawBullets(ctx);
      }
      drawSnake(ctx, playerSnake);
      drawSnake(ctx, aiSnake);
      
      // 更新游戏逻辑
      if (gameState === GameState.PLAYING) {
        if (timestamp - lastUpdateRef.current >= speed) {
          updateGame();
          lastUpdateRef.current = timestamp;
        }
      }
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    gameState,
    speed,
    playerSnake,
    aiSnake,
    foods,
    bullets,
    obstacles,
    eatEffects,
    aiPath,
    gameMode,
    showGrid,
    updateGame,
    drawGrid,
    drawSnake,
    drawFoods,
    drawEatEffects,
    drawAIPath,
    drawBullets,
    drawObstacles,
  ]);

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-neon-green/50 shadow-neon-green">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="block"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}