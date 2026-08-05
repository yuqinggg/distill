"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import MorphBlob from "@/components/MorphBlob";
import PaletteTreemap from "@/components/PaletteTreemap";
import { toMarkdown } from "@/lib/markdown-export";
import type { ExtractionResult } from "@/lib/types";

type Status = "idle" | "confirm" | "loading" | "error";
type Theme = "light" | "dark";
interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const enter =
  "transition-all duration-500 ease-out starting:opacity-0 starting:translate-y-3";

const EXPANDED_GAP = 16;

function CornerArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7M17 7H8M17 7V16" />
    </svg>
  );
}

function ThemeIcon({ theme }: { theme: Theme }) {
  return theme === "dark" ? (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 3v1.5M10 15.5V17M17 10h-1.5M4.5 10H3M14.6 5.4l-1.1 1.1M6.5 13.5l-1.1 1.1M14.6 14.6l-1.1-1.1M6.5 6.5 5.4 5.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path
        d="M17 11.3A7 7 0 0 1 8.7 3a7 7 0 1 0 8.3 8.3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const confirmCaptions = [
  "Looks good!",
  "Nice pick.",
  "That's interesting.",
  "Good eye.",
  "Love this one.",
  "Solid choice.",
];

export default function Home() {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [copiedVocab, setCopiedVocab] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [heroMounted, setHeroMounted] = useState(false);
  const [caption, setCaption] = useState("");
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [typedCaption, setTypedCaption] = useState("");
  const [cardsVisible, setCardsVisible] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [flightPhase, setFlightPhase] = useState<"start" | "end">("start");
  const [flyStart, setFlyStart] = useState<Rect | null>(null);
  const [flyEnd, setFlyEnd] = useState<Rect | null>(null);
  const [cardOverlaps, setCardOverlaps] = useState<number[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const captionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewImgRef = useRef<HTMLImageElement | null>(null);
  const settledContainerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (!result || isFlying) {
      const id = setTimeout(() => setCardsVisible(false), 0);
      return () => clearTimeout(id);
    }
    const id = requestAnimationFrame(() => setCardsVisible(true));
    return () => cancelAnimationFrame(id);
  }, [result, isFlying]);

  useLayoutEffect(() => {
    if (!cardsVisible) return;
    const PEEK = 120;
    function recompute() {
      const margins = cardRefs.current.slice(0, -1).map((el) => {
        const h = el?.getBoundingClientRect().height ?? 0;
        return -Math.max(h - PEEK, 0);
      });
      setCardOverlaps(margins);
    }
    recompute();
    const observer = new ResizeObserver(recompute);
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [cardsVisible]);

  useEffect(() => {
    if (expandedCard === null) return;
    function handlePointerDown(e: PointerEvent) {
      const expandedEl = cardRefs.current[expandedCard as number];
      if (expandedEl && !expandedEl.contains(e.target as Node)) {
        setExpandedCard(null);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [expandedCard]);

  useLayoutEffect(() => {
    if (!isFlying) return;
    const endEl = settledContainerRef.current;
    if (endEl) {
      const r = endEl.getBoundingClientRect();
      setFlyEnd({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
    setFlightPhase("start");
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setFlightPhase("end"));
    });
    const doneTimer = setTimeout(() => setIsFlying(false), 780);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(doneTimer);
    };
  }, [isFlying]);

  useEffect(() => {
    if (!previewLoaded || !caption) {
      const clearId = setTimeout(() => setTypedCaption(""), 0);
      return () => clearTimeout(clearId);
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTypedCaption(caption.slice(0, i));
      if (i >= caption.length) clearInterval(id);
    }, 35);
    return () => clearInterval(id);
  }, [previewLoaded, caption]);

  useEffect(() => {
    return () => {
      if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setHeroMounted(true));
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
    setTheme(next);
  }

  function selectFile(file: File) {
    if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewLoaded(false);
    setStatus("confirm");
    setCaption(
      confirmCaptions[Math.floor(Math.random() * confirmCaptions.length)]
    );
    setError(null);
    setResult(null);
    setMarkdown("");
    setCopied(false);
  }

  async function analyzeFile() {
    if (!pendingFile) return;
    setStatus("loading");
    setError(null);

    const formData = new FormData();
    formData.append("image", pendingFile);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Extraction failed.");
      }

      const rect = previewImgRef.current?.getBoundingClientRect();
      if (rect) {
        setFlyStart({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        setIsFlying(true);
      }
      setResult(data.result);
      setMarkdown(data.markdown);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  function removeStyleWord(word: string) {
    setResult((prev) => {
      if (!prev) return prev;
      const next: ExtractionResult = {
        ...prev,
        inferred: {
          ...prev.inferred,
          styleVocabulary: prev.inferred.styleVocabulary.filter(
            (w) => w !== word
          ),
        },
      };
      setMarkdown(toMarkdown(next));
      return next;
    });
  }

  function onPreviewImageLoad() {
    if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
    captionTimeoutRef.current = setTimeout(() => setPreviewLoaded(true), 500);
  }

  function resetToHero() {
    if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
    setPendingFile(null);
    setPreviewUrl(null);
    setPreviewLoaded(false);
    setStatus("idle");
    setError(null);
    setResult(null);
    setMarkdown("");
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
    setSheetOpen(false);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) selectFile(file);
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function copyVocabulary() {
    if (!result) return;
    await navigator.clipboard.writeText(
      result.inferred.styleVocabulary.join(", ")
    );
    setCopiedVocab(true);
    setTimeout(() => setCopiedVocab(false), 1500);
  }

  const heroSettled = result !== null;
  const showCenteredPreview = previewUrl !== null && !heroSettled;
  const showFloatingChooseButton = previewUrl !== null && status !== "confirm";

  const heroGradient =
    "linear-gradient(to bottom, transparent 0%, color-mix(in oklab, var(--background) 6%, transparent) 42%, color-mix(in oklab, var(--background) 22%, transparent) 60%, color-mix(in oklab, var(--background) 48%, transparent) 75%, color-mix(in oklab, var(--background) 78%, transparent) 88%, var(--background) 100%)";

  return (
    <div className="flex flex-1 flex-col items-center bg-background font-sans">
      {isFlying && flyStart && previewUrl && (
        <div
          className="pointer-events-none fixed z-[60] overflow-hidden transition-[top,left,width,height,border-radius,box-shadow] duration-700 ease-out"
          style={
            flightPhase === "end" && flyEnd
              ? {
                  top: flyEnd.top,
                  left: flyEnd.left,
                  width: flyEnd.width,
                  height: flyEnd.height,
                  borderRadius: 0,
                  boxShadow: "none",
                }
              : {
                  top: flyStart.top,
                  left: flyStart.left,
                  width: flyStart.width,
                  height: flyStart.height,
                  borderRadius: 24,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                }
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="h-full w-full object-contain" />
        </div>
      )}
      {heroSettled && previewUrl && (
        <div className="relative w-full">
          <div
            ref={settledContainerRef}
            className="relative h-[200px] w-full overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Uploaded preview"
              className="h-full w-full object-cover"
              style={{ opacity: isFlying ? 0 : 1 }}
            />
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out"
              style={{
                background: heroGradient,
                opacity: isFlying ? 0 : 1,
              }}
            />
          </div>
          <div
            className={`absolute inset-x-0 top-0 flex items-center justify-between px-6 py-6 transition-opacity duration-300 ease-out ${
              isFlying ? "opacity-0" : "opacity-100"
            }`}
          >
            <button
              type="button"
              onClick={resetToHero}
              aria-label="Return to home"
              title="Return to home"
              className="flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 backdrop-blur transition-colors hover:bg-background"
            >
              <Image
                src="/logo-icon.png"
                alt=""
                width={264}
                height={245}
                className="h-6 w-auto"
                priority
              />
              <span className="text-base font-medium tracking-tight text-logo">
                distill
              </span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:bg-background"
              >
                <ThemeIcon theme={theme} />
              </button>
            </div>
          </div>
        </div>
      )}
      <main
        className={`flex w-full flex-1 flex-col gap-8 px-6 py-16 ${
          heroSettled ? "max-w-none" : "max-w-2xl"
        } ${showFloatingChooseButton ? "pb-28" : ""}`}
      >
        {!heroSettled && (
          <div className="flex items-center justify-between">
            {status === "confirm" ? (
              <button
                onClick={resetToHero}
                aria-label="Back"
                title="Back"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-background"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M12.5 4.5 6 11l6.5 6.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={resetToHero}
                aria-label="Return to home"
                title="Return to home"
                className="flex items-center gap-1.5"
              >
                <Image
                  src="/logo-icon.png"
                  alt=""
                  width={264}
                  height={245}
                  className="h-6 w-auto"
                  priority
                />
                <span className="text-base font-medium tracking-tight text-logo">
                  distill
                </span>
              </button>
            )}
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-background"
            >
              <ThemeIcon theme={theme} />
            </button>
          </div>
        )}

        {!previewUrl && status === "idle" ? (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex flex-1 flex-col items-center justify-center gap-8 text-center"
          >
            <div className="relative flex flex-col items-center gap-3">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/25 blur-3xl" />
              <h1
                className={`relative text-4xl font-semibold tracking-tight text-foreground transition-all duration-1000 ease-out ${
                  heroMounted
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
              >
                What are you inspired by?
              </h1>
              <p
                className={`relative max-w-sm text-muted transition-all delay-300 duration-1000 ease-out ${
                  heroMounted
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
              >
                Share an image and we&apos;ll translate it into vocabulary
                for humans and for machines.
              </p>
            </div>

            <button
              onClick={() => setSheetOpen((open) => !open)}
              aria-label={sheetOpen ? "Close" : "Add an image"}
              title={sheetOpen ? "Close" : "Add an image"}
              className={`relative z-50 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-sm transition-all delay-500 duration-700 ease-out hover:scale-105 active:scale-90 ${
                heroMounted
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-4 scale-90 opacity-0"
              }`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 20 20"
                fill="none"
                className={`transition-transform duration-300 ease-out ${
                  sheetOpen ? "rotate-45" : "rotate-0"
                }`}
              >
                <path
                  d="M10 4v12M4 10h12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ) : showCenteredPreview ? (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`flex flex-1 flex-col items-center justify-center gap-5 overflow-hidden pb-28 ${enter}`}
          >
            {previewUrl && (
              <div className="relative mx-auto h-80 w-[calc(100%-3rem)] max-w-xl overflow-hidden rounded-3xl shadow-lg sm:h-96">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={previewImgRef}
                  src={previewUrl}
                  alt="Uploaded preview"
                  onLoad={onPreviewImageLoad}
                  className="h-full w-full object-contain"
                />
              </div>
            )}
            <div className="flex h-24 flex-col items-center justify-center">
              {status === "confirm" && caption && previewLoaded && (
                <p className="text-sm font-medium text-muted">
                  {typedCaption}
                  {typedCaption.length < caption.length && (
                    <span className="ml-0.5 inline-block h-3.5 w-[1px] animate-pulse bg-muted align-middle" />
                  )}
                </p>
              )}
              {status === "loading" && (
                <div
                  className={`flex flex-col items-center gap-3 text-sm text-muted ${enter}`}
                >
                  <MorphBlob size={56} />
                  Analyzing colors, typography, and layout…
                </div>
              )}
            </div>
          </div>
        ) : null}

        {error && (
          <p
            className={`rounded-2xl border border-border bg-card px-4 py-3 text-sm text-red-600 dark:text-red-400 ${enter}`}
          >
            {error}
          </p>
        )}

        {result && cardsVisible && (
          <section className="flex flex-col">
            <p className={`mb-3 text-center text-sm text-muted ${enter}`}>
              Tap cards to view details
            </p>
            <div
              ref={(el) => {
                cardRefs.current[0] = el;
              }}
              role="button"
              tabIndex={0}
              onClick={() =>
                setExpandedCard((prev) => (prev === 0 ? null : 0))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpandedCard((prev) => (prev === 0 ? null : 0));
                }
              }}
              className={`relative z-10 cursor-pointer rounded-3xl border border-border bg-card p-6 shadow-lg transition-shadow duration-300 ${
                expandedCard === 0 ? "shadow-2xl" : ""
              } ${enter}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[11px] uppercase leading-tight text-muted">
                  Style
                </span>
                <button
                  type="button"
                  onClick={copyVocabulary}
                  aria-label={copiedVocab ? "Copied" : "Copy vocabulary"}
                  title={copiedVocab ? "Copied" : "Copy vocabulary"}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
                >
                  <CornerArrowIcon
                    className={`h-4 w-4 transition-colors ${
                      copiedVocab ? "text-accent" : ""
                    }`}
                  />
                </button>
              </div>
              <p className="mt-4 flex flex-wrap items-baseline gap-x-1.5 gap-y-2 text-2xl font-semibold tracking-tight leading-snug text-foreground sm:text-3xl">
                {result.inferred.styleVocabulary.map((word) => (
                  <span key={word} className="inline-flex items-center gap-1">
                    <span>{word}</span>
                    <button
                      type="button"
                      onClick={() => removeStyleWord(word)}
                      aria-label={`Remove "${word}"`}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted opacity-40 transition-opacity hover:opacity-100 hover:text-foreground"
                    >
                      <svg
                        viewBox="0 0 12 12"
                        className="h-2.5 w-2.5"
                        fill="none"
                      >
                        <path
                          d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </p>
            </div>

            <div
              ref={(el) => {
                cardRefs.current[1] = el;
              }}
              role="button"
              tabIndex={0}
              onClick={() =>
                setExpandedCard((prev) => (prev === 1 ? null : 1))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpandedCard((prev) => (prev === 1 ? null : 1));
                }
              }}
              style={{
                marginTop: expandedCard === 0 ? EXPANDED_GAP : cardOverlaps[0],
                transition: "margin-top 300ms ease-out",
              }}
              className={`relative z-20 cursor-pointer overflow-hidden rounded-3xl border border-border shadow-lg transition-shadow duration-300 delay-100 ${
                expandedCard === 1 ? "shadow-2xl" : ""
              } ${enter}`}
            >
              <span className="absolute left-4 top-4 z-10 rounded-full bg-background/70 px-2 py-1 text-[11px] uppercase leading-tight text-foreground backdrop-blur">
                Colours
              </span>
              <PaletteTreemap palette={result.deterministic.palette} />
            </div>

            <div
              ref={(el) => {
                cardRefs.current[2] = el;
              }}
              role="button"
              tabIndex={0}
              onClick={() =>
                setExpandedCard((prev) => (prev === 2 ? null : 2))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpandedCard((prev) => (prev === 2 ? null : 2));
                }
              }}
              style={{
                marginTop: expandedCard === 1 ? EXPANDED_GAP : cardOverlaps[1],
                transition: "margin-top 300ms ease-out",
              }}
              className={`relative z-30 cursor-pointer rounded-3xl border border-border bg-[#1c1815] p-6 pt-14 shadow-lg transition-shadow duration-300 delay-200 dark:bg-black/40 ${
                expandedCard === 2 ? "shadow-2xl" : ""
              } ${enter}`}
            >
              <span className="absolute left-6 top-6 text-[11px] font-medium uppercase tracking-wide text-white/50">
                Markdown
              </span>
              <div className="absolute right-6 top-5 flex items-center gap-2">
                <CornerArrowIcon className="h-4 w-4 text-white/50" />
                <button
                  onClick={copyMarkdown}
                  className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground hover:opacity-90"
                >
                  {copied ? "Copied" : "Copy markdown"}
                </button>
              </div>
              <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words text-xs text-white/90">
                {markdown}
              </pre>
            </div>
          </section>
        )}
      </main>

      {showFloatingChooseButton && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-6">
          <label
            className={`cursor-pointer rounded-full border border-border bg-card/95 px-5 py-2.5 text-sm font-medium text-foreground shadow-lg backdrop-blur transition-colors hover:bg-background ${enter}`}
          >
            Choose a different image
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={onInputChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {status === "confirm" && (
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-2xl items-center justify-center gap-6 bg-background/95 px-6 pb-8 pt-4 backdrop-blur">
          <label
            aria-label="Try a different image"
            title="Try a different image"
            className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-background active:scale-[0.96]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M16 6.5A6.5 6.5 0 1 0 17 11"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M16 2.5v4.3h-4.3"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={onInputChange}
              className="hidden"
            />
          </label>
          <button
            onClick={analyzeFile}
            aria-label="Looks good, analyze it"
            title="Looks good, analyze it"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm transition-colors hover:opacity-90 active:scale-[0.96]"
          >
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 10.5 8 15l8-10.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {!previewUrl && (
        <>
          <div
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
            className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ease-out ${
              sheetOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          />
          <div
            className={`fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-2xl rounded-t-3xl border border-border bg-card p-3 pb-6 shadow-lg transition-transform duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
              sheetOpen ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
            <div className="divide-y divide-border overflow-hidden rounded-2xl">
              <label className="flex cursor-pointer items-center gap-4 p-5 transition-[background-color,transform] duration-150 hover:bg-background/60 active:scale-[0.98]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M2.5 6.5A1.5 1.5 0 0 1 4 5h1.5l.8-1.2a1 1 0 0 1 .84-.45h5.72a1 1 0 0 1 .84.45L14.5 5H16a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 15H4a1.5 1.5 0 0 1-1.5-1.5v-7Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="10"
                      cy="10"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </span>
                <span className="flex-1">
                  <span className="block font-medium text-foreground">
                    Take a photo
                  </span>
                  <span className="block text-sm text-muted">
                    Snap something that caught your eye
                  </span>
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  className="shrink-0 text-muted"
                >
                  <path
                    d="M6.5 3.5 12 9l-5.5 5.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  capture="environment"
                  onChange={onInputChange}
                  className="hidden"
                />
              </label>

              <label className="flex cursor-pointer items-center gap-4 p-5 transition-[background-color,transform] duration-150 hover:bg-background/60 active:scale-[0.98]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect
                      x="2.5"
                      y="3.5"
                      width="15"
                      height="13"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <circle cx="7" cy="8" r="1.25" fill="currentColor" />
                    <path
                      d="M3 14.5 7.5 10l2.5 2.5 2-2 4.5 4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="flex-1">
                  <span className="block font-medium text-foreground">
                    Upload image
                  </span>
                  <span className="block text-sm text-muted">
                    Pull something from your camera roll
                  </span>
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  className="shrink-0 text-muted"
                >
                  <path
                    d="M6.5 3.5 12 9l-5.5 5.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={onInputChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
