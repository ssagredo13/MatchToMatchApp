export async function playRefereeWhistle() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    throw new Error('Este navegador no admite efectos de sonido.');
  }

  const audioContext = new AudioContextConstructor();
  try {
    await audioContext.resume();
    const startAt = audioContext.currentTime;
    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.16, startAt);
    masterGain.connect(audioContext.destination);

    [2050, 2410].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const envelope = audioContext.createGain();
      const offset = index * 0.012;

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, startAt + offset);
      oscillator.frequency.linearRampToValueAtTime(frequency - 150, startAt + 0.68);
      envelope.gain.setValueAtTime(0.0001, startAt + offset);
      envelope.gain.exponentialRampToValueAtTime(0.12, startAt + 0.06 + offset);
      envelope.gain.setValueAtTime(0.12, startAt + 0.42);
      envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.72);

      oscillator.connect(envelope);
      envelope.connect(masterGain);
      oscillator.start(startAt + offset);
      oscillator.stop(startAt + 0.74);
    });

    await new Promise((resolve) => window.setTimeout(resolve, 800));
  } finally {
    await audioContext.close();
  }
}
