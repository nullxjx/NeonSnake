import { useEffect } from 'react';
import { useGameStore } from './stores/gameStore';
import { GameMode } from './utils/constants';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { Menu } from './components/Menu';
import { useInputHandler } from './hooks/useInputHandler';
import './styles/index.css';

function App() {
  const { initGame, gameMode } = useGameStore();
  
  // 初始化游戏
  useEffect(() => {
    initGame();
  }, [initGame]);

  // 键盘输入处理
  useInputHandler();

  // 判断是否为经典模式或纯AI模式
  const isClassicMode = gameMode === GameMode.CLASSIC;
  const isAIOnlyMode = gameMode === GameMode.AI_ONLY;

  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/5 rounded-full blur-3xl" />
      </div>

      {/* 主游戏区域 */}
      <div className="relative z-10">
        {/* 游戏标题 */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple">
            NEON SNAKE
          </h1>
        </div>

        {/* 游戏区域（包含左右面板） */}
        <div className="relative flex items-start justify-center">
          {/* 游戏画布 */}
          <div className="relative">
            <GameCanvas />
            {/* HUD 绝对定位在画布周围 */}
            <HUD />
          </div>
          
          {/* 菜单（全屏遮罩） */}
          <Menu />
        </div>

        {/* 底部操作提示 */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-6 px-6 py-3 bg-panel-bg/50 backdrop-blur-sm rounded-full border border-gray-800">
            {/* 纯AI模式显示观察提示 */}
            {isAIOnlyMode ? (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="text-neon-purple">观察AI自动寻路</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">WASD / ↑↓←→</span>
                  <span>移动</span>
                </div>
                {/* Shift 发射 - 经典模式不显示 */}
                {!isClassicMode && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">Shift</span>
                    <span>发射</span>
                  </div>
                )}
              </>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">Space</span>
              <span>暂停</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">ESC</span>
              <span>重开</span>
            </div>
          </div>
        </div>

        {/* 署名 */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-xs tracking-wider">
            Created By XJX with OpenCode
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;