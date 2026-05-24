// Songs — fake tracks with section structures

export const SONGS = [
  {
    id: "sunset-drive",
    title: "Sunset Drive",
    artist: "PHOSPHENE",
    bpm: 124,
    key: "A min",
    duration: 252,
    sections: [
      { name: "INTRO",   start: 0,   end: 24,  energy: 0.25 },
      { name: "VERSE",   start: 24,  end: 56,  energy: 0.45 },
      { name: "BUILD",   start: 56,  end: 80,  energy: 0.75 },
      { name: "DROP",    start: 80,  end: 128, energy: 1.0  },
      { name: "BRIDGE",  start: 128, end: 156, energy: 0.35 },
      { name: "BUILD",   start: 156, end: 172, energy: 0.80 },
      { name: "DROP",    start: 172, end: 220, energy: 1.0  },
      { name: "OUTRO",   start: 220, end: 252, energy: 0.30 },
    ],
  },
  {
    id: "volcano-heart",
    title: "Volcano Heart",
    artist: "NEON ATRIUM",
    bpm: 128,
    key: "F# min",
    duration: 228,
    sections: [
      { name: "INTRO",   start: 0,   end: 16,  energy: 0.20 },
      { name: "BUILD",   start: 16,  end: 48,  energy: 0.70 },
      { name: "DROP",    start: 48,  end: 96,  energy: 1.0  },
      { name: "VERSE",   start: 96,  end: 128, energy: 0.50 },
      { name: "BUILD",   start: 128, end: 144, energy: 0.85 },
      { name: "DROP",    start: 144, end: 196, energy: 1.0  },
      { name: "OUTRO",   start: 196, end: 228, energy: 0.25 },
    ],
  },
  {
    id: "midnight-protocol",
    title: "Midnight Protocol",
    artist: "BAUD RATE",
    bpm: 126,
    key: "C min",
    duration: 304,
    sections: [
      { name: "INTRO",   start: 0,   end: 32,  energy: 0.30 },
      { name: "VERSE",   start: 32,  end: 64,  energy: 0.40 },
      { name: "BRIDGE",  start: 64,  end: 96,  energy: 0.55 },
      { name: "BUILD",   start: 96,  end: 128, energy: 0.80 },
      { name: "DROP",    start: 128, end: 192, energy: 1.0  },
      { name: "BRIDGE",  start: 192, end: 224, energy: 0.40 },
      { name: "DROP",    start: 224, end: 280, energy: 1.0  },
      { name: "OUTRO",   start: 280, end: 304, energy: 0.20 },
    ],
  },
  {
    id: "carbon-glow",
    title: "Carbon Glow",
    artist: "HALF-LIGHT KID",
    bpm: 122,
    key: "G min",
    duration: 268,
    sections: [
      { name: "INTRO",   start: 0,   end: 20,  energy: 0.20 },
      { name: "VERSE",   start: 20,  end: 52,  energy: 0.40 },
      { name: "CHORUS",  start: 52,  end: 84,  energy: 0.85 },
      { name: "VERSE",   start: 84,  end: 116, energy: 0.45 },
      { name: "BUILD",   start: 116, end: 140, energy: 0.80 },
      { name: "DROP",    start: 140, end: 204, energy: 1.0  },
      { name: "BRIDGE",  start: 204, end: 232, energy: 0.50 },
      { name: "OUTRO",   start: 232, end: 268, energy: 0.30 },
    ],
  },
];

export const COLORS = {
  R: "#ff2a2a",
  O: "#ff8a1f",
  Y: "#ffd329",
  G: "#36d96b",
  C: "#2cd4ff",
  B: "#3a7bff",
  M: "#ff3ec0",
  W: "#ffffff",
};
export const COLOR_KEYS = Object.keys(COLORS);

export const TAU = Math.PI * 2;

export const EFFECTS = [
  {
    id: "ambient-spin",
    name: "Ambient Spin",
    measures: 4,
    tags: ["chill"],
    requiresStrobe: false,
    requiresUV: false,
    minStrobiness: 0,
    timeOfDay: ["pregame", "mid-party", "late-night"],
    sample(beat) {
      const colors = ["M", "C", "B"];
      const idx = Math.floor(beat / 4) % colors.length;
      return { dots: [1,1,1,1,1,1,1,1], color: COLORS[colors[idx]], rotation: beat * 0.15, strobeOn: false, uvOn: false, blackout: false };
    },
  },
  {
    id: "warm-fade",
    name: "Warm Fade",
    measures: 4,
    tags: ["chill"],
    timeOfDay: ["pregame", "mid-party"],
    sample(beat) {
      const seq = ["O", "Y", "R", "M"];
      const idx = Math.floor(beat / 2) % seq.length;
      return { dots: [1,1,1,1,1,1,1,1], color: COLORS[seq[idx]], rotation: beat * 0.08, strobeOn: false, uvOn: false, blackout: false };
    },
  },
  {
    id: "half-ring",
    name: "Half Ring",
    measures: 2,
    tags: ["medium"],
    timeOfDay: ["pregame", "mid-party", "late-night"],
    sample(beat) {
      return { dots: [1,0,1,0,1,0,1,0], color: COLORS.C, rotation: beat * 0.4, strobeOn: false, uvOn: false, blackout: false };
    },
  },
  {
    id: "quad-pulse",
    name: "Quad Pulse",
    measures: 1,
    tags: ["medium"],
    timeOfDay: ["mid-party", "late-night"],
    sample(beat) {
      const onBeat = (beat % 1) < 0.5;
      return { dots: [1,0,1,0,1,0,1,0], color: onBeat ? COLORS.M : COLORS.B, rotation: 0, strobeOn: false, uvOn: false, blackout: !onBeat };
    },
  },
  {
    id: "chase-one",
    name: "Chase One",
    measures: 2,
    tags: ["medium"],
    timeOfDay: ["pregame", "mid-party", "late-night"],
    sample(beat) {
      const pos = Math.floor((beat * 2) % 8);
      const dots = [0,0,0,0,0,0,0,0]; dots[pos] = 1;
      return { dots, color: COLORS.G, rotation: 0, strobeOn: false, uvOn: false, blackout: false };
    },
  },
  {
    id: "color-wheel",
    name: "Color Wheel",
    measures: 2,
    tags: ["medium"],
    timeOfDay: ["mid-party", "late-night"],
    sample(beat) {
      const colors = ["R","O","Y","G","C","B","M","W"];
      const idx = Math.floor(beat * 2) % colors.length;
      return { dots: [1,1,1,1,1,1,1,1], color: COLORS[colors[idx]], rotation: beat * 0.6, strobeOn: false, uvOn: false, blackout: false };
    },
  },
  {
    id: "strobe-drop",
    name: "Strobe Drop",
    measures: 1,
    tags: ["intense", "strobe"],
    minStrobiness: 0.3,
    timeOfDay: ["mid-party", "late-night"],
    sample(beat) {
      const phase = beat % 1;
      const strobe = phase < 0.15;
      return { dots: [1,1,1,1,1,1,1,1], color: COLORS.W, rotation: beat * 0.3, strobeOn: strobe, uvOn: false, blackout: false };
    },
  },
  {
    id: "8th-gate",
    name: "8th Gate",
    measures: 1,
    tags: ["intense", "strobe"],
    minStrobiness: 0.5,
    timeOfDay: ["mid-party", "late-night"],
    sample(beat) {
      const phase = (beat * 2) % 1;
      return { dots: [1,1,1,1,1,1,1,1], color: COLORS.M, rotation: beat * 0.5, strobeOn: false, uvOn: false, blackout: phase > 0.5 };
    },
  },
  {
    id: "downbeat-flash",
    name: "Downbeat Flash",
    measures: 1,
    tags: ["intense", "strobe"],
    minStrobiness: 0.2,
    timeOfDay: ["mid-party", "late-night"],
    sample(beat) {
      const isDownbeat = Math.floor(beat) % 4 === 0;
      const phase = beat % 1;
      return { dots: [1,1,1,1,1,1,1,1], color: COLORS.Y, rotation: 0, strobeOn: isDownbeat && phase < 0.18, uvOn: false, blackout: false };
    },
  },
  {
    id: "uv-wash",
    name: "UV Wash",
    measures: 4,
    tags: ["uv", "deep"],
    requiresUV: true,
    timeOfDay: ["late-night"],
    sample(beat) {
      return { dots: [0,0,0,0,0,0,0,0], color: COLORS.M, rotation: 0, strobeOn: false, uvOn: true, blackout: true };
    },
  },
  {
    id: "uv-chase",
    name: "UV Chase",
    measures: 2,
    tags: ["uv", "deep"],
    requiresUV: true,
    timeOfDay: ["late-night"],
    sample(beat) {
      const pos = Math.floor((beat) % 8);
      const dots = [0,0,0,0,0,0,0,0]; dots[pos] = 1;
      return { dots, color: COLORS.M, rotation: beat * 0.4, strobeOn: false, uvOn: true, blackout: false };
    },
  },
  {
    id: "reverse-spin",
    name: "Reverse Spin",
    measures: 4,
    tags: ["medium"],
    timeOfDay: ["pregame", "mid-party", "late-night"],
    sample(beat) {
      return { dots: [1,1,1,1,1,1,1,1], color: COLORS.B, rotation: -beat * 0.3, strobeOn: false, uvOn: false, blackout: false };
    },
  },
  {
    id: "blackout-hit",
    name: "Blackout Hit",
    measures: 2,
    tags: ["intense"],
    timeOfDay: ["mid-party", "late-night"],
    sample(beat) {
      const isHit = (beat % 8) < 0.3;
      return { dots: [1,1,1,1,1,1,1,1], color: COLORS.R, rotation: 0, strobeOn: false, uvOn: false, blackout: !isHit };
    },
  },
  {
    id: "twin-pulse",
    name: "Twin Pulse",
    measures: 2,
    tags: ["medium"],
    timeOfDay: ["pregame", "mid-party", "late-night"],
    sample(beat) {
      const phase = beat % 1;
      const alt = Math.floor(beat) % 2 === 0;
      const dots = alt ? [1,1,0,0,1,1,0,0] : [0,0,1,1,0,0,1,1];
      return { dots, color: alt ? COLORS.C : COLORS.O, rotation: 0, strobeOn: false, uvOn: false, blackout: phase > 0.7 };
    },
  },
  {
    id: "rainbow-rotate",
    name: "Rainbow Spin",
    measures: 4,
    tags: ["medium"],
    timeOfDay: ["pregame", "mid-party", "late-night"],
    sample(beat) {
      return { dots: [1,1,1,1,1,1,1,1], color: "__rainbow", rotation: beat * 0.18, strobeOn: false, uvOn: false, blackout: false };
    },
  },
];

export const EFFECT_BY_ID = Object.fromEntries(EFFECTS.map((e) => [e.id, e]));

export function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function seededPick(seed, arr) {
  if (arr.length === 0) return null;
  return arr[seed % arr.length];
}

function isEffectEligible(eff, { timeOfDay, strobiness, enabledIds }) {
  if (!enabledIds.has(eff.id)) return false;
  if (!eff.timeOfDay.includes(timeOfDay)) return false;
  if (eff.requiresUV && timeOfDay !== "late-night") return false;
  if (eff.minStrobiness !== undefined && strobiness < eff.minStrobiness) return false;
  return true;
}

export function generatePlan(song, ctx) {
  const eligible = EFFECTS.filter((e) => isEffectEligible(e, ctx));
  const fallback = EFFECTS.filter((e) => ctx.enabledIds.has(e.id) && e.timeOfDay.includes(ctx.timeOfDay) && !e.requiresUV && (e.minStrobiness === undefined || e.minStrobiness <= 0.001));

  return song.sections.map((sec, i) => {
    let pool = eligible;
    if (sec.energy > 0.7) {
      const intense = pool.filter((e) => e.tags.includes("intense") || e.tags.includes("strobe") || e.tags.includes("uv"));
      if (intense.length > 0) pool = intense;
    } else if (sec.energy < 0.4) {
      const chill = pool.filter((e) => e.tags.includes("chill") || e.tags.includes("deep"));
      if (chill.length > 0) pool = chill;
    } else {
      const medium = pool.filter((e) => e.tags.includes("medium"));
      if (medium.length > 0) pool = medium;
    }

    if (ctx.timeOfDay === "late-night") {
      const uvSeed = hash(song.id + "uv" + i);
      const uvChance = (uvSeed % 100) / 100;
      if (uvChance < 0.22) {
        const uvPool = eligible.filter((e) => e.requiresUV);
        if (uvPool.length > 0) pool = uvPool;
      }
    }

    if (pool.length === 0) pool = fallback;
    if (pool.length === 0) pool = EFFECTS.slice(0, 1);

    const seed = hash(song.id + ":" + i + ":" + ctx.timeOfDay + ":" + Math.round(ctx.strobiness * 10));
    return { section: sec, effect: seededPick(seed, pool) };
  });
}

export function makeWaveform(song, bars = 80) {
  const out = [];
  for (let i = 0; i < bars; i++) {
    const t = (i / bars) * song.duration;
    const sec = song.sections.find((s) => t >= s.start && t < s.end) || song.sections[song.sections.length-1];
    const noise = ((hash(song.id + i) % 100) / 100) * 0.5 + 0.5;
    out.push(sec.energy * noise);
  }
  return out;
}

export function fmtTime(s) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}
