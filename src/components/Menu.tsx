import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { GameMode, SPEED_LEVELS, PathfindingAlgorithm } from '../utils/constants';

export function Menu() {
  const { gameState, gameMode, speed, normalSpeed, showGrid, score, aiScore, playerSnake, aiSnake, aiAlgorithm, startGame, setGameMode, setSpeed, setAIAlgorithm, toggleGrid, initGame, backToMenu } = useGameStore();
  const [showHelp, setShowHelp] = useState(false);

  if (gameState !== 'menu' && gameState !== 'game_over') return null;

  const isGameOver = gameState === 'game_over';

  const gameModes = [
    { id: GameMode.CLASSIC, label: '经典模式', desc: '传统贪吃蛇玩法' },
    { id: GameMode.CHALLENGE, label: '挑战模式', desc: '加入障碍物与子弹系统' },
    { id: GameMode.VS_AI, label: '对战AI', desc: '与AI蛇竞争食物' },
    { id: GameMode.AI_ONLY, label: '纯AI模式', desc: '观察AI寻路行为' },
  ];

  const aiAlgorithms = [
    { id: PathfindingAlgorithm.ASTAR, label: 'A*算法', desc: '最短路径，效率最高' },
    { id: PathfindingAlgorithm.BFS, label: 'BFS', desc: '广度优先，保证找到路径' },
    { id: PathfindingAlgorithm.GREEDY, label: '贪心算法', desc: '只看距离，容易陷入死胡同' },
    { id: PathfindingAlgorithm.LONGEST_PATH, label: '最长路径', desc: '故意绕远路，更有趣' },
  ];

  const speedOptions = [
    { id: SPEED_LEVELS.slow, label: '慢速' },
    { id: SPEED_LEVELS.normal, label: '正常' },
    { id: SPEED_LEVELS.fast, label: '快速' },
    { id: SPEED_LEVELS.very_fast, label: '极速' },
  ];

  const handleStart = () => {
    initGame(gameMode);
    startGame();
  };

  const handleBackToMenu = () => {
    backToMenu();
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-game-bg/80 backdrop-blur-sm">
      <div className="bg-panel-bg rounded-2xl p-8 border border-neon-green/30 shadow-2xl max-w-md w-full mx-4">
        {/* 标题 */}
        <div className="text-center mb-8">
          {isGameOver ? (
            <>
              <h1 className="text-4xl font-bold text-neon-red mb-2 animate-pulse-glow">GAME OVER</h1>
              <p className="text-gray-400">游戏结束</p>
              {/* 经典/挑战模式显示结果 */}
              {(gameMode === GameMode.CLASSIC || gameMode === GameMode.CHALLENGE) && (
                <div className="mt-6 space-y-2">
                  <div className="text-3xl font-bold text-neon-green">{score}</div>
                  <div className="text-gray-400 text-sm">最终得分</div>
                  <div className="text-xl text-neon-blue">长度: {playerSnake?.body.length || 0}</div>
                </div>
              )}
              {/* AI对战模式显示双方统计 */}
              {gameMode === GameMode.VS_AI && (
                <div className="mt-6 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-3">
                      <div className="text-neon-green text-xs uppercase mb-1">玩家</div>
                      <div className="text-2xl font-bold text-white">{score}</div>
                      <div className="text-gray-400 text-xs mt-1">长度: {playerSnake?.body.length || 0}</div>
                    </div>
                    <div className="bg-neon-purple/10 border border-neon-purple/30 rounded-lg p-3">
                      <div className="text-neon-purple text-xs uppercase mb-1">AI</div>
                      <div className="text-2xl font-bold text-white">{aiScore}</div>
                      <div className="text-gray-400 text-xs mt-1">长度: {aiSnake?.body.length || 0}</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    {score > aiScore ? (
                      <span className="text-neon-green">你赢了!</span>
                    ) : score < aiScore ? (
                      <span className="text-neon-purple">AI获胜!</span>
                    ) : (
                      <span className="text-gray-400">平局!</span>
                    )}
                  </div>
                </div>
              )}
              {/* 纯AI模式显示最终统计 */}
              {gameMode === GameMode.AI_ONLY && (
                <div className="mt-6 space-y-2">
                  <div className="text-3xl font-bold text-neon-purple">{aiScore}</div>
                  <div className="text-gray-400 text-sm">AI最终得分</div>
                  <div className="text-xl text-neon-blue">长度: {aiSnake?.body.length || 0}</div>
                  <div className="text-sm text-gray-500">算法: {aiAlgorithm === 'astar' ? 'A*' : aiAlgorithm === 'bfs' ? 'BFS' : aiAlgorithm === 'greedy' ? '贪心' : '最长路径'}</div>
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple mb-2">
                SNAKE
              </h1>
              <p className="text-gray-400">霓虹贪吃蛇</p>
            </>
          )}
        </div>

        {!isGameOver && (
          <>
            {/* 游戏模式选择 */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm uppercase tracking-wider mb-2 block">游戏模式</label>
              <div className="grid grid-cols-2 gap-2">
                {gameModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setGameMode(mode.id)}
                    className={`p-2 rounded border transition-all duration-200 text-left ${
                      gameMode === mode.id
                        ? 'bg-neon-green/20 border-neon-green'
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className={`text-sm font-semibold ${gameMode === mode.id ? 'text-neon-green' : 'text-white'}`}>
                      {mode.label}
                    </div>
                    <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

        {/* AI算法选择 - 仅在纯AI模式显示，使用下拉框更紧凑 */}
        {gameMode === GameMode.AI_ONLY && (
          <div className="mb-4">
            <label className="text-gray-400 text-sm uppercase tracking-wider mb-2 block">AI寻路算法</label>
            <select
              value={aiAlgorithm}
              onChange={(e) => setAIAlgorithm(e.target.value as PathfindingAlgorithm)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white text-sm focus:border-neon-purple focus:outline-none"
            >
              {aiAlgorithms.map((algo) => (
                <option key={algo.id} value={algo.id}>
                  {algo.label} - {algo.desc}
                </option>
              ))}
            </select>
          </div>
        )}

            {/* 速度选择 */}
            <div className="mb-6">
              <label className="text-gray-400 text-sm uppercase tracking-wider mb-3 block">
                游戏速度
                {gameMode === GameMode.AI_ONLY && (
                  <span className="text-neon-purple text-xs ml-2">(AI模式已自动降速)</span>
                )}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {speedOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSpeed(option.id)}
                    className={`py-2 px-3 rounded-lg border text-sm transition-all duration-200 ${
                      normalSpeed === option.id
                        ? 'bg-neon-blue/20 border-neon-blue text-neon-blue'
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 网格开关 */}
            <div className="mb-8">
              <button
                onClick={toggleGrid}
                className={`w-full p-3 rounded-lg border transition-all duration-200 flex justify-between items-center ${
                  showGrid
                    ? 'bg-neon-purple/20 border-neon-purple text-neon-purple'
                    : 'bg-gray-800/50 border-gray-700 text-gray-400'
                }`}
              >
                <span>显示网格</span>
                <span className={`w-10 h-5 rounded-full relative transition-colors ${showGrid ? 'bg-neon-purple' : 'bg-gray-600'}`}>
                  <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${showGrid ? 'left-6' : 'left-1'}`} />
                </span>
              </button>
            </div>
          </>
        )}

        {/* 按钮区域 */}
        <div className={isGameOver ? 'space-y-3' : ''}>
          {/* 开始/重新开始按钮 */}
          <button
            onClick={handleStart}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-neon-green to-neon-blue text-black font-bold text-lg hover:opacity-90 transition-opacity shadow-neon-green animate-pulse-glow"
          >
            {isGameOver ? '重新开始' : '开始游戏'}
          </button>

          {/* 回到主界面按钮 - 仅在游戏结束时显示 */}
          {isGameOver && (
            <button
              onClick={handleBackToMenu}
              className="w-full py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-colors"
            >
              回到主界面
            </button>
          )}
        </div>

        {/* 玩法指南按钮 */}
        {!isGameOver && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setShowHelp(true)}
              className="w-8 h-8 rounded-full bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors flex items-center justify-center text-sm font-bold"
              title="玩法指南"
            >
              ?
            </button>
          </div>
        )}
      </div>

      {/* 玩法指南弹窗 */}
      {showHelp && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-game-bg/90 backdrop-blur-sm">
          <div className="bg-panel-bg rounded-2xl p-6 border border-neon-green/30 shadow-2xl max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-neon-green">玩法指南</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-300">
              {/* 基础操作 */}
              <div>
                <h3 className="text-neon-blue font-semibold mb-2">基础操作</h3>
                <ul className="space-y-1 text-xs">
                  <li>• 方向键 / WASD - 控制蛇移动</li>
                  <li>• 空格 - 暂停/继续游戏</li>
                  <li>• ESC - 重新开始</li>
                </ul>
              </div>

              {/* 游戏模式 */}
              <div>
                <h3 className="text-neon-blue font-semibold mb-2">游戏模式</h3>
                <ul className="space-y-1 text-xs">
                  <li>• 经典模式 - 传统贪吃蛇玩法</li>
                  <li>• 挑战模式 - 有障碍物和子弹系统</li>
                  <li>• 对战AI - 与AI蛇竞争食物</li>
                  <li>• 纯AI模式 - 观察AI自动寻路</li>
                </ul>
              </div>

              {/* 特殊操作 */}
              <div>
                <h3 className="text-neon-blue font-semibold mb-2">特殊操作</h3>
                <ul className="space-y-1 text-xs">
                  <li>• Shift - 发射子弹（挑战/对战模式）</li>
                  <li>• 吃 🔫 食物补充弹药</li>
                  <li>• 子弹可击毁障碍物</li>
                </ul>
              </div>

              {/* 食物说明 */}
              <div>
                <h3 className="text-neon-blue font-semibold mb-2">食物</h3>
                <ul className="space-y-1 text-xs">
                  <li>• 🍎 普通食物 +1分</li>
                  <li>• 🍋 高级食物 +3分</li>
                  <li>• 🔫 弹药包 +1弹药</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full py-3 rounded-xl bg-neon-green/20 border border-neon-green text-neon-green font-semibold hover:bg-neon-green/30 transition-colors"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}