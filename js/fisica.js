/*
 * fisica.js — toda a matemática do jogo "Parada Perfeita".
 *
 * Aqui não há desenho nem tela: só constantes e funções puras.
 * Cada função traz, no comentário, a fórmula que ela calcula.
 *
 * Grandezas (unidades do SI):
 *   t  tempo (s)          s  posição da frente do carro na pista (m)
 *   v  velocidade (m/s)   a  aceleração (m/s²)
 *   p  pedal do freio, de 0 (solto) a 1 (no fundo)
 *   h(s)  altura da estrada na posição s (m)
 *
 * As três estão ligadas por derivadas:
 *   v(t) = s′(t)     a(t) = v′(t) = s″(t)   (derivada de ordem superior)
 */

/* ---------- Constantes ---------- */

const G = 9.8;            // gravidade (m/s²)
const FREIO_MAX = 8;      // desaceleração máxima do freio no asfalto seco (m/s²)
const PEDAL_SOBE = 2.5;   // quanto o pedal afunda por segundo segurando (1/s)
const PEDAL_DESCE = 5;    // quanto o pedal volta por segundo soltando (1/s)
const DT = 1 / 120;       // passo de tempo Δt (s): 2 passos por quadro de 1/60 s
const DX = 0.001;         // Δx bem pequeno, usado no lugar de "Δx → 0" na derivada (m)

/* ---------- Taxa de variação e derivada ---------- */

// Taxa de variação média de y em relação a x (inclinação da reta secante):
// Δy/Δx = [f(x₂) − f(x₁)] / (x₂ − x₁)
function taxaDeVariacaoMedia(y1, y2, x1, x2) {
  return (y2 - y1) / (x2 - x1);
}

// Derivada pela definição (taxa de variação instantânea):
// f′(x) = lim_{Δx → 0} [f(x + Δx) − f(x)] / Δx
// No computador não dá para fazer Δx → 0; usamos um Δx bem pequeno (DX).
function derivada(f, x) {
  return taxaDeVariacaoMedia(f(x), f(x + DX), x, x + DX);
}

/* ---------- Aceleração ---------- */

// Inclinação da pista na posição s: a derivada da função da estrada.
// inclinação = h′(s)
function inclinacaoDaPista(h, s) {
  return derivada(h, s);
}

// Aceleração do carro (não é constante: depende do pedal p e da posição s).
// a(s, p) = − FREIO_MAX · μ · p   ← freio (o jogador controla p)
//           − G · h′(s)            ← ladeira (descida: h′ < 0 → acelera; subida: h′ > 0 → freia)
function aceleracao(s, p, fase) {
  const freio = FREIO_MAX * fase.mu * p;
  const ladeira = G * inclinacaoDaPista(fase.h, s);
  return -freio - ladeira;
}

/* ---------- Atualização a cada passo Δt ---------- */

// Pedal: afunda enquanto o jogador segura, volta quando solta.
// p(t + Δt) = p(t) + PEDAL_SOBE · Δt    (segurando)
// p(t + Δt) = p(t) − PEDAL_DESCE · Δt   (solto)
// sempre limitado entre 0 e 1
function atualizarPedal(p, segurando, dt) {
  const velocidadeDoPedal = segurando ? PEDAL_SOBE : -PEDAL_DESCE;
  const novo = p + velocidadeDoPedal * dt;
  return Math.min(1, Math.max(0, novo));
}

// Um passo da simulação, usando a diferencial:
//   dy = f′(x) · dx   e, para dx = Δx pequeno,   Δy ≈ dy
// (a curva fica muito perto da reta tangente perto do ponto de tangência).
// Aplicando em s e em v, com dx = Δt:
//   Δs ≈ s′(t) · Δt = v · Δt   →   s(t + Δt) = s(t) + v(t) · Δt
//   Δv ≈ v′(t) · Δt = a · Δt   →   v(t + Δt) = v(t) + a(t) · Δt
// Se v chega a 0, o carro parou (v = 0 e fim).
//
// Recebe o estado { t, s, v, a, p, fim } e devolve o estado seguinte.
function passo(estado, segurando, fase, dt) {
  const p = atualizarPedal(estado.p, segurando, dt);   // pedal
  const a = aceleracao(estado.s, p, fase);              // a(t)

  const s = estado.s + estado.v * dt;                   // s(t + Δt) = s(t) + v(t)·Δt
  let v = estado.v + a * dt;                            // v(t + Δt) = v(t) + a(t)·Δt
  let fim = false;
  if (v <= 0) {                                         // o carro parou
    v = 0;
    fim = true;
  }
  const t = estado.t + dt;                              // t ← t + Δt

  return { t, s, v, a, p, fim };
}

/* ---------- Exportação para os testes no Node ---------- */
if (typeof module !== "undefined") {
  module.exports = {
    G, FREIO_MAX, PEDAL_SOBE, PEDAL_DESCE, DT, DX,
    taxaDeVariacaoMedia, derivada, inclinacaoDaPista, aceleracao,
    atualizarPedal, passo
  };
}
