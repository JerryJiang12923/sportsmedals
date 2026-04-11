# 春季运动会奖牌榜

一个用于展示学校运动会奖牌榜和赛程的静态网站。支持奖牌录入、实时比分更新、赛程查看、海报导出等功能。

## 项目简介

本项目为学校春季运动会提供：

- **奖牌榜展示**：全校班级榜/年级榜切换，支持积分/奖牌数/金银牌次序多种排序
- **赛程查看**：按项目分类展示比赛时间、场地、对阵双方，支持"查看今日"快捷筛选
- **实时比分**：比赛结果实时更新，支持计分项目和非计分项目
- **明细查看**：点击班级行可查看各项目贡献明细
- **管理模式**：隐藏的管理界面支持奖牌录入、CSV 导入导出、比分编辑
- **海报导出**：一键导出奖牌榜海报图片

技术特点：

- 纯静态站点，无需后端服务
- 数据存储为 JSON 文件，易于维护
- 支持多年级数据源拆分，按班级自动加载
- 响应式设计，适配桌面和移动端
- 亮/暗主题切换

## 如何使用

### 普通展示

1. 直接打开 `index.html`
2. 默认读取 `data/medals.json`
3. 若使用自定义数据源，访问：

```text
/?data=https://你的域名/medals.json
```

### 管理录入

访问以下地址进入管理模式：

```text
/?admin=1
```

可录入奖牌数据、CSV 导入导出、导出 `medals.json` 后覆盖原文件。

### 页面功能

- 全校班级榜 / 年级榜切换
- 榜单行可点击查看项目贡献明细
- 亮/暗主题切换（自动记忆）
- 海报打印导出

---

## 数据文件结构

### medals.json（奖牌榜数据）

```json
{
  "meta": {
    "title": "2026 春季运动会奖牌榜",
    "subtitle": "学校春季运动会",
    "date": "2026 · 春",
    "logoUrl": "data/icon.jfif",
    "heroUrl": "data/hero.jpg",
    "announcement": "公告内容（可选，显示在赛程上方）",
    "updatedAt": "2026/4/10 07:40:08"
  },
  "settings": {
    "points": { "gold": 3, "silver": 2, "bronze": 1 }
  },
  "events": [
    { "id": "e1", "name": "足球", "category": "球类" }
  ],
  "records": [
    {
      "eventId": "e1",
      "grade": "高一",
      "className": "高一 1 班",
      "first": 1,
      "second": 0,
      "third": 0,
      "fourth": 0,
      "fifth": 0,
      "sixth": 0,
      "gold": 1,
      "silver": 0,
      "bronze": 0
    }
  ]
}
```

**字段说明**：

| 字段 | 说明 |
|------|------|
| `meta.title` | 页面标题 |
| `meta.subtitle` | 副标题（显示在标题下方） |
| `meta.date` | 日期显示文本 |
| `meta.logoUrl` | 校徽图片路径 |
| `meta.heroUrl` | 背景图片路径 |
| `meta.announcement` | 公告内容，显示在赛程上方 |
| `meta.updatedAt` | 数据更新时间 |
| `settings.points` | 积分规则：金/银/铜牌对应积分 |
| `events[].id` | 项目唯一标识 |
| `events[].name` | 项目名称 |
| `events[].category` | 项目类别（可选） |
| `records[].eventId` | 关联的项目 ID |
| `records[].grade` | 年级（如"高一"、"初一"、"中预"） |
| `records[].className` | 班级名称（如"高一 1 班"） |
| `first/second/third` | 第一/二/三名数量 |
| `fourth/fifth/sixth` | 第四/五/六名数量（不计奖牌但计积分） |
| `gold/silver/bronze` | 金/银/铜牌数量（与 first/second/third 互为别名） |

---

### class-config.json（班级路由配置）

```json
{
  "defaultClass": "高一1",
  "groups": {
    "prep": {
      "name": "中预",
      "schedule": ["data/schedule-prep.json"],
      "scores": ["data/scores-prep.json"]
    },
    "j1": {
      "name": "初一",
      "schedule": ["data/schedule-j1.json"],
      "scores": ["data/scores-j1.json"]
    },
    "j2": {
      "name": "初二",
      "schedule": ["data/schedule-j2.json"],
      "scores": ["data/scores-j2.json"]
    },
    "high": {
      "name": "高中",
      "schedule": ["data/schedule-high.json"],
      "scores": ["data/scores-high.json"]
    }
  },
  "classes": [
    { "key": "高一1", "label": "高一 1 班", "group": "high" },
    { "key": "初一1", "label": "初一 1 班", "group": "j1" },
    { "key": "中预1", "label": "中预 1 班", "group": "prep" }
  ]
}
```

**字段说明**：

| 字段 | 说明 |
|------|------|
| `defaultClass` | 默认选中的班级 key |
| `groups` | 年级组配置，每个组有独立的赛程/比分文件 |
| `groups[].name` | 年级组显示名称 |
| `groups[].schedule` | 该年级组的赛程 JSON 文件路径（数组，可多个） |
| `groups[].scores` | 该年级组的比分 JSON 文件路径（数组，可多个） |
| `classes[].key` | 班级标识（用于匹配赛程队伍代号） |
| `classes[].label` | 班级显示名称 |
| `classes[].group` | 所属年级组（对应 groups 的 key） |

---

### schedule.json（赛程数据）

```json
{
  "meta": {
    "title": "赛程",
    "startDate": "3.23",
    "dayMap": {
      "1": "3.23",
      "2": "3.24",
      "3": "3.25"
    },
    "timeSlots": {
      "default": {
        "G1": "17:00-17:30",
        "G2": "17:30-18:00"
      },
      "football": {
        "G1": "17:00-17:30",
        "G2": "17:30-18:00"
      }
    },
    "updatedAt": "2026-03-18 20:28"
  },
  "sports": [
    {
      "id": "football",
      "name": "足球",
      "teamEvent": true,
      "teamMap": {
        "A": "高一1",
        "B": "高二3",
        "C": "高一6"
      },
      "stages": [
        {
          "name": "一",
          "matches": [
            {
              "id": "football-1",
              "matchNo": "1",
              "code": "1/AB",
              "day": 1,
              "slot": "G1",
              "venue": "A1",
              "teams": [
                { "code": "A", "name": "高一1" },
                { "code": "B", "name": "高二3" }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**字段说明**：

| 字段 | 说明 |
|------|------|
| `meta.dayMap` | 天数到日期的映射，如 `{ "1": "3.23" }` 表示第1天是3月23日 |
| `meta.timeSlots` | 时间段配置，按项目 ID 分类，`default` 为默认时间段 |
| `sports[].id` | 项目唯一标识 |
| `sports[].name` | 项目名称 |
| `sports[].teamEvent` | 是否为计分项目（true: 显示比分输入，false: 显示胜者选择） |
| `sports[].teamMap` | 队伍代号映射，如 `{ "A": "高一1" }` 表示代号 A 对应高一1班 |
| `stages[].name` | 阶段名称（如"一"、"二"、"半决赛"） |
| `matches[].id` | 比赛 ID，用于关联 scores.json 中的比分 |
| `matches[].matchNo` | 场次编号（显示用） |
| `matches[].code` | 对阵编码（显示用，如"1/AB"表示第1场 A vs B） |
| `matches[].day` | 赛程天数（对应 dayMap） |
| `matches[].slot` | 时间段（对应 timeSlots，如 G1、G2） |
| `matches[].venue` | 场地（如 A1、A2） |
| `teams[].code` | 队伍代号 |
| `teams[].name` | 队伍名称（可留空，由 teamMap 自动解析） |

**特殊队伍编码说明**：

| 编码 | 说明 |
|------|------|
| `1W` / `2W` | 第1场/第2场的胜者 |
| `1L` / `2L` | 第1场/第2场的败者 |
| `123U1` | 第1/2/3场的第1名（用于循环赛排名） |
| `123U2` | 第1/2/3场的第2名 |
| `待定` | 占位符，比赛结果后自动替换为实际队伍 |

---

### scores.json（比分数据）

```json
{
  "meta": {
    "updatedAt": "2026/4/2 19:22:55"
  },
  "matches": {
    "football-1": {
      "scoreA": 1,
      "scoreB": 0,
      "status": "final",
      "note": "",
      "winner": ""
    },
    "basketball-skill-m-1": {
      "scoreA": null,
      "scoreB": null,
      "status": "final",
      "note": "4.2 17:00",
      "winner": "A"
    }
  },
  "tableTennis": {
    "高一1": { "pushes": 10, "misses": 2 },
    "高二3": { "pushes": 8, "misses": 3 }
  }
}
```

**字段说明**：

| 字段 | 说明 |
|------|------|
| `matches[matchId].scoreA` | 左侧队伍得分 |
| `matches[matchId].scoreB` | 右侧队伍得分 |
| `matches[matchId].status` | 比赛状态 |
| `matches[matchId].note` | 备注（如改期时间、弃赛说明、点球比分） |
| `matches[matchId].winner` | 非计分项目的胜者标识（"A" 或 "B"） |
| `tableTennis` | 乒乓球推挡统计数据，按班级记录 |

**status 状态值**：

| 状态 | 说明 |
|------|------|
| `scheduled` | 未开始 |
| `final` | 已结束 |
| `delayed` | 延误（时间未确定） |
| `postponed` | 推迟（在 note 中填写新时间，如 "4.2 17:00"） |

**note 备注**：
- 改期格式：`"4.2"` 或 `"改期至 4.2"`（会自动解析并显示）
- 点球格式：`"点球 3 - 1"` 或 `"点球0 - 1"`
- 弃赛说明：`"高一VCE弃赛"`、`"双方弃赛"`

---

## CSV 模板

```text
event_name,category,grade,class,first,second,third,fourth,fifth,sixth
100米短跑,田径,七年级,7-1,1,0,0,0,0,0
足球,球类,高一,高一 1 班,0,1,1,1,0,0
```

**列说明**：

| 列名 | 必填 | 说明 |
|------|------|------|
| `event_name` | 是 | 项目名称 |
| `category` | 否 | 项目类别 |
| `grade` | 是 | 年级（自动从班级名推断） |
| `class` | 是 | 班级名称 |
| `first` | 否 | 第一名数量（默认 0） |
| `second` | 否 | 第二名数量（默认 0） |
| `third` | 否 | 第三名数量（默认 0） |
| `fourth` | 否 | 第四名数量（默认 0） |
| `fifth` | 否 | 第五名数量（默认 0） |
| `sixth` | 否 | 第六名数量（默认 0） |

---

## 我的班级自动筛选

- 页面顶部可选择"我的班级"（中预 1-10、初一 1-8、初二 1-8、高一/高二 含 VCE）
- 选择后会自动加载对应赛程/比分 JSON：
  - 中预：仅中预赛程
  - 初一：仅初一赛程
  - 初二：仅初二赛程
  - 高一/高二：统一加载高中赛程
- 赛程卡片中，本班相关比赛会高亮显示
- 奖牌榜仍保持混合展示

也可通过查询参数手动指定数据源（多文件逗号分隔）：

```text
/?schedule=data/schedule-j1.json,data/schedule-j2.json&scores=data/scores-j1.json,data/scores-j2.json
```

---

## 文件清单

| 文件 | 说明 |
|------|------|
| `index.html` | 主页面 |
| `app.js` | 应用逻辑 |
| `styles.css` | 样式文件 |
| `data/medals.json` | 奖牌榜数据 |
| `data/class-config.json` | 班级路由配置 |
| `data/schedule-*.json` | 各年级赛程数据 |
| `data/scores-*.json` | 各年级比分数据 |
| `data/icon.jfif` | 校徽图片 |
| `data/hero.jpg` | 背景图片 |