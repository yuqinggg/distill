"use client";

import { useEffect, useState } from "react";
import type { ExtractionResult } from "@/lib/types";

type Status = "idle" | "loading" | "error";
type Theme = "light" | "dark";

const enter =
  "transition-all duration-500 ease-out starting:opacity-0 starting:translate-y-3";

export default function Home() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
    setTheme(next);
  }

  async function handleFile(file: File) {
    setStatus("loading");
    setError(null);
    setResult(null);
    setMarkdown("");
    setCopied(false);
    setPreviewUrl(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("image", file);

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

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
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
          <div className="flex items-center gap-1.5 text-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 7 Q12 10 19 7 Q12 4.3 5 7 Z" />
              <path d="M7.3 13 Q12 15.3 16.7 13 Q12 11 7.3 13 Z" />
              <circle cx="12" cy="18.3" r="1.7" />
            </svg>
            <span className="text-base font-medium tracking-tight">
              distill
            </span>
          </div>
          <button
            onClick={toggleTheme}
            aria-label="Toggle light mode"
            className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-background"
          >
            {theme === "dark" ? (
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
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
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path
                  d="M17 11.3A7 7 0 0 1 8.7 3a7 7 0 1 0 8.3 8.3Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>

        {!previewUrl && status === "idle" ? (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`flex flex-1 flex-col justify-center gap-10 ${enter}`}
          >
            <div className="relative flex flex-col gap-3">
              <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
              <h1 className="relative text-4xl font-semibold tracking-tight text-foreground">
                What are you inspired by?
              </h1>
              <p className="relative text-muted">
                Upload an editorial layout or a UI screenshot. Get back
                structured design tokens and style vocabulary as a
                paste-ready markdown file.
              </p>
            </div>

            <div
              className={`divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-sm delay-100 ${enter}`}
            >
              <label className="flex cursor-pointer items-center gap-4 p-5 transition-[background-color,transform] duration-150 hover:bg-background/60 active:scale-[0.98]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
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
                    Point your camera at a layout or design
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
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
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
                    Choose a screenshot or file from your device
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Uploaded preview"
                  className="max-h-72 w-full object-contain"
                />
              </div>
            )}
            <label className="cursor-pointer rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90">
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
          <div className={`flex items-center gap-2.5 text-sm text-muted ${enter}`}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="none"
              className="animate-spin text-accent"
            >
              <circle
                cx="10"
                cy="10"
                r="7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeOpacity="0.2"
              />
              <path
                d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
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
    </div>
  );
}
