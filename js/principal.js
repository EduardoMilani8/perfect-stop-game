/*
 * principal.js — estado do jogo, botões, teclado e laço de animação.
 *
 * A cada quadro (1/60 s) chama passo() de fisica.js duas vezes (Δt = 1/120 s),
 * mede as derivadas v ≈ Δs/Δt e a ≈ Δv/Δt e guarda tudo no histórico.
 */

const SUB = 2;   // passos de física por quadro: 2 × 1/120 s = 1/60 s

/* ---------- Estado ---------- */

let indiceFase = 0;
let fase = FASES[0];
let est = null;          // { t, s, v, a, p, rodando, fim, hist }
let segurando = false;   // o jogador está segurando o freio?
let inspecao = null;     // instante escolhido com o mouse nos gráficos (ou null = ao vivo)
let resultado = null;    // { ok, avancou, txt, erro } depois que o carro para
let relatorio = null;    // números da jogada que acabou (relatorio.js)

function novoEstado() {
  const a0 = aceleracao(0, fase.v0, 0, fase);
  return {
    t: 0, s: 0, v: fase.v0, a: a0, p: 0, rodando: false, fim: false,
    hist: [{ t: 0, s: 0, v: fase.v0, a: a0, p: 0, vD: fase.v0, aD: a0 }]
  };
}

/* ---------- Laço de animação ---------- */

function quadro() {
  if (est.rodando) {
    for (let k = 0; k < SUB && !est.fim; k++) {
      Object.assign(est, passo(est, segurando, fase, DT));
    }
    // mede as derivadas a partir dos valores registrados
    const ant = est.hist[est.hist.length - 1];
    const vD = derivadaNoTempo(est.s, ant.s, est.t - ant.t);    // v ≈ Δs/Δt
    const aD = derivadaNoTempo(vD, ant.vD, est.t - ant.t);      // a ≈ Δv/Δt
    est.hist.push({ t: est.t, s: est.s, v: est.v, a: est.a, p: est.p, vD, aD });
    if (est.fim) terminar(false);
    else if (est.s > fase.D + LIMITE_AVANCO) terminar(true);
  }
  desenhar();
  requestAnimationFrame(quadro);
}

/* ---------- Fim da fase ---------- */

function terminar(avancou) {
  est.rodando = false; est.fim = true;
  const erro = est.s - fase.D;   // positivo = passou da faixa
  if (avancou) {
    resultado = { ok: false, avancou: true, txt: "Avançou o sinal" };
  } else {
    const n = estrelas(erro);
    const onde = erro > 0 ? `${fmt(Math.abs(erro))} m depois da faixa` : `${fmt(Math.abs(erro))} m antes da faixa`;
    resultado = n
      ? { ok: true, avancou: false, txt: `${"★".repeat(n)}${"☆".repeat(3 - n)}  ${onde}` }
      : { ok: false, avancou: false, txt: `Errou: ${onde}` };
  }
  resultado.erro = erro;
  relatorio = montarRelatorio(est.hist, fase, resultado);
  mostrarVeredito(); atualizarBotoes(); mostrarRelatorio(relatorio, null);
}

function mostrarVeredito() {
  const v = $("veredito");
  v.hidden = !resultado;
  if (resultado) { v.textContent = resultado.txt; v.className = "veredito " + (resultado.ok ? "ok" : "bad"); }
}

/* ---------- Botões ---------- */

function escolherFase(i) {
  indiceFase = i; fase = FASES[i];
  $("fases").querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
  $("missao").innerHTML = `<strong>Pare na faixa a ${fase.D} m</strong><span>${fase.dica}</span>`;
  reiniciar();
}

function reiniciar() {
  est = novoEstado(); resultado = null; relatorio = null; inspecao = null;
  mostrarVeredito(); atualizarBotoes(); mostrarRelatorio(null, null);
}

function largar() {
  if (est.rodando) return;
  if (est.fim) reiniciar();
  est.rodando = true; inspecao = null; atualizarBotoes();
}

function atualizarBotoes() {
  $("largar").disabled = est.rodando;
  $("largar-texto").textContent = est.fim ? "De novo" : "Largar";
}

$("fases").innerHTML = FASES.map((f, i) =>
  `<button type="button" id="fase-${i + 1}" aria-pressed="false"><b>${i + 1} · ${f.nome}</b><small>${kmh(f.v0)} km/h · faixa a ${f.D} m</small></button>`).join("");
$("fases").querySelectorAll("button").forEach((b, i) => b.addEventListener("click", () => escolherFase(i)));
$("largar").addEventListener("click", largar);
$("reiniciar").addEventListener("click", reiniciar);

/* ---------- Freio (botão, espaço ou seta para baixo) e atalhos: Enter largar, R reiniciar ---------- */

const botaoFreio = $("freio");
botaoFreio.addEventListener("pointerdown", e => {
  e.preventDefault(); segurando = true;
  try { botaoFreio.setPointerCapture(e.pointerId); } catch (_) {}
});
["pointerup", "pointercancel", "lostpointercapture"].forEach(ev =>
  botaoFreio.addEventListener(ev, () => { segurando = false; }));

document.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowDown") { e.preventDefault(); segurando = true; }
  // Enter: largar / de novo (menos quando o foco está num botão de fase, para escolher a fase)
  if (e.code === "Enter" && !e.repeat && !document.activeElement?.closest("#fases")) { e.preventDefault(); largar(); }
  // R: reiniciar (Ctrl+R / Cmd+R continuam recarregando a página)
  if (e.code === "KeyR" && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) reiniciar();
});
document.addEventListener("keyup", e => {
  if (e.code === "Space" || e.code === "ArrowDown") { e.preventDefault(); segurando = false; }
});
window.addEventListener("blur", () => { segurando = false; });

/* ---------- Inspeção: passar o mouse (ou o dedo) nos gráficos ---------- */

document.querySelectorAll(".graf canvas").forEach(cv => {
  cv.addEventListener("pointermove", e => {
    if (est.rodando || !geo || est.hist.length < 2) return;
    const r = cv.getBoundingClientRect();
    const t = (e.clientX - r.left - geo.P.l) / (r.width - geo.P.l - geo.P.r) * geo.tMax;
    inspecao = Math.max(0, Math.min(t, est.hist[est.hist.length - 1].t));
  });
  cv.addEventListener("pointerleave", () => { inspecao = null; });
});

/* ---------- Início ---------- */

escolherFase(0);
requestAnimationFrame(quadro);
