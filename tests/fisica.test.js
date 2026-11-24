/*
 * Testes da física. Rodar com:  node tests/fisica.test.js
 */
const assert = require("assert");
const F = require("../js/fisica.js");
const { FASES, LIMITE_AVANCO } = require("../js/fases.js");

let falhas = 0;
function teste(nome, fn) {
  try { fn(); console.log("  ok   " + nome); }
  catch (e) { falhas++; console.log("  FALHOU " + nome + "\n         " + e.message); }
}
function perto(obtido, esperado, tolerancia, msg) {
  assert.ok(Math.abs(obtido - esperado) <= tolerancia,
    `${msg || ""} esperado ≈ ${esperado}, obtido ${obtido}`);
}

// Simula uma fase do início até o carro parar ou avançar o sinal.
// O jogador começa a segurar o freio no instante tFreio (Infinity = nunca freia).
function simular(fase, tFreio) {
  let estado = { t: 0, s: 0, v: fase.v0, a: 0, p: 0, fim: false };
  while (!estado.fim && estado.s <= fase.D + LIMITE_AVANCO) {
    estado = F.passo(estado, estado.t >= tFreio, fase, F.DT);
  }
  return estado;
}

console.log("Taxa de variação e derivada");
teste("taxa de variação média de 0 a 50 m em 5 s = 10", () =>
  assert.strictEqual(F.taxaDeVariacaoMedia(0, 50, 0, 5), 10));
teste("derivada pela definição: (x²)′ em 3 ≈ 6", () => perto(F.derivada(x => x * x, 3), 6, 0.01));
teste("derivada da ladeira ≈ regra da cadeia: h′(s) = −4·(π/60)·sen(π·s/60)", () => {
  [10, 30, 50, 90].forEach(s =>
    perto(F.derivada(FASES[2].h, s), -4 * (Math.PI / 60) * Math.sin(Math.PI * s / 60), 1e-3, `s = ${s}:`));
});

console.log("Aceleração");
teste("plano, sem freio: a = 0", () => perto(F.aceleracao(10, 0, FASES[0]), 0, 1e-12));
teste("plano, freio no fundo: a = −8 (seco) e −4 (molhado)", () => {
  assert.strictEqual(F.aceleracao(10, 1, FASES[0]), -8);
  assert.strictEqual(F.aceleracao(10, 1, FASES[1]), -4);
});
teste("ladeira, sem freio: a = −G·h′(s) (desce → positiva, sobe → negativa)", () => {
  perto(F.aceleracao(30, 0, FASES[2]), -F.G * F.derivada(FASES[2].h, 30), 1e-12);
  assert.ok(F.aceleracao(30, 0, FASES[2]) > 0, "na descida o carro acelera");
  assert.ok(F.aceleracao(90, 0, FASES[2]) < 0, "na subida o carro perde velocidade");
});

console.log("Pedal");
teste("pedal afunda 2,5/s e para em 1", () => {
  perto(F.atualizarPedal(0, true, 0.1), 0.25, 1e-12);
  assert.strictEqual(F.atualizarPedal(0.99, true, 0.1), 1);
});
teste("pedal volta 5/s e para em 0", () => {
  perto(F.atualizarPedal(1, false, 0.1), 0.5, 1e-12);
  assert.strictEqual(F.atualizarPedal(0.1, false, 0.1), 0);
});

console.log("Passo");
teste("passo não altera o estado recebido", () => {
  const antes = { t: 0, s: 0, v: 12, a: 0, p: 0, fim: false };
  const copia = { ...antes };
  F.passo(antes, true, FASES[0], F.DT);
  assert.deepStrictEqual(antes, copia);
});
teste("passo: s(t+Δt) = s + v·Δt e v(t+Δt) = v + a·Δt", () => {
  const e = F.passo({ t: 0, s: 0, v: 12, a: 0, p: 0, fim: false }, true, FASES[0], F.DT);
  const p = F.PEDAL_SOBE * F.DT;
  const a = F.aceleracao(0, p, FASES[0]);
  perto(e.p, p, 1e-12, "p:");
  perto(e.a, a, 1e-12, "a:");
  perto(e.s, 12 * F.DT, 1e-12, "s:");
  perto(e.v, 12 + a * F.DT, 1e-12, "v:");
  perto(e.t, F.DT, 1e-12, "t:");
  assert.strictEqual(e.fim, false);
});
teste("quando v chega a 0, o carro para (v = 0, fim)", () => {
  const e = F.passo({ t: 5, s: 40, v: 0.01, a: 0, p: 1, fim: false }, true, FASES[0], F.DT);
  assert.strictEqual(e.v, 0);
  assert.strictEqual(e.fim, true);
  perto(e.s, 40 + 0.01 * F.DT, 1e-12, "s:");
});

console.log("Simulação das fases");
teste("fase 1 freando a partir de t = 3,22 s para a menos de 0,25 m da faixa", () => {
  const fim = simular(FASES[0], 3.22);
  assert.ok(fim.fim, "o carro deveria ter parado");
  perto(fim.s, FASES[0].D, 0.25, "posição final:");
});
FASES.forEach((fase, i) => {
  teste(`fase ${i + 1} sem frear passa da faixa`, () => {
    const fim = simular(fase, Infinity);
    assert.ok(fim.s > fase.D, `parou em ${fim.s.toFixed(2)} m`);
  });
});

console.log(falhas ?`\n${falhas} teste(s) falharam.` : "\nTodos os testes passaram.");
process.exit(falhas ? 1 : 0);
