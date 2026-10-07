# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Una sola persona: en Pol, mestre de primària. Fa servir l'app al **mòbil, durant
el dia**, just després de cada àpat, sovint dret o a mig fer una altra cosa.
Al vespre hi torna per entrar les calories cremades que li dona el rellotge i
tancar el dia.

## Product Purpose

Portar el compte del que menja i el que crema per **perdre greix**: buscar
dèficit cada dia mantenint la proteïna alta. L'èxit és apuntar sense fricció
—si costa, no s'usa— i saber d'un cop d'ull si el dia va cap a l'objectiu.

## Positioning

No és un comptador que s'omple: el centre de tot és el **balanç**, un eix amb
l'equilibri al mig, el dèficit a una banda i el superàvit a l'altra, i una
fita a l'objectiu de dèficit. El dia no s'«acaba» omplint res: es passa d'un
punt. L'activitat la posa ell, sencera, del rellotge; l'app no l'estima.

## Operating Context

- Ve de FitFat (una app que vivia sola al mòbil) i després de JEFE; els
  càlculs són exactament els de FitFat.
- Les dades són a un full de càlcul de Google propi; el servidor és Apps
  Script, que tarda 1,5–2,5 s per petició: la pantalla es pinta primer amb el
  que hi ha desat al telèfon i es posa al dia després.
- Una notificació a les 23:45 recorda tancar el dia si falten les cremades.

## Capabilities and Constraints

- Àpats: **dinar, berenar, sopar** (no hi ha esmorzar).
- Apuntar un aliment: nom, grams, kcal/100 g i proteïna/100 g; el botó ensenya
  el resultat abans de prémer-lo. Treure'n un demana confirmació. El formulari
  a mig omplir es desa sol.
- Rebost: aliments guardats amb kcal i proteïna per 100 g; se'n tria un d'una
  llista amb cerca i omple el formulari. «Desa l'aliment» n'hi afegeix.
- Activitat del dia (kcal cremades, total del rellotge) → balanç = cremades −
  ingerides; positiu és dèficit. Sense cremades no hi ha balanç.
- Verdicte del dia en text (sense dades, dèficit, objectiu assolit, equilibri,
  superàvit).
- Objectius: dèficit diari (kcal) i proteïna diària (g), editables.
- Proteïna respecte de l'objectiu.
- Períodes: dia, setmana (set files, una per dia) i mes (gràfica de barres
  amunt/avall de l'equilibri), amb mitjanes i balanç acumulat; tocar un dia hi va.
- Navegar dia a dia (no es pot anar al futur) i «anar a avui».
- Importador de FitFat en dos temps: assaig que no escriu res, i confirmació.
- Avisos al mòbil: activar-los des de la pantalla; explicació si s'han denegat.
- Connexió amb el servidor: adreça /exec + clau d'accés.
- Funciona sense cobertura: avís de «sense connexió» i cua del que falta enviar.
- Res s'esborra de debò: treure és marcar.

## Brand Commitments

- Nom: **Nutrició**. Català, registre directe, frases curtes que diuen què
  passa i què fer.
- **No ha d'assemblar-se a JEFE en res** (decidit pel Pol el 7-10-2026): ni el
  full de mapa topogràfic, ni la consola fosca, ni la seva icona.

## Evidence on Hand

- Dades reals: les seves, al full de càlcul. Les de mostra del mirall
  (`eines/mirall-dades.mjs`) són inventades i ho diuen.
- No hi ha logotip ni fotografia.

## Product Principles

1. Apuntar és el camí més curt de la pantalla.
2. El balanç és el centre: una posició respecte d'un equilibri, no un dipòsit.
3. Primer el que ja se sap, després el que arriba: mai una pantalla en blanc.
4. Cap número sense context: cada xifra diu respecte de què.
5. Res de soroll: un avís que no cal no s'envia.

## Accessibility & Inclusion

Ús amb una mà, al carrer i amb llum de dia. Text llegible sense ulleres a
distància de braç, tocs de 44 px com a mínim, i cap estat que es digui només
amb color.
