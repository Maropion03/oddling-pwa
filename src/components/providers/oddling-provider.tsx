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
} from "@/lib/domain/types";

const STORAGE_KEY = "oddling:state:v1";
const VISITOR_KEY = "oddling:visitor:v1";

interface OddlingContextValue {
  state: AppState;
  hydrated: boolean;
  cloudConfigured: boolean;
  today: string;
  todayEntry: DailyEntry | null;
  todayQuestion: DailyQuestion | null;
  createAvatar: (input: OnboardingInput) => void;
  rebuildAvatar: (input: OnboardingInput) => boolean;
  renameAvatar: (name: string) => void;
  rerollQuestion: () => boolean;
  submitDailyAnswer: (answer: string) => DailyEntry;
  makeShare: () => ShareRecord;
  findShare: (shareId: string) => ShareRecord | null;
  interactWithShare: (shareId: string, action: GuestAction) => GuestInteraction | null;
  setTheme: (theme: AppState["theme"]) => void;
  exportState: () => string;
  deleteAllData: () => void;
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

export function OddlingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => typeof window === "undefined" ? EMPTY_STATE : readState());
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const today = localDate();
  const cloudConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

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

  const createAvatar = useCallback((input: OnboardingInput) => {
    const avatar = generateAvatar(input);
    setState({ ...EMPTY_STATE, avatar, theme: state.theme });
  }, [state.theme]);

  const rebuildAvatar = useCallback((input: OnboardingInput) => {
    if (!state.avatar || state.avatar.rebuildUsed) return false;
    const age = Date.now() - new Date(state.avatar.createdAt).getTime();
    if (age > 24 * 60 * 60 * 1000) return false;
    const avatar = { ...generateAvatar(input), rebuildUsed: true };
    setState({ ...EMPTY_STATE, avatar, theme: state.theme });
    return true;
  }, [state.avatar, state.theme]);

  const renameAvatar = useCallback((name: string) => {
    const clean = name.trim().slice(0, 12);
    if (!clean) return;
    setState((current) => current.avatar
      ? { ...current, avatar: { ...current.avatar, name: clean } }
      : current);
  }, []);

  const rerollQuestion = useCallback(() => {
    if (!state.avatar || !todayQuestion || state.rerolls[today] || todayEntry) return false;
    const replacement = selectDailyQuestion({
      avatarSeed: state.avatar.seed,
      date: today,
      history: state.questionHistory,
      excludeId: todayQuestion.id,
    });
    setState((current) => ({ ...current, rerolls: { ...current.rerolls, [today]: replacement.id } }));
    return true;
  }, [state.avatar, state.questionHistory, state.rerolls, today, todayEntry, todayQuestion]);

  const submitDailyAnswer = useCallback((answer: string) => {
    if (!state.avatar || !todayQuestion) throw new Error("Avatar or daily question is missing");
    const existing = state.entries.find((entry) => entry.date === today);
    if (existing) return existing;
    const result = createDailyResult({ avatar: state.avatar, question: todayQuestion, answer, date: today });
    setState((current) => ({
      ...current,
      avatar: result.avatar,
      entries: [...current.entries, result.entry],
      mutations: [...current.mutations, result.entry.mutation],
      stickers: [...current.stickers, result.entry.sticker],
      questionHistory: [...current.questionHistory, { date: today, questionId: todayQuestion.id }],
    }));
    return result.entry;
  }, [state.avatar, state.entries, today, todayQuestion]);

  const makeShare = useCallback(() => {
    if (!state.avatar) throw new Error("Avatar is missing");
    const share = createShare(state.avatar, state.stickers.at(-1) ?? null);
    setState((current) => ({ ...current, shares: [...current.shares, share] }));
    return share;
  }, [state.avatar, state.stickers]);

  const findShare = useCallback((shareId: string) =>
    state.shares.find((share) => share.id === shareId) ?? null,
  [state.shares]);

  const interactWithShare = useCallback((shareId: string, action: GuestAction) => {
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
  }, []);

  const exportState = useCallback(() => JSON.stringify({
    exportedAt: new Date().toISOString(),
    product: "Oddling",
    data: state,
  }, null, 2), [state]);

  const deleteAllData = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setState(EMPTY_STATE);
  }, []);

  const value = useMemo<OddlingContextValue>(() => ({
    state,
    hydrated,
    cloudConfigured,
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
  }), [
    state, hydrated, cloudConfigured, today, todayEntry, todayQuestion, createAvatar, rebuildAvatar,
    renameAvatar, rerollQuestion, submitDailyAnswer, makeShare, findShare, interactWithShare,
    setTheme, exportState, deleteAllData,
  ]);

  return <OddlingContext.Provider value={value}>{children}</OddlingContext.Provider>;
}

export function useOddling(): OddlingContextValue {
  const context = useContext(OddlingContext);
  if (!context) throw new Error("useOddling must be used within OddlingProvider");
  return context;
}
