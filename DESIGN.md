---
name: Nutrició — El pols
description: Cada dia és una carena amb un pols a la posició del seu balanç; germana de l'app del cos.
colors:
  camp: "#e8eef0"
  camp-alt: "#f3f6f7"
  blanc: "#fbfcfc"
  pagina: "#cfd8db"
  t1: "#bcced4"
  t2: "#7ab5c1"
  t3: "#1c8496"
  t4: "#054a57"
  tinta: "#0d191e"
  tinta-2: "#3d5560"
  fil: "#9fb4bb"
  ocre: "#85580f"
  ocre-suau: "#f3ead9"
typography:
  title:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  verdict:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  figure:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  engraved:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.14em"
rounded:
  none: "0px"
spacing:
  e1: "4px"
  e2: "8px"
  e3: "12px"
  e4: "16px"
  e5: "20px"
  e6: "24px"
  e7: "32px"
  gutter: "16px"
  touch: "44px"
components:
  button-primary:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.blanc}"
    rounded: "{rounded.none}"
    height: "44px"
  button-primary-hover:
    backgroundColor: "#1d2c32"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.none}"
    height: "44px"
  input:
    backgroundColor: "{colors.blanc}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.none}"
    height: "44px"
  row:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    height: "56px"
---

# Nutrició — El pols

## Overview

És el mateix món que l'app del cos (`poldpm-apps/cos`), triat a propòsit
perquè les dues apps es reconeguin germanes. Es basa en el catàleg de Factory
Records (*Unknown Pleasures*, Peter Saville) traslladat al camp pàl·lid:
- filets en rampa de turquesa;
- números de catàleg (`DIA 281`, `P1`);
- versaletes gravades;
- gairebé res imprès.

Regles i alineació, cap targeta.

La peça de Nutrició és el **pols del balanç**:
- cada dia és una carena plana amb un pols a la posició del seu balanç;
- l'equilibri és al mig i el dèficit cap a la dreta;
- l'objectiu és una línia de traços vertical, el punt de control (CP);
- no hi ha res que s'ompli.

La setmana i el mes són les carenes apilades. La més vella queda al fons i
clara, i la d'avui davant i fosca.

## Colors

- **El camp:** `camp` és el fons; `blanc`, el dels camps d'escriure i la fila
  triada.
- **La rampa** `t1 → t4`, del clar al fosc:
  - els clars per al que és vell o secundari;
  - `t4` per al que és d'ara i el focus.
- **Tinta:** `tinta` és el text; `tinta-2` és el secundari (6,7:1 sobre el
  camp); `fil` són les regles.
- **Ocre:** és l'únic color d'avís, i només per al que s'ha de corregir: el
  superàvit, els errors i el que queda pendent. Mai per decorar.
- **Sense tema fosc.** L'app és clara, com la del cos.

## Typography

- **Hanken Grotesk** sola, de 400 a 600, amb xifres tabulars a tot arreu.
  Viu a `fonts/` i és la mateixa que la del cos.
- **El gravat:** 12 px, 600, versaletes amb un espaiat de 0,14 em. Fa de rètol
  de catàleg.
- **Mides:**
  - títol de pantalla: 28 px;
  - veredicte en una paraula: 36 px;
  - xifres grans: 40 px a 500;
  - cos: 15 px.
- **Xifres:** els milers van amb punt («1.670») i el menys és el de debò (−).

## Layout

- Mòbil primer, amb un marge de 16 px.
  - **Ordre:** la marca, el títol, el període, el pas de dia entre regles, el
    veredicte, el pols, les quatre xifres en una quadrícula de 2×2, els àpats i
    el tancament.
- A ≥ 900 px, el marge passa a 28 px.
  - **Columnes:** el pols i les xifres a l'esquerra, fixos mentre baixes, i els
    àpats a la dreta.
- Escala d'espais: 4/8/12/16/20/24/32. Tocs de 44 px com a mínim; les files són
  de 56.

## Elevation & Depth

Pla del tot. No hi ha ombres, només regles:
- de 1 px en `tinta`, per obrir una secció;
- de 1 px en `fil`, entre files.

## Shapes

- Cantonades rectes a tot arreu, incloses les dels botons i els camps.
- Les icones són d'un sol traç de 1,6, arrodonit i sense farciment, com les del
  cos.

## Components

- **Capçalera:**
  - a dalt, la marca (icona i «NUTRICIÓ» gravat) i «Objectius» en botó de filet;
  - a sota, el títol en gran;
  - el període en tres pestanyes gravades, amb un subratllat de 2 px en `t4`;
  - el pas de dia entre dues regles.
- **Veredicte:** la línia gravada `DIA 281 · dj 8 oct · avui`, una paraula
  grossa («Objectiu assolit», «En dèficit», «En superàvit» en ocre, «Falten les
  cremades») i el pols.
- **Xifres:** quatre caselles en una quadrícula de 2×2 separades per regles:
  el gravat, la xifra gran amb la unitat i una línia de detall.
- **Àpats:** cada àpat té `P1/P2/P3` gravat i el nom, i el total a la dreta.
  - Cada aliment és una fila: el nom, l'especificació en `tinta-2`, les kcal i
    la proteïna a la dreta, i una creu de 44 px.
  - El formulari queda entre regles, amb les etiquetes gravades.
  - El botó principal és ple i ensenya el resultat abans de prémer-lo.
- **Tancament:** el camp de cremades en xifra gran, el compte i el veredicte
  en una línia.
- **Dies del període:** cada dia és una fila de catàleg (`DIA 279 / dt 6`),
  amb el veredicte i la xifra.
  - Tota la fila és un botó.
  - Al mes, n'hi ha set a la vista, i «Tots els dies · 30» desplega la resta.
- **Fulls que pugen:** camp pàl·lid i capçalera enganxada sobre una regla de
  tinta. Confirmar una acció que treu alguna cosa és el botó ple.
- **Brindis:** la confirmació és en tinta, i l'error en ocre.

## Do's and Don'ts

- **Fes:**
  - regles i alineació;
  - números de catàleg;
  - la rampa per dir del vell al nou;
  - l'ocre només per corregir;
  - el pols a la posició del balanç.
- **No facis:**
  - targetes, ombres o cantonades arrodonides;
  - anells de progrés o barres que s'omplen;
  - cap segon color d'accent;
  - res de JEFE ni del dorsal, el disseny anterior d'aquesta app.
- **Abans de canviar res,** mira l'app del cos. Les dues han de continuar sent
  germanes.
