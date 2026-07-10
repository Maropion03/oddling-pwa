# Oddling MVP 实施计划

日期：2026-07-10  
依据：`docs/superpowers/specs/2026-07-10-oddling-design.md`  
状态：执行中

## 1. 实现原则

### 视觉论点

一册会动的怪可爱贴纸刊物：奶油纸张、炭黑粗线、珊瑚角色和钴蓝结构，让角色像从用户回答里现场长出来。

### 内容结构

1. 欢迎与创建：品牌、四问、生成仪式、首次揭晓。
2. 日常巢穴：角色舞台、今日问题、回答、变异结果。
3. 收藏回看：变异、贴纸、关系事件三个平级视图。
4. 分享与访客：公开快照、一次动作、关系贴纸、转化入口。
5. 我的：改名、账户升级、主题、安装、导出与删除。

### 交互论点

1. 四问完成后，角色部件按节拍依次出现，形成 2-4 秒揭晓。
2. 每日回答后，旧部件短暂抖落，新变异以弹簧动效长出。
3. 贴纸从角色旁掉落到贴纸册入口，并通过共享布局转场进入详情。

所有动效在 `prefers-reduced-motion` 下退化为淡入与即时状态切换。

## 2. 技术策略

- Next.js App Router、React、TypeScript strict、Tailwind CSS v4。
- Motion 只用于客户端叶子组件。
- Zod 统一校验表单、API 输入和 AI JSON。
- Supabase 负责匿名认证、邮箱 OTP、Postgres 与 RLS。
- 数据访问采用 repository 接口；测试和未配置云端时使用内存/浏览器持久层，生产模式不得静默假装已连接 Supabase。
- AI 采用 OpenAI 兼容接口；缺少配置、超时或无效输出时使用确定性规则引擎。
- Vitest + Testing Library 执行单元和组件测试，Playwright 执行 Chromium、Firefox、WebKit E2E。
- PWA 提供 manifest、service worker、离线壳和分平台安装说明，不包含 Web Push。

## 3. 任务与验收节点

### 阶段 A：工程骨架

1. 初始化 Next.js、Tailwind、ESLint、TypeScript、Vitest 与 Playwright。
2. 建立主题 token、全局布局、字体、响应式导航和 PWA 元数据。
3. 建立环境变量 schema 与 `.env.example`。

验收：`lint`、`typecheck`、空项目 `build` 通过。

### 阶段 B：领域与规则引擎

1. 定义人格轴、问题、角色部件、变异、贴纸、分享与关系事件类型。
2. 编写 72 道审核问题和选题规则。
3. 实现首次创建映射、每日增量、部件兼容、贴纸文案和安全降级。
4. 实现本地 repository 与时间/时区幂等规则。

验收：性格边界、30 天去重、每日一次、换题一次、槽位冲突、脱敏和 AI 降级单测通过。

### 阶段 C：核心界面

1. `/` 与 `/create`：四问、进度、生成仪式、揭晓和改名。
2. `/home`：角色舞台、今日问题、换题、回答和变异反馈。
3. `/album`：变异、贴纸、关系事件。
4. `/me`：改名、主题、安装、导出、删除和云端账户状态。
5. `/p/[shareId]`：脱敏快照、访客一次互动与创建转化。

验收：键盘、触屏、亮暗色、减少动态、375/768/1440px 布局检查通过；无多层嵌套卡片。

### 阶段 D：服务端与 Supabase

1. 创建 SQL migration、RLS policy、索引和清理函数。
2. 接入匿名认证与邮箱 OTP 升级。
3. 实现规格中的九组 API 与幂等处理。
4. 接入 AI provider、安全 schema 和 6 秒降级。
5. 完成导出、删除、速率限制和公开分享脱敏。

验收：API 集成测试与真实 Supabase 项目 RLS 冒烟通过。

### 阶段 E：PWA 与质量闭环

1. 完成 manifest、图标、service worker、离线壳和安装说明。
2. 完成组件、集成和 12 条 E2E 流程。
3. 运行 lint、typecheck、unit、E2E、build、Lighthouse 与响应式截图审查。
4. 修复所有阻断、严重和主要缺陷，记录无法真机验证的边界。

验收：设计规格第 18 节 14 条标准逐条有证据。

### 阶段 F：发布

1. 创建 GitHub 新仓库 `oddling-pwa` 并推送 `main`。
2. 创建 Vercel 项目，配置生产环境变量并部署。
3. 对生产 URL 执行首次创建、每日回答、访客分享、导出删除冒烟。
4. 输出 iPhone、Android、Mac、Windows 安装方式。

验收：GitHub 默认分支可见、Vercel 生产 URL 可访问、生产冒烟通过。

## 4. 提交节点

1. `chore: scaffold Oddling PWA`
2. `feat: add avatar domain and daily mutation engine`
3. `feat: build onboarding home album and sharing flows`
4. `feat: add Supabase persistence and account lifecycle`
5. `test: complete product integrity coverage`
6. `chore: prepare production release`

## 5. 完成定义

只有以下证据同时存在，目标才算完成：

- 规格 14 条验收标准逐条通过。
- 所有发布前命令真实通过。
- 三浏览器 E2E 有测试报告。
- GitHub 新仓库已推送。
- Vercel 生产地址可访问且四条真实冒烟通过。
- 发布说明明确 PWA 安装方式与当前不包含原生商店包。
