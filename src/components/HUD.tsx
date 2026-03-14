import { useGameStore } from '../stores/gameStore';
import { GameState, GameMode, PathfindingAlgorithm, AIStatus } from '../utils/constants';

// 食物图标组件 - 与 Canvas 保持一致
function FoodIcon({ type }: { type: 'apple' | 'lemon' | 'ammo' }) {
  if (type === 'apple') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" className="inline-block">
        <ellipse cx="8" cy="9" rx="4" ry="3.5" fill="#ff3366" />
        <path d="M8 6 Q8 4 10 3" stroke="#00ff88" strokeWidth="1.5" fill="none" />
        <ellipse cx="10" cy="3" rx="2" ry="1.5" fill="#00ff88" transform="rotate(30 10 3)" />
      </svg>
    );
  }
  if (type === 'lemon') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" className="inline-block">
        <ellipse cx="8" cy="8" rx="5" ry="3" fill="#ffcc00" />
        <path d="M3 8 L1 7 L1 9 Z" fill="#ffcc00" />
        <path d="M13 8 L15 7 L15 9 Z" fill="#ffcc00" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="inline-block">
      {/* 枪身 */}
      <rect x="2" y="6" width="8" height="3" fill="#00ccff" />
      {/* 枪管 */}
      <rect x="8" y="4" width="2" height="2" fill="#00ccff" />
      {/* 枪把 */}
      <path d="M2 9 L3 12 L6 12 L6 9 Z" fill="#00ccff" />
      {/* 能量光点 */}
      <circle cx="8" cy="7.5" r="1.5" fill="#ffffff" />
    </svg>
  );
}

export function HUD() {
  const { score, aiScore, playerSnake, aiSnake, aiPath, aiAlgorithm, gameTime, gameState, gameMode, aiStatus } = useGameStore();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameState === GameState.MENU) return null;

  const gameModeText = {
    classic: '经典模式',
    challenge: '挑战模式',
    'vs-ai': '对战AI',
    'ai-only': '纯AI模式',
  };

  const algorithmText = {
    [PathfindingAlgorithm.ASTAR]: 'A*算法',
    [PathfindingAlgorithm.BFS]: 'BFS',
    [PathfindingAlgorithm.GREEDY]: '贪心算法',
    [PathfindingAlgorithm.LONGEST_PATH]: '最长路径',
  };

  const aiStatusConfig = {
    [AIStatus.CHASING_FOOD]: { emoji: '🍎', text: '追击食物', color: 'text-neon-green' },
    [AIStatus.SAFE_CRUISE]: { emoji: '🛡️', text: '安全巡航', color: 'text-neon-blue' },
    [AIStatus.CIRCUITOUS]: { emoji: '🔄', text: '绕路中', color: 'text-neon-yellow' },
    [AIStatus.PATHFINDING]: { emoji: '🔍', text: '寻路中', color: 'text-gray-400' },
    [AIStatus.SPACE_LIMITED]: { emoji: '⚠️', text: '空间受限', color: 'text-orange-400' },
    [AIStatus.EMERGENCY_ESCAPE]: { emoji: '🚨', text: '紧急逃生', color: 'text-red-500' },
    [AIStatus.APPROACHING_TARGET]: { emoji: '📍', text: '接近目标', color: 'text-neon-purple' },
    [AIStatus.LOCKED_ON]: { emoji: '🎯', text: '锁定食物', color: 'text-neon-pink' },
    [AIStatus.DEAD]: { emoji: '💀', text: '已死亡', color: 'text-red-600' },
  };

  // 判断是否为经典模式
  const isClassicMode = gameMode === GameMode.CLASSIC;
  const isAIOnlyMode = gameMode === GameMode.AI_ONLY;

  return (
    <>
      {/* 左侧信息面板 */}
      <div className="absolute -left-44 top-0 w-40 flex flex-col gap-4">
        {/* 游戏模式 */}
        <div className="bg-panel-bg backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-700">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">模式</div>
          <div className="text-sm font-bold text-white">{gameModeText[gameMode]}</div>
        </div>

        {/* 纯AI模式显示AI统计 */}
        {isAIOnlyMode ? (
          <>
            <div className="bg-panel-bg backdrop-blur-sm rounded-xl px-4 py-4 border border-neon-purple/30 shadow-lg">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">AI 得分</div>
              <div className="text-4xl font-bold text-neon-purple font-mono">{aiScore}</div>
            </div>
            <div className="bg-panel-bg backdrop-blur-sm rounded-xl px-4 py-4 border border-neon-blue/30 shadow-lg">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">AI 长度</div>
              <div className="text-3xl font-bold text-neon-blue font-mono">
                {aiSnake?.body.length || 0}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 分数 */}
            <div className="bg-panel-bg backdrop-blur-sm rounded-xl px-4 py-4 border border-neon-green/30 shadow-lg">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">分数</div>
              <div className="text-4xl font-bold text-neon-green font-mono">{score}</div>
            </div>

            {/* 长度 */}
            <div className="bg-panel-bg backdrop-blur-sm rounded-xl px-4 py-4 border border-neon-blue/30 shadow-lg">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">长度</div>
              <div className="text-3xl font-bold text-neon-blue font-mono">
                {playerSnake?.body.length || 0}
              </div>
            </div>
          </>
        )}

        {/* 时间 */}
        <div className="bg-panel-bg backdrop-blur-sm rounded-xl px-4 py-3 border border-neon-purple/30">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">时间</div>
          <div className="text-xl font-bold text-neon-purple font-mono">
            {formatTime(gameTime)}
          </div>
        </div>
      </div>

      {/* 右侧信息面板 */}
      <div className="absolute -right-44 top-0 w-40 flex flex-col gap-4">
        {/* 纯AI模式显示算法和状态（合并） */}
        {isAIOnlyMode && (
          <>
            <div className="bg-panel-bg backdrop-blur-sm rounded-xl px-4 py-4 border border-neon-purple/30 shadow-lg">
              <div className="grid grid-cols-2 gap-4">
                {/* 算法 */}
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">当前算法</div>
                  <div className="text-base font-bold text-neon-purple">
                    {algorithmText[aiAlgorithm]}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {aiAlgorithm === PathfindingAlgorithm.ASTAR && '智能寻路'}
                    {aiAlgorithm === PathfindingAlgorithm.BFS && '保证找到'}
                    {aiAlgorithm === PathfindingAlgorithm.GREEDY && '容易出错'}
                    {aiAlgorithm === PathfindingAlgorithm.LONGEST_PATH && '故意绕路'}
                  </div>
                </div>
                {/* 状态 */}
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">AI 状态</div>
                  <div className={`text-base font-bold ${aiStatusConfig[aiStatus].color}`}>
                    <span className="mr-1">{aiStatusConfig[aiStatus].emoji}</span>
                    {aiStatusConfig[aiStatus].text}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {aiStatus === AIStatus.CHASING_FOOD && '安全追击食物'}
                    {aiStatus === AIStatus.SAFE_CRUISE && '跟随尾巴保安全'}
                    {aiStatus === AIStatus.CIRCUITOUS && '故意绕路'}
                    {aiStatus === AIStatus.PATHFINDING && '计算路径中'}
                    {aiStatus === AIStatus.SPACE_LIMITED && '空间不足15%'}
                    {aiStatus === AIStatus.EMERGENCY_ESCAPE && '紧急寻路'}
                    {aiStatus === AIStatus.APPROACHING_TARGET && '接近目标'}
                    {aiStatus === AIStatus.LOCKED_ON && '即将吃到'}
                    {aiStatus === AIStatus.DEAD && '游戏结束'}
                  </div>
                </div>
              </div>
            </div>
            {/* 路径信息 */}
            <div className="bg-panel-bg backdrop-blur-sm rounded-xl px-4 py-3 border border-neon-yellow/30 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">路径步数</div>
                  <div className="text-xl font-bold text-neon-yellow font-mono">
                    {aiPath?.path ? aiPath.path.length - 1 : '--'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">目标位置</div>
                  <div className="text-sm text-gray-300 font-mono">
                    {aiPath?.targetFood ? `(${aiPath.targetFood.x}, ${aiPath.targetFood.y})` : '--'}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 弹药 - 经典模式和纯AI模式不显示 */}
        {!isClassicMode && !isAIOnlyMode && (
          <div className="bg-panel-bg backdrop-blur-sm rounded-xl px-4 py-4 border border-neon-red/30 shadow-lg">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>弹药</span>
              <FoodIcon type="ammo" />
            </div>
            <div className="flex items-center justify-between">
              <div className={`text-3xl font-bold font-mono ${
                (playerSnake?.ammo || 0) > 0 ? 'text-neon-red' : 'text-gray-600'
              }`}>
                {playerSnake?.ammo || 0}
              </div>
              <span className="text-gray-500 text-xs">Shift发射</span>
            </div>
          </div>
        )}

        {/* AI蛇信息（仅对战模式显示，纯AI模式下左边已有AI长度） */}
        {gameMode === 'vs-ai' && aiSnake && (
          <div className="bg-panel-bg backdrop-blur-sm rounded-xl px-4 py-3 border border-neon-purple/20">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">AI 蛇状态</div>
            <div className="text-2xl font-bold text-neon-purple/70 font-mono">
              {aiSnake.body.length}
            </div>
            <div className={`text-xs mt-1 ${aiSnake.alive ? 'text-green-500' : 'text-red-500'}`}>
              {aiSnake.alive ? '● 存活' : '● 已死亡'}
            </div>
          </div>
        )}

        {/* 图例和食物说明合并 */}
        <div className="bg-panel-bg backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-700">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">图例 & 食物</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* 左列：图例 */}
            <div className="space-y-1.5">
              {/* 纯AI模式下只显示AI蛇 */}
              {!isAIOnlyMode && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-neon-green to-green-400 shadow-neon-green" />
                  <span className="text-gray-400">玩家蛇</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-neon-purple to-purple-400" />
                <span className="text-gray-400">AI蛇</span>
              </div>
              {/* AI路径指示 */}
              {isAIOnlyMode && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-neon-yellow shadow-neon-yellow" />
                  <span className="text-gray-400">AI路径</span>
                </div>
              )}
              {/* 障碍物图例 - 经典模式不显示 */}
              {!isClassicMode && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-600" />
                  <span className="text-gray-400">障碍物</span>
                </div>
              )}
            </div>
            {/* 右列：食物 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <FoodIcon type="apple" />
                <span className="text-gray-400">+1分</span>
              </div>
              <div className="flex items-center gap-2">
                <FoodIcon type="lemon" />
                <span className="text-gray-400">+3分</span>
              </div>
              {/* 弹药说明 - 经典模式和纯AI模式不显示 */}
              {!isClassicMode && !isAIOnlyMode && (
                <div className="flex items-center gap-2">
                  <FoodIcon type="ammo" />
                  <span className="text-gray-400">+1弹药</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 暂停提示（居中显示） */}
      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-panel-bg/90 backdrop-blur-sm rounded-2xl px-10 py-6 border border-neon-yellow/50 shadow-2xl animate-pulse-glow">
            <div className="text-neon-yellow text-3xl font-bold tracking-widest">PAUSED</div>
            <div className="text-gray-400 text-sm text-center mt-2">按空格继续</div>
          </div>
        </div>
      )}
    </>
  );
}