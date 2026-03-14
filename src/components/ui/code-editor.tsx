"use client";

import hljs from "highlight.js/lib/common";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import {
  type BundledLanguage,
  type BundledTheme,
  createHighlighter,
  type HighlighterGeneric,
} from "shiki/bundle/web";
import { cn } from "./utils";

// Supported languages: shiki key → hljs equivalent
const HLJS_TO_SHIKI: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  rust: "rust",
  go: "go",
  java: "java",
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  php: "php",
  ruby: "ruby",
  swift: "swift",
  kotlin: "kotlin",
  bash: "bash",
  xml: "html", // hljs calls HTML "xml"
  css: "css",
  sql: "sql",
  json: "json",
  yaml: "yaml",
  markdown: "markdown",
  plaintext: "plaintext",
};

const SUPPORTED_LANG_NAMES = Object.keys(HLJS_TO_SHIKI);

// Shared styles for both the textarea and the overlay div — must be pixel-perfect identical
const EDITOR_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "14px",
  lineHeight: "1.6",
  padding: "16px",
  margin: 0,
  border: "none",
  outline: "none",
  whiteSpace: "pre",
  overflowWrap: "normal",
  wordBreak: "normal",
  tabSize: 2,
  MozTabSize: 2,
};

export interface CodeEditorProps {
  onChange?: (code: string, language: string) => void;
  className?: string;
  maxLength?: number;
}

/**
 * CodeEditor — editable code area with real-time shiki syntax highlighting.
 *
 * Uses the textarea-overlay technique: a transparent <textarea> sits on top of
 * a shiki-highlighted <div>. highlight.js is used only for language detection
 * (on paste events and significant text growth); shiki renders the final HTML.
 */
const HIGHLIGHT_DEBOUNCE = 50; // ms

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function makeRawHtml(code: string) {
  // Minimal fallback HTML (unhighlighted) shown immediately while shiki runs
  return `<pre class="language-plaintext"><code>${escapeHtml(code)}</code></pre>`;
}

export const CodeEditor = forwardRef<HTMLDivElement, CodeEditorProps>(
  ({ onChange, className, maxLength }, ref) => {
    const [code, setCode] = useState<string>("");
    const [detectedLang, setDetectedLang] = useState<string>("plaintext");
    const [highlightedHtml, setHighlightedHtml] = useState<string>("");
    const [isHighlighterReady, setIsHighlighterReady] = useState(false);

    const highlighterRef = useRef<HighlighterGeneric<
      BundledLanguage,
      BundledTheme
    > | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const lineNumsRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastDetectionLengthRef = useRef<number>(0);

    const detectLanguage = useCallback((text: string) => {
      // very short text is noisy; keep as plaintext
      if (text.trim().length < 3) {
        setDetectedLang("plaintext");
        return;
      }

      // Quick heuristics for JS/TS/React to avoid short- snippet misclassification
      const hasUseState = /\buseState\s*\(/.test(text);
      const hasReactImport =
        /from\s+["']react["']/.test(text) || /import\s+React\b/.test(text);
      const hasJsx =
        /<\/?[A-Za-z][\w-]*/.test(text) && /\/.+>/.test(text) === false
          ? /<\w+/.test(text)
          : /<\/?[A-Za-z][\w-]*/.test(text);
      const hasTsTokens = /\b(interface|type|implements|enum|:\s*\w+)/.test(
        text,
      );

      if (hasUseState || hasReactImport || hasJsx) {
        // Prefer TypeScript when we see TS tokens, otherwise prefer TypeScript per preference
        setDetectedLang(hasTsTokens ? "typescript" : "typescript");
        lastDetectionLengthRef.current = text.length;
        return;
      }

      // Let highlight.js inspect only the supported languages (faster + fewer false positives)
      const result = hljs.highlightAuto(text, SUPPORTED_LANG_NAMES);
      const hljsLang = result.language;

      if (!hljsLang) {
        setDetectedLang("plaintext");
        return;
      }

      // Map hljs name -> shiki name when possible
      const shikiLang =
        HLJS_TO_SHIKI[hljsLang] ?? (hljsLang === "html" ? "html" : undefined);

      if (shikiLang) {
        // If heuristic suggests TypeScript but hljs returned javascript, prefer typescript
        if (shikiLang === "javascript" && hasTsTokens) {
          setDetectedLang("typescript");
        } else {
          setDetectedLang(shikiLang);
        }
      } else {
        setDetectedLang("plaintext");
      }

      lastDetectionLengthRef.current = text.length;
    }, []);

    // Re-highlight whenever code or language changes (debounced 150ms)
    // Also re-run language detection after highlighting so the language badge
    // reflects the most recent content.
    useEffect(() => {
      if (!isHighlighterReady || !highlighterRef.current) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        const highlighter = highlighterRef.current;
        if (!highlighter) return;

        const lang = detectedLang === "plaintext" ? "plaintext" : detectedLang;

        try {
          await highlighter.loadLanguage(
            lang as Parameters<typeof highlighter.loadLanguage>[0],
          );
        } catch {
          // Language not available in bundle — fall back to plaintext
          try {
            await highlighter.loadLanguage("plaintext");
          } catch {
            // ignore
          }
          const html = highlighter.codeToHtml(code, {
            lang: "plaintext",
            theme: "vesper",
          });
          setHighlightedHtml(html);
          return;
        }

        const html = highlighter.codeToHtml(code, { lang, theme: "vesper" });
        setHighlightedHtml(html);

        // Run a detection pass after highlighting so the language badge updates
        // along with the rendered output. This is debounced together with
        // highlighting to avoid excessive hljs calls.
        try {
          detectLanguage(code);
        } catch {
          // ignore detection errors
        }
      }, HIGHLIGHT_DEBOUNCE);

      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }, [code, detectedLang, isHighlighterReady, detectLanguage]);

    // Detect language from text using highlight.js (defined above)

    // Initialise shiki on mount
    useEffect(() => {
      let cancelled = false;
      createHighlighter({ themes: ["vesper"], langs: [] }).then((h) => {
        if (!cancelled) {
          highlighterRef.current = h;
          setIsHighlighterReady(true);
          // Detect language for current code (if any)
          if (code && code.trim().length >= 5) detectLanguage(code);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [detectLanguage, code]);

    // Show raw (escaped) code immediately whenever `code` changes so user sees typed/pasted text
    useEffect(() => {
      setHighlightedHtml(makeRawHtml(code));
    }, [code]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        let newCode = e.target.value;
        if (typeof maxLength === "number")
          newCode = newCode.slice(0, maxLength);
        setCode(newCode);
        // Show raw text immediately to eliminate perceived input lag
        setHighlightedHtml(makeRawHtml(newCode));
        onChange?.(newCode, detectedLang);

        // Re-detect on significant growth (≥20 chars and ≥50% growth since last detection)
        const prev = lastDetectionLengthRef.current;
        if (
          newCode.length >= 20 &&
          (prev === 0 || newCode.length >= prev * 1.5)
        ) {
          detectLanguage(newCode);
        }
      },
      [detectedLang, onChange, detectLanguage, maxLength],
    );

    const handlePaste = useCallback(
      (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pasted = e.clipboardData.getData("text");
        if (!pasted) return;
        // Intercept paste so we can update the raw overlay immediately (prevent default to avoid double-insert)
        e.preventDefault();
        const ta = textareaRef.current;
        if (!ta) {
          // fallback: run detection on pasted text
          setTimeout(() => detectLanguage(pasted), 0);
          return;
        }
        const { selectionStart, selectionEnd, value } = ta;
        let newCode =
          value.slice(0, selectionStart) + pasted + value.slice(selectionEnd);
        if (typeof maxLength === "number") {
          // trim pasted content to available space
          const available = Math.max(
            0,
            maxLength - (value.length - (selectionEnd - selectionStart)),
          );
          if (pasted.length > available) {
            const clipped = pasted.slice(0, available);
            newCode =
              value.slice(0, selectionStart) +
              clipped +
              value.slice(selectionEnd);
          }
          newCode = newCode.slice(0, maxLength);
        }
        setCode(newCode);
        // Show raw immediately
        setHighlightedHtml(makeRawHtml(newCode));
        // move cursor after pasted content
        requestAnimationFrame(() => {
          const pos = Math.min(
            selectionStart + pasted.length,
            maxLength ?? selectionStart + pasted.length,
          );
          ta.selectionStart = pos;
          ta.selectionEnd = pos;
        });
        onChange?.(newCode, detectedLang);
        // run detection async
        setTimeout(() => detectLanguage(newCode), 0);
      },
      [detectLanguage, onChange, detectedLang, maxLength],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;
        const { selectionStart, selectionEnd, value } = textarea;

        if (e.key === "Tab") {
          e.preventDefault();
          if (e.shiftKey) {
            // Shift+Tab: dedent — remove up to 2 leading spaces on the current line
            const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
            const lineText = value.slice(lineStart);
            const spaces = Math.min(2, lineText.match(/^ */)?.[0].length ?? 0);
            if (spaces > 0) {
              let newValue =
                value.slice(0, lineStart) + value.slice(lineStart + spaces);
              if (typeof maxLength === "number")
                newValue = newValue.slice(0, maxLength);
              setCode(newValue);
              // Restore cursor position after React re-render
              requestAnimationFrame(() => {
                textarea.selectionStart = selectionStart - spaces;
                textarea.selectionEnd = selectionEnd - spaces;
              });
            }
          } else {
            // Tab: insert 2 spaces
            let newValue = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
            if (typeof maxLength === "number")
              newValue = newValue.slice(0, maxLength);
            setCode(newValue);
            requestAnimationFrame(() => {
              const pos = Math.min(
                selectionStart + 2,
                maxLength ?? selectionStart + 2,
              );
              textarea.selectionStart = pos;
              textarea.selectionEnd = pos;
            });
          }
        } else if (e.key === "Enter") {
          e.preventDefault();
          // Auto-indent: match leading whitespace of current line
          const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
          const leading = value.slice(lineStart).match(/^[ \t]*/)?.[0] ?? "";
          let newValue =
            value.slice(0, selectionStart) +
            "\n" +
            leading +
            value.slice(selectionEnd);
          if (typeof maxLength === "number")
            newValue = newValue.slice(0, maxLength);
          setCode(newValue);
          requestAnimationFrame(() => {
            const pos = Math.min(
              selectionStart + 1 + leading.length,
              maxLength ?? selectionStart + 1 + leading.length,
            );
            textarea.selectionStart = pos;
            textarea.selectionEnd = pos;
          });
        }
      },
      [maxLength],
    );

    // Sync scroll between textarea, overlay, and line numbers
    const handleScroll = useCallback(() => {
      const ta = textareaRef.current;
      const sa = scrollAreaRef.current;
      const ln = lineNumsRef.current;
      if (!ta || !sa || !ln) return;
      sa.scrollTop = ta.scrollTop;
      sa.scrollLeft = ta.scrollLeft;
      ln.scrollTop = ta.scrollTop;
    }, []);

    const lineCount = code.split("\n").length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

    return (
      <div
        ref={ref}
        className={cn("flex min-h-[320px] max-h-[360px]", className)}
      >
        {/* Line Numbers */}
        <div
          ref={lineNumsRef}
          className="bg-bg-surface border-r border-border-primary py-4 font-mono text-text-tertiary flex flex-col items-end overflow-hidden flex-shrink-0"
          style={{
            width: "48px",
            fontSize: "12px",
            lineHeight: "1.6",
            paddingLeft: "8px",
            paddingRight: "8px",
            userSelect: "none",
          }}
        >
          {lineNumbers.map((n) => (
            <span
              key={n}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                lineHeight: "1.6",
                height: "calc(14px * 1.6)",
                display: "block",
              }}
            >
              {n}
            </span>
          ))}
        </div>

        {/* Editor: overlay + textarea stacked */}
        <div className="flex-1 relative overflow-hidden bg-bg-input">
          {/* Scroll container — only this scrolls */}
          <div
            ref={scrollAreaRef}
            className="absolute inset-0 overflow-auto"
            style={{ pointerEvents: "none" }}
          >
            {/* Shiki highlighted overlay */}
            {highlightedHtml ? (
              <div
                // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki outputs pre-escaped HTML
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                className="shiki-overlay"
                style={{
                  ...EDITOR_STYLE,
                  minWidth: "100%",
                  minHeight: "100%",
                  boxSizing: "border-box",
                }}
              />
            ) : (
              /* Placeholder shown before highlighter is ready or when empty */
              <div
                style={{
                  ...EDITOR_STYLE,
                  color: "var(--color-text-tertiary)",
                  minWidth: "100%",
                  minHeight: "100%",
                  boxSizing: "border-box",
                }}
              >
                {code === "" ? "// paste your code here" : ""}
              </div>
            )}
          </div>

          {/* Transparent textarea — captures all input */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleChange}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck={false}
            suppressHydrationWarning
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            className="absolute inset-0 w-full h-full resize-none bg-transparent border-none outline-none"
            style={{
              ...EDITOR_STYLE,
              color: "transparent",
              caretColor: "var(--color-accent-green)",
              overflowX: "auto",
              overflowY: "auto",
              boxSizing: "border-box",
            }}
          />

          {/* Language badge */}
          {detectedLang !== "plaintext" && (
            <div
              className="absolute bottom-2 right-3 font-mono text-text-tertiary pointer-events-none select-none"
              style={{ fontSize: "11px" }}
            >
              {detectedLang}
            </div>
          )}
        </div>
      </div>
    );
  },
);

CodeEditor.displayName = "CodeEditor";
