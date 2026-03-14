import { Position, GRID_SIZE } from './constants';

// A* 寻路算法
interface Node {
  x: number;
  y: number;
  g: number;
  f: number;
  parent?: Node;
}

// 方向向量
const DIRECTIONS = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

// 计算曼哈顿距离
function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// 重建路径
function reconstructPath(node: Node): Position[] {
  const path: Position[] = [];
  let current: Node | undefined = node;
  while (current) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }
  return path;
}

// 检查位置是否有效（在边界内且不是障碍物）
function isValidPosition(
  pos: Position,
  obstacles: Set<string>,
  snakeBody: Position[],
  ignoreIndex: number = -1
): boolean {
  if (pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE) {
    return false;
  }
  const key = `${pos.x},${pos.y}`;
  if (obstacles.has(key)) return false;
  
  // 检查是否是蛇身（可以忽略特定索引，如蛇尾）
  for (let i = 0; i < snakeBody.length; i++) {
    if (i === ignoreIndex) continue;
    if (snakeBody[i].x === pos.x && snakeBody[i].y === pos.y) {
      return false;
    }
  }
  return true;
}

// 洪水填充算法 - 计算从某位置可到达的空格数量
export function floodFill(
  start: Position,
  obstacles: Set<string>,
  snakeBody: Position[],
  snakeWillGrow: boolean = false
): number {
  const visited = new Set<string>([`${start.x},${start.y}`]);
  const queue: Position[] = [start];
  let count = 0;
  const maxCount = GRID_SIZE * GRID_SIZE; // 防止无限循环
  
  // 创建蛇身集合，根据是否增长决定蛇尾是否可通行
  const bodySet = new Set<string>();
  for (let i = 0; i < snakeBody.length; i++) {
    // 如果蛇不增长，蛇尾会移动，所以最后一节不算障碍
    if (!snakeWillGrow && i === snakeBody.length - 1) continue;
    bodySet.add(`${snakeBody[i].x},${snakeBody[i].y}`);
  }
  
  while (queue.length > 0 && count < maxCount) {
    const pos = queue.shift()!;
    count++;
    
    for (const dir of DIRECTIONS) {
      const newPos = { x: pos.x + dir.x, y: pos.y + dir.y };
      const key = `${newPos.x},${newPos.y}`;
      
      if (
        newPos.x >= 0 && newPos.x < GRID_SIZE &&
        newPos.y >= 0 && newPos.y < GRID_SIZE &&
        !visited.has(key) &&
        !obstacles.has(key) &&
        !bodySet.has(key)
      ) {
        visited.add(key);
        queue.push(newPos);
      }
    }
  }
  
  return count;
}

// 检查蛇吃完食物后是否能存活（能否到达尾部）
function canSurviveAfterEating(
  foodPos: Position,
  obstacles: Set<string>,
  snakeBody: Position[]
): boolean {
  // 模拟蛇吃完食物后的状态
  const newBody = [foodPos, ...snakeBody]; // 新头部在食物位置，身体增长
  const newTail = newBody[newBody.length - 1];
  
  // 检查从新头部位置是否能到达尾部（使用忽略尾部的身体集合）
  const pathToTail = bfsInternal(foodPos, newTail, obstacles, newBody, true);
  
  return pathToTail !== null && pathToTail.length > 0;
}

// 内部BFS实现 - 可配置是否忽略尾部
function bfsInternal(
  start: Position,
  end: Position,
  obstacles: Set<string>,
  snakeBody: Position[],
  ignoreTail: boolean = false
): Position[] | null {
  const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [start] }];
  const visited = new Set<string>([`${start.x},${start.y}`]);
  
  const bodySet = new Set<string>();
  for (let i = 0; i < snakeBody.length; i++) {
    if (ignoreTail && i === snakeBody.length - 1) continue;
    bodySet.add(`${snakeBody[i].x},${snakeBody[i].y}`);
  }

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;

    if (pos.x === end.x && pos.y === end.y) {
      return path;
    }

    for (const dir of DIRECTIONS) {
      const newX = pos.x + dir.x;
      const newY = pos.y + dir.y;
      const key = `${newX},${newY}`;

      if (
        newX >= 0 &&
        newX < GRID_SIZE &&
        newY >= 0 &&
        newY < GRID_SIZE &&
        !visited.has(key) &&
        !obstacles.has(key) &&
        !bodySet.has(key)
      ) {
        visited.add(key);
        queue.push({
          pos: { x: newX, y: newY },
          path: [...path, { x: newX, y: newY }],
        });
      }
    }
  }

  return null;
}

// 安全A*寻路 - 确保吃完食物后能存活
export function safeAStar(
  start: Position,
  end: Position,
  obstacles: Set<string>,
  snakeBody: Position[]
): Position[] | null {
  // 短蛇时直接使用A*（增长较慢，风险较小）
  if (snakeBody.length < 5) {
    return aStar(start, end, obstacles, snakeBody);
  }
  
  // 获取到食物的路径
  const path = aStar(start, end, obstacles, snakeBody);
  if (!path || path.length <= 1) return null;
  
  // 检查吃完食物后是否能存活
  if (canSurviveAfterEating(end, obstacles, snakeBody)) {
    return path;
  }
  
  // 如果直接吃食物不安全，返回null让AI跟随尾巴
  return null;
}

// A* 寻路算法
export function aStar(
  start: Position,
  end: Position,
  obstacles: Set<string>,
  snakeBody: Position[]
): Position[] | null {
  const openList: Node[] = [];
  const closedList = new Set<string>();
  const snakeBodySet = new Set(snakeBody.map(p => `${p.x},${p.y}`));

  const startNode: Node = {
    x: start.x,
    y: start.y,
    g: 0,
    f: manhattanDistance(start, end),
  };
  openList.push(startNode);

  while (openList.length > 0) {
    let currentIndex = 0;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < openList[currentIndex].f) {
        currentIndex = i;
      }
    }

    const currentNode = openList[currentIndex];

    if (currentNode.x === end.x && currentNode.y === end.y) {
      return reconstructPath(currentNode);
    }

    openList.splice(currentIndex, 1);
    closedList.add(`${currentNode.x},${currentNode.y}`);

    for (const dir of DIRECTIONS) {
      const neighborX = currentNode.x + dir.x;
      const neighborY = currentNode.y + dir.y;

      if (
        neighborX < 0 ||
        neighborX >= GRID_SIZE ||
        neighborY < 0 ||
        neighborY >= GRID_SIZE
      ) {
        continue;
      }

      const neighborKey = `${neighborX},${neighborY}`;

      if (closedList.has(neighborKey) || obstacles.has(neighborKey) || snakeBodySet.has(neighborKey)) {
        continue;
      }

      const gScore = currentNode.g + 1;
      let neighbor = openList.find(n => n.x === neighborX && n.y === neighborY);

      if (!neighbor) {
        neighbor = {
          x: neighborX,
          y: neighborY,
          g: gScore,
          f: gScore + manhattanDistance({ x: neighborX, y: neighborY }, end),
          parent: currentNode,
        };
        openList.push(neighbor);
      } else if (gScore < neighbor.g) {
        neighbor.g = gScore;
        neighbor.f = neighbor.g + manhattanDistance({ x: neighborX, y: neighborY }, end);
        neighbor.parent = currentNode;
      }
    }
  }

  return null;
}

// BFS 寻路算法
export function bfs(
  start: Position,
  end: Position,
  obstacles: Set<string>,
  snakeBody: Position[]
): Position[] | null {
  const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [start] }];
  const visited = new Set<string>([`${start.x},${start.y}`]);
  const snakeBodySet = new Set(snakeBody.map(p => `${p.x},${p.y}`));

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;

    if (pos.x === end.x && pos.y === end.y) {
      return path;
    }

    for (const dir of DIRECTIONS) {
      const newX = pos.x + dir.x;
      const newY = pos.y + dir.y;
      const key = `${newX},${newY}`;

      if (
        newX >= 0 &&
        newX < GRID_SIZE &&
        newY >= 0 &&
        newY < GRID_SIZE &&
        !visited.has(key) &&
        !obstacles.has(key) &&
        !snakeBodySet.has(key)
      ) {
        visited.add(key);
        queue.push({
          pos: { x: newX, y: newY },
          path: [...path, { x: newX, y: newY }],
        });
      }
    }
  }

  return null;
}

// 贪心算法
export function greedy(
  start: Position,
  end: Position,
  obstacles: Set<string>,
  snakeBody: Position[]
): Position[] | null {
  const path: Position[] = [start];
  const visited = new Set<string>([`${start.x},${start.y}`]);
  const snakeBodySet = new Set(snakeBody.map(p => `${p.x},${p.y}`));
  let current = start;

  while (current.x !== end.x || current.y !== end.y) {
    let bestNext: Position | null = null;
    let bestDist = Infinity;

    for (const dir of DIRECTIONS) {
      const newX = current.x + dir.x;
      const newY = current.y + dir.y;
      const key = `${newX},${newY}`;

      if (
        newX >= 0 &&
        newX < GRID_SIZE &&
        newY >= 0 &&
        newY < GRID_SIZE &&
        !visited.has(key) &&
        !obstacles.has(key) &&
        !snakeBodySet.has(key)
      ) {
        const dist = manhattanDistance({ x: newX, y: newY }, end);
        if (dist < bestDist) {
          bestDist = dist;
          bestNext = { x: newX, y: newY };
        }
      }
    }

    if (!bestNext) return null;

    current = bestNext;
    path.push(current);
    visited.add(`${current.x},${current.y}`);

    if (path.length > GRID_SIZE * GRID_SIZE) return null;
  }

  return path;
}

// 寻找最长路径（使用哈密顿路径启发式）
export function findLongestPath(
  start: Position,
  end: Position,
  obstacles: Set<string>,
  snakeBody: Position[]
): Position[] | null {
  // 使用改进的最长路径算法：优先选择离目标远但能存活的方向
  const visited = new Set<string>([`${start.x},${start.y}`]);
  const snakeBodySet = new Set(snakeBody.map(p => `${p.x},${p.y}`));
  const path: Position[] = [start];
  let current = start;
  const maxSteps = GRID_SIZE * GRID_SIZE;
  let steps = 0;
  
  while ((current.x !== end.x || current.y !== end.y) && steps < maxSteps) {
    // 评估所有可能的方向
    const candidates: { pos: Position; score: number }[] = [];
    
    for (const dir of DIRECTIONS) {
      const newPos = { x: current.x + dir.x, y: current.y + dir.y };
      const key = `${newPos.x},${newPos.y}`;
      
      if (
        newPos.x >= 0 && newPos.x < GRID_SIZE &&
        newPos.y >= 0 && newPos.y < GRID_SIZE &&
        !visited.has(key) &&
        !obstacles.has(key) &&
        !snakeBodySet.has(key)
      ) {
        // 计算这个方向的评分
        const distToEnd = manhattanDistance(newPos, end);
        
        // 使用洪水填充计算这个方向可到达的空间大小
        // 临时标记为已访问来模拟移动
        const tempVisited = new Set(visited);
        tempVisited.add(key);
        
        // 模拟蛇移动后的身体（移除尾部，添加新头部）
        const tempBody = [newPos, ...snakeBody.slice(0, -1)];
        const spaceSize = floodFill(newPos, obstacles, tempBody, false);
        
        // 评分：空间大加分，距离目标适当远（绕路但不过远）
        const spaceScore = spaceSize * 2;
        const distScore = Math.min(distToEnd, 10); // 限制距离分数
        const totalScore = spaceScore - distScore;
        
        candidates.push({ pos: newPos, score: totalScore });
      }
    }
    
    if (candidates.length === 0) {
      // 没有可行路径，尝试直接找最短路径
      break;
    }
    
    // 选择评分最高的方向
    candidates.sort((a, b) => b.score - a.score);
    const bestNext = candidates[0].pos;
    
    current = bestNext;
    path.push(current);
    visited.add(`${current.x},${current.y}`);
    steps++;
  }
  
  // 如果没有到达目标，使用BFS找一条路径
  if (current.x !== end.x || current.y !== end.y) {
    const remainingPath = bfs(current, end, obstacles, snakeBody);
    if (remainingPath && remainingPath.length > 1) {
      path.push(...remainingPath.slice(1));
    } else {
      return null; // 无法到达目标
    }
  }
  
  return path.length > 1 ? path : null;
}

// 寻找最安全的路径 - 专门用于蛇跟随自己的尾巴
export function findSafestPathToTail(
  start: Position,
  tail: Position,
  obstacles: Set<string>,
  snakeBody: Position[]
): Position[] | null {
  // 使用BFS，但优先选择空间大的路径
  const queue: { pos: Position; path: Position[]; space: number }[] = [
    { pos: start, path: [start], space: 0 }
  ];
  const visited = new Set<string>([`${start.x},${start.y}`]);
  let bestPath: Position[] | null = null;
  let bestSpace = -1;
  
  while (queue.length > 0) {
    const { pos, path, space } = queue.shift()!;
    
    // 如果到达尾巴且空间更大，更新最佳路径
    if (pos.x === tail.x && pos.y === tail.y) {
      if (space > bestSpace) {
        bestSpace = space;
        bestPath = path;
      }
      continue;
    }
    
    for (const dir of DIRECTIONS) {
      const newPos = { x: pos.x + dir.x, y: pos.y + dir.y };
      const key = `${newPos.x},${newPos.y}`;
      
      // 检查边界和障碍
      if (
        newPos.x < 0 || newPos.x >= GRID_SIZE ||
        newPos.y < 0 || newPos.y >= GRID_SIZE
      ) continue;
      
      // 对于跟随尾巴，允许进入尾部当前位置（因为尾巴会移动）
      const isTail = newPos.x === tail.x && newPos.y === tail.y;
      const snakeBodySet = new Set(snakeBody.map((p, i) => 
        i === snakeBody.length - 1 ? '' : `${p.x},${p.y}`
      ).filter(k => k !== ''));
      
      if (
        !visited.has(key) &&
        !obstacles.has(key) &&
        (isTail || !snakeBodySet.has(key))
      ) {
        visited.add(key);
        
        // 计算这个方向的可用空间
        const tempBody = [newPos, ...snakeBody.slice(0, -1)];
        const newSpace = floodFill(newPos, obstacles, tempBody, false);
        
        queue.push({
          pos: newPos,
          path: [...path, newPos],
          space: space + newSpace
        });
      }
    }
  }
  
  return bestPath;
}

// 获取下一步的最优移动 - 综合考虑食物和存活
export function getBestMove(
  head: Position,
  food: Position,
  tail: Position,
  obstacles: Set<string>,
  snakeBody: Position[]
): { direction: Position; path: Position[] } | null {
  // 首先尝试安全地吃食物
  const foodPath = safeAStar(head, food, obstacles, snakeBody);
  
  if (foodPath && foodPath.length > 1) {
    return {
      direction: { x: foodPath[1].x - head.x, y: foodPath[1].y - head.y },
      path: foodPath
    };
  }
  
  // 如果不能安全吃食物，跟随尾巴
  const tailPath = findSafestPathToTail(head, tail, obstacles, snakeBody);
  
  if (tailPath && tailPath.length > 1) {
    return {
      direction: { x: tailPath[1].x - head.x, y: tailPath[1].y - head.y },
      path: tailPath
    };
  }
  
  // 最后的备选：找任何可行的移动
  for (const dir of DIRECTIONS) {
    const newPos = { x: head.x + dir.x, y: head.y + dir.y };
    const tempBody = [newPos, ...snakeBody.slice(0, -1)];
    
    if (isValidPosition(newPos, obstacles, snakeBody, snakeBody.length - 1)) {
      const space = floodFill(newPos, obstacles, tempBody, false);
      if (space > 0) {
        return {
          direction: dir,
          path: [head, newPos]
        };
      }
    }
  }
  
  return null;
}
