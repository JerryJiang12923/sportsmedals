const defaultData = {
  meta: {
    title: "2026 春季运动会奖牌榜",
    subtitle: "学校春季运动会",
    date: "2026 · 春",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Placeholder_view_vector.svg",
    heroUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=80"
  },
  settings: {
    points: { gold: 3, silver: 2, bronze: 1 }
  },
  events: [
    { id: "e1", name: "100米短跑", category: "田径" },
    { id: "e2", name: "4x100接力", category: "田径" },
    { id: "e3", name: "跳远", category: "田径" }
  ],
  records: [
    { eventId: "e1", grade: "七年级", className: "7-1", gold: 1, silver: 0, bronze: 0 },
    { eventId: "e1", grade: "七年级", className: "7-2", gold: 0, silver: 1, bronze: 0 },
    { eventId: "e2", grade: "八年级", className: "8-1", gold: 1, silver: 0, bronze: 0 },
    { eventId: "e2", grade: "九年级", className: "9-3", gold: 0, silver: 1, bronze: 1 },
    { eventId: "e3", grade: "七年级", className: "7-1", gold: 0, silver: 1, bronze: 1 },
    { eventId: "e3", grade: "八年级", className: "8-2", gold: 1, silver: 0, bronze: 0 }
  ]
};

const state = {
  data: null,
  schedule: null,
  scores: null,
  scheduleView: null,
  view: "classes",
  gradeFilter: null,
  admin: false,
  theme: "dark"
};

const elements = {
  heroMedia: document.getElementById("heroMedia"),
  heroPrint: document.getElementById("heroPrint"),
  heroTitle: document.getElementById("heroTitle"),
  heroDate: document.getElementById("heroDate"),
  heroMeta: document.getElementById("heroMeta"),
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
  switchTheme: document.getElementById("switchTheme"),
  exportPoster: document.getElementById("exportPoster"),
  adminPanel: document.getElementById("adminPanel"),
  closeAdmin: document.getElementById("closeAdmin"),
  inputTitle: document.getElementById("inputTitle"),
  inputDate: document.getElementById("inputDate"),
  inputLogo: document.getElementById("inputLogo"),
  inputHero: document.getElementById("inputHero"),
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
  scoresSportFilter: document.getElementById("scoresSportFilter")
};

const dataUrlFromQuery = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("data");
};

const isAdminMode = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("admin") === "1" || window.location.pathname.endsWith("/admin");
};

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

const handbookPoints = {
  individual: { first: 7, second: 5, third: 4, fourth: 3, fifth: 2, sixth: 1 },
  team: { first: 12, second: 9, third: 7, fourth: 5, fifth: 4, sixth: 3 }
};

const isTeamEventByName = (name = "") => /足球|篮球|排球|拔河|团体|对抗/i.test(String(name));

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
  if (score.note) return String(score.note).trim();
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

const resolveTeamToken = (token, teamMap, resultMap) => {
  const code = String(token || "").trim();
  if (!code) return "待定";
  if (teamMap?.[code]) return teamMap[code];
  if (resultMap?.[code]) return resultMap[code];
  const withWinLose = code.replace(/\d+[WL]/g, (part) => resultMap?.[part] || part);
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

const isChallengeSport = (sportId) => sportId === "table-tennis" || sportId.includes("skill");

const buildResultMap = (sport) => {
  const resultMap = {};
  if (!sport?.teamEvent) return resultMap;
  const matches = (sport.stages || [])
    .flatMap((stage) => stage.matches || [])
    .filter((match) => Number.isFinite(Number(match.matchNo)))
    .sort((a, b) => Number(a.matchNo) - Number(b.matchNo));

  matches.forEach((match) => {
    const score = getMatchScore(match.id);
    if (!score || score.status !== "final") return;
    const matchNo = String(match.matchNo || "").trim();
    if (!matchNo) return;
    const participants = getMatchParticipants(match);
    const teamA = resolveTeamToken(participants[0], sport.teamMap, resultMap);
    const teamB = resolveTeamToken(participants[1], sport.teamMap, resultMap);
    const scoreA = Number(score.scoreA);
    const scoreB = Number(score.scoreB);
    let winner = null;
    if (Number.isFinite(scoreA) && Number.isFinite(scoreB)) {
      if (scoreA > scoreB) winner = 0;
      if (scoreB > scoreA) winner = 1;
      if (scoreA === scoreB) winner = getPenaltyWinnerIndex(score, teamA, teamB);
    } else {
      winner = getPenaltyWinnerIndex(score, teamA, teamB);
    }
    if (winner === 0) {
      resultMap[`${matchNo}W`] = teamA;
      resultMap[`${matchNo}L`] = teamB;
    } else if (winner === 1) {
      resultMap[`${matchNo}W`] = teamB;
      resultMap[`${matchNo}L`] = teamA;
    }
  });
  return resultMap;
};

const scheduleSortRank = (sport) => {
  const id = sport?.id || "";
  const name = sport?.name || "";
  if (id.includes("skill") || name.includes("技巧")) return 80;
  if (id === "football") return 10;
  if (id === "basketball" || id.startsWith("basketball-")) return 20;
  if (id === "volleyball") return 30;
  if (id === "tug-of-war") return 40;
  if (id === "table-tennis") return 50;
  if (id.startsWith("badminton")) return 60;
  if (id === "tennis" || id.startsWith("tennis-")) return 70;
  return 99;
};

const getSportTabLabel = (sport) => {
  const id = sport?.id || "";
  if (id === "basketball-male") return "男篮";
  if (id === "basketball-female") return "女篮";
  if (id === "football-skill") return "足技巧";
  if (id === "basketball-skill") return "篮技巧";
  if (id === "badminton-singles-female") return "羽女单";
  if (id === "badminton-singles-male") return "羽男单";
  if (id === "tennis-female") return "网女单";
  if (id === "tennis-male") return "网男单";
  if (id === "badminton-mixed") return "羽混双";
  if (id === "table-tennis") return "乒乓";
  if (id.includes("skill") || sport?.name?.includes("技巧")) return "技巧赛";
  return sport?.name || "";
};

const getSortedSports = () => {
  const sports = state.schedule?.sports || [];
  return [...sports].sort((a, b) => {
    const rankDiff = scheduleSortRank(a) - scheduleSortRank(b);
    if (rankDiff) return rankDiff;
    return String(a.name || "").localeCompare(String(b.name || ""), "zh-CN");
  });
};

const applyTheme = (theme) => {
  state.theme = theme === "light" ? "light" : "dark";
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

const buildLeaderboard = (data, view, gradeFilter) => {
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
      return {
        name,
        medals,
        points: records.reduce(
          (sum, record) => sum + getRecordPointsByHandbook(record, eventMap.get(record.eventId)),
          0
        )
      };
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.medals.gold !== a.medals.gold) return b.medals.gold - a.medals.gold;
      if (b.medals.silver !== a.medals.silver) return b.medals.silver - a.medals.silver;
      if (b.medals.bronze !== a.medals.bronze) return b.medals.bronze - a.medals.bronze;
      return a.name.localeCompare(b.name, "zh-CN");
    });

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
};

const updateHero = (data) => {
  elements.heroTitle.textContent = formatPanguText(data.meta.title);
  elements.heroDate.textContent = formatPanguText(data.meta.date);
  elements.heroMeta.querySelector(".hero-subtitle").textContent = formatPanguText(data.meta.subtitle);
  elements.schoolLogo.src = data.meta.logoUrl;
  elements.schoolLogo.style.display = data.meta.logoUrl ? "block" : "none";
  elements.heroMedia.style.backgroundImage = `url('${data.meta.heroUrl}')`;
  elements.heroPrint.src = data.meta.heroUrl;
};

const renderTable = (rows) => {
  if (!rows.length) {
    elements.tableBody.innerHTML = '<div class="table-empty">暂无奖牌数据</div>';
    return;
  }

  const allNoMedals = rows.every((row) => (row.medals.gold + row.medals.silver + row.medals.bronze) === 0);
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

  if (allNoMedals) {
    elements.tableBody.insertAdjacentHTML(
      "afterbegin",
      '<div class="table-empty table-empty-soft">暂无奖牌，等待比赛结果更新</div>'
    );
  }
};

const render = () => {
  if (!state.data) return;
  updateHero(state.data);
  const gradeFilter = state.view === "within" ? state.gradeFilter || state.data.records[0]?.grade : null;
  state.gradeFilter = gradeFilter;
  const rows = buildLeaderboard(state.data, state.view, gradeFilter);
  renderTable(rows);
  if (state.view === "within") {
    elements.viewNote.textContent = gradeFilter ? `当前：${formatPanguText(normalizeGradeText(gradeFilter))}` : "";
    elements.gradeFilter.style.display = "flex";
    elements.gradeSelect.value = gradeFilter || "";
  } else {
    elements.viewNote.textContent = "";
    elements.gradeFilter.style.display = "none";
  }
};

const getDayLabel = (day) => {
  if (!state.schedule?.meta?.dayMap) return day ? `D${day}` : "待定";
  const label = state.schedule.meta.dayMap[String(day)];
  return label ? `${label}` : day ? `D${day}` : "待定";
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

const getSportBucketGSegmentCount = (sportId, day) => {
  if (!state.schedule?.sports || !day || !sportId) return 0;
  const dayNumber = Number(day);
  const sport = state.schedule.sports.find((item) => item.id === sportId);
  if (!sport) return 0;
  const sameBucket = (matchDay) => {
    const d = Number(matchDay);
    if (!Number.isFinite(d)) return false;
    if (dayNumber === 5) return d === 5;
    return d >= 1 && d <= 4;
  };
  let maxSlot = 0;
  (sport.stages || []).forEach((stage) => {
    (stage.matches || []).forEach((match) => {
      if (!sameBucket(match.day)) return;
      const indexes = parseGSlotIndexes(match.slot);
      indexes.forEach((index) => {
        if (index > maxSlot) maxSlot = index;
      });
    });
  });
  return maxSlot;
};

const formatMinutes = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const getDynamicGSlotLabel = (sportId, day, slot) => {
  const indexes = parseGSlotIndexes(slot);
  if (!indexes.length) return "";
  const dayNumber = Number(day);
  if (![1, 2, 3, 4, 5].includes(dayNumber)) return "";

  const segmentCount = getSportBucketGSegmentCount(sportId, dayNumber) || Math.max(...indexes);
  if (!segmentCount) return "";

  const startBase = dayNumber === 5 ? 13 * 60 + 30 : 17 * 60;
  const endBase = dayNumber === 5 ? 15 * 60 : 18 * 60;
  const span = endBase - startBase;
  const segmentMinutes = span / segmentCount;
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
  return bySport[slot] || timeSlots.default?.[slot] || slot;
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

const buildMatchCard = (sportId, match, teamEvent, teamMap = {}, resultMap = {}) => {
  const score = getMatchScore(match.id);
  const status = score?.status || "scheduled";
  const note = readMatchNote(score);
  const statusText = status === "delayed" ? "延误" : status === "postponed" ? "推迟" : status === "final" ? "已结束" : "";
  const isAlert = status === "delayed" || status === "postponed";
  const timeLabel = formatPanguText(`${getDayLabel(match.day)} · ${getSlotLabel(sportId, match.slot, match.day)}`);
  const venueLabel = match.venue ? formatPanguText(`场地 ${match.venue}`) : "";
  const participants = getMatchParticipants(match);
  const teamA = resolveTeamToken(participants[0], teamMap, resultMap);
  const teamB = resolveTeamToken(participants[1], teamMap, resultMap);
  const scoreLabel = teamEvent ? getScoreLabel(score) : "不计比分";
  const codeLabel = formatMatchCodeLabel(match.code || "");
  const noteLabel = note ? formatPanguText(note) : "";
  const challengeSport = isChallengeSport(sportId);
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
    <div class="match-card${isAlert ? " is-alert" : ""}">
      <div class="match-top">
        <div class="match-meta">
          <span class="match-time">${timeLabel}</span>
          ${venueLabel ? `<span class="match-venue">${venueLabel}</span>` : ""}
        </div>
        ${statusText ? `<span class="match-status">${statusText}</span>` : ""}
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
  const sports = getSortedSports();
  elements.scheduleTabs.innerHTML = sports
    .map(
      (sport) => `
      <button class="schedule-tab${state.scheduleView === sport.id ? " active" : ""}" data-sport="${sport.id}">
        ${formatPanguText(getSportTabLabel(sport))}
      </button>
    `
    )
    .join("");
};

const renderScheduleBody = () => {
  if (!elements.scheduleBody) return;
  const sport = getSortedSports().find((item) => item.id === state.scheduleView);
  if (!sport) {
    elements.scheduleBody.innerHTML = "<div class=\"schedule-empty\">暂无赛程数据</div>";
    return;
  }

  if (!sport.stages?.length) {
    elements.scheduleBody.innerHTML = '<div class="schedule-empty">暂无赛程数据</div>';
    return;
  }
  const resultMap = buildResultMap(sport);
  const blocks = sport.stages.map((stage) => {
    const stageName = normalizeStageName(stage.name);
    const cards = stage.matches
      .map((match) => buildMatchCard(sport.id, match, sport.teamEvent, sport.teamMap, resultMap))
      .join("");
    return `
      <div class="schedule-stage">
        <div class="stage-title">阶段 ${formatPanguText(stageName)}</div>
        <div class="stage-grid">${cards}</div>
      </div>
    `;
  });

  elements.scheduleBody.innerHTML = blocks.join("") || "<div class=\"schedule-empty\">暂无赛程数据</div>";
};

const renderSchedule = () => {
  if (!state.schedule || !elements.scheduleSection) return;
  if (!state.scheduleView) {
    state.scheduleView = getSortedSports()[0]?.id || null;
  }
  const scoreUpdatedAt = state.scores?.meta?.updatedAt || "--";
  elements.scheduleMeta.textContent = formatPanguText(`比分更新：${scoreUpdatedAt}`);
  renderScheduleTabs();
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
          const teamA = resolveTeamToken(participants[0] || resolveTeamLabel(match.teams?.[0], teamMap), teamMap, resultMap) || "待定";
          const teamB = resolveTeamToken(participants[1] || resolveTeamLabel(match.teams?.[1], teamMap), teamMap, resultMap) || "待定";
          const timeLabel = `${getDayLabel(match.day)} ${getSlotLabel(sport.id, match.slot, match.day)}`;
          const stageName = normalizeStageName(stage.name);
          const note = score.note || score.rescheduledAt || "";
          const challengeSport = isChallengeSport(sport.id);
          const isScoreSport = sport.teamEvent;
          rows.push(`
            <div class="scores-row compact${isScoreSport ? "" : " muted-row"}" data-match-id="${match.id}" data-sport-id="${sport.id}">
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
  `;
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
    const scoreA = parseScoreInputValue(inputs[0]?.value);
    const scoreB = parseScoreInputValue(inputs[1]?.value);
    matches[matchId] = {
      scoreA,
      scoreB,
      status,
      note
    };
  });
  return {
    meta: { updatedAt: new Date().toLocaleString("zh-CN") },
    matches
  };
};

const handleExportScores = () => {
  const data = getScoresEditorData();
  data.meta.updatedAt = new Date().toLocaleString("zh-CN");
  state.scores = data;
  exportFile(JSON.stringify(data, null, 2), "scores.json", "application/json");
  elements.scoresTip.textContent = "已导出 scores.json，请上传并覆盖原文件。";
  renderSchedule();
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
  const rows = buildLeaderboard(state.data, state.view, gradeFilter);
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
    state.data = defaultData;
    state.data.records = (state.data.records || []).map(normalizeRecordIdentity);
  }
  state.data.meta.logoUrl = "data/icon.jfif";
  state.data.meta.heroUrl = "data/hero.jpg";
  updateTimeBar();
  render();
};

const loadSchedule = async () => {
  try {
    const response = await fetch(`data/schedule.json?t=${Date.now()}`);
    if (!response.ok) throw new Error("Failed to fetch schedule");
    state.schedule = await response.json();
  } catch (error) {
    state.schedule = null;
  }

  try {
    const response = await fetch(`data/scores.json?t=${Date.now()}`);
    if (!response.ok) throw new Error("Failed to fetch scores");
    state.scores = await response.json();
  } catch (error) {
    state.scores = { meta: {}, matches: {} };
  }
};

const setDefaultGrade = () => {
  const savedGrade = localStorage.getItem("medalboard_grade");
  const grades = [...new Set((state.data.records || []).map((record) => normalizeRecordIdentity(record).grade))];
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
      const medals = sumMedals(group);
      const event = eventMap.get(eventId);
      return {
        name: formatPanguText(event?.name || "未知项目"),
        category: formatPanguText(event?.category || "赛事"),
        medals
      };
    })
    .sort((a, b) => {
      if (b.medals.gold !== a.medals.gold) return b.medals.gold - a.medals.gold;
      if (b.medals.silver !== a.medals.silver) return b.medals.silver - a.medals.silver;
      return b.medals.bronze - a.medals.bronze;
    });

  elements.detailTitle.textContent = formatLeaderboardName(name, state.view);
  elements.detailSubtitle.textContent = "项目奖牌明细";
  elements.detailBody.innerHTML = lines.length
    ? lines
        .map(
          (line) => `
        <div class="modal-row">
          <span>${line.name} · ${line.category}</span>
          <span>金 ${line.medals.gold} 银 ${line.medals.silver} 铜 ${line.medals.bronze}</span>
        </div>
      `
        )
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

const buildSelectOptions = (items, selectedValue) =>
  (items.length ? items : ["未配置"])
    .map((item) => `<option value="${item}" ${item === selectedValue ? "selected" : ""}>${item}</option>`)
    .join("");

const syncEditorRowByCategory = (row, preferredEvent = "") => {
  const eventSelect = row.querySelector(".event-name");
  const catalog = getEventCatalog();
  const events = catalog.events.map((event) => event.name);
  const fallback = preferredEvent && events.includes(preferredEvent) ? preferredEvent : events[0] || "";
  eventSelect.innerHTML = buildSelectOptions(events, fallback);
};

const syncEditorRowByEvent = (row) => {
  const eventSelect = row.querySelector(".event-name");
  const selectedEvent = eventSelect?.value || "";
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
  const initialEvent = record.eventName && initialEvents.includes(record.eventName)
    ? record.eventName
    : initialEvents[0] || "";
  const first = Number(record.first ?? record.gold ?? 0);
  const second = Number(record.second ?? record.silver ?? 0);
  const third = Number(record.third ?? record.bronze ?? 0);
  const fourth = Number(record.fourth ?? 0);
  const fifth = Number(record.fifth ?? 0);
  const sixth = Number(record.sixth ?? 0);

  const row = document.createElement("div");
  row.className = "table-editor-row";
  row.innerHTML = `
    <select class="event-name">${buildSelectOptions(initialEvents, initialEvent)}</select>
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
    const eventName = row.querySelector(".event-name")?.value?.trim() || "";
    const category = getEventCatalog().events.find((event) => event.name === eventName)?.category || "";
    const grade = row.querySelector(".input-grade")?.value?.trim() || "";
    const classNameInput = row.querySelector(".input-class")?.value?.trim() || "";
    const inputs = row.querySelectorAll("input");
    const className = formatClassText(classNameInput);
    const inferredGrade = inferGradeFromClassName(className);
    const first = Number(inputs[2]?.value || 0);
    const second = Number(inputs[3]?.value || 0);
    const third = Number(inputs[4]?.value || 0);
    const fourth = Number(inputs[5]?.value || 0);
    const fifth = Number(inputs[6]?.value || 0);
    const sixth = Number(inputs[7]?.value || 0);
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
  elements.exportTip.textContent = "已导出 medals.json，请上传到七牛云并覆盖原文件。";
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
  const csv = [header.join(","), ...lines].join("\n");
  exportFile(csv, "medals.csv", "text/csv;charset=utf-8");
  elements.exportTip.textContent = `已导出 medals.csv（${rows.length} 行）。`;
};

const handleExportGuide = () => {
  elements.exportTip.textContent =
    "上传说明：登录七牛云控制台 -> 对象存储 -> 你的空间 -> 覆盖上传 medals.json。发布后全校同步。";
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

const init = async () => {
  state.admin = isAdminMode();
  initTheme();
  await loadData();
  await loadSchedule();
  setDefaultGrade();
  renderGradeSelect();
  updateViewButtons();
  if (state.admin) initAdmin();
  render();
  renderSchedule();
  updateTimeBar();
  setInterval(updateTimeBar, 1000 * 30);
};

elements.viewToggle.addEventListener("click", handleViewToggle);
elements.switchTheme?.addEventListener("click", handleSwitchTheme);
elements.exportPoster.addEventListener("click", handlePosterExport);
elements.addRow.addEventListener("click", () => addEditorRow());
elements.clearRows.addEventListener("click", () => (elements.recordEditor.innerHTML = ""));
elements.exportJson.addEventListener("click", handleExportJson);
elements.exportCsv.addEventListener("click", handleExportCsv);
elements.exportGuide.addEventListener("click", handleExportGuide);
elements.csvInput.addEventListener("change", handleCsvImport);
elements.exportScores?.addEventListener("click", handleExportScores);
elements.scoresSportFilter?.addEventListener("change", () => buildScoresEditor());
elements.closeAdmin.addEventListener("click", () => elements.adminPanel.classList.remove("active"));
elements.tableBody.addEventListener("click", handleRowClick);
elements.closeDetail.addEventListener("click", closeDetailModal);
elements.detailModal.addEventListener("click", (event) => {
  if (event.target === elements.detailModal) closeDetailModal();
});
elements.gradeSelect.addEventListener("change", handleGradeChange);
elements.scheduleTabs?.addEventListener("click", (event) => {
  const button = event.target.closest(".schedule-tab");
  if (!button) return;
  state.scheduleView = button.dataset.sport;
  renderSchedule();
});

init();
