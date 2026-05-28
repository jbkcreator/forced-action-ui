const PATTERNS = {
  wallet: /\b(wallet|add\s+credits|buy\s+credits|top[\s-]?up|credits?)\b/i,
  annual: /\b(annual|yearly|pay\s+yearly|year\s+contract)\b/i,
};

export function detectIntent(text) {
  for (const [kind, re] of Object.entries(PATTERNS)) {
    const m = re.exec(text);
    if (m) return { kind, matched: m[0] };
  }
  return null;
}
