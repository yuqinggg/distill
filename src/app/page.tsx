"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import MorphBlob from "@/components/MorphBlob";
import type { ExtractionResult } from "@/lib/types";

type Status = "idle" | "confirm" | "loading" | "error";
type Theme = "light" | "dark";

const enter =
  "transition-all duration-500 ease-out starting:opacity-0 starting:translate-y-3";

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
  const [theme, setTheme] = useState<Theme>("light");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [heroMounted, setHeroMounted] = useState(false);
  const [caption, setCaption] = useState("");

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
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
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

      setResult(data.result);
      setMarkdown(data.markdown);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  function resetToHero() {
    setPendingFile(null);
    setPreviewUrl(null);
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

  return (
    <div className="flex flex-1 flex-col items-center bg-background font-sans">
      <main className="flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
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
            <div className="flex items-center gap-1.5">
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
            </div>
          )}
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-background"
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 3v1.5M10 15.5V17M17 10h-1.5M4.5 10H3M14.6 5.4l-1.1 1.1M6.5 13.5l-1.1 1.1M14.6 14.6l-1.1-1.1M6.5 6.5 5.4 5.4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="3.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
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
            )}
          </button>
        </div>

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
        ) : status === "confirm" ? (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`flex flex-1 flex-col items-center justify-center gap-3 overflow-hidden pb-28 ${enter}`}
          >
            {previewUrl && (
              <div className="relative max-h-full max-w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Uploaded preview"
                  className="block max-h-full min-h-48 min-w-48 max-w-full rounded-3xl object-contain shadow-sm"
                />
              </div>
            )}
            {caption && (
              <p className="text-sm font-medium text-muted">{caption}</p>
            )}
          </div>
        ) : (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`flex flex-col items-center gap-5 rounded-3xl border border-border bg-card p-10 text-center shadow-sm ${enter}`}
          >
            {previewUrl && (
              <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-accent/15 via-card to-card">
                <span className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-muted backdrop-blur">
                  Uploaded image
                </span>
                <button
                  onClick={resetToHero}
                  aria-label="Back"
                  title="Back"
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:bg-background"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M5 5l10 10M15 5 5 15"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Uploaded preview"
                  className="max-h-72 w-full object-contain"
                />
              </div>
            )}
            <label className="cursor-pointer rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background">
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

        {status === "loading" && (
          <div
            className={`flex flex-col items-center gap-3 self-center text-sm text-muted ${enter}`}
          >
            <MorphBlob size={56} />
            Analyzing colors, typography, and layout…
          </div>
        )}

        {error && (
          <p
            className={`rounded-2xl border border-border bg-card px-4 py-3 text-sm text-red-600 dark:text-red-400 ${enter}`}
          >
            {error}
          </p>
        )}

        {result && (
          <section className="flex flex-col gap-6">
            <div className={`rounded-3xl border border-border bg-card p-6 shadow-sm ${enter}`}>
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                Palette
              </span>
              <div className="mt-4 flex flex-wrap gap-4">
                {result.deterministic.palette.map((c) => (
                  <div
                    key={c.role}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="h-11 w-11 rounded-full border border-border shadow-sm"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-xs text-foreground">{c.role}</span>
                    <span className="text-xs text-muted">{c.hex}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`rounded-3xl border border-border bg-card p-6 shadow-sm delay-100 ${enter}`}
            >
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                Style vocabulary
              </span>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.inferred.styleVocabulary.map((word) => (
                  <span
                    key={word}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <div
              className={`relative rounded-3xl border border-border bg-[#1c1815] p-6 pt-14 shadow-sm delay-200 dark:bg-black/40 ${enter}`}
            >
              <span className="absolute left-6 top-6 text-[11px] font-medium uppercase tracking-wide text-white/50">
                Markdown
              </span>
              <button
                onClick={copyMarkdown}
                className="absolute right-6 top-5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground hover:opacity-90"
              >
                {copied ? "Copied" : "Copy markdown"}
              </button>
              <pre className="max-h-96 overflow-auto text-xs text-white/90">
                {markdown}
              </pre>
            </div>
          </section>
        )}
      </main>

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
