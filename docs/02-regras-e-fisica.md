# 02 — Regras e física

Todos os valores abaixo são os usados no jogo (`js/fisica.js` e `js/fases.js`). Não mudar sem motivo.
A física foi simplificada em 23/11/2026 para seguir as fórmulas das aulas de derivadas: a
aceleração ficou só com freio e ladeira (saíram a resistência do ar e o atrito de rolagem).

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

Conferido por simulação: todas as fases têm solução (segurando o freio a partir de
≈ 3,2 s na fase 1, ≈ 2,3 s na fase 2 e ≈ 3,2 s na fase 3).

## Constantes

| Nome | Valor | Significado |
|---|---|---|
| `G` | 9,8 m/s² | gravidade |
| `FREIO_MAX` | 8 m/s² | desaceleração máxima do freio no seco |
| `PEDAL_SOBE` | 2,5 /s | quanto o pedal afunda por segundo |
| `PEDAL_DESCE` | 5 /s | quanto o pedal volta por segundo |
| `DT` | 1/120 s | passo de tempo Δt (2 passos por quadro de 1/60 s) |
| `DX` | 0,001 m | Δx bem pequeno da derivada numérica |

## As fórmulas

Todas seguem o conteúdo de derivadas da disciplina (apostilas Derivadas 1, 2 e 3).

### s, v e a estão ligadas por derivadas (3.8 e 3.9)

```
v(t) = s′(t)          a(t) = v′(t) = s″(t)
```

### Taxa de variação média e derivada (3.1, 3.2 e 3.9)

```
taxa média = Δy/Δx = [f(x₂) − f(x₁)] / (x₂ − x₁)        ← reta secante
f′(x) = lim_{Δx→0} [f(x + Δx) − f(x)] / Δx               ← reta tangente
```

No código, a derivada usa um Δx bem pequeno (`DX = 0,001`) no lugar de "Δx → 0".

### Aceleração (não constante)

```
a(s, p) = − FREIO_MAX · μ · p(t)    ← freio: depende do pedal (do jogador)
          − G · h′(s)                ← ladeira: depende da posição (só na fase 3)
```

`h′(s)` é a **derivada da função da estrada** (a inclinação da pista). Na descida h′ < 0 e o
carro ganha velocidade; na subida h′ > 0 e ele perde. Na fase 3 dá para conferir pela
**regra da cadeia** (3.6): `h(s) = 4·cos(π·s/60) − 4` → `h′(s) = −4·(π/60)·sen(π·s/60)`.
O teste compara esse resultado com a derivada numérica.

(Para ladeiras suaves como a da fase 3, a parte da gravidade ao longo da pista é G·h′(s);
o erro em relação ao valor exato fica abaixo de 2%.)

### Atualização a cada passo Δt — diferencial (3.10)

A diferencial diz que `dy = f′(x)·dx` e que, para `dx = Δx` pequeno, `Δy ≈ dy`: perto do ponto,
a curva quase coincide com a reta tangente. Com `dx = Δt`:

```
Δs ≈ s′(t)·Δt = v·Δt    →   s(t + Δt) = s(t) + v(t)·Δt
Δv ≈ v′(t)·Δt = a·Δt    →   v(t + Δt) = v(t) + a(t)·Δt
```

Ordem das contas em cada passo:

```
p ← p ± velocidade_do_pedal · Δt        (limitado entre 0 e 1)
a ← a(s, p)
s ← s + v · Δt
v ← v + a · Δt                          (se v ≤ 0: v = 0, fim)
t ← t + Δt
```

### As derivadas mostradas (telemetria e gráficos)

A cada quadro (Δt = 1/60 s), o jogo **mede** as derivadas pela taxa de variação num intervalo
bem curto:

```
v(t) = s′(t) ≈ [s(t) − s(t − Δt)] / Δt
a(t) = v′(t) ≈ [v(t) − v(t − Δt)] / Δt
```

São esses valores que aparecem na telemetria e que dão a inclinação das retas tangentes.

### Reta tangente nos gráficos (3.1 e 3.3)

- No gráfico **s(t)**, a reta tangente no instante t₀ tem inclinação **v(t₀)**.
- No gráfico **v(t)**, a reta tangente no instante t₀ tem inclinação **a(t₀)**.
- Reta tangente: `y − f(t₀) = f′(t₀)·(t − t₀)`.
