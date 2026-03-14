# Code Editor with Syntax Highlighting — Specification

## Project Context

- **Project**: DevRoast — Code Analysis Platform
- **Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Target component**: `src/components/ui/code-block.tsx`
- **Used in**: `src/app/page.tsx` — the `/* Code Content Area */` block (lines 52–75)

---

## Overview

The user needs a code editor area on the homepage where they can:
1. Paste or type code
2. See syntax highlighting applied in real time
3. Benefit from automatic language detection (triggered on paste)

The editor must match the existing dark terminal aesthetic (macOS window chrome, line numbers, monospace fonts, dark background).

---

## Confirmed Decisions

| Question | Decision |
|---|---|
| Language auto-detection | Yes — use `highlight.js` on paste events |
| Language select dropdown | No — omitted for now |
| Shiki theme | `"vesper"` (same as existing `code-block.tsx`) |
| Line/character limit | None |
| Tab size | 2 spaces |
| Scroll behaviour | Fixed height + internal scroll |
| Code persistence | Yes — save to `localStorage` |

---

## Research: Implementation Options

### Option 1 — Shiki + Textarea Overlay (ray-so approach) ✅ Chosen

**How it works:**
This is the same technique used by [ray.so](https://github.com/raycast/ray-so). A transparent `<textarea>` sits on top of a syntax-highlighted `<div>`. The textarea captures all input; the overlay div renders shiki's HTML output. Both elements are scrolled and sized identically, creating the illusion of an editable highlighted code block.

```
┌─ Editor div ───────────────────────────────────┐
│  ┌─ HighlightedCode (div, pointer-events:none) │
│  │   <pre><code> ... shiki tokens ... </code>  │
│  └─────────────────────────────────────────────│
│  ┌─ <textarea> (transparent, z-index above)    │
│  │   raw user text, caret visible              │
│  └─────────────────────────────────────────────│
└────────────────────────────────────────────────┘
```

**Key implementation details from ray-so:**
- `Editor.tsx`: handles keyboard events (Tab indent, Shift+Tab dedent, Enter with auto-indent, `}` dedent), change handler, focus behaviour
- `HighlightedCode.tsx`: runs shiki's `highlighter.codeToHtml()` inside a `useEffect`, updates `highlightedHtml` state, renders via `dangerouslySetInnerHTML`
- Language is loaded lazily: `highlighter.loadLanguage(lang)` called only when needed
- Global `Highlighter` instance stored in `useRef`, initialised once on mount

**shiki v4 client-side API:**
```ts
import { createHighlighter } from "shiki";

const highlighter = await createHighlighter({
  themes: ["vesper"],
  langs: [],           // load lazily on demand
});

// Per render (inside useEffect + debounce):
await highlighter.loadLanguage(detectedLang); // no-op if already loaded
const html = highlighter.codeToHtml(code, { lang: detectedLang, theme: "vesper" });
```

---

### Auto-detection: highlight.js `highlightAuto`

highlight.js is added **solely for language detection**. It is not used for rendering — shiki handles that. This way we get the best of both:
- highlight.js's battle-tested heuristic detection (`highlightAuto`)
- shiki's high-quality token-based rendering with the vesper theme

**highlight.js `highlightAuto` API:**
```ts
import hljs from "highlight.js/lib/common"; // ~35 common languages, tree-shakeable

const result = hljs.highlightAuto(code, SUPPORTED_LANG_NAMES);
// result.language  → detected language name (e.g. "javascript")
// result.relevance → confidence score (integer; higher = more confident)
// result.secondBest.language → runner-up language
```

**Detection trigger strategy:**
- Fire on `paste` event (most common user action)
- Re-fire on `change` when code exceeds 20 characters and has grown by ≥50% since last detection (handles users who type code from scratch)
- Do **not** run on every keystroke

**Confidence threshold:**
- If `relevance >= 5`: trust the detected language
- If `relevance < 5`: fall back to `"plaintext"` (no highlighting)
- The threshold avoids false positives on very short snippets

**Language name mapping (hljs → shiki):**

Most names are identical. One important exception:

| hljs returns | shiki key to use |
|---|---|
| `javascript` | `javascript` |
| `typescript` | `typescript` |
| `python` | `python` |
| `rust` | `rust` |
| `go` | `go` |
| `java` | `java` |
| `c` | `c` |
| `cpp` | `cpp` |
| `csharp` | `csharp` |
| `php` | `php` |
| `ruby` | `ruby` |
| `swift` | `swift` |
| `kotlin` | `kotlin` |
| `bash` | `bash` |
| `xml` ← hljs calls HTML "xml" | `html` |
| `css` | `css` |
| `sql` | `sql` |
| `json` | `json` |
| `yaml` | `yaml` |
| `markdown` | `markdown` |
| `plaintext` | `plaintext` |

**Known limitations of auto-detection:**
- Unreliable for snippets under ~5 lines
- TypeScript often detected as JavaScript (both are valid — JS highlighting works fine on TS)
- Plain prose / pseudocode may produce false positives → relevance threshold mitigates this
- No detection for very niche languages → graceful fallback to `plaintext`

**Bundle size impact:**
- `highlight.js/lib/common`: ~35 languages, ~50 KB minified. We import only the core + the 20 languages in our curated list, which trims this further.

---

### Discarded options

| Option | Reason rejected |
|---|---|
| CodeMirror 6 | ~500 KB extra bundle; overkill for paste-and-roast UX |
| react-simple-code-editor | Same textarea pattern but adds a dependency; easier to build custom |
| Monaco Editor | ~4 MB; conflicts with minimal terminal aesthetic |

---

## Architecture

### New files

```
src/components/ui/
├── code-editor.tsx        ← new client component (main deliverable)
└── code-block.tsx         ← existing server component, untouched
```

### Component structure

```
CodeEditor (client component, "use client")
│
├── useRef: highlighterRef (shiki Highlighter instance)
├── state: code           (string, persisted to localStorage)
├── state: detectedLang   (string, default "plaintext")
├── state: highlightedHtml (string)
├── state: isHighlighterReady (boolean)
│
├── onMount:
│   └── createHighlighter({ themes: ["vesper"], langs: [] })
│       → store in highlighterRef, set isHighlighterReady = true
│
├── onPaste:
│   └── hljs.highlightAuto(pastedText, SUPPORTED_LANGS)
│       → if relevance >= 5: setDetectedLang(mapped lang)
│       → else: setDetectedLang("plaintext")
│
├── useEffect [code, detectedLang]:
│   └── debounce 150ms
│       → highlighterRef.loadLanguage(detectedLang) [lazy]
│       → setHighlightedHtml(highlighter.codeToHtml(...))
│
├── onChange: setCode + persist to localStorage
├── onKeyDown: Tab (indent 2sp), Shift+Tab (dedent), Enter (auto-indent)
│
├── <div class="editor-root" style="position:relative; overflow:hidden">
│   ├── Line numbers column (dynamic, from code.split('\n').length)
│   ├── <div class="scroll-area" style="overflow-y:auto; height:320px">
│   │   ├── <div class="overlay" dangerouslySetInnerHTML={highlightedHtml}
│   │   │     style="pointer-events:none; position:absolute" />
│   │   └── <textarea style="color:transparent; background:transparent;
│   │                        caret-color: accent-green; position:relative" />
│   └── (optional) detected lang badge in bottom-right corner
└──
```

### Props interface

```ts
export interface CodeEditorProps {
  onChange?: (code: string, language: string) => void;
  className?: string;
}
```

The component is self-contained (owns `code` state internally) and exposes `onChange` for the parent (`page.tsx`) to receive the current code + detected language for the submit action.

### Integration in `page.tsx`

Replace lines 52–75 (`/* Code Content Area */`) with:

```tsx
<CodeEditor onChange={(code, lang) => { setCode(code); setLang(lang); }} />
```

The Window Header (traffic lights, line 42–50) and Actions Bar (roast mode toggle + submit button) remain unchanged.

### `code-block.tsx` relationship

The existing `CodeBlock` is a **server component** used for display (leaderboard entries). `CodeEditor` is a **client component** for input. Both use the `"vesper"` theme, but are fully separate. `CodeBlock` remains untouched.

---

## Implementation Plan

### Phase 1 — Core editor component

- [ ] Install `highlight.js` as a dependency
- [ ] Create `src/components/ui/code-editor.tsx`
  - `"use client"` directive
  - Initialise shiki `createHighlighter` on mount (`useEffect` with empty deps), store in `useRef`
  - Restore code from `localStorage` on mount (key: `"devroast_code"`)
  - `<textarea>` with `onChange`, `onKeyDown`, `onPaste`
  - Debounced `useEffect` (150ms) to run `highlighter.codeToHtml()` and update `highlightedHtml`
  - Persist code to `localStorage` on change
  - Placeholder shown when code is empty

### Phase 2 — Line numbers

- [ ] Dynamic line number column
  - Count: `code.split('\n').length`
  - Synced scroll with the editor scroll area
  - Styled: `font-mono`, `text-text-tertiary`, `text-[12px]`, `w-[48px]`, right-aligned, `bg-bg-surface`, `border-r border-border-primary`

### Phase 3 — Auto-detection

- [ ] Add `onPaste` handler
  - `e.clipboardData.getData('text')` → `hljs.highlightAuto(text, SUPPORTED_LANG_NAMES)`
  - Map result to shiki language key using the mapping table above
  - Apply `relevance >= 5` threshold
  - Set `detectedLang` state

### Phase 4 — CSS overlay sync

- [ ] Ensure pixel-perfect sync between textarea and overlay:
  - Identical `font-family` (JetBrains Mono), `font-size` (14px), `line-height`, `padding` (16px)
  - `white-space: pre` on both
  - `overflow: hidden` on both (scroll handled by parent wrapper)
  - `caret-color` set to `var(--color-accent-green)` on textarea

### Phase 5 — Page integration

- [ ] Update `src/app/page.tsx`
  - Replace `/* Code Content Area */` block (lines 52–75) with `<CodeEditor>`
  - Add `code` and `lang` state to page for the submit action
  - Wire `CodeEditor`'s `onChange` to page state

### Phase 6 — Polish (nice-to-have)

- [ ] Small detected-language badge in the editor (e.g. `// javascript` shown in bottom-right, styled as `text-text-tertiary font-mono text-[11px]`)
- [ ] Smooth transition when highlighting updates (no flicker on language switch)

---

## Supported Languages (curated list)

| Display Name | shiki lang key | hljs equivalent |
|---|---|---|
| JavaScript | `javascript` | `javascript` |
| TypeScript | `typescript` | `typescript` |
| Python | `python` | `python` |
| Rust | `rust` | `rust` |
| Go | `go` | `go` |
| Java | `java` | `java` |
| C | `c` | `c` |
| C++ | `cpp` | `cpp` |
| C# | `csharp` | `csharp` |
| PHP | `php` | `php` |
| Ruby | `ruby` | `ruby` |
| Swift | `swift` | `swift` |
| Kotlin | `kotlin` | `kotlin` |
| Shell / Bash | `bash` | `bash` |
| HTML | `html` | `xml` ← map needed |
| CSS | `css` | `css` |
| SQL | `sql` | `sql` |
| JSON | `json` | `json` |
| YAML | `yaml` | `yaml` |
| Markdown | `markdown` | `markdown` |
| Plain Text | `plaintext` | `plaintext` |

---

## References

- ray-so Editor.tsx: https://github.com/raycast/ray-so/blob/main/app/(navigation)/(code)/components/Editor.tsx
- ray-so HighlightedCode.tsx: https://github.com/raycast/ray-so/blob/main/app/(navigation)/(code)/components/HighlightedCode.tsx
- highlight.js API docs: https://highlightjs.readthedocs.io/en/latest/api.html#highlightauto
- shiki createHighlighter: https://shiki.style/guide/install
- Existing `code-block.tsx`: `src/components/ui/code-block.tsx`
- Integration target: `src/app/page.tsx` lines 52–75
