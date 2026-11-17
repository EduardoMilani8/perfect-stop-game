/*
 * desenho.js — desenha a pista, o carro, os gráficos e a telemetria.
 *
 * Só lê o estado do jogo (fase, est, inspecao, resultado, definidos em
 * principal.js); não calcula física. A única conta usada daqui é
 * inclinacaoDaPista(), de fisica.js, para inclinar o carro na ladeira.
 */

/* ---------- Utilidades ---------- */

const $ = id => document.getElementById(id);

// m/s → km/h, arredondado
const kmh = v => Math.round(v * 3.6);

// número no formato brasileiro com c casas decimais ("—" se não houver valor)
const fmt = (v, c = 2) => {
  if (v == null || !isFinite(v)) return "—";
  if (Math.abs(v) < 0.5 * Math.pow(10, -c)) v = 0;   // evita "-0,00"
  return v.toLocaleString("pt-BR", { minimumFractionDigits: c, maximumFractionDigits: c });
};

// lê as cores e fontes do CSS (funciona no tema claro e no escuro)
const css = getComputedStyle(document.documentElement);
const cor = n => css.getPropertyValue(n).trim();

// ajusta o tamanho interno do canvas à tela (nítido em telas de alta densidade)
function prep(cv) {
  const dpr = window.devicePixelRatio || 1, r = cv.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// retângulo de cantos arredondados
function ret(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/* ---------- Pista vista de lado ---------- */

function desenharCena() {
  const { ctx, w, h } = prep($("cena"));
  const S0 = -6, S1 = fase.D + LIMITE_AVANCO;           // trecho visível da pista (m)
  const k = (w - 20) / (S1 - S0);                       // pixels por metro
  let hMin = 0;
  for (let s = S0; s <= S1; s += 0.5) hMin = Math.min(hMin, fase.h(s));
  const base = Math.min(h * 0.74 + hMin * k * 0.5, h - 46 + hMin * k);
  const X = s => 10 + (s - S0) * k, Y = s => base - fase.h(s) * k;   // metros → pixels
  const mono = cor("--font-mono"), disp = cor("--font-display");

  ctx.fillStyle = cor("--sky"); ctx.fillRect(0, 0, w, h);
  // chão
  ctx.fillStyle = cor("--ground"); ctx.beginPath(); ctx.moveTo(0, h);
  for (let s = S0; s <= S1 + 1; s += 0.5) ctx.lineTo(X(s), Y(s) + 10);
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  // pista (acompanha h(s))
  ctx.lineJoin = "round"; ctx.lineCap = "butt";
  ctx.strokeStyle = cor("--road"); ctx.lineWidth = 14; ctx.beginPath();
  for (let s = S0; s <= S1 + 1; s += 0.5) { const x = X(s), y = Y(s) + 5; s === S0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  ctx.stroke();
  ctx.strokeStyle = cor("--paint"); ctx.lineWidth = 2; ctx.setLineDash([10, 10]); ctx.beginPath();
  for (let s = S0; s <= S1 + 1; s += 0.5) { const x = X(s), y = Y(s) + 5; s === S0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  ctx.stroke(); ctx.setLineDash([]);
  // marcas de distância a cada 10 m
  ctx.save(); ctx.globalAlpha = 0.55;
  ctx.fillStyle = cor("--muted"); ctx.font = `10px ${mono}`; ctx.textAlign = "center"; ctx.textBaseline = "top";
  for (let s = 0; s <= S1; s += 10) {
    if (Math.abs(s - fase.D) < 4) continue;
    ctx.fillRect(X(s) - 0.5, Y(s) + 13, 1, 4);
    ctx.fillText(`${s} m`, X(s), Y(s) + 19);
  }
  ctx.restore();
  // faixa de parada e semáforo
  const xf = X(fase.D), yf = Y(fase.D);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(xf - 2, yf - 2, 4, 14);
  ctx.fillStyle = cor("--ink"); ctx.font = `600 12px ${mono}`;
  ctx.fillText(`${fase.D} m`, xf, yf + 21);
  const xp = xf + 14;
  ctx.fillStyle = "#2a2f36"; ctx.fillRect(xp - 2, yf - 92, 4, 92);
  ret(ctx, xp - 11, yf - 140, 22, 54, 5); ctx.fill();
  const luzes = ["#ff3b45", "#4a3d1c", "#1d3b2a"];
  luzes.forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(xp, yf - 128 + i * 16, 6, 0, Math.PI * 2); ctx.fill(); });
  ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = "#ff3b45"; ctx.beginPath(); ctx.arc(xp, yf - 128, 11, 0, Math.PI * 2); ctx.fill(); ctx.restore();

  // carro: a frente do carro é a posição s; inclina junto com a pista
  const Lp = Math.max(4.2 * k, 84), L = Lp / k, sc = est.s;
  const ang = Math.atan(inclinacaoDaPista(fase.h, sc - L / 2));
  const cx = X(sc - L / 2), cy = Y(sc - L / 2) - 2;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-ang);
  const Hp = Lp * 0.24;
  ctx.fillStyle = "#1f5fd1"; ctx.strokeStyle = "#161b22"; ctx.lineWidth = 1.5;
  ret(ctx, -Lp / 2, -Hp - 4, Lp, Hp, 4); ctx.fill(); ctx.stroke();
  ret(ctx, -Lp * 0.22, -Hp * 1.75 - 4, Lp * 0.5, Hp * 0.8, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#cfe3ff"; ret(ctx, -Lp * 0.17, -Hp * 1.65 - 4, Lp * 0.4, Hp * 0.55, 2); ctx.fill();
  ctx.fillStyle = "#161b22";
  [-Lp * 0.3, Lp * 0.3].forEach(x => { ctx.beginPath(); ctx.arc(x, -4, Math.max(4, Hp * 0.36), 0, Math.PI * 2); ctx.fill(); });
  // luz de freio: acende com o pedal
  const luz = est.rodando ? est.p : 0;
  ctx.fillStyle = luz > 0.05 ? "#ff2a35" : "#7a2a2e";
  ctx.fillRect(-Lp / 2 - 1, -Hp + 1, 4, Hp * 0.35);
  if (luz > 0.05) { ctx.globalAlpha = 0.25 + 0.5 * luz; ctx.beginPath(); ctx.arc(-Lp / 2, -Hp + 3, 10, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  // farol
  ctx.fillStyle = "#ffe48a"; ctx.fillRect(Lp / 2 - 3, -Hp + 1, 3, Hp * 0.3);
  ctx.restore();

  // velocidade acima do carro
  ctx.fillStyle = cor("--ink"); ctx.font = `700 15px ${disp}`; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
  ctx.fillText(`${kmh(est.v)} km/h`, cx, cy - Hp * 2 - 10);

  // erro final, abaixo da pista
  if (resultado && !resultado.avancou) {
    const xa = X(est.s), y0 = yf + 44;
    ctx.strokeStyle = resultado.ok ? cor("--ok") : cor("--bad"); ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xa, y0); ctx.lineTo(xf, y0); ctx.stroke();
    ctx.font = `600 13px ${mono}`; ctx.textBaseline = "top";
    ctx.fillText(`${resultado.erro > 0 ? "+" : "−"}${fmt(Math.abs(resultado.erro))} m`, (xa + xf) / 2, y0 + 5);
  }
}

/* ---------- Gráficos no tempo ---------- */

// Desenha a curva de uma grandeza (chave = "s", "v" ou "a") ao longo do tempo.
// opt.ref: linha tracejada horizontal (a faixa, no gráfico de posição)
// opt.inclinacao: grandeza que dá a inclinação da reta tangente
function grafico(id, chave, opt) {
  const { ctx, w, h } = prep($(id));
  ctx.clearRect(0, 0, w, h);
  const dados = est.hist;
  const tMax = Math.max(4, dados[dados.length - 1].t * 1.05);
  const vals = dados.map(p => p[chave]).concat(opt.ref != null ? [opt.ref] : [], 0);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 1e-6) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
  const P = { l: 36, r: 10, t: 8, b: 20 };                       // margens (px)
  const X = t => P.l + t / tMax * (w - P.l - P.r);
  const Y = v => h - P.b - (v - lo) / (hi - lo) * (h - P.t - P.b);
  const mono = cor("--font-mono");

  // grade
  ctx.strokeStyle = cor("--line"); ctx.lineWidth = 1; ctx.font = `11px ${mono}`; ctx.fillStyle = cor("--muted");
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  const passoT = tMax > 8 ? 2 : 1;
  for (let t = 0; t <= tMax; t += passoT) { ctx.beginPath(); ctx.moveTo(X(t), P.t); ctx.lineTo(X(t), h - P.b); ctx.stroke(); ctx.fillText(`${t}s`, X(t), h - P.b + 4); }
  ctx.textAlign = "right"; ctx.textBaseline = "middle";
  [lo + pad, hi - pad].forEach(v => ctx.fillText(fmt(v, 0), P.l - 5, Y(v)));
  if (lo < 0 && hi > 0) { ctx.strokeStyle = cor("--muted"); ctx.beginPath(); ctx.moveTo(P.l, Y(0)); ctx.lineTo(w - P.r, Y(0)); ctx.stroke(); }
  if (opt.ref != null) {
    ctx.strokeStyle = cor("--signal"); ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(P.l, Y(opt.ref)); ctx.lineTo(w - P.r, Y(opt.ref)); ctx.stroke(); ctx.setLineDash([]);
  }
  // curva
  ctx.fillStyle = cor("--accent"); ctx.globalAlpha = 0.1; ctx.beginPath(); ctx.moveTo(X(0), Y(Math.max(lo, Math.min(0, hi))));
  dados.forEach(p => ctx.lineTo(X(p.t), Y(p[chave]))); ctx.lineTo(X(dados[dados.length - 1].t), Y(Math.max(lo, Math.min(0, hi)))); ctx.fill();
  ctx.globalAlpha = 1; ctx.strokeStyle = cor("--accent"); ctx.lineWidth = 2.2; ctx.lineJoin = "round"; ctx.beginPath();
  dados.forEach((p, i) => i ? ctx.lineTo(X(p.t), Y(p[chave])) : ctx.moveTo(X(p.t), Y(p[chave]))); ctx.stroke();

  // instante mostrado (ao vivo ou inspecionado com o mouse)
  const p = dados[indiceAtual()];
  if (inspecao != null) { ctx.strokeStyle = cor("--muted"); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(p.t), P.t); ctx.lineTo(X(p.t), h - P.b); ctx.stroke(); ctx.setLineDash([]); }
  // reta tangente: a inclinação é a derivada naquele instante
  // (convertida de unidades do gráfico para pixels, com comprimento fixo de 2·46 px)
  if (opt.inclinacao) {
    const m = p[opt.inclinacao], sx = (w - P.l - P.r) / tMax, sy = (h - P.t - P.b) / (hi - lo);
    const dx = sx, dy = -m * sy, n = Math.hypot(dx, dy), L = 46;
    ctx.save(); ctx.beginPath(); ctx.rect(P.l, P.t, w - P.l - P.r, h - P.t - P.b); ctx.clip();
    ctx.strokeStyle = cor("--signal"); ctx.lineWidth = 2.5; ctx.beginPath();
    ctx.moveTo(X(p.t) - dx / n * L, Y(p[chave]) - dy / n * L); ctx.lineTo(X(p.t) + dx / n * L, Y(p[chave]) + dy / n * L); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = cor("--paint"); ctx.strokeStyle = "#161b22"; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.arc(X(p.t), Y(p[chave]), 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  return { P, tMax, w };
}

// índice do histórico mostrado: o último (ao vivo) ou o do instante inspecionado
function indiceAtual() {
  const d = est.hist;
  if (inspecao == null) return d.length - 1;
  let i = 0; while (i < d.length - 1 && d[i + 1].t <= inspecao) i++;
  return i;
}

/* ---------- Tudo de uma vez, a cada quadro ---------- */

let geo = null;   // geometria do gráfico, usada para converter o mouse em tempo
function desenhar() {
  desenharCena();
  geo = grafico("g-s", "s", { ref: fase.D, inclinacao: "vD" });
  grafico("g-v", "v", { inclinacao: "aD" });
  grafico("g-a", "a", {});
  const p = est.hist[indiceAtual()];
  // telemetria
  $("kmh").textContent = kmh(p.v);
  $("falta").textContent = fmt(fase.D - p.s, 1);
  $("t-t").textContent = fmt(p.t) + " s";
  $("t-s").textContent = fmt(p.s) + " m";
  $("t-v").textContent = fmt(p.vD) + " m/s";
  $("t-a").textContent = fmt(p.aD) + " m/s²";
  $("pedal").style.width = (p.p * 100) + "%";
  // só aparece quando o jogador passa o mouse nos gráficos
  $("instante").hidden = inspecao == null;
  if (inspecao != null) $("instante").textContent = `inspecionando t = ${fmt(p.t)} s`;
  // botão do freio enche conforme o pedal
  const pedalBotao = est.rodando ? est.p : 0;
  $("freio").style.setProperty("--p", pedalBotao);
  $("freio").classList.toggle("ativo", pedalBotao > 0.5);
}
