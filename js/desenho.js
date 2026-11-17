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

// etiqueta arredondada com texto, centrada em x, com o meio na altura y
function etiqueta(ctx, texto, x, y, corTexto, fonte) {
  ctx.font = fonte; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const larg = ctx.measureText(texto).width + 16, alt = 22;
  ctx.save();
  ctx.shadowColor = "rgba(22, 27, 34, 0.18)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 1;
  ctx.fillStyle = "#ffffff"; ret(ctx, x - larg / 2, y - alt / 2, larg, alt, alt / 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = corTexto; ctx.fillText(texto, x, y + 0.5);
}

/* ---------- Pista vista de lado ---------- */

function desenharCena() {
  const { ctx, w, h } = prep($("cena"));
  // Escala: s = 0 fica a uma distância da borda que cabe o carro inteiro na largada
  const S1 = fase.D + LIMITE_AVANCO;                    // fim do trecho visível (m)
  const Lp = Math.min(150, Math.max(84, w * 0.12));     // comprimento do carro (px), só visual
  const x0 = Lp + 16;                                   // posição de s = 0 na tela (px)
  const k = (w - x0 - 10) / S1;                         // pixels por metro
  const S0 = -x0 / k;                                   // começo do trecho visível (m)
  let hMin = 0;
  for (let s = S0; s <= S1; s += 0.5) hMin = Math.min(hMin, fase.h(s));
  // altura da pista: embaixo dela precisa caber o meio-fio, as marcas e a etiqueta do erro (~80 px)
  const base = Math.min(h * 0.72 + hMin * k * 0.5, h - 82 + hMin * k);
  const X = s => (s - S0) * k, Y = s => base - fase.h(s) * k;        // metros → pixels
  const mono = cor("--font-mono");

  const cen = CENARIOS[indiceFase];                     // aparência da fase atual
  const tempo = movimentoReduzido.matches ? 0 : performance.now() / 1000;   // para nuvens e chuva
  desenharFundo(ctx, w, h, base, cen, tempo);
  desenharPista(ctx, w, h, X, Y, S0 - 1, S0 + w / k + 1, cen);   // de borda a borda

  // marcas de distância a cada 10 m
  ctx.save(); ctx.globalAlpha = 0.55;
  ctx.fillStyle = cor("--muted"); ctx.font = `10px ${mono}`; ctx.textAlign = "center"; ctx.textBaseline = "top";
  const passoRotulo = 10 * k < 44 ? 20 : 10;           // tela estreita: rótulo a cada 20 m
  for (let s = 0; s <= S1; s += 10) {
    if (Math.abs(X(s) - X(fase.D)) < 30) continue;   // não encosta no rótulo da faixa
    ctx.fillRect(X(s) - 0.5, Y(s) + 19, 1, 4);
    if (s % passoRotulo === 0) ctx.fillText(`${s} m`, X(s), Y(s) + 25);
  }
  ctx.restore();

  // faixa de parada (zebrada) e semáforo
  const xf = X(fase.D), yf = Y(fase.D);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 ? "#2a2f36" : "#ffffff";
    ctx.fillRect(xf - 2.5, yf - 2 + i * 3.5, 5, 3.5);
  }
  ctx.fillStyle = cor("--ink"); ctx.font = `600 12px ${mono}`; ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText(`${fase.D} m`, xf, yf + 25);
  desenharSemaforo(ctx, xf + 14, yf, resultado && resultado.ok);

  // carro (e, se estiver comparando, o carro fantasma da jogada anterior)
  desenharMarcasDePneu(ctx, X, Y, Lp / k);
  if (referencia) {
    const r = amostraNoInstante(referencia.hist, est.t);
    ctx.save(); ctx.globalAlpha = 0.35;
    desenharCarro(ctx, X, Y, k, Lp, { s: r.s, p: r.p, a: r.a, rodando: true });
    ctx.restore();
  }
  const topo = desenharCarro(ctx, X, Y, k, Lp, est);

  // velocidade acima do carro
  if (cen.chuva) desenharChuva(ctx, w, h, tempo);
  etiqueta(ctx, `${kmh(est.v)} km/h`, topo.x, topo.y - 8, cor("--ink"), `700 15px ${cor("--font-display")}`);

  // erro final, abaixo da pista
  if (resultado && !resultado.avancou) {
    const xa = X(est.s), y0 = yf + 46;
    const corErro = resultado.ok ? cor("--ok") : cor("--bad");
    ctx.strokeStyle = corErro; ctx.fillStyle = corErro; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xa, y0); ctx.lineTo(xf, y0); ctx.stroke();
    [xa, xf].forEach(x => ctx.fillRect(x - 1, y0 - 6, 2, 12));       // limites: frente do carro e faixa
    if (Math.abs(xf - xa) > 14) {                                      // setas, se houver espaço
      const dir = Math.sign(xf - xa);
      [[xa, dir], [xf, -dir]].forEach(([x, d]) => {
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + 6 * d, y0 - 4); ctx.lineTo(x + 6 * d, y0 + 4); ctx.closePath(); ctx.fill();
      });
    }
    etiqueta(ctx, `${resultado.erro > 0 ? "+" : "−"}${fmt(Math.abs(resultado.erro))} m`, (xa + xf) / 2, y0 + 18, corErro, `600 13px ${mono}`);
  }
}

/* ---------- Cenário de cada fase (só aparência, não entra na física) ---------- */

const CENARIOS = [
  { // 1 · Asfalto seco: dia de sol na cidade
    ceuTopo: "#7fb8ec", ceuBase: "#dcecf8", sol: { x: 0.5, y: 0.2, raio: 20, cor: "#ffd84a" },
    nuvens: "#ffffff", fundo: "cidade", corFundo: "#c3d2e1", morro: "#b5cb9f", altMorro: 1,
    chao: "#c4d4ae", asfalto: "#3a3f46", chuva: false
  },
  { // 2 · Pista molhada: dia de chuva, asfalto escuro com poças
    ceuTopo: "#7d8894", ceuBase: "#c3cad2", sol: null,
    nuvens: "#9aa4ae", fundo: "cidade", corFundo: "#a3aeb9", morro: "#9aae92", altMorro: 1,
    chao: "#a7b8a0", asfalto: "#2a2e34", chuva: true
  },
  { // 3 · Ladeira: fim de tarde no interior
    ceuTopo: "#f29a62", ceuBase: "#fde4c3", sol: { x: 0.7, y: 0.62, raio: 30, cor: "#ffb257" },
    nuvens: "#ffd9c2", fundo: "arvores", corFundo: "#7f9a5c", morro: "#a9bf83", altMorro: 1.8,
    chao: "#bccb91", asfalto: "#3a3f46", chuva: false
  }
];

const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");

// posições fixas (fração da tela) para os enfeites não "tremerem" a cada quadro
const PREDIOS = [   // [x, largura, altura]
  [0.03, 0.05, 0.34], [0.085, 0.035, 0.46], [0.13, 0.06, 0.28], [0.21, 0.04, 0.40],
  [0.56, 0.05, 0.30], [0.62, 0.03, 0.50], [0.66, 0.06, 0.36], [0.80, 0.04, 0.44], [0.86, 0.07, 0.26]
];
const ARVORES = [   // [x, tamanho]
  [0.04, 1], [0.08, 0.7], [0.15, 1.2], [0.19, 0.8], [0.33, 0.9], [0.45, 1.1], [0.49, 0.7],
  [0.6, 1], [0.64, 1.3], [0.76, 0.8], [0.88, 1.1], [0.93, 0.75]
];
const NUVENS = [    // [x, altura, tamanho, velocidade em px/s]
  [0.1, 0.16, 1, 6], [0.38, 0.1, 0.8, 4], [0.62, 0.22, 1.2, 5], [0.9, 0.12, 0.9, 7]
];

// Céu, sol, nuvens, cidade ou árvores e morros
function desenharFundo(ctx, w, h, base, cen, tempo) {
  const ceu = ctx.createLinearGradient(0, 0, 0, base);
  ceu.addColorStop(0, cen.ceuTopo); ceu.addColorStop(1, cen.ceuBase);
  ctx.fillStyle = ceu; ctx.fillRect(0, 0, w, h);

  if (cen.sol) {
    const { x, y, raio, cor: c } = cen.sol, sx = x * w, sy = y * base;
    const brilho = ctx.createRadialGradient(sx, sy, raio * 0.6, sx, sy, raio * 3);
    brilho.addColorStop(0, c + "88"); brilho.addColorStop(1, c + "00");
    ctx.fillStyle = brilho; ctx.beginPath(); ctx.arc(sx, sy, raio * 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(sx, sy, raio, 0, Math.PI * 2); ctx.fill();
  }

  // nuvens andando devagar; na chuva ficam maiores e mais baixas
  const n = cen.chuva ? 1.6 : 1;
  NUVENS.forEach(([x, y, t, vel]) => {
    const larg = w + 240, nx = ((x * w + tempo * vel) % larg + larg) % larg - 120;
    desenharNuvem(ctx, nx, y * base * (cen.chuva ? 0.8 : 1), 22 * t * n, cen.nuvens);
  });
  if (cen.chuva) {
    NUVENS.forEach(([x, y, t, vel]) => {      // segunda camada, para o céu ficar fechado
      const larg = w + 240, nx = ((x * w + 0.5 * w + tempo * vel * 0.6) % larg + larg) % larg - 120;
      desenharNuvem(ctx, nx, y * base * 0.5, 26 * t, "#8a949f");
    });
  }

  ctx.fillStyle = cen.corFundo;
  if (cen.fundo === "cidade") {
    PREDIOS.forEach(([x, l, a]) => {
      const alto = a * base;
      ctx.fillRect(x * w, base - alto, l * w, alto);
    });
  }

  const a = cen.altMorro;
  ctx.fillStyle = cen.morro; ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 8) {
    ctx.lineTo(x, base - 26 * a - 16 * a * Math.sin(x / w * 5.3) - 8 * a * Math.sin(x / w * 13 + 1));
  }
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill();

  if (cen.fundo === "arvores") {
    ARVORES.forEach(([x, t]) => {
      const ax = x * w, chao = base - 26 * a - 16 * a * Math.sin(x * 5.3) - 8 * a * Math.sin(x * 13 + 1) + 6;
      const alt = 34 * t;
      ctx.fillStyle = "#6b5a45"; ctx.fillRect(ax - 1.5, chao - alt * 0.35, 3, alt * 0.35);
      ctx.fillStyle = cen.corFundo;
      ctx.beginPath(); ctx.moveTo(ax, chao - alt); ctx.lineTo(ax + alt * 0.32, chao - alt * 0.3); ctx.lineTo(ax - alt * 0.32, chao - alt * 0.3); ctx.closePath(); ctx.fill();
    });
  }
}

// nuvem feita de círculos
function desenharNuvem(ctx, x, y, r, c) {
  ctx.fillStyle = c; ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 1.1, y + r * 0.2, r * 0.8, 0, Math.PI * 2);
  ctx.arc(x - r * 1.1, y + r * 0.25, r * 0.7, 0, Math.PI * 2);
  ctx.arc(x + r * 0.3, y - r * 0.5, r * 0.75, 0, Math.PI * 2);
  ctx.fill();
}

// chuva: 90 gotas em posições fixas, descendo e indo um pouco para a esquerda com o tempo
function desenharChuva(ctx, w, h, tempo) {
  const larg = w + 60, alt = h + 20;
  ctx.strokeStyle = "rgba(225, 235, 245, 0.6)"; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let i = 0; i < 90; i++) {
    const x0 = ((i * 0.618034) % 1) * larg, y0 = ((i * 0.414214) % 1) * alt;
    const y = (y0 + tempo * 420) % alt - 10;
    const x = ((x0 - tempo * 84) % larg + larg) % larg - 30;
    ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 14);
  }
  ctx.stroke();
}

// Chão e asfalto acompanhando h(s), de sIni a sFim (metros)
function desenharPista(ctx, w, h, X, Y, sIni, sFim, cen) {
  const caminho = desloc => {
    ctx.beginPath();
    for (let s = sIni; s <= sFim; s += 0.5) { const x = X(s), y = Y(s) + desloc; s === sIni ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  };
  ctx.fillStyle = cen.chao; ctx.beginPath(); ctx.moveTo(0, h);
  for (let s = sIni; s <= sFim; s += 0.5) ctx.lineTo(X(s), Y(s) + 10);
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill();

  ctx.lineJoin = "round"; ctx.lineCap = "butt";
  ctx.strokeStyle = "#c3c8ce"; ctx.lineWidth = 5; caminho(14); ctx.stroke();                     // meio-fio
  ctx.strokeStyle = "rgba(22,27,34,0.18)"; ctx.lineWidth = 1; caminho(16.5); ctx.stroke();        // sombra do meio-fio
  ctx.strokeStyle = cen.asfalto; ctx.lineWidth = 14; caminho(5); ctx.stroke();
  if (cen.chuva) {                                      // poças refletindo o céu
    ctx.strokeStyle = "rgba(190, 210, 230, 0.45)"; ctx.lineWidth = 3; ctx.lineCap = "round";
    [-3, 8, 21, 29, 44, 57, 68].forEach(s0 => {
      ctx.beginPath(); ctx.moveTo(X(s0), Y(s0) + 1); ctx.lineTo(X(s0 + 2.5), Y(s0 + 2.5) + 1); ctx.stroke();
    });
    ctx.lineCap = "butt";
  }
  ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1.5; caminho(-1.5); ctx.stroke();   // borda iluminada
  ctx.strokeStyle = cor("--paint"); ctx.lineWidth = 2; ctx.setLineDash([10, 10]); caminho(5); ctx.stroke(); ctx.setLineDash([]);
}

// Semáforo: vermelho; fica verde quando o carro para com estrelas
function desenharSemaforo(ctx, xp, yf, verde) {
  ctx.fillStyle = "#2a2f36"; ctx.fillRect(xp - 2, yf - 92, 4, 92);
  ret(ctx, xp - 12, yf - 141, 24, 56, 6); ctx.fill();
  const acesas = ["#ff3b45", "#ffb020", "#2ee07a"], apagadas = ["#4a1d22", "#4a3d1c", "#1d3b2a"];
  const ligada = verde ? 2 : 0;
  acesas.forEach((c, i) => {
    const y = yf - 128 + i * 16;
    if (i === ligada) {
      const brilho = ctx.createRadialGradient(xp, y, 2, xp, y, 24);
      brilho.addColorStop(0, c + "99"); brilho.addColorStop(1, c + "00");
      ctx.fillStyle = brilho; ctx.beginPath(); ctx.arc(xp, y, 24, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = i === ligada ? c : apagadas[i];
    ctx.beginPath(); ctx.arc(xp, y, 6, 0, Math.PI * 2); ctx.fill();
  });
}

// Marcas de pneu no asfalto por onde as rodas passaram com o freio acima de 80%
function desenharMarcasDePneu(ctx, X, Y, L) {
  const d = est.hist;
  ctx.strokeStyle = "rgba(8,9,11,0.85)"; ctx.lineWidth = 3.5; ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 1; i < d.length; i++) {
    if (d[i].p < 0.8) continue;
    [0.2 * L, 0.8 * L].forEach(atras => {             // roda da frente e roda de trás
      const a = d[i - 1].s - atras, b = d[i].s - atras;
      ctx.moveTo(X(a), Y(a) + 1); ctx.lineTo(X(b), Y(b) + 1);
    });
  }
  ctx.stroke(); ctx.lineCap = "butt";
}

// amostra de um histórico no instante t (a última com tempo ≤ t)
function amostraNoInstante(hist, t) {
  let i = 0;
  while (i < hist.length - 1 && hist[i + 1].t <= t) i++;
  return hist[i];
}

// Carro de lado. A frente do carro é a posição s; ele inclina junto com a pista.
// carro = { s, p, a, rodando }. Devolve o ponto acima do teto, onde vai o texto da velocidade.
function desenharCarro(ctx, X, Y, k, Lp, carro) {
  const L = Lp / k, sc = carro.s;
  const ang = Math.atan(inclinacaoDaPista(fase.h, sc - L / 2));
  const cx = X(sc - L / 2), cy = Y(sc - L / 2) - 2;
  const H = Lp * 0.24, chao = -4;                       // altura da carroceria e linha das rodas
  const raio = Math.max(4, H * 0.36);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-ang);

  // sombra
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath(); ctx.ellipse(0, chao + raio - 1, Lp * 0.52, 3, 0, 0, Math.PI * 2); ctx.fill();

  // ao frear, a carroceria "mergulha" o nariz, proporcional à desaceleração (só visual)
  const mergulho = carro.rodando ? Math.min(0.07, Math.max(0, (-carro.a - 1) * 0.009)) : 0;
  ctx.save(); ctx.translate(0, chao); ctx.rotate(mergulho); ctx.translate(0, -chao);

  // carroceria com degradê
  const tinta = ctx.createLinearGradient(0, chao - 1.75 * H, 0, chao);
  tinta.addColorStop(0, "#4c8bf5"); tinta.addColorStop(0.55, "#1f5fd1"); tinta.addColorStop(1, "#1747a0");
  ctx.fillStyle = tinta; ctx.strokeStyle = "#161b22"; ctx.lineWidth = 1.5; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-0.5 * Lp, chao - 0.12 * H);
  ctx.lineTo(-0.5 * Lp, chao - 0.78 * H);
  ctx.quadraticCurveTo(-0.5 * Lp, chao - H, -0.44 * Lp, chao - H);      // traseira
  ctx.lineTo(-0.3 * Lp, chao - H);
  ctx.lineTo(-0.2 * Lp, chao - 1.72 * H);                                // vidro de trás
  ctx.quadraticCurveTo(-0.17 * Lp, chao - 1.78 * H, -0.12 * Lp, chao - 1.78 * H);
  ctx.lineTo(0.08 * Lp, chao - 1.78 * H);                                // teto
  ctx.quadraticCurveTo(0.12 * Lp, chao - 1.78 * H, 0.15 * Lp, chao - 1.7 * H);
  ctx.lineTo(0.27 * Lp, chao - H);                                       // para-brisa
  ctx.lineTo(0.43 * Lp, chao - 0.9 * H);                                 // capô
  ctx.quadraticCurveTo(0.5 * Lp, chao - 0.86 * H, 0.5 * Lp, chao - 0.55 * H);
  ctx.lineTo(0.5 * Lp, chao - 0.12 * H);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // vidros
  ctx.fillStyle = "#cfe3ff";
  ctx.beginPath();
  ctx.moveTo(-0.26 * Lp, chao - 1.06 * H); ctx.lineTo(-0.175 * Lp, chao - 1.64 * H);
  ctx.lineTo(0.09 * Lp, chao - 1.64 * H); ctx.lineTo(0.21 * Lp, chao - 1.06 * H);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#1f5fd1"; ctx.lineWidth = 3;                         // coluna entre as janelas
  ctx.beginPath(); ctx.moveTo(-0.03 * Lp, chao - 1.66 * H); ctx.lineTo(-0.03 * Lp, chao - 1.04 * H); ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 1;                // porta
  ctx.beginPath(); ctx.moveTo(-0.03 * Lp, chao - H); ctx.lineTo(-0.03 * Lp, chao - 0.2 * H); ctx.stroke();

  // luz de freio: acende com o pedal
  const luz = carro.rodando ? carro.p : 0;
  ctx.fillStyle = luz > 0.05 ? "#ff2a35" : "#7a2a2e";
  ctx.fillRect(-0.5 * Lp - 1, chao - 0.85 * H, 4, H * 0.3);
  if (luz > 0.05) {
    const brilho = ctx.createRadialGradient(-0.5 * Lp, chao - 0.7 * H, 1, -0.5 * Lp, chao - 0.7 * H, 16);
    brilho.addColorStop(0, `rgba(255,42,53,${0.3 + 0.5 * luz})`); brilho.addColorStop(1, "rgba(255,42,53,0)");
    ctx.fillStyle = brilho; ctx.beginPath(); ctx.arc(-0.5 * Lp, chao - 0.7 * H, 16, 0, Math.PI * 2); ctx.fill();
  }
  // farol
  ctx.fillStyle = "#ffe48a"; ctx.fillRect(0.5 * Lp - 3, chao - 0.78 * H, 3, H * 0.26);
  ctx.restore();   // fim do mergulho: as rodas continuam no chão

  // rodas: giram o ângulo θ = s / r (rolar sem deslizar)
  const giro = (sc * k) / raio;
  [-0.3 * Lp, 0.3 * Lp].forEach(x => {
    ctx.fillStyle = "#161b22"; ctx.beginPath(); ctx.arc(x, chao, raio, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#9aa4ae"; ctx.beginPath(); ctx.arc(x, chao, raio * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#5d6773"; ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const th = giro + i * 2 * Math.PI / 5;
      ctx.beginPath(); ctx.moveTo(x, chao); ctx.lineTo(x + Math.cos(th) * raio * 0.52, chao + Math.sin(th) * raio * 0.52); ctx.stroke();
    }
    ctx.fillStyle = "#161b22"; ctx.beginPath(); ctx.arc(x, chao, raio * 0.14, 0, Math.PI * 2); ctx.fill();
  });

  ctx.restore();
  return { x: cx, y: cy - H * 2 - 10 };
}

/* ---------- Gráficos no tempo ---------- */

// Desenha a curva de uma grandeza (chave = "s", "v" ou "a") ao longo do tempo.
// opt.ref: linha tracejada horizontal (a faixa, no gráfico de posição)
// opt.inclinacao: grandeza que dá a inclinação da reta tangente
function grafico(id, chave, opt) {
  const { ctx, w, h } = prep($(id));
  ctx.clearRect(0, 0, w, h);
  const dados = est.hist, ant = referencia ? referencia.hist : null;
  const tFim = Math.max(dados[dados.length - 1].t, ant ? ant[ant.length - 1].t : 0);
  const tMax = Math.max(4, tFim * 1.05);
  const vals = dados.map(p => p[chave]).concat(ant ? ant.map(p => p[chave]) : [], opt.ref != null ? [opt.ref] : [], 0);
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
  // curva da jogada anterior (comparação), tracejada
  if (ant) {
    ctx.strokeStyle = cor("--muted"); ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]); ctx.beginPath();
    ant.forEach((p, i) => i ? ctx.lineTo(X(p.t), Y(p[chave])) : ctx.moveTo(X(p.t), Y(p[chave]))); ctx.stroke();
    ctx.setLineDash([]);
  }
  // curva
  ctx.fillStyle = cor("--accent"); ctx.globalAlpha = 0.1; ctx.beginPath(); ctx.moveTo(X(0), Y(Math.max(lo, Math.min(0, hi))));
  dados.forEach(p => ctx.lineTo(X(p.t), Y(p[chave]))); ctx.lineTo(X(dados[dados.length - 1].t), Y(Math.max(lo, Math.min(0, hi)))); ctx.fill();
  ctx.globalAlpha = 1; ctx.strokeStyle = cor("--accent"); ctx.lineWidth = 2.2; ctx.lineJoin = "round"; ctx.beginPath();
  dados.forEach((p, i) => i ? ctx.lineTo(X(p.t), Y(p[chave])) : ctx.moveTo(X(p.t), Y(p[chave]))); ctx.stroke();

  if (opt.destaques) desenharDestaques(ctx, opt.destaques, X, Y, P, w, h);

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

// Destaques do relatório: linhas verticais (instantes), horizontais (valores) e pontos marcados
function desenharDestaques(ctx, d, X, Y, P, w, h) {
  const roxo = cor("--destaque"), mono = cor("--font-mono");   // cor das marcas
  ctx.save();
  ctx.strokeStyle = roxo; ctx.fillStyle = roxo; ctx.lineWidth = 1.2; ctx.font = `600 10px ${mono}`;
  ctx.setLineDash([4, 3]);
  (d.verticais || []).forEach(({ t, rotulo }) => {
    ctx.beginPath(); ctx.moveTo(X(t), P.t); ctx.lineTo(X(t), h - P.b); ctx.stroke();
    ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillText(rotulo, X(t) + 3, h - P.b - 2);
  });
  (d.horizontais || []).forEach(({ y }) => {
    ctx.beginPath(); ctx.moveTo(P.l, Y(y)); ctx.lineTo(w - P.r, Y(y)); ctx.stroke();
  });
  ctx.setLineDash([]);
  (d.pontos || []).forEach(({ t, y, rotulo, embaixo }) => {
    ctx.beginPath(); ctx.arc(X(t), Y(y), 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = "center"; ctx.textBaseline = embaixo ? "top" : "bottom";
    ctx.fillText(rotulo, X(t), Y(y) + (embaixo ? 5 : -5));
  });
  ctx.restore();
}

// índice do histórico mostrado: o último (ao vivo) ou o do instante inspecionado
function indiceAtual() {
  const d = est.hist;
  if (inspecao == null) return d.length - 1;
  return d.indexOf(amostraNoInstante(d, inspecao));
}

// Depois da jogada, marca nos gráficos o que o relatório aponta
function destaquesDoRelatorio() {
  if (!relatorio || est.rodando) return null;
  const r = relatorio;
  const freio = r.freio ? [{ t: r.freio.t, rotulo: "freio" }] : [];   // instante em que o pedal começou a descer
  const v = { verticais: freio, pontos: [{ t: r.tVMax, y: r.vMax, rotulo: "máx" }] };
  if (r.tValorMedio != null) {
    v.horizontais = [{ y: r.vMedia }];
    v.pontos.push({ t: r.tValorMedio, y: r.vMedia, rotulo: "média", embaixo: true });
  }
  const a = { verticais: freio, pontos: [] };
  if (r.tPontoCritico != null) a.pontos.push({ t: r.tPontoCritico, y: 0, rotulo: "zero", embaixo: true });
  return { s: { verticais: freio }, v, a };
}

/* ---------- Tudo de uma vez, a cada quadro ---------- */

let geo = null;   // geometria do gráfico, usada para converter o mouse em tempo
function desenhar() {
  desenharCena();
  const d = destaquesDoRelatorio();
  geo = grafico("g-s", "s", { ref: fase.D, inclinacao: "vD", destaques: d && d.s });
  grafico("g-v", "v", { inclinacao: "aD", destaques: d && d.v });
  grafico("g-a", "a", { destaques: d && d.a });
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
