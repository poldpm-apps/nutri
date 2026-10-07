/**
 * NUTRICIÓ — Instal·lació i manteniment
 *
 * Ve del `90_Instalacio.gs` de JEFE, retallat al que fa servir aquesta app.
 * Funcions per executar A MÀ des de l'editor d'Apps Script:
 *
 *   instala()           → TOT D'UN COP, la primera vegada: el full, les dades
 *                         de JEFE, la clau d'accés i els automatismes.
 *   configura()         → crea el full de càlcul i l'estructura. Idempotent.
 *   generaClauAcces()   → la clau que et demana la pantalla en connectar-la.
 *   instalaTriggers()   → instal·la els automatismes. Idempotent.
 *   treuTriggers()      → els desinstal·la.
 *   provaTriggers()     → hi són tots, i un de cada?
 *   provaNotificacio()  → t'arriba un avís al mòbil?
 */

/* EL FULL D'ON VENEN LES DADES. Es busca pel nom i es LLEGEIX: no s'hi
   escriu mai res. Si un dia en tinguessis dos amb aquest nom, s'atura i ho
   diu, perquè triar-ne un a cegues seria copiar dades que potser no són les
   bones. */
var NOM_FULL_JEFE = 'JEFE — Assistent';
var FULLS_NUTRICIO = ['Aliments', 'Ingestes', 'NutricioDies'];

/**
 * LA PRIMERA VEGADA, AIXÒ I PROU.
 * Crea el full, s'hi porta les dades de JEFE, genera la clau i instal·la els
 * automatismes. Es pot tornar a executar: no duplica res ni torna a copiar
 * les dades si ja hi són. La clau, però, sí que la canvia; si ja la tens
 * posada a l'app, no l'executis més —fes servir les altres funcions.
 */
function instala() {
  var linies = [];
  linies.push(configura());
  linies.push(instalaTriggers());
  linies.push(generaClauAcces());
  var text = linies.join('\n\n');
  Logger.log(text);
  return text;
}

/**
 * Posada en marxa. Es pot executar tantes vegades com calgui:
 * si el full ja existeix, no en crea un altre; només posa al dia l'estructura.
 *
 * Quan el crea, abans de res s'hi porta les tres pestanyes de Nutrició del
 * full de JEFE —amb «Copia a», que deixa l'original on és i tal com és—.
 * Va ABANS d'`Esquema.sincronitza` a posta: si no, l'esquema crearia les
 * tres pestanyes buides i les bones arribarien amb un altre nom al costat.
 */
function configura() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_ID_FULL);
  var ss;
  var acabatDeCrear = false;

  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create(NOM_FULL_CALCUL);
    props.setProperty(PROP_ID_FULL, ss.getId());
    acabatDeCrear = true;
  }

  var portades = portaDadesDeJefe_(ss);

  var informe = Esquema.sincronitza();
  var afegides = Config.inicialitza();
  var moduls = Moduls.sincronitzaFull();
  var objectius = portaObjectiusDeJefe_(portades.origen);

  if (acabatDeCrear) netejaFullPerDefecte_(ss);

  Log.info('instalacio', 'configura() completada', {
    creat: acabatDeCrear,
    portades: portades.copiades,
    fullsCreats: informe.fullsCreats,
    columnesAfegides: informe.columnesAfegides,
    configAfegida: afegides,
    moduls: moduls
  });

  var resum =
    (acabatDeCrear ? 'Full de càlcul creat.\n' : 'Full de càlcul ja existent, estructura posada al dia.\n') +
    'Dades de JEFE: ' + portades.text + '\n' +
    (objectius ? 'Objectius de JEFE: ' + objectius + '\n' : '') +
    'Fulls creats: ' + (informe.fullsCreats.join(', ') || 'cap') + '\n' +
    'Columnes afegides: ' + (informe.columnesAfegides.join(', ') || 'cap') + '\n' +
    'Mòduls detectats: ' + moduls + '\n' +
    'URL: ' + ss.getUrl();

  console.log(resum);
  return resum;
}

/**
 * LES DADES ES COPIEN, NO ES MOUEN.
 *
 * Per cada pestanya que encara no és al full nou, se la copia del de JEFE
 * —`copyTo`, que és el mateix que «Copia a → Full de càlcul existent»— i li
 * torna el nom. L'original no es toca: ni es mou, ni s'esborra, ni s'hi
 * escriu. Si la pestanya ja hi és, no fa res: tornar-ho a executar no
 * duplica ni trepitja el que hagis apuntat des d'aquí.
 */
function portaDadesDeJefe_(ss) {
  var falten = FULLS_NUTRICIO.filter(function (n) { return !ss.getSheetByName(n); });
  if (!falten.length) return { copiades: [], text: 'ja hi eren, no s\'ha copiat res', origen: null };

  var trobats = [];
  var it = DriveApp.getFilesByName(NOM_FULL_JEFE);
  while (it.hasNext()) {
    var f = it.next();
    if (f.getMimeType() === MimeType.GOOGLE_SHEETS && !f.isTrashed()) trobats.push(f);
  }
  if (!trobats.length) {
    throw new Error('No trobo el full «' + NOM_FULL_JEFE + '» al teu Drive. ' +
                    'Sense ell no hi ha d\'on copiar les dades de Nutrició.');
  }
  if (trobats.length > 1) {
    throw new Error('Hi ha ' + trobats.length + ' fulls amb el nom «' + NOM_FULL_JEFE + '». ' +
                    'No en trio cap a cegues: deixa\'n només un amb aquest nom i torna-ho a executar.');
  }

  var origen = SpreadsheetApp.openById(trobats[0].getId());
  var copiades = [];
  falten.forEach(function (nom) {
    var full = origen.getSheetByName(nom);
    if (!full) return;   // a JEFE no hi era: l'esquema el crearà buit
    var copia = full.copyTo(ss);
    copia.setName(nom);
    copiades.push(nom + ' (' + Math.max(0, copia.getLastRow() - 1) + ' files)');
  });

  return {
    copiades: copiades,
    text: copiades.length ? 'copiades ' + copiades.join(', ') : 'cap pestanya de Nutrició a JEFE',
    origen: origen
  };
}

/**
 * ELS OBJECTIUS NO SÓN A CAP PESTANYA DE NUTRICIÓ: són al `_Config` de JEFE,
 * amb les claus `nutri_…`. Es porten només els que aquí encara no tenen
 * valor, o sigui que si ja n'has canviat cap des de l'app, no es trepitja.
 */
function portaObjectiusDeJefe_(origen) {
  if (!origen) return '';
  var full = origen.getSheetByName('_Config');
  if (!full || full.getLastRow() < 2) return '';

  var valors = full.getDataRange().getValues();
  var cap = valors[0].map(String);
  var iClau = cap.indexOf('clau'), iValor = cap.indexOf('valor');
  if (iClau === -1 || iValor === -1) return '';

  var portats = [];
  for (var i = 1; i < valors.length; i++) {
    var clau = String(valors[i][iClau] || '');
    if (clau.indexOf('nutri_') !== 0) continue;
    var v = valors[i][iValor];
    if (v === '' || v === null) continue;
    if (Config.get(clau, '') !== '') continue;
    Config.set(clau, v);
    portats.push(clau + ' = ' + v);
  }
  return portats.join(', ');
}

/**
 * Esborra el full buit «Full 1» / «Sheet1» que Google crea automàticament,
 * però NOMÉS si està completament buit i ja hi ha altres fulls.
 * Mai toca un full amb dades.
 */
function netejaFullPerDefecte_(ss) {
  var fulls = ss.getSheets();
  if (fulls.length < 2) return;

  for (var i = 0; i < fulls.length; i++) {
    var f = fulls[i];
    var nom = f.getName();
    var esPerDefecte = /^(Sheet1|Full 1|Hoja 1|Feuille 1)$/i.test(nom);
    var esBuit = f.getLastRow() === 0 && f.getLastColumn() === 0;
    if (esPerDefecte && esBuit) {
      ss.deleteSheet(f);
      Log.info('instalacio', 'Esborrat el full buit per defecte «' + nom + '»');
      return;
    }
  }
}

// ------------------------------------------------------------------ triggers

// ------------------------------------------------------------------ triggers

/**
 * ELS AUTOMATISMES QUE SÓN NOSTRES.
 *
 * Aquesta llista NO és decoració: és la que fa servir `treuTriggers` per
 * netejar abans de tornar-los a crear. Un automatisme que no hi surti no
 * s'esborra mai, i cada `instalaTriggers()` en deixa un de vell i en crea un
 * de nou. A JEFE va passar amb `triggerEscalfaFora` el 4 d'agost del 2026: en
 * van quedar dos, i entre tots dos es menjaven més quota diària de la que té
 * el compte sencer. Quan la quota s'acaba, Google atura TOTS els automatismes
 * sense dir res —i la quota és del compte, no d'aquest projecte: la gasten
 * també JEFE i les altres apps—.
 *
 * REGLA: si afegeixes un `newTrigger` aquí sota, el seu nom va aquí dalt. La
 * prova `eines/prova.mjs` ho comprova i peta si te'n descuides.
 */
var TRIGGERS = ['triggerManteniment', 'triggerTancamentNutricio', 'triggerEscalfa',
                'triggerSenyals'];

/** Instal·la els automatismes. Esborra només els seus abans, mai els d'altri. */
function instalaTriggers() {
  treuTriggers();

  ScriptApp.newTrigger('triggerManteniment')
    .timeBased().atHour(3).everyDays(1).create();

  // Recordatori de tancament del dia. Apps Script no garanteix el minut exacte:
  // dispara dins d'una finestra d'un quart d'hora. Per això demanem les 23:45
  // i no les 23:55 —així la finestra queda dins del dia— i el gestor torna a
  // mirar l'hora real per no equivocar-se de jornada si li passa la mitjanit.
  ScriptApp.newTrigger('triggerTancamentNutricio')
    .timeBased().atHour(23).nearMinute(45).everyDays(1).create();

  /* LA PANTALLA, PREPARADA. Desar-la fa que obrir l'app sigui ràpid.
     Cada deu minuts i no cada cinc com a JEFE: el que es desa dura mitja hora,
     o sigui que no caduca mai igualment, i la quota d'automatismes és de tot
     el compte —noranta minuts al dia per a JEFE i les apps que en surten—.
     Passar-se vol dir que s'atura tot, el tancament inclòs, sense dir res. */
  ScriptApp.newTrigger('triggerEscalfa').timeBased().everyMinutes(10).create();

  /* ELS SENYALS, cada tres hores: els dies que no has apuntat res. Qui
     decideix si en surt cap és el pressupost de dos al dia —vegeu
     65_Senyals.gs—, no aquesta xifra. */
  ScriptApp.newTrigger('triggerSenyals').timeBased().everyHours(3).create();

  Log.info('instalacio', 'Triggers instal·lats', { triggers: TRIGGERS });
  return 'Triggers instal·lats: ' + TRIGGERS.join(', ');
}

/**
 * HI SÓN DE DEBÒ?
 *
 * Un automatisme que falta falla en silenci: te n'assabentes per no rebre
 * res. Això mira els que hi ha instal·lats ara mateix i els compara amb la
 * llista: diu els que falten i els que hi són repetits.
 */
function provaTriggers() {
  var compte = {};
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var n = t.getHandlerFunction();
    compte[n] = (compte[n] || 0) + 1;
  });
  var l = ['=== AUTOMATISMES ==='];
  var totBe = true;
  TRIGGERS.forEach(function (n) {
    var q = compte[n] || 0;
    if (q !== 1) totBe = false;
    l.push((q === 1 ? '  ✓ ' : '  ✗ ') + n + (q === 1 ? '' : q ? '  (n\'hi ha ' + q + ')' : '  (NO HI ÉS)'));
  });
  l.push(totBe ? 'Tots hi són, un de cada.' : 'Executa instalaTriggers() per arreglar-ho.');
  var text = l.join('\n');
  Logger.log(text);
  return text;
}

/**
 * Esborra els automatismes NOSTRES —els de — i deixa estar els
 * d'altri. Si en trobés dos amb el mateix nom, els treu tots dos: duplicats
 * vol dir doble consum de quota, i la quota és de tot el compte.
 */
function treuTriggers() {
  var tots = ScriptApp.getProjectTriggers();
  var tret = 0;
  for (var i = 0; i < tots.length; i++) {
    if (TRIGGERS.indexOf(tots[i].getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(tots[i]);
      tret++;
    }
  }
  return 'Triggers eliminats: ' + tret;
}



// ------------------------------------------------- punts d'entrada dels triggers

/**
 * RECORDATORI DE TANCAMENT — cada nit, cap a les 23:45.
 *
 * Sense les calories cremades no hi ha balanç, i un dia sense tancar no es
 * recupera l'endemà: ja no te'n recordes. Per això l'avís va abans de
 * mitjanit i no al matí següent.
 *
 * L'hora no és exacta a posta: Apps Script dispara dins d'una finestra d'un
 * quart d'hora, així que aquí es torna a mirar el rellotge. Si ja ha passat
 * la mitjanit, el dia que cal tancar és el d'ahir, no el d'avui.
 */
function triggerTancamentNutricio() {
  try {
    if (typeof Nutricio === 'undefined') return;

    var ara = new Date();
    var tz = Config.zonaHoraria();
    var hora = Number(Utilities.formatDate(ara, tz, 'H'));
    var dia = Utilities.formatDate(ara, tz, 'yyyy-MM-dd');
    if (hora < 12) dia = Utils.sumaDies(dia, -1);   // se n'ha anat de mitjanit

    var d = Nutricio.dia(dia);
    if (d.teCremades) {
      Log.info('trigger.tancament', 'Dia ja tancat, cap avís', { data: dia });
      return;
    }

    // Un dia en què no has apuntat absolutament res no és un dia oblidat:
    // és un dia que no comptes. Avisar-ne seria soroll.
    if (!d.totals.ingerides) {
      Log.info('trigger.tancament', 'Dia sense cap registre, cap avís', { data: dia });
      return;
    }

    var r = Notifica.envia(
      'Nutrició · tancament',
      'Falten les calories cremades. Portes ' + Math.round(d.totals.ingerides) +
        ' kcal i ' + Nutricio.r1(d.totals.proteina) + ' g de proteïna: entra el que ' +
        'has cremat i el dia queda tancat.',
      { etiqueta: 'nutricio-tancament', url: './#nutricio', urgent: true }
    );

    /* «Enviat» NOMÉS si ha sortit d'aquí. Abans ho deia sempre, encara que
       `enviades` fos zero perquè no hi havia cap aparell registrat: el
       registre afirmava que l'avís havia sortit mentre en Pol el buscava al
       telèfon. Un registre que menteix és pitjor que no tenir-ne. */
    if (r.enviades > 0) {
      Log.info('trigger.tancament', 'Recordatori enviat', { data: dia, enviades: r.enviades });
    } else {
      Log.avis('trigger.tancament', 'NO s\'ha pogut enviar: ' + (r.motiu || 'cap aparell l\'ha rebut'),
               { data: dia, errors: r.errors || [] });
    }
  } catch (err) {
    Log.error('trigger.tancament', err);
  }
}

/** Manteniment nocturn. Aquest sí que funciona des del primer dia. */
function triggerManteniment() {
  try {
    var informe = { rotades: 0, esquema: [] };

    informe.rotades = Log.rota();

    informe.esquema = Esquema.comprova();
    if (informe.esquema.length) {
      Esquema.sincronitza();
      informe.esquema = Esquema.comprova();
    }

    /* Aquí hi havia previst un reintent dels resums que haguessin fallat, i
       s'ha tret perquè seria mentida: el resum del dia es munta amb el que
       diuen els mòduls ARA, i a les tres de la matinada «ara» ja és l'endemà.
       Tornar-lo a generar li posaria a la nit de dimarts les xifres de
       dimecres. Si un vespre falla, hi ha el botó de demanar-lo a mà, i al
       registre en queda constància. */

    CacheService.getScriptCache().removeAll(['fitxa_ia']);

    Log.info('trigger.manteniment', 'Manteniment completat', informe);
  } catch (err) {
    Log.error('trigger.manteniment', err);
  }
}

/**
 * LA PANTALLA, PREPARADA ABANS QUE L'OBRIS.
 * La primera crida de cada estona costava segons: obrir el full i muntar el
 * dia. Això ho fa cada deu minuts, i quan l'obres ja hi és.
 */
function triggerEscalfa() {
  var t0 = Date.now();
  var fets = [], fallats = [];

  function escalfa(nom, fn) {
    try { fn(); fets.push(nom); }
    catch (err) { fallats.push(nom + ': ' + err.message); }
  }

  var m = Moduls.actius();
  for (var i = 0; i < m.length; i++) {
    var id = m[i].id;
    var accions = m[i].accions || {};

    /* Cada mòdul s'escalfa per la porta per on hi entres tu, i amb els
       paràmetres de sèrie: el mes en curs, el dia d'avui. La resta —un mes
       de fa mig any, l'històric d'un hàbit— es munta quan hi vas, que és de
       tant en tant i no val la pena tenir-ho calent sempre. */
    if (typeof accions.pantalla === 'function') {
      escalfa(id, (function (a) { return function () { a({}); }; })(accions.pantalla));
    } else if (typeof accions.dia === 'function') {
      escalfa(id, (function (a) { return function () { a({}); }; })(accions.dia));
    }
  }

  /* Es deixa dit quant ha trigat. Aquest automatisme s'executa unes cent quaranta
     vegades al dia i el pot d'automatismes és de noranta minuts: si un dia
     s'allargués, aquí es veuria abans que no pas quedant-nos sense avisos. */
  var ms = Date.now() - t0;
  if (fallats.length) {
    Log.avis('escalfa', 'Alguna pantalla no s\'ha pogut escalfar', { fallats: fallats, ms: ms });
  } else {
    Log.info('escalfa', 'Pantalles a punt', { quantes: fets.length, ms: ms });
  }
  /* Al registre de l'editor també: quan l'executes a mà des d'allà, el que
     retorna una funció no es veu enlloc, i sense això sembla que no hagi fet
     res. Va passar. */
  var resum = fets.join(', ') + '  ·  ' + ms + ' ms';
  Logger.log(resum);
  return resum;
}


/**
 * Genera la clau d'accés per a la interfície servida des de fora.
 *
 * Executa-la un cop. Escriu la clau al registre: copia-la, enganxa-la a la
 * pantalla quan te la demani, i no la desis enlloc més.
 * Si algun dia sospites que se t'ha escapat, torna a executar-la: la vella
 * deixa de servir a l'instant.
 */
function generaClauAcces() {
  var alfabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  var clau = '';
  var bytes = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  for (var i = 0; i < 48; i++) {
    clau += alfabet.charAt((bytes.charCodeAt(i % bytes.length) * (i + 7)) % alfabet.length);
  }

  PropertiesService.getScriptProperties().setProperty(PROP_CLAU_ACCES, clau);
  Log.info('instalacio', 'Clau d\'accés generada');

  var text = [
    '',
    '=== CLAU D\'ACCÉS DE NUTRICIÓ ===',
    '',
    clau,
    '',
    'Copia-la ara. Aquesta és l\'única vegada que te la mostro còmodament.',
    '(Sempre la pots recuperar a Configuració del projecte → Propietats de l\'script.)',
    '',
    'Qui tingui aquesta clau i l\'URL del desplegament pot llegir les teves dades.',
    'No la posis en cap fitxer del projecte ni la comparteixis.',
    '============================'
  ].join('\n');
  Logger.log(text);
  return text;
}


/**
 * PROVA DE NOTIFICACIONS — executa-la i mira't el mòbil.
 *
 * Comprova la cadena sencera: compte de servei, autenticació amb Google,
 * dispositius registrats i enviament real. Si arriba la notificació, tot
 * funciona; si no, el registre diu exactament on s'ha trencat.
 */
function provaNotificacio() {
  var linies = ['=== PROVA DE NOTIFICACIONS ==='];
  function afegeix(t) { linies.push(t); Logger.log(t); }

  if (!Notifica.disponible()) {
    afegeix('FALLA: ' + Notifica.motiu());
    return linies.join('\n');
  }
  afegeix('1. Compte de servei ..... correcte');

  // La configuració web (apiKey, vapid…) no es comprova des d'aquí: viu a
  // firebase.config.json, que és del client. Si algun dispositiu s'ha
  // registrat, és que aquella configuració ja funciona. Val més comprovar
  // el resultat que no pas repetir la declaració en dos llocs.
  var d;
  try {
    d = Notifica.dispositius();
  } catch (e) {
    afegeix('2. Dispositius .......... FALLA: falta el full _Dispositius');
    afegeix('');
    afegeix('Executa configura() per crear-lo i torna a provar-ho.');
    return linies.join('\n');
  }

  afegeix('2. Dispositius actius ... ' + d.length);
  d.forEach(function (x) { afegeix('   · ' + x.nom + '  (vist ' + x.vist_el + ')'); });

  if (!d.length) {
    afegeix('');
    afegeix('Cap dispositiu registrat encara. Al mòbil: obre l\'app i prem');
    afegeix('«Activa els avisos». Si el botó et diu');
    afegeix('que Firebase no està configurat, és que firebase.config.json encara');
    afegeix('té els valors d\'exemple o que no has fet git push.');
    return linies.join('\n');
  }

  var r = Notifica.envia(
    'Prova',
    'La cadena funciona de punta a punta: l\'app et pot escriure encara que estigui tancada.',
    { etiqueta: 'prova', url: './' }
  );
  afegeix('3. Enviades ............. ' + r.enviades + ' de ' + d.length);
  (r.errors || []).forEach(function (e) {
    afegeix('   ERROR a ' + e.nom + ': codi ' + e.codi + ' — ' + e.text);
  });

  afegeix('=== FI · mira\'t el mòbil ===');
  return linies.join('\n');
}
