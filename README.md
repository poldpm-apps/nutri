# Nutrició

El que menges, el que cremes i el balanç del dia. Surt de l'apartat de
Nutrició de JEFE i fa exactament el mateix: els àpats, el rebost d'aliments
guardats, l'activitat del dia, el balanç, l'objectiu de proteïna, la setmana i
el mes, i l'importador de FitFat.

- **L'app:** <https://poldpm.github.io/nutricio/>
- **Les dades:** un full de càlcul propi, «Nutrició», al teu Drive.
- **El servidor:** un projecte d'Apps Script propi, «Nutrició».

## Com està fet

```
apps-script/   el codi. Apps Script el serveix i GitHub Pages en publica la pantalla
eines/         comprovar, provar, construir, desplegar i el mirall
index.html     la pantalla publicada. LA GENERA `npm run construeix`: no l'editis
```

El nucli (`00_` a `65_`) i el frontal (`ui_*.html`) són els de JEFE, copiats.
Els fitxers propis són `40_Mod_Nutricio.gs` i `vista_nutricio.html`.

## Les ordres

```bash
npm run comprova     # comprovacions i proves; ha de dir «Tot correcte»
npm run mirall       # la pantalla amb dades inventades, per mirar-la en local
npm run puja         # comprova, prova, construeix, puja a Apps Script i desplega
git push             # publica la PANTALLA a GitHub Pages
```

`npm run puja` actualitza el servidor; la pantalla la serveix GitHub Pages i
**sense `git push` segueixes veient la d'abans.**

## La primera vegada (a l'editor d'Apps Script)

1. Executa **`instala()`**. Crea el full «Nutrició», s'hi porta les pestanyes
   `Aliments`, `Ingestes` i `NutricioDies` del full de JEFE —les **copia**, el
   de JEFE no es toca—, instal·la els automatismes i escriu la clau d'accés al
   registre. Copia-la.
2. A *Configuració del projecte → Propietats de l'script*, afegeix
   `FIREBASE_COMPTE` amb el mateix valor que té el projecte de JEFE (és el que
   permet enviar-te avisos al mòbil).
3. Obre l'app, enganxa-hi l'adreça del desplegament (acaba en `/exec`) i la
   clau, i prem **Activa els avisos**.

Per comprovar-ho: `provaTriggers()` diu si hi són tots els automatismes, i
`provaNotificacio()` t'envia un avís de prova.

## Els automatismes

| Quan | Què |
|---|---|
| cada dia cap a les 23:45 | el tancament: si has apuntat menjar i no l'activitat, t'ho recorda |
| cada 3 hores | els senyals: si portes dies sense apuntar res |
| cada 10 minuts | prepara la pantalla perquè s'obri ràpid |
| cada dia a les 3 | manteniment: registre i estructura del full |

## Les propietats de l'script

Mai al codi ni al repositori.

| Propietat | Per a què |
|---|---|
| `ID_FULL` | el full de càlcul; la posa `configura()` |
| `CLAU_ACCES` | la clau de la pantalla; la posa `generaClauAcces()` |
| `FIREBASE_COMPTE` | els avisos al mòbil |

## Instal·lar-la al mòbil: dues coses que ja han fallat

- **Android necessita icones PNG.** Amb només SVG, Chrome deia «ja està
  instal·lada» i després «l'app no s'ha pogut obrir». El manifest porta PNG de
  192 i 512 (i una de retallable) abans dels SVG; una prova ho vigila.
- **L'`"id"` del manifest és `/nutricio/app` i no es canvia mai més.** Es va
  haver de canviar una vegada perquè Chrome havia quedat convençut que l'app
  d'abans encara hi era. Canviar-lo vol dir que, per a Chrome, és una altra app.
