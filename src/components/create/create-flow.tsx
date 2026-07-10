"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Dices } from "lucide-react";
import { useRouter } from "next/navigation";
import { AvatarFigure } from "@/components/avatar/avatar-figure";
import { Wordmark } from "@/components/brand/wordmark";
import { useOddling } from "@/components/providers/oddling-provider";
import { generateAvatar } from "@/lib/domain/engine";
import { ONBOARDING_QUESTIONS } from "@/lib/domain/questions";
import type { OnboardingAnswer, OnboardingInput } from "@/lib/domain/types";

const TOTAL_STEPS = 4;

export function CreateFlow() {
  const router = useRouter();
  const { createAvatar, rebuildAvatar, renameAvatar } = useOddling();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([]);
  const [freeText, setFreeText] = useState("");
  const [phase, setPhase] = useState<"questions" | "generating" | "reveal">("questions");
  const input = useMemo<OnboardingInput>(() => ({ choices: answers, freeText }), [answers, freeText]);
  const preview = useMemo(() => phase === "reveal" ? generateAvatar(input) : null, [input, phase]);
  const [name, setName] = useState("");

  const current = ONBOARDING_QUESTIONS[step];
  const currentAnswer = current ? answers.find((answer) => answer.questionId === current.id)?.optionId : null;
  const canContinue = step < 3 ? Boolean(currentAnswer) : freeText.trim().length >= 2;

  function choose(questionId: string, optionId: string) {
    setAnswers((currentAnswers) => [
      ...currentAnswers.filter((answer) => answer.questionId !== questionId),
      { questionId, optionId },
    ]);
  }

  function next() {
    if (!canContinue) return;
    if (step < TOTAL_STEPS - 1) {
      setStep((value) => value + 1);
      return;
    }
    setPhase("generating");
    window.setTimeout(() => {
      const avatar = generateAvatar(input);
      const rebuilding = window.sessionStorage.getItem("oddling:rebuild") === "1";
      if (rebuilding) {
        rebuildAvatar(input);
        window.sessionStorage.removeItem("oddling:rebuild");
      } else {
        createAvatar(input);
      }
      setName(avatar.name);
      setPhase("reveal");
    }, 2200);
  }

  function enterNest() {
    if (name.trim()) renameAvatar(name);
    router.push("/home");
  }

  if (phase === "generating") {
    return (
      <main className="generate-screen" aria-live="polite">
        <Wordmark compact />
        <div className="generate-orbit" aria-hidden="true">
          <span/><span/><span/>
        </div>
        <p className="eyebrow">正在把答案揉成一团</p>
        <h1 className="page-title">先长眼睛，<br/>再决定脾气。</h1>
      </main>
    );
  }

  if (phase === "reveal" && preview) {
    return (
      <main className="reveal-screen">
        <section className="reveal-stage">
          <p className="eyebrow">SPECIMEN FOUND</p>
          <AvatarFigure parts={preview.parts} name={name || preview.name} />
          <span className="reveal-stamp">初次出现<br/>{new Date().toLocaleDateString("zh-CN")}</span>
        </section>
        <section className="reveal-copy">
          <Wordmark compact />
          <h1 className="page-title">它有一点像你，<br/>但不打算承认。</h1>
          <p className="lede">观察型怪东西。会认真收藏杂音，并在必要时突然长出自己的意见。</p>
          <div className="field">
            <label htmlFor="avatar-name">给它改个名字</label>
            <input id="avatar-name" className="input" maxLength={12} value={name} onChange={(event) => setName(event.target.value)} />
            <span className="field-meta"><span>外观不能捏，名字可以改</span><span>{name.length}/12</span></span>
          </div>
          <button className="btn btn--primary" onClick={enterNest}>带它回巢穴 <ArrowRight size={19}/></button>
        </section>
      </main>
    );
  }

  return (
    <main className="create-screen">
      <header className="create-head">
        <Wordmark compact />
        <div className="create-progress" aria-label={`第 ${step + 1} 题，共 ${TOTAL_STEPS} 题`}>
          <span>{String(step + 1).padStart(2, "0")}</span>
          <div><i style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}/></div>
          <span>{String(TOTAL_STEPS).padStart(2, "0")}</span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.section
          key={step}
          className="question-stage"
          initial={{ opacity: 0, x: 26 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22 }}
        >
          <p className="eyebrow">QUESTION {String(step + 1).padStart(2, "0")}</p>
          {step < 3 && current ? (
            <>
              <h1 className="question-title">{current.prompt}</h1>
              <div className="choice-list">
                {current.options.map((option, index) => {
                  const selected = currentAnswer === option.id;
                  return (
                    <button key={option.id} className={`choice ${selected ? "is-selected" : ""}`} onClick={() => choose(current.id, option.id)} aria-pressed={selected}>
                      <span className={`choice__shape choice__shape--${index + 1}`} aria-hidden="true"/>
                      <span className="choice__copy"><strong>{option.label}</strong><small>{option.note}</small></span>
                      <span className="choice__check">{selected ? <Check size={20}/> : String.fromCharCode(65 + index)}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <h1 className="question-title">如果今天能偷偷留下一个东西，你会留什么？</h1>
              <div className="field free-answer">
                <label className="sr-only" htmlFor="free-answer">你的回答</label>
                <textarea id="free-answer" className="textarea" maxLength={60} autoFocus placeholder="一句话就好，不用写得正确。" value={freeText} onChange={(event) => setFreeText(event.target.value)} />
                <span className="field-meta"><span>回答会影响分身，但不会出现在公开分享里</span><span>{freeText.length}/60</span></span>
              </div>
            </>
          )}
        </motion.section>
      </AnimatePresence>

      <footer className="create-actions">
        <button className="btn btn--ghost" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}><ArrowLeft size={18}/>上一题</button>
        <button className="btn btn--primary" disabled={!canContinue} onClick={next}>
          {step === 3 ? <><Dices size={18}/>开始生成</> : <>下一题<ArrowRight size={18}/></>}
        </button>
      </footer>
    </main>
  );
}
