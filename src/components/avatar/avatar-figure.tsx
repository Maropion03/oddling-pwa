"use client";

import { motion } from "motion/react";
import { clsx } from "clsx";
import type { CSSProperties } from "react";
import type { AvatarParts } from "@/lib/domain/types";

const AVATAR_COLORS = {
  coral: "#ff6f59",
  blue: "#2b59c3",
  yellow: "#f3cb42",
  green: "#d2ff45",
  cream: "#f3eedc",
  ink: "#202124",
} as const;

const BODY_PATHS: Record<string, string> = {
  bean: "M76 50C111 20 176 30 194 81C214 136 192 207 130 218C75 228 32 185 39 126C43 91 51 70 76 50Z",
  pear: "M119 28C151 27 168 65 169 91C201 112 212 165 185 201C157 238 89 232 55 202C19 170 35 112 71 91C76 58 90 29 119 28Z",
  cloud: "M72 85C72 47 105 25 137 40C164 22 201 45 197 78C225 93 223 135 197 150C207 188 174 218 139 203C111 230 69 211 68 178C29 171 25 119 58 103C58 96 62 90 72 85Z",
  drop: "M124 24C124 24 199 105 197 158C195 211 157 229 120 227C75 224 42 199 45 155C49 105 124 24 124 24Z",
  pebble: "M57 67C82 35 153 27 186 58C219 90 217 178 178 207C139 236 69 219 43 184C18 151 29 103 57 67Z",
};

function SketchyFilter() {
  return (
    <defs>
      <filter id="sketchy" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
      </filter>
    </defs>
  );
}

function Eyes({ token, animated }: { token: string; animated?: boolean }) {
  const eyeContent = (() => {
    if (token === "sleepy") return <><path d="M82 116Q96 126 110 116"/><path d="M144 116Q158 126 172 116"/></>;
    if (token === "wide") return <><circle cx="96" cy="118" r="13"/><circle cx="158" cy="118" r="13"/></>;
    if (token === "spark") return <><path d="M95 104L99 114L109 118L99 122L95 132L91 122L81 118L91 114Z"/><circle cx="158" cy="118" r="7"/></>;
    if (token === "side") return <><circle cx="101" cy="118" r="7"/><circle cx="163" cy="118" r="7"/></>;
    if (token === "mismatch") return <><circle cx="96" cy="118" r="9"/><path d="M145 118Q158 105 172 118Q158 132 145 118Z"/></>;
    if (token === "line") return <><path d="M84 118H108"/><path d="M146 118H170"/></>;
    if (token === "moon") return <><path d="M105 105A14 14 0 1 0 105 131A10 14 0 1 1 105 105Z"/><circle cx="158" cy="118" r="7"/></>;
    return <><circle cx="96" cy="118" r="7"/><circle cx="158" cy="118" r="7"/></>;
  })();

  return (
    <motion.g
      animate={animated ? {
        scaleY: [1, 1, 0.1, 1, 1],
      } : undefined}
      transition={{
        duration: 4,
        repeat: Infinity,
        repeatDelay: 1,
        times: [0, 0.85, 0.9, 0.95, 1],
      }}
      style={{ transformOrigin: "127px 118px" }}
    >
      {eyeContent}
    </motion.g>
  );
}

function Mouth({ token, animated }: { token: string; animated?: boolean }) {
  const mouthContent = (() => {
    if (token === "smile") return <path d="M111 157Q127 172 144 157"/>;
    if (token === "o") return <circle cx="127" cy="160" r="9"/>;
    if (token === "fang") return <path d="M111 154Q127 169 145 154M137 159L141 169L146 158"/>;
    if (token === "wave") return <path d="M108 160Q118 150 127 160Q136 170 147 159"/>;
    if (token === "tiny") return <path d="M122 160H133"/>;
    return <path d="M113 160H142"/>;
  })();

  return (
    <motion.g
      animate={animated ? { scale: [1, 1.05, 1] } : undefined}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "127px 160px" }}
    >
      {mouthContent}
    </motion.g>
  );
}

function HeadPart({ token, animated }: { token: string | null; animated?: boolean }) {
  if (!token) return null;

  const headContent = (() => {
    if (token === "sprout") return <g><path d="M127 51C120 28 127 16 136 8"/><path className="avatar-fill--green" fill={AVATAR_COLORS.green} d="M136 8C157 6 165 17 151 29C136 28 130 20 136 8Z"/></g>;
    if (token === "antenna") return <g><path d="M127 50L137 13"/><circle className="avatar-fill--yellow" fill={AVATAR_COLORS.yellow} cx="138" cy="10" r="8"/></g>;
    if (token === "paper-crown") return <path className="avatar-fill--yellow" fill={AVATAR_COLORS.yellow} d="M93 55L91 24L112 39L128 16L143 39L166 25L162 58Z"/>;
    if (token === "tiny-cloud") return <path className="avatar-fill--cream" fill={AVATAR_COLORS.cream} d="M99 47C99 32 112 26 122 32C133 17 156 27 154 42C170 43 170 60 158 64H102C88 61 89 48 99 47Z"/>;
    if (token === "ribbon") return <g className="avatar-fill--blue" fill={AVATAR_COLORS.blue}><path d="M122 52C101 48 94 31 104 23C116 21 125 31 127 44Z"/><path d="M129 45C135 27 151 20 160 29C160 42 148 52 131 53Z"/><circle cx="128" cy="48" r="8"/></g>;
    return <g><path d="M128 51L128 20"/><path className="avatar-fill--blue" fill={AVATAR_COLORS.blue} d="M115 17H143L137 5H121Z"/></g>;
  })();

  const wiggle = (() => {
    if (token === "antenna") return { rotate: [0, 5, -5, 0] };
    if (token === "sprout") return { rotate: [0, 3, -3, 0], y: [0, -2, 0] };
    return { rotate: [0, 2, -2, 0] };
  })();

  const duration = token === "antenna" ? 2 : token === "sprout" ? 2.5 : 3;

  return (
    <motion.g
      animate={animated ? wiggle : undefined}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "127px 50px" }}
    >
      {headContent}
    </motion.g>
  );
}

function BackPart({ token }: { token: string | null }) {
  if (!token) return null;
  if (token === "wings") return <g className="avatar-fill--blue" fill={AVATAR_COLORS.blue}><path d="M55 111C22 88 5 121 32 143C9 153 25 182 58 166Z"/><path d="M192 111C225 88 242 121 215 143C238 153 222 182 189 166Z"/></g>;
  if (token === "shell") return <path className="avatar-fill--yellow" fill={AVATAR_COLORS.yellow} d="M178 102C224 100 229 171 189 188C170 169 168 128 178 102Z"/>;
  if (token === "flag") return <g><path d="M188 85L213 43"/><path className="avatar-fill--blue" fill={AVATAR_COLORS.blue} d="M211 43L239 54L219 69Z"/></g>;
  if (token === "tail") return <path className="avatar-fill--coral" fill={AVATAR_COLORS.coral} d="M187 174C232 163 237 204 212 212C223 196 211 187 188 193Z"/>;
  if (token === "shadow") return <path className="avatar-fill--ink" fill={AVATAR_COLORS.ink} opacity=".18" d="M176 89C224 104 231 188 177 206C194 168 195 127 176 89Z"/>;
  return <path className="avatar-fill--blue" fill={AVATAR_COLORS.blue} d="M185 99L224 126L187 144Z"/>;
}

function Texture({ token, index }: { token: string; index: number }) {
  const shift = index * 14;
  if (token === "freckles") return <g><circle cx={103 + shift} cy="140" r="3"/><circle cx={113 + shift} cy="145" r="2"/><circle cx={94 + shift} cy="147" r="2"/></g>;
  if (token === "stripes") return <g><path d={`M80 ${170 + shift / 3}Q125 ${150 + shift / 3} 175 ${170 + shift / 3}`}/><path d={`M77 ${183 + shift / 3}Q125 ${163 + shift / 3} 178 ${183 + shift / 3}`}/></g>;
  if (token === "dots") return <g><circle cx={90 + shift} cy="177" r="5"/><circle cx={120 + shift} cy="188" r="4"/><circle cx={155 - shift} cy="172" r="3"/></g>;
  if (token === "patch") return <path className="avatar-fill--cream" fill={AVATAR_COLORS.cream} d={`M${82 + shift} 166L${111 + shift} 160L${115 + shift} 187L${87 + shift} 191Z`}/>;
  if (token === "stars") return <path className="avatar-fill--yellow" fill={AVATAR_COLORS.yellow} d={`M${100 + shift} 162L${104 + shift} 172L${115 + shift} 174L${106 + shift} 181L${109 + shift} 192L${100 + shift} 186L${91 + shift} 192L${94 + shift} 181L${85 + shift} 174L${96 + shift} 172Z`}/>;
  return <path d={`M${83 + shift} 176Q${95 + shift} 161 ${107 + shift} 176Q${119 + shift} 191 ${131 + shift} 176`}/>;
}

function Handheld({ token }: { token: string | null }) {
  if (!token) return null;
  return <g transform="translate(0 6)"><path d="M64 174L35 204"/><circle className="avatar-fill--yellow" fill={AVATAR_COLORS.yellow} cx="31" cy="209" r="12"/><path d="M55 178Q68 166 79 177"/></g>;
}

export function AvatarFigure({
  parts,
  name,
  size = "large",
  animated = true,
  className,
}: {
  parts: AvatarParts;
  name: string;
  size?: "small" | "medium" | "large";
  animated?: boolean;
  className?: string;
}) {
  const bodyColor = {
    coral: AVATAR_COLORS.coral,
    blue: AVATAR_COLORS.blue,
    yellow: AVATAR_COLORS.yellow,
    green: AVATAR_COLORS.green,
    violet: "#A984E8",
  }[parts.color ?? "coral"];
  return (
    <motion.div
      className={clsx("avatar-figure", `avatar-figure--${size}`, className)}
      style={{ "--avatar-body": bodyColor } as CSSProperties}
      initial={animated ? { opacity: 0, y: 18, rotate: -2 } : false}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 16 }}
      role="img"
      aria-label={`${name} 的怪可爱分身`}
    >
      <svg viewBox="0 0 250 250" aria-hidden="true" focusable="false">
        <SketchyFilter />
        <g className="avatar-line avatar-back" filter="url(#sketchy)">
          <BackPart token={parts.back} />
        </g>
        <motion.g
          className="avatar-line"
          animate={animated ? { y: [0, -4, 0] } : undefined}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <path className="avatar-body" fill={bodyColor} d={BODY_PATHS[parts.body] ?? BODY_PATHS.bean}/>
          <g className="avatar-texture">{parts.textures.map((token, index) => <Texture key={token} token={token} index={index}/>)}</g>
          <Eyes token={parts.eyes} animated={animated} />
          <Mouth token={parts.mouth} animated={animated} />
          <HeadPart token={parts.head} animated={animated} />
          <Handheld token={parts.handheld} />
        </motion.g>
      </svg>
    </motion.div>
  );
}
