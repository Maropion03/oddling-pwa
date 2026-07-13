# Oddling 交接

更新于 2026-07-13

## 当前状态

- 分支：`main`
- HEAD：待提交：原生微信小程序与小程序令牌认证
- 工作区：有未提交的原生小程序开发改动
- 生产：`https://oddling-pwa.vercel.app`
- 最近确认的 Vercel production 部署：`https://oddling-19iw33dw0-maropions-projects.vercel.app` 状态 Ready

Oddling 当前是一个由每日一句话驱动的数字分身养成玩具。用户创建角色后可每日投喂一句回答，角色产生外观变异和贴纸，结果可分享给朋友互动。

## 已完成的关键体验

### 创建与日常循环

- 四道怪问题生成角色、名字与人格判词
- 每日一句回答触发变异、贴纸和历史记录
- 固定文案已移除标点显示，用户输入保持原样

### 分享与好友互动

- 公开链接、动态分享标题描述、动态 OG 图
- 好友只能选择一次互动
- 戳一下：手指戳角色
- 投喂怪东西：手把食物递到角色嘴边
- 贴个标签：弹窗输入最多 12 字，自定义标签贴到角色上并写入关系贴纸
- 互动在本地和云端路径都支持保存和刷新恢复

### 导出页

- 每日结果有两页
  - `TODAY IS ARCHIVED` 01 OF 02：归档结果
  - `READY TO POST` 02 OF 02：发布卡片、3:4 和 1:1 切换、保存图片
- 两页使用 3D 翻页动画
- 桌面端巢穴页固定为 `100svh` 容器
- 已在 1830x1167 与 1440x900 验证发布卡片、保存和返回按钮不发生纵向溢出

### 图标与微信入口

- 浏览器 favicon 已改为 Oddling 吉祥物，和 PWA 图标一致
- 原来的 `web-view` 小程序壳已替换为原生页面：创建、每日回答、结果/发布卡片、贴纸册、设置、公开互动
- 小程序用 `wx.login` 调用 `/api/miniprogram/auth/login`，后端基于 OpenID 创建独立 Supabase 账号，并向原有 API 传 Bearer token
- 原 `/api/wechat-auth` 已下线并返回 410，避免网页套壳继续使用旧路径
- 小程序无须网页回调域名，但微信公众平台仍需配置请求合法域名

## 关键提交

| 提交 | 内容 |
| --- | --- |
| `24c6ecd` | 去除固定产品文案标点，补完整 Mermaid 流程图 |
| `959e991` | 公开分享页真实手势互动和自定义标签 |
| `3aefba6` | 修复动态 OG 图 500 |
| `6204675` | 固定桌面导出页容器，避免纵向滚动 |
| `206a189` | 导出结果第二页和 READY TO POST 翻页体验 |
| `36db5fb` | 微信小程序、微信静默登录和 Oddling favicon |
| 待提交 | 原生小程序替代网页套壳、Bearer API 鉴权、小程序会话刷新、发布卡片/导出/分享管理 |

## 验证方式

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
npm run test:e2e -- --project=chromium --workers=1
npm run test:production
```

注意：`test:production` 会在生产环境创建临时账号和数据，最后调用删除接口清理。需要已配置的 Supabase 和生产登录环境。

## 原生小程序上线前置条件

- 生产 Supabase 必须执行 `supabase/migrations/20260712160000_add_wechat_openid.sql`。本机迁移校验已通过，但当前环境缺少 Supabase CLI 的生产访问令牌，尚未对远端执行，不能把这一步当作已完成。
- Vercel Production 需要 `WECHAT_APPID`、`WECHAT_APPSECRET`、`WECHAT_AUTH_PEPPER`。密钥不得放进小程序代码或 Git。
- 在微信公众平台配置 `https://oddling-pwa.vercel.app` 为 request 合法域名；若 Vercel 别名不被接受，应先绑定自有 HTTPS 域名并更新 `miniprogram/utils/api.js`。
- 本机未安装微信开发者工具，因此已完成静态 JS/JSON 和 Web API 构建验证；发布卡片保存、相册授权、文件分享和真机微信登录仍需在开发者工具与真机逐项验收。

## 视频内容待继续

用户想做 Oddling 产品介绍视频。原始小红书链接无法直接读取，后来提供了完整参考视频：

`/Users/medusa/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_gonxi8lwye7522_0d36/msg/video/2026-07/bb684a175a8a55397f345929a8975c67.mp4`

已确认参考视频风格：

- 166 秒竖屏讲解型视频
- 真实屏幕连续操作是主画面
- 右下角固定讲解者小头像
- 底部高对比黄色字幕
- 证据优先，几乎不依赖炫技转场

建议先与用户确认一句产品定义。当前推荐但尚未得到用户最终确认：

> 一个会随着你每天一句话继续长歪的分身养成玩具

确认后写 60 到 90 秒讲解型脚本，开场用真实创建流程，后续依次展示每日变异、第二页发布卡片和好友互动。

## 注意事项

- 不要把用户正在进行的微信小程序改动拆出或回退
- 如果浏览器仍显示旧 favicon，强制刷新或清理站点缓存后再看
- Vercel production 由 main 自动部署；生产状态用 `npx vercel ls oddling-pwa --yes` 或 `npx vercel inspect <deployment>` 核对
- 项目视觉规则和完整流程图在 `docs/product-flow.md` 与 `docs/visuals/`
