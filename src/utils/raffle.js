/** Convert any string seed to a 32-bit integer */
export function hashSeed(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 seeded PRNG — deterministic, reproducible */
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle with seeded RNG, returns shuffled copy */
export function shuffleSeeded(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Extract all @mentions from a comment string */
export function extractMentions(text) {
  const matches = text.match(/@[\w.]+/g);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Derive the commenter's own handle from a line.
 * Supports "@usuario: texto" (colon-separated) and "@usuario texto" formats.
 * Returns the handle lowercased, or null if none found.
 */
function parseAuthor(line) {
  const colonIdx = line.indexOf(':');
  const scope = colonIdx > 0 ? line.slice(0, colonIdx) : line;
  const match = scope.match(/@[\w.]+/);
  return match ? match[0].toLowerCase() : null;
}

/**
 * Parse raw pasted text into comment objects.
 * A comment is valid ONLY when it mentions at least one user
 * other than the commenter themselves.
 */
export function parseComments(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, idx) => {
      const allMentions = extractMentions(line);
      const author = parseAuthor(line);
      const otherMentions = allMentions.filter(
        (m) => m.toLowerCase() !== author,
      );
      const valid = otherMentions.length > 0;
      return {
        id: idx,
        original: line,
        author,                    // commenter's own handle, lowercased
        mentions: allMentions,     // every @handle in the line
        otherMentions,             // @handles that are NOT the commenter
        valid,
        invalidReason: valid ? null : 'No menciona a otro usuario',
        included: true,
      };
    });
}

/** Draw winners from participant list using seed string */
export function drawWinners(participants, count, seedStr) {
  const seed = hashSeed(seedStr);
  const rng = mulberry32(seed);
  const shuffled = shuffleSeeded(participants, rng);
  return {
    winners: shuffled.slice(0, count),
    seed: seedStr,
    numericSeed: seed,
    timestamp: new Date().toISOString(),
    totalParticipants: participants.length,
  };
}

/** Generate a suggested seed: date + random hex */
export function generateSeed() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `SORTEO-${date}-${rand}`;
}
