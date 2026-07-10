# Oddling / 怪可爱分身

> 首版产品名已确认为 Oddling。

## 项目类型

面向轻亚文化年轻用户的 AI 数字分身养成玩具。

用户创建一个从自身性格中长出来的怪可爱角色。角色每天提出一个奇怪问题，并根据用户的回答改变外观、动作和性格。好友无需注册即可与角色互动，并留下关系贴纸或事件。

## 首发用户

- 18-28 岁
- 长期使用小红书和 Bilibili
- 喜欢人格测试、表情包、二次元或轻亚文化表达
- 愿意通过虚拟角色进行身份表达和好友互动

## 核心体验承诺

每天用 15 秒，看看“另一个我”今天又长成了什么奇怪样子。

## 核心循环

1. 首次回答一组轻量问题，生成数字分身。
2. 分身每天主动提出一个怪问题。
3. 用户用一句话回答。
4. 分身立即发生可见变异，并给出一句角色化回应。
5. 用户获得当天专属贴纸，变化进入长期历史。
6. 用户分享分身或事件，好友无需注册即可互动。
7. 好友创建自己的分身后，可解锁双角色关系事件。

## 首次创建流程

目标时长为 60-90 秒。用户不能直接选择或编辑分身外观，首次见面的意外感是核心体验。

1. 欢迎页建立期待，告诉用户“回答四个怪问题，把另一个你放出来”。
2. 用户完成三道视觉选择题。
3. 用户完成一道不超过 60 字的自由回答题。
4. 系统展示具有玩具感的分身生成仪式。
5. 用户第一次见到分身，获得初始名字和一句性格判断。
6. 用户可以修改名字，但不能重新捏脸。

## 产品价值

- 自我投射：角色意外地有点像用户。
- 收集养成：每天产生可保留的变异和贴纸。
- 社交表达：通过角色反应展示用户及好友关系。

## 明确不做

- 不做长对话型 AI 陪伴。
- 不做严肃情绪日记。
- 不做一次性 MBTI 测试。
- 不使用连续签到或饥饿值惩罚用户。
- 不在首版建设排行榜或公开社交广场。

## 视觉方向

### 设计语言

怪可爱贴纸刊物。

### 设计参数

- DESIGN_VARIANCE: 9
- MOTION_INTENSITY: 8
- VISUAL_DENSITY: 3

### 关键词

- 奶油纸张
- 黑色粗边
- 珊瑚红与钴蓝
- 手作边缘
- 怪可爱角色
- 高反馈动效
- 可收藏、可截图、可传播

## 北极星行为

用户在 7 天内至少完成 3 次喂养，并主动分享过一次分身或关系事件。

## 竞品整合结论

已研究 Finch、Voidpet Garden、Widgetable、Pengu、Locket、Tamagotchi Uni、Pokémon Sleep、Neko Atsume、ZEPETO、BeReal、SUSH、BUD、Stride 和 Happy Pets。

### MVP 吸收

- 单一、短促的每日触发器。
- 用户输入后立即出现可见角色变化。
- 稳定人格与模块化成长。
- 幽默命名的可收藏结果。
- 近关系、低压力的好友互动。
- 分享链接本身即可体验，无需先注册。
- 可回看的变异历史与关系历史。

### MVP 规避

- 饥饿、离家、断签损失等惩罚。
- 广告换取基础资源。
- 好友共同承担养成责任。
- 无限聊天与长期对话承诺。
- 商店、货币、小游戏和公开排行榜。
- 公开 Feed、陌生人推荐和 UGC 市场。
- 与核心分身无关的生活工具堆叠。

### 研究产物

- `research/2026-07-10-similar-products/research_report_20260710_similar_products.md`
- `research/2026-07-10-similar-products/research_report_20260710_similar_products.html`
- `output/pdf/ai-digital-alter-ego-competitor-research.pdf`
- `research/2026-07-10-similar-products/sources.jsonl`
- `research/2026-07-10-similar-products/evidence.jsonl`
- `research/2026-07-10-similar-products/claims.jsonl`

## 当前状态

- [x] 确认产品类型
- [x] 确认首发用户
- [x] 确认核心循环
- [x] 确认视觉方向
- [x] 完成竞品研究与功能取舍
- [x] 完成首次创建流程设计
- [x] 完成每日喂养流程设计
- [x] 完成好友互动流程设计
- [x] 完成信息架构与状态设计
- [x] 完成首版品牌命名
- [x] 输出完整产品设计规格并完成内部自审
- [x] 用户最终审阅产品设计规格
- [x] 完成 MVP 开发与完整性测试
- [x] 创建 GitHub 仓库并部署 PWA

线上体验：<https://oddling-pwa.vercel.app>

## 本地运行

```bash
npm install
npm run dev
```

未配置环境变量时，Oddling 会明确进入本地演示模式，完整状态保存在浏览器中。复制 `.env.example` 为 `.env.local` 并填写 Supabase 配置后，会启用匿名账号、云端持久化和跨设备公开分享。

## 质量门禁

```bash
npm run lint
npm run typecheck
npm run test
npm run test:db
npm run build
npm run test:e2e
npm audit --omit=dev
```

端到端测试覆盖 Chromium、Firefox、WebKit、Android Chrome 与 iPhone Safari 五个项目，包括创建、每日变异、收藏册、设置、分享隐私、访客幂等互动、PWA 离线壳、无障碍与响应式溢出检查。

## 云端配置

1. 在 Supabase 创建项目。
2. 在 SQL Editor 执行 `supabase/migrations/20260710150000_initial_schema.sql`。
3. 将 `.env.example` 中的三个 Supabase 变量配置到本地与 Vercel。
4. 可选配置 OpenAI-compatible LLM；缺省或调用失败时自动使用确定性生成引擎。

## 发布形态

Oddling 首版是响应式 PWA，无需提交 App Store 或小程序审核：

- iPhone / iPad：Safari 打开线上地址，点“分享”→“添加到主屏幕”。
- Android：Chrome 打开线上地址，点“安装应用”或浏览器菜单中的“添加到主屏幕”。
- macOS / Windows：Chrome 或 Edge 地址栏右侧选择“安装”。

Vercel 发布：

```bash
npx vercel --prod
```

部署后的 HTTPS、manifest 与 service worker 会让浏览器提供安装入口。完整的跨设备分享依赖 Supabase；未配置时仍可体验单设备本地循环。
