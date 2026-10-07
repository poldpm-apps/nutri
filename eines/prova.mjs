/**
 * Nutrició — proves del nucli i del mòdul
 *
 * Vénen de les de JEFE: s'hi han deixat les del nucli i les de Nutrició, i
 * s'han tret les dels mòduls que aquesta app no porta.
 *
 *   npm run prova     (i també des de `npm run puja`)
 *
 * Executa el codi de debò dels fitxers del nucli fora d'Apps Script, amb
 * dobles a sota en lloc de Google Sheets. No toca cap dada teva.
 *
 * Aquí hi va el que es pot comprovar sense el full: decisions de codi amb
 * regles clares. El que depèn de dades reals es comprova a l'app.
 */
import fs from 'fs';
import vm from 'vm';
import zlib from 'zlib';

let falles = 0;
function cal(nom, cond, extra) {
  console.log((cond ? '  ok   ' : '  FALLA') + '  ' + nom + (cond ? '' : '  → ' + extra));
  if (!cond) falles++;
}

/* EL PANY. El de debò el posa Apps Script; aquí n'hi ha prou amb un que digui
   que sí i porti el compte de quantes vegades l'han demanat, que és el que
   les proves d'escriptura volen mirar: que cap escriptura no hi passi per
   sobre. `panys.demanats` es posa a zero quan una prova vol comptar. */
const panys = { demanats: 0, alliberats: 0 };
function panyFals() {
  return {
    getScriptLock: () => ({
      tryLock: () => { panys.demanats++; return true; },
      releaseLock: () => { panys.alliberats++; }
    })
  };
}


/**
 * Carrega TOT el servidor en un sol espai global, com fa Apps Script.
 *
 * Els blocs d aquest fitxer solen carregar un fitxer sol, i n hi ha prou. Per
 * a les coses que travessen el nucli i un modul —els avisos programats, per
 * exemple— no: alla el que es comprova es precisament que es trobin.
 */
function carregaTotElServidor() {
  const ctx = {
    console, Date, JSON, Math, RegExp, Number, String, Object, Array,
    isFinite, isNaN, parseFloat, parseInt, encodeURIComponent, decodeURIComponent,
    Utilities: {}, DriveApp: {}, SpreadsheetApp: {}, UrlFetchApp: {}, CacheService: {},
    LockService: panyFals(), Session: {}, HtmlService: {}, CalendarApp: {}, MailApp: {},
    ContentService: {}, Logger: { log() {} }, ScriptApp: {},
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {} }) }
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  fs.readdirSync('apps-script').filter((f) => f.endsWith('.gs')).sort()
    .forEach((f) => vm.runInContext(fs.readFileSync('apps-script/' + f, 'utf8'), ctx, { filename: f }));
  return ctx;
}

// ---------------------------------------------------------------- encaminador
console.log('\nEncaminador: escriure i tornar la pantalla en una sola crida');
{
  const CLAU = 'la-clau-bona-de-quaranta-vuit-caracters-exactes';
  const ctx = {
    Date, Log: { error() {}, avis() {} },
    Utils: { avui: () => '2026-08-01', ara: () => 'ara' },
    Moduls: null, Config: null, IA: null, Esquema: null, ScriptApp: null,
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => CLAU }) },
    ContentService: null, HtmlService: null,
    CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
    /* El resum de debò el fa Apps Script. Aquí n'hi ha prou amb un que
       torni bytes diferents per a textos diferents i sempre la mateixa
       llargada, que és el que la comparació dona per fet. */
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
      computeDigest: (_alg, text) => {
        const b = new Array(32).fill(0);
        for (let i = 0; i < String(text).length; i++) {
          b[i % 32] = (b[i % 32] + String(text).charCodeAt(i) * (i + 7)) % 251;
        }
        return b;
      }
    },
    VERSIO_JEFE: 'prova', PROP_CLAU_ACCES: 'CLAU_ACCES'
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/30_Encaminador.gs', 'utf8'), ctx);

  let vistos = null;
  ctx.Moduls = {
    perId: () => ({
      accions: {
        captura: (p) => { vistos = JSON.parse(JSON.stringify(p)); return { id: 'tsk_1' }; },
        pantalla: (p) => ({ soc: 'la pantalla', params: p })
      }
    })
  };

  const r = ctx.api(CLAU, 'tasques', 'captura', { text: 'comprar pa', _pantalla: {} });
  cal('respon ok', r.ok === true, JSON.stringify(r));
  cal('torna el resultat de l\'escriptura', r.dades._resultat.id === 'tsk_1', JSON.stringify(r.dades));
  cal('torna la pantalla refeta', r.dades._pantalla.soc === 'la pantalla', JSON.stringify(r.dades));
  cal('l\'acció NO veu `_pantalla`', vistos && vistos._pantalla === undefined, JSON.stringify(vistos));
  cal('l\'acció sí que veu els seus paràmetres', vistos.text === 'comprar pa', JSON.stringify(vistos));

  // Sense demanar-la, tot ha de quedar exactament com abans.
  const r2 = ctx.api(CLAU, 'tasques', 'captura', { text: 'x' });
  cal('sense `_pantalla`, resposta de tota la vida', r2.dades.id === 'tsk_1', JSON.stringify(r2.dades));

  // `pantalla` demanant-se a si mateixa no s'ha de duplicar.
  const r3 = ctx.api(CLAU, 'tasques', 'pantalla', { _pantalla: {} });
  cal('`pantalla` no es crida a si mateixa', r3.dades.soc === 'la pantalla', JSON.stringify(r3.dades));

  // Un mòdul sense `pantalla` no ha de petar.
  ctx.Moduls.perId = () => ({ accions: { fes: () => 'fet' } });
  const r4 = ctx.api(CLAU, 'qualsevol', 'fes', { _pantalla: {} });
  cal('mòdul sense pantalla: no peta', r4.ok === true && r4.dades === 'fet', JSON.stringify(r4));
}

/* ---------------------------------------------------------------- la porta
   El desplegament és anònim: qualsevol que tingui l'adreça rep la pàgina i
   pot cridar el servidor des de la consola. La clau era només a `doPost`,
   o sigui que aquell camí entrava sense ensenyar-la. Això ho vigila. */
console.log('\nLa porta: cap crida sense clau, vingui d\'on vingui');
{
  const CLAU = 'la-clau-bona-de-quaranta-vuit-caracters-exactes';
  const apuntat = [];
  const ctx = {
    Date, Log: { error() {}, avis: (q, t, d) => apuntat.push(q) },
    Utils: { avui: () => '2026-08-01', ara: () => 'ara' },
    Moduls: { perId: () => ({ accions: { llegeix: () => 'les teves dades' } }) },
    Config: { idFull: () => 'FULL-123' },
    IA: null, Esquema: null, ScriptApp: null,
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => CLAU }) },
    ContentService: null, HtmlService: null,
    CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' }, Charset: { UTF_8: 'UTF_8' },
      computeDigest: (_alg, text) => {
        const b = new Array(32).fill(0);
        for (let i = 0; i < String(text).length; i++) {
          b[i % 32] = (b[i % 32] + String(text).charCodeAt(i) * (i + 7)) % 251;
        }
        return b;
      }
    },
    VERSIO_JEFE: 'prova', PROP_CLAU_ACCES: 'CLAU_ACCES'
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/30_Encaminador.gs', 'utf8'), ctx);

  const bona = ctx.api(CLAU, 'finances', 'llegeix', {});
  cal('amb la clau bona, entra', bona.ok === true && bona.dades === 'les teves dades', JSON.stringify(bona));

  const dolenta = ctx.api('una-clau-inventada-qualsevol-de-48-caracters', 'finances', 'llegeix', {});
  cal('amb una clau dolenta, no entra', dolenta.ok === false, JSON.stringify(dolenta));
  cal('i no diu res del que hi havia a dins',
      !/les teves dades/.test(JSON.stringify(dolenta)), JSON.stringify(dolenta));
  cal('i ho deixa apuntat', apuntat.indexOf('api.rebutjat') !== -1, JSON.stringify(apuntat));

  cal('sense clau, no entra', ctx.api(undefined, 'finances', 'llegeix', {}).ok === false);
  cal('amb la clau buida, tampoc', ctx.api('', 'finances', 'llegeix', {}).ok === false);

  /* LA CRIDA D'ABANS TENIA TRES ARGUMENTS i el primer era el mòdul. Si algun
     client vell sobreviu en una pestanya oberta, ha de fallar i no colar-se
     pel forat: cap nom de mòdul no és mai la clau. */
  cal('una crida de les d\'abans no s\'hi cola',
      ctx.api('finances', 'llegeix', {}).ok === false);

  /* La llargada de la clau bona tampoc s'ha de poder endevinar provant. */
  cal('una clau d\'una lletra es rebutja igual', ctx.api('x', 'finances', 'llegeix', {}).ok === false);

  // El servidor sense clau posada ho ha de dir, no callar.
  ctx.PropertiesService = { getScriptProperties: () => ({ getProperty: () => null }) };
  const sense = ctx.api(CLAU, 'finances', 'llegeix', {});
  cal('servidor sense clau configurada: ho diu', sense.ok === false && /generaClauAcces/.test(sense.error), JSON.stringify(sense));

  /* EL QUE S'INJECTA A LA PÀGINA QUE SE SERVEIX SENSE CLAU.
     Hi anava `estatSistema()` sencer, amb l'identificador i l'URL del full. */
  ctx.Moduls.perAlClient = () => [{ id: 'finances', nom: 'Finances' }];
  const pub = ctx.estatPublic_();
  cal('la pàgina pública porta els mòduls', pub.moduls.length === 1, JSON.stringify(pub));
  cal('i no porta l\'adreça del full', !/FULL-123/.test(JSON.stringify(pub)), JSON.stringify(pub));

  cal('el text d\'un error s\'escapa', ctx.escapaHtml_('<script>x</script>').indexOf('<') === -1,
      ctx.escapaHtml_('<script>x</script>'));
}

// ------------------------------------------------------------- actualitzaMoltes
console.log('\nDades.actualitzaMoltes: escriu per trams seguits');
{
  const escriptures = [];
  const capcalera = ['id', 'estat', 'esborrat_el'];
  const files = [];
  for (let i = 1; i <= 10; i++) files.push(['t' + i, 'feta', '']);

  const fulla = {
    getDataRange: () => ({ getValues: () => [capcalera].concat(files) }),
    getRange: (fila, c, n) => ({
      setValues: (v) => { escriptures.push({ fila, n, v }); }
    }),
    getMaxRows: () => 100
  };

  const ctx = {
    Utils: { nouId: () => 'x', ara: () => 'ARA' },
    Config: { full: () => ({ getSheetByName: () => fulla }) },
    LockService: panyFals(), Moduls: undefined
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/10_Dades.gs', 'utf8'), ctx);

  // t2,t3,t4 seguits · t7 sol · t9,t10 seguits  →  3 escriptures, no 6
  const n = ctx.Dades.actualitzaMoltes('Tasques', ['t3', 't10', 't2', 't7', 't4', 't9'],
                                       { esborrat_el: 'ARA' });
  cal('diu quantes n\'ha tocat', n === 6, String(n));
  cal('agrupa en 3 escriptures i no 6', escriptures.length === 3,
      escriptures.map(e => e.fila + '×' + e.n).join(' '));
  cal('els trams són els que toca',
      escriptures.map(e => e.fila + '×' + e.n).sort().join(' ') === '10×2 3×3 8×1',
      escriptures.map(e => e.fila + '×' + e.n).sort().join(' '));
  cal('escriu el canvi', escriptures[0].v[0][2] === 'ARA', JSON.stringify(escriptures[0].v[0]));
  cal('no toca el que no li han dit',
      escriptures.every(e => e.v.every(f => ['t2','t3','t4','t7','t9','t10'].indexOf(f[0]) !== -1)),
      JSON.stringify(escriptures.map(e => e.v.map(f => f[0]))));

  // Un id que no hi és no ha de fer caure res.
  escriptures.length = 0;
  const n2 = ctx.Dades.actualitzaMoltes('Tasques', ['no_existeix'], { estat: 'x' });
  cal('id inexistent: no escriu res', n2 === 0 && escriptures.length === 0, String(n2));

  // Amb una funció, cada fila rep uns canvis diferents. És el que fa possible
  // reordenar una llista: el mateix camp amb un valor per fila.
  escriptures.length = 0;
  const capcalera2 = ['id', 'ordre'];
  const files2 = [['a', 9], ['b', 9], ['c', 9]];
  const fulla2 = {
    getDataRange: () => ({ getValues: () => [capcalera2].concat(files2) }),
    getRange: (fila, c, n) => ({ setValues: (v) => { escriptures.push({ fila, n, v }); } }),
    getMaxRows: () => 100
  };
  ctx.Config.full = () => ({ getSheetByName: () => fulla2 });
  ctx.Dades.invalida();

  const n3 = ctx.Dades.actualitzaMoltes('Habits', ['c', 'a', 'b'],
                                        (h, i) => ({ ordre: i + 1 }));
  const escrits = escriptures.flatMap(e => e.v).map(f => f[0] + ':' + f[1]).sort().join(' ');
  cal('amb funció, cada fila rep el seu valor', n3 === 3 && escrits === 'a:2 b:3 c:1', escrits);
}

/* ------------------------------------------------------- cap escriptura sola
   «Mirar on acaba el full» i «escriure-hi» eren dos moments i entremig hi
   cabia una altra pestanya: totes dues escrivien a la mateixa fila i la
   segona es menjava la primera. El pany hi era —`ambBloqueig_`— però només
   el demanaven els automatismes de la nit, no el que toques tu. */
console.log('\nEscriure al full: cap escriptura no va sola');
{
  const capcalera = ['id', 'text', 'creat_el'];
  const files = [['t1', 'una', 'ARA']];
  const fulla = {
    getDataRange: () => ({ getValues: () => [capcalera].concat(files) }),
    getRange: () => ({ setValues: () => {} }),
    getLastRow: () => files.length + 1,
    getMaxRows: () => 100,
    insertRowsAfter: () => {}
  };
  const ctx = {
    Utils: { nouId: () => 'nou', ara: () => 'ARA' },
    Config: { full: () => ({ getSheetByName: () => fulla }) },
    LockService: panyFals(), Moduls: undefined
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/10_Dades.gs', 'utf8'), ctx);

  const prova = (nom, fn) => {
    panys.demanats = 0; panys.alliberats = 0;
    ctx.Dades.invalida();
    fn();
    cal(nom + ' demana el pany', panys.demanats === 1, String(panys.demanats));
    cal(nom + ' el torna', panys.alliberats === 1, String(panys.alliberats));
  };

  prova('inserir', () => ctx.Dades.insereix('Tasques', { text: 'dues' }));
  prova('actualitzar', () => ctx.Dades.actualitza('Tasques', 't1', { text: 'canviada' }));
  prova('desar', () => ctx.Dades.desa('Tasques', { id: 't1', text: 'x' }, ['id']));
  prova('inserir-ne moltes', () => ctx.Dades.insereixMoltes('Tasques', [{ text: 'a' }, { text: 'b' }]));
  prova('actualitzar-ne moltes', () => ctx.Dades.actualitzaMoltes('Tasques', ['t1'], { text: 'y' }));

  /* UN DINS DE L'ALTRE NO EN SÓN DOS. `desa` acaba cridant `insereix`, i els
     resums de la nit ja s'executen dins d'un bloqueig: si cadascú en demanés
     un de nou, el fil s'esperaria a si mateix. */
  panys.demanats = 0; ctx.Dades.invalida();
  ctx.Dades.desa('Tasques', { id: 'cap', text: 'nova' }, ['id']);
  cal('un pany dins d\'un altre no en demana dos', panys.demanats === 1, String(panys.demanats));

  panys.demanats = 0; ctx.Dades.invalida();
  ctx.ambBloqueig_(function () {
    ctx.Dades.insereix('Tasques', { text: 'dins' });
    ctx.Dades.insereix('Tasques', { text: 'dins també' });
  });
  cal('i el de fora val per a tot el que hi passi', panys.demanats === 1, String(panys.demanats));

  /* I quan el pany no es pot agafar, l'escriptura no es fa d'amagat. */
  ctx.LockService = { getScriptLock: () => ({ tryLock: () => false, releaseLock() {} }) };
  let peta = false;
  try { ctx.Dades.insereix('Tasques', { text: 'sense pany' }); }
  catch (e) { peta = /ocupat/.test(e.message); }
  cal('si el pany no s\'agafa, no s\'escriu i es diu', peta === true);
}

// -------------------- parlar amb en JEFE no ha d'esborrar la fitxa que el fa rapid
console.log("");
console.log("La fitxa de la IA: nomes es llenca quan canvia alguna cosa que hi surt");
{
  const moduls = [
    { id: 'conversa', nom: 'JEFE',
      fulls: [{ nom: 'Converses' }] },                       // sense contextIA
    { id: 'habits', nom: 'Habits',
      fulls: [{ nom: 'Habits' }, { nom: 'Registres' }],
      contextIA: function () { return 'habits'; } },
    { id: 'calendari', nom: 'Calendari',
      fulls: [{ nom: 'Calendaris' }],
      contextIA: function () { return 'calendari'; } }
  ];

  let esborrades = 0;
  const ctx = {
    Date, Math, JSON, String, Number, Object, Array,
    Log: { info() {}, avis() {}, error() {} },
    CacheService: { getScriptCache: () => ({
      get: () => null, getAll: () => ({}), put: () => {}, putAll: () => {},
      remove: () => { esborrades++; },
      removeAll: (ks) => { if (ks.length) esborrades++; } }) },
    Config: { full: () => ({ getSheetByName: () => null }) },
    Dades: null, Esquema: {}, IA: {}, Utils: { ara: () => 'ara', avui: () => '2026-08-02' },
    SpreadsheetApp: {}, PropertiesService: {}, ScriptApp: {},
    HtmlService: {}, UrlFetchApp: {}, LockService: panyFals(), Session: {}, Utilities: {}
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/20_Moduls.gs', 'utf8'), ctx);
  // Els mòduls es descobreixen per `globalThis`: se n'hi posen tres de mentida.
  moduls.forEach(function (m) { ctx['MODUL_' + m.id.toUpperCase()] = function () { return m; }; });

  cal('el full de converses NO alimenta la fitxa',
      ctx.Moduls.alimentaContext('Converses') === false, 'diu que sí');
  cal('els registres d hàbits SÍ', ctx.Moduls.alimentaContext('Registres') === true, 'diu que no');
  cal('els calendaris SÍ', ctx.Moduls.alimentaContext('Calendaris') === true, 'diu que no');
  cal('els aparells de les notificacions NO',
      ctx.Moduls.alimentaContext('_Dispositius') === false, 'diu que sí');
  cal('el registre NO', ctx.Moduls.alimentaContext('_Registre') === false, 'diu que sí');
  cal('la configuració SÍ, que allà hi ha els objectius',
      ctx.Moduls.alimentaContext('_Config') === true, 'diu que no');
  cal('un full que no és de ningú, sí: davant del dubte, es torna a muntar',
      ctx.Moduls.alimentaContext('UnFullQueNoConec') === true, 'diu que no');

  // I ara el camí de debò: escriure passa per Dades.invalida.
  const dadesCtx = {
    Utils: { nouId: () => 'x', ara: () => 'ARA' },
    Config: { full: () => ({ getSheetByName: () => ({
      getDataRange: () => ({ getValues: () => [['id']] }),
      getRange: () => ({ setValues: () => {} }), getMaxRows: () => 10 }) }) },
    LockService: panyFals(), Moduls: ctx.Moduls
  };
  vm.createContext(dadesCtx);
  vm.runInContext(fs.readFileSync('apps-script/10_Dades.gs', 'utf8'), dadesCtx);

  esborrades = 0;
  dadesCtx.Dades.invalida('Converses');
  cal('escriure una conversa no llença la fitxa', esborrades === 0, String(esborrades));

  dadesCtx.Dades.invalida('_Dispositius');
  cal('obrir l app tampoc', esborrades === 0, String(esborrades));

  dadesCtx.Dades.invalida('Registres');
  cal('marcar un hàbit sí que la llença', esborrades === 1, String(esborrades));

  dadesCtx.Dades.invalida();
  cal('i sense dir quin full, també: no se sap què ha canviat', esborrades === 2, String(esborrades));
}

// --------------- la fitxa es munta per trossos: marcar un habit no toca finances
console.log("");
console.log("La fitxa de la IA: per trossos, no d'una peca");
{
  const muntats = [];
  const moduls = [
    { id: 'conversa', fulls: [{ nom: 'Converses' }] },
    { id: 'habits', fulls: [{ nom: 'Habits' }, { nom: 'Registres' }],
      contextIA: function () { muntats.push('habits'); return 'HABITS: en falten 3'; } },
    { id: 'finances', fulls: [{ nom: 'Moviments' }, { nom: 'Categories' }],
      contextIA: function () { muntats.push('finances'); return 'FINANCES: 400 EUR'; } },
    { id: 'calendari', fulls: [{ nom: 'Calendaris' }],
      contextIA: function () { muntats.push('calendari'); return 'CALENDARI: res'; } }
  ];

  const memoria = {};
  const ctx = {
    Date, Math, JSON, String, Number, Object, Array,
    Log: { info() {}, avis() {}, error() {} },
    CacheService: { getScriptCache: () => ({
      get: (k) => (memoria[k] === undefined ? null : memoria[k]),
      getAll: (ks) => { const o = {}; ks.forEach(k => { if (memoria[k] !== undefined) o[k] = memoria[k]; }); return o; },
      put: (k, v) => { memoria[k] = v; },
      putAll: (o) => { Object.keys(o).forEach(k => { memoria[k] = o[k]; }); },
      remove: (k) => { delete memoria[k]; },
      removeAll: (ks) => { ks.forEach(k => { delete memoria[k]; }); }
    }) },
    Config: { full: () => ({ getSheetByName: () => null }) },
    Dades: null, Esquema: {}, IA: {}, Utils: { ara: () => 'ara', avui: () => '2026-08-02' },
    SpreadsheetApp: {}, PropertiesService: {}, ScriptApp: {},
    HtmlService: {}, UrlFetchApp: {}, LockService: panyFals(), Session: {}, Utilities: {}
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/20_Moduls.gs', 'utf8'), ctx);
  moduls.forEach(function (m) { ctx['MODUL_' + m.id.toUpperCase()] = function () { return m; }; });

  const primera = ctx.Moduls.contextIA();
  cal('el primer cop els munta tots', muntats.sort().join(' ') === 'calendari finances habits',
      muntats.join(' '));
  cal('i la fitxa porta els tres', primera.indexOf('HABITS') !== -1 &&
      primera.indexOf('FINANCES') !== -1 && primera.indexOf('CALENDARI') !== -1, primera);

  muntats.length = 0;
  ctx.Moduls.contextIA();
  cal('el segon cop no en munta cap', muntats.length === 0, muntats.join(' '));

  // AIXO ES EL QUE IMPORTA: marcar un habit no ha de tornar a llegir finances.
  muntats.length = 0;
  ctx.Moduls.invalidaContext('Registres');
  const desprès = ctx.Moduls.contextIA();
  cal('marcar un habit nomes torna a muntar habits',
      muntats.join(' ') === 'habits', muntats.join(' ') || '(cap)');
  cal('i la fitxa segueix sencera', desprès.indexOf('FINANCES') !== -1 &&
      desprès.indexOf('CALENDARI') !== -1, desprès);

  // Una despesa nomes toca finances.
  muntats.length = 0;
  ctx.Moduls.invalidaContext('Moviments');
  ctx.Moduls.contextIA();
  cal('apuntar una despesa nomes torna a muntar finances',
      muntats.join(' ') === 'finances', muntats.join(' ') || '(cap)');

  // Un full de ningu no se sap que ha tocat: es tomben tots.
  muntats.length = 0;
  ctx.Moduls.invalidaContext('_Config');
  ctx.Moduls.contextIA();
  cal('un full que no es de cap modul els tomba tots',
      muntats.sort().join(' ') === 'calendari finances habits', muntats.join(' '));

  // I sense dir quin full, tambe.
  muntats.length = 0;
  ctx.Moduls.invalidaContext();
  ctx.Moduls.contextIA();
  cal('i sense dir res, tambe', muntats.length === 3, String(muntats.length));

  // El full de converses no ha de tombar res.
  muntats.length = 0;
  if (ctx.Moduls.alimentaContext('Converses')) ctx.Moduls.invalidaContext('Converses');
  ctx.Moduls.contextIA();
  cal('parlar segueix sense tombar res', muntats.length === 0, muntats.join(' '));
}

// ------------------- el que s'envia a Gemini: audio, eines i que no rumii per res
console.log("");
console.log("Transport a Gemini: la forma de la peticio");
{
  let enviat = null;
  const ctx = {
    Date, Math, JSON, String, Number, Object, Array, RegExp, encodeURIComponent,
    Log: { info() {}, avis() {}, error() {} },
    Config: {
      get: (k) => ({ model_bo: 'gemini-2.5-flash', model_barat: 'gemini-2.5-flash',
                     proveidor_ia: 'gemini', ia_activa: 'SI' })[k] || null,
      getNum: (k, d) => (k === 'pensa_tokens' ? 0 : d),
      esSi: () => true
    },
    Utils: { desJson: (t, d) => { try { return JSON.parse(t); } catch (e) { return d; } },
             talla: (t, n) => String(t).slice(0, n), ara: () => 'ara', avui: () => '2026-08-02' },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'clau-de-mentida' }) },
    UrlFetchApp: { fetch: (url, o) => {
      enviat = { url: url, cos: JSON.parse(o.payload), capcaleres: o.headers };
      return { getResponseCode: () => 200, getContentText: () => JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'fet' }] } }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 2, thoughtsTokenCount: 314 } }) };
    } },
    CacheService: { getScriptCache: () => null },
    SpreadsheetApp: {}, Session: {}, HtmlService: {}, LockService: panyFals(),
    Utilities: {}, ScriptApp: {}, Dades: {}, Moduls: {}, Esquema: {}
  };
  vm.createContext(ctx);
  ctx.PROP_CLAU_IA = 'CLAU_IA';
  vm.runInContext(fs.readFileSync('apps-script/50_IA.gs', 'utf8'), ctx);

  const r0 = ctx.IA.genera({
    sistema: 'ets en JEFE',
    missatges: [
      { rol: 'usuari', text: 'hola' },
      { role: 'user', parts: [{ text: 'aixo t ha dit de veu:' },
                              { inline_data: { mime_type: 'audio/wav', data: 'UklGRg==' } }] }
    ],
    eines: [{ nom: 'mostra_el_dia', descripcio: 'obre el dia',
              esquema: { type: 'object', properties: { data: { type: 'string' } } } }],
    model: 'bo', maxTokens: 1200, temperatura: 0
  });

  cal('la clau va a la capcalera i mai a l url',
      !!ctx.IA && enviat.capcaleres['x-goog-api-key'] === 'clau-de-mentida' &&
      enviat.url.indexOf('clau-de-mentida') === -1, enviat.url);

  cal('diu quant ha rumiat, amb la xifra de Google i no una suposada',
      r0.tokensPensats === 314, JSON.stringify(r0.tokensPensats));

  const parts = enviat.cos.contents[1].parts;
  cal("l'audio arriba tal qual, sense passar per cap transcripcio",
      parts[1].inline_data.mime_type === 'audio/wav' && parts[1].inline_data.data === 'UklGRg==',
      JSON.stringify(parts));
  cal('i el torn de text d abans hi segueix sent',
      enviat.cos.contents[0].parts[0].text === 'hola', JSON.stringify(enviat.cos.contents[0]));

  cal("amb l'audio hi van les EINES: les ordres d'accio han de seguir anant",
      enviat.cos.tools[0].functionDeclarations[0].name === 'mostra_el_dia',
      JSON.stringify(enviat.cos.tools));

  // AIXO ES EL QUE COSTAVA DEU SEGONS.
  cal('no se li deixa rumiar abans de contestar',
      enviat.cos.generationConfig.thinkingConfig.thinkingBudget === 0,
      JSON.stringify(enviat.cos.generationConfig));

  // I amb un model que no ho enten, aquest camp fa petar l'API: no s hi ha de posar.
  enviat = null;
  ctx.Config.get = (k) => ({ model_bo: 'gemini-1.5-pro', proveidor_ia: 'gemini', ia_activa: 'SI' })[k] || null;
  ctx.IA.genera({ sistema: 'x', missatges: [{ rol: 'usuari', text: 'hola' }], model: 'bo' });
  // I si el model es queixa, s'hi torna sense i se'n recorda.
  var intents = 0;
  ctx.UrlFetchApp.fetch = (url, o) => {
    intents++;
    enviat = { url: url, cos: JSON.parse(o.payload) };
    if (enviat.cos.generationConfig.thinkingConfig) {
      return { getResponseCode: () => 400,
               getContentText: () => JSON.stringify({ error: { message: 'invalid argument' } }) };
    }
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'fet' }] } }],
      usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 } }) };
  };
  ctx.Config.get = (k) => ({ model_bo: 'gemini-2.5-pro', proveidor_ia: 'gemini', ia_activa: 'SI' })[k] || null;
  var r2 = ctx.IA.genera({ sistema: 'x', missatges: [{ rol: 'usuari', text: 'hola' }], model: 'bo' });
  cal('si no accepta el zero, baixa al minim i respon igual',
      intents === 3 && r2.text === 'fet', intents + ' intents');
  cal('i si ni amb el minim, es deixa corrent',
      enviat.cos.generationConfig.thinkingConfig === undefined,
      JSON.stringify(enviat.cos.generationConfig));

  // EL CAS QUE IMPORTA: n'hi ha que accepten el minim encara que no el zero.
  // Abans queien directament a «rumia el que vulguis» i alla se n'anaven els
  // segons que preteniem estalviar.
  intents = 0;
  ctx.UrlFetchApp.fetch = (url, o) => {
    intents++;
    enviat = { url: url, cos: JSON.parse(o.payload) };
    var t = enviat.cos.generationConfig.thinkingConfig;
    if (t && t.thinkingBudget === 0) {
      return { getResponseCode: () => 400,
               getContentText: () => JSON.stringify({ error: { message: 'budget must be >= 128' } }) };
    }
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'fet' }] } }],
      usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 } }) };
  };
  ctx.Config.get = (k) => ({ model_bo: 'un-altre-model', proveidor_ia: 'gemini', ia_activa: 'SI' })[k] || null;
  ctx.IA.genera({ sistema: 'x', missatges: [{ rol: 'usuari', text: 'hola' }], model: 'bo' });
  cal('amb un que vol un minim, s hi queda i no el deixa lliure',
      intents === 2 && enviat.cos.generationConfig.thinkingConfig.thinkingBudget === 128,
      intents + ' intents · ' + JSON.stringify(enviat.cos.generationConfig.thinkingConfig));

  intents = 0;
  ctx.IA.genera({ sistema: 'x', missatges: [{ rol: 'usuari', text: 'i ara' }], model: 'bo' });
  cal('i la seguent ja va directa al minim',
      intents === 1 && enviat.cos.generationConfig.thinkingConfig.thinkingBudget === 128,
      intents + ' intents');

  // I la seguent pregunta al mateix model ja no ho torna a provar.
  intents = 0;
  ctx.IA.genera({ sistema: 'x', missatges: [{ rol: 'usuari', text: 'i ara' }], model: 'bo' });
  cal('i no ho torna a provar cada vegada', intents === 1, intents + ' intents');
}

// ------------------- una ordre dita de veu no ha de passar pel model
console.log("");
console.log("Veu: les ordres es reconeixen despres de transcriure, sense preguntar");
{
  const moduls = [
    { id: 'conversa', fulls: [{ nom: 'Converses' }],
      dreceres: [{ vista: 'dia', frases: ['pagina del dia', 'pagina d avui', 'full del dia'] }] },
    { id: 'habits', fulls: [{ nom: 'Habits' }], contextIA: function () { return 'habits'; } }
  ];
  const ctx = {
    Date, Math, JSON, String, Number, Object, Array, RegExp,
    Log: { info() {}, avis() {}, error() {} },
    CacheService: { getScriptCache: () => null },
    Config: { full: () => ({ getSheetByName: () => null }), zonaHoraria: () => 'Europe/Madrid' },
    Utilities: { formatDate: () => '2026-08-02' },
    Dades: { llegeix: () => [] }, Esquema: {}, IA: {},
    SpreadsheetApp: {}, PropertiesService: {}, ScriptApp: {},
    HtmlService: {}, UrlFetchApp: {}, LockService: panyFals(), Session: {}
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/01_Utils.gs', 'utf8'), ctx);
  vm.runInContext(fs.readFileSync('apps-script/20_Moduls.gs', 'utf8'), ctx);
  moduls.forEach(function (m) { ctx['MODUL_' + m.id.toUpperCase()] = function () { return m; }; });

  const d = (t) => { const r = ctx.Moduls.drecera(t); return r ? r.vista : null; };

  cal("amb accents i apostrof, com ho diu una persona",
      d("Ensenya'm la pàgina del dia") === 'dia', String(d("Ensenya'm la pàgina del dia")));
  cal('sense accents, igual', d('obre la pagina del dia') === 'dia', String(d('obre la pagina del dia')));
  cal('en majuscules, igual', d("ENSENYA LA PÀGINA D'AVUI") === 'dia',
      String(d("ENSENYA LA PÀGINA D'AVUI")));
  cal('amb signes pel mig, igual', d("va, ensenya-m'ho: la pàgina del dia!") === 'dia',
      String(d("va, ensenya-m'ho: la pàgina del dia!")));

  cal('una pregunta de debo NO es una ordre', d('quants cigarros he fumat avui') === null,
      String(d('quants cigarros he fumat avui')));
  cal('ni aquesta', d('com ha anat el dia') === null, String(d('com ha anat el dia')));
  cal('ni res buit', d('') === null && d(null) === null, 'diu que si');

  // La bessona del client ha de fer exactament el mateix.
  cal("l'aixafat treu accents, signes i espais de mes",
      ctx.Utils.aixafa("  Ensenya'm  la PÀGINA del dia!! ") === 'ensenya m la pagina del dia',
      ctx.Utils.aixafa("  Ensenya'm  la PÀGINA del dia!! "));
}

// --------- les pantalles desades: rapides, pero mai amb una dada vella
console.log("");
console.log("Memoria de pantalles: desar sense mentir");
{
  const memoria = {};
  const cau = {
    get: (k) => (memoria[k] === undefined ? null : memoria[k]),
    getAll: (ks) => { const o = {}; ks.forEach(k => { if (memoria[k] !== undefined) o[k] = memoria[k]; }); return o; },
    put: (k, v) => { memoria[k] = v; },
    putAll: (o) => { Object.keys(o).forEach(k => { memoria[k] = o[k]; }); },
    remove: (k) => { delete memoria[k]; },
    removeAll: (ks) => { ks.forEach(k => { delete memoria[k]; }); }
  };

  const moduls = [
    { id: 'tasques', fulls: [{ nom: 'Tasques' }] },
    { id: 'finances', fulls: [{ nom: 'Moviments' }, { nom: 'Categories' }] }
  ];

  const ctx = {
    Date, Math, JSON, String, Number, Object, Array, RegExp,
    Log: { info() {}, avis() {}, error() {} },
    CacheService: { getScriptCache: () => cau },
    Config: { full: () => ({ getSheetByName: () => null }) },
    Utils: { avui: () => '2026-08-02', ara: () => 'ara' },
    Dades: null, Esquema: {}, IA: {}, SpreadsheetApp: {}, PropertiesService: {},
    ScriptApp: {}, HtmlService: {}, UrlFetchApp: {}, LockService: panyFals(), Session: {}, Utilities: {}
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/20_Moduls.gs', 'utf8'), ctx);
  vm.runInContext(fs.readFileSync('apps-script/25_Memoria.gs', 'utf8'), ctx);
  moduls.forEach(function (m) { ctx['MODUL_' + m.id.toUpperCase()] = function () { return m; }; });

  let muntades = 0;
  const pantalla = (modul, nom, valor) =>
    ctx.Memoria.recorda(modul, nom, () => { muntades++; return { v: valor }; });

  // 1. La segona vegada no es torna a muntar.
  cal('la primera vegada la munta', pantalla('tasques', 'pantalla', 1).v === 1 && muntades === 1,
      String(muntades));
  muntades = 0;
  cal('la segona ja no', pantalla('tasques', 'pantalla', 1).v === 1 && muntades === 0,
      String(muntades));

  // 2. Dues pantalles diferents del mateix modul no es trepitgen.
  muntades = 0;
  const a = pantalla('finances', 'pantalla:mes:2026-08', 'agost');
  const b = pantalla('finances', 'pantalla:mes:2026-07', 'juliol');
  cal('cada pantalla te la seva clau', a.v === 'agost' && b.v === 'juliol' && muntades === 2,
      a.v + '/' + b.v + ' · ' + muntades);

  // 3. I ARA EL QUE IMPORTA: escriure ha de tombar el que sigui d'aquell modul.
  const dadesCtx = {
    Utils: { nouId: () => 'x', ara: () => 'ARA' },
    Config: { full: () => ({ getSheetByName: () => ({
      getDataRange: () => ({ getValues: () => [['id']] }),
      getRange: () => ({ setValues: () => {} }), getMaxRows: () => 10 }) }) },
    LockService: panyFals(), Moduls: ctx.Moduls, Memoria: ctx.Memoria
  };
  vm.createContext(dadesCtx);
  vm.runInContext(fs.readFileSync('apps-script/10_Dades.gs', 'utf8'), dadesCtx);

  muntades = 0;
  dadesCtx.Dades.invalida('Moviments');
  pantalla('finances', 'pantalla:mes:2026-08', 'agost NOU');
  cal('apuntar un moviment tomba la pantalla de finances', muntades === 1, String(muntades));
  cal('i la torna a muntar amb el que hi ha ara',
      pantalla('finances', 'pantalla:mes:2026-08', 'x').v === 'agost NOU', 'ensenya la vella');

  // 4. I no ha de tombar la del vei.
  muntades = 0;
  pantalla('tasques', 'pantalla', 'no importa');
  cal('i no toca la de tasques, que no ha canviat', muntades === 0, String(muntades));

  // 5. Un full de ningu no se sap que ha tocat: cauen totes.
  muntades = 0;
  dadesCtx.Dades.invalida('_Config');
  pantalla('tasques', 'pantalla', 'z');
  pantalla('finances', 'pantalla:mes:2026-08', 'z');
  cal('canviar la configuracio les tomba totes', muntades === 2, String(muntades));

  // 6. I sense dir quin full, tambe.
  muntades = 0;
  dadesCtx.Dades.invalida();
  pantalla('tasques', 'pantalla', 'w');
  cal('i sense dir res, tambe', muntades === 1, String(muntades));

  // 7. EL CALAIX COMU: el que suma tots els moduls cau amb qualsevol escriptura.
  muntades = 0;
  ctx.Memoria.recordaComu('inici', () => { muntades++; return { v: 1 }; });
  ctx.Memoria.recordaComu('inici', () => { muntades++; return { v: 1 }; });
  cal('el calaix comu tambe es desa', muntades === 1, String(muntades));

  muntades = 0;
  dadesCtx.Dades.invalida('Tasques');          // una escriptura d'un modul qualsevol
  ctx.Memoria.recordaComu('inici', () => { muntades++; return { v: 2 }; });
  cal("qualsevol escriptura tomba el comu, sigui d'on sigui", muntades === 1, String(muntades));

  // I no ha de durar mitja hora: hi ha el calendari a dins, que no surt de cap full.
  const abansPut = memoria['gen_nucli'];
  cal('el comu te el seu calaix a part', typeof abansPut === 'string', String(abansPut));

  // 8. Sense memoria cau, ha de seguir funcionant.
  ctx.CacheService.getScriptCache = () => { throw new Error('sense cau'); };
  muntades = 0;
  const r = pantalla('tasques', 'pantalla', 'sense cau');
  cal('sense memoria cau munta igual i no peta', r.v === 'sense cau' && muntades === 1,
      String(muntades));
}

// ----------- les targetes d'inici es desen, menys les del que no surt d'un full
console.log("");
console.log("Inici: cada targeta desada a casa seva, i el calendari mai");
{
  const memoria = {};
  const cau = {
    get: (k) => (memoria[k] === undefined ? null : memoria[k]),
    getAll: (ks) => { const o = {}; ks.forEach(k => { if (memoria[k] !== undefined) o[k] = memoria[k]; }); return o; },
    put: (k, v) => { memoria[k] = v; }, putAll: (o) => { Object.keys(o).forEach(k => { memoria[k] = o[k]; }); },
    remove: (k) => { delete memoria[k]; }, removeAll: (ks) => { ks.forEach(k => { delete memoria[k]; }); }
  };

  const comptador = { finances: 0, calendari: 0, tasques: 0 };
  const moduls = [
    { id: 'finances', nom: 'Finances', fulls: [{ nom: 'Moviments' }],
      resumInici: function () { comptador.finances++; return { etiqueta: 'Balanç', valor: '400 €' }; } },
    { id: 'tasques', nom: 'Tasques', fulls: [{ nom: 'Tasques' }],
      resumInici: function () { comptador.tasques++; return { etiqueta: 'Per fer', valor: 3 }; } },
    // El calendari NO surt del seu full: no s'ha de desar mai.
    { id: 'calendari', nom: 'Calendari', volatil: true, fulls: [{ nom: 'Calendaris' }],
      resumInici: function () { comptador.calendari++; return { etiqueta: 'El següent', valor: '17:00' }; } }
  ];

  const ctx = {
    Date, Math, JSON, String, Number, Object, Array, RegExp,
    Log: { info() {}, avis() {}, error() {} },
    CacheService: { getScriptCache: () => cau },
    Config: { full: () => ({ getSheetByName: () => null }) },
    Utils: { avui: () => '2026-08-02', ara: () => 'ara' },
    Dades: { llegeix: () => [] }, Esquema: {}, IA: {},
    SpreadsheetApp: {}, PropertiesService: {}, ScriptApp: {},
    HtmlService: {}, UrlFetchApp: {}, LockService: panyFals(), Session: {}, Utilities: {}
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/25_Memoria.gs', 'utf8'), ctx);
  vm.runInContext(fs.readFileSync('apps-script/20_Moduls.gs', 'utf8'), ctx);
  moduls.forEach(function (m) { ctx['MODUL_' + m.id.toUpperCase()] = function () { return m; }; });

  const t1 = ctx.Moduls.resumInici();
  cal('la primera vegada les munta totes',
      comptador.finances === 1 && comptador.tasques === 1 && comptador.calendari === 1,
      JSON.stringify(comptador));
  cal('i surten totes tres', t1.length === 3, String(t1.length));
  cal('amb el mòdul a dins', t1[0].modul === 'finances', JSON.stringify(t1[0]));

  ctx.Moduls.resumInici();
  cal('la segona no torna a muntar les que surten del full',
      comptador.finances === 1 && comptador.tasques === 1, JSON.stringify(comptador));
  cal('PERO EL CALENDARI SI: el que ensenya no surt del seu full',
      comptador.calendari === 2, String(comptador.calendari));

  // I escriure a finances no ha de tocar la targeta de tasques.
  ctx.Memoria.oblida('finances');
  ctx.Moduls.resumInici();
  cal('escriure a finances només torna a muntar la de finances',
      comptador.finances === 2 && comptador.tasques === 1, JSON.stringify(comptador));
}

/* -------------------------------------------------- el client també la porta
   El servidor ja no deixa entrar sense clau. Si el client de dins d'Apps
   Script no l'envia —o l'envia on no toca— l'app es queda muda contra el seu
   propi servidor, i això no ho veuria cap prova del servidor. */
console.log('\nEl client: la clau va davant a les dues bandes');
{
  const app = fs.readFileSync('apps-script/ui_app.html', 'utf8');

  const local = app.slice(app.indexOf('function cridaLocal_'), app.indexOf('function cridaRemota_'));
  cal('la crida de dins passa la clau com a primer argument',
      /\.api\(clau,\s*modul,\s*accio/.test(local), local.slice(-200));
  cal('i si no en té, ni ho intenta',
      /senseServidor\s*=\s*true/.test(local) && local.indexOf('Servidor.clau()') !== -1);

  const remota = app.slice(app.indexOf('function cridaRemota_'), app.indexOf('function crida('));
  cal('la crida de fora també la porta', /clau:\s*cfg\.clau/.test(remota));

  cal('i totes dues saben reconèixer que la clau no és bona',
      (local.match(/clauDolenta/g) || []).length >= 1 &&
      (remota.match(/clauDolenta/g) || []).length >= 1);

  /* `llest()` és qui decideix si cal demanar-la: dins d'Apps Script no fa
     falta adreça, però la clau sí. */
  const servidor = app.slice(app.indexOf('var Servidor = {'), app.indexOf('function cridaLocal_'));
  const c3 = { dinsAppsScript: () => true, Cau: { get: () => ({ clau: 'x' }) } };
  vm.createContext(c3);
  vm.runInContext(servidor + '\n;', c3);
  cal('amb clau i sense adreça, dins d\'Apps Script ja està llest',
      c3.Servidor.llest() === true);
  c3.Cau.get = () => ({ url: 'https://x/exec' });
  cal('amb adreça i sense clau, no', c3.Servidor.llest() === false);
  c3.dinsAppsScript = () => false;
  c3.Cau.get = () => ({ clau: 'x' });
  cal('i servit de fora, amb clau però sense adreça, tampoc',
      c3.Servidor.llest() === false);

  /* I que la pantalla d'error tingui sortida: sense servidor ha d'oferir
     connectar, no un «torna-ho a provar» que tornarà a fallar. */
  const comp = app.slice(app.indexOf('    error: function (err, reintenta)'),
                         app.indexOf('    avis: function (titol, text)'));
  cal('sense servidor, l\'error ofereix connectar', /data-connecta-ara/.test(comp));
  cal('i sempre hi ha una porta de sortida a l\'índex', /data-va-inici/.test(comp));
  cal('i qui escolta aquests dos botons existeix',
      /\[data-connecta-ara\]/.test(app) && /\[data-va-inici\]/.test(app));
}

// ------ el verdicte del dia: la còpia del navegador i la del servidor
/* Posar les calories cremades i esperar dos segons per saber si estàs en
   dèficit és esperar un càlcul que ja es pot fer al navegador: el que has
   menjat i el que has cremat són totes dues xifres allà, i la resta és una
   resta. Per això n'hi ha una còpia a la vista.
   Dues còpies deriven, i derivarien EN SILENCI: la pantalla diria una cosa i
   la notificació de la nit una altra. Això les fa córrer totes dues sobre els
   mateixos casos —inclosos els de vora, que són els que es fan malbé— i
   compara el text lletra per lletra. */
console.log('\nEl verdicte del dia: el navegador i el servidor diuen el mateix');
{
  const font = fs.readFileSync('apps-script/40_Mod_Nutricio.gs', 'utf8');
  const vista = fs.readFileSync('apps-script/vista_nutricio.html', 'utf8');

  const talla = (text, desde, fins) => {
    const i0 = text.indexOf(desde);
    const i1 = text.indexOf(fins, i0);
    return (i0 >= 0 && i1 > i0) ? text.slice(i0, i1) : '';
  };

  const srv = talla(font, '  function verdicte_(', '\n  }\n') + '\n  }\n';
  const cli = talla(vista, '    function verdicteLocal(', '\n    }\n') + '\n    }\n';
  cal('es troben les dues còpies', srv.length > 100 && cli.length > 100,
      JSON.stringify([srv.length, cli.length]));

  const ctxS = { Math }; vm.createContext(ctxS);
  vm.runInContext(srv + '\nvar __f = verdicte_;', ctxS);
  const ctxC = { Math }; vm.createContext(ctxC);
  vm.runInContext(cli + '\nvar __f = verdicteLocal;', ctxC);

  /* Els casos de vora primer: el zero, l'objectiu clavat i el que hi passa
     just per un. Són els que una còpia feta a mà es menja. */
  const CASOS = [
    [false, null, 500], [false, 300, 500],
    [true, 500, 500], [true, 499, 500], [true, 501, 500],
    [true, 0, 500], [true, -1, 500], [true, -350, 500],
    [true, 700, 0], [true, 0, 0], [true, -200, 0],
    [true, 123.4, 500], [true, 1200, 500]
  ];

  let diferents = [];
  CASOS.forEach(([te, net, obj]) => {
    const a = ctxS.__f(te, net, obj);
    const b = ctxC.__f(te, net, obj);
    if (a.estat !== b.estat || a.text !== b.text) {
      diferents.push(JSON.stringify({ cas: [te, net, obj], servidor: a, navegador: b }));
    }
  });
  cal('els ' + CASOS.length + ' casos donen el mateix estat i el mateix text',
      diferents.length === 0, diferents.join(' | '));

  cal('i la vista pinta el verdicte abans d\'enviar-lo, no després',
      /dades\.verdicte = verdicteLocal\(/.test(vista) &&
      vista.indexOf('dades.verdicte = verdicteLocal(') <
      vista.indexOf("escriu('nutricio', 'activitat'"));
}

// ------------- les calories cremades, que ja les escriu cada dia i no es creuaven
/* La xifra que dona el rellotge era l'única mesura diària del que s'ha mogut de
   debò que hi ha a l'app, i només sortia dins del dèficit. El dèficit barreja
   dues coses: un dia de sortida llarga i un dia de menjar poc donen el mateix
   número i no són el mateix dia. Aquí es comprova que les cremades surtin soles
   —perquè es puguin creuar amb el pes, la cintura, el son— i que segueixin a la
   família del dèficit, que és el que evita la troballa que no ho és. */
console.log('\nLes calories cremades es poden creuar amb la resta');
{
  const font = fs.readFileSync('apps-script/40_Mod_Nutricio.gs', 'utf8');
  const srvFont = font.slice(font.indexOf('var Nutricio = (function ()'),
                             font.lastIndexOf('})();') + 5);

  /* Quaranta dies: prou perquè la sèrie tingui vida (en demana catorze). Els
     parells amb cremades, els senars sense: així es comprova que un dia sense
     la xifra del rellotge no compti com un zero. */
  const dies = [];
  for (let n = 1; n <= 40; n++) {
    dies.push('2026-06-' + String(n <= 30 ? n : n - 30).padStart(2, '0'));
  }
  const calendari = [];
  for (let n = 1; n <= 30; n++) calendari.push('2026-06-' + String(n).padStart(2, '0'));

  const ctx = {
    Utils: { rangDates: () => calendari, avui: () => '2026-06-30' },
    Config: { getNum: () => 0, get: () => '', esSi: () => false },
    Log: { info() {}, avis() {}, error() {} },
    Dades: {
      llegeix: (full, filtre) => {
        if (full === 'Ingestes') {
          return calendari.map((d) => ({ id: 'i' + d, data: d, grams: 100,
            kcal100: 2000, prot100: 120 })).filter((f) => !filtre || filtre(f));
        }
        if (full === 'NutricioDies') {
          return calendari.filter((d, k) => k % 2 === 0)
            .map((d) => ({ data: d, activitat: 2500 }))
            .filter((f) => !filtre || filtre(f));
        }
        return [];
      }
    },
    Memoria: {}, Date, Math, Number, String, JSON, parseFloat, isFinite, Object, Array
  };
  vm.createContext(ctx);
  vm.runInContext(srvFont, ctx);

  const series = ctx.Nutricio.seriesDiaries('2026-06-01', '2026-06-30');
  const perId = {};
  series.forEach((s) => { perId[s.id] = s; });

  cal('les cremades surten com a sèrie pròpia', !!perId.cremades,
      series.map((s) => s.id).join(', '));
  cal('i porten la unitat, que és el que la fa llegible',
      perId.cremades && perId.cremades.unitat === 'kcal al dia',
      perId.cremades && perId.cremades.unitat);
  /* Amb el dèficit comparteixen la meitat de la xifra: «els dies que cremes
     més tens més dèficit» és aritmètica, no una troballa. La família ho tapa. */
  cal('i van a la família del dèficit perquè no es creuin entre elles',
      perId.cremades && perId.deficit &&
      perId.cremades.familia === perId.deficit.familia,
      perId.cremades && perId.cremades.familia);
  cal('un dia sense la xifra del rellotge no compta com un zero',
      Object.keys(perId.cremades.dies).length === 15 &&
      Object.keys(perId.cremades.dies).every((d) => perId.cremades.dies[d] === 2500),
      String(Object.keys(perId.cremades.dies).length));
}


// ------------------------------------------ on va cada notificació en tocar-la
/* Quatre de les nou notificacions obrien una pàgina 404, i cap prova ho veia:
   totes passaven, perquè el destí era una cadena i ningú comprovava que fos
   una pantalla de debò. Això ho mira, i mira TOTES les que hi hagi al codi:
   una de nova que s'equivoqui igual, es trobarà aquesta prova al davant. */
console.log('\nNotificacions: totes han de portar a una pantalla que existeixi');
{
  const src = fs.readFileSync('apps-script/60_Notificacions.gs', 'utf8');
  const cos = src.slice(src.indexOf('function capOn_(url) {'), src.indexOf('function envia(titol'));
  const ctx = { String };
  vm.createContext(ctx);
  vm.runInContext(cos + '\nvar __c = capOn_;', ctx);
  const capOn = ctx.__c;

  cal('un nom de pantalla a seques es converteix en hash',
      capOn('seguiment') === './#seguiment', capOn('seguiment'));
  cal('el que ja estava bé no es toca',
      capOn('./#finances') === './#finances', capOn('./#finances'));
  cal('l\'arrel es queda com l\'arrel',
      capOn('./') === './' && capOn('') === './');

  /* I que `envia` la FACI SERVIR. Sense això, la prova de dalt passava amb la
     normalització desconnectada: comprovava una funció que no cridava ningú.
     Ho he vist perquè he tornat a trencar-ho a posta per veure si saltava. */
  cal('i que envia() la faci servir a la notificació i a l\'enllaç',
      /url:\s*capOn_\(/.test(src) && /link:\s*capOn_\(/.test(src));

  /* Les pantalles que existeixen de debò, llegides d'on es registren. */
  const vistes = new Set();
  fs.readdirSync('apps-script').filter((f) => f.startsWith('vista_')).forEach((f) => {
    const t = fs.readFileSync('apps-script/' + f, 'utf8');
    const m = t.match(/App\.registraVista\(\s*'([a-z0-9_]+)'/g) || [];
    m.forEach((x) => vistes.add(x.match(/'([a-z0-9_]+)'/)[1]));
  });
  cal('es troben les pantalles registrades', vistes.has('nutricio'), [...vistes].join(', '));

  /* Cada `url:` que surti al costat d'un `Notifica.envia`. */
  const destins = [];
  fs.readdirSync('apps-script').filter((f) => f.endsWith('.gs')).forEach((f) => {
    const t = fs.readFileSync('apps-script/' + f, 'utf8');
    let i = 0;
    while ((i = t.indexOf('Notifica.envia(', i)) !== -1) {
      const tros = t.slice(i, i + 500);
      const m = tros.match(/url:\s*'([^']*)'/);
      if (m) destins.push({ on: f, url: m[1] });
      i += 15;
    }
  });
  cal('es troben les notificacions del codi', destins.length >= 1, destins.length + ' trobades');

  const dolents = destins.filter((d) => {
    /* El destí pot portar una data: «./#dia:2026-08-07». Es talla pels dos
       punts, igual que fa `App.deLAdreca` al navegador. Aquesta prova va
       saltar el dia que el repàs de la nit va estrenar aquesta forma, i
       tenia raó a preguntar-ho. */
    const v = capOn(d.url).replace('./#', '').replace('./', '').split(':')[0];
    return v && !vistes.has(v);
  });
  cal('cap notificació porta a una pantalla que no existeix',
      dolents.length === 0, dolents.map((d) => d.on + ' → ' + d.url).join(' · '));

  /* I CAP NO POT ANAR SENSE ETIQUETA. Les que no en porten arriben totes amb
     la mateixa —«jefe»—, i al telèfon una etiqueta repetida no vol dir dues
     notificacions: vol dir que la segona tapa la primera. Els senyals hi anaven
     així, i com que en surten dos al dia, la meitat no s'arribaven a veure. */
  const senseEtiqueta = [];
  let mirades = 0;
  fs.readdirSync('apps-script').filter((f) => f.endsWith('.gs')).forEach((f) => {
    const t = fs.readFileSync('apps-script/' + f, 'utf8');
    let i = 0;
    while ((i = t.indexOf('Notifica.envia(', i)) !== -1) {
      mirades++;
      const tros = t.slice(i, i + 700);
      if (!/etiqueta:/.test(tros)) senseEtiqueta.push(f + ':' + t.slice(0, i).split('\n').length);
      i += 15;
    }
  });
  cal('es miren totes les notificacions del codi', mirades >= 3, mirades + ' mirades');
  cal('cada notificació porta la seva etiqueta', senseEtiqueta.length === 0,
      senseEtiqueta.join(' · '));


  /* EL TÍTOL NO POT DIR EL MATEIX QUE EL COS. Amb una sola cita al calendari
     sortia «Montgrony 7:00-15:00» de títol i «Montgrony 7:00-15:00» de cos:
     una notificació que es repeteix a si mateixa no diu res dues vegades, no
     diu res una. La regla és que el títol digui d'on ve i el cos què passa. */
  const junta = (function () {
    const c2 = { String, RegExp };
    vm.createContext(c2);
    vm.runInContext(src.slice(src.indexOf('function junta_'), src.indexOf('function capOn_')) +
                    '\nvar __j = junta_;', c2);
    return c2.__j;
  })();

  cal('el que deia el títol s\'enganxa al cos amb un punt',
      junta('Control setmanal', 'Ara, en dejú') === 'Control setmanal. Ara, en dejú',
      junta('Control setmanal', 'Ara, en dejú'));
  cal('i sense doble puntuació quan ja n\'hi ha',
      junta('Bon dia, Pol!', '09:00 Claustre') === 'Bon dia, Pol! 09:00 Claustre',
      junta('Bon dia, Pol!', '09:00 Claustre'));

  /* Els títols escrits al codi han de ser curts. Un títol de sis paraules és
     una frase, i una frase al títol vol dir que el cos la repetirà.

     EL PUNT VOLAT NO ÉS UNA PARAULA. La forma és «Apartat · què» —«Diari ·
     resum», «Finances · patrimoni»— i comptar el separador com a paraula
     deixava el pressupost real en dues. Es treu abans de comptar. */
  const titols = [];
  fs.readdirSync('apps-script').filter((f) => f.endsWith('.gs')).forEach((f) => {
    const t = fs.readFileSync('apps-script/' + f, 'utf8');
    let i = 0;
    while ((i = t.indexOf('Notifica.envia(', i)) !== -1) {
      const m = t.slice(i, i + 220).match(/Notifica\.envia\(\s*'([^']+)'/);
      if (m) titols.push({ on: f, titol: m[1] });
      i += 15;
    }
  });
  cal('es troben els títols escrits al codi', titols.length >= 2, titols.length + ' trobats');
  const paraules = (t) => t.split(/\s+/).filter((p) => p && p !== '·').length;
  const llargs = titols.filter((t) => paraules(t.titol) > 3);
  cal('cap títol és una frase', llargs.length === 0,
      llargs.map((t) => t.on + ': «' + t.titol + '»').join(' · '));

  /* I CAP NO POT SER UNA COSA QUE PASSA. Els títols han de dir d'on ve la
     notificació, i el que es va escapar era just al revés: «Resum del dia»,
     «Revisió setmanal», «Banc», «Demà». Es comprova que cadascun comenci per
     un apartat de debò —el nom d'un mòdul o d'una pantalla de l'app. */
  const APARTATS = ['Calendari', 'Diari', 'Finances', 'Hàbits', 'Nutrició',
                    'Tasques', 'Focus', 'Relacions', 'Memòria', 'Seguiment', 'El dia',
                    'La setmana', 'Prova'];
  const forasters = titols.filter((t) =>
    !APARTATS.some((a) => t.titol === a || t.titol.indexOf(a + ' · ') === 0));
  cal('cada títol comença per l\'apartat d\'on ve', forasters.length === 0,
      forasters.map((t) => t.on + ': «' + t.titol + '»').join(' · '));

  /* I la còpia del treballador de servei ha de dir el mateix: és la que mana
     quan la notificació ja és al telèfon i l'app està tancada. */
  const sw = fs.readFileSync('firebase-messaging-sw.js', 'utf8');
  const bloc = sw.slice(sw.indexOf("self.addEventListener('notificationclick'"),
                        sw.indexOf('// Que una versió nova'));
  const arrel = 'https://exemple.test/nutricio/';
  /* El treballador contesta amb una promesa —`matchAll` ho és— i la primera
     versió d'aquesta prova llegia el resultat abans que hi fos. Fallava la
     prova, no el codi. `waitUntil` és per on el treballador diu «encara no he
     acabat»: aquí s'agafa i s'espera, que és el que fa el navegador. */
  const obre = async (url, jaOberta) => {
    let obertes = [], navegat = null, missatges = [], guardat = null;
    const finestra = { url: arrel, focus: () => finestra,
                       navigate: (u) => { navegat = u; return Promise.resolve(finestra); },
                       postMessage: (m) => missatges.push(m) };
    const c = { String, Promise,
      self: { registration: { scope: arrel },
              clients: { matchAll: () => Promise.resolve(jaOberta ? [finestra] : []),
                         openWindow: (u) => { obertes.push(u); return Promise.resolve(); } },
              addEventListener: (n, f) => { c.__f = f; } } };
    c.self.self = c.self;
    vm.createContext(c);
    vm.runInContext(bloc, c);
    c.__f({ notification: { close: () => {}, data: { url } },
            waitUntil: (pr) => { guardat = pr; } });
    await guardat;
    return { obertes, navegat, missatges };
  };

  const tancada = await obre('seguiment', false);
  cal('el treballador obre l\'adreça sencera, no la relativa',
      tancada.obertes[0] === arrel + '#seguiment', tancada.obertes[0]);

  const oberta = await obre('seguiment', true);
  cal('i amb l\'app ja oberta hi navega en comptes de deixar-te on eres',
      oberta.navegat === arrel + '#seguiment', oberta.navegat);
  cal('i a més li ho diu per missatge, que és instantani',
      (oberta.missatges[0] || {}).vista === 'seguiment', JSON.stringify(oberta.missatges));
}

// ------- la precàrrega ha de desar amb la clau que cada pantalla llegirà
/* El 4 d'agost del 2026 es va trobar que el calendari DESAVA a
   «calendari.2026-08» i LLEGIA de «calendari.ara»: no coincidien mai, la còpia
   del telèfon hi era i no la feia servir ningú, i per això obrir el calendari
   sempre esperava el servidor. Un error d'una paraula que no es veu mirant el
   codi —les dues línies són a quatre-centes línies l'una de l'altra— i que es
   veu de seguida si es comparen.
   Això compara la taula de claus de la precàrrega amb la clau que cada vista
   fa servir de debò. Si algú en canvia una i s'oblida de l'altra, peta aquí. */
console.log('\nLa precàrrega desa on cada pantalla mirarà');
{
  const app = fs.readFileSync('apps-script/ui_app.html', 'utf8');
  const tros = app.slice(app.indexOf('    clauDe: function (modul, avui) {'),
                         app.indexOf('    omple: function () {'));
  const c2 = { String };
  vm.createContext(c2);
  vm.runInContext('var P = { ' + tros.replace(/,\s*$/, '') + ' };', c2);

  const AVUI = '2026-08-04';
  const clau = (m) => c2.P.clauDe(m, AVUI);

  /* Què llegeix cada vista de debò, tret del seu propi codi. */
  const llegeix = (fitxer, expressio) => {
    const s = fs.readFileSync('apps-script/' + fitxer, 'utf8');
    return expressio(s);
  };

  cal('la clau de nutricio és la que espera la seva vista',
      clau('nutricio') === 'nutricio.dia.' + AVUI, clau('nutricio'));
  /* I la vista la LLEGEIX amb aquesta forma: 'nutricio.' + període + '.' + data. */
  const vn = llegeix('vista_nutricio.html', (s) => s);
  cal('i la vista de Nutrició llegeix d\'aquesta mateixa clau',
      /function claCau\(\) \{ return 'nutricio\.' \+ periode \+ '\.' \+ data; \}/.test(vn));

  /* El paquet ha de portar el dia amb la forma que la seva vista sap pintar:
     el que la vista demana és `conversa.elDia`, no una altra cosa. */
  const enc = fs.readFileSync('apps-script/30_Encaminador.gs', 'utf8');
  cal('el paquet porta la pàgina del dia tal com la demana la seva vista',
      /out\._dia = Conversa\.elDia\(/.test(enc));
  cal('i un mòdul que peti no s\'emporta la resta del paquet',
      /try \{ out\[mod\.id\] = mod\.accions\.pantalla\(\{\}\); \}/.test(enc));
}

// ------ cap automatisme pot quedar-se fora de la llista que els neteja
/* `instalaTriggers` esborra els seus i els torna a crear. Els «seus» són els
   d'una llista escrita a mà, i el 4 d'agost del 2026 hi faltava
   `triggerEscalfaFora`: cada execució en deixava un de vell i en creava un de
   nou. Amb dos, i costant quaranta segons per passada, es menjaven més quota
   diària de la que té el compte —i quan la quota s'acaba, Google atura TOTS
   els automatismes sense avisar de res.
   Un descuit d'una línia amb aquestes conseqüències no es pot deixar a la
   memòria de ningú. */
console.log('\nEls automatismes: cap pot quedar fora de la llista que els neteja');
{
  const inst = fs.readFileSync('apps-script/90_Instalacio.gs', 'utf8');

  const creats = (inst.match(/newTrigger\('(\w+)'\)/g) || [])
    .map((x) => x.replace(/newTrigger\('|'\)/g, ''));
  const llista = (inst.slice(inst.indexOf('var TRIGGERS = ['),
                             inst.indexOf('];', inst.indexOf('var TRIGGERS = [')))
    .match(/'(\w+)'/g) || []).map((x) => x.replace(/'/g, ''));

  cal('n\'hi ha uns quants de creats', creats.length >= 4, String(creats.length));
  const fora = creats.filter((t) => llista.indexOf(t) === -1);
  cal('i tots surten a la llista que els esborra',
      fora.length === 0, 'en falten: ' + fora.join(', '));

  /* I a l'inrevés: un nom a la llista que ja no es crea enlloc no fa mal, però
     vol dir que hi ha codi mort o un nom mal escrit. */
  const morts = llista.filter((t) => creats.indexOf(t) === -1);
  cal('i a la llista no hi ha noms que ja no existeixin',
      morts.length === 0, 'sobren: ' + morts.join(', '));

  /* I EL TANCAMENT DEL VESPRE, EN CONCRET. És l'únic avís que aquesta app
     t'envia sense que hi entris, i un automatisme que falta no avisa: te
     n'assabentes per no rebre res. */
  cal('el tancament del vespre es crea a les 23:45',
      /newTrigger\('triggerTancamentNutricio'\)\s*\.timeBased\(\)\.atHour\(23\)\.nearMinute\(45\)\.everyDays\(1\)/.test(inst));
  cal('i la funció que crida existeix', /function triggerTancamentNutricio\(\)/.test(inst));
  cal('i avisa de debò quan falten les cremades',
      /Notifica\.envia\(\s*'Nutrició · tancament'/.test(inst));
}


// -------------------------------- els senyals: la part difícil és NO dir-los
/* JEFE avisava per rellotge. Els senyals avisen pel que passa. La feina no és
   trobar coses a dir —n'hi ha sempre—: és callar-ne prou perquè les que surtin
   es llegeixin. Si això falla, en tres setmanes silencia l'app i llavors ja no
   s'assabenta de res.
   Aquí es comproven les quatre regles que ho sostenen: dos al dia, tres dies
   abans de repetir-ne un, res de nit, i que tot quedi apuntat encara que no
   s'enviï. */
console.log('\nEls senyals: dos al dia, i el que es calla també s\'apunta');
{
  const ctx = carregaTotElServidor();
  const AVUI = '2026-08-05';
  ctx.Utils.avui = () => AVUI;
  ctx.Utils.ara = () => AVUI + 'T10:00:00+02:00';
  ctx.Log = { info() {}, avis() {}, error() {} };
  ctx.Config = { zonaHoraria: () => 'Europe/Madrid', get: () => null, getNum: (k, d) => d };

  /* El formatador ha de formatar DE DEBÒ. La primera versió d'aquesta prova el
     falsejava tornant sempre el mateix dia, i això trencava `Utils.sumaDies`:
     la regla dels tres dies no es podia complir mai i la prova acusava el codi
     d'una cosa que feia ella. */
  let horaAra = 10;
  ctx.Utilities.formatDate = (d, tz, f) => {
    if (f === 'H') return String(horaAra);
    const p = (n) => ('0' + n).slice(-2);
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  };

  // El full, en memòria
  let files = [], seguit = 0;
  ctx.Dades = {
    llegeix: (full, filtre) => files.filter((f) => !filtre || filtre(f)),
    un: (full, q) => files.filter((f) => Object.keys(q).every((k) => f[k] === q[k]))[0] || null,
    insereix: (full, fila, prefix) => {
      const f = Object.assign({ id: (prefix || 'x') + (++seguit) }, fila);
      files.push(f); return f;
    },
    actualitza: (full, id, canvis) => {
      const f = files.filter((x) => x.id === id)[0];
      if (f) Object.assign(f, canvis);
      return f || null;
    }
  };

  let enviades = [];
  /* `junta` no es dobla: és la que decideix com queda el cos que arriba al
     telèfon, i doblar-la voldria dir comprovar una altra cosa. */
  ctx.Notifica = {
    junta: (a, b) => (!a ? b : !b ? a : a + (/[.!?:;·…]$/.test(a) ? ' ' : '. ') + b),
    envia: (t, c, o) => { enviades.push({ t, c, url: o && o.url, etiqueta: o && o.etiqueta }); return { enviades: 1 }; }
  };

  const senyal = (id, urgencia) => ({ id, titol: 'T', text: 'passa una cosa', urgencia });
  let elsMeus = [senyal('a', 3), senyal('b', 2), senyal('c', 1)];
  ctx.Moduls = { actius: () => [{ id: 'prova', nom: 'Prova', senyals: () => elsMeus }] };

  const r1 = ctx.Senyals.passa({});
  cal('en troba tres i n\'envia dos', r1.trobats === 3 && r1.enviats === 2, JSON.stringify(r1));
  cal('i envia els MÉS urgents, no els primers que troba',
      enviades.length === 2 && r1.quins.join(',') === 'a,b', JSON.stringify(r1.quins));

  /* EL TÍTOL DEL SENYAL NO ÉS EL DE LA NOTIFICACIÓ. A la barra hi has de
     llegir d'on et parlen; què passa ja ho diu el cos, i el títol del senyal
     l'encapçala perquè no es perdi. */
  cal('el títol de la notificació és l\'apartat, no el del senyal',
      enviades[0].t === 'Prova', JSON.stringify(enviades[0]));
  cal('i el que deia el senyal encapçala el cos',
      enviades[0].c === 'T. passa una cosa', enviades[0].c);

  /* Sense etiqueta pròpia totes arribaven com a «jefe», i al telèfon això no
     vol dir dues notificacions: vol dir que la segona tapa la primera. */
  cal('cada senyal porta la seva etiqueta, i no la comparteix',
      enviades[0].etiqueta === 'senyal-a' && enviades[1].etiqueta === 'senyal-b',
      JSON.stringify(enviades.map((e) => e.etiqueta)));

  cal('el que s\'ha callat també queda apuntat',
      files.length === 3 && files.filter((f) => !f.enviat_el).length === 1,
      JSON.stringify(files.map((f) => f.senyal + ':' + (f.enviat_el ? 'dit' : 'callat'))));

  enviades = [];
  const r2 = ctx.Senyals.passa({});
  cal('a la segona passada del mateix dia ja no diu res més',
      r2.enviats === 0 && /ja s'han dit/.test(r2.motiu), JSON.stringify(r2));

  /* L'endemà: els mateixos senyals segueixen passant. Les dues que es van dir
     han de callar —fa menys de tres dies—, però la que es va quedar a la cua
     ha de sortir. El pressupost APLAÇA, no llença: si llencés, la tercera cosa
     important d'un dia ple no s'assabentaria mai. */
  ctx.Utils.avui = () => '2026-08-06';
  ctx.Utils.ara = () => '2026-08-06T10:00:00+02:00';
  enviades = [];
  const r3 = ctx.Senyals.passa({});
  cal('l\'endemà no repeteix les que va dir, però sí que treu la que esperava',
      r3.enviats === 1 && r3.quins[0] === 'c', JSON.stringify(r3));

  /* Quatre dies més tard sí, perquè ja han passat els tres d'espera. */
  ctx.Utils.avui = () => '2026-08-10';
  ctx.Utils.ara = () => '2026-08-10T10:00:00+02:00';
  enviades = [];
  const r4 = ctx.Senyals.passa({});
  cal('passats els tres dies, torna a dir-ho', r4.enviats === 2, JSON.stringify(r4));

  /* De nit no es diu res, encara que passin coses noves. */
  ctx.Utils.avui = () => '2026-08-20';
  ctx.Utils.ara = () => '2026-08-20T23:00:00+02:00';
  horaAra = 23;
  enviades = [];
  const r5 = ctx.Senyals.passa({});
  cal('de nit no interromp', r5.enviats === 0 && /de nit/.test(r5.motiu), JSON.stringify(r5));
  cal('però ho apunta igual, per no perdre-ho',
      files.filter((f) => f.data === '2026-08-20').length === 3);

  /* Un mòdul que peta no s'emporta els altres. */
  horaAra = 10;
  ctx.Utils.avui = () => '2026-08-25';
  ctx.Utils.ara = () => '2026-08-25T10:00:00+02:00';
  ctx.Moduls = { actius: () => [
    { id: 'dolent', nom: 'Dolent', senyals: () => { throw new Error('peta'); } },
    { id: 'bo', nom: 'Bo', senyals: () => [senyal('z', 3)] }
  ] };
  enviades = [];
  const r6 = ctx.Senyals.passa({});
  cal('un mòdul que peta no s\'emporta els altres', r6.enviats === 1, JSON.stringify(r6));

  /* Quan el senyal ja es diu com el seu apartat —l'escola en diu «Escola» i el
     mòdul també— no s'ha de dir dues vegades en dues línies seguides. */
  ctx.Utils.avui = () => '2026-08-26';
  ctx.Utils.ara = () => '2026-08-26T10:00:00+02:00';
  ctx.Moduls = { actius: () => [{ id: 'igualet', nom: 'Prova', senyals: () =>
    [{ id: 'igual', titol: 'Prova', text: 'passa una cosa', urgencia: 3 }] }] };
  enviades = [];
  ctx.Senyals.passa({});
  cal('si el senyal es diu com l\'apartat, no es repeteix',
      enviades.length === 1 && enviades[0].c === 'passa una cosa',
      JSON.stringify(enviades[0]));

  /* I un senyal pot obrir una pantalla que no es digui com el seu mòdul: la
     conversa es diu «JEFE» i la seva obre «La setmana». El nom de l'app com a
     títol no diu on et porta. */
  ctx.Utils.avui = () => '2026-08-27';
  ctx.Utils.ara = () => '2026-08-27T10:00:00+02:00';
  ctx.Moduls = { actius: () => [{ id: 'conversa', nom: 'JEFE', senyals: () =>
    [{ id: 'setmana', apartat: 'La setmana', titol: 'La setmana que ve',
       text: 'tres coses esperen', urgencia: 1, accio: 'setmana' }] }] };
  enviades = [];
  ctx.Senyals.passa({});
  cal('un senyal pot dir a quin apartat pertany la notificació',
      enviades.length === 1 && enviades[0].t === 'La setmana', JSON.stringify(enviades[0]));

  /* I els mòduls de debò han de saber-ne declarar. */
  const declaren = ['40_Mod_Nutricio.gs']
    .filter((f) => /senyals:\s*function/.test(fs.readFileSync('apps-script/' + f, 'utf8')));
  cal('Nutrició sap dir què li passa', declaren.length === 1, declaren.join(', '));

  const inst = fs.readFileSync('apps-script/90_Instalacio.gs', 'utf8');
  cal('i hi ha un trigger que ho mira, i surt a la llista de neteja',
      /newTrigger\('triggerSenyals'\)/.test(inst) && /'triggerSenyals'\]/.test(inst));
}

// --------------------------------------------------- una app al costat de les altres
/* Nutrició, el cos i les finances viuen totes a poldpm.github.io. El navegador
   hi té UNA memòria local i UNA memòria cau per a tot el domini, o sigui que
   tot el que es desa ha de portar el nom de l'app al davant. Si no, connectar
   una app trepitja l'adreça i la clau de l'altra, i actualitzar-ne una buida
   la memòria cau de les altres. */
console.log('\nUna app entre germanes: res compartit amb les altres del domini');
{
  const app = fs.readFileSync('apps-script/ui_app.html', 'utf8');
  cal('la memòria local porta el prefix de l\'app', /var PREFIX_CAU = 'nutricio\.';/.test(app));
  cal('i cap lectura ni escriptura hi va amb el «jefe.» d\'abans', !/localStorage\.\w+\('jefe\./.test(app));

  const sw = fs.readFileSync('sw.js', 'utf8');
  cal('la memòria cau del treballador porta el nom de l\'app', /var PREFIX = 'nutricio-';/.test(sw));
  cal('i només esborra les seves, no les de les altres apps',
      /n\.indexOf\(PREFIX\) === 0 && n !== CAU/.test(sw));

  const man = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
  cal('el manifest té l\'identificador propi i absolut', man.id === '/nutricio/', man.id);
  cal('i l\'inici i l\'abast relatius, que viatgen sols',
      man.start_url === './' && man.scope === './', man.start_url + ' ' + man.scope);
  cal('i les icones hi són', man.icons.every((i) => fs.existsSync(i.src)),
      man.icons.map((i) => i.src).join(', '));

  const plantilla = fs.readFileSync('eines/sw-notificacions.plantilla.js', 'utf8');
  cal('les notificacions sense etiqueta pròpia no comparteixen la de JEFE',
      /d\.etiqueta \|\| 'nutricio'/.test(plantilla));
}

// ---------------------------------------------------------- s'obre a Nutrició
/* No hi ha full índex: l'app és una pantalla. Si l'arrencada anés a buscar
   «inici», que aquí no existeix, cauria a la pantalla per defecte i des de
   fora no es notaria res fins que alguna cosa hi depengués. */
console.log('\nL\'arrencada: directament a Nutrició, sense índex');
{
  const app = fs.readFileSync('apps-script/ui_app.html', 'utf8');
  cal('la pantalla d\'arrencada és Nutrició', /var INICI = 'nutricio';/.test(app));
  cal('i ja no es va a buscar «inici» enlloc', !/App\.ves\('inici'/.test(app));

  const idx = fs.readFileSync('apps-script/ui_index.html', 'utf8');
  const inclosos = (idx.match(/include\('([^']+)'\)/g) || []).map((x) => x.slice(9, -2));
  const falten = inclosos.filter((n) => !fs.existsSync('apps-script/' + n + '.html'));
  cal('tot el que inclou la pàgina existeix', falten.length === 0, falten.join(', '));
  cal('i la de Nutrició hi és', inclosos.indexOf('vista_nutricio') !== -1);

  const vn = fs.readFileSync('apps-script/vista_nutricio.html', 'utf8');
  cal('el botó de tornar a l\'índex ja no hi és', !/data-torna/.test(vn));
  cal('i l\'avís d\'activar les notificacions viu a la pantalla de Nutrició',
      /Notificacions\.activa\(\)/.test(vn) && /cridaAvisos\(\)/.test(vn));
}

// -------------------------------------------- la paraula JEFE, fora de la vista
/* En Pol no ha de veure «JEFE» enlloc. Els comentaris del codi poden parlar
   d'on ve tot, però cap text que surti a la pantalla, al títol, a la icona
   instal·lada ni als missatges que llegeix a l'editor. */
console.log('\nCap «JEFE» a la vista');
{
  const treuComentaris = (s) => s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
  const deixa = /MARCA_JEFE|VERSIO_JEFE|NOM_FULL_JEFE|PortaDadesDeJefe|portaDadesDeJefe_|portaObjectiusDeJefe_|var Jefe = |Jefe\.\w+|jefe: 'ves'|m\.jefe !==|'JEFE — Assistent'|'Dades de JEFE: '|'Objectius de JEFE: '|Nutrició a JEFE|'Ets JEFE|\/\^\\s\*jefe\\s\*\$\/i|id="ic-jefe"|trobaFullJefe_|esJefe|ID_FULL_JEFE|de dades de JEFE|semblen el de JEFE|title contains "JEFE"|title contains "Jefe"/;
  const trobats = [];
  fs.readdirSync('apps-script').filter((f) => /\.(gs|html)$/.test(f)).forEach((f) => {
    treuComentaris(fs.readFileSync('apps-script/' + f, 'utf8')).split('\n').forEach((l, i) => {
      if (/jefe/i.test(l) && !deixa.test(l)) trobats.push(f + ': ' + l.trim().slice(0, 70));
    });
  });
  cal('cap text visible diu JEFE', trobats.length === 0, trobats.slice(0, 4).join(' · '));

  const man = fs.readFileSync('manifest.webmanifest', 'utf8');
  cal('ni el manifest', !/jefe/i.test(man.replace('"id"', '')));
}

// ------------------------------------------------ les dades de JEFE, copiades
/* La regla és que es COPIEN i no es mouen: el full de JEFE es queda tal com
   és, de còpia de seguretat. Aquí es comprova amb un Drive i uns fulls de
   mentida que la funció només llegeix l'origen, que només porta el que falta,
   i que si no sap quin és el full bo, s'atura en comptes de triar. */
console.log('\nPortar les dades de JEFE: copiar, mai moure');
{
  /* La regla és que es COPIEN i no es mouen: el full de JEFE es queda tal com
     és. I es troba PEL QUE HI HA A DINS, no pel nom: la primera vegada es va
     buscar «JEFE — Assistent» i el full d'en Pol no es deia així. */
  const src = fs.readFileSync('apps-script/90_Instalacio.gs', 'utf8');
  const tros = src.match(/var NOM_FULL_JEFE[^\n]*\n/)[0] + src.match(/var FULLS_NUTRICIO[^\n]*\n/)[0];
  const cos = src.slice(src.indexOf('function portaDadesDeJefe_'), src.indexOf('// ----', src.indexOf('function portaObjectiusDeJefe_')));

  const pestanya = (n, files) => ({ nom: n, files,
    getName() { return this.nom; }, getLastRow() { return this.files; },
    setName(x) { this.nom = x; },
    copyTo(desti) { const c = Object.assign({}, this, { nom: 'Còpia de ' + n }); desti._fulls.push(c); return c; } });
  const full = (id, nom, pestanyes) => ({ _id: id, _nom: nom, _fulls: pestanyes,
    getId() { return this._id; }, getName() { return this._nom; },
    getSheetByName(n) { return this._fulls.find((x) => x.getName() === n) || null; } });
  const jefe = (id, nom) => full(id, nom, [pestanya('Aliments', 40), pestanya('Ingestes', 900),
    pestanya('NutricioDies', 120), pestanya('Moviments', 3000), pestanya('_Config', 20), pestanya('_Moduls', 12)]);

  /* Un Drive de mentida: la consulta es llegeix prou per saber si demana un
     nom exacte, un nom que conté alguna cosa, o tots els fulls. */
  const executa = (drive, desti, propietat) => {
    const perId = Object.fromEntries(drive.map((s) => [s.getId(), s]));
    const ctx = { String, Math,
      PropertiesService: { getScriptProperties: () => ({ getProperty: () => propietat || null }) },
      DriveApp: { searchFiles: (q) => {
        const exacte = (q.match(/title = "([^"]+)"/) || [])[1];
        const conte = [...q.matchAll(/title contains "([^"]+)"/g)].map((m) => m[1]);
        const llista = drive.filter((s) => exacte ? s.getName() === exacte
                                  : conte.length ? conte.some((c) => s.getName().indexOf(c) !== -1) : true)
                            .map((s) => ({ getId: () => s.getId() }));
        let i = 0; return { hasNext: () => i < llista.length, next: () => llista[i++] };
      } },
      SpreadsheetApp: { openById: (id) => { if (!perId[id]) throw new Error('no hi és'); return perId[id]; } } };
    vm.createContext(ctx);
    vm.runInContext(tros + '\n' + cos + '\nvar __p = portaDadesDeJefe_;', ctx);
    return ctx.__p(desti);
  };

  const origen = jefe('id-jefe', 'Popu — Assistent personal');
  const altre = full('id-altre', 'Registres', [pestanya('Full 1', 3)]);
  const desti = full('id-nou', 'Nutrició', []);
  const r = executa([altre, desti, origen], desti);

  cal('troba el full de JEFE encara que no es digui «JEFE — Assistent»', r.copiades.length === 3, r.text);
  cal('es porten les tres pestanyes de Nutrició',
      ['Aliments', 'Ingestes', 'NutricioDies'].every((n) => desti.getSheetByName(n)),
      desti._fulls.map((f) => f.getName()).join(', '));
  cal('amb el seu nom, no «Còpia de…»', !desti._fulls.some((f) => /^Còpia/.test(f.getName())));
  cal('i res més: ni les finances ni el nucli', !desti.getSheetByName('Moviments') && !desti.getSheetByName('_Config'));
  cal('l\'origen no canvia de nom ni de lloc',
      origen._fulls.length === 6 && origen._fulls.every((f) => !/^Còpia/.test(f.getName())));
  cal('i diu quantes files s\'ha portat', /Ingestes \(899 files\)/.test(r.text), r.text);

  const r2 = executa([altre, desti, origen], desti);
  cal('tornar-ho a executar no copia res més', desti._fulls.length === 3 && r2.copiades.length === 0,
      desti._fulls.length + ' fulls');

  /* El full nou, un cop té les pestanyes copiades, també «sembla» el de JEFE
     si algun dia hi ha el nucli: no ha de comptar mai. */
  const nou2 = full('id-nou2', 'Nutrició', [pestanya('Ingestes', 1), pestanya('NutricioDies', 1),
                                             pestanya('_Config', 1), pestanya('_Moduls', 1)]);
  const r3 = executa([nou2, jefe('id-j2', 'Qualsevol nom')], nou2);
  cal('el full propi no es confon mai amb el de JEFE', /Aliments/.test(r3.text), r3.text);

  let err = '';
  try { executa([altre], full('id-n', 'Nutrició', [])); } catch (e) { err = e.message; }
  cal('sense el full de JEFE ho diu i s\'atura', /No trobo el full de dades de JEFE/.test(err), err);

  err = '';
  try { executa([jefe('a', 'JEFE vell'), jefe('b', 'JEFE còpia')], full('id-n', 'Nutrició', [])); } catch (e) { err = e.message; }
  cal('amb dos candidats no en tria cap a cegues, i diu quins són',
      /No en trio cap/.test(err) && /«JEFE vell»/.test(err) && /«JEFE còpia»/.test(err), err);

  const triat = jefe('id-triat', 'El bo');
  const r4 = executa([jefe('a', 'JEFE vell'), triat], full('id-n', 'Nutrició', []), 'id-triat');
  cal('amb ID_FULL_JEFE a les propietats, mana aquest', r4.origen === triat);
}

console.log(falles ? '\n' + falles + ' falla(des).\n' : '\nTot correcte.\n');
process.exit(falles ? 1 : 0);
