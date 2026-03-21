# 赛程与比分改造工作记录

本文件用于交接下一个助手，记录本次会话完成的所有关键变更、数据结构与后续注意事项。

## 已完成内容

### 1) 赛程数据已从 Excel 转换为 JSON

- 原始文件：`高中赛程表.xlsx`
- 解析产物：`data/schedule.json`
- 自动生成了 `dayMap`（D1=3.23 起顺推）与 `timeSlots`（G 时间段占位，可改）
- `sports` 列表包含：足球类、篮球类、排球类、乒乓球、羽毛球混双、羽毛球单打、网球类、拔河
- W = win，U = 循环赛占位；字母 A/B/C…为班级映射

### 2) 新增实时比分 JSON

- 文件：`data/scores.json`
- 仅集体赛（足/篮/排/拔河）生成比分条目
- 支持状态：`scheduled` / `final` / `delayed` / `postponed`
- 推迟/延误时可填写 `rescheduledAt`（如 `3.25 15:30`）

### 3) 页面新增赛程显示（Apple Sports 风格）

- 结构：`index.html` 新增 `section.schedule`
- UI 组成：项目 tabs + 分阶段卡片列表
- 集体赛显示比分；个人赛显示“不计比分”
- 延误/推迟高亮显示，并展示改期时间

### 4) 管理面板新增比分编辑区

- 入口：`/?admin=1`
- 功能：编辑比分 + 状态 + 改期时间，并导出 `scores.json`
- 位置：`index.html` 管理面板内新增“赛程比分”区

## 修改文件清单

- `index.html`
  - 新增赛程区块：`#scheduleSection`、`#scheduleTabs`、`#scheduleBody`
  - 管理面板新增 `scoresEditor`、`exportScores`

- `app.js`
  - 新增 state: `schedule`, `scores`, `scheduleView`
  - 新增元素引用：`scheduleTabs/scheduleBody/scheduleMeta/scoresEditor/...`
  - 新增加载：`loadSchedule()`
  - 新增渲染：`renderSchedule()`, `buildMatchCard()` 等
  - 新增编辑器：`buildScoresEditor()`, `handleExportScores()`
  - 页面初始化时加载赛程+比分

- `styles.css`
  - 新增赛程区块与卡片样式（Apple Sports 风格）
  - 新增管理面板比分编辑器样式
  - 增加 880/640 响应式适配

- `README.md`
  - 新增赛程与比分的 JSON 结构说明
  - 说明管理面板支持导出 `scores.json`

- `data/schedule.json`
- `data/scores.json`

## 数据结构摘要

### schedule.json

```json
{
  "meta": {
    "startDate": "3.23",
    "dayMap": { "1": "3.23" },
    "timeSlots": { "football": { "G1": "17:00-17:30" } }
  },
  "sports": [
    {
      "id": "football",
      "name": "足球",
      "teamEvent": true,
      "teamMap": { "A": "高一VCE" },
      "stages": [
        { "name": "一", "matches": [ { "id": "football-1", "day": 1, "slot": "G1" } ] }
      ]
    }
  ]
}
```

### scores.json

```json
{
  "matches": {
    "football-1": {
      "scoreA": 1,
      "scoreB": 0,
      "status": "final",
      "rescheduledAt": ""
    }
  }
}
```

## 关键规则与约定

- D 表示第几天；当前已把 D1 映射为 `3.23`
- G 表示时间段；当前填的是占位时间（17:00-18:00 分段）
- A 表示场地编号（如 `A1`, `A2`）
- `1/AB` 表示第 1 场，A vs B
- W = win（胜者），U = 循环赛占位
- 个人赛不显示比分

## 尚待完善/可选优化

- 把各项目真实的 G 时间段写入 `data/schedule.json -> meta.timeSlots`
- 如果需要把 U/W 占位进一步映射为具体班级，可扩展 `teamMap` 或新增规则表
- 如果需要“赛程编辑”而非仅比分编辑，可增加 schedule 的可视化编辑器

## 注意事项

- 本仓库无构建/测试命令
- 静态站点：直接打开 `index.html` 或用 `python -m http.server`
