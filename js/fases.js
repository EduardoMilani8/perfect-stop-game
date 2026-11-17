/*
 * fases.js — dados das 3 fases e avaliação do resultado.
 *
 * Cada fase tem:
 *   v0    velocidade inicial (m/s)
 *   D     posição da faixa (m) — o objetivo do jogador, não entra na física
 *   mu    aderência μ do pneu (1 = seco, 0,5 = molhado)
 *   h(s)  altura da estrada na posição s (m)
 */

const FASES = [
  {
    nome: "Asfalto seco", v0: 12, D: 50, mu: 1,
    h: s => 0,                                   // plano
    dica: "Freio forte, pista boa."
  },
  {
    nome: "Pista molhada", v0: 14, D: 60, mu: 0.5,
    h: s => 0,                                   // plano
    dica: "O freio rende metade. Comece antes."
  },
  {
    nome: "Ladeira", v0: 14, D: 75, mu: 1,
    // h(s) = 4·cos(π·s/60) − 4 para 0 < s < 120; 0 fora
    h: s => (s <= 0 || s >= 120) ? 0 : 4 * Math.cos(Math.PI * s / 60) - 4,
    dica: "Na descida a gravidade empurra o carro."
  }
];

// Se a frente do carro passar de D + 12 m, ele avançou o sinal.
const LIMITE_AVANCO = 12;

// Estrelas pela distância até a faixa: erro = s_final − D
// |erro| ≤ 0,25 m → 3   |erro| ≤ 1 m → 2   |erro| ≤ 2,5 m → 1   senão → 0
function estrelas(erro) {
  const e = Math.abs(erro);
  if (e <= 0.25) return 3;
  if (e <= 1) return 2;
  if (e <= 2.5) return 1;
  return 0;
}

if (typeof module !== "undefined") {
  module.exports = { FASES, LIMITE_AVANCO, estrelas };
}
