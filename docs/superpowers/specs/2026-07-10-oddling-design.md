# Oddling 产品与技术设计规格

日期：2026-07-10  
工作名：Oddling（品牌名尚未最终确认）  
中文描述：怪可爱数字分身  
计划仓库：`oddling-pwa`

规格状态：产品方向、流程、范围和技术方案已完成内部自审，等待用户最终审阅。品牌命名不阻塞功能开发；若审阅时不提出改名，首版沿用 Oddling。

## 1. 产品概述

Oddling 是一款面向 18-28 岁轻亚文化用户的 AI 数字分身养成玩具。用户首次回答四个怪问题，系统生成一个不完全受用户控制的怪可爱分身。分身每天主动提出一个问题，用户用一句话回答后，角色产生一次可见小变异、给出一句角色化回应，并掉落一张今日贴纸。用户可以分享角色或贴纸，好友无需注册即可执行一次轻量互动，并获得关系贴纸。

核心体验承诺：每天用 15 秒，看看另一个自己今天又长成了什么奇怪样子。

Oddling 不承担心理治疗、效率管理或无限陪伴职责。产品重点是身份投射、可见养成、收藏和近关系表达。

## 2. 目标用户与场景

### 2.1 首发用户

- 18-28 岁。
- 长期使用小红书、Bilibili 等内容平台。
- 喜欢人格测试、表情包、二次元、萌宠和轻亚文化表达。
- 愿意通过虚拟角色表达自己，但不希望维护公开社交账号或复杂宠物状态。

### 2.2 核心场景

#### 场景 A：首次创建

用户从朋友分享或社交内容进入产品，希望快速看到“自己会长成什么”。用户在 60-90 秒内完成三道视觉选择题和一道短文本题，获得唯一分身。

#### 场景 B：每日回访

用户在碎片时间打开 Oddling，分身提出一个怪问题。用户回答一句话，立即看到角色动作、永久小变异和今日贴纸。用户缺席不会受到损失或责备。

#### 场景 C：好友互动

好友打开分享链接，不登录即可从三个动作中选择一个。角色根据自身性格作出反应，并生成关系贴纸。访客随后可以创建自己的分身。

#### 场景 D：收藏回看

用户进入贴纸册，按时间查看角色变异、每日贴纸和关系事件，理解角色如何逐渐长成现在的样子。

## 3. 产品目标与指标

### 3.1 北极星行为

用户在首次创建后的 7 天内至少完成 3 次每日喂养，并主动分享过一次分身、贴纸或关系事件。

### 3.2 核心漏斗事件

1. `onboarding_started`
2. `onboarding_completed`
3. `daily_question_viewed`
4. `daily_answer_submitted`
5. `mutation_revealed`
6. `share_created`
7. `guest_interacted`
8. `guest_started_onboarding`
9. `pwa_installed`

埋点不记录用户原始回答、邮箱或 IP。回答内容只保存在用户私有数据表中。

## 4. 竞品整合原则

竞品研究覆盖 Finch、Voidpet Garden、Widgetable、Pengu、Locket、Tamagotchi Uni、Pokémon Sleep、Neko Atsume、ZEPETO、BeReal、SUSH、BUD、Stride 和 Happy Pets。完整证据见 `research/2026-07-10-similar-products/`。

### 4.1 吸收

- 单一、短促的每日触发器。
- 用户输入后立即出现可见角色变化。
- 稳定人格与模块化成长。
- 幽默命名的可收藏结果。
- 近关系、无公开计数的低压力互动。
- 分享链接本身即可体验。
- 可回看的变异历史与关系历史。

### 4.2 规避

- 饥饿、离家、断签损失等惩罚。
- 广告换取基础资源。
- 好友共同承担养成责任。
- 无限聊天与长期对话承诺。
- 商店、货币、小游戏和公开排行榜。
- 公开 Feed、陌生人推荐和 UGC 市场。
- 与分身核心无关的生活工具堆叠。

## 5. MVP 范围

### 5.1 包含

1. 匿名进入与可选邮箱 OTP 绑定。
2. 四问创建分身。
3. 模块化角色生成与稳定人格。
4. 每日问题、一次换题和 60 字回答。
5. 每日一次永久小变异。
6. 角色化短回应与今日贴纸。
7. 变异谱、贴纸册和关系事件历史。
8. 公开只读分享页。
9. 好友免登录动作与关系贴纸。
10. PWA 安装、离线壳和弱网降级。
11. 数据导出与完整删除。
12. 亮色、暗色主题和减少动态模式。

### 5.2 不包含

- 长对话。
- 语音输入或语音通话。
- 房间装修、货币、商城和付费系统。
- 小游戏、任务列表和 streak。
- 公开用户主页、关注、评论和排行榜。
- 陌生人推荐、公开 Feed 和 UGC 市场。
- 原生 App、桌面组件和小程序包。

## 6. 信息架构

### 6.1 路由

| 路由 | 作用 | 访问权限 |
|---|---|---|
| `/` | 根据用户状态进入欢迎页、继续创建或首页 | 公开 |
| `/create` | 四问创建、生成仪式、首次揭晓 | 当前用户 |
| `/home` | 分身舞台、今日问题、回答与变异反馈 | 当前用户 |
| `/album` | 变异谱、贴纸、关系事件三个平级页签 | 当前用户 |
| `/me` | 改名、绑定、主题、安装、导出、删除 | 当前用户 |
| `/p/[shareId]` | 脱敏公开角色页与访客互动 | 持链接访客 |

移动端使用巢穴、贴纸册、我的三个底部导航。桌面端将导航改为窄侧栏，首页使用左侧角色舞台与右侧每日动作。公开分享页不显示用户私有导航。

## 7. 核心流程

### 7.1 首次创建

1. 欢迎页说明“回答四个怪问题，把另一个你放出来”。
2. 用户完成三道视觉选择题。
3. 用户完成一道最多 60 字的自由回答。
4. 系统把回答映射到五个隐藏性格轴。
5. 页面展示 2-4 秒生成仪式。
6. 用户获得分身、初始名字和一句性格判断。
7. 用户可以改名，但不能捏脸或选择候选角色。
8. 创建后 24 小时内允许一次清空重建，重建会删除旧角色全部数据。

### 7.2 每日喂养

1. 首页直接显示当天问题。
2. 用户可以免费换一道题，每个自然日最多一次。
3. 用户输入最多 60 字并提交。
4. 服务端完成安全检查、性格增量计算、变异选择和回应生成。
5. 前端先播放动作，再展示局部变异、角色回应和贴纸。
6. 每个自然日最多产生一次永久变异。
7. 当天完成后再次进入首页时，展示已完成结果，不重复生成。

缺席不会导致角色生病、离家、降级或失去物品。角色可以用无责备的荒诞短句欢迎用户回来。

### 7.3 分享与好友互动

1. 用户从今日贴纸或分身页生成分享链接。
2. 分享记录只包含公开角色快照、公开短句和贴纸，不包含原始回答。
3. 访客打开链接后可选择戳一下、投喂奇怪物或贴标签。
4. 每个访客标识对同一分享记录只能互动一次。
5. 角色根据自身性格产生反应，并生成关系贴纸。
6. 访客不能修改角色永久属性。
7. 访客完成后可进入创建流程；创建成功后建立双方关系事件。

## 8. 角色系统

### 8.1 隐藏性格轴

每个轴范围为 0-100，首次创建后初始值位于 25-75，避免极端人格。

| 轴 | 低值表现 | 高值表现 |
|---|---|---|
| `energy` | 慢、躺平、短回应 | 活跃、跳跃、回应快 |
| `softness` | 直接、硬边、反差强 | 温柔、圆润、缓和 |
| `order` | 随机、散乱、即兴 | 分类、整理、控制 |
| `social` | 躲避、观察、独处 | 主动、靠近、回应好友 |
| `oddness` | 日常、克制 | 荒诞、反常识、奇怪命名 |

每日一次回答最多影响两个轴，每个轴增量限制在 -5 到 +5。前端不展示分数，只通过动作、文案和变异表达。

### 8.2 角色部件

MVP 最小资产规模：

- 身体轮廓 5 种。
- 眼睛 8 种。
- 嘴 6 种。
- 主头饰 12 种。
- 背部部件 8 种。
- 表面纹理 10 种。
- 手持物 8 种。
- 动作 20 种。
- 贴纸构图 12 种，文案组合不少于 40 种。

永久槽位规则：一个主头饰、一个背部部件、一个手持物、两个表面纹理。新变异与现有槽位冲突时，系统选择升级、替换或放入收藏柜，不能无限堆叠。

### 8.3 生成策略

角色主体采用可组合的 SVG 或 CSS 图层。AI 不生成整张角色图片。服务端 AI 只输出符合 JSON Schema 的性格增量、回应类型、变异令牌和短文案。前端根据令牌组合稳定资产。

当 AI 不可用、超时或输出无效时，确定性规则引擎根据问题标签、关键词和当前人格生成结果。降级结果仍可完成变异、贴纸、分享和历史保存。

## 9. 问题与内容系统

MVP 内置 72 道人工审核问题，覆盖六类：荒诞日常、轻社交、偏好选择、微小烦恼、想象题、温柔回看。每类 12 道。

问题选择规则：

1. 近 30 天不重复。
2. 避免连续三天相同分类。
3. 根据角色性格调整题目排序，不临时生成全新题目。
4. 用户换题后，原题当天不再出现。
5. 问题不要求用户披露姓名、地址、公司、学校、健康或财务信息。

回应限制为一句，中文最多 42 字。贴纸标题最多 10 个汉字。禁止医疗判断、人格诊断、羞辱、威胁、性内容和针对受保护群体的攻击。

## 10. 视觉与交互系统

### 10.1 Design Read

面向审美敏感、社交平台原生用户的玩具型 ToC 产品，采用怪可爱贴纸刊物语言，倾向手作材质、高反馈动效和轻亚文化反差。

### 10.2 设计参数

- `DESIGN_VARIANCE: 9`
- `MOTION_INTENSITY: 8`
- `VISUAL_DENSITY: 3`

### 10.3 色彩角色

- 奶油纸张 `#F3EEDC`：亮色背景。
- 炭黑 `#202124`：主文字与粗边界。
- 珊瑚红 `#FF6F59`：主行动与角色主体。
- 钴蓝 `#2B59C3`：结构强调与收藏状态。
- 暖黄 `#F3CB42`：奖励与揭晓。
- 酸性绿 `#D2FF45`：只用于短暂变异动画，不作为常驻操作色。

暗色主题使用 `#191A18` 背景与 `#F3EEDC` 主文字，角色与功能色保持一致。主题默认跟随系统，并允许在“我的”页面覆盖。

### 10.4 形状规则

- 应用外壳 28px。
- 内容面板 18px。
- 按钮与输入 14px。
- 筛选页签使用全圆角。
- 不使用多层嵌套卡片。信息分组优先使用留白、单条分隔线和背景色块。

### 10.5 动效

- 页面与元素进入只使用 transform 和 opacity。
- 角色变异使用 Motion spring，核心揭晓时长 2-4 秒。
- 点击反馈使用 `scale(0.98)` 或 1px 位移。
- `prefers-reduced-motion` 下禁用旋转、弹跳和持续循环，只保留淡入与即时状态切换。

视觉稿存放于 `docs/visuals/`。

## 11. 技术架构

### 11.1 前端

- Next.js App Router。
- React 与 TypeScript strict mode。
- Tailwind CSS v4。
- Motion `motion/react`，仅在客户端叶子组件使用。
- Zod 负责客户端与服务端数据校验。
- Web App Manifest、Service Worker、离线壳和安装引导构成 PWA。

### 11.2 后端与数据

- Supabase Postgres。
- Supabase Anonymous Sign-In 提供无表单首次体验。
- 用户可通过邮箱 OTP 将匿名身份升级为可恢复账户。
- 所有私有表启用 Row Level Security。
- Next.js Route Handlers 承担 AI 调用、公开分享读取、访客互动、导出与删除。
- 服务器保存 AI 密钥，客户端永远不接触密钥。

Supabase 官方说明匿名用户使用 `authenticated` 角色，因此 RLS 必须同时校验 `auth.uid()` 与匿名状态。匿名账号创建启用 CAPTCHA 或 Turnstile，并配置清理长期未使用匿名账号的计划任务。

部署环境变量至少包含：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`，仅服务端使用，用于账户彻底删除和管理任务。
- `LLM_API_KEY`、`LLM_BASE_URL`、`LLM_MODEL`。

本地开发允许缺少 LLM 配置并全程使用规则引擎；生产环境必须连接独立 Supabase 项目。若未提供外部服务登录态或密钥，代码与本地完整性测试仍可完成，但真实云端认证、数据持久化和生产冒烟不能被标记为通过。

### 11.3 AI Provider

应用通过统一 `LLMProvider` 接口调用 OpenAI 兼容服务。环境变量：

- `LLM_API_KEY`
- `LLM_BASE_URL`
- `LLM_MODEL`

模型响应必须满足固定 JSON Schema。超时上限 6 秒，失败后立即切换本地规则引擎，不向用户暴露供应商名称或原始错误。

### 11.4 PWA 与发布

Next.js 官方 PWA 指南支持 manifest、service worker 与 Web Push。iOS/iPadOS 16.4 及以上只有安装到主屏幕的 Web App 才能申请推送权限，且申请必须由用户点击触发。MVP 只提供安装能力与分平台安装说明，不申请通知权限，也不承诺每日推送；Web Push 在留存验证后单独评估。

首发部署为 Vercel HTTPS Web 应用，不需要 App Store 或小程序审核。iPhone 用户通过 Safari 分享菜单添加到主屏幕，Android 和桌面 Chromium 浏览器使用安装入口。原生封装在留存验证后评估。

Service Worker 只缓存应用壳、字体与版本化静态角色资产，不缓存私有 API 响应、认证回调或用户回答。

## 12. 数据模型

### 12.1 表

#### `profiles`

- `id uuid`，与 auth user 相同。
- `display_name text`。
- `theme text`。
- `created_at timestamptz`。

#### `avatars`

- `id uuid`。
- `owner_id uuid`。
- `name text`。
- `seed text`。
- `traits jsonb`。
- `parts jsonb`。
- `rebuild_used boolean`。
- `created_at timestamptz`。
- `updated_at timestamptz`。

#### `daily_entries`

- `id uuid`。
- `avatar_id uuid`。
- `question_id text`。
- `local_date date`。
- `timezone text`。
- `answer text`，仅 owner 可读。
- `trait_delta jsonb`。
- `response_text text`。
- `created_at timestamptz`。
- 唯一约束 `(avatar_id, local_date)`。

#### `mutations`

- `id uuid`。
- `entry_id uuid`。
- `avatar_id uuid`。
- `slot text`。
- `token text`。
- `label text`。
- `previous_token text null`。
- `created_at timestamptz`。

#### `stickers`

- `id uuid`。
- `owner_id uuid`。
- `avatar_id uuid`。
- `kind text`，取值 `daily` 或 `relationship`。
- `title text`。
- `payload jsonb`。
- `created_at timestamptz`。

#### `shares`

- `id uuid`。
- `owner_id uuid`。
- `avatar_id uuid`。
- `public_token text unique`。
- `public_snapshot jsonb`，不包含回答原文。
- `expires_at timestamptz null`。
- `created_at timestamptz`。

#### `guest_interactions`

- `id uuid`。
- `share_id uuid`。
- `visitor_id text`，浏览器随机标识。
- `visitor_rate_hash text`，每日盐化 HMAC，不保存原始 IP。
- `action text`。
- `response_text text`。
- `sticker_payload jsonb`。
- `created_at timestamptz`。
- 唯一约束 `(share_id, visitor_id)`。

#### `product_events`

- `id uuid`。
- `user_id uuid null`。
- `anonymous_session_id text null`。
- `event_name text`，只允许白名单事件。
- `properties jsonb`，禁止写入回答、邮箱和 IP。
- `created_at timestamptz`。

## 13. API 契约

| 方法 | 路径 | 作用 |
|---|---|---|
| POST | `/api/avatar/create` | 校验四问答案并生成初始角色 |
| GET | `/api/daily` | 获取当天问题或已完成结果 |
| POST | `/api/daily/reroll` | 每日一次换题 |
| POST | `/api/daily/respond` | 生成性格增量、变异、回应与贴纸 |
| POST | `/api/shares` | 创建脱敏分享快照 |
| GET | `/api/public/shares/[token]` | 获取公开分享内容 |
| POST | `/api/public/shares/[token]/interact` | 访客动作与关系贴纸 |
| GET | `/api/account/export` | 导出用户全部可读数据 |
| DELETE | `/api/account` | 删除业务数据与 auth 用户 |

所有写请求校验 CSRF 来源、JSON Schema、长度和枚举。公开接口使用 IP 速率限制与 visitor 唯一约束。公开 token 使用至少 128 bit 随机值，不能根据数据库 ID 推测。

## 14. 错误与降级

| 场景 | 用户体验 | 系统行为 |
|---|---|---|
| AI 超时或无效 JSON | 显示正常变异结果，不出现技术错误 | 使用确定性规则引擎 |
| 网络中断 | 保留回答并提示稍后重试 | IndexedDB 暂存，恢复后提交 |
| 重复提交 | 返回当天已有结果 | 数据库唯一约束保证幂等 |
| 换题次数耗尽 | 保留当前题目 | 服务端拒绝第二次换题 |
| 分享不存在或过期 | 展示品牌化空状态 | 不泄露原分享信息 |
| 访客重复互动 | 展示上次互动结果 | 不创建第二条记录 |
| 角色部件冲突 | 用户无感知 | 兼容规则改为升级、替换或收藏 |
| 内容触发安全规则 | 不生成戏谑回应 | 提供中性支持文案与求助提示 |
| 匿名会话丢失 | 提示本机记录无法恢复 | 引导绑定邮箱，不伪装云端已恢复 |

## 15. 隐私与安全

- 公开分享永远不包含用户原始回答、邮箱、时区或内部性格分数。
- 私有数据通过 Supabase RLS 限制为 owner。
- AI 输入只包含当前问题、当前回答、有限性格状态和必要的近期标签。
- 不把历史回答全文发送给模型。
- 数据导出提供 JSON 文件。
- 删除操作二次确认，并删除 profile、avatar、entry、mutation、sticker、share、interaction 与 auth user。
- 不保存原始 IP；速率限制只保留每日盐化 HMAC。
- 禁止在日志中记录回答文本和认证 token。
- 安全响应头包含 CSP、`X-Content-Type-Options`、`Referrer-Policy` 与 frame 限制。

## 16. 可访问性与性能

- 正文与按钮达到 WCAG AA 对比度。
- 所有可点击目标至少 44 x 44 CSS px。
- 键盘可完成首次创建、每日回答、页签切换和访客互动。
- 角色变化使用 `aria-live` 文本说明。
- 所有动效尊重 `prefers-reduced-motion`。
- LCP 目标低于 2.5 秒，INP 低于 200ms，CLS 低于 0.1。
- 首屏角色资产使用内联或预加载的轻量矢量资源。
- 非首屏贴纸与历史记录懒加载。
- AI 请求不阻塞基础页面渲染。

## 17. 测试策略

### 17.1 单元测试

- 四问到性格轴的映射。
- 性格增量上下限。
- 部件兼容、升级、替换与槽位上限。
- 每日日期与时区计算。
- 换题次数限制。
- 分享快照脱敏。
- 访客反应确定性与安全文案。
- AI Schema 解析与规则降级。

### 17.2 组件与集成测试

- 创建问题、字符计数、键盘操作和验证错误。
- 每日提交 loading、success、error 和 retry 状态。
- 贴纸册三个页签与空状态。
- API 鉴权、幂等、RLS 与公开路由脱敏。
- 数据导出和删除链路。

### 17.3 端到端测试

1. 匿名用户完成首次创建并修改名字。
2. 用户换题一次并完成每日回答。
3. AI 超时后规则引擎仍完成变异。
4. 刷新后恢复当天结果。
5. 创建分享链接，访客免登录互动。
6. 同一访客重复互动时返回原结果。
7. 访客进入创建流程并完成自己的分身。
8. 用户查看变异、贴纸与关系历史。
9. 用户绑定邮箱并恢复数据。
10. 用户导出并删除账户。
11. iPhone、Android、375px、768px、1440px 响应式检查。
12. 离线壳、弱网重试和 PWA manifest 检查。

自动化浏览器矩阵至少覆盖 Chromium、Firefox 和 WebKit。PWA 安装资格通过 Chromium 与 Lighthouse 检查；iOS 添加到主屏幕步骤作为发布说明和人工验收项，不把桌面 WebKit 模拟结果表述为真机验证。

### 17.4 发布前完整性测试

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run build`
- Lighthouse PWA、Accessibility、Performance 检查。
- 生产 URL 首次创建、每日回答、分享访客、删除数据四条真实冒烟路径。
- 生产 Supabase RLS、匿名升级、公开分享脱敏和账户删除使用真实云端项目复核。

## 18. 验收标准

1. 用户可以无注册完成四问并生成稳定分身。
2. 首次创建不提供捏脸，允许改名和一次清空重建。
3. 用户每天获得一个问题，并且只能换题一次。
4. 回答最多 60 字，每天最多产生一次永久变异。
5. AI 失败时规则引擎能完成同一业务结果。
6. 贴纸册能回看变异、贴纸和关系事件。
7. 公开分享不包含私密回答与内部人格分数。
8. 好友无需注册即可互动一次，重复互动返回原结果。
9. 访客不能改变角色永久属性。
10. 用户可以绑定邮箱、导出数据和彻底删除账户。
11. PWA 可通过 HTTPS 安装，离线时能打开应用壳。
12. 亮色、暗色和减少动态模式均可用。
13. 移动端与桌面端不存在导航溢出、按钮不可见或嵌套卡片堆叠。
14. 所有发布前命令通过，生产 URL 四条冒烟路径通过。

## 19. 发布策略

首发为 Vercel 托管的 PWA，后端数据使用 Supabase。该形态覆盖 iPhone、Android、Mac 和 Windows，不需要 App Store 或微信小程序审核。用户通过浏览器访问链接，并按平台指引安装到主屏幕或桌面。

只有在真实数据证明 7 日多次回访和分享转化成立后，再评估：

- Capacitor 封装 iOS/Android。
- TestFlight 与 App Store 发布。
- Android Play 内测与正式发布。
- 微信小程序独立适配。
- 原生桌面小组件和推送增强。
- 每日 Web Push 提醒。

原生封装不会进入当前 MVP 完成标准。

## 20. 视觉稿索引

- `docs/visuals/visual-style.html`
- `docs/visuals/soft-subculture-spectrum.html`
- `docs/visuals/onboarding-flow.html`
- `docs/visuals/daily-loop.html`
- `docs/visuals/friend-share-flow.html`
- `docs/visuals/information-architecture.html`
