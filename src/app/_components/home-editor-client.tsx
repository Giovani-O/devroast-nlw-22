"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { Toggle } from "@/components/ui/toggle";

const MAX_SNIPPET = 1000;

export function HomeEditorClient() {
  const [code, setCode] = useState("");
  const [_lang, setLang] = useState("plaintext");

  return (
    <>
      <div className="flex flex-col justify-end w-full max-w-[780px] items-center">
        {/* Code Editor Area */}
        <div className="w-full max-w-[780px] bg-bg-input border border-border-primary rounded-none overflow-hidden flex flex-col">
          {/* Window Header */}
          <div
            className="bg-bg-input border-b border-border-primary px-4 flex items-center gap-2"
            style={{ height: "40px" }}
          >
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
          </div>

          {/* Code Content Area */}
          <CodeEditor
            maxLength={MAX_SNIPPET}
            onChange={(c, l) => {
              setCode(c);
              setLang(l);
            }}
          />
        </div>

        {/* Character counter (right-justified) */}
        <div className="mt-0.5 ml-auto">
          <div className="flex justify-end">
            <span
              className={
                code.length > MAX_SNIPPET
                  ? "font-mono text-accent-red tabular-nums"
                  : "font-mono text-text-tertiary tabular-nums"
              }
              style={{ fontSize: "12px" }}
            >
              {code.length}/{MAX_SNIPPET}
            </span>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="w-full max-w-[780px] flex items-center justify-between">
        {/* Left Side - Toggle + Text */}
        <div className="flex items-center gap-2.5">
          <Toggle aria-label="Toggle roast mode" />
          <span
            className="font-mono text-text-secondary"
            style={{ fontSize: "13px" }}
          >
            roast mode
          </span>
        </div>

        {/* Right Side - Submit Button */}
        <Button
          variant="default"
          rounded="none"
          className="font-mono"
          style={{ fontSize: "13px", padding: "10px 24px" }}
          disabled={code.length > MAX_SNIPPET}
        >
          $ roast_my_code
        </Button>
      </div>
    </>
  );
}
