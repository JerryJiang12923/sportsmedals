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
  view: "classes",
  gradeFilter: null,
  admin: false
};

const elements = {
  heroMedia: document.getElementById("heroMedia"),
  heroPrint: document.getElementById("heroPrint"),
  heroTitle: document.getElementById("heroTitle"),
  heroDate: document.getElementById("heroDate"),
  heroMeta: document.getElementById("heroMeta"),
  schoolLogo: document.getElementById("schoolLogo"),
  podium: document.getElementById("podium"),
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
  exportTip: document.getElementById("exportTip")
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
      acc.gold += Number(record.gold) || 0;
      acc.silver += Number(record.silver) || 0;
      acc.bronze += Number(record.bronze) || 0;
      return acc;
    },
    { gold: 0, silver: 0, bronze: 0 }
  );

const calcPoints = (medals, pointsRule) =>
  medals.gold * pointsRule.gold + medals.silver * pointsRule.silver + medals.bronze * pointsRule.bronze;

const groupBy = (items, keyGetter) => {
  return items.reduce((acc, item) => {
    const key = keyGetter(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};

const buildLeaderboard = (data, view, gradeFilter) => {
  const pointsRule = data.settings.points;
  let grouped;
  if (view === "classes") {
    grouped = groupBy(data.records, (record) => `${record.grade} ${record.className}`);
  } else {
    grouped = groupBy(data.records.filter((record) => record.grade === gradeFilter), (record) => record.className);
  }

  const rows = Object.entries(grouped)
    .map(([name, records]) => {
      const medals = sumMedals(records);
      return {
        name,
        medals,
        points: calcPoints(medals, pointsRule)
      };
    })
    .sort((a, b) => {
      if (b.medals.gold !== a.medals.gold) return b.medals.gold - a.medals.gold;
      if (b.medals.silver !== a.medals.silver) return b.medals.silver - a.medals.silver;
      if (b.medals.bronze !== a.medals.bronze) return b.medals.bronze - a.medals.bronze;
      return b.points - a.points;
    });

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
};

const updateHero = (data) => {
  elements.heroTitle.textContent = data.meta.title;
  elements.heroDate.textContent = data.meta.date;
  elements.heroMeta.querySelector(".hero-subtitle").textContent = data.meta.subtitle;
  elements.schoolLogo.src = data.meta.logoUrl;
  elements.heroMedia.style.backgroundImage = `url('${data.meta.heroUrl}')`;
  elements.heroPrint.src = data.meta.heroUrl;
};

const renderPodium = () => {};

const renderTable = (rows) => {
  elements.tableBody.innerHTML = rows
    .map((row, index) => {
      const topClass = row.rank <= 3 ? ` top-${row.rank}` : "";
      return `
        <div class="table-row${topClass}" data-name="${row.name}" style="--i:${index}">
          <span>${row.rank}</span>
          <strong>${row.name}</strong>
          <span class="medal gold">${row.medals.gold}</span>
          <span class="medal silver">${row.medals.silver}</span>
          <span class="medal bronze">${row.medals.bronze}</span>
          <span>${row.points}</span>
        </div>
      `;
    })
    .join("");
};

const renderEvents = () => {};

const render = () => {
  if (!state.data) return;
  updateHero(state.data);
  const gradeFilter = state.view === "within" ? state.gradeFilter || state.data.records[0]?.grade : null;
  state.gradeFilter = gradeFilter;
  const rows = buildLeaderboard(state.data, state.view, gradeFilter);
  renderPodium(rows);
  renderTable(rows);
  renderEvents(state.data);
  if (state.view === "within") {
    elements.viewNote.textContent = gradeFilter ? `当前：${gradeFilter}` : "";
    elements.gradeFilter.style.display = "flex";
    elements.gradeSelect.value = gradeFilter || "";
  } else {
    elements.viewNote.textContent = "";
    elements.gradeFilter.style.display = "none";
  }
};

const updateTimeBar = () => {
  const now = new Date();
  elements.currentTime.textContent = `当前时间：${now.toLocaleString("zh-CN")}`;
  if (state.data?.meta?.updatedAt) {
    elements.lastUpdated.textContent = `最后更新：${state.data.meta.updatedAt}`;
  } else {
    elements.lastUpdated.textContent = "最后更新：--";
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

const handleSwitchTheme = () => {};

const handlePosterExport = () => {
  document.body.classList.add("poster-mode");
  window.setTimeout(() => {
    window.print();
    document.body.classList.remove("poster-mode");
  }, 200);
};

const loadData = async () => {
  const dataUrl = dataUrlFromQuery() || "data/medals.json";
  try {
    const response = await fetch(`${dataUrl}?t=${Date.now()}`);
    if (!response.ok) throw new Error("Failed to fetch data");
    state.data = await response.json();
  } catch (error) {
    state.data = defaultData;
  }
  updateTimeBar();
  render();
};

const setDefaultGrade = () => {
  const savedGrade = localStorage.getItem("medalboard_grade");
  const grades = [...new Set(state.data.records.map((record) => record.grade))];
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
  const grades = [...new Set(state.data.records.map((record) => record.grade))];
  elements.gradeSelect.innerHTML = grades
    .map((grade) => `<option value="${grade}">${grade}</option>`)
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
  const row = event.target.closest(".table-row");
  if (!row) return;
  const name = row.dataset.name;
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
        name: event?.name || "未知项目",
        category: event?.category || "赛事",
        medals
      };
    })
    .sort((a, b) => {
      if (b.medals.gold !== a.medals.gold) return b.medals.gold - a.medals.gold;
      if (b.medals.silver !== a.medals.silver) return b.medals.silver - a.medals.silver;
      return b.medals.bronze - a.medals.bronze;
    });

  elements.detailTitle.textContent = name;
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

const addEditorRow = (record = {}) => {
  const row = document.createElement("div");
  row.className = "table-editor-row";
  row.innerHTML = `
    <input placeholder="项目" value="${record.eventName || ""}">
    <input placeholder="类别" value="${record.category || ""}">
    <input placeholder="年级" value="${record.grade || ""}">
    <input placeholder="班级" value="${record.className || ""}">
    <input placeholder="金" type="number" value="${record.gold || 0}">
    <input placeholder="银" type="number" value="${record.silver || 0}">
    <input placeholder="铜" type="number" value="${record.bronze || 0}">
    <button class="btn ghost">删除</button>
  `;
  row.querySelector("button").addEventListener("click", () => row.remove());
  elements.recordEditor.appendChild(row);
};

const getEditorData = () => {
  const rows = [...elements.recordEditor.querySelectorAll(".table-editor-row")];
  return rows.map((row) => {
    const inputs = row.querySelectorAll("input");
    return {
      eventName: inputs[0].value.trim(),
      category: inputs[1].value.trim(),
      grade: inputs[2].value.trim(),
      className: inputs[3].value.trim(),
      gold: Number(inputs[4].value || 0),
      silver: Number(inputs[5].value || 0),
      bronze: Number(inputs[6].value || 0)
    };
  });
};

const buildDataFromEditor = () => {
  const editorRows = getEditorData().filter((row) => row.eventName && row.grade && row.className);
  const events = [];
  const records = [];
  editorRows.forEach((row, index) => {
    const eventId = `e${index + 1}`;
    events.push({ id: eventId, name: row.eventName, category: row.category });
    records.push({
      eventId,
      grade: row.grade,
      className: row.className,
      gold: row.gold,
      silver: row.silver,
      bronze: row.bronze
    });
  });
  return {
    meta: {
      title: elements.inputTitle.value.trim() || defaultData.meta.title,
      subtitle: defaultData.meta.subtitle,
      date: elements.inputDate.value.trim() || defaultData.meta.date,
      logoUrl: elements.inputLogo.value.trim() || defaultData.meta.logoUrl,
      heroUrl: elements.inputHero.value.trim() || defaultData.meta.heroUrl,
      updatedAt: new Date().toLocaleString("zh-CN")
    },
    settings: defaultData.settings,
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
  const rows = getEditorData();
  const header = "event_name,category,grade,class,gold,silver,bronze";
  const lines = rows.map(
    (row) =>
      `${row.eventName},${row.category},${row.grade},${row.className},${row.gold},${row.silver},${row.bronze}`
  );
  exportFile([header, ...lines].join("\n"), "medals.csv", "text/csv");
  elements.exportTip.textContent = "已导出 medals.csv。";
};

const handleExportGuide = () => {
  elements.exportTip.textContent =
    "上传说明：登录七牛云控制台 -> 对象存储 -> 你的空间 -> 覆盖上传 medals.json。发布后全校同步。";
};

const parseCsv = (text) => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const [headerLine, ...dataLines] = lines;
  const headers = headerLine.split(",").map((header) => header.trim().toLowerCase());
  return dataLines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    return row;
  });
};

const handleCsvImport = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const rows = parseCsv(reader.result);
      elements.recordEditor.innerHTML = "";
      rows.forEach((row) =>
        addEditorRow({
          eventName: row.event_name,
          category: row.category,
          grade: row.grade,
          className: row.class,
          gold: row.gold,
          silver: row.silver,
          bronze: row.bronze
        })
      );
      elements.csvStatus.textContent = `已导入 ${rows.length} 行`;
    } catch (error) {
      elements.csvStatus.textContent = "导入失败，请检查 CSV 格式";
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
      gold: record.gold,
      silver: record.silver,
      bronze: record.bronze
    });
  });
};

const init = async () => {
  state.admin = isAdminMode();
  await loadData();
  setDefaultGrade();
  renderGradeSelect();
  updateViewButtons();
  if (state.admin) initAdmin();
  render();
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
elements.closeAdmin.addEventListener("click", () => elements.adminPanel.classList.remove("active"));
elements.tableBody.addEventListener("click", handleRowClick);
elements.closeDetail.addEventListener("click", closeDetailModal);
elements.detailModal.addEventListener("click", (event) => {
  if (event.target === elements.detailModal) closeDetailModal();
});
elements.gradeSelect.addEventListener("change", handleGradeChange);

init();
