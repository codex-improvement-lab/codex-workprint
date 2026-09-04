export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }

  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(input).sort(codePointCompare)) {
      const entry = input[key];
      if (entry !== undefined) {
        output[key] = canonicalize(entry);
      }
    }
    return output;
  }

  return value;
}

export function canonicalJson(value: unknown): string {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

export function canonicalJsonCompact(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function codePointCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

