# 04 — Arquitetura

HTML + CSS + JavaScript puro, sem bibliotecas, sem build. Desenho com `<canvas>`.

```
perfect-stop-game/
├── index.html
├── estilo.css
├── js/
│   ├── fisica.js      ★ toda a matemática (aberto no seminário)
│   ├── fases.js       dados das 3 fases e avaliação do resultado (estrelas)
│   ├── desenho.js     desenha a pista, o carro, os gráficos e a telemetria
│   └── principal.js   estado do jogo, botões, teclado e laço de animação
├── tests/
│   └── fisica.test.js
├── prototipo/
│   └── index.html     referência (não apagar)
└── docs/
```

Os arquivos compartilham funções como variáveis globais simples. `js/fisica.js` termina com
`if (typeof module !== "undefined") module.exports = { ... };` para os testes no Node.

## `js/fisica.js`

Somente funções puras e constantes, cada uma com a fórmula comentada:

```js
derivada(f, x)                         // f′(x) ≈ [f(x + ε) − f(x − ε)] / 2ε
derivadaNoTempo(atual, anterior, dt)   // (atual − anterior) / Δt
inclinacaoDaPista(h, s)                // h′(s)
componenteDaGravidade(h, s)            // −G · h′(s) / √(1 + h′(s)²)
aceleracao(s, v, p, fase)              // soma de freio, ar, rolagem e gravidade
atualizarPedal(p, segurando, dt)       // p ± velocidade · Δt, entre 0 e 1
passo(estado, segurando, fase, dt)     // pedal → a → v → s → t (ordem do doc 02)
```

## `js/principal.js` — laço de animação

A cada quadro (`requestAnimationFrame`): 2 chamadas de `passo` com `DT = 1/120`; depois mede
`v ≈ Δs/Δt` e `a ≈ Δv/Δt` com `derivadaNoTempo` e guarda no histórico `{t, s, v, a, p, vD, aD}`;
confere fim de fase; desenha.

## Testes (`node tests/fisica.test.js`)

| Teste | Esperado |
|---|---|
| `derivada(x => x*x, 3)` | ≈ 6 |
| `derivadaNoTempo(10, 4, 2)` | 3 |
| `componenteDaGravidade(s => 0, 10)` | 0 |
| `componenteDaGravidade(s => -s, 0)` (descida de 45°) | ≈ +6,93 |
| `aceleracao` sem freio, plano, v = 10 | ≈ −0,4 |
| simulação da fase 1 freando a partir de t = 3,77 s até parar | para a menos de 0,25 m da faixa |
| simulação de cada fase sem frear | passa da faixa |
