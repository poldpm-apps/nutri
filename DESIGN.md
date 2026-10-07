---
name: Nutrició — El dorsal
description: El balanç del dia és el número d'un dorsal de cursa de muntanya, i l'objectiu és un punt de control que es passa.
colors:
  page: "#dce1e5"
  tyvek: "#fbfcfd"
  tyvek-2: "#f1f4f6"
  ink: "#0b0b0c"
  ink-2: "#3e454d"
  ink-3: "#5b636b"
  hair: "#b9c1c8"
  race: "#ff5a1f"
  race-viu: "#ff6d38"
  race-suau: "#ffe3d8"
  apagat: "#8c949c"
typography:
  bib-number:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(96px, 31vw, 168px)"
    fontWeight: 900
    lineHeight: 0.82
    letterSpacing: "-0.01em"
  display:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1
  figure:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.3
rounded:
  bib: "6px"
  control: "4px"
  field: "3px"
  tag: "2px"
spacing:
  e1: "4px"
  e2: "8px"
  e3: "12px"
  e4: "16px"
  e5: "20px"
  e6: "24px"
  e7: "32px"
  gutter: "16px"
  touch: "48px"
components:
  button-primary:
    backgroundColor: "{colors.race}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.race-viu}"
  button-secondary:
    backgroundColor: "{colors.tyvek}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "48px"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.tyvek}"
    rounded: "{rounded.control}"
    height: "48px"
  bib:
    backgroundColor: "{colors.tyvek}"
    textColor: "{colors.ink}"
    rounded: "{rounded.bib}"
  bib-band:
    backgroundColor: "{colors.race}"
    textColor: "{colors.ink}"
  meal-band:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.tyvek}"
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    height: "48px"
---

# Nutrició — El dorsal

## Overview

El món és el de les curses de muntanya: el dorsal de Tyvek amb quatre
imperdibles, la franja de color de la sortida, el xip de cronometratge, el full
oficial de parcials i la bandera de meta escaquejada. La idea que mana és que el
balanç del dia **no s'omple**: és una posició respecte d'un equilibri. El número
del dorsal és el balanç, i a sota hi ha el recorregut, amb la sortida (0,
equilibri) al mig, el dèficit cap a la dreta, el superàvit cap a l'esquerra i el
punt de control (CP) a l'objectiu.

Pantalla d'operar, no de convèncer. Es fa servir al mòbil, de dia, al carrer i
amb una mà: tot ha de ser gros, clar i a un toc.

## Colors

- **Restringida**: neutres freds i un sol color de cursa.
- `race` (#ff5a1f) és per a tot el que és viu: la franja del dorsal, el
  corredor, la bandereta del CP, el botó que apunta i la franja del formulari.
  Sempre amb tinta a sobre (6,7:1), mai blanc.
- `ink` és la tinta del dorsal i de les bandes dels àpats. `ink-2` és el text
  secundari (9,6:1 sobre tyvek) i `ink-3` el més suau que es pot llegir (6:1).
- `tyvek` és blanc fred, **mai crema**. `page` és l'asfalt clar de la sortida.
- `apagat` és només per al que encara no té dades: el recorregut en traç i el
  número quan encara no n'hi ha.
- No hi ha tema fosc. El dorsal és blanc i es llegeix de dia.

## Typography

- **Big Shoulders Display** (900/800), condensada, per als números: el del
  dorsal, les xifres del dia, els títols dels blocs i dels àpats.
- **Archivo** per a tot el text, amb amplada variable: els rètols van al 80–85 %
  d'amplada i el text corrent al 100 %.
- Xifres tabulars a tot arreu. Els milers van amb punt («1.670»), i el signe
  menys és el de debò (−, U+2212).
- Mínim de 14 px per a tot el que diu alguna cosa. Només el codi del xip, que és
  decoració, baixa a 12 px.
- Les dues fonts viuen a `fonts/` (latin, woff2, OFL) i no a Google.

## Layout

- Mòbil primer, amb un marge de 16 px.
  - **Ordre:** el tauler (nom, Objectius, dia, Dia/Setmana/Mes), el dorsal, el
    full d'àpats i la meta.
- A ≥ 900 px, el marge passa a 28 px.
  - **Tauler:** en una sola fila.
  - **Columnes:** el dorsal a l'esquerra, fix mentre baixes, i el full i la meta
    a la dreta.
- Escala d'espais: 4/8/12/16/20/24/32. Tocs de 48 px; els botons de les finestres
  i els segmentats, de 44 px com a mínim.

## Elevation & Depth

- Pla. Els blocs es distingeixen per un contorn d'1 px a 10 % de tinta, no per
  ombres.
- L'única profunditat és la dels imperdibles, amb una ombra interior petita.
- La fibra del Tyvek és un soroll SVG entre el 6 i el 9 % sobre el blanc del
  dorsal i de les targetes d'estat.

## Shapes

- Puntes gairebé rectes: el dorsal a 6 px, els controls a 4, els camps a 3 i les
  etiquetes a 2.
- Les franges de color són bandes de dins del bloc, amb la vora de dalt. Mai una
  vora lateral de color, i mai una vora gruixuda sobre una cantonada arrodonida.
- La bandera de meta és un escaquer de 14 px.

## Components

- **Dorsal**
  - Franja taronja amb el títol i l'objectiu, i quatre imperdibles.
  - El número i la categoria, en una caixa de 2 px.
  - El recorregut, amb `role="img"` i una frase sencera a `aria-label`.
  - La fila de tres caselles i el xip amb el dia gravat.
  - Mentre no hi ha cremades, el número és el que portes menjat i el recorregut
    va en traç.
- **Recorregut**
  - L'escala és la de FitFat: ±800 com a mínim, i sempre hi caben el CP i el
    balanç.
  - El corredor surt de la sortida un sol cop (600 ms, ease-out).
  - Prop del CP, la bandereta gira i l'etiqueta s'obre cap a fora.
- **Full de parcials**
  - Cada àpat és una banda negra amb «P1/P2/P3» en taronja i el total.
  - Cada aliment és una fila: nom, especificació a 14 px, kcal en xifra
    condensada, i una creu de 48 px.
- **Formulari d'inscripció**
  - Franja taronja amb «Afegeix al dinar» i «Tanca».
  - Botó «Tria un aliment guardat» i camps amb etiqueta visible.
  - L'error surt al costat del camp, amb `role="alert"`.
  - El botó principal ensenya el resultat abans de prémer-lo («Afegeix · 107 kcal
    · 1,3 g»).
- **Meta**
  - Escaquer, el camp de cremades en xifra gran, el compte amb signe i el
    veredicte amb un senyal rodó.
- **Classificació (setmana)**
  - Cada fila és un sol botó de 56 px, també els dies sense dades.
  - Cada fila té un mini-recorregut i la xifra.
  - DNS vol dir sense dades.
- **Perfil (mes)**
  - Una columna tocable per dia: amunt, dèficit en tinta; avall, superàvit en
    taronja. El CP és una línia de traços.
- **Fulls que pugen** (finestres)
  - Pugen de baix al mòbil i surten al centre a escriptori.
  - Capçalera enganxada, amb la franja taronja per dins.
  - Focus tancat a dins; Escape tanca.
  - Confirmar una acció que treu alguna cosa és un botó negre.
- **Brindis:** negre amb la icona en taronja; en cas d'error, taronja amb tinta.
- **Icones:** un sol traç de 2,2 px, quadrat, sense farciment.

## Do's and Don'ts

- **Fes:**
  - un sol taronja, sempre amb tinta a sobre;
  - números en Big Shoulders, i milers amb punt;
  - posicions respecte de l'equilibri.
- **No facis:**
  - anells de progrés, barres que s'omplen, degradats o ombres;
  - cap vora lateral de color;
  - tema fosc;
  - res que recordi JEFE: ni mapes topogràfics, ni corbes de nivell, ni consola
    fosca amb cian.
- **Focus:** tinta i taronja alhora, perquè es vegi sobre blanc, sobre gris i
  sobre negre.
- **Moviment:** només el corredor que surt i la resposta en prémer (escala 0,97).
  Amb `prefers-reduced-motion` no es mou res.
