export function playSlashSound() {
  try {
    const context = new window.AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime;

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(760, start);
    oscillator.frequency.exponentialRampToValueAtTime(145, start + 0.16);
    gain.gain.setValueAtTime(0.075, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.19);
    oscillator.onended = () => { void context.close(); };
  } catch {
    // The visual completion effect remains available if audio is disabled.
  }
}
