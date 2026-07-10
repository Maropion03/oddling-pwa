"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  createDailyResult,
  createGuestInteraction,
  createShare,
  generateAvatar,
  localDate,
  selectDailyQuestion,
} from "@/lib/domain/engine";
import { DAILY_QUESTIONS } from "@/lib/domain/questions";
import {
  EMPTY_STATE,
  type AppState,
  type DailyEntry,
  type DailyQuestion,
  type GuestAction,
  type GuestInteraction,
  type OnboardingInput,
  type ShareRecord,
  type Avatar,
} from "@/lib/domain/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const STORAGE_KEY = "oddling:state:v1";
const VISITOR_KEY = "oddling:visitor:v1";

interface OddlingContextValue {
  state: AppState;
  hydrated: boolean;
  cloudConfigured: boolean;
  cloudStatus: "local" | "connecting" | "synced" | "error";
  cloudError: string | null;
  today: string;
  todayEntry: DailyEntry | null;
  todayQuestion: DailyQuestion | null;
  createAvatar: (input: OnboardingInput) => Promise<Avatar>;
  rebuildAvatar: (input: OnboardingInput) => Promise<boolean>;
  renameAvatar: (name: string) => Promise<void>;
  rerollQuestion: () => Promise<boolean>;
  submitDailyAnswer: (answer: string) => Promise<DailyEntry>;
  makeShare: () => Promise<ShareRecord>;
  findShare: (shareId: string) => ShareRecord | null;
  interactWithShare: (shareId: string, action: GuestAction) => Promise<GuestInteraction | null>;
  setTheme: (theme: AppState["theme"]) => void;
  exportState: () => string;
  deleteAllData: () => Promise<void>;
  linkEmail: (email: string) => Promise<void>;
}

const OddlingContext = createContext<OddlingContextValue | null>(null);
const subscribeToHydration = () => () => undefined;

function readState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (parsed.version !== 1) return EMPTY_STATE;
    return { ...EMPTY_STATE, ...parsed };
  } catch {
    return EMPTY_STATE;
  }
}

function getVisitorId(): string {
  const current = window.localStorage.getItem(VISITOR_KEY);
  if (current) return current;
  const created = crypto.randomUUID();
  window.localStorage.setItem(VISITOR_KEY, created);
  return created;
}

async function ensureCloudUser() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("云端服务尚未配置");
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (data.user) return supabase;
  const anonymous = await supabase.auth.signInAnonymously();
  if (anonymous.error) throw anonymous.error;
  return supabase;
}

async function cloudRequest<T>(path: string, init?: RequestInit): Promise<T> {
  await ensureCloudUser();
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "云端请求失败" })) as { error?: string };
    throw new Error(body.error ?? "云端请求失败");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function OddlingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => typeof window === "undefined" ? EMPTY_STATE : readState());
  const [cloudStatus, setCloudStatus] = useState<OddlingContextValue["cloudStatus"]>("local");
  const [cloudError, setCloudError] = useState<string | null>(null);
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const today = localDate();
  const cloudConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  const markCloudError = useCallback((error: unknown) => {
    setCloudStatus("error");
    setCloudError(error instanceof Error ? error.message : "云端同步失败");
  }, []);

  useEffect(() => {
    if (!cloudConfigured) return;
    let cancelled = false;
    void (async () => {
      try {
        setCloudStatus("connecting");
        await ensureCloudUser();
        const response = await fetch("/api/account/state", { cache: "no-store" });
        if (!response.ok) throw new Error("无法恢复云端数据");
        const body = await response.json() as { state: AppState };
        if (!cancelled && body.state.avatar) setState(body.state);
        if (!cancelled) {
          setCloudStatus("synced");
          setCloudError(null);
        }
      } catch (error) {
        if (!cancelled) markCloudError(error);
      }
    })();
    return () => { cancelled = true; };
  }, [cloudConfigured, markCloudError]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const resolvedTheme = state.theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : state.theme;
    document.documentElement.dataset.theme = resolvedTheme;
  }, [hydrated, state]);

  const todayEntry = state.entries.find((entry) => entry.date === today) ?? null;
  const activeQuestionId = state.rerolls[today];
  const todayQuestion = useMemo(() => {
    if (!state.avatar) return null;
    if (todayEntry) return DAILY_QUESTIONS.find((question) => question.id === todayEntry.questionId) ?? null;
    if (activeQuestionId) return DAILY_QUESTIONS.find((question) => question.id === activeQuestionId) ?? null;
    return selectDailyQuestion({
      avatarSeed: state.avatar.seed,
      date: today,
      history: state.questionHistory,
    });
  }, [activeQuestionId, state.avatar, state.questionHistory, today, todayEntry]);

  const createAvatar = useCallback(async (input: OnboardingInput) => {
    let avatar = generateAvatar(input);
    if (cloudConfigured) {
      try {
        const body = await cloudRequest<{ avatar: Avatar }>("/api/avatar/create", { method: "POST", body: JSON.stringify(input) });
        avatar = body.avatar;
        setCloudStatus("synced"); setCloudError(null);
      } catch (error) {
        markCloudError(error); throw error;
      }
    }
    setState({ ...EMPTY_STATE, avatar, theme: state.theme });
    return avatar;
  }, [cloudConfigured, markCloudError, state.theme]);

  const rebuildAvatar = useCallback(async (input: OnboardingInput) => {
    if (!state.avatar || state.avatar.rebuildUsed) return false;
    const age = Date.now() - new Date(state.avatar.createdAt).getTime();
    if (age > 24 * 60 * 60 * 1000) return false;
    let avatar = { ...generateAvatar(input), rebuildUsed: true };
    if (cloudConfigured) {
      try {
        const body = await cloudRequest<{ avatar: Avatar }>("/api/avatar/create", { method: "POST", body: JSON.stringify({ ...input, rebuild: true }) });
        avatar = body.avatar;
        setCloudStatus("synced"); setCloudError(null);
      } catch (error) {
        markCloudError(error); throw error;
      }
    }
    setState({ ...EMPTY_STATE, avatar, theme: state.theme });
    return true;
  }, [cloudConfigured, markCloudError, state.avatar, state.theme]);

  const renameAvatar = useCallback(async (name: string) => {
    const clean = name.trim().slice(0, 12);
    if (!clean) return;
    if (cloudConfigured) {
      try {
        await cloudRequest("/api/avatar/rename", { method: "PATCH", body: JSON.stringify({ name: clean }) });
        setCloudStatus("synced"); setCloudError(null);
      } catch (error) {
        markCloudError(error); throw error;
      }
    }
    setState((current) => current.avatar
      ? { ...current, avatar: { ...current.avatar, name: clean } }
      : current);
  }, [cloudConfigured, markCloudError]);

  const rerollQuestion = useCallback(async () => {
    if (!state.avatar || !todayQuestion || state.rerolls[today] || todayEntry) return false;
    let replacement = selectDailyQuestion({ avatarSeed: state.avatar.seed, date: today, history: state.questionHistory, excludeId: todayQuestion.id });
    if (cloudConfigured) {
      try {
        const body = await cloudRequest<{ question: DailyQuestion }>("/api/daily/reroll", {
          method: "POST",
          body: JSON.stringify({ date: today, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, currentQuestionId: todayQuestion.id }),
        });
        replacement = body.question;
        setCloudStatus("synced"); setCloudError(null);
      } catch (error) {
        markCloudError(error); throw error;
      }
    }
    setState((current) => ({ ...current, rerolls: { ...current.rerolls, [today]: replacement.id } }));
    return true;
  }, [cloudConfigured, markCloudError, state.avatar, state.questionHistory, state.rerolls, today, todayEntry, todayQuestion]);

  const submitDailyAnswer = useCallback(async (answer: string) => {
    if (!state.avatar || !todayQuestion) throw new Error("Avatar or daily question is missing");
    const existing = state.entries.find((entry) => entry.date === today);
    if (existing) return existing;
    let result = createDailyResult({ avatar: state.avatar, question: todayQuestion, answer, date: today });
    if (cloudConfigured) {
      try {
        const body = await cloudRequest<{ avatar: Avatar; entry: DailyEntry }>("/api/daily/respond", {
          method: "POST",
          body: JSON.stringify({ date: today, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, questionId: todayQuestion.id, answer }),
        });
        result = { avatar: body.avatar, entry: body.entry };
        setCloudStatus("synced"); setCloudError(null);
      } catch (error) {
        markCloudError(error); throw error;
      }
    }
    setState((current) => ({
      ...current,
      avatar: result.avatar,
      entries: [...current.entries, result.entry],
      mutations: [...current.mutations, result.entry.mutation],
      stickers: [...current.stickers, result.entry.sticker],
      questionHistory: [...current.questionHistory, { date: today, questionId: todayQuestion.id }],
    }));
    return result.entry;
  }, [cloudConfigured, markCloudError, state.avatar, state.entries, today, todayQuestion]);

  const makeShare = useCallback(async () => {
    if (!state.avatar) throw new Error("Avatar is missing");
    let share = createShare(state.avatar, state.stickers.at(-1) ?? null);
    if (cloudConfigured) {
      try {
        const body = await cloudRequest<{ token: string; snapshot: ShareRecord["snapshot"] }>("/api/shares", { method: "POST", body: "{}" });
        share = { id: body.token, snapshot: body.snapshot, createdAt: new Date().toISOString() };
        setCloudStatus("synced"); setCloudError(null);
      } catch (error) {
        markCloudError(error); throw error;
      }
    }
    setState((current) => ({ ...current, shares: [...current.shares, share] }));
    return share;
  }, [cloudConfigured, markCloudError, state.avatar, state.stickers]);

  const findShare = useCallback((shareId: string) =>
    state.shares.find((share) => share.id === shareId) ?? null,
  [state.shares]);

  const interactWithShare = useCallback(async (shareId: string, action: GuestAction) => {
    const share = state.shares.find((item) => item.id === shareId);
    if (!share) return null;
    const visitorId = getVisitorId();
    const existing = state.guestInteractions.find(
      (interaction) => interaction.shareId === shareId && interaction.visitorId === visitorId,
    );
    if (existing) return existing;
    const interaction = createGuestInteraction({ share, visitorId, action });
    setState((current) => ({
      ...current,
      guestInteractions: [...current.guestInteractions, interaction],
      stickers: [...current.stickers, interaction.sticker],
    }));
    return interaction;
  }, [state.guestInteractions, state.shares]);

  const setTheme = useCallback((theme: AppState["theme"]) => {
    setState((current) => ({ ...current, theme }));
    if (cloudConfigured) {
      const supabase = createSupabaseBrowserClient();
      void supabase?.from("profiles").update({ theme }).then(({ error }) => { if (error) markCloudError(error); });
    }
  }, [cloudConfigured, markCloudError]);

  const exportState = useCallback(() => JSON.stringify({
    exportedAt: new Date().toISOString(),
    product: "Oddling",
    data: state,
  }, null, 2), [state]);

  const deleteAllData = useCallback(async () => {
    if (cloudConfigured) {
      try {
        await cloudRequest("/api/account", { method: "DELETE" });
        const supabase = createSupabaseBrowserClient();
        await supabase?.auth.signOut();
      } catch (error) {
        markCloudError(error); throw error;
      }
    }
    window.localStorage.removeItem(STORAGE_KEY);
    setState(EMPTY_STATE);
  }, [cloudConfigured, markCloudError]);

  const linkEmail = useCallback(async (email: string) => {
    if (!cloudConfigured) throw new Error("云端服务尚未配置");
    const supabase = await ensureCloudUser();
    const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: `${window.location.origin}/auth/confirm?next=/me` });
    if (error) { markCloudError(error); throw error; }
    setCloudStatus("synced"); setCloudError(null);
  }, [cloudConfigured, markCloudError]);

  const value = useMemo<OddlingContextValue>(() => ({
    state,
    hydrated,
    cloudConfigured,
    cloudStatus,
    cloudError,
    today,
    todayEntry,
    todayQuestion,
    createAvatar,
    rebuildAvatar,
    renameAvatar,
    rerollQuestion,
    submitDailyAnswer,
    makeShare,
    findShare,
    interactWithShare,
    setTheme,
    exportState,
    deleteAllData,
    linkEmail,
  }), [
    state, hydrated, cloudConfigured, cloudStatus, cloudError, today, todayEntry, todayQuestion, createAvatar, rebuildAvatar,
    renameAvatar, rerollQuestion, submitDailyAnswer, makeShare, findShare, interactWithShare,
    setTheme, exportState, deleteAllData, linkEmail,
  ]);

  return <OddlingContext.Provider value={value}>{children}</OddlingContext.Provider>;
}

export function useOddling(): OddlingContextValue {
  const context = useContext(OddlingContext);
  if (!context) throw new Error("useOddling must be used within OddlingProvider");
  return context;
}
