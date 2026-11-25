// fases.js — dados das 3 fases e avaliação do resultado.

const FASES = [
  {
    nome: "Asfalto seco", v0: 12, D: 50, mu: 1,
    h: s => 0,
    dica: "Freio forte, pista boa."
  },
  {
    nome: "Pista molhada", v0: 14, D: 60, mu: 0.5,
    h: s => 0,
    dica: "O freio rende metade. Comece antes."
  },
  {
    nome: "Ladeira", v0: 14, D: 75, mu: 1,
    h: s => (s <= 0 || s >= 120) ? 0 : 4 * Math.cos(Math.PI * s / 60) - 4,
    dica: "Na descida a gravidade empurra o carro."
  }
];

const LIMITE_AVANCO = 12;

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
