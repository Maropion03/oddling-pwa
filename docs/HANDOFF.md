# Oddling 交接

更新于 2026-07-12

## 当前状态

- 分支：`main`
- HEAD：`36db5fb feat: 微信小程序套壳 + 微信静默登录`
- 工作区：交接时干净
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
- `36db5fb` 同时加入微信小程序壳、微信静默登录接口与数据库迁移
- 这些微信改动来自当前用户工作流，继续修改前先确认实际微信 AppID、回调域名和生产数据库配置

## 关键提交

| 提交 | 内容 |
| --- | --- |
| `24c6ecd` | 去除固定产品文案标点，补完整 Mermaid 流程图 |
| `959e991` | 公开分享页真实手势互动和自定义标签 |
| `3aefba6` | 修复动态 OG 图 500 |
| `6204675` | 固定桌面导出页容器，避免纵向滚动 |
| `206a189` | 导出结果第二页和 READY TO POST 翻页体验 |
| `36db5fb` | 微信小程序、微信静默登录和 Oddling favicon |

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
