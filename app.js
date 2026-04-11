const defaultData = {
  meta: {
    title: "",
    subtitle: "",
    date: "",
    logoUrl: "",
    heroUrl: "",
    announcement: ""
  },
  settings: {
    points: { gold: 3, silver: 2, bronze: 1 }
  },
  events: [],
  records: []
};

const state = {
  data: null,
  schedule: null,
  scores: null,
  classConfig: null,
  selectedClass: "",
  selectedGroupKey: "",
  scheduleView: null,
  scheduleToday: false,
  view: "within",
  gradeFilter: null,
  sortMode: "points",
  admin: false,
  theme: "dark"
};

const elements = {
  heroMedia: document.getElementById("heroMedia"),
  heroPrint: document.getElementById("heroPrint"),
  heroTitle: document.getElementById("heroTitle"),
  heroDate: document.getElementById("heroDate"),
  heroMeta: document.getElementById("heroMeta"),
  classPicker: document.getElementById("classPicker"),
  classSelect: document.getElementById("classSelect"),
  schoolLogo: document.getElementById("schoolLogo"),
  tableBody: document.getElementById("tableBody"),
  viewNote: document.getElementById("viewNote"),
  gradeFilter: document.getElementById("gradeFilter"),
  gradeSelect: document.getElementById("gradeSelect"),
  detailModal: document.getElementById("detailModal"),
  detailTitle: document.getElementById("detailTitle"),
  detailSubtitle: document.getElementById("detailSubtitle"),
  detailBody: document.getElementById("detailBody"),
  closeDetail: document.getElementById("closeDetail"),
  lastUpdated: document.getElementById("lastUpdated"),
  currentTime: document.getElementById("currentTime"),
  viewToggle: document.getElementById("viewToggle"),
  sortToggle: document.getElementById("sortToggle"),
  switchTheme: document.getElementById("switchTheme"),
  exportPoster: document.getElementById("exportPoster"),
  adminPanel: document.getElementById("adminPanel"),
  closeAdmin: document.getElementById("closeAdmin"),
  inputTitle: document.getElementById("inputTitle"),
  inputDate: document.getElementById("inputDate"),
  inputLogo: document.getElementById("inputLogo"),
  inputHero: document.getElementById("inputHero"),
  inputAnnouncement: document.getElementById("inputAnnouncement"),
  announcementSection: document.getElementById("announcementSection"),
  announcementContent: document.getElementById("announcementContent"),
  recordEditor: document.getElementById("recordEditor"),
  addRow: document.getElementById("addRow"),
  clearRows: document.getElementById("clearRows"),
  csvInput: document.getElementById("csvInput"),
  csvStatus: document.getElementById("csvStatus"),
  exportJson: document.getElementById("exportJson"),
  exportCsv: document.getElementById("exportCsv"),
  exportGuide: document.getElementById("exportGuide"),
  exportTip: document.getElementById("exportTip"),
  scoresEditor: document.getElementById("scoresEditor"),
  exportScores: document.getElementById("exportScores"),
  scoresTip: document.getElementById("scoresTip"),
  scheduleSection: document.getElementById("scheduleSection"),
  scheduleTabs: document.getElementById("scheduleTabs"),
  scheduleBody: document.getElementById("scheduleBody"),
  scheduleMeta: document.getElementById("scheduleMeta"),
  scheduleNote: document.getElementById("scheduleNote"),
  scoresSportFilter: document.getElementById("scoresSportFilter"),
toggleRecords: document.getElementById("toggleRecords"),
  todayToggle: document.getElementById("todayToggle")
};

const showToast = (message, duration = 3000, type = "default") => {
  const toast = document.createElement("div");
  toast.className = `toast${type === "error" ? " error" : ""}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
};

const handleError = (context, error) => {
  console.error(`[${context}]`, error);
  showToast(`操作失败：${error.message || "未知错误"}`, 4000, "error");
};

const updateState = (updates, shouldRender = true, shouldPersist = true) => {
  Object.assign(state, updates);
  if (shouldRender) render();
  if (shouldPersist) persistUiState();
};

const dataUrlFromQuery = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("data");
};

const isAdminMode = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("admin") === "1" || window.location.pathname.endsWith("/admin");
};

const getListQuery = (key) => {
  const params = new URLSearchParams(window.location.search);
  const value = params.get(key);
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
};

const normalizeClassKey = (value) => {
  const text = String(value || "")
    .replace(/\s+/g, "")
    .replace(/班/g, "")
    .replace(/年级/g, "")
    .replace(/[()（）]/g, "")
    .replace(/^七/, "初一")
    .replace(/^八/, "初二")
    .replace(/^九/, "初三")
    .replace(/^高1/i, "高一")
    .replace(/^高2/i, "高二")
    .replace(/^高3/i, "高三")
    .replace(/^初1/i, "初一")
    .replace(/^初2/i, "初二")
    .replace(/^初3/i, "初三")
    .replace(/中预科?/g, "中预")
    .toUpperCase();
  return text;
};

const normalizeClassCandidate = (value) =>
  normalizeClassKey(value)
    .replace(/\*\d+/g, "")
    .replace(/组\d+/g, "")
    .replace(/[男女]\d*/g, "")
    .trim();

const containsAsUnit = (item, target) => {
  if (!/\d/.test(target)) {
    return item.includes(target);
  }
  const idx = item.indexOf(target);
  if (idx === -1) return false;
  if (idx > 0 && /\d/.test(item[idx - 1])) return false;
  const nextIdx = idx + target.length;
  if (nextIdx < item.length && /\d/.test(item[nextIdx])) return false;
  return true;
};

const sumDetailedMedals = (records) =>
  records.reduce(
    (acc, record) => {
      acc.first += Number(record.first ?? record.gold) || 0;
      acc.second += Number(record.second ?? record.silver) || 0;
      acc.third += Number(record.third ?? record.bronze) || 0;
      acc.fourth += Number(record.fourth) || 0;
      acc.fifth += Number(record.fifth) || 0;
      acc.sixth += Number(record.sixth) || 0;
      return acc;
    },
    { first: 0, second: 0, third: 0, fourth: 0, fifth: 0, sixth: 0 }
  );

const sumMedals = (records) =>
  records.reduce(
    (acc, record) => {
      acc.gold += Number(record.gold ?? record.first) || 0;
      acc.silver += Number(record.silver ?? record.second) || 0;
      acc.bronze += Number(record.bronze ?? record.third) || 0;
      return acc;
    },
    { gold: 0, silver: 0, bronze: 0 }
  );

const calcPoints = (medals, pointsRule) =>
  medals.gold * pointsRule.gold + medals.silver * pointsRule.silver + medals.bronze * pointsRule.bronze;

const formatPanguText = (value) => {
  const text = String(value ?? "");
  return text
    .replace(/([\u3400-\u9fff])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([A-Za-z0-9])([\u3400-\u9fff])/g, "$1 $2");
};

const normalizeGradeText = (grade) => String(grade || "").replace(/年级$/g, "").trim();

const inferGradeFromClassName = (className) => {
  const text = String(className || "").trim();
  const prepMatch = text.match(/中预\s*([0-9]{1,2})?/i);
  if (prepMatch) return "中预";
  const juniorCnMatch = text.match(/初([一二三])/);
  if (juniorCnMatch) return `初${juniorCnMatch[1]}`;
  const juniorNumMatch = text.match(/初\s*([1-3])/i);
  if (juniorNumMatch) {
    const map = { "1": "一", "2": "二", "3": "三" };
    return `初${map[juniorNumMatch[1]]}`;
  }
  const gradeNumMatch = text.match(/([七八九])年级/);
  if (gradeNumMatch) {
    const map = { "七": "初一", "八": "初二", "九": "初三" };
    return map[gradeNumMatch[1]];
  }
  const cnMatch = text.match(/高([一二三四五六七八九十])/);
  if (cnMatch) return `高${cnMatch[1]}`;
  const numMatch = text.match(/高\s*([1-3])/i);
  if (numMatch) {
    const map = { "1": "一", "2": "二", "3": "三" };
    return `高${map[numMatch[1]]}`;
  }
  return "";
};

const formatClassText = (className) => {
  const text = String(className || "").trim();
  const plainNumber = text.match(/^(\d{1,2})$/);
  if (plainNumber) return `${plainNumber[1]} 班`;
  const gradeClass = text.match(/^(中预|初[一二三]|高[一二三])\s*([0-9]{1,2})$/);
  if (gradeClass) return `${gradeClass[1]} ${gradeClass[2]} 班`;
  const highClass = text.match(/^高([一二三四五六七八九十])\s*([0-9]{1,2})$/);
  if (highClass) return `高${highClass[1]} ${highClass[2]} 班`;
  const withClass = text.match(/^(\d{1,2})\s*班$/);
  if (withClass) return `${withClass[1]} 班`;
  return text;
};

const formatLeaderboardName = (rawName, view) => {
  if (view === "within") return formatPanguText(formatClassText(rawName));
  const text = String(rawName || "");
  const firstSpace = text.indexOf(" ");
  if (firstSpace === -1) return formatPanguText(text);
  const grade = normalizeGradeText(text.slice(0, firstSpace));
  let className = text.slice(firstSpace + 1).trim();
  if (className.startsWith(grade)) {
    className = className.slice(grade.length).trim() || className;
  }
  return formatPanguText(`${grade} ${formatClassText(className)}`);
};

const normalizeRecordIdentity = (record) => {
  const className = formatClassText(record.className);
  const inferredGrade = inferGradeFromClassName(className);
  return {
    ...record,
    grade: inferredGrade || normalizeGradeText(record.grade),
    className
  };
};

const normalizeStageName = (name) => {
  if (!name) return "未命名";
  return String(name) === "0" ? "一" : String(name);
};

const splitUGroupCodes = (rawCode) => {
  const text = String(rawCode || "").trim();
  if (!text) return [];
  // 处理混合长度：SSDD格式，如"8910"→["8","9","10"]
  if (text.length === 4) {
    const m = text.match(/^(\d)(\d)(\d\d)$/);
    if (m) return [m[1], m[2], m[3]];
  }
  // 处理混合长度：SDDD格式，如"91011"→["9","10","11"]
  if (text.length === 5) {
    const m = text.match(/^(\d)(\d\d)(\d\d)$/);
    if (m) return [m[1], m[2], m[3]];
  }
  if (text.length >= 4 && text.length % 2 === 0) {
    return text.match(/.{2}/g) || [text];
  }
  return text.split("");
};


const formatUPlaceholder = (code) => {
  if (!code) return "";
  return String(code)
    .replace(/(\d+)U([123])/g, (_, groupRaw, rankRaw) => {
      const groupCodes = splitUGroupCodes(groupRaw);
      const rank = Number(rankRaw);
      if (!groupCodes.length || !Number.isFinite(rank)) return `${groupRaw}U${rankRaw}`;
      return `${groupCodes.join("/")} 循环赛第 ${rank} 名`;
    })
    .replace(/(\d+)U(?!\d)/g, (_, groupRaw) => {
      const groupCodes = splitUGroupCodes(groupRaw);
      if (!groupCodes.length) return `${groupRaw}U`;
      return `${groupCodes.join("/")} 循环赛前两名`;
    });
};

const formatTeamLabel = (value) => {
  const withPlaceholder = formatUPlaceholder(String(value || ""));
  return formatPanguText(withPlaceholder);
};

const formatMatchCodeLabel = (code) => {
  if (!code) return "";
  return formatPanguText(String(code));
};

const parseScoreInputValue = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : null;
};

const toScoreNumber = (value) => {
  if (value === null || value === undefined) return NaN;
  if (typeof value === "string" && !value.trim()) return NaN;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : NaN;
};

const handbookPoints = {
  individual: { first: 7, second: 5, third: 4, fourth: 3, fifth: 2, sixth: 1 },
  team: { first: 12, second: 9, third: 7, fourth: 5, fifth: 4, sixth: 3 }
};

const isTeamEventByName = (name = "") => /^(?!.*技巧赛)(?:足球|篮球)|排球|乒乓|拔河|十人十一足|团体|对抗/i.test(String(name));

const toNumberOrZero = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const getRecordPointsByHandbook = (record, event) => {
  if (Number.isFinite(Number(record.points))) return Number(record.points);
  const group = isTeamEventByName(event?.name) || isTeamEventByName(event?.category)
    ? handbookPoints.team
    : handbookPoints.individual;
  const first = toNumberOrZero(record.first ?? record.gold);
  const second = toNumberOrZero(record.second ?? record.silver);
  const third = toNumberOrZero(record.third ?? record.bronze);
  const fourth = toNumberOrZero(record.fourth ?? record.rank4);
  const fifth = toNumberOrZero(record.fifth ?? record.rank5);
  const sixth = toNumberOrZero(record.sixth ?? record.rank6);
  return first * group.first
    + second * group.second
    + third * group.third
    + fourth * group.fourth
    + fifth * group.fifth
    + sixth * group.sixth;
};

const readMatchNote = (score = {}) => {
  if (!score) return "";
  if (score.note) return String(score.note).trim().replace(/：/g, ":");
  if (score.rescheduledAt) return `改期至 ${String(score.rescheduledAt).trim()}`;
  return "";
};

const getPenaltyWinnerIndex = (score, teamA, teamB) => {
  const text = String(readMatchNote(score));
  if (!text) return null;
  const shootout = text.match(/点球[^\d]*(\d+)\s*[:：-]\s*(\d+)/);
  if (shootout) {
    const a = Number(shootout[1]);
    const b = Number(shootout[2]);
    if (a > b) return 0;
    if (b > a) return 1;
  }
  if (/点球\s*[AaＡａ]\s*胜/.test(text)) return 0;
  if (/点球\s*[BbＢｂ]\s*胜/.test(text)) return 1;
  if (teamA && text.includes(teamA) && /点球.*胜/.test(text)) return 0;
  if (teamB && text.includes(teamB) && /点球.*胜/.test(text)) return 1;
  return null;
};

const getManualWinnerIndex = (score, teamA, teamB) => {
  const direct = String(score?.winner || "").trim().toUpperCase();
  if (direct === "A") return 0;
  if (direct === "B") return 1;
  const note = String(readMatchNote(score));
  if (/左侧\s*胜|左边\s*胜|左方\s*胜|A侧\s*胜/i.test(note)) return 0;
  if (/右侧\s*胜|右边\s*胜|右方\s*胜|B侧\s*胜/i.test(note)) return 1;
  const byNote = note.match(/winner\s*[:：]\s*([AB])/i);
  if (byNote) return byNote[1].toUpperCase() === "A" ? 0 : 1;
  if (teamA && note.includes(teamA) && /胜/.test(note)) return 0;
  if (teamB && note.includes(teamB) && /胜/.test(note)) return 1;
  return null;
};

const getWinnerIndex = (score, teamA, teamB) => {
  const scoreA = toScoreNumber(score?.scoreA);
  const scoreB = toScoreNumber(score?.scoreB);
  if (Number.isFinite(scoreA) && Number.isFinite(scoreB)) {
    if (scoreA > scoreB) return 0;
    if (scoreB > scoreA) return 1;
    return getPenaltyWinnerIndex(score, teamA, teamB) ?? getManualWinnerIndex(score, teamA, teamB);
  }
  return getManualWinnerIndex(score, teamA, teamB);
};

const sanitizeTeamLabelForDisplay = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  const compact = text.replace(/\s+/g, " ").trim();
  const groupByStar = compact.match(/^(.*?)[*＊](\d+)$/);
  const groupByWord = compact.match(/^(.*?)\s*组\s*(\d+)$/);
  const groupMatch = groupByStar || groupByWord;
  if (!groupMatch) return compact;

  const baseText = String(groupMatch[1] || "").trim();
  const groupNo = String(groupMatch[2] || "").trim();
  if (!baseText || !groupNo) return compact;

  const classLike = baseText.replace(/\s+/g, "").replace(/班/g, "");
  return `${classLike}组${groupNo}`;
};

const extractUPlaceholderTokens = (text) => String(text || "").match(/\d+U\d?/g) || [];

const parseUPlaceholderToken = (token) => {
  const match = String(token || "").match(/^(\d+)U(\d?)$/);
  if (!match) return null;
  return {
    token: match[0],
    groupRaw: match[1],
    rank: match[2] ? Number(match[2]) : 0
  };
};

const getMatchByNo = (matchesMap, rawNo) => {
  const key = String(rawNo || "").trim();
  if (matchesMap.has(key)) return matchesMap.get(key);
  const normalized = String(Number(key));
  if (normalized !== "NaN" && matchesMap.has(normalized)) return matchesMap.get(normalized);
  return null;
};

const getMatchScopeKey = (sportId, stageName) => {
  const id = String(sportId || "");
  if (!id.includes("tug-of-war") && !id.includes("tug-war")) return "";
  const stage = normalizeStageName(stageName);
  return stage ? `stage:${stage}` : "";
};

const isByeTeamName = (name) => /^(BYE|轮空)$/i.test(String(name || "").trim());

const resolveResultToken = (token, resultMap, scopeKey = "") => {
  const key = String(token || "").trim();
  if (!key) return "";
  if (scopeKey) {
    const scopedValue = resultMap?.[`${scopeKey}:${key}`];
    if (scopedValue) return scopedValue;
  }
  return resultMap?.[key] || "";
};

const isUnresolvedPlaceholderName = (name) => {
  const text = String(name || "").trim();
  if (!text) return true;
  if (/待定/.test(text)) return true;
  if (/\d+[WL]/.test(text)) return true;
  if (/\d+U\d?/.test(text)) return true;
  if (/循环赛第\s*\d+\s*名|循环赛前两名/.test(text)) return true;
  return false;
};

const buildRoundRobinRanking = (sport, groupCodes, matchesByNo, resultMap) => {
  const groupMatches = groupCodes
    .map((groupCode) => getMatchByNo(matchesByNo, groupCode))
    .filter(Boolean);
  if (groupMatches.length !== groupCodes.length) return [];
  if (groupMatches.some((match) => getMatchScore(match.id)?.status !== "final")) return [];

  const stats = new Map();
  const ensure = (name) => {
    if (isUnresolvedPlaceholderName(name)) return;
    if (!stats.has(name)) {
      stats.set(name, { name, wins: 0, diff: 0, scored: 0 });
    }
  };

  groupMatches.forEach((match) => {
    const score = getMatchScore(match.id);
    if (!score || score.status !== "final") return;

    const participants = getMatchParticipants(match);
    const teamA = resolveTeamToken(participants[0], sport.teamMap, resultMap, { scopeKey: match.__scopeKey });
    const teamB = resolveTeamToken(participants[1], sport.teamMap, resultMap, { scopeKey: match.__scopeKey });
    if (isUnresolvedPlaceholderName(teamA) || isUnresolvedPlaceholderName(teamB)) return;
    ensure(teamA);
    ensure(teamB);
    if (!stats.has(teamA) || !stats.has(teamB)) return;

    const winner = getWinnerIndex(score, teamA, teamB);
    if (winner === 0) stats.get(teamA).wins += 1;
    if (winner === 1) stats.get(teamB).wins += 1;

    const scoreA = toScoreNumber(score.scoreA);
    const scoreB = toScoreNumber(score.scoreB);
    if (Number.isFinite(scoreA) && Number.isFinite(scoreB)) {
      stats.get(teamA).scored += scoreA;
      stats.get(teamB).scored += scoreB;
      stats.get(teamA).diff += scoreA - scoreB;
      stats.get(teamB).diff += scoreB - scoreA;
    }
  });

  return [...stats.values()].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.diff !== a.diff) return b.diff - a.diff;
    if (b.scored !== a.scored) return b.scored - a.scored;
    return a.name.localeCompare(b.name, "zh-CN", { numeric: true });
  });
};

const resolveTeamToken = (token, teamMap, resultMap, options = {}) => {
  const scopeKey = options.scopeKey || "";
  const code = String(token || "").trim();
  if (!code) return "待定";
  if (isByeTeamName(code) || /轮空/.test(code)) return "轮空";
  if (/^[A-Z]$/.test(code) && !teamMap?.[code]) return "待定";
  if (teamMap?.[code]) return teamMap[code];
  const directResolved = resolveResultToken(code, resultMap, scopeKey);
  if (directResolved) return directResolved;
  const withWinLose = code.replace(/\d+[WL]/g, (part) => resolveResultToken(part, resultMap, scopeKey) || part);
  const withU = formatUPlaceholder(withWinLose);
  if (withU !== code) return withU;
  if (/U/.test(code)) return withU;
  return code;
};

const parseParticipantsFromCode = (code) => {
  const text = String(code || "").trim();
  if (!text || !text.includes("/")) return [];
  const payload = text.slice(text.indexOf("/") + 1).trim();
  if (!payload) return [];
  const payloadNoSpace = payload.replace(/\s+/g, "");
  const trailingBye = payloadNoSpace.match(/^([A-Z0-9]+)轮空$/i);
  if (trailingBye) return [trailingBye[1], "BYE"];
  const leadingBye = payloadNoSpace.match(/^轮空([A-Z0-9]+)$/i);
  if (leadingBye) return [leadingBye[1], "BYE"];

  const splitByStar = payload.split("*").map((part) => part.trim()).filter(Boolean);
  if (splitByStar.length >= 2) return [splitByStar[0], splitByStar[1]];

  const tokens = payload.match(/\d+U\d?|\d+[WL]|[A-Z]+/g) || [];
  if (tokens.length >= 2) {
    if (tokens[0].length > 1 && /^[A-Z]+$/.test(tokens[0])) {
      return [tokens[0].slice(0, 1), tokens[0].slice(1)]
        .filter(Boolean)
        .concat(tokens.slice(1))
        .slice(0, 2);
    }
    return [tokens[0], tokens[1]];
  }

  if (tokens.length === 1) {
    const compactCompound = tokens[0].match(/^(\d+[WL])(\d+U\d?)$/);
    if (compactCompound) return [compactCompound[1], compactCompound[2]];
  }

  if (/^[A-Z]{2}$/.test(payload)) return [payload.slice(0, 1), payload.slice(1)];
  return [payload];
};

const getMatchParticipants = (match) => {
  const parsed = parseParticipantsFromCode(match.code);
  const rawNameA = String(match.teams?.[0]?.name || "").trim();
  const rawNameB = String(match.teams?.[1]?.name || "").trim();
  const rawCodeA = String(match.teams?.[0]?.code || "").trim();
  const rawCodeB = String(match.teams?.[1]?.code || "").trim();

  let rawA = rawNameA || rawCodeA || "";
  let rawB = rawNameB || rawCodeB || "";

  if (parsed.length >= 2) {
    const codeACompound = /[WLU*]/.test(rawCodeA) && parsed[0] && parsed[0] !== rawCodeA;
    const codeBCompound = /[WLU*]/.test(rawCodeB) && parsed[1] && parsed[1] !== rawCodeB;
    if (!rawA || (!rawNameA && codeACompound)) rawA = parsed[0];
    if (!rawB || (!rawNameB && codeBCompound)) rawB = parsed[1];
  }

  return [rawA, rawB];
};

const isChallengeSport = (sportId, sportName = "") => {
  const id = String(sportId || "").toLowerCase();
  const name = String(sportName || "");
  return id.includes("table-tennis") || id.includes("skill") || /挑战|技巧/.test(name);
};

const buildResultMap = (sport) => {
  const resultMap = {};
  const matches = (sport.stages || [])
    .flatMap((stage) => {
      const scopeKey = getMatchScopeKey(sport.id, stage.name);
      return (stage.matches || []).map((match) => ({
        ...match,
        __scopeKey: scopeKey
      }));
    })
    .filter((match) => Number.isFinite(Number(match.matchNo)))
    .sort((a, b) => Number(a.matchNo) - Number(b.matchNo));
  if (!matches.length) return resultMap;

  const matchesByNo = new Map(matches.map((match) => [String(match.matchNo), match]));

  const uTokens = new Set();
  matches.forEach((match) => {
    const participants = getMatchParticipants(match);
    participants.forEach((participant) => {
      extractUPlaceholderTokens(participant).forEach((token) => uTokens.add(token));
    });
    extractUPlaceholderTokens(match.code).forEach((token) => uTokens.add(token));
  });

  let changed = true;
  let guard = 0;
  while (changed && guard < 10) {
    changed = false;
    guard += 1;

    matches.forEach((match) => {
      const matchNo = String(match.matchNo || "").trim();
      if (!matchNo) return;
      const scopeKey = match.__scopeKey || "";
      const participants = getMatchParticipants(match);
      const teamA = resolveTeamToken(participants[0], sport.teamMap, resultMap, { scopeKey });
      const teamB = resolveTeamToken(participants[1], sport.teamMap, resultMap, { scopeKey });
      const teamABye = isByeTeamName(teamA);
      const teamBBye = isByeTeamName(teamB);
      if (teamABye !== teamBBye && !isUnresolvedPlaceholderName(teamA) && !isUnresolvedPlaceholderName(teamB)) {
        const winner = teamABye ? 1 : 0;
        const winToken = `${matchNo}W`;
        const loseToken = `${matchNo}L`;
        if (winner === 0) {
          if (scopeKey) {
            const scopedWin = `${scopeKey}:${winToken}`;
            const scopedLose = `${scopeKey}:${loseToken}`;
            if (resultMap[scopedWin] !== teamA) {
              resultMap[scopedWin] = teamA;
              changed = true;
            }
            if (resultMap[scopedLose] !== teamB) {
              resultMap[scopedLose] = teamB;
              changed = true;
            }
          } else {
            if (resultMap[winToken] !== teamA) {
              resultMap[winToken] = teamA;
              changed = true;
            }
            if (resultMap[loseToken] !== teamB) {
              resultMap[loseToken] = teamB;
              changed = true;
            }
          }
        } else if (winner === 1) {
          if (scopeKey) {
            const scopedWin = `${scopeKey}:${winToken}`;
            const scopedLose = `${scopeKey}:${loseToken}`;
            if (resultMap[scopedWin] !== teamB) {
              resultMap[scopedWin] = teamB;
              changed = true;
            }
            if (resultMap[scopedLose] !== teamA) {
              resultMap[scopedLose] = teamA;
              changed = true;
            }
          } else {
            if (resultMap[winToken] !== teamB) {
              resultMap[winToken] = teamB;
              changed = true;
            }
            if (resultMap[loseToken] !== teamA) {
              resultMap[loseToken] = teamA;
              changed = true;
            }
          }
        }
        return;
      }

      const score = getMatchScore(match.id);
      if (!score || score.status !== "final") return;
      if (isUnresolvedPlaceholderName(teamA) || isUnresolvedPlaceholderName(teamB)) return;

      const winner = getWinnerIndex(score, teamA, teamB);
      const winToken = `${matchNo}W`;
      const loseToken = `${matchNo}L`;
      if (winner === 0) {
        if (scopeKey) {
          const scopedWin = `${scopeKey}:${winToken}`;
          const scopedLose = `${scopeKey}:${loseToken}`;
          if (resultMap[scopedWin] !== teamA) {
            resultMap[scopedWin] = teamA;
            changed = true;
          }
          if (resultMap[scopedLose] !== teamB) {
            resultMap[scopedLose] = teamB;
            changed = true;
          }
        } else {
          if (resultMap[winToken] !== teamA) {
            resultMap[winToken] = teamA;
            changed = true;
          }
          if (resultMap[loseToken] !== teamB) {
            resultMap[loseToken] = teamB;
            changed = true;
          }
        }
      } else if (winner === 1) {
        if (scopeKey) {
          const scopedWin = `${scopeKey}:${winToken}`;
          const scopedLose = `${scopeKey}:${loseToken}`;
          if (resultMap[scopedWin] !== teamB) {
            resultMap[scopedWin] = teamB;
            changed = true;
          }
          if (resultMap[scopedLose] !== teamA) {
            resultMap[scopedLose] = teamA;
            changed = true;
          }
        } else {
          if (resultMap[winToken] !== teamB) {
            resultMap[winToken] = teamB;
            changed = true;
          }
          if (resultMap[loseToken] !== teamA) {
            resultMap[loseToken] = teamA;
            changed = true;
          }
        }
      }
    });

    uTokens.forEach((token) => {
      const parsed = parseUPlaceholderToken(token);
      if (!parsed) return;
      const groupCodes = splitUGroupCodes(parsed.groupRaw);
      if (!groupCodes.length) return;
      const ranking = buildRoundRobinRanking(sport, groupCodes, matchesByNo, resultMap);
      if (!ranking.length) return;

      let value = "";
      if (parsed.rank > 0) {
        value = ranking[parsed.rank - 1]?.name || "";
      } else {
        value = ranking.slice(0, 2).map((item) => item.name).join("/");
      }
      if (value && resultMap[token] !== value) {
        resultMap[token] = value;
        changed = true;
      }
    });
  }

  return resultMap;
};

const scheduleSortRank = (sport) => {
  const id = sport?.id || "";
  const name = sport?.name || "";
  if (id.includes("skill") || name.includes("技巧")) return 80;
  if (id.includes("football")) return 10;
  if (id.includes("basketball")) return 20;
  if (id.includes("volleyball")) return 30;
  if (id.includes("tug-of-war") || id.includes("tug-war")) return 40;
  if (id.includes("table-tennis")) return 50;
  if (id.startsWith("badminton")) return 60;
  if (id.includes("tennis")) return 70;
  return 99;
};

const getSportTabLabel = (sport) => {
  const key = getSportTabKey(sport);
  const labels = {
    football: "足球",
    footballSkill: "足技巧",
    basketballMale: "男篮",
    basketballFemale: "女篮",
    basketballSkill: "篮技巧",
    volleyball: "排球",
    tug: "拔河",
    tableTennis: "乒乓",
    badmintonMixed: "羽混双",
    badmintonMale: "羽男单",
    badmintonFemale: "羽女单",
    tennisMale: "网男单",
    tennisFemale: "网女单"
  };
  return labels[key] || String(sport?.name || "").replace(/^[A-Z0-9]+\s*[·.]\s*/g, "");
};

const getSportTabKey = (sport) => {
  const id = String(sport?.id || "");
  const name = String(sport?.name || "");

  if (id.includes("football") && id.includes("skill")) return "footballSkill";
  if (id.includes("football")) return "football";

  if (id.includes("basketball") && (id.includes("skill") || id.includes("shooting") || name.includes("技巧") || name.includes("投篮"))) {
    return "basketballSkill";
  }
  if ((id.includes("basketball-3v3") || name.includes("3v3") || name.includes("篮球")) && (id.includes("female") || name.includes("女"))) {
    return "basketballFemale";
  }
  if ((id.includes("basketball-3v3") || name.includes("3v3") || name.includes("篮球")) && (id.includes("male") || name.includes("男"))) {
    return "basketballMale";
  }
  if (id.includes("basketball-female")) return "basketballFemale";
  if (id.includes("basketball-male")) return "basketballMale";

  if (id.includes("volleyball")) return "volleyball";
  if (id.includes("tug")) return "tug";
  if (id.includes("table-tennis")) return "tableTennis";

  if (id.includes("badminton") && (id.includes("mixed") || name.includes("混双"))) return "badmintonMixed";
  if (id.includes("badminton") && (id.includes("female") || name.includes("女"))) return "badmintonFemale";
  if (id.includes("badminton") && (id.includes("male") || name.includes("男"))) return "badmintonMale";

  if (id.includes("tennis") && (id.includes("female") || name.includes("女"))) return "tennisFemale";
  if (id.includes("tennis") && (id.includes("male") || name.includes("男"))) return "tennisMale";

  return id;
};

const getScheduleTabs = () => {
  const tabs = [];
  const seen = new Set();
  getSortedSports().forEach((sport) => {
    const key = getSportTabKey(sport);
    if (seen.has(key)) return;
    seen.add(key);
    tabs.push({ key, label: getSportTabLabel(sport) });
  });
  return tabs;
};

const getSortedSports = () => {
  const sports = state.schedule?.sports || [];
  return [...sports].sort((a, b) => {
    const rankDiff = scheduleSortRank(a) - scheduleSortRank(b);
    if (rankDiff) return rankDiff;
    return String(a.name || "").localeCompare(String(b.name || ""), "zh-CN");
  });
};

const getSelectedClassMeta = () => {
  const classes = state.classConfig?.classes || [];
  const key = normalizeClassKey(state.selectedClass);
  return classes.find((item) => normalizeClassKey(item.key) === key) || null;
};

const getGradeBySelectedClass = () => {
  const key = normalizeClassKey(state.selectedClass);
  if (!key) return "";
  if (key.startsWith("中预")) return "中预";
  if (key.startsWith("初一")) return "初一";
  if (key.startsWith("初二")) return "初二";
  if (key.startsWith("初三")) return "初三";
  if (key.startsWith("高一")) return "高一";
  if (key.startsWith("高二")) return "高二";
  if (key.startsWith("高三")) return "高三";
  return "";
};

const persistSelectedClass = (value) => {
  if (!value) return;
  localStorage.setItem("medalboard_selected_class", value);
};

const persistUiState = () => {
  try {
    localStorage.setItem("medalboard_view", state.view || "");
    localStorage.setItem("medalboard_sort_mode", state.sortMode || "");
    localStorage.setItem("medalboard_schedule_view", state.scheduleView || "");
    localStorage.setItem("medalboard_schedule_today", state.scheduleToday ? "1" : "");
  } catch (e) { /* ignore */ }
};

const restoreUiState = () => {
  try {
    const savedView = localStorage.getItem("medalboard_view");
    if (savedView === "within" || savedView === "classes") {
      state.view = savedView;
    }
    const savedSortMode = localStorage.getItem("medalboard_sort_mode");
    if (savedSortMode === "points" || savedSortMode === "total" || savedSortMode === "medals") {
      state.sortMode = savedSortMode;
    }
    const savedScheduleView = localStorage.getItem("medalboard_schedule_view");
    if (savedScheduleView) {
      state.scheduleView = savedScheduleView;
    }
    const savedToday = localStorage.getItem("medalboard_schedule_today");
    if (savedToday === "1") {
      state.scheduleToday = true;
    }
  } catch (e) { /* ignore */ }
};

const mergeScheduleList = (list) => {
  const merged = {
    meta: { title: "赛程", startDate: "", dayMap: {}, timeSlots: { default: {} }, updatedAt: "" },
    sports: []
  };
  const sportsMap = new Map();
  list.forEach((item) => {
    const meta = item?.meta || {};
    merged.meta.dayMap = { ...merged.meta.dayMap, ...(meta.dayMap || {}) };
    merged.meta.timeSlots = { ...merged.meta.timeSlots, ...(meta.timeSlots || {}) };
    if (meta.updatedAt) merged.meta.updatedAt = meta.updatedAt;
    (item?.sports || []).forEach((sport) => {
      const existing = sportsMap.get(sport.id);
      if (!existing) {
        const clone = {
          ...sport,
          teamMap: { ...(sport.teamMap || {}) },
          stages: [...(sport.stages || [])]
        };
        sportsMap.set(sport.id, clone);
      } else {
        existing.teamMap = { ...existing.teamMap, ...(sport.teamMap || {}) };
        existing.stages = existing.stages.concat(sport.stages || []);
      }
    });
  });
  merged.sports = [...sportsMap.values()];
  if (!Object.keys(merged.meta.timeSlots || {}).length) {
    merged.meta.timeSlots = { default: {} };
  }
  return merged;
};

const mergeScoresList = (list) => {
  const merged = { meta: { updatedAt: "" }, matches: {}, tableTennis: {} };
  list.forEach((item) => {
    if (item?.meta?.updatedAt) merged.meta.updatedAt = item.meta.updatedAt;
    merged.matches = { ...merged.matches, ...(item?.matches || {}) };
    merged.tableTennis = { ...merged.tableTennis, ...(item?.tableTennis || {}) };
  });
  return merged;
};

const loadJsonList = async (urls) => {
  const tasks = urls.map(async (url) => {
    const response = await fetch(`${url}?t=${Date.now()}`);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    return response.json();
  });
  return Promise.all(tasks);
};

const applyTheme = (theme) => {
  state.theme = theme === "light" ? "light" : "dark";
  document.documentElement.classList.toggle("theme-light", state.theme === "light");
  document.body.classList.toggle("theme-light", state.theme === "light");
  if (elements.switchTheme) {
    elements.switchTheme.textContent = state.theme === "light" ? "切换暗色" : "切换亮色";
  }
};

const initTheme = () => {
  const saved = localStorage.getItem("medalboard_theme");
  applyTheme(saved === "light" ? "light" : "dark");
};

const groupBy = (items, keyGetter) => {
  return items.reduce((acc, item) => {
    const key = keyGetter(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};

const buildLeaderboard = (data, view, gradeFilter, sortMode = "points") => {
  const eventMap = new Map((data.events || []).map((event) => [event.id, event]));
  const normalizedRecords = (data.records || []).map(normalizeRecordIdentity);
  let grouped;
  if (view === "classes") {
    grouped = groupBy(normalizedRecords, (record) => `${record.grade} ${record.className}`);
  } else {
    grouped = groupBy(normalizedRecords.filter((record) => record.grade === gradeFilter), (record) => record.className);
  }

  const rows = Object.entries(grouped)
    .map(([name, records]) => {
      const medals = sumMedals(records);
      const totalMedals = medals.gold + medals.silver + medals.bronze;
      return {
        name,
        medals,
        totalMedals,
        points: records.reduce(
          (sum, record) => sum + getRecordPointsByHandbook(record, eventMap.get(record.eventId)),
          0
        )
      };
    })
    .sort((a, b) => {
      if (sortMode === "points") {
        if (b.points !== a.points) return b.points - a.points;
        if (b.medals.gold !== a.medals.gold) return b.medals.gold - a.medals.gold;
        if (b.medals.silver !== a.medals.silver) return b.medals.silver - a.medals.silver;
        if (b.medals.bronze !== a.medals.bronze) return b.medals.bronze - a.medals.bronze;
      } else if (sortMode === "total") {
        if (b.totalMedals !== a.totalMedals) return b.totalMedals - a.totalMedals;
        if (b.points !== a.points) return b.points - a.points;
        if (b.medals.gold !== a.medals.gold) return b.medals.gold - a.medals.gold;
        if (b.medals.silver !== a.medals.silver) return b.medals.silver - a.medals.silver;
        if (b.medals.bronze !== a.medals.bronze) return b.medals.bronze - a.medals.bronze;
      } else if (sortMode === "medals") {
        if (b.medals.gold !== a.medals.gold) return b.medals.gold - a.medals.gold;
        if (b.medals.silver !== a.medals.silver) return b.medals.silver - a.medals.silver;
        if (b.medals.bronze !== a.medals.bronze) return b.medals.bronze - a.medals.bronze;
        if (b.points !== a.points) return b.points - a.points;
      }
      return a.name.localeCompare(b.name, "zh-CN", { numeric: true });
    });

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
};

const updateHero = (data) => {
  elements.heroTitle.textContent = formatPanguText(data.meta.title);
  elements.heroDate.textContent = formatPanguText(data.meta.date);
  elements.heroMeta.querySelector(".hero-subtitle").textContent = formatPanguText(data.meta.subtitle);
  elements.schoolLogo.src = data.meta.logoUrl;
  elements.schoolLogo.style.display = data.meta.logoUrl ? "block" : "none";
  elements.heroMedia.style.backgroundImage = `url("${String(data.meta.heroUrl || "").replace(/"/g, "\\22")}")`;
  elements.heroPrint.src = data.meta.heroUrl;
};

const renderAnnouncement = (data) => {
  const announcement = data.meta.announcement;
  if (announcement !== undefined && announcement !== null && announcement !== "") {
    elements.announcementSection.style.display = "block";
    elements.announcementContent.textContent = "🔔 " + announcement;
  } else {
    elements.announcementSection.style.display = "none";
  }
};

const renderTable = (rows) => {
  if (!rows.length) {
    elements.tableBody.innerHTML = '<div class="table-empty">暂无奖牌数据</div>';
    return;
  }

  elements.tableBody.innerHTML = rows
    .map((row, index) => {
      const topClass = row.rank <= 3 ? ` top-${row.rank}` : "";
      return `
        <div class="table-row${topClass}" data-name="${row.name}" style="--i:${index}">
          <span>${row.rank}</span>
          <strong>${formatLeaderboardName(row.name, state.view)}</strong>
          <span class="medal gold">${row.medals.gold}</span>
          <span class="medal silver">${row.medals.silver}</span>
          <span class="medal bronze">${row.medals.bronze}</span>
          <span>${row.points}</span>
        </div>
      `;
    })
    .join("");
};

const render = () => {
  if (!state.data) return;
  updateHero(state.data);
  renderAnnouncement(state.data);
  const selectedGrade = getGradeBySelectedClass();
  const gradeFilter = state.view === "within"
    ? selectedGrade || state.gradeFilter || state.data.records[0]?.grade
    : null;
  state.gradeFilter = gradeFilter;
  const rows = buildLeaderboard(state.data, state.view, gradeFilter, state.sortMode);
  renderTable(rows);
  if (state.view === "within") {
    elements.viewNote.textContent = "";
    if (elements.gradeFilter) elements.gradeFilter.style.display = selectedGrade ? "none" : "flex";
    if (!selectedGrade) {
      if (elements.gradeSelect) elements.gradeSelect.value = gradeFilter || "";
    }
  } else {
    elements.viewNote.textContent = "";
    if (elements.gradeFilter) elements.gradeFilter.style.display = "none";
  }
  updateSortSelect();
};

const getDayLabel = (day) => {
  if (!state.schedule?.meta?.dayMap) return day ? `D${day}` : "待定";
  const label = state.schedule.meta.dayMap[String(day)];
  return label ? `${label}` : day ? `D${day}` : "待定";
};

const getTodayDayInfo = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const dateStr = `${month}.${day}`;
  const dayMap = state.schedule?.meta?.dayMap;
  if (!dayMap) return { dateStr, dayNumber: null };
  const entry = Object.entries(dayMap).find(([, v]) => v === dateStr);
  return { dateStr, dayNumber: entry ? Number(entry[0]) : null };
};

const parseRescheduledDate = (note) => {
  const text = String(note || "").trim().replace(/：/g, ":");
  const match = text.match(/(\d+\.\d+)/);
  return match ? match[1] : "";
};

const getTodayMatches = () => {
  const todayInfo = getTodayDayInfo();
  const todayDateStr = todayInfo?.dateStr || "";
  const todayDay = todayInfo?.dayNumber;
  const original = [];
  const rescheduled = [];
  const allSports = getSortedSports();

  allSports.forEach((sport) => {
    const resultMap = buildResultMap(sport);
    (sport.stages || []).forEach((stage) => {
      (stage.matches || []).forEach((match) => {
        const score = getMatchScore(match.id);
        const status = score?.status || "scheduled";
        const note = score?.note || "";
        const rescheduledDate = note ? parseRescheduledDate(note) : "";

        if (todayDay != null && match.day === todayDay) {
          if (rescheduledDate && rescheduledDate !== todayDateStr) return;
          const isPaused = status === "postponed" || status === "delayed";
          original.push({
            sportId: sport.id,
            sportName: sport.name,
            teamEvent: sport.teamEvent,
            teamMap: sport.teamMap || {},
            resultMap,
            match,
            stageName: stage.name,
            isPaused
          });
          return;
        }

        if (note && rescheduledDate && rescheduledDate === todayDateStr && (todayDay == null || match.day !== todayDay)) {
          rescheduled.push({
            sportId: sport.id,
            sportName: sport.name,
            teamEvent: sport.teamEvent,
            teamMap: sport.teamMap || {},
            resultMap,
            match,
            stageName: stage.name,
            originalDay: match.day,
            isRescheduled: true
          });
        }
      });
    });
  });

  return [...original, ...rescheduled];
};

const parseGSlotIndexes = (slot) => {
  const text = String(slot || "").trim();
  if (!text || !/^G/i.test(text)) return [];
  const core = text.replace(/^G/i, "");
  return core
    .split("+")
    .map((part) => Number(String(part).replace(/^G/i, "").trim()))
    .filter((num) => Number.isFinite(num) && num > 0);
};

const getSportSlotDuration = (sportId) => {
  const id = String(sportId || "");
  if (id.includes("table-tennis")) return 60;
  if (id.includes("tennis")) return 10;
  if (id.includes("badminton")) return 20;
  if (id.includes("basketball-skill")) return 30;
  if (id.includes("basketball")) return 20;
  return 30;
};

const formatMinutes = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const getDynamicGSlotLabel = (sportId, day, slot) => {
  const slotText = String(slot || "").trim();
  if (/^G0$/i.test(slotText)) {
    const segmentMinutes = getSportSlotDuration(sportId);
    const start = 9 * 60 + 30;
    const end = start + segmentMinutes;
    return `${formatMinutes(start)}-${formatMinutes(end)}`;
  }
  const indexes = parseGSlotIndexes(slot);
  if (!indexes.length) return "";
  const dayNumber = Number(day);
  const isLateBucket = [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14].includes(dayNumber);
  const isNoonBucket = [5, 10].includes(dayNumber);
  if (!isLateBucket && !isNoonBucket) return "";

  const startBase = isNoonBucket ? 13 * 60 + 30 : 17 * 60;
  const segmentMinutes = getSportSlotDuration(sportId);
  const startIndex = Math.min(...indexes) - 1;
  const endIndex = Math.max(...indexes);
  const start = Math.round(startBase + startIndex * segmentMinutes);
  const end = Math.round(startBase + endIndex * segmentMinutes);
  return `${formatMinutes(start)}-${formatMinutes(end)}`;
};

const getSlotLabel = (sportId, slot, day) => {
  if (!slot) return "时间待定";
  const dynamicLabel = getDynamicGSlotLabel(sportId, day, slot);
  if (dynamicLabel) return dynamicLabel;
  const timeSlots = state.schedule?.meta?.timeSlots;
  if (!timeSlots) return slot;
  const bySport = timeSlots[sportId] || {};
  const daySlotKey = day && slot ? `D${day}_${slot}` : "";
  return bySport[daySlotKey] || bySport[slot] || timeSlots.default?.[daySlotKey] || timeSlots.default?.[slot] || slot;
};

const getMatchScore = (matchId) => state.scores?.matches?.[matchId];

const getScoreLabel = (score) => {
  if (!score) return "--";
  if (score.status === "delayed") return "延误";
  if (score.status === "postponed") return "推迟";
  if (score.status === "final") {
    if (Number.isFinite(score.scoreA) && Number.isFinite(score.scoreB)) {
      return `${score.scoreA} : ${score.scoreB}`;
    }
    return "已结束";
  }
  if (Number.isFinite(score.scoreA) && Number.isFinite(score.scoreB)) {
    return `${score.scoreA} : ${score.scoreB}`;
  }
  return score.status === "scheduled" ? "待赛" : "--";
};

const getSelectedClassNormalized = () => normalizeClassCandidate(state.selectedClass);

const isSelectedClassInMatch = (teamA, teamB, codeText) => {
  const target = getSelectedClassNormalized();
  if (!target) return false;
  const candidates = [teamA, teamB, codeText]
    .map((item) => normalizeClassCandidate(item))
    .filter(Boolean);
  return candidates.some((item) => containsAsUnit(item, target));
};

const buildMatchCard = (sportId, sportName, match, teamEvent, teamMap = {}, resultMap = {}, stageName = "") => {
  const score = getMatchScore(match.id);
  const status = score?.status || "scheduled";
  const note = readMatchNote(score);
  const winnerNote = !teamEvent && status === "final" && (score?.winner === "A" || score?.winner === "B")
    ? (score.winner === "A" ? "左侧胜" : "右侧胜")
    : "";
  const statusText = status === "delayed" ? "延误" : status === "postponed" ? "推迟" : status === "final" ? "已结束" : "";
  const statusClass = statusText ? ` status-${status}` : "";
  const isAlert = status === "delayed" || status === "postponed";
  const rescheduledDate = note ? parseRescheduledDate(score?.note || "") : "";
  const originalTimeLabel = formatPanguText(`${getDayLabel(match.day)} · ${getSlotLabel(sportId, match.slot, match.day)}`);
  const oldTimeClass = rescheduledDate
    ? `match-time-old${status === "final" ? " final" : ""}`
    : "";
  const timeLabel = rescheduledDate
    ? `<s class="${oldTimeClass}">${originalTimeLabel}</s>`
    : originalTimeLabel;
  const venueLabel = match.venue ? formatPanguText(`场地 ${match.venue}`) : "";
  const scopeKey = getMatchScopeKey(sportId, stageName);
  const participants = getMatchParticipants(match);
  const fallbackA = sanitizeTeamLabelForDisplay(resolveTeamLabel(match.teams?.[0], teamMap));
  const fallbackB = sanitizeTeamLabelForDisplay(resolveTeamLabel(match.teams?.[1], teamMap));
  const resolvedA = sanitizeTeamLabelForDisplay(resolveTeamToken(participants[0], teamMap, resultMap, { scopeKey }));
  const resolvedB = sanitizeTeamLabelForDisplay(resolveTeamToken(participants[1], teamMap, resultMap, { scopeKey }));
  const teamA = (resolvedA && resolvedA !== "待定") ? resolvedA : fallbackA || "待定";
  const teamB = (resolvedB && resolvedB !== "待定") ? resolvedB : fallbackB || "待定";
  const isMyClass = isSelectedClassInMatch(teamA, teamB, match.code || "");
  const scoreLabel = teamEvent ? getScoreLabel(score) : "不计比分";
  const codeLabel = formatMatchCodeLabel(match.code || "");
  const noteLabel = rescheduledDate
    ? `<span class="match-note-rescheduled">→ ${formatPanguText(note)}</span>`
    : note ? formatPanguText(note) : (winnerNote ? formatPanguText(winnerNote) : "");
  const challengeSport = isChallengeSport(sportId, sportName);
  const nonScoreMain = challengeSport
    ? `
      <div class="match-main non-score challenge">
        <div class="match-event-type">挑战项目</div>
        <div class="match-event-note">不计比分，按规则计时/计数判定名次</div>
      </div>
  `
    : `
      <div class="match-main">
        <div class="match-team">${formatTeamLabel(teamA)}</div>
        <div class="match-score muted">不计比分</div>
        <div class="match-team">${formatTeamLabel(teamB)}</div>
      </div>
  `;

  return `
    <div class="match-card${isAlert ? " is-alert" : ""}${isMyClass ? " is-my-class" : ""}">
      <div class="match-top">
        <div class="match-meta">
          <span class="match-time">${timeLabel}</span>
          ${venueLabel ? `<span class="match-venue">${venueLabel}</span>` : ""}
        </div>
        ${statusText ? `<span class="match-status${statusClass}">${statusText}</span>` : ""}
      </div>
      ${teamEvent
        ? `<div class="match-main">
        <div class="match-team">${formatTeamLabel(teamA)}</div>
        <div class="match-score">${scoreLabel}</div>
        <div class="match-team">${formatTeamLabel(teamB)}</div>
      </div>`
        : nonScoreMain}
      ${(codeLabel || noteLabel)
        ? `<div class="match-code-row">${codeLabel ? `<span class="match-code">${codeLabel}</span>` : ""}${noteLabel ? `<span class="match-note">备注：${noteLabel}</span>` : ""}</div>`
        : ""}
    </div>
  `;
};

const renderScheduleTabs = () => {
  if (!elements.scheduleTabs) return;
  const tabs = getScheduleTabs();
  elements.scheduleTabs.innerHTML = tabs
    .map(
      (tab) => `
      <button class="schedule-tab${state.scheduleView === tab.key ? " active" : ""}" data-sport="${tab.key}">
        ${formatPanguText(tab.label)}
      </button>
    `
    )
    .join("");
};

const formatTtClassName = (name) => {
  const text = String(name || "").trim();
  const match = text.match(/^(.*?)(?:班)?\s*组\s*(\d+)$/);
  if (match) {
    const base = match[1].replace(/\s+/g, "").replace(/班$/, "");
    return `${base}班组${match[2]}`;
  }
  return formatClassText(text);
};

const buildTableTennisStatsRows = () => {
  const stats = state.scores?.tableTennis || {};
  const rows = Object.entries(stats)
    .map(([className, data]) => ({
      className: formatTtClassName(className),
      pushes: toNumberOrZero(data?.pushes),
      misses: toNumberOrZero(data?.misses)
    }))
    .filter((row) => row.pushes > 0 || row.misses > 0)
    .sort((a, b) => b.pushes - a.pushes || a.misses - b.misses || a.className.localeCompare(b.className, "zh-CN", { numeric: true }));
  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
};

const renderTableTennisStatsTable = (isTableTennis) => {
  if (!isTableTennis) return "";
  const rows = buildTableTennisStatsRows();
  if (!rows.length) return "";

  const rowsHtml = rows
    .map((row, index) => {
      const topClass = row.rank <= 3 ? ` top-${row.rank}` : "";
      return `
        <div class="table-row${topClass}" style="--i:${index}">
          <span>${row.rank}</span>
          <strong>${formatPanguText(row.className)}</strong>
          <span class="stat-pushes">${row.pushes}</span>
          <span class="stat-misses">${row.misses}</span>
        </div>
      `;
    })
    .join("");

  return `
    <div class="schedule-stage table-tennis-stats">
      <div class="stage-title">推挡统计排行榜</div>
      <div class="table-wrap">
        <div class="table-head stats-head">
          <span>排名</span>
          <span>班级</span>
          <span>推挡</span>
          <span>失误</span>
        </div>
        <div class="table-body stats-body">
          ${rowsHtml}
        </div>
      </div>
    </div>
  `;
};

const renderTodayScheduleBody = () => {
  if (!elements.scheduleBody) return;
  const todayInfo = getTodayDayInfo();
  const matches = getTodayMatches();

  if (!matches.length) {
    const dateText = todayInfo?.dateStr ? `${todayInfo.dateStr}` : "今日";
    elements.scheduleBody.innerHTML = `<div class="schedule-empty">今日（${dateText}）暂无赛程</div>`;
    return;
  }

  matches.sort((a, b) => {
    if (a.isPaused && !b.isPaused) return 1;
    if (!a.isPaused && b.isPaused) return -1;
    if (a.isRescheduled && !b.isRescheduled) return -1;
    if (!a.isRescheduled && b.isRescheduled) return 1;
    const dayA = a.isRescheduled ? (todayInfo?.dayNumber || 0) : a.match.day;
    const dayB = b.isRescheduled ? (todayInfo?.dayNumber || 0) : b.match.day;
    if (dayA !== dayB) return dayA - dayB;
    return String(a.match.slot || "").localeCompare(String(b.match.slot || ""), "en", { numeric: true });
  });

  const buildCardHtml = (item) => {
    let card = buildMatchCard(
      item.sportId,
      item.sportName,
      item.match,
      item.teamEvent,
      item.teamMap,
      item.resultMap,
      item.stageName
    );
    if (item.isPaused) {
      card = card.replace('class="match-card', 'class="match-card is-postponed-dim');
    }
    const stageName = normalizeStageName(item.stageName);
    const sportLabel = formatPanguText(`${getSportTabLabel({ id: item.sportId, name: item.sportName })} · 阶段 ${stageName}`);
    let tagHtml = "";
    if (item.isRescheduled) {
      tagHtml = '<span class="today-tag today-tag-rescheduled">改期至今</span>';
    } else if (item.isPaused) {
      tagHtml = '<span class="today-tag today-tag-paused">今日暂停</span>';
    }
    return `<div class="today-card-wrap">
      <div class="today-sport-label"><span>${sportLabel}</span>${tagHtml}</div>
      ${card}
    </div>`;
  };

  const active = matches.filter((m) => !m.isPaused);
  const paused = matches.filter((m) => m.isPaused);
  const activeHtml = active.map(buildCardHtml).join("");
  const pausedHtml = paused.map(buildCardHtml).join("");

  let gridContent = activeHtml;
  if (paused.length && active.length) {
    gridContent += `<div class="today-paused-sep"></div>`;
  }
  gridContent += pausedHtml;

  elements.scheduleBody.innerHTML = `
    <div class="schedule-stage">
      <div class="stage-grid today-grid">${gridContent}</div>
    </div>
  `;
};

const renderScheduleBody = () => {
  if (!elements.scheduleBody) return;
  if (state.scheduleToday) {
    renderTodayScheduleBody();
    return;
  }
  const targetKey = state.scheduleView;
  const sports = getSortedSports().filter((item) => getSportTabKey(item) === targetKey);
  if (!sports.length) {
    elements.scheduleBody.innerHTML = "<div class=\"schedule-empty\">暂无赛程数据</div>";
    return;
  }

  const blocks = [];
  sports.forEach((sport) => {
    if (!sport.stages?.length) return;
    const resultMap = buildResultMap(sport);
    sport.stages.forEach((stage) => {
      const stageName = normalizeStageName(stage.name);
      const cards = (stage.matches || [])
        .map((match) => buildMatchCard(sport.id, sport.name, match, sport.teamEvent, sport.teamMap, resultMap, stage.name))
        .join("");
      blocks.push(`
        <div class="schedule-stage">
          <div class="stage-title">阶段 ${formatPanguText(stageName)}</div>
          <div class="stage-grid">${cards}</div>
        </div>
      `);
    });
  });

  const isTableTennis = targetKey === "tableTennis";
  const statsTableHtml = renderTableTennisStatsTable(isTableTennis);
  if (statsTableHtml) {
    blocks.push(statsTableHtml);
  }

  elements.scheduleBody.innerHTML = blocks.join("") || "<div class=\"schedule-empty\">暂无赛程数据</div>";
};

const handleTodayToggle = () => {
  state.scheduleToday = !state.scheduleToday;
  renderSchedule();
  persistUiState();
};

const renderSchedule = () => {
  if (!elements.scheduleSection) return;
  if (!state.schedule) {
    elements.scheduleMeta.textContent = "数据更新：--";
    if (elements.scheduleNote) {
      elements.scheduleNote.textContent = "当前班级暂无赛程，请稍后刷新或联系管理员更新。";
    }
    elements.scheduleTabs.innerHTML = "";
    elements.scheduleBody.innerHTML = '<div class="schedule-empty">暂无赛程数据</div>';
    return;
  }
  if (!state.scheduleView) {
    state.scheduleView = getScheduleTabs()[0]?.key || null;
  }
  const scoreUpdatedAt = state.scores?.meta?.updatedAt || state.schedule?.meta?.updatedAt || "--";
  elements.scheduleMeta.textContent = formatPanguText(`比分更新：${scoreUpdatedAt}`);

  if (elements.todayToggle) {
    elements.todayToggle.textContent = state.scheduleToday ? "返回赛程" : "查看今日";
  }

  if (state.scheduleToday) {
    if (elements.scheduleNote) {
      const todayInfo = getTodayDayInfo();
      const dateText = todayInfo?.dateStr ? `${todayInfo.dateStr}` : "今日";
      elements.scheduleNote.textContent = formatPanguText(`今日赛程（${dateText}），按时间顺序排列`);
    }
    elements.scheduleTabs.innerHTML = "";
  } else {
    if (elements.scheduleNote) {
      const classMeta = getSelectedClassMeta();
      const groupName = state.classConfig?.groups?.[classMeta?.group || ""]?.name || "当前班级";
      elements.scheduleNote.textContent = formatPanguText(`按项目查看 ${groupName} 赛程，本班参赛场次已高亮`);
    }
    renderScheduleTabs();
  }
  renderScheduleBody();
};

const resolveTeamLabel = (team, teamMap) => {
  if (!team) return "";
  if (team.name) return team.name;
  if (team.code && teamMap?.[team.code]) return teamMap[team.code];
  return team.code || "";
};

const compactSportName = (sport) => {
  return getSportTabLabel(sport);
};

const getSelectedScoreSportFilter = () => elements.scoresSportFilter?.value || "all";

const renderScoresSportFilter = () => {
  if (!elements.scoresSportFilter || !state.schedule) return;
  const sports = getSortedSports();
  const options = [`<option value="all">全部项目</option>`]
    .concat(
      sports.map((sport) => `<option value="${sport.id}">${formatPanguText(compactSportName(sport))}</option>`)
    )
    .join("");
  const current = getSelectedScoreSportFilter();
  elements.scoresSportFilter.innerHTML = options;
  elements.scoresSportFilter.value = sports.some((sport) => sport.id === current) ? current : "all";
};

const buildScoresEditor = () => {
  if (!elements.scoresEditor) return;
  if (!state.schedule || !state.scores) {
    elements.scoresEditor.innerHTML = "<div class=\"scores-empty\">暂无赛程数据</div>";
    return;
  }

  // 保存当前输入的乒乓球推挡数据
  const currentTtRows = [...document.querySelectorAll(".tt-editor-row")];
  if (currentTtRows.length) {
    const ttData = {};
    currentTtRows.forEach((row) => {
      const rawName = row.querySelector(".tt-class-input")?.value?.trim() || "";
      if (!rawName) return;
      const className = sanitizeTeamLabelForDisplay(rawName);
      const pushes = parseScoreInputValue(row.querySelector(".tt-pushes")?.value);
      const misses = parseScoreInputValue(row.querySelector(".tt-misses")?.value);
      ttData[className] = {
        pushes: Number.isFinite(pushes) ? pushes : 0,
        misses: Number.isFinite(misses) ? misses : 0
      };
    });
    state.scores.tableTennis = { ...state.scores.tableTennis, ...ttData };
  }

  const rows = [];
  const filterSportId = getSelectedScoreSportFilter();
  getSortedSports()
    .filter((sport) => filterSportId === "all" || sport.id === filterSportId)
    .forEach((sport) => {
      const teamMap = sport.teamMap || {};
      const resultMap = buildResultMap(sport);
      sport.stages.forEach((stage) => {
        stage.matches.forEach((match) => {
          const score = state.scores.matches?.[match.id] || {};
          const participants = getMatchParticipants(match);
          const fallbackA = sanitizeTeamLabelForDisplay(resolveTeamLabel(match.teams?.[0], teamMap));
          const fallbackB = sanitizeTeamLabelForDisplay(resolveTeamLabel(match.teams?.[1], teamMap));
          const scopeKey = getMatchScopeKey(sport.id, stage.name);
          const resolvedA = sanitizeTeamLabelForDisplay(resolveTeamToken(participants[0], teamMap, resultMap, { scopeKey }));
          const resolvedB = sanitizeTeamLabelForDisplay(resolveTeamToken(participants[1], teamMap, resultMap, { scopeKey }));
          const teamA = (resolvedA && resolvedA !== "待定") ? resolvedA : fallbackA || "待定";
          const teamB = (resolvedB && resolvedB !== "待定") ? resolvedB : fallbackB || "待定";
          const timeLabel = `${getDayLabel(match.day)} ${getSlotLabel(sport.id, match.slot, match.day)}`;
          const stageName = normalizeStageName(stage.name);
          const note = score.note || score.rescheduledAt || "";
          const challengeSport = isChallengeSport(sport.id, sport.name);
          const isScoreSport = sport.teamEvent;
          const rowStatus = score.status || "scheduled";
          rows.push(`
            <div class="scores-row compact${isScoreSport ? "" : " muted-row"}" data-match-id="${match.id}" data-sport-id="${sport.id}" data-status="${rowStatus}">
              <div class="scores-meta">
                <div class="scores-sport">${compactSportName(sport)} · 阶段 ${stageName}</div>
                <div class="scores-time">${timeLabel}${match.venue ? ` · 场地 ${match.venue}` : ""}</div>
              </div>
              <div class="scores-match${isScoreSport ? "" : " muted"}">
                ${isScoreSport
                  ? `<span class="scores-team">${teamA}</span>
                <input class="score-input" type="number" min="0" placeholder="-" value="${Number.isFinite(score.scoreA) ? score.scoreA : ""}" />
                <span class="score-sep">:</span>
                <input class="score-input" type="number" min="0" placeholder="-" value="${Number.isFinite(score.scoreB) ? score.scoreB : ""}" />
                <span class="scores-team">${teamB}</span>`
                  : challengeSport
                    ? `<span class="scores-team">挑战项目</span><span class="score-sep">·</span><span class="scores-team">不计比分</span><span class="score-sep">·</span><span class="scores-team">按规则判定</span>`
                    : `<span class="scores-team">${teamA}</span><span class="score-sep">·</span><span class="scores-team">不计比分</span><span class="score-sep">·</span><span class="scores-team">${teamB}</span>`}
              </div>
              <div class="scores-actions">
                <select class="score-status">
                  <option value="scheduled" ${score.status === "scheduled" ? "selected" : ""}>未开始</option>
                  <option value="final" ${score.status === "final" ? "selected" : ""}>已结束</option>
                  <option value="delayed" ${score.status === "delayed" ? "selected" : ""}>延误</option>
                  <option value="postponed" ${score.status === "postponed" ? "selected" : ""}>推迟</option>
                </select>
                ${isScoreSport
                  ? ""
                  : `<select class="score-winner">
                    <option value="" ${!score.winner ? "selected" : ""}>胜者待定</option>
                    <option value="A" ${score.winner === "A" ? "selected" : ""}>胜者：左侧</option>
                    <option value="B" ${score.winner === "B" ? "selected" : ""}>胜者：右侧</option>
                  </select>`}
                <input class="score-note" type="text" placeholder="备注：改期/点球/说明" value="${note}" />
              </div>
            </div>
          `);
        });
      });
    });

  if (!rows.length) {
    elements.scoresEditor.innerHTML = "<div class=\"scores-empty\">暂无比分可编辑</div>";
    return;
  }
  const col1 = [];
  const col2 = [];
  const col3 = [];
  rows.forEach((rowHtml, index) => {
    if (index % 3 === 0) col1.push(rowHtml);
    else if (index % 3 === 1) col2.push(rowHtml);
    else col3.push(rowHtml);
  });
  elements.scoresEditor.innerHTML = `
    <div class="scores-columns">
      <div class="scores-col">${col1.join("")}</div>
      <div class="scores-col">${col2.join("")}</div>
      <div class="scores-col">${col3.join("")}</div>
    </div>
    ${buildTableTennisRows()}
  `;
};

const buildTableTennisRows = () => {
  const filterSportId = getSelectedScoreSportFilter();
  const hasTableTennis = filterSportId === "all"
    ? (state.schedule?.sports || []).some((sport) => sport.id?.includes("table-tennis"))
    : filterSportId.includes("table-tennis");
  if (!hasTableTennis) return "";

  const tableTennisStats = state.scores?.tableTennis || {};
  const currentGroup = state.selectedGroupKey || getSelectedClassMeta()?.group || "";
  const classes = state.classConfig?.classes || [];
  const classNames = classes
    .filter((item) => !currentGroup || item.group === currentGroup)
    .map((item) => item.key)
    .sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }));

  // 合并配置班级和已录入的自定义班级
  const allClasses = new Set([...classNames, ...Object.keys(tableTennisStats)]);
  const sortedClasses = [...allClasses].sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }));

  const rowHtml = (className, isCustom = false) => {
    const stats = tableTennisStats[className] || {};
    const pushes = toNumberOrZero(stats.pushes);
    const misses = toNumberOrZero(stats.misses);
    return `
      <div class="tt-editor-row${isCustom ? " tt-custom" : ""}" data-class="${className}">
        <input class="tt-input tt-class-input" type="text" value="${className}" ${isCustom ? "" : "readonly"} placeholder="班级名" />
        <label>推挡
          <input class="tt-input tt-pushes" type="number" min="0" placeholder="0" value="${pushes || ""}" />
        </label>
        <label>失误
          <input class="tt-input tt-misses" type="number" min="0" placeholder="0" value="${misses || ""}" />
        </label>
        <button class="btn ghost tt-remove" title="删除">×</button>
      </div>
    `;
  };

  return `
    <div class="tt-editor-block">
      <div class="tt-editor-title">推挡统计</div>
      <div class="tt-editor-grid">
        ${sortedClasses.map((cls) => rowHtml(cls)).join("")}
      </div>
      <button class="btn light tt-add-class" type="button">添加班级</button>
    </div>
  `;
};

const getTableTennisEditorData = () => {
  const rows = [...document.querySelectorAll(".tt-editor-row")];
  if (!rows.length) return state.scores?.tableTennis || {};
  const tableTennis = {};
  rows.forEach((row) => {
    const rawName = row.querySelector(".tt-class-input")?.value?.trim() || "";
    if (!rawName) return;
    const className = sanitizeTeamLabelForDisplay(rawName);
    const pushes = parseScoreInputValue(row.querySelector(".tt-pushes")?.value);
    const misses = parseScoreInputValue(row.querySelector(".tt-misses")?.value);
    tableTennis[className] = {
      pushes: Number.isFinite(pushes) ? pushes : 0,
      misses: Number.isFinite(misses) ? misses : 0
    };
  });
  return tableTennis;
};

const getScoresEditorData = () => {
  const rows = [...elements.scoresEditor.querySelectorAll(".scores-row")];
  const previousMatches = state.scores?.matches || {};
  const matches = { ...previousMatches };
  rows.forEach((row) => {
    const matchId = row.dataset.matchId;
    const inputs = row.querySelectorAll(".score-input");
    const status = row.querySelector(".score-status")?.value || "scheduled";
    const note = row.querySelector(".score-note")?.value?.trim() || "";
    const winner = row.querySelector(".score-winner")?.value || "";
    const scoreA = parseScoreInputValue(inputs[0]?.value);
    const scoreB = parseScoreInputValue(inputs[1]?.value);
    const winnerValue = ["A", "B"].includes(winner) ? winner : "";
    const hasBothScores = Number.isFinite(scoreA) && Number.isFinite(scoreB);
    const finalStatus = (hasBothScores || winnerValue) && status === "scheduled" ? "final" : status;
    matches[matchId] = {
      scoreA,
      scoreB,
      status: finalStatus,
      note,
      winner: winnerValue
    };
  });
  const tableTennis = getTableTennisEditorData();
  return {
    meta: { updatedAt: new Date().toLocaleString("zh-CN") },
    matches,
    tableTennis
  };
};

const handleExportScores = () => {
  const data = getScoresEditorData();
  data.meta.updatedAt = new Date().toLocaleString("zh-CN");
  state.scores = data;
  const groupKey = state.selectedGroupKey || getSelectedClassMeta()?.group || "high";
  const filename = `scores-${groupKey}.json`;
  exportFile(JSON.stringify(data, null, 2), filename, "application/json");
  elements.scoresTip.textContent = `已导出 ${filename}，请上传并覆盖对应文件。`;
  renderSchedule();
};

const syncScoresRowStatus = (row) => {
  if (!row) return;
  const status = row.querySelector(".score-status")?.value || "scheduled";
  row.dataset.status = status;
};

const handleScoresEditorInput = (event) => {
  const input = event.target.closest(".score-input");
  if (!input) return;
  const row = input.closest(".scores-row");
  if (!row) return;
  const scoreInputs = row.querySelectorAll(".score-input");
  const scoreA = parseScoreInputValue(scoreInputs[0]?.value);
  const scoreB = parseScoreInputValue(scoreInputs[1]?.value);
  if (!Number.isFinite(scoreA) || !Number.isFinite(scoreB)) return;
  const statusSelect = row.querySelector(".score-status");
  if (!statusSelect) return;
  statusSelect.value = "final";
  syncScoresRowStatus(row);
};

const handleScoresEditorChange = (event) => {
  const statusSelect = event.target.closest(".score-status");
  if (!statusSelect) return;
  const row = statusSelect.closest(".scores-row");
  syncScoresRowStatus(row);
};

const updateTimeBar = () => {
  const now = new Date();
  const medalUpdatedAt = state.data?.meta?.updatedAt || "--";
  elements.currentTime.textContent = formatPanguText(`当前时间：${now.toLocaleString("zh-CN")}`);
  if (state.data?.meta?.updatedAt) {
    elements.lastUpdated.textContent = formatPanguText(`奖牌更新：${medalUpdatedAt}`);
  } else {
    elements.lastUpdated.textContent = "奖牌更新：--";
  }
};

const updateViewButtons = () => {
  elements.viewToggle.querySelectorAll(".toggle").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });
};

const handleViewToggle = (event) => {
  const button = event.target.closest(".toggle");
  if (!button) return;
  state.view = button.dataset.view;
  if (state.view === "within") {
    setDefaultGrade();
  }
  updateViewButtons();
  render();
  persistUiState();
};

const updateSortSelect = () => {
  if (elements.sortToggle) {
    elements.sortToggle.value = state.sortMode;
  }
};

const handleSortChange = (event) => {
  updateState({ sortMode: event.target.value });
};

const handleSwitchTheme = (event) => {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const nextTheme = state.theme === "light" ? "dark" : "light";
  applyTheme(nextTheme);
  localStorage.setItem("medalboard_theme", nextTheme);
};

const buildPosterRowsHtml = () => {
  const gradeFilter = state.view === "within" ? state.gradeFilter || state.data.records[0]?.grade : null;
  const rows = buildLeaderboard(state.data, state.view, gradeFilter, state.sortMode);
  return rows
    .map((row) => {
      const topClass = row.rank <= 3 ? ` top-${row.rank}` : "";
      return `
        <div class="poster-row${topClass}">
          <span>${row.rank}</span>
          <strong>${formatLeaderboardName(row.name, state.view)}</strong>
          <span>${row.medals.gold}</span>
          <span>${row.medals.silver}</span>
          <span>${row.medals.bronze}</span>
          <span>${row.points}</span>
        </div>
      `;
    })
    .join("");
};

const waitForImagesReady = (container) => {
  const images = [...container.querySelectorAll("img")];
  if (!images.length) return Promise.resolve();
  return Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  ).then(() => undefined);
};

const handlePosterExport = () => {
  if (typeof window.html2canvas !== "function") {
    alert("海报导出不可用：html2canvas 未加载");
    return;
  }

  const poster = document.createElement("div");
  poster.className = "poster-export-root";
  poster.innerHTML = `
    <div class="poster-export-canvas">
      <div class="poster-hero" style="background-image:url('${state.data.meta.heroUrl || "data/hero.jpg"}')">
        <div class="poster-hero-mask"></div>
        <div class="poster-hero-inner">
          <img class="poster-logo" src="${state.data.meta.logoUrl || "data/icon.jfif"}" alt="logo" />
          <div class="poster-meta">
            <div class="poster-sub">${formatPanguText(state.data.meta.subtitle || "学校春季运动会")}</div>
            <div class="poster-date">${formatPanguText(state.data.meta.date || "")}</div>
            <div class="poster-title">${formatPanguText(state.data.meta.title || "奖牌榜")}</div>
          </div>
        </div>
      </div>
      <div class="poster-board">
        <div class="poster-board-head">
          <span>排名</span>
          <span>班级</span>
          <span>金</span>
          <span>银</span>
          <span>铜</span>
          <span>积分</span>
        </div>
        <div class="poster-board-body">${buildPosterRowsHtml()}</div>
        <div class="poster-board-foot">学生会新媒体工作部 制</div>
      </div>
    </div>
  `;
  document.body.appendChild(poster);

  const canvasNode = poster.querySelector(".poster-export-canvas");
  const rowCount = buildLeaderboard(state.data, state.view, state.view === "within" ? state.gradeFilter || state.data.records[0]?.grade : null).length;
  const dynamicHeight = Math.max(860, 430 + rowCount * 48);
  canvasNode.style.height = `${dynamicHeight}px`;

  const cleanUp = () => {
    poster.remove();
    elements.exportPoster.disabled = false;
    elements.exportPoster.textContent = "导出海报";
  };

  elements.exportPoster.disabled = true;
  elements.exportPoster.textContent = "导出中...";

  const exportNow = () => {
    window.html2canvas(canvasNode, {
      backgroundColor: "#0b111f",
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false
    })
      .then((canvas) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            cleanUp();
            alert("导出失败，请稍后重试");
            return;
          }
          const now = new Date();
          const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `sports-poster-${stamp}.png`;
          link.click();
          URL.revokeObjectURL(link.href);
          cleanUp();
        }, "image/png", 1);
      })
      .catch(() => {
        cleanUp();
        alert("导出失败：请确认图片资源可访问后重试");
      });
  };

  const waitFont = document.fonts?.ready ? document.fonts.ready : Promise.resolve();
  waitFont.then(() => waitForImagesReady(poster)).then(() => setTimeout(exportNow, 80));
};

const loadData = async () => {
  const dataUrl = dataUrlFromQuery() || "data/medals.json";
  try {
    const response = await fetch(`${dataUrl}?t=${Date.now()}`);
    if (!response.ok) throw new Error("Failed to fetch data");
    state.data = await response.json();
    state.data.records = (state.data.records || []).map(normalizeRecordIdentity);
  } catch (error) {
    handleError("loadData", error);
    state.data = defaultData;
    state.data.records = (state.data.records || []).map(normalizeRecordIdentity);
  }
  state.data.meta.logoUrl = "data/icon.jfif";
  state.data.meta.heroUrl = "data/hero.jpg";
  updateTimeBar();
};

const loadSchedule = async () => {
  const scheduleUrls = getListQuery("schedule");
  const scoresUrls = getListQuery("scores");
  const defaultScheduleUrls = ["data/schedule-high.json"];
  const defaultScoresUrls = ["data/scores-high.json"];
  const loadScheduleUrls = scheduleUrls.length ? scheduleUrls : defaultScheduleUrls;
  const loadScoresUrls = scoresUrls.length ? scoresUrls : defaultScoresUrls;

  try {
    const scheduleList = await loadJsonList(loadScheduleUrls);
    state.schedule = mergeScheduleList(scheduleList);
  } catch (error) {
    handleError("loadSchedule", error);
    state.schedule = null;
  }

  try {
    const scoresList = await loadJsonList(loadScoresUrls);
    state.scores = mergeScoresList(scoresList);
  } catch (error) {
    handleError("loadScores", error);
    state.scores = { meta: {}, matches: {} };
  }
};

const loadClassConfig = async () => {
  try {
    const response = await fetch(`data/class-config.json?t=${Date.now()}`);
    if (!response.ok) throw new Error("Failed to fetch class config");
    state.classConfig = await response.json();
  } catch (error) {
    handleError("loadClassConfig", error);
    state.classConfig = { classes: [], groups: {}, defaultClass: "" };
  }
};

const renderClassSelect = () => {
  if (!elements.classSelect) return;
  const classes = state.classConfig?.classes || [];
  if (!classes.length) {
    elements.classPicker.hidden = true;
    return;
  }
  elements.classSelect.innerHTML = classes
    .map((item) => `<option value="${item.key}">${item.label}</option>`)
    .join("");
  const preferred = state.selectedClass || classes[0]?.key || "";
  elements.classSelect.value = preferred;
  if (!state.selectedClass && preferred) state.selectedClass = preferred;
  elements.classPicker.hidden = false;
};

const getGroupUrlsByClassKey = (classKey) => {
  const classMeta = (state.classConfig?.classes || [])
    .find((item) => normalizeClassKey(item.key) === normalizeClassKey(classKey));
  if (!classMeta) return null;
  const group = state.classConfig?.groups?.[classMeta.group];
  if (!group) return null;
  return {
    groupKey: classMeta.group,
    schedule: group.schedule || [],
    scores: group.scores || []
  };
};

const ensureScheduleView = () => {
  const tabs = getScheduleTabs();
  if (!tabs.length) {
    state.scheduleView = null;
    return;
  }
  const exists = tabs.some((tab) => tab.key === state.scheduleView);
  if (!exists) state.scheduleView = tabs[0].key;
};

const applyClassSelection = async (classKey) => {
  const urls = getGroupUrlsByClassKey(classKey);
  state.selectedClass = classKey;
  if (!urls) {
    state.schedule = null;
    state.scores = { meta: {}, matches: {} };
    state.selectedGroupKey = "";
    renderSchedule();
    return;
  }

  state.selectedGroupKey = urls.groupKey;
  try {
    const scheduleList = await loadJsonList(urls.schedule);
    state.schedule = mergeScheduleList(scheduleList);
  } catch (error) {
    handleError("applyClassSelection.schedule", error);
    state.schedule = null;
  }

  try {
    const scoresList = await loadJsonList(urls.scores);
    state.scores = mergeScoresList(scoresList);
  } catch (error) {
    handleError("applyClassSelection.scores", error);
    state.scores = { meta: {}, matches: {} };
  }

  state.scheduleView = null;
  state.scheduleToday = false;
  ensureScheduleView();
  if (state.admin) {
    renderScoresSportFilter();
    buildScoresEditor();
  }
  persistSelectedClass(classKey);
  if (state.view === "within") {
    const selectedGrade = getGradeBySelectedClass();
    if (selectedGrade) state.gradeFilter = selectedGrade;
    render();
  }
  renderSchedule();
};

const handleClassChange = async (event) => {
  const value = event.target.value;
  await applyClassSelection(value);
};

const setDefaultGrade = () => {
  const savedGrade = localStorage.getItem("medalboard_grade");
  const grades = [...new Set((state.data.records || []).map((record) => normalizeRecordIdentity(record).grade))];
  const selectedGrade = getGradeBySelectedClass();
  if (selectedGrade && grades.includes(selectedGrade)) {
    state.gradeFilter = selectedGrade;
    return;
  }
  if (savedGrade && grades.includes(savedGrade)) {
    state.gradeFilter = savedGrade;
  } else {
    state.gradeFilter = grades[0] || null;
  }
};

const persistGrade = (grade) => {
  if (grade) localStorage.setItem("medalboard_grade", grade);
};

const renderGradeSelect = () => {
  const grades = [...new Set((state.data.records || []).map((record) => normalizeRecordIdentity(record).grade))];
  if (!elements.gradeSelect) return;
  elements.gradeSelect.innerHTML = grades
    .map((grade) => `<option value="${grade}">${formatPanguText(normalizeGradeText(grade))}</option>`)
    .join("");
  elements.gradeSelect.value = state.gradeFilter || grades[0] || "";
};

const handleGradeChange = (event) => {
  const grade = event.target.value;
  state.gradeFilter = grade;
  persistGrade(grade);
  render();
};

const handleRowClick = (event) => {
  const clickTarget = event.target.closest(".table-row");
  if (!clickTarget) return;
  const name = clickTarget.dataset.name;
  if (!name) return;
  showDetailModal(name);
};

const showDetailModal = (name) => {
  const records = state.view === "classes"
    ? state.data.records.filter((record) => `${record.grade} ${record.className}` === name)
    : state.data.records.filter((record) => record.grade === state.gradeFilter && record.className === name);

  const grouped = groupBy(records, (record) => record.eventId);
  const eventMap = new Map(state.data.events.map((event) => [event.id, event]));
  const lines = Object.entries(grouped)
    .map(([eventId, group]) => {
      const medals = sumDetailedMedals(group);
      const event = eventMap.get(eventId);
      const points = group.reduce((sum, r) => sum + getRecordPointsByHandbook(r, event), 0);
      return {
        name: formatPanguText(event?.name || "未知项目"),
        category: formatPanguText(event?.category || "赛事"),
        medals,
        points
      };
    })
    .sort((a, b) => {
      if (b.medals.first !== a.medals.first) return b.medals.first - a.medals.first;
      if (b.medals.second !== a.medals.second) return b.medals.second - a.medals.second;
      if (b.medals.third !== a.medals.third) return b.medals.third - a.medals.third;
      if (b.points !== a.points) return b.points - a.points;
      if (b.medals.fourth !== a.medals.fourth) return b.medals.fourth - a.medals.fourth;
      if (b.medals.fifth !== a.medals.fifth) return b.medals.fifth - a.medals.fifth;
      return b.medals.sixth - a.medals.sixth;
    });

  elements.detailTitle.textContent = formatLeaderboardName(name, state.view);
  elements.detailSubtitle.textContent = "项目奖牌明细";
  elements.detailBody.innerHTML = lines.length
    ? lines
        .map((line) => {
          const labels = [];
          const push = (count, text, cls) => {
            for (let i = 0; i < count; i++) {
              labels.push(`<span class="medal-tag ${cls}">${text}</span>`);
            }
          };
          push(line.medals.first, "金牌", "gold");
          push(line.medals.second, "银牌", "silver");
          push(line.medals.third, "铜牌", "bronze");
          push(line.medals.fourth, "第四名", "rank");
          push(line.medals.fifth, "第五名", "rank");
          push(line.medals.sixth, "第六名", "rank");

          return `
        <div class="modal-row detail-item">
          <div class="detail-info">
            <span class="detail-name">${line.name}</span>
            <span class="detail-cat">${line.category} · ${line.points} 积分</span>
          </div>
          <div class="detail-medals">${labels.join("")}</div>
        </div>
      `;
        })
        .join("")
    : '<div class="modal-row">暂无项目记录</div>';
  elements.detailModal.classList.add("active");
};

const closeDetailModal = () => {
  elements.detailModal.classList.remove("active");
};

const getEventCatalog = () => {
  const dataEvents = state.data?.events || [];
  const scheduleEvents = (state.schedule?.sports || []).map((sport) => ({
    id: `s-${sport.id}`,
    name: sport.name,
    category: ""
  }));
  const merged = [...dataEvents, ...scheduleEvents];
  const seen = new Set();
  const events = merged.filter((event) => {
    const name = String(event?.name || "").trim();
    if (!name || seen.has(name)) return false;
    seen.add(name);
    return true;
  });
  return { events };
};

const buildSelectOptions = (items, selectedValue, appendCustom = false) => {
  const options = (items.length ? items : ["未配置"])
    .map((item) => `<option value="${item}" ${item === selectedValue ? "selected" : ""}>${item}</option>`)
    .join("");
  if (appendCustom) {
    return options + `<option value="__custom__" ${selectedValue === "__custom__" ? "selected" : ""}>自定义...</option>`;
  }
  return options;
};

const syncEditorRowByCategory = (row, preferredEvent = "") => {
  const eventSelect = row.querySelector(".event-name");
  const catalog = getEventCatalog();
  const events = catalog.events.map((event) => event.name);
  const isCustom = preferredEvent === "__custom__";
  const fallback = preferredEvent && events.includes(preferredEvent) ? preferredEvent : events[0] || "";
  eventSelect.innerHTML = buildSelectOptions(events, isCustom ? "__custom__" : fallback, true);
};

const syncEditorRowByEvent = (row) => {
  const eventSelect = row.querySelector(".event-name");
  const customInput = row.querySelector(".event-custom-input");
  const selectedEvent = eventSelect?.value || "";
  if (customInput) {
    customInput.style.display = selectedEvent === "__custom__" ? "block" : "none";
  }
  syncEditorRowByCategory(row, selectedEvent);
};

const syncEditorRowGrade = (row) => {
  const classInput = row.querySelector(".input-class");
  const gradeInput = row.querySelector(".input-grade");
  if (!classInput || !gradeInput) return;
  const className = formatClassText(classInput.value.trim());
  classInput.value = className;
  gradeInput.value = inferGradeFromClassName(className) || "";
};

const addEditorRow = (record = {}) => {
  const catalog = getEventCatalog();
  const initialEvents = catalog.events.map((event) => event.name);
  const isExistingEvent = record.eventName && initialEvents.includes(record.eventName);
  const initialEvent = isExistingEvent ? record.eventName : (record.eventName ? "__custom__" : initialEvents[0] || "");
  const customValue = !isExistingEvent && record.eventName ? record.eventName : "";
  const first = Number(record.first ?? record.gold ?? 0);
  const second = Number(record.second ?? record.silver ?? 0);
  const third = Number(record.third ?? record.bronze ?? 0);
  const fourth = Number(record.fourth ?? 0);
  const fifth = Number(record.fifth ?? 0);
  const sixth = Number(record.sixth ?? 0);

  const row = document.createElement("div");
  row.className = "table-editor-row";
  row.innerHTML = `
    <div class="event-cell">
      <select class="event-name">${buildSelectOptions(initialEvents, initialEvent, true)}</select>
      <input class="event-custom-input" type="text" placeholder="输入赛事名称" value="${customValue}" style="${initialEvent === "__custom__" ? "" : "display:none;"}">
    </div>
    <input class="input-grade" placeholder="年级(自动)" value="${record.grade || ""}" readonly>
    <input class="input-class" placeholder="班级" value="${record.className || ""}">
    <input placeholder="一" type="number" min="0" value="${Number.isFinite(first) ? first : 0}">
    <input placeholder="二" type="number" min="0" value="${Number.isFinite(second) ? second : 0}">
    <input placeholder="三" type="number" min="0" value="${Number.isFinite(third) ? third : 0}">
    <input placeholder="四" type="number" min="0" value="${Number.isFinite(fourth) ? fourth : 0}">
    <input placeholder="五" type="number" min="0" value="${Number.isFinite(fifth) ? fifth : 0}">
    <input placeholder="六" type="number" min="0" value="${Number.isFinite(sixth) ? sixth : 0}">
    <button class="btn ghost">删除</button>
  `;
  row.querySelector(".event-name")?.addEventListener("change", () => syncEditorRowByEvent(row));
  row.querySelector(".input-class")?.addEventListener("input", () => syncEditorRowGrade(row));
  syncEditorRowGrade(row);
  row.querySelector("button").addEventListener("click", () => row.remove());
  elements.recordEditor.appendChild(row);
};

const getEditorData = () => {
  const rows = [...elements.recordEditor.querySelectorAll(".table-editor-row")];
  return rows.map((row) => {
    const eventSelectValue = row.querySelector(".event-name")?.value?.trim() || "";
    const customEventInput = row.querySelector(".event-custom-input");
    const eventName = eventSelectValue === "__custom__"
      ? (customEventInput?.value?.trim() || "")
      : eventSelectValue;
    const category = getEventCatalog().events.find((event) => event.name === eventName)?.category || "";
    const grade = row.querySelector(".input-grade")?.value?.trim() || "";
    const classNameInput = row.querySelector(".input-class")?.value?.trim() || "";
    const medalInputs = row.querySelectorAll("input[type=number]");
    const className = formatClassText(classNameInput);
    const inferredGrade = inferGradeFromClassName(className);
    const first = Number(medalInputs[0]?.value || 0);
    const second = Number(medalInputs[1]?.value || 0);
    const third = Number(medalInputs[2]?.value || 0);
    const fourth = Number(medalInputs[3]?.value || 0);
    const fifth = Number(medalInputs[4]?.value || 0);
    const sixth = Number(medalInputs[5]?.value || 0);
    return {
      eventName,
      category,
      grade: inferredGrade || normalizeGradeText(grade),
      className,
      first: Number.isFinite(first) ? first : 0,
      second: Number.isFinite(second) ? second : 0,
      third: Number.isFinite(third) ? third : 0,
      fourth: Number.isFinite(fourth) ? fourth : 0,
      fifth: Number.isFinite(fifth) ? fifth : 0,
      sixth: Number.isFinite(sixth) ? sixth : 0
    };
  });
};

const toSafeNumber = (value) => {
  const normalized = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(normalized) && normalized >= 0 ? normalized : 0;
};

const csvEscape = (value) => {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const normalizeHeader = (header = "") =>
  header
    .trim()
    .toLowerCase()
    .replace(/\ufeff/g, "")
    .replace(/[\s_-]+/g, "");

const parseCsv = (text) => {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  const pushCell = () => {
    row.push(current);
    current = "";
  };

  const pushRow = () => {
    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row.map((cell) => cell.trim()));
    }
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ',') {
      pushCell();
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      pushCell();
      pushRow();
      continue;
    }

    current += char;
  }

  pushCell();
  pushRow();

  if (!rows.length) return [];

  const headers = rows[0].map((header) => normalizeHeader(header));
  return rows.slice(1).map((values) => {
    const mapped = {};
    headers.forEach((header, index) => {
      mapped[header] = (values[index] ?? "").trim();
    });
    return mapped;
  });
};

const mapCsvRowToEditorRow = (row) => ({
  eventName: row.eventname || row.event || row.eventtitle || "",
  category: row.category || row.eventcategory || "",
  grade:
    inferGradeFromClassName(formatClassText(row.class || row.classname || row.classno || "")) ||
    normalizeGradeText(row.grade || row.year || ""),
  className: formatClassText(row.class || row.classname || row.classno || ""),
  first: toSafeNumber(row.first || row.gold),
  second: toSafeNumber(row.second || row.silver),
  third: toSafeNumber(row.third || row.bronze),
  fourth: toSafeNumber(row.fourth),
  fifth: toSafeNumber(row.fifth),
  sixth: toSafeNumber(row.sixth)
});

const requiredCsvFields = ["eventName", "className"];

const buildDataFromEditor = () => {
  const editorRows = getEditorData().filter((row) => row.eventName && row.grade && row.className);
  const events = [];
  const records = [];
  const eventIdMap = new Map();
  editorRows.forEach((row, index) => {
    const eventKey = `${row.category}__${row.eventName}`;
    let eventId = eventIdMap.get(eventKey);
    if (!eventId) {
      eventId = `e${eventIdMap.size + 1}`;
      eventIdMap.set(eventKey, eventId);
      events.push({ id: eventId, name: row.eventName, category: row.category });
    }
    records.push({
      eventId,
      grade: inferGradeFromClassName(row.className) || normalizeGradeText(row.grade),
      className: formatClassText(row.className),
      first: row.first,
      second: row.second,
      third: row.third,
      fourth: row.fourth,
      fifth: row.fifth,
      sixth: row.sixth,
      gold: row.first,
      silver: row.second,
      bronze: row.third
    });
  });
  const baseMeta = state.data?.meta || defaultData.meta;
  return {
    meta: {
      title: elements.inputTitle.value.trim() || baseMeta.title,
      subtitle: baseMeta.subtitle,
      date: elements.inputDate.value.trim() || baseMeta.date,
      logoUrl: elements.inputLogo.value.trim() || baseMeta.logoUrl,
      heroUrl: elements.inputHero.value.trim() || baseMeta.heroUrl,
      announcement: elements.inputAnnouncement.value.trim(),
      updatedAt: new Date().toLocaleString("zh-CN")
    },
    settings: state.data?.settings || defaultData.settings,
    events,
    records
  };
};

const exportFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

const handleExportJson = () => {
  const data = buildDataFromEditor();
  exportFile(JSON.stringify(data, null, 2), "medals.json", "application/json");
  elements.exportTip.textContent = "已导出 medals.json。";
};

const handleExportCsv = () => {
  const rows = getEditorData().filter((row) => row.eventName && row.grade && row.className);
  const header = ["event_name", "category", "grade", "class", "first", "second", "third", "fourth", "fifth", "sixth"];
  const lines = rows.map((row) =>
    [
      row.eventName,
      row.category,
      row.grade,
      row.className,
      row.first,
      row.second,
      row.third,
      row.fourth,
      row.fifth,
      row.sixth
    ]
      .map((value) => csvEscape(value))
      .join(",")
  );
  const csv = "\ufeff" + [header.join(","), ...lines].join("\n");
  exportFile(csv, "medals.csv", "text/csv;charset=utf-8");
  elements.exportTip.textContent = `已导出 medals.csv（${rows.length} 行）。`;
};

const handleExportGuide = () => {
  elements.exportTip.textContent =
    "上传说明：将 medals.json 上传到数据源服务器并覆盖原文件。发布后全校同步。";
};

const handleCsvImport = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsedRows = parseCsv(String(reader.result || ""));
      const mappedRows = parsedRows.map(mapCsvRowToEditorRow).filter((row) =>
        requiredCsvFields.every((field) => row[field])
      );

      if (!mappedRows.length) {
        throw new Error("CSV 缺少必填列或无有效数据");
      }

      elements.recordEditor.innerHTML = "";
      mappedRows.forEach((row) => addEditorRow(row));
      elements.csvStatus.textContent = `已导入 ${mappedRows.length} 行（共解析 ${parsedRows.length} 行）`;
    } catch (error) {
      elements.csvStatus.textContent = `导入失败：${error.message}`;
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file, "utf-8");
};

const initAdmin = () => {
  if (!state.admin) return;
  elements.adminPanel.classList.add("active");
  elements.inputTitle.value = state.data.meta.title;
  elements.inputDate.value = state.data.meta.date;
  elements.inputLogo.value = state.data.meta.logoUrl;
  elements.inputHero.value = state.data.meta.heroUrl;
  elements.inputAnnouncement.value = state.data.meta.announcement || "";
  elements.recordEditor.innerHTML = "";
  state.data.records.forEach((record) => {
    const event = state.data.events.find((item) => item.id === record.eventId);
    addEditorRow({
      eventName: event?.name,
      category: event?.category,
      grade: record.grade,
      className: record.className,
      first: record.first ?? record.gold,
      second: record.second ?? record.silver,
      third: record.third ?? record.bronze,
      fourth: record.fourth,
      fifth: record.fifth,
      sixth: record.sixth
    });
  });
  renderScoresSportFilter();
  buildScoresEditor();
};

const handleScoresEditorClick = (event) => {
  const addBtn = event.target.closest(".tt-add-class");
  if (addBtn) {
    const grid = addBtn.previousElementSibling;
    const newRow = document.createElement("div");
    newRow.className = "tt-editor-row tt-custom";
    newRow.innerHTML = `
      <input class="tt-input tt-class-input" type="text" value="" placeholder="如：初一1组2" />
      <label>推挡
        <input class="tt-input tt-pushes" type="number" min="0" placeholder="0" />
      </label>
      <label>失误
        <input class="tt-input tt-misses" type="number" min="0" placeholder="0" />
      </label>
      <button class="btn ghost tt-remove" title="删除">×</button>
    `;
    grid.appendChild(newRow);
    newRow.querySelector(".tt-class-input").focus();
    return;
  }

  const removeBtn = event.target.closest(".tt-remove");
  if (removeBtn) {
    removeBtn.closest(".tt-editor-row")?.remove();
    return;
  }
};

const handleScheduleTabsClick = (event) => {
  const button = event.target.closest(".schedule-tab");
  if (!button) return;
  state.scheduleView = button.dataset.sport;
  state.scheduleToday = false;
  renderSchedule();
  persistUiState();
};

const handleDetailModalClick = (event) => {
  if (event.target === elements.detailModal) closeDetailModal();
};

const handleAddRowClick = () => {
  addEditorRow();
  elements.recordEditor.classList.remove("collapsed");
  if (elements.toggleRecords) elements.toggleRecords.textContent = "收起";
};

const handleToggleRecordsClick = () => {
  const collapsed = elements.recordEditor.classList.toggle("collapsed");
  elements.toggleRecords.textContent = collapsed ? "展开" : "收起";
};

const handleClearRowsClick = () => {
  elements.recordEditor.innerHTML = "";
};

const handleCloseAdminClick = () => {
  elements.adminPanel.classList.remove("active");
};

const bindEvents = () => {
  elements.viewToggle.addEventListener("click", handleViewToggle);
  elements.sortToggle?.addEventListener("change", handleSortChange);
  elements.switchTheme?.addEventListener("click", handleSwitchTheme);
  elements.exportPoster.addEventListener("click", handlePosterExport);
  elements.addRow.addEventListener("click", handleAddRowClick);
  elements.clearRows.addEventListener("click", handleClearRowsClick);
  elements.toggleRecords?.addEventListener("click", handleToggleRecordsClick);
  elements.exportJson.addEventListener("click", handleExportJson);
  elements.exportCsv.addEventListener("click", handleExportCsv);
  elements.exportGuide.addEventListener("click", handleExportGuide);
  elements.csvInput.addEventListener("change", handleCsvImport);
  elements.exportScores?.addEventListener("click", handleExportScores);
  elements.scoresSportFilter?.addEventListener("change", () => buildScoresEditor());
  elements.scoresEditor?.addEventListener("input", handleScoresEditorInput);
  elements.scoresEditor?.addEventListener("change", handleScoresEditorChange);
  elements.scoresEditor?.addEventListener("click", handleScoresEditorClick);
  elements.closeAdmin.addEventListener("click", handleCloseAdminClick);
  elements.tableBody.addEventListener("click", handleRowClick);
  elements.closeDetail.addEventListener("click", closeDetailModal);
  elements.detailModal.addEventListener("click", handleDetailModalClick);
  elements.gradeSelect?.addEventListener("change", handleGradeChange);
  elements.classSelect?.addEventListener("change", handleClassChange);
  elements.scheduleTabs?.addEventListener("click", handleScheduleTabsClick);
  elements.todayToggle?.addEventListener("click", handleTodayToggle);
  window.addEventListener("resize", updateViewButtons);
};

const init = async () => {
  state.admin = isAdminMode();
  initTheme();
  await loadClassConfig();
  const classOptions = state.classConfig?.classes || [];
  const savedClass = localStorage.getItem("medalboard_selected_class");
  const preferred = [savedClass, state.classConfig?.defaultClass, classOptions[0]?.key]
    .find((item) => item && classOptions.some((entry) => normalizeClassKey(entry.key) === normalizeClassKey(item)));
  if (preferred) state.selectedClass = preferred;
  renderClassSelect();
  await loadData();
  await loadSchedule();
  if (preferred) {
    await applyClassSelection(preferred);
  }
  restoreUiState();
  setDefaultGrade();
  renderGradeSelect();
  updateViewButtons();
  if (state.admin) initAdmin();
  render();
  renderSchedule();
  updateTimeBar();
  setInterval(updateTimeBar, 1000 * 30);
  bindEvents();
};

init();
