"use client";

import { useState } from "react";
import type { ExtractionResult } from "@/lib/types";

type Status = "idle" | "loading" | "error";

export default function Home() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const [copied, setCopied] = useState(false);

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
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Distill
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Upload an editorial layout or a UI screenshot. Get back structured
            design tokens and style vocabulary as a paste-ready markdown file.
          </p>
        </header>

        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-950"
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Uploaded preview"
              className="max-h-64 rounded object-contain"
            />
          ) : (
            <p className="text-sm text-zinc-500">
              Drag and drop an image, or choose a file below.
            </p>
          )}
          <label className="cursor-pointer rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]">
            Choose image
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={onInputChange}
              className="hidden"
            />
          </label>
        </div>

        {status === "loading" && (
          <p className="text-sm text-zinc-500">
            Analyzing colors, typography, and layout…
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {result && (
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              {result.deterministic.palette.map((c) => (
                <div key={c.role} className="flex flex-col items-center gap-1">
                  <div
                    className="h-12 w-12 rounded-full border border-black/10 dark:border-white/10"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-xs text-zinc-500">{c.role}</span>
                  <span className="text-xs text-zinc-400">{c.hex}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {result.inferred.styleVocabulary.map((word) => (
                <span
                  key={word}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {word}
                </span>
              ))}
            </div>

            <div className="relative">
              <button
                onClick={copyMarkdown}
                className="absolute right-2 top-2 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
              >
                {copied ? "Copied" : "Copy markdown"}
              </button>
              <pre className="max-h-96 overflow-auto rounded-lg bg-zinc-900 p-4 pt-12 text-xs text-zinc-100">
                {markdown}
              </pre>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
