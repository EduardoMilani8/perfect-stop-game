# 02 — Regras e física

Todos os valores abaixo são os usados no jogo (`js/fisica.js` e `js/fases.js`). Não mudar sem motivo.

## Regras

1. O carro parte de `s = 0` com a velocidade inicial da fase.
2. **Largar** (botão ou Enter) inicia a corrida. **Reiniciar** (botão ou R) volta à largada.
3. **Freio** (botão segurado, ou tecla espaço / seta para baixo): enquanto segura, o pedal
   `p(t)` sobe de 0 a 1 em 0,4 s; ao soltar, volta a 0 em 0,2 s.
4. O carro para quando `v` chega a 0. A **frente do carro** é a posição `s`.
5. Erro = `s_final − D` (D = posição da faixa). Positivo = passou da faixa.

| |erro| | Resultado |
|---|---|
| até 0,25 m | ★★★ |
| até 1 m | ★★ |
| até 2,5 m | ★ |
| mais que isso | "Errou" |
| carro passa de D + 12 m | "Avançou o sinal" |

## Fases

| Fase | v₀ | Faixa D | μ (aderência) | Terreno h(s) |
|---|---|---|---|---|
| 1 · Asfalto seco | 12 m/s (43 km/h) | 50 m | 1 | plano: h(s) = 0 |
| 2 · Pista molhada | 14 m/s (50 km/h) | 60 m | 0,5 | plano |
| 3 · Ladeira | 14 m/s (50 km/h) | 75 m | 1 | h(s) = 4·cos(π·s/60) − 4 para 0 < s < 120; 0 fora |

Conferido por simulação: todas as fases têm solução (começando a frear por volta de 3–4 s).

## Constantes

| Nome | Valor | Significado |
|---|---|---|
| `G` | 9,8 m/s² | gravidade |
| `FREIO_MAX` | 8 m/s² | desaceleração máxima do freio no seco |
| `C_AR` | 0,003 1/m | resistência do ar (multiplica v²) |
| `ROLAGEM` | 0,1 m/s² | atrito de rolagem |
| `PEDAL_SOBE` | 2,5 /s | quanto o pedal afunda por segundo |
| `PEDAL_DESCE` | 5 /s | quanto o pedal volta por segundo |
| `DT` | 1/120 s | passo de tempo (2 passos por quadro de 1/60 s) |

## As fórmulas

### Aceleração (não constante)

```
a(t) = − FREIO_MAX · μ · p(t)          ← depende do pedal (do jogador)
       − C_AR · v(t)²                   ← depende da velocidade
       − ROLAGEM
       − G · h′(s) / √(1 + h′(s)²)      ← depende da posição (só na ladeira)
```

O último termo é a componente da gravidade ao longo da pista: sen(θ) = h′/√(1 + h′²), com
θ = ângulo da pista. `h′(s)` é a **derivada da função da estrada**, calculada pela diferença
central: `h′(s) ≈ [h(s + ε) − h(s − ε)] / 2ε`, ε = 0,001.

### Atualização a cada passo Δt

```
p ← p ± velocidade_do_pedal · Δt        (limitado entre 0 e 1)
a ← a(s, v, p)
v ← v + a · Δt                          (se v ≤ 0: v = 0, fim)
s ← s + v · Δt
t ← t + Δt
```

### As derivadas mostradas (telemetria e gráficos)

A cada quadro, o jogo **mede** as derivadas a partir dos valores registrados:

```
v(t) = s′(t) ≈ [s(t) − s(t − Δt)] / Δt
a(t) = v′(t) ≈ [v(t) − v(t − Δt)] / Δt
```

São esses valores que aparecem na telemetria e que dão a inclinação das retas tangentes.

### Reta tangente nos gráficos

- No gráfico **s(t)**, a reta tangente no instante t₀ tem inclinação **v(t₀)**.
- No gráfico **v(t)**, a reta tangente no instante t₀ tem inclinação **a(t₀)**.
- Reta tangente: `y = f(t₀) + f′(t₀)·(t − t₀)`.
