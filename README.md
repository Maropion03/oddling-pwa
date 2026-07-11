# Oddling · 怪可爱分身

<p align="center">
  <img src="public/icons/icon-192.png" alt="Oddling" width="96" height="96" />
</p>

<p align="center">
  <strong>AI ALTER EGO TOY</strong><br/>
  把另一个你放出来。
</p>

<p align="center">
  <img alt="version" src="https://img.shields.io/badge/version-0.1.0-8b5cf6?style=flat-square" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-3b82f6?style=flat-square" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square" />
  <img alt="PWA" src="https://img.shields.io/badge/PWA-Ready-10b981?style=flat-square" />
</p>

<p align="center">
  <a href="https://oddling-pwa.vercel.app"><strong>立即体验 →</strong></a>
</p>

---

## 这是什么

Oddling 是一个 AI 数字分身养成玩具。回答四个怪问题，得到一个不完全受你控制的数字分身——它看起来有点怪，但莫名有点像你。

以后每天一句话，看它继续长歪。

- **不用注册**，打开即用
- **不会断签**，没有惩罚机制
- **可以改名**，但不能捏脸——第一次见面的意外感是核心体验

---

## 怎么玩

### 每天 15 秒，三步走完

| 步骤 | 你做什么 | 分身做什么 |
|------|---------|-----------|
| **一句回答** | 回答分身今天提出的怪问题 | 不写长日记，只留下今天最像你的那一句 |
| **一次变异** | 写下回答的瞬间 | 外观、动作和脾气立刻发生可见变化，进入长期历史 |
| **一张贴纸** | 当天掉落一张专属贴纸 | 适合收藏，也适合发给熟人 |

### 好友怎么参与

- 分享你的分身链接，好友**无需注册**就能互动
- 好友给你留下关系贴纸或事件
- 好友创建自己的分身后，你们之间会解锁**双角色关系事件**

---

## 设计风格

怪可爱贴纸刊物。奶油纸张、黑色粗边、珊瑚红与钴蓝、手作边缘、高反馈动效——可收藏、可截图、可传播。

---

## 本地运行

```bash
npm install
npm run dev
```

未配置环境变量时自动进入本地演示模式，数据保存在浏览器中。

需要云端持久化和跨设备分享时，复制 `.env.example` 为 `.env.local` 并填写 Supabase 配置。

---

## 安装到手机 / 桌面

Oddling 是 PWA，无需提交商店审核：

- **iPhone / iPad**：Safari 打开 → 分享 → 添加到主屏幕
- **Android**：Chrome 打开 → 安装应用
- **桌面**：Chrome / Edge 地址栏右侧 → 安装

---

## 技术栈

Next.js 16 + React 19 + Supabase + Tailwind CSS + Motion

---

## 许可

MIT
