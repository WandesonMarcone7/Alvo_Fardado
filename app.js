(function () {
  "use strict";

  var STORE_KEY = "dmae2026_v01";
  var EXAM_DATE = "2026-11-01";
  var DAILY_GOAL_MIN = 120;
  var STREAK_MIN_SECONDS = 600;

  var SUBJECTS = {
    especificos: { name: "Conhecimentos Específicos", short: "Específicos", q: 10, pts: 20, color: "#38bdf8" },
    portugues: { name: "Português", short: "Português", q: 10, pts: 10, color: "#a78bfa" },
    matematica: { name: "Matemática e Raciocínio Lógico", short: "Matemática/RL", q: 10, pts: 10, color: "#34d399" },
    gerais: { name: "Conhecimentos Gerais", short: "Gerais", q: 5, pts: 5, color: "#fbbf24" },
    legislacao: { name: "Legislação", short: "Legislação", q: 5, pts: 5, color: "#f87171" }
  };

  var SUBJECT_ORDER = ["especificos", "portugues", "matematica", "gerais", "legislacao"];

  var state = loadState();
  var sessionStart = state.runningSince || null;
  var timerId = null;
  var currentQuestionId = null;

  var CONTENT_KEY = "dmae2026_v02";
  var STATUS_LABELS = {
    nao_iniciado: { label: "Não iniciado", color: "#94a3b8" },
    estudando: { label: "Estudando", color: "#fbbf24" },
    estudado: { label: "Estudado", color: "#34d399" },
    revisar: { label: "Revisar", color: "#f87171" }
  };

  var contentState = loadContent();
  var topicFilter = null;
  var currentTopicId = null;

  function defaultContent() {
    return { v: 1, records: {}, plan: {}, lastTopic: null };
  }

  function loadContent() {
    var base = defaultContent();
    try {
      var raw = localStorage.getItem(CONTENT_KEY);
      if (!raw) return base;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return base;
      base.records = parsed.records || {};
      base.plan = parsed.plan || {};
      base.lastTopic = parsed.lastTopic || null;
      return base;
    } catch (e) {
      return base;
    }
  }

  function saveContent() {
    try {
      localStorage.setItem(CONTENT_KEY, JSON.stringify(contentState));
    } catch (e) {}
  }

  function nowISO() { return new Date().toISOString(); }

  function getSyllabus() { return window.DATA_SYLLABUS || []; }

  function getSubject(key) {
    var list = getSyllabus();
    for (var i = 0; i < list.length; i++) if (list[i].id === key) return list[i];
    return null;
  }

  function getTopicById(topicId) {
    var list = getSyllabus();
    for (var i = 0; i < list.length; i++) {
      var topics = list[i].topics || [];
      for (var j = 0; j < topics.length; j++) {
        if (topics[j].id === topicId) return { subject: list[i], topic: topics[j] };
      }
    }
    return null;
  }

  function allTopics() {
    var out = [];
    getSyllabus().forEach(function (subject) {
      (subject.topics || []).forEach(function (topic) {
        out.push({ subject: subject, topic: topic });
      });
    });
    return out;
  }

  function getRecord(topicId) {
    return contentState.records[topicId] || { status: "nao_iniciado", subtopics: {}, lastStudy: null, lastReview: null };
  }

  function ensureRecord(topicId) {
    if (!contentState.records[topicId]) {
      contentState.records[topicId] = { status: "nao_iniciado", subtopics: {}, lastStudy: null, lastReview: null };
    }
    return contentState.records[topicId];
  }

  function studiedCount(rec) {
    var n = 0;
    for (var k in rec.subtopics) if (rec.subtopics[k]) n++;
    return n;
  }

  function itemProgress(topic) {
    var rec = getRecord(topic.id);
    var total = (topic.subtopics || []).length;
    var done = studiedCount(rec);
    if (rec.status === "estudado") return 100;
    if (total > 0 && done === total) return 100;
    if (done > 0) return Math.round((done / total) * 100);
    if (rec.status === "estudando") return 30;
    if (rec.status === "revisar") return 50;
    return 0;
  }

  function itemStatus(topic) {
    var rec = getRecord(topic.id);
    var total = (topic.subtopics || []).length;
    var done = studiedCount(rec);
    if (rec.status === "estudado") return "estudado";
    if (total > 0 && done === total) return "estudado";
    if (done > 0 || rec.status === "estudando") return "estudando";
    if (rec.status === "revisar") return "revisar";
    return "nao_iniciado";
  }

  function subjectProgress(subject) {
    var topics = subject.topics || [];
    if (!topics.length) return 0;
    var sum = 0;
    topics.forEach(function (t) { sum += itemProgress(t); });
    return Math.round(sum / topics.length);
  }

  function questionSubtopicId(q) {
    if (q.assuntoId) return q.assuntoId;
    var map = window.DATA_QUESTION_MAP || {};
    if (map[q.id]) return map[q.id];
    var list = getSyllabus();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id !== q.subject) continue;
      var topics = list[i].topics || [];
      for (var j = 0; j < topics.length; j++) {
        if (topics[j].name === q.topic) return (topics[j].subtopics[0] || {}).id || topics[j].id;
      }
    }
    return null;
  }

  function nodeName(nodeId) {
    var entry = getTopicById(nodeId);
    if (entry) return entry.topic.name;
    var list = getSyllabus();
    for (var i = 0; i < list.length; i++) {
      (list[i].topics || []).forEach(function (t) {
        (t.subtopics || []).forEach(function (s) {
          if (s.id === nodeId) entry = { subject: list[i], topic: s };
        });
      });
    }
    return entry ? entry.topic.name : nodeId;
  }

  function questionNodeLabel(q) {
    if (q.assuntoId) return nodeName(q.assuntoId);
    if (q.topic) return q.topic;
    return "Sem assunto";
  }

  function isOffSyllabus(q) {
    var list = window.DATA_UNMAPPED_QUESTIONS || [];
    return list.indexOf(q.id) >= 0;
  }

  var DIFFICULTY_LABELS = { facil: "Fácil", media: "Média", dificil: "Difícil" };

  var SOURCE_LABELS = {
    edital: "Base: edital / normativo",
    geral: "Base: conhecimento geral",
    autoral: "Questão autoral para treinamento",
    adaptada: "Questão adaptada",
    demonstracao: "Questão de demonstração (fora do edital)"
  };

  var _qIndex = null;

  function questionIndex() {
    if (_qIndex) return _qIndex;
    var byQuestion = {};
    var countByTopic = {};
    var totalBySubject = {};
    (window.DATA_QUESTIONS || []).forEach(function (q) {
      var topicId = topicIdOfQuestion(q);
      byQuestion[q.id] = topicId;
      totalBySubject[q.subject] = (totalBySubject[q.subject] || 0) + 1;
      if (topicId) countByTopic[topicId] = (countByTopic[topicId] || 0) + 1;
    });
    _qIndex = { byQuestion: byQuestion, countByTopic: countByTopic, totalBySubject: totalBySubject };
    return _qIndex;
  }

  function topicBankSize(topicId) {
    var idx = questionIndex();
    return idx.countByTopic[topicId] || 0;
  }

  function topicBankStats(topicId) {
    var stats = { total: 0, facil: 0, media: 0, dificil: 0 };
    (window.DATA_QUESTIONS || []).forEach(function (q) {
      if (topicIdOfQuestion(q) !== topicId) return;
      stats.total++;
      if (q.dificuldade === "facil") stats.facil++;
      else if (q.dificuldade === "dificil") stats.dificil++;
      else stats.media++;
    });
    return stats;
  }

  function subjectBankSize(subjectId) {
    var idx = questionIndex();
    return idx.totalBySubject[subjectId] || 0;
  }

  function totalBankSize() {
    return (window.DATA_QUESTIONS || []).length;
  }

  function difficultyLabel(d) {
    return DIFFICULTY_LABELS[d] || "Média";
  }

  function sourceLabel(q) {
    if (SOURCE_LABELS[q.fonte]) return SOURCE_LABELS[q.fonte];
    return SOURCE_LABELS.demonstracao;
  }

  function topicIdOfQuestion(q) {
    var subId = questionSubtopicId(q);
    if (!subId) return null;
    var list = getSyllabus();
    for (var i = 0; i < list.length; i++) {
      var topics = list[i].topics || [];
      for (var j = 0; j < topics.length; j++) {
        if (topics[j].id === subId) return topics[j].id;
        var subs = topics[j].subtopics || [];
        for (var k = 0; k < subs.length; k++) {
          if (subs[k].id === subId) return topics[j].id;
        }
      }
    }
    return null;
  }

  function topicAccuracy(topicId) {
    var ok = 0, total = 0, last = 0;
    for (var id in state.answers) {
      var a = state.answers[id];
      if (a.topic !== topicId) continue;
      total++;
      if (a.correct) ok++;
      if (a.ts && a.ts > last) last = a.ts;
    }
    return { ok: ok, total: total, wrong: total - ok, pct: total ? Math.round((ok / total) * 100) : 0, last: last };
  }

  function daysSince(iso) {
    if (!iso) return null;
    var diff = Date.now() - new Date(iso).getTime();
    return Math.floor(diff / 86400000);
  }

  function formatDate(iso) {
    if (!iso) return "nunca";
    var d = new Date(iso);
    return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear();
  }

  function reviewNeed(topicId) {
    var rec = getRecord(topicId);
    var score = 0;
    if (rec.status === "revisar") score += 14;
    if (rec.status === "nao_iniciado") score += 6;
    if (rec.status === "estudando") score += 9;
    if (rec.status === "estudado") score += 3;
    var days = daysSince(rec.lastReview);
    if (days === null) score += 6;
    else if (days > 7) score += 14;
    else if (days > 3) score += 9;
    else if (days > 1) score += 4;
    return Math.min(score, 24);
  }

  function performanceNeed(topicId) {
    var acc = topicAccuracy(topicId);
    var bank = topicBankSize(topicId);
    if (!bank) return 0;
    var score = 0;
    if (acc.total === 0) {
      score += 16;
    } else {
      score += Math.round(((100 - acc.pct) / 100) * 18);
      if (acc.wrong >= 2) score += 5;
      if (acc.total < bank) score += 4;
      if (acc.total >= bank && acc.pct >= 85) score -= 6;
    }
    return Math.max(0, score);
  }

  function priorityScore(subject, topic) {
    var weight = (subject.points / 20) * 26;
    var importance = ((topic.importance || 3) / 5) * 22;
    var content = Math.min((topic.subtopics || []).length, 8) / 8 * 8;
    return Math.round(weight + importance + content + reviewNeed(topic.id) + performanceNeed(topic.id));
  }

  function rankedTopics() {
    return allTopics().map(function (entry) {
      return {
        subject: entry.subject,
        topic: entry.topic,
        score: priorityScore(entry.subject, entry.topic)
      };
    }).sort(function (a, b) { return b.score - a.score; });
  }

  function buildPlan(key) {
    if (contentState.plan[key]) return contentState.plan[key];
    var ranked = rankedTopics().slice(0, 5);
    var sum = 0;
    ranked.forEach(function (r) { sum += r.score; });
    var items = ranked.map(function (r) {
      var raw = sum > 0 ? (r.score / sum) * DAILY_GOAL_MIN : DAILY_GOAL_MIN / ranked.length;
      return { topicId: r.topic.id, subjectId: r.subject.id, score: r.score, minutes: Math.max(10, Math.round(raw / 5) * 5) };
    });
    var total = 0;
    items.forEach(function (it) { total += it.minutes; });
    var i = 0;
    while (total < DAILY_GOAL_MIN && items.length) {
      items[i % items.length].minutes += 5;
      total += 5;
      i++;
    }
    while (total > DAILY_GOAL_MIN && items.length) {
      var target = items[i % items.length];
      if (target.minutes > 10) { target.minutes -= 5; total -= 5; }
      i++;
      if (i > 200) break;
    }
    contentState.plan[key] = { items: items, done: {} };
    saveContent();
    return contentState.plan[key];
  }

  function togglePlanTask(key, topicId) {
    var plan = buildPlan(key);
    plan.done[topicId] = !plan.done[topicId];
    saveContent();
    renderHome();
    renderPlan();
  }

  function markSubtopics(topic, value) {
    var rec = ensureRecord(topic.id);
    (topic.subtopics || []).forEach(function (s) { rec.subtopics[s.id] = value; });
    saveContent();
  }

  function startTopic(topicId) {
    var entry = getTopicById(topicId);
    if (!entry) return;
    var rec = ensureRecord(topicId);
    if (rec.status === "nao_iniciado") rec.status = "estudando";
    rec.lastStudy = nowISO();
    currentTopicId = topicId;
    contentState.lastTopic = topicId;
    saveContent();
    refreshTopicView();
    renderSubjects();
  }

  function markStudied(topicId) {
    var entry = getTopicById(topicId);
    if (!entry) return;
    var rec = ensureRecord(topicId);
    rec.status = "estudado";
    rec.lastStudy = nowISO();
    rec.lastReview = nowISO();
    (entry.topic.subtopics || []).forEach(function (s) { rec.subtopics[s.id] = true; });
    currentTopicId = topicId;
    contentState.lastTopic = topicId;
    saveContent();
    refreshTopicView();
    renderSubjects();
    renderHome();
  }

  function unmarkStudied(topicId) {
    var entry = getTopicById(topicId);
    if (!entry) return;
    var rec = ensureRecord(topicId);
    rec.status = "nao_iniciado";
    rec.subtopics = {};
    rec.lastStudy = null;
    rec.lastReview = null;
    currentTopicId = topicId;
    contentState.lastTopic = topicId;
    saveContent();
    refreshTopicView();
    renderSubjects();
    renderHome();
  }

  function toggleStudied(topicId) {
    var entry = getTopicById(topicId);
    if (!entry) return;
    if (itemStatus(entry.topic) === "estudado") {
      if (!confirm("Desmarcar este assunto como estudado? O progresso deste assunto será removido.")) return;
      unmarkStudied(topicId);
    } else {
      markStudied(topicId);
    }
  }

  function reviewTopic(topicId) {
    var entry = getTopicById(topicId);
    if (!entry) return;
    var rec = ensureRecord(topicId);
    if (rec.status !== "estudado") rec.status = "revisar";
    rec.lastReview = nowISO();
    currentTopicId = topicId;
    contentState.lastTopic = topicId;
    saveContent();
    refreshTopicView();
    renderSubjects();
  }

  function toggleSubtopic(topicId, subId) {
    var entry = getTopicById(topicId);
    if (!entry) return;
    var rec = ensureRecord(topicId);
    rec.subtopics[subId] = !rec.subtopics[subId];
    if (rec.status === "nao_iniciado") rec.status = "estudando";
    rec.lastStudy = nowISO();
    var total = (entry.topic.subtopics || []).length;
    if (studiedCount(rec) === total) rec.status = "estudado";
    currentTopicId = topicId;
    saveContent();
    if (activeScreenName() === "topic") refreshTopicView();
    renderSubjects();
  }

  function activeScreenName() {
    var el = document.querySelector(".screen.active");
    return el ? el.id.replace("screen-", "") : "home";
  }

  function refreshTopicView() {
    if (activeScreenName() === "topic") renderTopicDetail();
  }

  function openTopic(topicId) {
    currentTopicId = topicId;
    var entry = getTopicById(topicId);
    if (entry) contentState.lastTopic = topicId;
    saveContent();
    showScreen("topic");
  }

  function defaultState() {
    return {
      v: 1,
      seconds: {},
      tasks: {},
      answers: {},
      videos: [],
      runningSince: null
    };
  }

  function loadState() {
    var base = defaultState();
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return base;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return base;
      base.seconds = parsed.seconds || {};
      base.tasks = parsed.tasks || {};
      base.answers = parsed.answers || {};
      base.videos = parsed.videos || [];
      base.runningSince = parsed.runningSince || null;
      return base;
    } catch (e) {
      return base;
    }
  }

  function saveState() {
    state.runningSince = sessionStart || null;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function $(id) { return document.getElementById(id); }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function dateKey(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function todayKey() { return dateKey(new Date()); }

  function addDays(dateKeyStr, delta) {
    var parts = dateKeyStr.split("-");
    var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() + delta);
    return dateKey(d);
  }

  function formatClock(totalSeconds) {
    totalSeconds = Math.max(0, Math.floor(totalSeconds));
    var h = Math.floor(totalSeconds / 3600);
    var m = Math.floor((totalSeconds % 3600) / 60);
    var s = totalSeconds % 60;
    return pad(h) + ":" + pad(m) + ":" + pad(s);
  }

  function formatMinutes(seconds) {
    var m = Math.floor(seconds / 60);
    if (m < 60) return m + " min";
    var h = Math.floor(m / 60);
    var rest = m % 60;
    return h + "h" + (rest ? " " + pad(rest) + "min" : "");
  }

  function todaySeconds() {
    return state.seconds[todayKey()] || 0;
  }

  function totalSeconds() {
    var sum = 0;
    for (var k in state.seconds) sum += state.seconds[k] || 0;
    return sum;
  }

  function commitSession() {
    if (!sessionStart) return;
    var elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    var key = dateKey(new Date(sessionStart));
    state.seconds[key] = (state.seconds[key] || 0) + Math.max(0, elapsed);
    sessionStart = null;
  }

  function currentLiveSeconds() {
    var base = state.seconds[todayKey()] || 0;
    if (sessionStart) base += Math.floor((Date.now() - sessionStart) / 1000);
    return base;
  }

  function streak() {
    var count = 0;
    var key = todayKey();
    if ((state.seconds[key] || 0) < STREAK_MIN_SECONDS) key = addDays(key, -1);
    while ((state.seconds[key] || 0) >= STREAK_MIN_SECONDS) {
      count++;
      key = addDays(key, -1);
    }
    return count;
  }

  function accuracyOf(subjectKey) {
    var ok = 0, total = 0;
    for (var id in state.answers) {
      var a = state.answers[id];
      if (subjectKey && a.subject !== subjectKey) continue;
      total++;
      if (a.correct) ok++;
    }
    return { ok: ok, total: total, pct: total ? Math.round((ok / total) * 100) : 0 };
  }

  function showScreen(name) {
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove("active");
    var target = $("screen-" + name);
    if (target) target.classList.add("active");
    var navs = document.querySelectorAll(".nav-btn");
    for (var j = 0; j < navs.length; j++) {
      navs[j].classList.toggle("active", navs[j].getAttribute("data-screen") === name);
    }
    window.scrollTo(0, 0);
    if (name === "performance") renderPerformance();
    if (name === "questions") renderQuestion();
    if (name === "videos") renderVideos();
    if (name === "plan") renderPlan();
    if (name === "home") renderHome();
    if (name === "subjects") renderSubjects();
    if (name === "topic") renderTopicDetail();
  }

  function countdownText() {
    var target = new Date(2026, 10, 1);
    var now = new Date();
    var diff = Math.ceil((target - now) / 86400000);
    if (diff > 0) return diff + " dias p/ prova";
    if (diff === 0) return "Prova hoje!";
    return "Prova realizada";
  }

  function renderTimer() {
    $("timer-display").textContent = formatClock(currentLiveSeconds());
    $("timer-toggle").textContent = sessionStart ? "Pausar" : "Iniciar";
  }

  function tick() {
    renderTimer();
    if (sessionStart && Math.floor((Date.now() - sessionStart) / 1000) % 5 === 0) {
      saveState();
    }
    renderHomeProgress();
  }

  function toggleTimer() {
    if (sessionStart) {
      commitSession();
      clearInterval(timerId);
      timerId = null;
      saveState();
    } else {
      sessionStart = Date.now();
      if (!timerId) timerId = setInterval(tick, 1000);
      saveState();
    }
    renderTimer();
    renderHomeProgress();
  }

  function resetTimer() {
    if (!confirm("Zerar o cronômetro? O tempo já estudado hoje será apagado.")) return;
    if (sessionStart) sessionStart = null;
    if (timerId) { clearInterval(timerId); timerId = null; }
    state.seconds[todayKey()] = 0;
    saveState();
    renderTimer();
    renderHome();
  }

  function resetProgress() {
    if (!confirm("Zerar todo o progresso de estudo?\n\nIsso apaga: assuntos estudados, progresso do edital, tempo de estudo e sequência.\n\nNão apaga: matérias, questões, videoaulas, plano de estudos nem suas respostas.")) return;
    if (timerId) { clearInterval(timerId); timerId = null; }
    sessionStart = null;
    contentState.records = {};
    contentState.lastTopic = null;
    state.seconds = {};
    state.runningSince = null;
    saveContent();
    saveState();
    renderTimer();
    renderHome();
    renderSubjects();
    renderPlan();
    renderPerformance();
    refreshTopicView();
  }

  function renderHomeProgress() {
    var sec = currentLiveSeconds();
    var pct = Math.min(1, sec / (DAILY_GOAL_MIN * 60));
    $("ring-progress").style.strokeDashoffset = String(326.7 * (1 - pct));
    $("home-today-min").textContent = Math.floor(sec / 60);
    $("stat-streak").textContent = streak();
    $("stat-total").textContent = Math.floor(totalSeconds() / 3600) + "h";
    var msg = $("home-today-msg");
    if (sec >= DAILY_GOAL_MIN * 60) msg.textContent = "Meta batida! Excelente.";
    else if (sec >= 3600) msg.textContent = "Falta pouco para a meta de hoje.";
    else if (sec > 0) msg.textContent = "Continue, você está no caminho.";
    else msg.textContent = "Bora começar a estudar?";
  }

  function renderHome() {
    renderTimer();
    renderHomeProgress();
    renderHomeMission();
    renderHomeSubjects();
  }

  function renderHomeMission() {
    var key = todayKey();
    var wrap = $("home-mission");
    wrap.innerHTML = "";
    var plan = buildPlan(key);
    plan.items.forEach(function (item) {
      var entry = getTopicById(item.topicId);
      if (!entry) return;
      var done = !!plan.done[item.topicId];
      var div = document.createElement("div");
      div.className = "mission-item" + (done ? " done" : "");
      div.innerHTML = '<span class="mission-name">' + entry.topic.name + "</span>" +
        '<span class="mission-min">' + (done ? "ok - " : "") + item.minutes + " min</span>";
      wrap.appendChild(div);
    });
  }

  function renderHomeSubjects() {
    var wrap = $("home-subjects");
    wrap.innerHTML = "";
    SUBJECT_ORDER.forEach(function (key) {
      var s = SUBJECTS[key];
      var acc = accuracyOf(key);
      var btn = document.createElement("button");
      btn.className = "subject-chip";
      btn.style.borderLeftColor = s.color;
      btn.innerHTML = "<strong>" + s.short + "</strong><span>" + acc.pct + "% de acertos</span>";
      btn.onclick = function () { openSubject(key); };
      wrap.appendChild(btn);
    });
  }

  function openSubject(key) {
    showScreen("subjects");
    var details = document.querySelectorAll("#subjects-list details.accordion");
    for (var i = 0; i < details.length; i++) {
      if (details[i].getAttribute("data-subject") === key) details[i].open = true;
      else details[i].open = false;
    }
  }

  function renderSubjects() {
    var wrap = $("subjects-list");
    var openSubjects = {};
    var openTopics = {};
    var seen = 0;
    var existingSubjects = document.querySelectorAll("#subjects-list details.accordion");
    for (var a = 0; a < existingSubjects.length; a++) {
      openSubjects[existingSubjects[a].getAttribute("data-subject")] = existingSubjects[a].open;
      seen++;
    }
    var existingTopics = document.querySelectorAll("#subjects-list details.topic-row");
    for (var b = 0; b < existingTopics.length; b++) {
      openTopics[existingTopics[b].getAttribute("data-topic")] = existingTopics[b].open;
    }
    var firstRender = seen === 0;

    wrap.innerHTML = "";
    if (!getSyllabus().length) {
      wrap.innerHTML = '<div class="empty">Nenhum conteúdo cadastrado.</div>';
      return;
    }
    var notice = document.createElement("div");
    notice.className = "notice";
    notice.textContent = "Árvore de conteúdo " + (window.SYLLABUS_SOURCE || "") + ": revise/complemente com o texto do edital. Todo o conteúdo fica em data/syllabus.js.";
    wrap.appendChild(notice);

    getSyllabus().forEach(function (subject) {
      var info = SUBJECTS[subject.id] || { short: subject.short, color: subject.color, q: subject.questions, pts: subject.points };
      var box = document.createElement("details");
      box.className = "accordion";
      box.setAttribute("data-subject", subject.id);
      box.open = firstRender ? subject.id === "especificos" : !!openSubjects[subject.id];
      var pct = subjectProgress(subject);
      var head = document.createElement("summary");
      head.style.borderLeftColor = info.color;
      head.innerHTML = '<div class="acc-title"><strong>' + subject.name + "</strong><span>" + pct + "% do edital</span></div>" +
        '<div class="acc-meta"><span>' + subject.questions + " questões</span><span>" + subject.points + " pontos</span>" +
        "<span>" + (subject.topics || []).length + " assuntos</span></div>" +
        '<div class="bar"><div class="bar-fill" style="width:' + pct + "%;background:" + info.color + '"></div></div>';
      box.appendChild(head);

      var body = document.createElement("div");
      body.className = "acc-body";
      (subject.topics || []).forEach(function (topic) {
        body.appendChild(buildTopicRow(subject, topic, !!openTopics[topic.id]));
      });
      box.appendChild(body);
      wrap.appendChild(box);
    });
  }

  function buildTopicRow(subject, topic, isOpen) {
    var status = itemStatus(topic);
    var meta = STATUS_LABELS[status];
    var progress = itemProgress(topic);
    var acc = topicAccuracy(topic.id);
    var score = priorityScore(subject, topic);
    var rec = getRecord(topic.id);

    var row = document.createElement("details");
    row.className = "topic-row";
    row.setAttribute("data-topic", topic.id);
    row.open = !!isOpen;
    var head = document.createElement("summary");
    head.innerHTML = '<div class="topic-head"><span class="topic-name">' + topic.name + "</span>" +
      '<span class="badge" style="background:' + meta.color + '">' + meta.label + "</span></div>" +
      '<div class="topic-sub">' + (topic.subtopics || []).length + " subassuntos - prioridade " + score +
      " - banco " + topicBankSize(topic.id) + " - " + acc.total + " respondidas (" + acc.pct + "%)</div>" +
      '<div class="bar" style="margin-top:8px"><div class="bar-fill" style="width:' + progress + '%;background:' + subject.color + '"></div></div>';
    row.appendChild(head);

    var body = document.createElement("div");
    body.className = "topic-body";
    body.innerHTML = '<div class="subtopic-list">' +
      (topic.subtopics || []).map(function (s) {
        var done = !!rec.subtopics[s.id];
        return '<label class="subtopic-item' + (done ? " done" : "") + '"><input type="checkbox"' + (done ? " checked" : "") +
          ' data-sub="' + s.id + '"><span>' + s.name + "</span></label>";
      }).join("") +
      "</div>" +
      '<div class="topic-sub">Última revisão: ' + formatDate(rec.lastReview) + "</div>" +
      '<button class="btn primary block" data-action="open">Estudar este assunto</button>';

    var checks = body.querySelectorAll("input[type=checkbox]");
    for (var i = 0; i < checks.length; i++) {
      checks[i].onclick = function (ev) {
        ev.preventDefault();
        toggleSubtopic(topic.id, ev.currentTarget.getAttribute("data-sub"));
      };
    }
    body.querySelector('[data-action="open"]').onclick = function () { openTopic(topic.id); };
    row.appendChild(body);
    return row;
  }

  function renderTopicDetail() {
    var wrap = $("topic-detail");
    var entry = currentTopicId ? getTopicById(currentTopicId) : null;
    if (!entry) {
      wrap.innerHTML = '<div class="empty">Assunto não encontrado.</div>';
      return;
    }
    var subject = entry.subject;
    var topic = entry.topic;
    var info = SUBJECTS[subject.id] || { short: subject.short, color: subject.color };
    var rec = getRecord(topic.id);
    var status = itemStatus(topic);
    var meta = STATUS_LABELS[status];
    var progress = itemProgress(topic);
    var acc = topicAccuracy(topic.id);
    var score = priorityScore(subject, topic);
    var videos = state.videos.filter(function (v) {
      return v.subject === subject.id && (v.topic === topic.name || v.topicId === topic.id);
    });
    var questions = (window.DATA_QUESTIONS || []).filter(function (q) {
      return topicIdOfQuestion(q) === topic.id;
    });

    var html = '<div class="card" style="border-left:5px solid ' + info.color + '">' +
      '<div class="acc-meta"><span style="color:' + info.color + '">' + subject.name + "</span></div>" +
      "<h1>" + topic.name + "</h1>" +
      '<div class="topic-head" style="justify-content:flex-start;gap:10px;margin:8px 0">' +
      '<span class="badge" style="background:' + meta.color + '">' + meta.label + '</span>' +
      '<span class="priority-chip">Prioridade ' + score + '</span></div>' +
      '<div class="bar"><div class="bar-fill" style="width:' + progress + "%;background:" + info.color + '"></div></div>' +
      '<div class="stat-row">' +
      '<div class="stat-pill"><strong>' + progress + '%</strong><span>progresso</span></div>' +
      '<div class="stat-pill"><strong>' + topicBankSize(topic.id) + '</strong><span>no banco</span></div>' +
      '<div class="stat-pill"><strong>' + acc.total + '</strong><span>respondidas</span></div>' +
      '<div class="stat-pill"><strong>' + acc.ok + '</strong><span>acertos</span></div>' +
      '<div class="stat-pill"><strong>' + acc.wrong + '</strong><span>erros</span></div>' +
      "</div>" +
      '<div class="topic-sub">Última revisão: ' + formatDate(rec.lastReview) + " - último estudo: " + formatDate(rec.lastStudy) + "</div>" +
      '<div class="q-actions">' +
      '<button class="btn primary" data-act="start">Começar estudo</button>' +
      '<button class="btn' + (status === "estudado" ? " ghost" : "") + '" data-act="finish">' +
      (status === "estudado" ? "Desmarcar como estudado" : "Marcar como estudado") + '</button>' +
      '<button class="btn ghost" data-act="review">Revisar</button>' +
      "</div></div>";

    html += '<div class="card"><h2>Conteúdo programático</h2><div class="subtopic-list">' +
      (topic.subtopics || []).map(function (s) {
        var done = !!rec.subtopics[s.id];
        return '<label class="subtopic-item' + (done ? " done" : "") + '"><input type="checkbox"' + (done ? " checked" : "") +
          ' data-sub="' + s.id + '"><span>' + s.name + "</span></label>";
      }).join("") + "</div></div>";

    var topicContent = (window.DATA_CONTENT || {})[topic.id];
    if (topicContent && topicContent.resumo) {
      html += '<div class="card"><h2>Resumo direcionado ao edital</h2><p class="small">' + topicContent.resumo + "</p>";
      if (topicContent.pontos && topicContent.pontos.length) {
        html += '<div class="subtopic-list">' + topicContent.pontos.map(function (p) {
          return '<div class="subtopic-item"><span>' + p + "</span></div>";
        }).join("") + "</div>";
      }
      if (topicContent.atualizacao) {
        html += '<div class="notice">Conteúdo sujeito a atualização periódica. Revise com fontes oficiais antes da prova.</div>';
      }
      html += "</div>";
    }

    html += '<div class="card"><h2>Videoaulas disponíveis</h2>';
    if (videos.length) {
      videos.forEach(function (v) {
        html += '<a class="video-mini" href="' + v.url + '" target="_blank" rel="noopener">' + (v.title || v.url) + "</a>";
      });
    } else {
      html += '<p class="muted small">Nenhuma videoaula cadastrada para este assunto. Cadastre na aba Vídeos usando o assunto "' + topic.name + '".</p>';
    }
    html += "</div>";

    html += '<div class="card"><h2>Questões deste assunto</h2>';
    var bankStats = topicBankStats(topic.id);
    if (bankStats.total) {
      html += '<p class="muted small">Banco: ' + bankStats.total + ' questões (' + bankStats.facil + ' fáceis, ' +
        bankStats.media + ' médias, ' + bankStats.dificil + ' difíceis).</p>';
    }
    if (questions.length) {
      questions.forEach(function (q) {
        var a = state.answers[q.id];
        var tag = a ? (a.correct ? '<span class="ok">acertou</span>' : '<span class="err">errou</span>') : '<span class="pending">não respondida</span>';
        html += '<div class="mini-q"><div class="mini-q-head"><span>' + questionNodeLabel(q) + " - " + difficultyLabel(q.dificuldade) + "</span>" + tag + "</div>" + q.statement + "</div>";
      });
      html += '<button class="btn primary block" data-act="practice">Responder questões deste assunto</button>';
    } else {
      html += '<p class="muted small">Ainda não há questões para este assunto. O banco será ampliado nas próximas etapas.</p>';
    }
    html += "</div>";
    wrap.innerHTML = html;

    var checks = wrap.querySelectorAll("input[type=checkbox]");
    for (var i = 0; i < checks.length; i++) {
      checks[i].onclick = function (ev) {
        ev.preventDefault();
        toggleSubtopic(topic.id, ev.currentTarget.getAttribute("data-sub"));
      };
    }
    wrap.querySelector('[data-act="start"]').onclick = function () { startTopic(topic.id); };
    wrap.querySelector('[data-act="finish"]').onclick = function () { toggleStudied(topic.id); };
    wrap.querySelector('[data-act="review"]').onclick = function () { reviewTopic(topic.id); };
    var practice = wrap.querySelector('[data-act="practice"]');
    if (practice) practice.onclick = function () { practiceTopic(topic.id); };
  }

  function practiceTopic(topicId) {
    topicFilter = topicId;
    currentQuestionId = null;
    showScreen("questions");
  }

  function continueStudying() {
    var target = contentState.lastTopic;
    if (!target || !getTopicById(target)) {
      var ranked = rankedTopics();
      target = ranked.length ? ranked[0].topic.id : null;
    }
    if (!target) {
      showScreen("subjects");
      return;
    }
    openTopic(target);
  }

  function renderPlan() {
    var key = todayKey();
    $("plan-date").textContent = "Hoje, " + key.split("-").reverse().join("/") + " - meta de " + DAILY_GOAL_MIN + " min. Assuntos escolhidos automaticamente pela prioridade.";
    var plan = buildPlan(key);
    var wrap = $("plan-tasks");
    wrap.innerHTML = "";
    var doneCount = 0;
    plan.items.forEach(function (item) {
      var entry = getTopicById(item.topicId);
      if (!entry) return;
      var done = !!plan.done[item.topicId];
      if (done) doneCount++;
      var status = itemStatus(entry.topic);
      var row = document.createElement("label");
      row.className = "task-item" + (done ? " done" : "");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = done;
      cb.onchange = function () { togglePlanTask(key, item.topicId); };
      var text = document.createElement("span");
      text.className = "task-text";
      text.innerHTML = entry.topic.name + "<small>" + entry.subject.name + " - " + item.minutes + " min - " +
        STATUS_LABELS[status].label + " - prioridade " + item.score + "</small>";
      row.appendChild(cb);
      row.appendChild(text);
      row.appendChild(makeOpenButton(item.topicId));
      wrap.appendChild(row);
    });
    if (!plan.items.length) wrap.innerHTML = '<div class="empty">Sem assuntos no plano.</div>';
    var total = plan.items.length;
    var pct = total ? Math.round((doneCount / total) * 100) : 0;
    $("plan-bar").style.width = pct + "%";
    $("plan-progress-text").textContent = doneCount + " de " + total + " assuntos - " + pct + "%";

    var dist = $("plan-distribution");
    dist.innerHTML = "";
    plan.items.forEach(function (item) {
      var entry = getTopicById(item.topicId);
      if (!entry) return;
      var s = SUBJECTS[entry.subject.id] || { short: entry.subject.short, color: entry.subject.color };
      var pct2 = Math.round((item.minutes / DAILY_GOAL_MIN) * 100);
      var row = document.createElement("div");
      row.className = "dist-row";
      row.innerHTML = '<div class="dist-head"><span>' + entry.topic.name + "</span><span>" + item.minutes + " min (" + pct2 + "%)</span></div>" +
        '<div class="bar"><div class="bar-fill" style="width:' + pct2 + "%;background:" + s.color + '"></div></div>';
      dist.appendChild(row);
    });
  }

  function makeOpenButton(topicId) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn ghost small-btn";
    btn.textContent = "Abrir";
    btn.onclick = function (ev) {
      ev.preventDefault();
      openTopic(topicId);
    };
    return btn;
  }


  function buildQuestionOrder() {
    if (topicFilter) {
      return (window.DATA_QUESTIONS || []).filter(function (q) {
        return topicIdOfQuestion(q) === topicFilter;
      });
    }
    var filterKey = $("question-filter").value;
    return (window.DATA_QUESTIONS || []).filter(function (q) {
      return filterKey === "all" || q.subject === filterKey;
    });
  }

  function renderQuestionContext() {
    var el = $("question-context");
    if (!topicFilter) {
      el.textContent = "";
      return;
    }
    var entry = getTopicById(topicFilter);
    el.textContent = entry ? "Filtrando pelo assunto: " + entry.topic.name : "";
    var clear = document.createElement("button");
    clear.className = "btn ghost small-btn";
    clear.style.marginLeft = "8px";
    clear.textContent = "Limpar filtro";
    clear.onclick = function () {
      topicFilter = null;
      currentQuestionId = null;
      renderQuestion();
    };
    el.appendChild(clear);
  }

  function renderQuestion() {
    renderQuestionContext();
    var area = $("question-area");
    var list = buildQuestionOrder();
    if (!list.length) {
      area.innerHTML = '<div class="empty">Nenhuma questão para esta matéria.</div>';
      return;
    }
    var q = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === currentQuestionId) { q = list[i]; break; }
    }
    if (!q) {
      q = list[0];
      currentQuestionId = q.id;
    }
    var recorded = state.answers[q.id];
    var subjectsList = (window.DATA_QUESTIONS || []).filter(function (x) { return x.subject === q.subject; });
    var idx = subjectsList.map(function (x) { return x.id; }).indexOf(q.id) + 1;

    var html = '<div class="q-head">' +
      '<div class="q-tags"><span class="q-tag">' + SUBJECTS[q.subject].short + '</span>' +
      '<span class="q-tag">' + questionNodeLabel(q) + "</span>" +
      '<span class="q-tag">Nível: ' + difficultyLabel(q.dificuldade) + "</span></div>" +
      '<span class="q-progress">' + idx + "/" + subjectsList.length + "</span>" +
      "</div>";
    html += '<p class="q-statement">' + q.statement + "</p>";
    html += '<div class="options">';
    q.options.forEach(function (opt, i) {
      var cls = "option";
      if (recorded) {
        if (i === q.answer) cls += " correct";
        else if (recorded.chosen === i) cls += " wrong";
      }
      html += '<button class="' + cls + '" data-i="' + i + '"' + (recorded ? " disabled" : "") + ">" +
        '<span class="letter">' + String.fromCharCode(65 + i) + "</span>" +
        "<span>" + opt + "</span></button>";
    });
    html += "</div>";
    if (recorded) {
      html += '<div class="explanation"><strong>' +
        (recorded.correct ? "Resposta correta" : "Resposta incorreta") +
        "</strong>" + q.explanation +
        '<div class="muted small" style="margin-top:6px">Fonte: ' + sourceLabel(q) + "</div></div>";
    }
    html += '<div class="q-actions">' +
      '<button class="btn ghost" id="q-prev">Anterior</button>' +
      '<button class="btn primary" id="q-next">Próxima</button>' +
      "</div>";
    area.innerHTML = html;

    var optButtons = area.querySelectorAll(".option");
    for (var b = 0; b < optButtons.length; b++) {
      optButtons[b].onclick = function (ev) {
        answerQuestion(q, parseInt(ev.currentTarget.getAttribute("data-i"), 10));
      };
    }
    $("q-prev").onclick = function () { moveQuestion(list, -1); };
    $("q-next").onclick = function () { moveQuestion(list, 1); };
  }

  function moveQuestion(list, delta) {
    var ids = list.map(function (q) { return q.id; });
    var pos = ids.indexOf(currentQuestionId);
    if (pos < 0) pos = 0;
    pos = (pos + delta + ids.length) % ids.length;
    currentQuestionId = ids[pos];
    renderQuestion();
  }

  function answerQuestion(q, chosen) {
    if (state.answers[q.id]) return;
    state.answers[q.id] = {
      chosen: chosen,
      correct: chosen === q.answer,
      subject: q.subject,
      topic: topicIdOfQuestion(q),
      ts: Date.now()
    };
    saveState();
    renderQuestion();
    renderPerformance();
    renderHomeSubjects();
    if (currentTopicId) renderTopicDetail();
  }

  function populateFilters() {
    var sel = $("question-filter");
    var current = sel.value || "all";
    sel.innerHTML = '<option value="all">Todas as matérias</option>';
    SUBJECT_ORDER.forEach(function (key) {
      var opt = document.createElement("option");
      opt.value = key;
      opt.textContent = SUBJECTS[key].name;
      sel.appendChild(opt);
    });
    sel.value = current;
  }

  function shuffleQuestions() {
    var all = window.DATA_QUESTIONS || [];
    for (var i = all.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = all[i]; all[i] = all[j]; all[j] = tmp;
    }
    currentQuestionId = null;
    renderQuestion();
  }

  function renderPerformance() {
    var total = accuracyOf(null);
    $("perf-pct").textContent = total.pct + "%";
    $("perf-answered").textContent = total.total;
    $("perf-correct").textContent = total.ok;
    $("perf-wrong").textContent = total.total - total.ok;

    var wrap = $("perf-subjects");
    wrap.innerHTML = "";
    SUBJECT_ORDER.forEach(function (key) {
      var s = SUBJECTS[key];
      var acc = accuracyOf(key);
      var row = document.createElement("div");
      row.className = "perf-subject";
      row.innerHTML = '<div class="ps-head"><span>' + s.short + "</span><span>" +
        (acc.total ? acc.ok + "/" + acc.total + " - " + acc.pct + "%" : "sem respostas") + "</span></div>" +
        '<div class="bar"><div class="bar-fill" style="width:' + acc.pct + "%;background:" + s.color + '"></div></div>';
      wrap.appendChild(row);
    });

    var hist = $("perf-history");
    hist.innerHTML = "";
    var key = todayKey();
    var days = [];
    for (var i = 6; i >= 0; i--) days.push(addDays(key, -i));
    days.forEach(function (d) {
      var sec = state.seconds[d] || 0;
      var div = document.createElement("div");
      div.style.marginBottom = "4px";
      div.textContent = d.split("-").reverse().join("/") + ": " + formatMinutes(sec);
      hist.appendChild(div);
    });

    var syl = $("perf-syllabus");
    syl.innerHTML = "";
    var bankSummary = document.createElement("div");
    bankSummary.className = "muted small";
    bankSummary.style.marginBottom = "10px";
    bankSummary.textContent = "Banco de questões: " + totalBankSize() + " questões distribuídas em " +
      allTopics().length + " assuntos do edital. Questões fora do edital ficam como demonstração.";
    syl.appendChild(bankSummary);
    getSyllabus().forEach(function (subject) {
      var info = SUBJECTS[subject.id] || { short: subject.short, color: subject.color };
      var pct = subjectProgress(subject);
      var studied = (subject.topics || []).filter(function (t) { return itemStatus(t) === "estudado"; }).length;
      var row = document.createElement("div");
      row.className = "perf-subject";
      row.innerHTML = '<div class="ps-head"><span>' + info.short + "</span><span>" +
        studied + "/" + (subject.topics || []).length + " assuntos - " + pct + "% - banco " + subjectBankSize(subject.id) + "</span></div>" +
        '<div class="bar"><div class="bar-fill" style="width:' + pct + "%;background:" + info.color + '"></div></div>';
      syl.appendChild(row);
    });
  }

  function renderVideos() {
    var wrap = $("videos-list");
    wrap.innerHTML = "";
    (window.DATA_VIDEOS || []).forEach(function (group) {
      var s = SUBJECTS[group.subject];
      if (!s) return;
      var block = document.createElement("div");
      block.className = "video-group";
      var html = "<h3 style='color:" + s.color + "'>" + s.name + "</h3><div class='video-topics'>";
      (group.topics || []).forEach(function (topic) {
        var links = state.videos.filter(function (v) {
          return v.subject === group.subject && v.topic === topic;
        });
        html += '<div class="video-topic"><div class="vt-name">Assunto: ' + topic + "</div>";
        if (links.length) {
          html += '<div class="video-links">';
          links.forEach(function (v, i) {
            html += '<div class="video-link" data-subject="' + v.subject + '" data-topic="' + topic + '" data-url="' + v.url + '">' +
              '<a href="' + v.url + '" target="_blank" rel="noopener">' + (v.title || v.url) + "</a>" +
              '<button type="button" title="Remover">x</button></div>';
          });
          html += "</div>";
        } else {
          html += '<div class="vt-name" style="margin-top:6px">Nenhuma videoaula cadastrada ainda.</div>';
        }
        html += "</div>";
      });
      html += "</div>";
      block.innerHTML = html;
      var removeButtons = block.querySelectorAll(".video-link button");
      for (var i = 0; i < removeButtons.length; i++) {
        removeButtons[i].onclick = function (ev) {
          var box = ev.currentTarget.parentNode;
          var sub = box.getAttribute("data-subject");
          var top = box.getAttribute("data-topic");
          var url = box.getAttribute("data-url");
          state.videos = state.videos.filter(function (v) {
            return !(v.subject === sub && v.topic === top && v.url === url);
          });
          saveState();
          renderVideos();
        };
      }
      wrap.appendChild(block);
    });
  }

  function populateVideoSubjects() {
    var sel = $("video-subject");
    sel.innerHTML = "";
    SUBJECT_ORDER.forEach(function (key) {
      var opt = document.createElement("option");
      opt.value = key;
      opt.textContent = SUBJECTS[key].name;
      sel.appendChild(opt);
    });
  }

  function addVideo() {
    var subject = $("video-subject").value;
    var topic = $("video-topic").value.trim();
    var url = $("video-url").value.trim();
    if (!topic || !url) {
      alert("Preencha o assunto e o link da videoaula.");
      return;
    }
    state.videos.push({ subject: subject, topic: topic, url: url, title: topic });
    saveState();
    $("video-topic").value = "";
    $("video-url").value = "";
    renderVideos();
    alert("Videoaula salva!");
  }

  function bindEvents() {
    var navs = document.querySelectorAll(".nav-btn");
    for (var i = 0; i < navs.length; i++) {
      navs[i].onclick = function (ev) {
        showScreen(ev.currentTarget.getAttribute("data-screen"));
      };
    }
    $("timer-toggle").onclick = toggleTimer;
    $("timer-reset").onclick = resetTimer;
    $("btn-continue").onclick = continueStudying;
    $("topic-back").onclick = function () { showScreen("subjects"); };
    $("question-filter").onchange = function () {
      topicFilter = null;
      currentQuestionId = null;
      renderQuestion();
    };
    $("question-shuffle").onclick = shuffleQuestions;
    $("video-add").onclick = addVideo;
    $("perf-reset").onclick = function () {
      if (!confirm("Apagar todas as respostas registradas?")) return;
      state.answers = {};
      saveState();
      renderPerformance();
      renderHomeSubjects();
    };
    $("progress-reset").onclick = resetProgress;
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        saveState();
      } else {
        renderHome();
      }
    });
    window.addEventListener("beforeunload", function () {
      if (sessionStart) commitSession();
      saveState();
    });
  }

  function init() {
    if (state.runningSince) {
      commitSession();
      saveState();
    }
    $("countdown").textContent = countdownText();
    populateFilters();
    populateVideoSubjects();
    bindEvents();
    renderHome();
    renderPlan();
    renderSubjects();
    renderPerformance();
    renderVideos();
    if (state.runningSince !== null) {
      sessionStart = null;
    }
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").catch(function () {});
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
