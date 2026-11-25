// relatorio.js — relatório de uma jogada, mostrado quando o carro para.

/* ---------- Números da jogada ---------- */

function montarRelatorio(hist, fase, resultado) {
  const ts = hist.map(p => p.t), vs = hist.map(p => p.v), as = hist.map(p => p.a);
  const fim = hist[hist.length - 1];
  const r = { fase, tTotal: fim.t, sTotal: fim.s, erro: resultado.erro, avancou: resultado.avancou };

  const iFreio = hist.findIndex(p => p.p > 0);
  if (iFreio >= 0) {
    const ini = hist[Math.max(0, iFreio - 1)];
    r.freio = {
      t: ini.t, falta: fase.D - ini.s, v: ini.v,
      duracao: fim.t - ini.t, distancia: fim.s - ini.s,
      desacelMedia: -taxaDeVariacaoMedia(ini.v, fim.v, ini.t, fim.t)
    };
  }
  r.desacelMax = -Math.min(...as);
  r.acelMax = Math.max(...as);

  r.vMedia = taxaDeVariacaoMedia(0, fim.s, 0, fim.t);

  let iMax = 0;
  vs.forEach((v, i) => { if (v > vs[iMax]) iMax = i; });
  r.vMax = vs[iMax]; r.tVMax = ts[iMax];

  r.erroDerivada = Math.max(...hist.slice(1).map(p => Math.abs(p.vD - p.v)));
  return r;
}

/* ---------- Linhas do cartão ---------- */

function linhasDoRelatorio(r) {
  const L = [];
  const add = (grupo, chave, rotulo, texto, num, unidade, nota) => L.push({ grupo, chave, rotulo, texto, num, unidade, nota });

  if (r.freio) {
    const f = r.freio;
    add("Freada", "tFreio", "Começou a frear em", `t = ${fmt(f.t)} s`, f.t, "s", `faltando ${fmt(f.falta, 1)} m para a faixa`);
    add("Freada", "vFreio", "Velocidade ao frear", `${fmt(f.v, 1)} m/s`, f.v, "m/s", `${kmh(f.v)} km/h`);
    add("Freada", "duracao", "Duração da freada", `${fmt(f.duracao)} s`, f.duracao, "s", null);
    add("Freada", "distFreio", "Distância de frenagem", `${fmt(f.distancia)} m`, f.distancia, "m", null);
    add("Freada", "desacelMedia", "Desaceleração média", `${fmt(f.desacelMedia)} m/s²`, f.desacelMedia, "m/s²",
      "taxa de variação média da velocidade na freada");
  } else {
    add("Freada", "tFreio", "Freio", "não freou", null, "", null);
  }
  add("Freada", "desacelMax", "Maior desaceleração", `${fmt(r.desacelMax)} m/s²`, r.desacelMax, "m/s²", "o valor mais negativo de a(t)");

  add("Velocidade e aceleração", "vMax", "Velocidade máxima", `${fmt(r.vMax)} m/s`, r.vMax, "m/s", `em t = ${fmt(r.tVMax)} s`);
  add("Velocidade e aceleração", "vMedia", "Velocidade média", `${fmt(r.vMedia)} m/s`, r.vMedia, "m/s",
    "taxa de variação média da posição: distância ÷ tempo");
  if (r.acelMax > 0.05) {
    add("Velocidade e aceleração", "acelMax", "Maior aceleração", `${fmt(r.acelMax)} m/s²`, r.acelMax, "m/s²", "a descida empurrando o carro");
  }
  add("Velocidade e aceleração", "erroDerivada", "Derivada numérica", `${fmt(r.erroDerivada, 3)} m/s`, r.erroDerivada, "m/s",
    "maior diferença entre a velocidade medida (Δs/Δt a cada quadro) e a da simulação");
  return L;
}

/* ---------- Cartão na tela ---------- */

function mostrarRelatorio(r, anterior) {
  const cartao = $("relatorio");
  cartao.hidden = !r;
  if (!r) return;
  const linhas = linhasDoRelatorio(r);
  const antes = anterior ? linhasDoRelatorio(anterior) : null;
  const grupos = [...new Set(linhas.map(l => l.grupo))];
  $("relatorio-corpo").classList.toggle("comparando", !!antes);

  $("relatorio-corpo").innerHTML = grupos.map(g => {
    const doGrupo = linhas.filter(l => l.grupo === g);
    const cab = antes ? `<tr><th></th><th>Esta</th><th>Anterior</th><th>Diferença</th></tr>` : "";
    const corpo = doGrupo.map(l => {
      const a = antes && antes.find(x => x.chave === l.chave);
      const nota = l.nota ? `<small>${l.nota}</small>` : "";
      let extra = "";
      if (antes) {
        const dif = a && l.num != null && a.num != null ? l.num - a.num : null;
        let txtDif = "";
        if (dif != null) {
          const n = fmt(Math.abs(dif));
          const sinal = n === fmt(0) ? "" : dif > 0 ? "+" : "−";
          txtDif = `${sinal}${n} ${l.unidade}`;
        }
        extra = `<td class="ant">${a ? a.texto : "—"}</td><td class="dif">${txtDif}</td>`;
      }
      return `<tr><th scope="row">${l.rotulo}${nota}</th><td>${l.texto}</td>${extra}</tr>`;
    }).join("");
    return `<div class="rel-grupo"><h3>${g}</h3><table>${cab}${corpo}</table></div>`;
  }).join("");
}
