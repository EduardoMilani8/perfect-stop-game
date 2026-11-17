/*
 * relatorio.js — relatório de uma jogada, mostrado quando o carro para.
 *
 * montarRelatorio() junta os números a partir do histórico { t, s, v, a, p, vD, aD }
 * usando as contas de fisica.js (taxa de variação média, integral e cruzamentos).
 * mostrarRelatorio() escreve o cartão na tela. Sem equações: só números e frases.
 */

/* ---------- Números da jogada ---------- */

function montarRelatorio(hist, fase, resultado) {
  const ts = hist.map(p => p.t), vs = hist.map(p => p.v), as = hist.map(p => p.a);
  const fim = hist[hist.length - 1];
  const r = { fase, tTotal: fim.t, sTotal: fim.s, erro: resultado.erro, avancou: resultado.avancou };

  // freada: do primeiro instante com o pedal apertado até o fim
  const iFreio = hist.findIndex(p => p.p > 0);
  if (iFreio >= 0) {
    const ini = hist[iFreio];
    r.freio = {
      t: ini.t, falta: fase.D - ini.s, v: ini.v,
      duracao: fim.t - ini.t, distancia: fim.s - ini.s,
      desacelMedia: -taxaDeVariacaoMedia(ini.v, fim.v, ini.t, fim.t)
    };
  }
  r.desacelMax = -Math.min(...as);
  r.acelMax = Math.max(...as);

  // velocidade média e o instante do Teorema do Valor Médio (v instantânea = v média)
  r.vMedia = taxaDeVariacaoMedia(0, fim.s, 0, fim.t);
  const valorMedio = instantesOndeCruza(ts, vs, r.vMedia);
  r.tValorMedio = valorMedio.length ? valorMedio[0].t : null;

  // integral: área sob v(t) comparada com a distância
  r.area = integralTrapezios(ts, vs);

  // velocidade máxima; se não for no início, é onde a aceleração passa de + para − (ponto crítico)
  let iMax = 0;
  vs.forEach((v, i) => { if (v > vs[iMax]) iMax = i; });
  r.vMax = vs[iMax]; r.tVMax = ts[iMax]; r.vMaxNoInicio = iMax === 0;
  const zeros = instantesOndeCruza(ts, as, 0).filter(z => !z.sobe);
  r.tPontoCritico = zeros.length
    ? zeros.reduce((m, z) => Math.abs(z.t - r.tVMax) < Math.abs(m.t - r.tVMax) ? z : m).t
    : null;

  // concavidade de s(t): trechos com a < 0 (para baixo) e a > 0 (para cima)
  const cortes = [0, ...instantesOndeCruza(ts, as, 0).map(z => z.t), fim.t];
  r.concavidade = [];
  for (let i = 0; i + 1 < cortes.length; i++) {
    const meio = (cortes[i] + cortes[i + 1]) / 2;
    const j = ts.findIndex(t => t >= meio);
    const trecho = { t0: cortes[i], t1: cortes[i + 1], paraBaixo: as[j] < 0 };
    const ultimo = r.concavidade[r.concavidade.length - 1];
    if (ultimo && ultimo.paraBaixo === trecho.paraBaixo) ultimo.t1 = trecho.t1;
    else if (trecho.t1 - trecho.t0 > 0.02) r.concavidade.push(trecho);   // ignora trechos minúsculos
  }

  // precisão da derivada numérica: Δs/Δt medido × velocidade da simulação
  r.erroDerivada = Math.max(...hist.slice(1).map(p => Math.abs(p.vD - p.v)));
  return r;
}

/* ---------- Linhas do cartão ---------- */
// Cada linha: { chave, grupo, rotulo, texto, num, unidade, nota }.
// num é o valor usado para comparar com a jogada anterior (null = não compara).

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

  add("Velocidade e aceleração", "vMax", "Velocidade máxima", `${fmt(r.vMax)} m/s`, r.vMax, "m/s",
    r.vMaxNoInicio
      ? "em t = 0: v(t) só diminui, então o máximo fica no extremo do intervalo"
      : r.tPontoCritico != null
        ? `em t = ${fmt(r.tVMax)} s, onde a(t) passa por zero: ponto crítico de v(t)`
        : `em t = ${fmt(r.tVMax)} s`);
  add("Velocidade e aceleração", "vMedia", "Velocidade média", `${fmt(r.vMedia)} m/s`, r.vMedia, "m/s", "distância percorrida ÷ tempo total");
  if (r.acelMax > 0.05) {
    add("Velocidade e aceleração", "acelMax", "Maior aceleração", `${fmt(r.acelMax)} m/s²`, r.acelMax, "m/s²", "a descida empurrando o carro");
  }

  add("Conceitos de Cálculo", "tvm", "Teorema do Valor Médio",
    r.tValorMedio != null ? `t = ${fmt(r.tValorMedio)} s` : "—", r.tValorMedio, "s",
    `instante em que a velocidade instantânea foi igual à média (${fmt(r.vMedia)} m/s)`);
  add("Conceitos de Cálculo", "area", "Área sob v(t)", `${fmt(r.area)} m`, r.area, "m",
    `distância percorrida: ${fmt(r.sTotal)} m — a integral da velocidade dá a posição`);
  add("Conceitos de Cálculo", "concavidade", "Concavidade de s(t)", textoConcavidade(r.concavidade, r.tTotal), null, "",
    "para baixo onde a aceleração é negativa, para cima onde é positiva");
  add("Conceitos de Cálculo", "erroDerivada", "Derivada numérica", `${fmt(r.erroDerivada, 3)} m/s`, r.erroDerivada, "m/s",
    "maior diferença entre a velocidade medida (distância ÷ tempo a cada quadro) e a da simulação");
  return L;
}

function textoConcavidade(trechos, tTotal) {
  if (trechos.length === 1) return trechos[0].paraBaixo ? "para baixo na jogada toda" : "para cima na jogada toda";
  return trechos.map(c => `${c.paraBaixo ? "para baixo" : "para cima"}: ${fmt(c.t0, 1)}–${fmt(c.t1, 1)} s`).join("<br>");
}

/* ---------- Cartão na tela ---------- */

// anterior: relatório da jogada anterior, para comparar (ou null)
function mostrarRelatorio(r, anterior) {
  const cartao = $("relatorio");
  cartao.hidden = !r;
  if (!r) return;
  const linhas = linhasDoRelatorio(r);
  const antes = anterior ? linhasDoRelatorio(anterior) : null;
  const grupos = [...new Set(linhas.map(l => l.grupo))];

  $("relatorio-corpo").innerHTML = grupos.map(g => {
    const doGrupo = linhas.filter(l => l.grupo === g);
    const cab = antes ? `<tr><th></th><th>Esta</th><th>Anterior</th><th>Diferença</th></tr>` : "";
    const corpo = doGrupo.map(l => {
      const a = antes && antes.find(x => x.chave === l.chave);
      const nota = l.nota ? `<small>${l.nota}</small>` : "";
      let extra = "";
      if (antes) {
        const dif = a && l.num != null && a.num != null ? l.num - a.num : null;
        extra = `<td class="ant">${a ? a.texto : "—"}</td>` +
                `<td class="dif">${dif == null ? "" : `${dif > 0 ? "+" : dif < 0 ? "−" : ""}${fmt(Math.abs(dif))} ${l.unidade}`}</td>`;
      }
      return `<tr><th scope="row">${l.rotulo}${nota}</th><td>${l.texto}</td>${extra}</tr>`;
    }).join("");
    return `<div class="rel-grupo"><h3>${g}</h3><table>${cab}${corpo}</table></div>`;
  }).join("");
}
