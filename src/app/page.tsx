"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { Toggle } from "@/components/ui/toggle";

export default function Home() {
  const [_code, setCode] = useState("");
  const [_lang, setLang] = useState("plaintext");

  return (
    <div className="w-full flex flex-col items-center gap-8">
      {/* Hero Section */}
      <div className="w-full max-w-[780px] flex flex-col gap-3 mx-auto">
        {/* Title */}
        <div className="flex items-center justify-center gap-3">
          <span
            className="font-mono font-bold text-accent-green"
            style={{ fontSize: "36px" }}
          >
            $
          </span>
          <span
            className="font-mono font-bold text-text-primary"
            style={{ fontSize: "36px" }}
          >
            paste your code. get roasted.
          </span>
        </div>

        {/* Subtitle */}
        <div
          className="font-secondary text-text-secondary text-center"
          style={{ fontSize: "14px" }}
        >
          {
            "// drop your code below and we'll rate it — brutally honest or full roast mode"
          }
        </div>
      </div>

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
          onChange={(c, l) => {
            setCode(c);
            setLang(l);
          }}
        />
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
        >
          $ roast_my_code
        </Button>
      </div>

      {/* Footer Stats */}
      <div
        className="flex items-center gap-6 justify-center font-secondary text-text-tertiary"
        style={{ fontSize: "12px" }}
      >
        <span>2,847 codes roasted</span>
        <span>·</span>
        <span>avg score: 4.2/10</span>
      </div>

      {/* Spacer */}
      <div style={{ height: "60px" }} />

      {/* Leaderboard Preview Section */}
      <div className="w-full max-w-[960px] flex flex-col gap-6">
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="font-mono font-bold text-accent-green"
              style={{ fontSize: "14px" }}
            >
              {"//"}
            </span>
            <span
              className="font-mono font-bold text-text-primary"
              style={{ fontSize: "14px" }}
            >
              shame_leaderboard
            </span>
          </div>
          <Link
            href="/leaderboard"
            className="border border-border-primary font-mono text-text-secondary hover:text-text-primary transition-colors"
            style={{ fontSize: "12px", padding: "6px 12px" }}
          >
            $ view_all &gt;&gt;
          </Link>
        </div>

        {/* Subtitle */}
        <div
          className="font-secondary text-text-tertiary"
          style={{ fontSize: "13px" }}
        >
          {"// the worst code on the internet, ranked by shame"}
        </div>

        {/* Leaderboard Table */}
        <div className="w-full border border-border-primary overflow-hidden">
          {/* Table Header */}
          <div
            className="bg-bg-surface border-b border-border-primary flex items-center"
            style={{ fontSize: "12px", height: "40px", padding: "0 20px" }}
          >
            <span
              className="font-mono text-text-tertiary flex-shrink-0"
              style={{ width: "50px" }}
            >
              #
            </span>
            <span
              className="font-mono text-text-tertiary flex-shrink-0"
              style={{ width: "70px" }}
            >
              score
            </span>
            <span className="font-mono text-text-tertiary flex-1">code</span>
            <span
              className="font-mono text-text-tertiary flex-shrink-0"
              style={{ width: "100px" }}
            >
              lang
            </span>
          </div>

          {/* Table Row 1 */}
          <div
            className="border-b border-border-primary flex items-start hover:bg-bg-surface transition-colors"
            style={{ fontSize: "12px", padding: "16px 20px" }}
          >
            <span
              className="font-mono text-accent-amber flex-shrink-0"
              style={{ width: "50px" }}
            >
              1
            </span>
            <span
              className="font-mono text-accent-red font-bold flex-shrink-0"
              style={{ width: "70px" }}
            >
              1.2
            </span>
            <div className="flex-1 flex flex-col gap-0.5">
              <span className="font-mono text-text-primary">
                {`eval(prompt("enter code"))`}
              </span>
              <span className="font-mono text-text-primary">
                document.write(response)
              </span>
              <span className="font-mono text-gray-500">
                {"// trust the user lol"}
              </span>
            </div>
            <span
              className="font-mono text-text-secondary flex-shrink-0"
              style={{ width: "100px" }}
            >
              javascript
            </span>
          </div>

          {/* Table Row 2 */}
          <div
            className="border-b border-border-primary flex items-center hover:bg-bg-surface transition-colors"
            style={{ fontSize: "12px", padding: "16px 20px" }}
          >
            <span
              className="font-mono text-text-secondary flex-shrink-0"
              style={{ width: "50px" }}
            >
              2
            </span>
            <span
              className="font-mono text-red-500 flex-shrink-0"
              style={{ width: "70px" }}
            >
              1.2/10
            </span>
            <span className="font-mono text-text-primary flex-1">
              {`var x = y = z = 0;`}
            </span>
            <span
              className="font-mono text-text-secondary flex-shrink-0"
              style={{ width: "100px" }}
            >
              javascript
            </span>
          </div>

          {/* Table Row 3 */}
          <div
            className="border-b border-border-primary flex items-center hover:bg-bg-surface transition-colors"
            style={{ fontSize: "12px", padding: "16px 20px" }}
          >
            <span
              className="font-mono text-text-secondary flex-shrink-0"
              style={{ width: "50px" }}
            >
              3
            </span>
            <span
              className="font-mono text-accent-orange flex-shrink-0"
              style={{ width: "70px" }}
            >
              2.1/10
            </span>
            <span className="font-mono text-text-primary flex-1">
              if (a===b===c) return true;
            </span>
            <span
              className="font-mono text-text-secondary flex-shrink-0"
              style={{ width: "100px" }}
            >
              python
            </span>
          </div>

          {/* Table Row 4 - Multi-line example */}
          <div
            className="flex items-start hover:bg-bg-surface transition-colors"
            style={{ fontSize: "12px", padding: "16px 20px" }}
          >
            <span
              className="font-mono text-text-secondary flex-shrink-0"
              style={{ width: "50px" }}
            >
              4
            </span>
            <span
              className="font-mono text-blue-500 flex-shrink-0"
              style={{ width: "70px" }}
            >
              5.5/10
            </span>
            <div className="flex-1 flex flex-col gap-0.5">
              <span className="font-mono text-text-primary">
                {`for (let i = 0; i < arr.length; i++) {`}
              </span>
              <span className="font-mono text-text-primary">
                {`  console.log(arr[i]);`}
              </span>
              <span className="font-mono text-text-primary">{`}`}</span>
            </div>
            <span
              className="font-mono text-text-secondary flex-shrink-0"
              style={{ width: "100px" }}
            >
              javascript
            </span>
          </div>
        </div>

        {/* Fade Hint */}
        <div className="flex justify-center">
          <div
            className="font-secondary text-text-tertiary flex items-center gap-1"
            style={{ fontSize: "12px" }}
          >
            <span>{"showing top 4 of 2,847 ·"}</span>
            <a
              href="/leaderboard"
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              view full leaderboard &gt;&gt;
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Spacer */}
      <div style={{ height: "60px" }} />
    </div>
  );
}
