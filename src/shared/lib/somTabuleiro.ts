let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function tocar(frequencia: number, duracaoS: number, ganho = 0.15) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.connect(env);
  env.connect(ac.destination);
  osc.type = "sine";
  osc.frequency.value = frequencia;
  env.gain.setValueAtTime(ganho, ac.currentTime);
  env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duracaoS);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duracaoS);
}

export function somLance() {
  try {
    tocar(800, 0.08, 0.12);
    setTimeout(() => tocar(600, 0.06, 0.08), 30);
  } catch {}
}

export function somCaptura() {
  try {
    tocar(300, 0.12, 0.18);
    setTimeout(() => tocar(250, 0.1, 0.12), 40);
  } catch {}
}

export function somAcerto() {
  try {
    tocar(523, 0.1, 0.12); // C5
    setTimeout(() => tocar(659, 0.1, 0.12), 100); // E5
    setTimeout(() => tocar(784, 0.15, 0.12), 200); // G5
  } catch {}
}

export function somErro() {
  try {
    tocar(200, 0.2, 0.15);
    setTimeout(() => tocar(180, 0.25, 0.12), 100);
  } catch {}
}
