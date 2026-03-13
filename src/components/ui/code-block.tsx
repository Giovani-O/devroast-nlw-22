import { codeToHtml } from "shiki";

export interface CodeBlockProps {
  code: string;
  language?: string;
}

export async function CodeBlock({
  code,
  language = "javascript",
}: CodeBlockProps) {
  const html = await codeToHtml(code, {
    lang: language,
    theme: "vesper",
  });

  return (
    <div
      // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki outputs pre-escaped HTML
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
