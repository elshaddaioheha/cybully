import fs from "node:fs";
import path from "node:path";

const candidateDirectories = [
  process.cwd(),
  path.resolve(process.cwd(), ".."),
  path.resolve(process.cwd(), "..", "..")
];

const candidateFiles = [".env.local", ".env"];

let cachedEnv: Map<string, string> | null = null;

function parseLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  const rawValue = trimmed.slice(separatorIndex + 1).trim();
  const value = rawValue.replace(/^['"]|['"]$/g, "");

  return key ? [key, value] : null;
}

function loadFallbackEnv(): Map<string, string> {
  const envMap = new Map<string, string>();

  for (const directory of candidateDirectories) {
    for (const filename of candidateFiles) {
      const filePath = path.join(directory, filename);
      if (!fs.existsSync(filePath)) {
        continue;
      }

      const fileContents = fs.readFileSync(filePath, "utf8");
      for (const line of fileContents.split(/\r?\n/)) {
        const entry = parseLine(line);
        if (!entry) {
          continue;
        }

        const [key, value] = entry;
        if (!envMap.has(key)) {
          envMap.set(key, value);
        }
      }
    }
  }

  return envMap;
}

export function serverEnv(name: string): string | undefined {
  const directValue = process.env[name];
  if (directValue) {
    return directValue;
  }

  cachedEnv ??= loadFallbackEnv();
  return cachedEnv.get(name);
}
