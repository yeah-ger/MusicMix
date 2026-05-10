# MusicMix

> Escape from world, dive in the music.

情绪驱动的实时音乐生成与可视化 Web 应用。输入你的情绪（文字或画线），MusicMix 会将其转化为独一无二的音乐和粒子视觉世界。

## 核心功能

- **情绪输入** — 文本描述或手绘线条两种模式
- **情绪分析** — 中英文情绪词典 + 画线特征提取，映射为 4 维情绪向量 (valence, arousal, tension, warmth)
- **世界生成** — 情绪向量映射为 12 维世界参数（色相、饱和度、粒子密度、运动速度等）
- **实时音乐** — 基于 Tone.js 的旋律/和声/节奏生成，情绪驱动调性、BPM 和风格
- **粒子可视化** — Three.js + React Three Fiber 实现音频频谱驱动的粒子系统
- **状态机** — 虚空 → 涌现 → 世界 三态流转

## 技术栈

- React 19 + TypeScript 6 (strict mode)
- Vite 8
- Zustand 5 (状态管理)
- Tone.js (音频合成)
- Three.js + @react-three/fiber (3D 可视化)
- Vitest (测试)
- ESLint 10 + Prettier

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 运行测试
pnpm test

# 代码检查
pnpm lint
```

## 项目结构

```
src/
├── core/
│   ├── emotion/       # 情绪分析引擎（文本分析、画线分析、情绪词典）
│   ├── music/         # 音乐生成引擎（Tone.js 合成器、旋律/和声调度）
│   └── world/         # 世界参数生成器（情绪→视觉参数映射）
├── input/             # 输入组件（文本输入、画线画布、模式切换）
├── stores/            # Zustand stores（应用状态机、会话状态）
├── types/             # TypeScript 类型定义
├── visual/            # Three.js 粒子可视化系统
├── ui/                # 通用 UI 组件
└── utils/             # 工具函数
```

## 开发流程

- `main` 分支为稳定版本
- 新功能开发使用 `feature/*` 分支
- 通过 Pull Request 合并到 main
- 提交前确保 `pnpm build` 和 `pnpm test` 通过

## License

MIT
