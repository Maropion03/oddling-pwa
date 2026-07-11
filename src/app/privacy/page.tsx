import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";

export const metadata = { title: "隐私说明" };

export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <header className="privacy-page__nav"><Wordmark compact/><Link className="btn btn--ghost" href="/me"><ArrowLeft size={17}/>返回我的</Link></header>
      <article className="privacy-copy">
        <p className="eyebrow">PRIVACY, PLAINLY</p>
        <h1 className="page-title">你放进 Oddling 的东西</h1>
        <p className="lede">我们只保存让分身成长 恢复和分享所需要的数据 你的每日回答不会出现在公开分享页</p>
        <section><h2>保存什么</h2><p>分身外观 名字 性格属性 每日回答 变异 贴纸 公开分享记录以及匿名账号会话 绑定邮箱后 邮箱只用于恢复账号</p></section>
        <section><h2>公开什么</h2><p>公开链接只包含角色快照 名字 可公开的性格状态和你主动选择分享的贴纸 它不包含每日回答 邮箱或其他账号信息 公开链接默认 30 天后失效 也可以在我的中撤销</p></section>
        <section><h2>模型调用</h2><p>如配置了 AI 生成服务 回答会用于生成角色化回应 贴纸文案和变异建议 服务不可用时 Oddling 使用本地规则引擎继续生成</p></section>
        <section><h2>导出与删除</h2><p>你可以在我的中导出自己的数据 或删除全部数据 删除会同时移除云端匿名账户及其关联内容</p></section>
        <section><h2>反馈与数据问题</h2><p>功能反馈可通过项目 Issue 提交 请不要在公开 Issue 中发送邮箱 回答或其他个人信息 涉及数据问题时 优先使用产品内的导出和删除功能</p><a className="btn" href="https://github.com/Maropion03/oddling-pwa/issues/new" target="_blank" rel="noreferrer">前往反馈 <ExternalLink size={17}/></a></section>
      </article>
    </main>
  );
}
