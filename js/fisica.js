// fisica.js — toda a matemática do jogo.
// s posição (m), v velocidade (m/s), a aceleração (m/s²), p pedal (0 a 1), h(s) altura da pista (m)

const G = 9.8;            // gravidade
const FREIO_MAX = 8;      // freio máximo no seco
const PEDAL_SOBE = 2.5;
const PEDAL_DESCE = 5;
const DT = 1 / 120;       // Δt
const DX = 0.001;         // Δx pequeno da derivada

// Δy/Δx = [f(x₂) − f(x₁)] / (x₂ − x₁)
function taxaDeVariacaoMedia(y1, y2, x1, x2) {
  return (y2 - y1) / (x2 - x1);
}

// f′(x) = lim Δx→0 [f(x + Δx) − f(x)] / Δx
function derivada(f, x) {
  return taxaDeVariacaoMedia(f(x), f(x + DX), x, x + DX);
}

// inclinação = h′(s)
function inclinacaoDaPista(h, s) {
  return derivada(h, s);
}

// a = − FREIO_MAX·μ·p − G·h′(s)
function aceleracao(s, p, fase) {
  const freio = FREIO_MAX * fase.mu * p;
  const ladeira = G * inclinacaoDaPista(fase.h, s);
  return -freio - ladeira;
}

// p(t + Δt) = p(t) ± velocidade do pedal · Δt, entre 0 e 1
function atualizarPedal(p, segurando, dt) {
  const velocidadeDoPedal = segurando ? PEDAL_SOBE : -PEDAL_DESCE;
  const novo = p + velocidadeDoPedal * dt;
  return Math.min(1, Math.max(0, novo));
}

// Diferencial: Δy ≈ dy = f′(x)·dx
// s(t + Δt) = s(t) + v(t)·Δt
// v(t + Δt) = v(t) + a(t)·Δt
function passo(estado, segurando, fase, dt) {
  const p = atualizarPedal(estado.p, segurando, dt);
  const a = aceleracao(estado.s, p, fase);

  const s = estado.s + estado.v * dt;
  let v = estado.v + a * dt;
  let fim = false;
  if (v <= 0) {
    v = 0;
    fim = true;
  }
  const t = estado.t + dt;

  return { t, s, v, a, p, fim };
}

if (typeof module !== "undefined") {
  module.exports = {
    G, FREIO_MAX, PEDAL_SOBE, PEDAL_DESCE, DT, DX,
    taxaDeVariacaoMedia, derivada, inclinacaoDaPista, aceleracao,
    atualizarPedal, passo
  };
}
