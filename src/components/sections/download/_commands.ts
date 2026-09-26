/*
 * Private helper for the Download install options (work package C).
 * Reads every command straight from src/content/copy.md at build time, so the code blocks on
 * /download are verbatim copies of the approved text and a copy edit lands without retyping.
 * Source: copy.md > "## Download (`/download`)" > "### Install options" > each "#### <method>".
 * The build fails loudly if the copy structure changes, instead of shipping a wrong command.
 */
import fs from "node:fs";
import path from "node:path";

export type Fence = { lang: "shell" | "powershell" | "yaml"; code: string };

const COPY = path.join(process.cwd(), "src/content/copy.md");

function section(text: string, start: string, level: string): string {
  const from = text.indexOf(start);
  if (from < 0) throw new Error(`copy.md: heading "${start}" not found (Download install options).`);
  const rest = text.slice(from + start.length);
  const end = rest.search(new RegExp(`\\n${level} `));
  return end < 0 ? rest : rest.slice(0, end);
}

function load(): Record<string, Fence[]> {
  const md = fs.readFileSync(COPY, "utf8").replace(/\r\n/g, "\n");
  const download = section(md, "## Download (`/download`)", "##");
  const options = section(download, "### Install options", "###");
  const out: Record<string, Fence[]> = {};
  for (const block of options.split("\n#### ").slice(1)) {
    const name = block.slice(0, block.indexOf("\n")).trim();
    out[name] = [...block.matchAll(/```(shell|powershell|yaml)\n([\s\S]*?)\n```/g)].map((m) => ({
      lang: m[1] as Fence["lang"],
      code: m[2],
    }));
  }
  return out;
}

const ALL = load();

/** The fenced commands of one install method, in copy order. Throws if the count changed. */
export function fences(method: string, expected: number): Fence[] {
  const list = ALL[method];
  if (!list) throw new Error(`copy.md: install method "${method}" not found under Download > Install options.`);
  if (list.length !== expected)
    throw new Error(`copy.md: "${method}" has ${list.length} code blocks, expected ${expected}. Update InstallOptions.astro.`);
  return list;
}
