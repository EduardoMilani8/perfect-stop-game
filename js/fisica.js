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
 */

/* ---------- Constantes ---------- */

const G = 9.8;            // gravidade (m/s²)
const FREIO_MAX = 8;      // desaceleração máxima do freio no asfalto seco (m/s²)
const C_AR = 0.003;       // resistência do ar (1/m), multiplica v²
const ROLAGEM = 0.1;      // atrito de rolagem (m/s²)
const PEDAL_SOBE = 2.5;   // quanto o pedal afunda por segundo segurando (1/s)
const PEDAL_DESCE = 5;    // quanto o pedal volta por segundo soltando (1/s)
const DT = 1 / 120;       // passo de tempo Δt (s): 2 passos por quadro de 1/60 s
const EPSILON = 0.001;    // ε da derivada numérica (m)

/* ---------- Derivadas numéricas ---------- */

// Derivada de uma função f no ponto x, pela diferença central:
// f′(x) ≈ [f(x + ε) − f(x − ε)] / 2ε
function derivada(f, x) {
  return (f(x + EPSILON) - f(x - EPSILON)) / (2 * EPSILON);
}

// Derivada no tempo a partir de dois valores medidos:
// f′(t) ≈ [f(t) − f(t − Δt)] / Δt
function derivadaNoTempo(atual, anterior, dt) {
  return (atual - anterior) / dt;
}

/* ---------- Forças ao longo da pista ---------- */

// Inclinação da pista na posição s: a derivada da função da estrada.
// inclinação = h′(s)
function inclinacaoDaPista(h, s) {
  return derivada(h, s);
}

// Parte da gravidade que empurra o carro ao longo da pista.
// Com θ = ângulo da pista, sen(θ) = h′(s) / √(1 + h′(s)²), então:
// a_gravidade = −G · h′(s) / √(1 + h′(s)²)
// (descida: h′ < 0 → acelera; subida: h′ > 0 → freia)
function componenteDaGravidade(h, s) {
  const m = inclinacaoDaPista(h, s);
  return -G * m / Math.sqrt(1 + m * m);
}

// Aceleração do carro (não é constante: depende de p, v e s).
// a(s, v, p) = − FREIO_MAX · μ · p   ← pedal (jogador)
//              − C_AR · v²            ← resistência do ar
//              − ROLAGEM              ← atrito de rolagem
//              − G · h′(s) / √(1 + h′(s)²)   ← gravidade na ladeira
function aceleracao(s, v, p, fase) {
  const freio = FREIO_MAX * fase.mu * p;
  const ar = C_AR * v * v;
  const gravidade = componenteDaGravidade(fase.h, s);
  return -freio - ar - ROLAGEM + gravidade;
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

// Um passo da simulação (método de Euler).
// Ideia: a derivada é v = ds/dt ≈ Δs/Δt, então num Δt pequeno Δs ≈ v·Δt.
// Do mesmo jeito, a = dv/dt ≈ Δv/Δt, então Δv ≈ a·Δt.
// Ordem das contas:
//   p ← p ± velocidade_do_pedal · Δt
//   a ← a(s, v, p)
//   v(t + Δt) = v(t) + a · Δt        (se v ≤ 0: v = 0 e o carro parou)
//   s(t + Δt) = s(t) + v(t + Δt) · Δt
//   t ← t + Δt
//
// Recebe o estado { t, s, v, a, p, fim } e devolve o estado seguinte.
function passo(estado, segurando, fase, dt) {
  const p = atualizarPedal(estado.p, segurando, dt);   // pedal
  const a = aceleracao(estado.s, estado.v, p, fase);   // a(t)

  let v = estado.v + a * dt;                           // v(t + Δt) = v(t) + a·Δt
  let fim = false;
  if (v <= 0) {                                        // o carro parou
    v = 0;
    fim = true;
  }

  const s = estado.s + v * dt;                         // s(t + Δt) = s(t) + v(t + Δt)·Δt  (usa o v novo)
  const t = estado.t + dt;                             // t ← t + Δt

  return { t, s, v, a, p, fim };
}

/* ---------- Análise de uma jogada (usada no relatório) ---------- */
// Recebem listas de amostras: ts = [t0, t1, …] e ys = [y0, y1, …] (valores de f nesses instantes).

// Taxa de variação média de f entre t0 e t1 (a inclinação da reta secante):
// [f(t1) − f(t0)] / (t1 − t0)
function taxaDeVariacaoMedia(f0, f1, t0, t1) {
  return derivadaNoTempo(f1, f0, t1 - t0);
}

// Integral de f no tempo pela regra dos trapézios (área sob o gráfico):
// ∫ f(t) dt ≈ Σ [f(tᵢ) + f(tᵢ₊₁)] / 2 · (tᵢ₊₁ − tᵢ)
function integralTrapezios(ts, ys) {
  let area = 0;
  for (let i = 0; i + 1 < ts.length; i++) {
    area += (ys[i] + ys[i + 1]) / 2 * (ts[i + 1] - ts[i]);
  }
  return area;
}

// Instantes em que f passa pelo valor alvo, por interpolação linear entre duas amostras:
// t = tᵢ + (alvo − yᵢ) · (tᵢ₊₁ − tᵢ) / (yᵢ₊₁ − yᵢ)
// Devolve [{ t, sobe }] — sobe = true se f passou de baixo para cima do alvo.
function instantesOndeCruza(ts, ys, alvo) {
  const cruzamentos = [];
  for (let i = 0; i + 1 < ts.length; i++) {
    const antes = ys[i] - alvo, depois = ys[i + 1] - alvo;
    if (antes === 0 || antes * depois < 0) {
      const t = ts[i] + (alvo - ys[i]) * (ts[i + 1] - ts[i]) / (ys[i + 1] - ys[i]);
      cruzamentos.push({ t, sobe: ys[i + 1] > ys[i] });
    }
  }
  return cruzamentos;
}

/* ---------- Exportação para os testes no Node ---------- */
if (typeof module !== "undefined") {
  module.exports = {
    G, FREIO_MAX, C_AR, ROLAGEM, PEDAL_SOBE, PEDAL_DESCE, DT, EPSILON,
    derivada, derivadaNoTempo, inclinacaoDaPista, componenteDaGravidade,
    aceleracao, atualizarPedal, passo,
    taxaDeVariacaoMedia, integralTrapezios, instantesOndeCruza
  };
}
