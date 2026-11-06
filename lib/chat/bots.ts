const BOTS = new Set(
  [
    "nightbot",
    "streamelements",
    "moobot",
    "fossabot",
    "streamlabs",
    "wizebot",
    "stay_hydrated_bot",
    "sery_bot",
    "commanderroot",
    "soundalerts",
    "kofitreonbot",
    "pretzelrocks",
    "anotherttvviewer",
    "streamkit",
    "kickbot",
    "botrix",
    "own3d",
    "lotsofgamesbot",
    "tangiobot",
    "pokemoncommunitygame",
  ].map((n) => n.toLowerCase()),
);

export function isKnownBot(name: string) {
  return BOTS.has(name.trim().toLowerCase());
}
