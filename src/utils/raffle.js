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

const ORGANIZERS = new Set(['@indies_calvos', '@leasim_sp', '@davidgg87'])

/**
 * Parse raw pasted text into comment objects.
 * A comment is valid ONLY when it mentions at least one user
 * other than the commenter themselves, and the commenter is not an organizer.
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
      const isOrganizer = author !== null && ORGANIZERS.has(author);
      const valid = !isOrganizer && otherMentions.length > 0;
      const invalidReason = isOrganizer
        ? 'Organizador — no puede participar'
        : valid ? null : 'No menciona a otro usuario';
      return {
        id: idx,
        original: line,
        author,
        mentions: allMentions,
        otherMentions,
        valid,
        invalidReason,
        included: !isOrganizer,
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

/**
 * Generate a public seed tied to the exact moment and pool size.
 * Format: SORTEO-YYYYMMDD-HHMMSS-N{count}
 * This makes the seed self-documenting and fully auditable.
 */
export function generateSeed(participantCount) {
  const now = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}`;
  const time = `${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
  return `SORTEO-${date}-${time}-N${participantCount}`;
}
