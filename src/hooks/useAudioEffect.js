export function useAudioEffect() {
  const beep = (frequency = 520, duration = 0.06) => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duration);
    } catch {}
  };
  return {
    playButtonClick: () => beep(420),
    playCameraShutter: () => beep(240, .09),
    playScanBeep: () => beep(760, .08),
    playSuccessSound: () => beep(900, .15)
  };
}
