"use strict";

/**
 * Auditoria V0.8 - testes essenciais do Alvo_Fardado.
 * Sem dependencias obrigatorias. Se o modulo "jsdom" estiver disponivel
 * (instalacao global ou via NODE_PATH), os testes de DOM/telas tambem rodam.
 *
 * Uso: node tests/audit.js
 */

var fs = require("fs");
var path = require("path");
var vm = require("vm");
var cp = require("child_process");

var ROOT = path.resolve(__dirname, "..");
var pass = 0, fail = 0, skipped = 0;
var failures = [];

function ok(name, cond, detail) {
  if (cond) { pass++; console.log("  PASS " + name); }
  else { fail++; failures.push(name + (detail ? " :: " + detail : "")); console.log("  FAIL " + name + (detail ? " :: " + detail : "")); }
}
function skip(name) { skipped++; console.log("  SKIP " + name); }
function section(t) { console.log("\n=== " + t + " ==="); }

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), "utf8"); }

function loadData() {
  var sandbox = { window: {}, console: console };
  vm.createContext(sandbox);
  [
    "data/questions.js", "data/questions-especificos.js", "data/questions-portugues.js",
    "data/questions-matematica.js", "data/questions-gerais.js", "data/questions-legislacao.js",
    "data/content.js", "data/videoaulas.js", "data/videos.js", "data/syllabus.js", "data/ai-config.js"
  ].forEach(function (f) { vm.runInContext(read(f), sandbox, { filename: f }); });
  return sandbox.window;
}

// ---------------------------------------------------------------------------
section("1. Sintaxe dos arquivos JavaScript");
var jsFiles = ["app.js", "service-worker.js"].concat(
  fs.readdirSync(path.join(ROOT, "data")).filter(function (f) { return /\.js$/.test(f); }).map(function (f) { return "data/" + f; })
);
jsFiles.forEach(function (f) {
  var r = cp.spawnSync(process.execPath, ["--check", path.join(ROOT, f)], { encoding: "utf8" });
  ok("sintaxe OK: " + f, r.status === 0, (r.stderr || "").trim());
});

// ---------------------------------------------------------------------------
section("2. Integridade dos dados");
var W = loadData();
var Q = W.DATA_QUESTIONS || [];
var SYL = W.DATA_SYLLABUS || [];
var VIDS = W.DATA_VIDEOAULAS || [];
var CONTENT = W.DATA_CONTENT || {};
var topics = SYL.reduce(function (a, s) { return a + (s.topics || []).length; }, 0);
ok("242 questoes preservadas", Q.length === 242, "total=" + Q.length);
ok("89 assuntos oficiais", topics === 89, "total=" + topics);
ok("100 videoaulas", VIDS.length === 100, "total=" + VIDS.length);
ok("5 materias", SYL.length === 5);
ok("10 questoes de demonstracao fora do edital", (W.DATA_UNMAPPED_QUESTIONS || []).length === 10, "n=" + (W.DATA_UNMAPPED_QUESTIONS || []).length);
ok("conteudo cobre os 89 assuntos", Object.keys(CONTENT).length === 89, "n=" + Object.keys(CONTENT).length);

var nodeIds = [];
SYL.forEach(function (s) { (s.topics || []).forEach(function (t) { nodeIds.push(t.id); (t.subtopics || []).forEach(function (st) { nodeIds.push(st.id); }); }); });
ok("sem ID de assunto duplicado", new Set(nodeIds).size === nodeIds.length);
var qids = Q.map(function (q) { return q.id; });
ok("sem ID de questao duplicado", new Set(qids).size === qids.length);
ok("respostas com indice valido", Q.every(function (q) { return typeof q.answer === "number" && q.answer >= 0 && q.answer < q.options.length; }));

var topicIds = new Set(SYL.reduce(function (a, s) { return a.concat((s.topics || []).map(function (t) { return t.id; })); }, []));
ok("nenhum topico do edital sem conteudo", Object.keys(CONTENT).every(function (k) { return topicIds.has(k); }));
ok("nenhuma videoaula com assunto invalido", VIDS.every(function (v) { return !v.topicId || topicIds.has(v.topicId); }));
ok("distribuicao do edital 10/10/10/5/5 = 40 questoes / 50 pontos", (function () {
  var q = SYL.reduce(function (a, s) { return a + (s.questions || 0); }, 0);
  var p = SYL.reduce(function (a, s) { return a + (s.points || 0); }, 0);
  return q === 40 && p === 50;
})());

var perSubject = {};
Q.forEach(function (q) { perSubject[q.subject] = (perSubject[q.subject] || 0) + 1; });
ok("distribuicao das questoes preservada (84/39/55/43/21)",
  perSubject.especificos === 84 && perSubject.portugues === 39 && perSubject.matematica === 55 &&
  perSubject.gerais === 43 && perSubject.legislacao === 21, JSON.stringify(perSubject));

// ---------------------------------------------------------------------------
section("3. IDs do HTML x app.js");
var html = read("index.html");
var app = read("app.js");
var htmlIds = new Set((html.match(/\bid="([^"]+)"/g) || []).map(function (s) { return s.slice(4, -1); }));
var appIds = new Set();
(app.match(/\bid="([^"]+)"/g) || []).forEach(function (s) { htmlIds.add(s.slice(4, -1)); });
var useRe = /\$\("([^"]+)"\)|getElementById\("([^"]+)"\)/g, m;
while ((m = useRe.exec(app))) appIds.add(m[1] || m[2]);
var missing = [].concat(Array.from(appIds)).filter(function (id) { return !htmlIds.has(id); });
ok("todo ID usado no JS existe no HTML", missing.length === 0, missing.join(","));
var dupHtmlIds = (html.match(/\bid="([^"]+)"/g) || []).map(function (s) { return s.slice(4, -1); });
ok("sem ID duplicado no index.html", dupHtmlIds.length === new Set(dupHtmlIds).size);

// ---------------------------------------------------------------------------
section("4. PWA");
var manifest = JSON.parse(read("manifest.json"));
ok("manifest com nome/start_url/display", !!manifest.name && !!manifest.start_url && manifest.display === "standalone");
ok("manifest com escopo relativo (GitHub Pages)", manifest.scope === "./" && manifest.start_url.indexOf("./") === 0);
ok("icones 192 e 512 declarados", manifest.icons.some(function (i) { return i.sizes === "192x192"; }) && manifest.icons.some(function (i) { return i.sizes === "512x512"; }));
ok("arquivos de icone existem", ["icons/icon-192.png", "icons/icon-512.png", "icons/icon.svg"].every(function (f) { return fs.existsSync(path.join(ROOT, f)); }));
ok("manifest linkado no HTML", html.indexOf('rel="manifest"') >= 0);

var sw = read("service-worker.js");
var cacheName = (sw.match(/CACHE_NAME\s*=\s*"([^"]+)"/) || [])[1];
ok("service worker com versao de cache", !!cacheName, "versao=" + cacheName);
var shellMatch = sw.match(/APP_SHELL\s*=\s*\[([\s\S]*?)\]/);
var shell = shellMatch ? shellMatch[1].match(/"([^"]+)"/g).map(function (s) { return s.slice(1, -1); }) : [];
var referenced = ["index.html", "style.css", "app.js", "manifest.json",
  "data/questions.js", "data/questions-especificos.js", "data/questions-portugues.js", "data/questions-matematica.js",
  "data/questions-gerais.js", "data/questions-legislacao.js", "data/content.js", "data/videoaulas.js", "data/videos.js",
  "data/syllabus.js", "data/ai-config.js", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"];
var missingShell = referenced.filter(function (f) { return shell.indexOf("./" + f) < 0; });
ok("cache cobre todos os arquivos usados", missingShell.length === 0, "faltando=" + missingShell.join(","));
ok("arquivos do cache existem em disco", shell.every(function (f) { var p = f.replace(/^\.\//, ""); return p === "" || fs.existsSync(path.join(ROOT, p)); }));
ok("service worker registrado no app", /serviceWorker\.register\(["']service-worker\.js["']\)/.test(app));
ok("service worker atualiza o cache (skipWaiting/claim/limpa antigos)",
  /skipWaiting/.test(sw) && /clients\.claim/.test(sw) && /caches\.delete/.test(sw));
ok("service worker tem fallback offline para index.html", /caches\.match\(["']\.\/index\.html["']\)/.test(sw));

// ---------------------------------------------------------------------------
section("5. Sem segredos / IA desativada");
ok("AI_CONFIG.enabled = false", W.AI_CONFIG && W.AI_CONFIG.enabled === false);
var src = jsFiles.concat(["index.html", "manifest.json"]).map(read).join("\n");
ok("nenhuma chave/segredo exposto", !/(sk-[A-Za-z0-9]{10,}|AIza[0-9A-Za-z_-]{10,}|ghp_[A-Za-z0-9]{20,})/.test(src));

// ---------------------------------------------------------------------------
section("6. Testes de DOM/telas");
var jsdom = null;
try { jsdom = require("jsdom"); } catch (e) { jsdom = null; }

if (!jsdom) {
  skip("jsdom indisponivel: testes de navegacao/progresso/simulado nao executados");
  skip("instale com 'npm i -g jsdom' e rode com NODE_PATH=<global node_modules>");
} else {
  var dom = new jsdom.JSDOM(html, { url: "http://localhost/index.html", runScripts: "outside-only", pretendToBeVisual: true });
  var w = dom.window;
  w.scrollTo = function () {}; w.confirm = function () { return true; }; w.alert = function () {};
  var runtimeErrors = [];
  w.addEventListener("error", function (e) { runtimeErrors.push(e.message); });
  var evalOrder = [
    "data/questions.js", "data/questions-especificos.js", "data/questions-portugues.js",
    "data/questions-matematica.js", "data/questions-gerais.js", "data/questions-legislacao.js",
    "data/content.js", "data/videoaulas.js", "data/videos.js", "data/syllabus.js", "data/ai-config.js", "app.js"
  ];
  evalOrder.forEach(function (f) {
    try { w.eval(read(f)); } catch (e) { runtimeErrors.push("eval " + f + ": " + e.message); }
  });
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));

  function screen() { var el = w.document.querySelector(".screen.active"); return el ? el.id.replace("screen-", "") : null; }
  function nav(n) { w.document.querySelector('.nav-btn[data-screen="' + n + '"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }

  ok("app inicializa", !!w.__DMAE_COVERAGE__ && !!w.__DMAE_ANALYTICS__);
  ok("tela inicial = home", screen() === "home", screen());
  var navOk = true;
  ["home", "subjects", "plan", "review", "questions", "performance", "simulado", "videos"].forEach(function (s) {
    nav(s);
    if (screen() !== s) navOk = false;
  });
  ok("8 telas navegaveis sem tela quebrada", navOk);
  ok("sem erro de runtime", runtimeErrors.length === 0, runtimeErrors.join(" | "));

  nav("subjects");
  w.document.querySelector('#subjects-list [data-action="open"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  ok("assunto mostra videoaula curada", /video-mini/.test(w.document.getElementById("topic-detail").innerHTML));
  w.document.querySelector('#topic-detail [data-act="finish"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  ok("progresso persiste no localStorage", Object.keys(JSON.parse(w.localStorage.getItem("dmae2026_v02") || "{}").records || {}).length >= 1);
  ok("cobertura conta assunto estudado", w.__DMAE_COVERAGE__.engine().studied >= 1);

  nav("questions");
  var opts = w.document.querySelectorAll("#question-area .option");
  var before = Object.keys((JSON.parse(w.localStorage.getItem("dmae2026_v01") || "{}").answers) || {}).length;
  opts[0].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  var after = Object.keys((JSON.parse(w.localStorage.getItem("dmae2026_v01") || "{}").answers) || {}).length;
  ok("responder questao registra resposta", after === before + 1);
  ok("explicacao exibida", !!w.document.querySelector("#question-area .explanation"));

  nav("simulado");
  w.document.getElementById("simulado-new").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  var act = JSON.parse(w.localStorage.getItem("dmae2026_v01") || "{}").activeSimulado;
  ok("simulado com 40 questoes", act.items.length === 40);
  var dist = {}; act.items.forEach(function (it) { dist[it.subject] = (dist[it.subject] || 0) + 1; });
  ok("distribuicao 10/10/10/5/5", dist.especificos === 10 && dist.portugues === 10 && dist.matematica === 10 && dist.gerais === 5 && dist.legislacao === 5, JSON.stringify(dist));
  ok("sem questao repetida", new Set(act.items.map(function (i) { return i.qid; })).size === 40);

  var qByStatement = {};
  (w.DATA_QUESTIONS || []).forEach(function (q) { qByStatement[q.statement] = q; });
  function answerSimCorretamente() {
    var area = w.document.getElementById("sim-question");
    var st = area.querySelector(".q-statement");
    var q = st ? qByStatement[st.textContent] : null;
    var btns = area.querySelectorAll(".option");
    for (var i = 0; i < btns.length; i++) {
      if (q && parseInt(btns[i].getAttribute("data-orig"), 10) === q.answer) {
        btns[i].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
        return true;
      }
    }
    return false;
  }
  var answeredAll = true;
  for (var si = 0; si < act.items.length; si++) {
    if (!answerSimCorretamente()) { answeredAll = false; break; }
    if (si < act.items.length - 1) w.document.getElementById("sim-next").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  }
  ok("simulado percorre e responde as 40 questoes", answeredAll);
  w.document.getElementById("sim-finish").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  var simRecords = JSON.parse(w.localStorage.getItem("dmae2026_v01") || "{}").simulados || [];
  var lastRec = simRecords[0];
  ok("simulado 40 acertos = 50/50 pontos", !!lastRec && lastRec.points === 50 && lastRec.correct === 40, lastRec ? lastRec.points + "pts" : "sem registro");
  ok("simulado 100% aprovado e sem materia zerada", !!lastRec && lastRec.approved === true && lastRec.zeradas.length === 0);
  ok("historico de simulados registrado", simRecords.length === 1);

  nav("performance");
  ok("desempenho calcula percentual", /%$/.test(w.document.getElementById("perf-pct").textContent));
  ok("desempenho lista 5 materias", w.document.querySelectorAll("#perf-subjects .perf-subject").length === 5);
  ok("desempenho mostra historico de simulados", /simulado/i.test(w.document.getElementById("perf-simulados").innerHTML));

  nav("review");
  ok("tela de revisao renderiza", w.document.getElementById("review-list").innerHTML.length > 0);
  ok("motor de cobertura = 89 assuntos", w.__DMAE_COVERAGE__.engine().total === 89);

  nav("videos");
  ok("videoaulas renderizam 5 materias", w.document.querySelectorAll("#videos-list .video-group").length === 5);
  ok("videosDMAE tem 100 entradas", (w.videosDMAE || []).length === 100, "n=" + (w.videosDMAE || []).length);
  ok("tela de videos nao usa formulario de cadastro", !w.document.getElementById("video-add") && !w.document.getElementById("video-form-card"));
  ok("videoaulas oficiais aparecem sem localStorage", w.document.querySelectorAll("#videos-list .video-mini").length >= 89);

  ok("navegacao inferior com 8 botoes", w.document.querySelectorAll(".bottom-nav .nav-btn").length === 8);
  var css = read("style.css");
  ok("CSS mobile trata a navegacao inferior (<=430px)",
    /@media\s*\(max-width:\s*430px\)[\s\S]*?\.bottom-nav[\s\S]*?flex-wrap/.test(css));
  ok("sem erro de runtime apos fluxos completos", runtimeErrors.length === 0, runtimeErrors.join(" | "));

  var seedState = w.localStorage.getItem("dmae2026_v01");
  var seedContent = w.localStorage.getItem("dmae2026_v02");
  var aged = JSON.parse(seedContent);
  Object.keys(aged.records || {}).forEach(function (id) {
    var old = new Date(Date.now() - 40 * 86400000).toISOString();
    aged.records[id].lastStudy = old;
    aged.records[id].lastReview = old;
  });
  seedContent = JSON.stringify(aged);

  var dom2 = new jsdom.JSDOM(html, {
    url: "http://localhost/index.html", runScripts: "outside-only", pretendToBeVisual: true,
    beforeParse: function (win) {
      win.localStorage.setItem("dmae2026_v01", seedState);
      win.localStorage.setItem("dmae2026_v02", seedContent);
    }
  });
  var w2 = dom2.window;
  w2.scrollTo = function () {}; w2.confirm = function () { return true; }; w2.alert = function () {};
  var runtimeErrors2 = [];
  w2.addEventListener("error", function (e) { runtimeErrors2.push(e.message); });
  evalOrder.forEach(function (f) { try { w2.eval(read(f)); } catch (e) { runtimeErrors2.push("eval " + f + ": " + e.message); } });
  w2.document.dispatchEvent(new w2.Event("DOMContentLoaded"));

  var reloadContent = JSON.parse(w2.localStorage.getItem("dmae2026_v02") || "{}");
  var reloadState = JSON.parse(w2.localStorage.getItem("dmae2026_v01") || "{}");
  ok("recarga mantem progresso (assuntos)", Object.keys(reloadContent.records || {}).length >= 1);
  ok("recarga mantem respostas", Object.keys(reloadState.answers || {}).length >= 1);
  ok("recarga mantem historico de simulados", (reloadState.simulados || []).length === 1);
  ok("recarga sem erro de runtime", runtimeErrors2.length === 0, runtimeErrors2.join(" | "));
  w2.document.querySelector('.nav-btn[data-screen="review"]').dispatchEvent(new w2.MouseEvent("click", { bubbles: true }));
  ok("revisao fica pendente apos 40 dias", w2.document.querySelectorAll("#review-list .review-item").length >= 1);

  w.document.getElementById("progress-reset").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  ok("zerar progresso limpa assuntos", Object.keys(JSON.parse(w.localStorage.getItem("dmae2026_v02") || "{}").records || {}).length === 0);
  ok("zerar progresso mantem respostas", Object.keys(JSON.parse(w.localStorage.getItem("dmae2026_v01") || "{}").answers || {}).length >= 1);
}

// ---------------------------------------------------------------------------
console.log("\n================================");
console.log("PASS: " + pass + "  FAIL: " + fail + "  SKIP: " + skipped);
if (failures.length) { console.log("\nFALHAS:"); failures.forEach(function (f) { console.log(" - " + f); }); }
process.exit(fail ? 1 : 0);
