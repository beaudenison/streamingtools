let shared: AudioContext | null = null;

export function tone() {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  // One shared context: browsers cap how many can be open, and an overlay
  // can run for hours.
  const ctx = (shared ??= new Ctx());
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 880;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
  osc.start();
  osc.stop(ctx.currentTime + 0.24);
}
