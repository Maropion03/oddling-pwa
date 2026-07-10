"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { AvatarFigure } from "@/components/avatar/avatar-figure";
import { Wordmark } from "@/components/brand/wordmark";
import { useOddling } from "@/components/providers/oddling-provider";
import type { AvatarParts } from "@/lib/domain/types";

const previewParts: AvatarParts = {
  body: "bean",
  eyes: "mismatch",
  mouth: "fang",
  head: "antenna",
  back: "tail",
  textures: ["stars", "scribble"],
  handheld: "lamp",
};

export function Landing() {
  const { state, hydrated } = useOddling();
  return (
    <main className="landing">
      <header className="landing__nav">
        <Wordmark compact />
        <span className="status-strip"><span className="status-dot"/>每天 15 秒</span>
      </header>

      <section className="landing__hero">
        <motion.div
          className="landing__copy"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="eyebrow">AI ALTER EGO TOY</p>
          <Wordmark />
          <h1 className="display-title">把另一个你<br/>放出来。</h1>
          <p className="lede">回答四个怪问题，得到一个不完全受你控制的数字分身。以后每天一句话，看它继续长歪。</p>
          <div className="landing__actions">
            <Link className="btn btn--primary" href={hydrated && state.avatar ? "/home" : "/create"}>
              {hydrated && state.avatar ? `去找 ${state.avatar.name}` : "开始生成"}
              <ArrowUpRight size={19} aria-hidden="true" />
            </Link>
            <span className="landing__aside"><Sparkles size={16}/> 不用注册 · 不会断签 · 可以改名</span>
          </div>
        </motion.div>

        <motion.div
          className="landing__stage"
          initial={{ opacity: 0, scale: 0.8, rotate: 8 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          transition={{ type: "spring", delay: 0.16, stiffness: 130, damping: 13 }}
        >
          <span className="stage-note stage-note--top">SAMPLE SPECIMEN 001</span>
          <AvatarFigure parts={previewParts} name="预览分身" />
          <span className="stage-note stage-note--bottom">它看起来已经有点意见</span>
        </motion.div>
      </section>

      <section className="landing__proof" aria-label="产品特点">
        <div><span>01</span><strong>一句回答</strong><p>不写长日记，只留下今天最像你的那一句。</p></div>
        <div><span>02</span><strong>一次变异</strong><p>外观、动作和脾气都会留下真正可回看的变化。</p></div>
        <div><span>03</span><strong>一张贴纸</strong><p>每天掉落一张结果，方便收藏，也适合发给熟人。</p></div>
      </section>
    </main>
  );
}
