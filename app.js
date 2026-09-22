(function () {
  "use strict";

  var STORE_KEY = "dmae2026_v01";
  var EXAM_DATE = "2026-11-01";
  var DAILY_GOAL_MIN = 120;
  var STREAK_MIN_SECONDS = 600;
  var REVIEW_INTERVALS = [1, 3, 7, 15, 30];
  var REVIEW_PRIORITY_THRESHOLD = 62;
  var SIMULADO_PASS_POINTS = 25;
  var PLAN_VERSION = 2;
  var MAX_PLAN_DAILY_MIN = 480;

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
  var simTimerId = null;
  var lastSimResult = null;
  var coverageDay = null;

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
    return { v: 1, records: {}, plan: {}, lastTopic: null, reviewDone: {} };
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
      base.reviewDone = parsed.reviewDone || {};
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

  function blankRecord() {
    return {
      status: "nao_iniciado",
      subtopics: {},
      lastStudy: null,
      lastReview: null,
      firstStudy: null,
      reviewCount: 0,
      perf: null
    };
  }

  function normalizeRecord(rec) {
    if (!rec || typeof rec !== "object") return blankRecord();
    if (!rec.subtopics || typeof rec.subtopics !== "object") rec.subtopics = {};
    if (typeof rec.status !== "string") rec.status = "nao_iniciado";
    if (rec.lastStudy === undefined) rec.lastStudy = null;
    if (rec.lastReview === undefined) rec.lastReview = null;
    if (rec.firstStudy === undefined) rec.firstStudy = null;
    if (typeof rec.reviewCount !== "number" || isNaN(rec.reviewCount)) rec.reviewCount = 0;
    if (rec.perf === undefined) rec.perf = null;
    return rec;
  }

  function getRecord(topicId) {
    var rec = contentState.records[topicId];
    return rec ? normalizeRecord(rec) : blankRecord();
  }

  function ensureRecord(topicId) {
    if (!contentState.records[topicId]) contentState.records[topicId] = blankRecord();
    return normalizeRecord(contentState.records[topicId]);
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

  function formatDateKey(key) {
    if (!key) return "nunca";
    var p = String(key).split("-");
    if (p.length !== 3) return key;
    return p[2] + "/" + p[1] + "/" + p[0];
  }

  function intervalLevel(acc) {
    if (!acc || !acc.total) return "sem_dados";
    var wrong = acc.wrong !== undefined ? acc.wrong : (acc.total - acc.ok);
    if (acc.pct >= 85 && wrong <= 1) return "bom";
    if (acc.pct < 60 || wrong >= 2) return "ruim";
    return "medio";
  }

  function reviewPerformance(topicId) {
    var acc = topicAccuracy(topicId);
    if (acc.total > 0) {
      return { ok: acc.ok, total: acc.total, wrong: acc.wrong, pct: acc.pct, level: intervalLevel(acc) };
    }
    var rec = getRecord(topicId);
    if (rec.perf && rec.perf.total > 0) {
      var p = rec.perf;
      var wrong = p.total - (p.ok || 0);
      return { ok: p.ok || 0, total: p.total, wrong: wrong, pct: p.pct || 0, level: intervalLevel({ ok: p.ok || 0, total: p.total, wrong: wrong, pct: p.pct || 0 }) };
    }
    return { ok: 0, total: 0, wrong: 0, pct: 0, level: "sem_dados" };
  }

  function perfSnapshot(topicId) {
    var acc = topicAccuracy(topicId);
    return { ok: acc.ok, total: acc.total, pct: acc.pct, ts: Date.now() };
  }

  function reviewIntervalDays(rec, level) {
    var index = Math.min(rec.reviewCount || 0, REVIEW_INTERVALS.length - 1);
    var base = REVIEW_INTERVALS[index];
    if (level === "ruim") return Math.max(1, Math.floor(base / 2));
    if (level === "bom") return REVIEW_INTERVALS[Math.min(index + 1, REVIEW_INTERVALS.length - 1)];
    return base;
  }

  function nextReviewDate(rec, level) {
    var anchor = rec.lastReview || rec.lastStudy;
    if (!anchor) return null;
    return addDays(dateKey(new Date(anchor)), reviewIntervalDays(rec, level));
  }

  function reviewPriorityScore(subject, topic) {
    var rec = getRecord(topic.id);
    var score = 0;
    score += ((topic.importance || 3) / 5) * 25;
    score += ((subject.points || 0) / 20) * 15;
    if (rec.status === "estudado") score += 20;
    else if (rec.status === "revisar") score += 16;
    else if (rec.status === "estudando") score += 8;
    if (rec.lastStudy && !(rec.reviewCount > 0)) score += 12;
    var days = daysSince(rec.lastReview || rec.lastStudy);
    if (days !== null && days > 0) score += Math.min(days, 30);
    var acc = topicAccuracy(topic.id);
    if (acc.total > 0) score += Math.round((acc.wrong / acc.total) * 20);
    score -= Math.min(rec.reviewCount || 0, 5) * 2;
    var level = reviewPerformance(topic.id).level;
    if (level === "ruim") score += 8;
    else if (level === "bom") score -= 4;
    return Math.max(0, Math.round(score));
  }

  function reviewReason(topic) {
    var rec = getRecord(topic.id);
    var level = reviewPerformance(topic.id).level;
    var due = nextReviewDate(rec, level);
    var today = todayKey();
    if (rec.lastStudy && !rec.lastReview) return "Ainda não revisado";
    if (due && due < today) return "Revisão vencida em " + formatDateKey(due);
    if (due && due === today) return "Revisão do dia";
    if (rec.lastStudy && !(rec.reviewCount > 0)) return "Ainda não revisado";
    if (level === "ruim") return "Desempenho baixo nas questões";
    var acc = topicAccuracy(topic.id);
    if (acc.wrong > 0) return acc.wrong + " erro(s) nas questões";
    return "Alta prioridade";
  }

  function reviewsToday() {
    var today = todayKey();
    var out = [];
    allTopics().forEach(function (entry) {
      var rec = getRecord(entry.topic.id);
      if (!rec.lastStudy && rec.status !== "revisar") return;
      var level = reviewPerformance(entry.topic.id).level;
      var due = nextReviewDate(rec, level);
      var anchorDays = daysSince(rec.lastReview || rec.lastStudy);
      var isDue = !!due && due <= today;
      var score = reviewPriorityScore(entry.subject, entry.topic);
      var highPriority = anchorDays !== null && anchorDays >= 1 && score >= REVIEW_PRIORITY_THRESHOLD;
      if (!isDue && !highPriority) return;
      out.push({
        subject: entry.subject,
        topic: entry.topic,
        due: due,
        overdue: isDue && due < today,
        score: score,
        reason: reviewReason(entry.topic)
      });
    });
    out.sort(function (a, b) {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      return String(a.due || "").localeCompare(String(b.due || ""));
    });
    return out;
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

  function studyPhase(remainingDays) {
    if (remainingDays <= 30) {
      return { key: "reta_final", label: "Reta final", newContent: 0, review: 1.4, perf: 1.4, revisionBonus: 30 };
    }
    if (remainingDays <= 90) {
      return { key: "consolidacao", label: "Consolida\u00e7\u00e3o", newContent: 8, review: 1.2, perf: 1.15, revisionBonus: 12 };
    }
    return { key: "cobertura", label: "Cobertura", newContent: 22, review: 1, perf: 1, revisionBonus: 0 };
  }

  function priorityScore(subject, topic) {
    var phase = studyPhase(daysUntilExam());
    var rec = getRecord(topic.id);
    var isStudied = rec.status === "estudado";
    var weight = (subject.points / 20) * 26;
    var importance = ((topic.importance || 3) / 5) * 22;
    var content = Math.min((topic.subtopics || []).length, 8) / 8 * 8;
    var newContent = !isStudied && (rec.status === "nao_iniciado" || rec.status === "estudando") ? phase.newContent : 0;
    var revisionBonus = isStudied ? phase.revisionBonus : 0;
    return Math.round(weight + importance + content + newContent + revisionBonus +
      reviewNeed(topic.id) * phase.review + performanceNeed(topic.id) * phase.perf);
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

  function examDateAtMidnight() {
    var parts = String(EXAM_DATE).split("-");
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  function startOfToday() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function daysUntilExam() {
    return Math.ceil((examDateAtMidnight().getTime() - startOfToday().getTime()) / 86400000);
  }

  function estimatedTopicMinutes(subject, topic) {
    var importance = topic.importance || 3;
    var subs = (topic.subtopics || []).length;
    var points = subject.points || 0;
    var total = 50 + importance * 8 + Math.min(subs, 6) * 12 + points;
    return Math.round(total / 5) * 5;
  }

  function firstStudyDate() {
    var earliest = null;
    for (var id in contentState.records) {
      var rec = contentState.records[id];
      if (!rec) continue;
      var d = rec.firstStudy || rec.lastStudy;
      if (!d) continue;
      if (!earliest || new Date(d).getTime() < new Date(earliest).getTime()) earliest = d;
    }
    return earliest;
  }

  function coverageStatus(e) {
    var cfg = {
      completo: { key: "completo", label: "Cobertura completa", tone: "ok", color: "#34d399",
        detail: "Todos os assuntos do edital foram estudados. Foque em revis\u00e3o e simulados." },
      prova: { key: "prova", label: "Prova realizada", tone: "warn", color: "#94a3b8",
        detail: "A data da prova j\u00e1 passou. Use o material para revis\u00e3o cont\u00ednua." },
      adequado: { key: "adequado", label: "Ritmo adequado", tone: "ok", color: "#34d399",
        detail: "Seu ritmo atual cobre o edital at\u00e9 a prova." },
      atencao: { key: "atencao", label: "Aten\u00e7\u00e3o", tone: "warn", color: "#fbbf24",
        detail: "O ritmo est\u00e1 pr\u00f3ximo do limite. Ajuste a carga para n\u00e3o acumular." },
      atrasado: { key: "atrasado", label: "Atrasado", tone: "err", color: "#f87171",
        detail: "Voc\u00ea est\u00e1 atrasado em rela\u00e7\u00e3o \u00e0 cobertura prevista. Priorize os assuntos pendentes." }
    };
    if (e.total > 0 && e.studied === e.total) return cfg.completo;
    if (e.daysRemaining <= 0) return cfg.prova;
    var loadSeverity = e.deficit <= 0 ? 0 : (e.deficit <= 45 ? 1 : 2);
    var paceSeverity = 0;
    if (e.remainingTopics > 0 && e.projectedDays !== null) {
      if (e.forecast && e.forecast.getTime() <= examDateAtMidnight().getTime()) paceSeverity = 0;
      else {
        var lateDays = e.projectedDays - e.daysRemaining;
        paceSeverity = lateDays <= 14 ? 1 : 2;
      }
    }
    var severity = Math.max(loadSeverity, paceSeverity);
    if (severity === 0) return cfg.adequado;
    return severity === 1 ? cfg.atencao : cfg.atrasado;
  }

  function coverageEngine() {
    var entries = allTopics();
    var total = entries.length;
    var studied = 0;
    var progressSum = 0;
    var remainingMinutes = 0;
    var remainingTopics = 0;
    entries.forEach(function (entry) {
      var progress = itemProgress(entry.topic) / 100;
      progressSum += progress;
      if (itemStatus(entry.topic) === "estudado") studied++;
      if (progress < 1) {
        remainingTopics++;
        remainingMinutes += estimatedTopicMinutes(entry.subject, entry.topic) * (1 - progress);
      }
    });
    remainingMinutes = Math.round(remainingMinutes);
    var daysRemaining = daysUntilExam();
    var goalMin = DAILY_GOAL_MIN;
    var recommendedDailyMin = daysRemaining > 0
      ? Math.ceil(remainingMinutes / daysRemaining / 5) * 5
      : remainingMinutes;
    var deficit = recommendedDailyMin - goalMin;
    var planTargetMin = Math.max(goalMin, Math.min(recommendedDailyMin, MAX_PLAN_DAILY_MIN));

    var anchor = firstStudyDate();
    var daysStudied = anchor ? Math.max(1, daysSince(anchor) + 1) : 0;
    var paceTopicsPerDay = daysStudied ? studied / daysStudied : 0;
    var requiredTopicsPerDay = daysRemaining > 0 ? remainingTopics / daysRemaining : remainingTopics;
    var projectedDays = null;
    if (remainingTopics === 0) projectedDays = 0;
    else if (paceTopicsPerDay > 0) projectedDays = Math.ceil(remainingTopics / paceTopicsPerDay);
    var forecast = null;
    if (projectedDays !== null) {
      var f = startOfToday();
      f.setDate(f.getDate() + projectedDays);
      forecast = f;
    }
    var phase = studyPhase(daysRemaining);
    var base = {
      total: total,
      studied: studied,
      remaining: total - studied,
      remainingTopics: remainingTopics,
      coveragePct: total ? Math.round((progressSum / total) * 100) : 0,
      daysRemaining: daysRemaining,
      remainingMinutes: remainingMinutes,
      recommendedDailyMin: recommendedDailyMin,
      goalMin: goalMin,
      deficit: deficit,
      planTargetMin: planTargetMin,
      paceTopicsPerDay: paceTopicsPerDay,
      requiredTopicsPerDay: requiredTopicsPerDay,
      projectedDays: projectedDays,
      forecast: forecast,
      phase: phase
    };
    base.status = coverageStatus(base);
    return base;
  }

  function buildPlan(key) {
    var existing = contentState.plan[key];
    if (existing && existing.v === PLAN_VERSION) return existing;
    var target = coverageEngine().planTargetMin;
    var ranked = rankedTopics().slice(0, 5);
    var sum = 0;
    ranked.forEach(function (r) { sum += r.score; });
    var items = ranked.map(function (r) {
      var raw = sum > 0 ? (r.score / sum) * target : target / ranked.length;
      return { topicId: r.topic.id, subjectId: r.subject.id, score: r.score, minutes: Math.max(10, Math.round(raw / 5) * 5) };
    });
    var total = 0;
    items.forEach(function (it) { total += it.minutes; });
    var i = 0;
    while (total < target && items.length) {
      items[i % items.length].minutes += 5;
      total += 5;
      i++;
    }
    while (total > target && items.length) {
      var targetItem = items[i % items.length];
      if (targetItem.minutes > 10) { targetItem.minutes -= 5; total -= 5; }
      i++;
      if (i > 400) break;
    }
    contentState.plan[key] = { v: PLAN_VERSION, items: items, done: (existing && existing.done) || {} };
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
    if (!rec.firstStudy) rec.firstStudy = rec.lastStudy;
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
    if (!rec.firstStudy) rec.firstStudy = rec.lastStudy;
    rec.perf = perfSnapshot(topicId);
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
    rec.firstStudy = null;
    rec.reviewCount = 0;
    rec.perf = null;
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
    rec.reviewCount = (rec.reviewCount || 0) + 1;
    if (!rec.firstStudy) rec.firstStudy = rec.lastStudy || rec.lastReview;
    rec.perf = perfSnapshot(topicId);
    currentTopicId = topicId;
    contentState.lastTopic = topicId;
    saveContent();
    refreshTopicView();
    renderSubjects();
  }

  function revisarAgora(topicId) {
    reviewTopic(topicId);
    openTopic(topicId);
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
      runningSince: null,
      simulados: [],
      activeSimulado: null
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
      base.simulados = Array.isArray(parsed.simulados) ? parsed.simulados : [];
      base.activeSimulado = parsed.activeSimulado || null;
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

  function isYoutubeHost(host) {
    host = String(host || "").toLowerCase();
    return host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com" ||
      host === "youtu.be" || host === "www.youtu.be" ||
      host === "youtube-nocookie.com" || host === "www.youtube-nocookie.com" ||
      host === "music.youtube.com";
  }

  function safeUserVideoUrl(raw) {
    if (!raw || typeof raw !== "string") return "";
    var trimmed = raw.trim();
    if (!trimmed) return "";
    try {
      var parsed = new URL(trimmed);
      if (parsed.protocol !== "https:") return "";
      if (!isYoutubeHost(parsed.hostname)) return "";
      return parsed.href;
    } catch (e) {
      return "";
    }
  }

  function userVideoLabel(v) {
    var title = v && v.title;
    if (title && typeof title === "string" && title.trim()) return title.trim();
    return (v && v.url) ? String(v.url) : "";
  }

  function createUserVideoAnchor(v, className) {
    var a = document.createElement("a");
    if (className) a.className = className;
    var href = safeUserVideoUrl(v && v.url);
    if (href) {
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    } else {
      a.href = "#";
      a.addEventListener("click", function (ev) { ev.preventDefault(); });
    }
    a.textContent = userVideoLabel(v);
    return a;
  }

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

  function formatSignedMinutes(minutes) {
    var abs = formatMinutes(Math.abs(minutes) * 60);
    if (minutes > 0) return "+" + abs;
    if (minutes < 0) return "-" + abs;
    return "0 min";
  }

  function forecastLabel(engine) {
    if (engine.total > 0 && engine.studied === engine.total) return "Conclu\u00eddo";
    if (!engine.forecast) return "Sem ritmo";
    var d = engine.forecast;
    var label = pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear();
    if (d.getTime() > examDateAtMidnight().getTime()) label += " (ap\u00f3s a prova)";
    return label;
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
    if (name !== "simulado" && simTimerId) {
      clearInterval(simTimerId);
      simTimerId = null;
    }
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
    if (name === "simulado") renderSimulado();
    if (name === "questions") renderQuestion();
    if (name === "videos") renderVideos();
    if (name === "plan") renderPlan();
    if (name === "review") renderReview();
    if (name === "home") renderHome();
    if (name === "subjects") renderSubjects();
    if (name === "topic") renderTopicDetail();
  }

  function countdownText() {
    var diff = daysUntilExam();
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
    if (coverageDay !== todayKey()) renderCoverage();
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
    if (!confirm("Zerar todo o progresso de estudo?\n\nIsso apaga: assuntos estudados, revisões agendadas, progresso do edital, tempo de estudo e sequência.\n\nNão apaga: matérias, questões, videoaulas, plano de estudos nem suas respostas.")) return;
    if (timerId) { clearInterval(timerId); timerId = null; }
    sessionStart = null;
    contentState.records = {};
    contentState.reviewDone = {};
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
    renderReview();
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
    renderCoverage();
    renderHomeMission();
    renderHomeSubjects();
  }

  function coverageCell(value, label) {
    return '<div class="coverage-cell"><strong>' + value + '</strong><span>' + label + '</span></div>';
  }

  function coverageAlertDetail(engine) {
    var detail = "Meta: " + formatMinutes(engine.goalMin * 60) + "/dia | Necess\u00e1rio: " +
      formatMinutes(engine.recommendedDailyMin * 60) + "/dia | " +
      (engine.deficit > 0 ? "D\u00e9ficit: " + formatMinutes(engine.deficit * 60) : "D\u00e9ficit: 0 min") + ".";
    if (engine.deficit <= 0 && engine.studied < engine.total) {
      detail = "Meta: " + formatMinutes(engine.goalMin * 60) + "/dia | Necess\u00e1rio: " +
        formatMinutes(engine.recommendedDailyMin * 60) + "/dia | Sobra: " + formatMinutes(-engine.deficit * 60) + ".";
    }
    if (engine.phase.key === "reta_final") {
      detail += " Reta final: priorize revis\u00e3o, quest\u00f5es e simulados.";
    }
    return detail;
  }

  function renderCoverage() {
    var wrap = $("coverage-summary");
    if (!wrap) return;
    coverageDay = todayKey();
    var engine = coverageEngine();
    var daysLabel = engine.daysRemaining > 0 ? engine.daysRemaining + " dias" : "0 dias";
    wrap.innerHTML =
      coverageCell(daysLabel, "at\u00e9 a prova") +
      coverageCell(engine.studied + "/" + engine.total, "assuntos estudados") +
      coverageCell(engine.coveragePct + "%", "cobertura do edital") +
      coverageCell(formatMinutes(engine.recommendedDailyMin * 60), "necess\u00e1rio/dia") +
      coverageCell(formatMinutes(engine.goalMin * 60), "meta atual") +
      coverageCell(formatSignedMinutes(engine.deficit), "diferen\u00e7a (necess\u00e1rio - meta)") +
      coverageCell(forecastLabel(engine), "previs\u00e3o de conclus\u00e3o") +
      coverageCell(engine.phase.label, "fase (" + engine.remainingTopics + " assuntos pendentes)");
    var bar = $("coverage-bar");
    if (bar) {
      bar.style.width = engine.coveragePct + "%";
      bar.style.background = engine.status.color;
    }
    var alert = $("coverage-alert");
    if (alert) {
      alert.className = "coverage-alert " + engine.status.tone;
      alert.innerHTML = "<strong>" + engine.status.label + "</strong><span>" + engine.status.detail + "</span><span>" +
        coverageAlertDetail(engine) + "</span>";
    }
  }

  function renderHomeMission() {
    var key = todayKey();
    var wrap = $("home-mission");
    wrap.innerHTML = "";
    var reviews = reviewsToday();
    reviews.forEach(function (r) {
      var done = isReviewTaskDone(key, r.topic.id);
      var div = document.createElement("div");
      div.className = "mission-item review-mission" + (done ? " done" : "");
      div.innerHTML = '<span class="mission-name">Revisão: ' + r.topic.name + "</span>" +
        '<span class="mission-min">' + (done ? "ok - " : "") + r.reason + "</span>";
      wrap.appendChild(div);
    });
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

    var importance = topic.importance || 0;
    var topicVideos = (window.DATA_VIDEOAULAS || []).filter(function (v) {
      return v.topicId === topic.id;
    });
    var mainVideos = topicVideos.filter(function (v) { return !v.semVideo && v.tipo === "principal"; });
    var extraVideos = topicVideos.filter(function (v) { return !v.semVideo && v.tipo === "complementar"; });
    var missingVideo = topicVideos.length > 0 && topicVideos.every(function (v) { return v.semVideo; });
    var topicContent = (window.DATA_CONTENT || {})[topic.id];

    var html = '<div class="card" style="border-left:5px solid ' + info.color + '">' +
      '<div class="acc-meta"><span style="color:' + info.color + '">' + subject.name + "</span></div>" +
      "<h1>" + topic.name + "</h1>" +
      '<div class="topic-head" style="justify-content:flex-start;gap:10px;margin:8px 0">' +
      '<span class="badge" style="background:' + meta.color + '">' + meta.label + '</span>' +
      '<span class="priority-chip">Importância ' + importance + '/5</span>' +
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
      "</div>";

    html += '<div class="card"><h2>Conteúdo</h2>';
    if (topicContent && topicContent.resumo) {
      html += '<p class="small">' + topicContent.resumo + "</p>";
    } else {
      html += '<p class="muted small">Conteúdo em preparação para este assunto. Consulte o texto do edital.</p>';
    }
    if (topicContent && topicContent.conceitos && topicContent.conceitos.length) {
      html += '<h3 class="sec-sub">Conceitos que você precisa dominar</h3><div class="subtopic-list">' +
        topicContent.conceitos.map(function (c) {
          return '<div class="subtopic-item"><span>' + c + "</span></div>";
        }).join("") + "</div>";
    }
    if (topicContent && topicContent.termos && topicContent.termos.length) {
      html += '<h3 class="sec-sub">Termos e definições</h3><div class="term-list">' +
        topicContent.termos.map(function (t) {
          return '<div class="term-item"><strong>' + t.t + "</strong><span>" + t.d + "</span></div>";
        }).join("") + "</div>";
    }
    if (topicContent && topicContent.referencia) {
      html += '<div class="ref-line"><strong>Referência: </strong>' + topicContent.referencia + "</div>";
    }
    if (topicContent && topicContent.atualizacao) {
      html += '<div class="notice">Conteúdo sujeito a atualização periódica. Revise com fontes oficiais antes da prova.</div>';
    }
    html += "</div>";

    html += '<div class="card"><h2>Pontos importantes</h2>';
    if (topicContent && topicContent.pontos && topicContent.pontos.length) {
      html += '<div class="subtopic-list">' + topicContent.pontos.map(function (p) {
        return '<div class="subtopic-item"><span>' + p + "</span></div>";
      }).join("") + "</div>";
    } else {
      html += '<p class="muted small">Sem tópicos destacados registrados.</p>';
    }
    if (topicContent && topicContent.atencao && topicContent.atencao.length) {
      html += '<h3 class="sec-sub">Pontos de atenção</h3><div class="subtopic-list">' +
        topicContent.atencao.map(function (a) {
          return '<div class="subtopic-item warn"><span>' + a + "</span></div>";
        }).join("") + "</div>";
    }
    if ((topic.subtopics || []).length) {
      html += '<h3 class="sec-sub">Conteúdo programático</h3><div class="subtopic-list">' +
        topic.subtopics.map(function (s) {
          var done = !!rec.subtopics[s.id];
          return '<label class="subtopic-item' + (done ? " done" : "") + '"><input type="checkbox"' + (done ? " checked" : "") +
            ' data-sub="' + s.id + '"><span>' + s.name + "</span></label>";
        }).join("") + "</div>";
    }
    html += "</div>";

    html += '<div class="card"><h2>Videoaulas</h2>';
    if (mainVideos.length || extraVideos.length) {
      mainVideos.forEach(function (v) {
        html += '<a class="video-mini" href="' + v.url + '" target="_blank" rel="noopener">' +
          "<strong>" + v.titulo + "</strong>" +
          '<span class="video-meta">Principal' + (v.canal ? " - " + v.canal : "") + "</span></a>";
      });
      extraVideos.forEach(function (v) {
        html += '<a class="video-mini" href="' + v.url + '" target="_blank" rel="noopener">' +
          "<strong>" + v.titulo + "</strong>" +
          '<span class="video-meta">Complementar' + (v.canal ? " - " + v.canal : "") + "</span></a>";
      });
    } else if (missingVideo) {
      html += '<div class="notice">' + topicVideos[0].motivo + "</div>";
    } else {
      html += '<p class="muted small">Nenhuma videoaula selecionada para este assunto.</p>';
    }
    html += "</div>";

    html += '<div class="card"><h2>Meu progresso neste assunto</h2>' +
      '<div class="topic-sub">Marque como estudado para registrar seu avanço e atualizar o progresso do edital.</div>' +
      '<div class="q-actions">' +
      '<button class="btn primary" data-act="start">Começar estudo</button>' +
      '<button class="btn' + (status === "estudado" ? " ghost" : "") + '" data-act="finish">' +
      (status === "estudado" ? "Desmarcar como estudado" : "Marcar como estudado") + '</button>' +
      '<button class="btn ghost" data-act="review">Revisar</button>' +
      "</div></div>";

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

    if (videos.length) {
      var videoCard = null;
      var cards = wrap.querySelectorAll(".card");
      for (var c = 0; c < cards.length; c++) {
        var h2 = cards[c].querySelector("h2");
        if (h2 && h2.textContent === "Videoaulas") { videoCard = cards[c]; break; }
      }
      if (videoCard) {
        var mineHead = document.createElement("h3");
        mineHead.className = "sec-sub";
        mineHead.textContent = "Minhas videoaulas";
        videoCard.appendChild(mineHead);
        videos.forEach(function (v) {
          videoCard.appendChild(createUserVideoAnchor(v, "video-mini"));
        });
      }
    }

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
    var engine = coverageEngine();
    var targetLabel = engine.planTargetMin > engine.goalMin
      ? "carga necess\u00e1ria de " + formatMinutes(engine.planTargetMin * 60) + " (meta " + formatMinutes(engine.goalMin * 60) + ")"
      : "meta de " + formatMinutes(engine.goalMin * 60);
    $("plan-date").textContent = "Hoje, " + key.split("-").reverse().join("/") + " - " + targetLabel +
      " para cobrir " + engine.remainingTopics + " assunto(s) em " + engine.daysRemaining + " dia(s).";
    var intro = $("plan-intro");
    if (intro) {
      intro.textContent = "Prioridade calculada pelo peso da mat\u00e9ria, import\u00e2ncia do assunto, quantidade de conte\u00fado, " +
        "desempenho e revis\u00f5es pendentes. A carga di\u00e1ria acompanha a cobertura do edital e pode superar a meta configurada.";
    }
    var plan = buildPlan(key);
    var wrap = $("plan-tasks");
    wrap.innerHTML = "";
    var doneCount = 0;
    var reviews = reviewsToday();
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
    reviews.forEach(function (review) {
      if (isReviewTaskDone(key, review.topic.id)) doneCount++;
      wrap.appendChild(buildReviewTaskRow(key, review));
    });
    if (!plan.items.length && !reviews.length) wrap.innerHTML = '<div class="empty">Sem assuntos no plano.</div>';
    var total = plan.items.length + reviews.length;
    var pct = total ? Math.round((doneCount / total) * 100) : 0;
    $("plan-bar").style.width = pct + "%";
    $("plan-progress-text").textContent = doneCount + " de " + total + " assuntos - " + pct + "%";

    var planMinutes = 0;
    plan.items.forEach(function (item) { planMinutes += item.minutes; });
    var dist = $("plan-distribution");
    dist.innerHTML = "";
    plan.items.forEach(function (item) {
      var entry = getTopicById(item.topicId);
      if (!entry) return;
      var s = SUBJECTS[entry.subject.id] || { short: entry.subject.short, color: entry.subject.color };
      var pct2 = planMinutes ? Math.round((item.minutes / planMinutes) * 100) : 0;
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

  function reviewDoneKey(key, topicId) {
    return key + "|" + topicId;
  }

  function isReviewTaskDone(key, topicId) {
    return !!(contentState.reviewDone && contentState.reviewDone[reviewDoneKey(key, topicId)]);
  }

  function toggleReviewTask(key, topicId) {
    if (!contentState.reviewDone) contentState.reviewDone = {};
    var k = reviewDoneKey(key, topicId);
    contentState.reviewDone[k] = !contentState.reviewDone[k];
    saveContent();
    renderHome();
    renderPlan();
  }

  function buildReviewTaskRow(key, review) {
    var done = isReviewTaskDone(key, review.topic.id);
    var row = document.createElement("label");
    row.className = "task-item review-task" + (done ? " done" : "");
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = done;
    cb.onchange = function () { toggleReviewTask(key, review.topic.id); };
    var text = document.createElement("span");
    text.className = "task-text";
    text.innerHTML = "Revisão: " + review.topic.name + "<small>" + review.subject.name + " - " +
      review.reason + " - prioridade " + review.score + "</small>";
    row.appendChild(cb);
    row.appendChild(text);
    row.appendChild(makeOpenButton(review.topic.id));
    return row;
  }

  function makeReviewNowButton(topicId) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn primary small-btn";
    btn.textContent = "Revisar agora";
    btn.onclick = function (ev) {
      ev.preventDefault();
      revisarAgora(topicId);
    };
    return btn;
  }

  function renderReview() {
    var wrap = $("review-list");
    if (!wrap) return;
    var list = reviewsToday();
    wrap.innerHTML = "";
    if (!list.length) {
      wrap.innerHTML = '<div class="empty">Nenhuma revisão pendente para hoje. Marque assuntos como estudados para agendar as próximas revisões.</div>';
      return;
    }
    var summary = document.createElement("p");
    summary.className = "muted small";
    summary.textContent = list.length + " assunto(s) na fila de revisão, ordenados por atraso e prioridade.";
    wrap.appendChild(summary);
    list.forEach(function (review) {
      var row = document.createElement("div");
      row.className = "task-item review-item";
      var text = document.createElement("span");
      text.className = "task-text";
      text.innerHTML = review.topic.name + "<small>" + review.subject.name + " - " +
        review.reason + " - prioridade " + review.score + "</small>";
      row.appendChild(text);
      row.appendChild(makeReviewNowButton(review.topic.id));
      wrap.appendChild(row);
    });
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
    renderPerfSummary();
    renderPerfSubjects();
    renderPerfWorst();
    renderPerfUnstudied();
    renderPerfPriority();
    renderPerfEvolution();
    renderPerfHistory();
    renderPerfSyllabus();
    renderPerformanceSimulados();
  }

  function totalStudiedTopics() {
    var n = 0;
    allTopics().forEach(function (entry) {
      if (itemStatus(entry.topic) === "estudado") n++;
    });
    return n;
  }

  function subjectCoverage(subject) {
    var topics = subject.topics || [];
    var studied = 0;
    topics.forEach(function (t) { if (itemStatus(t) === "estudado") studied++; });
    return { studied: studied, total: topics.length, pct: subjectProgress(subject) };
  }

  function performanceOverview() {
    var acc = accuracyOf(null);
    var engine = coverageEngine();
    return {
      answered: acc.total,
      correct: acc.ok,
      wrong: acc.total - acc.ok,
      pct: acc.pct,
      studied: engine.studied,
      totalTopics: engine.total,
      coveragePct: engine.coveragePct,
      totalSeconds: totalSeconds(),
      daysRemaining: engine.daysRemaining
    };
  }

  function subjectPerformance() {
    return SUBJECT_ORDER.map(function (key) {
      var s = SUBJECTS[key];
      var subject = getSubject(key);
      var acc = accuracyOf(key);
      var cov = subject ? subjectCoverage(subject) : { studied: 0, total: 0, pct: 0 };
      return {
        key: key,
        name: s.name,
        short: s.short,
        color: s.color,
        answered: acc.total,
        correct: acc.ok,
        wrong: acc.total - acc.ok,
        pct: acc.pct,
        studied: cov.studied,
        totalTopics: cov.total,
        coveragePct: cov.pct
      };
    });
  }

  function worstTopics(limit) {
    var out = [];
    allTopics().forEach(function (entry) {
      var acc = topicAccuracy(entry.topic.id);
      if (acc.total <= 0) return;
      out.push({
        subject: entry.subject,
        topic: entry.topic,
        answered: acc.total,
        correct: acc.ok,
        wrong: acc.wrong,
        pct: acc.pct
      });
    });
    out.sort(function (a, b) {
      if (a.pct !== b.pct) return a.pct - b.pct;
      if (b.wrong !== a.wrong) return b.wrong - a.wrong;
      return b.answered - a.answered;
    });
    return limit ? out.slice(0, limit) : out;
  }

  function unstudiedTopics(limit) {
    var out = [];
    allTopics().forEach(function (entry) {
      if (itemStatus(entry.topic) === "estudado") return;
      out.push({
        subject: entry.subject,
        topic: entry.topic,
        progress: itemProgress(entry.topic),
        score: priorityScore(entry.subject, entry.topic)
      });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return limit ? out.slice(0, limit) : out;
  }

  function priorityBreakdown(subject, topic) {
    var acc = topicAccuracy(topic.id);
    return {
      topicId: topic.id,
      subjectId: subject.id,
      subject: subject,
      topic: topic,
      weight: Math.round(((subject.points || 0) / 20) * 26),
      importance: Math.round(((topic.importance || 3) / 5) * 22),
      content: Math.round((Math.min((topic.subtopics || []).length, 8) / 8) * 8),
      performance: performanceNeed(topic.id),
      review: reviewNeed(topic.id),
      errors: acc.wrong,
      answered: acc.total,
      accuracy: acc.pct,
      coverage: itemProgress(topic),
      status: itemStatus(topic),
      phase: studyPhase(daysUntilExam()).key,
      score: priorityScore(subject, topic)
    };
  }

  function priorityTopics(limit) {
    var out = rankedTopics().map(function (r) {
      return priorityBreakdown(r.subject, r.topic);
    });
    return limit ? out.slice(0, limit) : out;
  }

  function simuladoStats() {
    var list = (state.simulados || []).slice().sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
    if (!list.length) {
      return {
        count: 0, best: null, last: null, averagePoints: 0,
        averagePct: 0, approved: 0, approvalRate: 0, series: []
      };
    }
    var best = list[0];
    var sumPoints = 0;
    var sumPct = 0;
    var approved = 0;
    list.forEach(function (r) {
      if ((r.points || 0) > (best.points || 0)) best = r;
      sumPoints += r.points || 0;
      sumPct += r.pct || 0;
      if (r.approved) approved++;
    });
    return {
      count: list.length,
      best: best,
      last: list[list.length - 1],
      averagePoints: Math.round((sumPoints / list.length) * 10) / 10,
      averagePct: Math.round(sumPct / list.length),
      approved: approved,
      approvalRate: Math.round((approved / list.length) * 100),
      series: list.map(function (r) {
        return { ts: r.ts, points: r.points || 0, maxPoints: r.maxPoints || 0, pct: r.pct || 0, approved: !!r.approved };
      })
    };
  }

  function timeEvolution(days) {
    var key = todayKey();
    var out = [];
    for (var i = days - 1; i >= 0; i--) {
      var d = addDays(key, -i);
      out.push({ key: d, seconds: state.seconds[d] || 0 });
    }
    return out;
  }

  function answerEvolution() {
    var byDay = {};
    for (var id in state.answers) {
      var a = state.answers[id];
      if (!a || !a.ts) continue;
      var k = dateKey(new Date(a.ts));
      if (!byDay[k]) byDay[k] = { key: k, ok: 0, total: 0 };
      byDay[k].total++;
      if (a.correct) byDay[k].ok++;
    }
    return Object.keys(byDay).sort().map(function (k) {
      var d = byDay[k];
      return { key: k, ok: d.ok, total: d.total, pct: d.total ? Math.round((d.ok / d.total) * 100) : 0 };
    });
  }

  function hasEnoughEvolution() {
    return timeEvolution(7).filter(function (d) { return d.seconds > 0; }).length >= 2 ||
      answerEvolution().length >= 2 ||
      simuladoStats().count >= 2;
  }

  function renderPerfSummary() {
    var o = performanceOverview();
    var pct = $("perf-pct");
    if (!pct) return;
    pct.textContent = o.pct + "%";
    $("perf-answered").textContent = o.answered;
    $("perf-correct").textContent = o.correct;
    $("perf-wrong").textContent = o.wrong;
    $("perf-studied").textContent = o.studied + "/" + o.totalTopics;
    $("perf-coverage").textContent = o.coveragePct + "%";
    $("perf-time").textContent = formatMinutes(o.totalSeconds);
    $("perf-days").textContent = o.daysRemaining > 0 ? o.daysRemaining : "0";
    var note = $("perf-answer");
    if (note) {
      note.textContent = o.answered
        ? "Você já respondeu " + o.answered + " questão(ões): " + o.correct + " acerto(s) e " + o.wrong + " erro(s)."
        : "Você ainda não respondeu questões. Comece pela aba Questões para gerar sua análise.";
    }
  }

  function renderPerfSubjects() {
    var wrap = $("perf-subjects");
    if (!wrap) return;
    wrap.innerHTML = "";
    subjectPerformance().forEach(function (s) {
      var row = document.createElement("div");
      row.className = "perf-subject";
      row.innerHTML =
        '<div class="ps-head"><span style="color:' + s.color + '">' + s.short + "</span><span>" +
        (s.answered ? s.correct + "/" + s.answered + " - " + s.pct + "%" : "sem respostas") + "</span></div>" +
        '<div class="bar"><div class="bar-fill" style="width:' + s.pct + "%;background:" + s.color + '"></div></div>' +
        '<div class="ps-sub">respondidas ' + s.answered + " - acertos " + s.correct + " - erros " + s.wrong +
        " - assuntos " + s.studied + "/" + s.totalTopics + " (" + s.coveragePct + "% de cobertura)</div>" +
        '<div class="bar bar-thin" style="margin-top:4px"><div class="bar-fill" style="width:' + s.coveragePct +
        "%;background:var(--muted)\"></div></div>";
      wrap.appendChild(row);
    });
  }

  function perfEmpty(wrap, msg) {
    wrap.innerHTML = '<div class="empty">' + msg + "</div>";
  }

  function renderPerfWorst() {
    var wrap = $("perf-worst");
    if (!wrap) return;
    var list = worstTopics(6);
    wrap.innerHTML = "";
    if (!list.length) {
      perfEmpty(wrap, "Sem respostas suficientes. Responda questões para identificar onde você erra mais.");
      return;
    }
    list.forEach(function (t) {
      var s = SUBJECTS[t.subject.id] || { color: t.subject.color, short: t.subject.short };
      var row = document.createElement("div");
      row.className = "perf-subject";
      row.innerHTML =
        '<div class="ps-head"><span>' + t.topic.name + "</span><span>" + t.pct + "% (" +
        t.correct + "/" + t.answered + ")</span></div>" +
        '<div class="bar"><div class="bar-fill" style="width:' + t.pct + "%;background:" + (t.pct < 60 ? "var(--err)" : s.color) + '"></div></div>' +
        '<div class="ps-sub">' + s.short + " - " + t.wrong + " erro(s) em " + t.answered + " questão(ões)</div>";
      wrap.appendChild(row);
    });
  }

  function renderPerfUnstudied() {
    var wrap = $("perf-unstudied");
    if (!wrap) return;
    var all = unstudiedTopics();
    wrap.innerHTML = "";
    if (!all.length) {
      perfEmpty(wrap, "Todos os 89 assuntos do edital já foram estudados. Foque em revisão e simulados.");
      return;
    }
    var summary = document.createElement("div");
    summary.className = "muted small";
    summary.style.marginBottom = "10px";
    summary.textContent = all.length + " assunto(s) ainda não estudado(s). Os mais prioritários aparecem primeiro.";
    wrap.appendChild(summary);
    all.slice(0, 8).forEach(function (t) {
      var s = SUBJECTS[t.subject.id] || { color: t.subject.color, short: t.subject.short };
      var row = document.createElement("div");
      row.className = "perf-subject";
      row.innerHTML =
        '<div class="ps-head"><span>' + t.topic.name + "</span><span>prioridade " + t.score + "</span></div>" +
        '<div class="ps-sub">' + s.short + " - import\u00e2ncia " + (t.topic.importance || 3) +
        "/5 - progresso " + t.progress + "%</div>";
      wrap.appendChild(row);
    });
  }

  function priorityReason(b) {
    var parts = [];
    if (b.status === "nao_iniciado") parts.push("n\u00e3o estudado");
    else if (b.status === "estudando") parts.push("em andamento");
    if (b.errors > 0) parts.push(b.errors + " erro(s)");
    if (b.review > 0 && b.status === "estudado") parts.push("revis\u00e3o pendente");
    if (b.accuracy > 0 && b.accuracy < 60) parts.push("acerto baixo");
    if (!parts.length) parts.push("peso " + b.weight + " / import\u00e2ncia " + b.importance);
    return parts.join(" - ");
  }

  function renderPerfPriority() {
    var wrap = $("perf-priority");
    if (!wrap) return;
    var list = priorityTopics(6);
    wrap.innerHTML = "";
    if (!list.length) {
      perfEmpty(wrap, "Sem assuntos para priorizar.");
      return;
    }
    var phase = studyPhase(daysUntilExam());
    var summary = document.createElement("div");
    summary.className = "muted small";
    summary.style.marginBottom = "10px";
    summary.textContent = "Fase " + phase.label + " - faltam " + daysUntilExam() + " dia(s) para a prova. Ranking combina peso, import\u00e2ncia, desempenho, erros, cobertura e revis\u00f5es.";
    wrap.appendChild(summary);
    list.forEach(function (b) {
      var s = SUBJECTS[b.subjectId] || { color: b.subject.color, short: b.subject.short };
      var row = document.createElement("div");
      row.className = "perf-subject";
      row.innerHTML =
        '<div class="ps-head"><span>' + b.topic.name + "</span><span>prioridade " + b.score + "</span></div>" +
        '<div class="bar"><div class="bar-fill" style="width:' + Math.min(100, b.score) + "%;background:" + s.color + '"></div></div>' +
        '<div class="ps-sub">' + s.short + " - " + priorityReason(b) + " - cobertura " + b.coverage + "%</div>" +
        '<div class="chips">' +
        '<span class="chip">peso ' + b.weight + "</span>" +
        '<span class="chip">import\u00e2ncia ' + b.importance + "</span>" +
        '<span class="chip">conte\u00fado ' + b.content + "</span>" +
        '<span class="chip">desempenho ' + b.performance + "</span>" +
        '<span class="chip">revis\u00e3o ' + b.review + "</span>" +
        "</div>";
      wrap.appendChild(row);
    });
  }

  function miniBarsHTML(points, colorFn, labelFn) {
    if (!points.length) return "";
    var max = 0;
    points.forEach(function (p) { if (p.value > max) max = p.value; });
    if (max <= 0) max = 1;
    var html = '<div class="mini-bars">';
    points.forEach(function (p) {
      var h = Math.max(4, Math.round((p.value / max) * 100));
      var color = colorFn ? colorFn(p) : "var(--primary)";
      html += '<div class="mini-bar" title="' + (labelFn ? labelFn(p) : p.value) + '">' +
        '<div class="mini-bar-fill" style="height:' + h + "%;background:" + color + '"></div></div>';
    });
    html += "</div>";
    return html;
  }

  function renderPerfEvolution() {
    var wrap = $("perf-evolution");
    if (!wrap) return;
    wrap.innerHTML = "";
    if (!hasEnoughEvolution()) {
      perfEmpty(wrap, "Poucos dados ainda. Estude e simule em pelo menos 2 dias diferentes para ver sua evolução.");
      return;
    }

    var days = timeEvolution(7);
    var timeBlock = document.createElement("div");
    timeBlock.className = "evo-block";
    var avgMin = 0;
    days.forEach(function (d) { avgMin += d.seconds; });
    avgMin = Math.round((avgMin / 60) / days.length);
    timeBlock.innerHTML = "<h3 class=\"sec-sub\">Tempo estudado (7 dias)</h3>" +
      miniBarsHTML(days.map(function (d) { return { value: d.seconds, key: d.key }; }),
        function () { return "var(--primary)"; },
        function (p) { return p.key.split("-").reverse().join("/") + ": " + formatMinutes(p.value); }) +
      '<div class="ps-sub">m\u00e9dia de ' + avgMin + " min/dia nos \u00faltimos 7 dias</div>";
    wrap.appendChild(timeBlock);

    var answers = answerEvolution();
    if (answers.length >= 2) {
      var ansBlock = document.createElement("div");
      ansBlock.className = "evo-block";
      ansBlock.innerHTML = "<h3 class=\"sec-sub\">Acerto por dia de estudo</h3>" +
        miniBarsHTML(answers.map(function (a) { return { value: a.pct, key: a.key, total: a.total }; }),
          function (p) { return p.value < 60 ? "var(--err)" : (p.value < 80 ? "var(--warn)" : "var(--ok)"); },
          function (p) { return p.key.split("-").reverse().join("/") + ": " + p.value + "% (" + p.total + " questões)"; });
      wrap.appendChild(ansBlock);
    }
  }

  function renderPerfHistory() {
    var hist = $("perf-history");
    if (!hist) return;
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
  }

  function renderPerfSyllabus() {
    var syl = $("perf-syllabus");
    if (!syl) return;
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

  function videoTopicsBySubject() {
    var bySubject = {};
    SUBJECT_ORDER.forEach(function (key) { bySubject[key] = []; });
    allTopics().forEach(function (entry) {
      var key = entry.subject.id;
      if (!bySubject[key]) bySubject[key] = [];
      bySubject[key].push({ id: entry.topic.id, name: entry.topic.name });
    });
    state.videos.forEach(function (v) {
      if (!SUBJECTS[v.subject] || !v.topic) return;
      if (!bySubject[v.subject]) bySubject[v.subject] = [];
      var list = bySubject[v.subject];
      var exists = list.some(function (t) {
        return t.name === v.topic || (v.topicId && t.id === v.topicId);
      });
      if (!exists) list.push({ id: v.topicId || null, name: v.topic });
    });
    return bySubject;
  }

  function appendOfficialVideoAnchor(parent, v) {
    var a = document.createElement("a");
    a.className = "video-mini";
    if (v.url) {
      a.href = v.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    } else {
      a.href = "#";
      a.addEventListener("click", function (ev) { ev.preventDefault(); });
    }
    var titleEl = document.createElement("strong");
    titleEl.textContent = v.titulo || v.assunto || "Videoaula";
    a.appendChild(titleEl);
    var meta = document.createElement("span");
    meta.className = "video-meta";
    var tipoLabel = v.tipo === "complementar" ? "Complementar" : "Principal";
    meta.textContent = "Oficial - " + tipoLabel + (v.canal ? " - " + v.canal : "");
    a.appendChild(meta);
    parent.appendChild(a);
  }

  function renderVideos() {
    var wrap = $("videos-list");
    wrap.innerHTML = "";
    var bySubject = videoTopicsBySubject();
    var officialAll = window.DATA_VIDEOAULAS || [];
    SUBJECT_ORDER.forEach(function (key) {
      var topics = bySubject[key] || [];
      if (!topics.length) return;
      var s = SUBJECTS[key];
      var block = document.createElement("div");
      block.className = "video-group";
      var heading = document.createElement("h3");
      heading.style.color = s.color;
      heading.textContent = s.name;
      block.appendChild(heading);
      var topicsWrap = document.createElement("div");
      topicsWrap.className = "video-topics";
      topics.forEach(function (topic) {
        var official = officialAll.filter(function (v) {
          return topic.id && v.topicId === topic.id;
        });
        var mainOfficial = official.filter(function (v) { return !v.semVideo && v.tipo === "principal"; });
        var extraOfficial = official.filter(function (v) { return !v.semVideo && v.tipo === "complementar"; });
        var missingOfficial = official.length > 0 && official.every(function (v) { return v.semVideo; });
        var userLinks = state.videos.filter(function (v) {
          return v.subject === key && (v.topic === topic.name || (topic.id && v.topicId === topic.id));
        });
        var topicBox = document.createElement("div");
        topicBox.className = "video-topic";
        var nameEl = document.createElement("div");
        nameEl.className = "vt-name";
        nameEl.textContent = "Assunto: " + topic.name;
        topicBox.appendChild(nameEl);
        if (mainOfficial.length || extraOfficial.length) {
          mainOfficial.forEach(function (v) { appendOfficialVideoAnchor(topicBox, v); });
          extraOfficial.forEach(function (v) { appendOfficialVideoAnchor(topicBox, v); });
        } else if (missingOfficial) {
          var notice = document.createElement("div");
          notice.className = "notice";
          notice.textContent = official[0].motivo || "Sem videoaula oficial para este assunto.";
          topicBox.appendChild(notice);
        }
        if (userLinks.length) {
          var mineHead = document.createElement("div");
          mineHead.className = "vt-name";
          mineHead.style.marginTop = "6px";
          mineHead.textContent = "Minhas videoaulas";
          topicBox.appendChild(mineHead);
          var linksWrap = document.createElement("div");
          linksWrap.className = "video-links";
          userLinks.forEach(function (v) {
            var row = document.createElement("div");
            row.className = "video-link";
            row.appendChild(createUserVideoAnchor(v));
            var removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.title = "Remover";
            removeBtn.textContent = "x";
            removeBtn.onclick = function () {
              state.videos = state.videos.filter(function (item) {
                return !(item.subject === v.subject && item.topic === v.topic && item.url === v.url);
              });
              saveState();
              renderVideos();
            };
            row.appendChild(removeBtn);
            linksWrap.appendChild(row);
          });
          topicBox.appendChild(linksWrap);
        } else if (!mainOfficial.length && !extraOfficial.length && !missingOfficial) {
          var empty = document.createElement("div");
          empty.className = "vt-name";
          empty.style.marginTop = "6px";
          empty.textContent = "Nenhuma videoaula cadastrada ainda.";
          topicBox.appendChild(empty);
        }
        topicsWrap.appendChild(topicBox);
      });
      block.appendChild(topicsWrap);
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
    var safeUrl = safeUserVideoUrl(url);
    if (!safeUrl) {
      alert("Informe um link https do YouTube.");
      return;
    }
    state.videos.push({ subject: subject, topic: topic, url: safeUrl, title: topic });
    saveState();
    $("video-topic").value = "";
    $("video-url").value = "";
    renderVideos();
    alert("Videoaula salva!");
  }

  // ---------------------------------------------------------------------------
  // V0.6 - Sistema de Simulados (DMAE 2026 - Agente Comercial)
  // ---------------------------------------------------------------------------

  var _simQById = null;

  function simQuestionById(id) {
    if (!_simQById) {
      _simQById = {};
      (window.DATA_QUESTIONS || []).forEach(function (q) { _simQById[q.id] = q; });
    }
    return _simQById[id] || null;
  }

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function optionOrder(n) {
    var arr = [];
    for (var i = 0; i < n; i++) arr.push(i);
    return shuffleArray(arr);
  }

  function simuladoDistribution() {
    var dist = {};
    SUBJECT_ORDER.forEach(function (key) { dist[key] = SUBJECTS[key].q; });
    return dist;
  }

  function simuladoMaxPoints() {
    var sum = 0;
    SUBJECT_ORDER.forEach(function (key) { sum += SUBJECTS[key].pts; });
    return sum;
  }

  function simPointsPerQuestion(key) {
    var cfg = SUBJECTS[key];
    if (!cfg || !cfg.q) return 0;
    return cfg.pts / cfg.q;
  }

  function canBuildSimulado() {
    var dist = simuladoDistribution();
    for (var i = 0; i < SUBJECT_ORDER.length; i++) {
      var key = SUBJECT_ORDER[i];
      var count = (window.DATA_QUESTIONS || []).filter(function (q) { return q.subject === key; }).length;
      if (count < dist[key]) return false;
    }
    return true;
  }

  function generateSimulado() {
    var dist = simuladoDistribution();
    var items = [];
    SUBJECT_ORDER.forEach(function (key) {
      var pool = (window.DATA_QUESTIONS || []).filter(function (q) { return q.subject === key; });
      shuffleArray(pool);
      pool.slice(0, dist[key]).forEach(function (q) {
        items.push({
          qid: q.id,
          subject: key,
          order: optionOrder(q.options.length),
          chosen: null
        });
      });
    });
    return {
      id: "sim-" + Date.now(),
      createdAt: Date.now(),
      startedAt: Date.now(),
      current: 0,
      items: items
    };
  }

  function scoreSimulado(sim) {
    var bySubject = {};
    SUBJECT_ORDER.forEach(function (key) {
      bySubject[key] = { ok: 0, wrong: 0, total: 0, points: 0, max: SUBJECTS[key].pts };
    });
    var correct = 0, wrong = 0, blank = 0, points = 0;
    sim.items.forEach(function (it) {
      var q = simQuestionById(it.qid);
      var st = bySubject[it.subject];
      if (!q || !st) return;
      var per = simPointsPerQuestion(it.subject);
      st.total++;
      if (it.chosen === null || it.chosen === undefined) { blank++; return; }
      if (it.chosen === q.answer) {
        correct++;
        points += per;
        st.ok++;
        st.points += per;
      } else {
        wrong++;
        st.wrong++;
      }
    });
    var zeradas = SUBJECT_ORDER.filter(function (key) {
      return bySubject[key].total > 0 && bySubject[key].ok === 0;
    });
    var total = sim.items.length;
    var pct = total ? Math.round((correct / total) * 100) : 0;
    var approved = points >= SIMULADO_PASS_POINTS && zeradas.length === 0;
    return {
      id: sim.id,
      ts: Date.now(),
      startedAt: sim.startedAt,
      points: points,
      maxPoints: simuladoMaxPoints(),
      pct: pct,
      correct: correct,
      wrong: wrong,
      blank: blank,
      total: total,
      bySubject: bySubject,
      zeradas: zeradas,
      zerouAlguma: zeradas.length > 0,
      approved: approved,
      durationSec: sim.startedAt ? Math.round((Date.now() - sim.startedAt) / 1000) : 0,
      items: sim.items.map(function (it) {
        return { qid: it.qid, chosen: it.chosen, subject: it.subject };
      })
    };
  }

  function setSimVisible(el, visible) {
    if (!el) return;
    el.classList.toggle("hidden", !visible);
  }

  function startSimTimer() {
    if (simTimerId) { clearInterval(simTimerId); simTimerId = null; }
    var sim = state.activeSimulado;
    if (!sim) return;
    function update() {
      var el = $("sim-timer");
      if (!el) return;
      var sec = Math.floor((Date.now() - (sim.startedAt || Date.now())) / 1000);
      el.textContent = formatClock(sec);
    }
    update();
    simTimerId = setInterval(update, 1000);
  }

  function renderSimuladoSetup() {
    var info = $("sim-bank-info");
    if (info) {
      info.textContent = "Banco atual: " + totalBankSize() + " questões. Nenhuma questão se repete dentro do mesmo simulado.";
    }
    var btn = $("simulado-new");
    if (btn) btn.disabled = !canBuildSimulado();
  }

  function renderSimulado() {
    var setup = $("simulado-setup");
    var run = $("simulado-run");
    var resultWrap = $("simulado-result");
    if (!setup || !run || !resultWrap) return;
    renderSimuladoSetup();
    renderSimuladoHistory();

    if (lastSimResult) {
      setSimVisible(setup, false);
      setSimVisible(run, false);
      setSimVisible(resultWrap, true);
      renderSimuladoResult(lastSimResult);
      return;
    }
    if (state.activeSimulado) {
      setSimVisible(setup, false);
      setSimVisible(run, true);
      setSimVisible(resultWrap, false);
      renderSimuladoRun();
      startSimTimer();
      return;
    }
    setSimVisible(setup, true);
    setSimVisible(run, false);
    setSimVisible(resultWrap, false);
  }

  function renderSimuladoRun() {
    var sim = state.activeSimulado;
    if (!sim) return;
    if (!sim.items || !sim.items.length) {
      state.activeSimulado = null;
      saveState();
      renderSimulado();
      return;
    }
    if (sim.current < 0) sim.current = 0;
    if (sim.current >= sim.items.length) sim.current = sim.items.length - 1;

    var idx = sim.current;
    var item = sim.items[idx];
    var q = simQuestionById(item.qid);
    if (!q) {
      sim.current = Math.min(sim.items.length - 1, idx + 1);
      renderSimuladoRun();
      return;
    }
    var cfg = SUBJECTS[item.subject] || SUBJECTS[q.subject];

    $("sim-progress").textContent = (idx + 1) + "/" + sim.items.length;
    var bar = $("sim-bar");
    if (bar) bar.style.width = Math.round(((idx + 1) / sim.items.length) * 100) + "%";
    var subjTag = $("sim-subject-tag");
    if (subjTag) {
      subjTag.textContent = cfg.short;
      subjTag.style.color = cfg.color;
      subjTag.style.borderColor = cfg.color;
    }
    var topicTag = $("sim-topic-tag");
    if (topicTag) topicTag.textContent = questionNodeLabel(q);

    var html = '<p class="q-statement">' + q.statement + "</p>";
    html += '<div class="options">';
    item.order.forEach(function (orig, pos) {
      var cls = "option";
      if (item.chosen === orig) cls += " selected";
      html += '<button class="' + cls + '" data-orig="' + orig + '">' +
        '<span class="letter">' + String.fromCharCode(65 + pos) + "</span>" +
        "<span>" + q.options[orig] + "</span></button>";
    });
    html += "</div>";
    $("sim-question").innerHTML = html;

    var opts = $("sim-question").querySelectorAll(".option");
    for (var i = 0; i < opts.length; i++) {
      opts[i].onclick = function (ev) {
        chooseSimOption(parseInt(ev.currentTarget.getAttribute("data-orig"), 10));
      };
    }
    $("sim-prev").disabled = idx === 0;
    $("sim-next").disabled = idx === sim.items.length - 1;
    renderSimMap(sim, idx);
  }

  function renderSimMap(sim, current) {
    var wrap = $("sim-map");
    if (!wrap) return;
    var html = "";
    sim.items.forEach(function (it, i) {
      var cls = "";
      if (it.chosen !== null && it.chosen !== undefined) cls += " answered";
      if (i === current) cls += " current";
      html += '<button type="button" class="' + cls.trim() + '" data-i="' + i + '">' + (i + 1) + "</button>";
    });
    wrap.innerHTML = html;
    var btns = wrap.querySelectorAll("button");
    for (var j = 0; j < btns.length; j++) {
      btns[j].onclick = function (ev) {
        sim.current = parseInt(ev.currentTarget.getAttribute("data-i"), 10);
        saveState();
        renderSimuladoRun();
      };
    }
  }

  function chooseSimOption(orig) {
    var sim = state.activeSimulado;
    if (!sim) return;
    sim.items[sim.current].chosen = orig;
    saveState();
    renderSimuladoRun();
  }

  function moveSimQuestion(delta) {
    var sim = state.activeSimulado;
    if (!sim) return;
    sim.current = Math.min(sim.items.length - 1, Math.max(0, sim.current + delta));
    saveState();
    renderSimuladoRun();
  }

  function newSimulado() {
    if (state.activeSimulado && !confirm("Já existe um simulado em andamento. Deseja abandoná-lo e criar um novo?")) return;
    if (!canBuildSimulado()) {
      alert("O banco de questões atual não possui questões suficientes para montar o simulado.");
      return;
    }
    state.activeSimulado = generateSimulado();
    lastSimResult = null;
    saveState();
    renderSimulado();
    window.scrollTo(0, 0);
  }

  function abandonSimulado() {
    if (!state.activeSimulado) return;
    if (!confirm("Abandonar o simulado em andamento? As respostas deste simulado serão descartadas.")) return;
    state.activeSimulado = null;
    if (simTimerId) { clearInterval(simTimerId); simTimerId = null; }
    saveState();
    renderSimulado();
  }

  function finishSimulado() {
    var sim = state.activeSimulado;
    if (!sim || !sim.items.length) return;
    var blank = sim.items.filter(function (it) {
      return it.chosen === null || it.chosen === undefined;
    }).length;
    var msg = blank > 0
      ? "Você deixou " + blank + " questão(ões) em branco. Deseja finalizar o simulado mesmo assim?"
      : "Finalizar o simulado e ver o resultado?";
    if (!confirm(msg)) return;

    var record = scoreSimulado(sim);
    state.simulados = state.simulados || [];
    state.simulados.unshift(record);

    sim.items.forEach(function (it) {
      if (it.chosen === null || it.chosen === undefined) return;
      if (state.answers[it.qid]) return;
      var q = simQuestionById(it.qid);
      if (!q) return;
      state.answers[it.qid] = {
        chosen: it.chosen,
        correct: it.chosen === q.answer,
        subject: q.subject,
        topic: topicIdOfQuestion(q),
        ts: Date.now()
      };
    });

    state.activeSimulado = null;
    if (simTimerId) { clearInterval(simTimerId); simTimerId = null; }
    saveState();
    lastSimResult = record;
    renderSimulado();
    renderPerformance();
    renderHomeSubjects();
    window.scrollTo(0, 0);
  }

  function simSubjectBreakdownHTML(rec) {
    var html = "";
    SUBJECT_ORDER.forEach(function (key) {
      var cfg = SUBJECTS[key];
      var st = (rec.bySubject && rec.bySubject[key]) || { ok: 0, total: 0, points: 0, max: cfg.pts };
      var zeroed = st.total > 0 && st.ok === 0;
      var pct = st.total ? Math.round((st.ok / st.total) * 100) : 0;
      html += '<div class="sim-subject-row' + (zeroed ? " zeroed" : "") + '">' +
        '<div class="ssr-head"><span>' + cfg.name + "</span><span>" + st.ok + "/" + st.total + " (" + pct + "%) - " +
        st.points + "/" + (st.max || cfg.pts) + " pts" + (zeroed ? " - ZEROU" : "") + "</span></div>" +
        '<div class="bar"><div class="bar-fill" style="width:' + pct + "%;background:" + cfg.color + '"></div></div>' +
        "</div>";
    });
    return html;
  }

  function simGabaritoHTML(rec) {
    var items = rec.items || [];
    if (!items.length) return '<div class="empty">Sem questões registradas.</div>';
    var html = '<div class="sim-gabarito">';
    items.forEach(function (it, i) {
      var q = simQuestionById(it.qid);
      if (!q) return;
      var cfg = SUBJECTS[it.subject] || SUBJECTS[q.subject];
      var blank = it.chosen === null || it.chosen === undefined;
      var correct = !blank && it.chosen === q.answer;
      var cls = blank ? "blank" : (correct ? "correct" : "wrong");
      var tag = blank ? "em branco" : (correct ? "acertou" : "errou");
      html += '<div class="gab-item ' + cls + '">' +
        '<div class="gab-head"><span>' + (i + 1) + ". " + cfg.short + " - " + questionNodeLabel(q) + "</span>" +
        '<span class="' + (correct ? "ok" : "err") + '">' + tag + "</span></div>" +
        "<div>" + q.statement + "</div>" +
        '<div class="gab-answer ok">Correta: ' + q.options[q.answer] + "</div>" +
        (blank || correct ? "" : '<div class="gab-answer bad">Sua resposta: ' + q.options[it.chosen] + "</div>") +
        "</div>";
    });
    html += "</div>";
    return html;
  }

  function renderSimuladoResult(rec) {
    var wrap = $("simulado-result");
    if (!wrap) return;
    var verdict = rec.approved ? "APROVADO NO SIMULADO" : "NÃO ATINGIU OS CRITÉRIOS";
    var verdictCls = rec.approved ? "ok" : "err";
    var zeradasText = rec.zeradas && rec.zeradas.length
      ? rec.zeradas.map(function (k) { return SUBJECTS[k].short; }).join(", ")
      : "nenhuma";
    var passPts = rec.points >= SIMULADO_PASS_POINTS;

    var html = '<div class="card">' +
      '<div class="sim-verdict ' + verdictCls + '">' + verdict + "</div>" +
      '<div class="sim-stat-grid">' +
      '<div class="stat-card"><strong>' + rec.points + '</strong><span>de ' + rec.maxPoints + " pontos</span></div>" +
      '<div class="stat-card"><strong>' + rec.pct + '%</strong><span>de acertos</span></div>' +
      '<div class="stat-card ok"><strong>' + rec.correct + '</strong><span>acertos</span></div>' +
      '<div class="stat-card err"><strong>' + rec.wrong + '</strong><span>erros</span></div>' +
      "</div>" +
      '<ul class="sim-criteria">' +
      '<li><span>Mínimo de ' + SIMULADO_PASS_POINTS + ' pontos</span><span class="' + (passPts ? "yes" : "no") + '">' +
      rec.points + "/" + SIMULADO_PASS_POINTS + " - " + (passPts ? "OK" : "NÃO") + "</span></li>" +
      '<li><span>Não zerar nenhuma matéria</span><span class="' + (rec.zerouAlguma ? "no" : "yes") + '">' +
      (rec.zerouAlguma ? "ZEROU: " + zeradasText : "OK") + "</span></li>" +
      '<li><span>Questões em branco</span><span>' + (rec.blank || 0) + "</span></li>" +
      '<li><span>Tempo de prova</span><span>' + formatClock(rec.durationSec || 0) + "</span></li>" +
      "</ul>" +
      '<button class="btn primary block" id="sim-result-restart">Novo simulado</button>' +
      '<button class="btn ghost block" id="sim-result-close">Fechar resultado</button>' +
      "</div>" +
      '<div class="card"><h2>Desempenho por matéria</h2>' + simSubjectBreakdownHTML(rec) + "</div>" +
      '<div class="card"><h2>Gabarito</h2>' + simGabaritoHTML(rec) + "</div>";

    wrap.innerHTML = html;
    $("sim-result-restart").onclick = function () { lastSimResult = null; newSimulado(); };
    $("sim-result-close").onclick = function () { lastSimResult = null; renderSimulado(); };
  }

  function renderSimuladoHistory() {
    var wrap = $("simulado-history");
    if (!wrap) return;
    var list = state.simulados || [];
    wrap.innerHTML = "";
    if (!list.length) {
      wrap.innerHTML = '<div class="empty">Nenhum simulado finalizado ainda. Toque em "Novo simulado" para começar.</div>';
      return;
    }
    list.forEach(function (rec) {
      var d = new Date(rec.ts);
      var dateText = pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() + " " +
        pad(d.getHours()) + ":" + pad(d.getMinutes());
      var badge = rec.approved
        ? '<span class="sim-hist-badge ok">Aprovado</span>'
        : '<span class="sim-hist-badge err">Não passou</span>';
      var el = document.createElement("details");
      el.className = "sim-hist-item";
      var summary = document.createElement("summary");
      summary.innerHTML = '<div class="sim-hist-head"><div><strong>' + rec.points + "/" + rec.maxPoints + " pts</strong> - " +
        rec.pct + "% (" + rec.correct + " acertos, " + rec.wrong + " erros)</div>" + badge + "</div>" +
        '<div class="q-progress" style="margin-top:4px">' + dateText +
        (rec.zerouAlguma ? " - zerou " + rec.zeradas.length + " matéria(s)" : "") + "</div>";
      var body = document.createElement("div");
      body.className = "sim-hist-body";
      body.innerHTML = simSubjectBreakdownHTML(rec) + '<div class="sec-sub">Gabarito</div>' + simGabaritoHTML(rec);
      el.appendChild(summary);
      el.appendChild(body);
      wrap.appendChild(el);
    });
  }

  function clearSimuladoHistory() {
    if (!(state.simulados || []).length) return;
    if (!confirm("Apagar todo o histórico de simulados?")) return;
    state.simulados = [];
    saveState();
    renderSimuladoHistory();
    renderPerformance();
  }

  function renderPerformanceSimulados() {
    var wrap = $("perf-simulados");
    if (!wrap) return;
    var stats = simuladoStats();
    wrap.innerHTML = "";
    if (!stats.count) {
      wrap.innerHTML = '<div class="empty">Nenhum simulado realizado. Acesse a aba Simulado para começar.</div>';
      return;
    }
    var grid = document.createElement("div");
    grid.className = "sim-stat-grid";
    grid.innerHTML =
      '<div class="stat-card"><strong>' + stats.count + "</strong><span>simulados</span></div>" +
      '<div class="stat-card ok"><strong>' + stats.best.points + "/" + stats.best.maxPoints + "</strong><span>melhor nota (" + stats.best.pct + "%)</span></div>" +
      '<div class="stat-card"><strong>' + stats.last.points + "/" + stats.last.maxPoints + "</strong><span>\u00faltima nota (" + stats.last.pct + "%)</span></div>" +
      '<div class="stat-card"><strong>' + stats.averagePoints + "</strong><span>m\u00e9dia de pontos</span></div>" +
      '<div class="stat-card"><strong>' + stats.averagePct + "%</strong><span>m\u00e9dia de acertos</span></div>" +
      '<div class="stat-card ok"><strong>' + stats.approvalRate + "%</strong><span>aprova\u00e7\u00e3o (" + stats.approved + "/" + stats.count + ")</span></div>";
    wrap.appendChild(grid);

    var evo = document.createElement("div");
    evo.className = "evo-block";
    evo.innerHTML = "<h3 class=\"sec-sub\">Evolu\u00e7\u00e3o da nota</h3>" +
      miniBarsHTML(stats.series.map(function (s) { return { value: s.points, ts: s.ts, max: s.maxPoints, approved: s.approved }; }),
        function (p) { return p.approved ? "var(--ok)" : (p.value >= SIMULADO_PASS_POINTS ? "var(--warn)" : "var(--err)"); },
        function (p) {
          var d = new Date(p.ts);
          return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + ": " + p.value + "/" + p.max + " pts";
        });
    wrap.appendChild(evo);

    var list = (state.simulados || []).slice().reverse().slice(0, 5);
    list.forEach(function (rec) {
      var d = new Date(rec.ts);
      var pct = rec.maxPoints ? Math.round((rec.points / rec.maxPoints) * 100) : 0;
      var row = document.createElement("div");
      row.className = "perf-subject";
      row.innerHTML = '<div class="ps-head"><span>' + pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + " - " +
        (rec.approved ? "aprovado" : "n\u00e3o passou") + (rec.zerouAlguma ? " - zerou mat\u00e9ria" : "") +
        "</span><span>" + rec.points + "/" + rec.maxPoints + " pts - " + rec.pct + "%</span></div>" +
        '<div class="bar"><div class="bar-fill" style="width:' + pct + "%;background:" +
        (rec.approved ? "var(--ok)" : "var(--err)") + '"></div></div>';
      wrap.appendChild(row);
    });
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
    $("simulado-new").onclick = newSimulado;
    $("sim-prev").onclick = function () { moveSimQuestion(-1); };
    $("sim-next").onclick = function () { moveSimQuestion(1); };
    $("sim-finish").onclick = finishSimulado;
    $("sim-abandon").onclick = abandonSimulado;
    $("simulado-clear-history").onclick = clearSimuladoHistory;
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

  window.__DMAE_COVERAGE__ = {
    engine: coverageEngine,
    daysUntilExam: daysUntilExam,
    estimatedTopicMinutes: estimatedTopicMinutes,
    priorityScore: priorityScore,
    rankedTopics: rankedTopics,
    buildPlan: buildPlan,
    itemStatus: itemStatus,
    studyPhase: studyPhase,
    coverageStatus: coverageStatus,
    formatMinutes: formatMinutes,
    formatSignedMinutes: formatSignedMinutes
  };

  window.__DMAE_ANALYTICS__ = {
    overview: performanceOverview,
    subjects: subjectPerformance,
    worstTopics: worstTopics,
    unstudiedTopics: unstudiedTopics,
    priorityBreakdown: priorityBreakdown,
    priorityTopics: priorityTopics,
    simuladoStats: simuladoStats,
    timeEvolution: timeEvolution,
    answerEvolution: answerEvolution,
    hasEnoughEvolution: hasEnoughEvolution,
    totalStudiedTopics: totalStudiedTopics
  };

  document.addEventListener("DOMContentLoaded", init);
})();
