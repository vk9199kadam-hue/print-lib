export function playNotificationSound(frequency = 880, duration = 0.6): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore error
  }
}

export function playSuccessSound(): void {
  playNotificationSound(1046, 0.3);
  setTimeout(() => playNotificationSound(1318, 0.3), 200);
  setTimeout(() => playNotificationSound(1568, 0.5), 400);
}

export function playReadySound(): void {
  playNotificationSound(523, 0.2);
  setTimeout(() => playNotificationSound(659, 0.2), 150);
  setTimeout(() => playNotificationSound(784, 0.4), 300);
}
