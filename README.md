# 春季运动会奖牌榜

静态站点 + 七牛云 JSON 数据源方案。通过隐藏的管理模式录入数据，导出 `medals.json` 上传七牛云即可同步。

## 你可以怎么用（含管理模式）

### 普通展示

1. 直接打开 `index.html`
2. 默认读取 `data/medals.json`
3. 若使用七牛云数据源，访问：

```text
/?data=https://你的七牛域名/medals.json
```

### 管理录入（导出 JSON 覆盖线上）

访问以下地址进入管理模式：

```text
/?admin=1
```

可录入奖牌数据、CSV 导入导出、导出 `medals.json` 后上传七牛云覆盖原文件。

### 页面功能

- 全校班级榜 / 年级榜切换
- 榜单行可点击查看项目贡献明细
- 亮/暗主题切换（自动记忆）
- 海报打印导出

## CSV 模板

```text
event_name,category,grade,class,gold,silver,bronze
100米短跑,田径,七年级,7-1,1,0,0
```

## 赛程与比分

赛程与比分支持按学部/年级拆分多个 JSON 文件，前端会根据“我的班级”自动加载对应文件。

默认文件：

- `data/class-config.json`：班级与数据源路由配置（核心）
- `data/schedule-high.json` / `data/scores-high.json`：高中（高一+高二）
- `data/schedule-j1.json` / `data/scores-j1.json`：初一
- `data/schedule-j2.json` / `data/scores-j2.json`：初二
- `data/schedule-prep.json` / `data/scores-prep.json`：中预（目前占位，待体育部发布）

兼容旧文件：

- `data/schedule.json`：赛程与时间段（由赛程表生成后可直接修改）
- `data/scores.json`：实时比分与状态（可直接修改并覆盖上传）

`data/medals.json` 仍是奖牌榜数据源，三个文件建议统一放在同一 CDN/同一路径下，便于同时更新。

管理模式（`/?admin=1`）已增加“赛程比分”编辑区，支持导出 `scores.json`。

### schedule.json 结构（摘要）

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
      "stages": [
        { "name": "一", "matches": [ { "id": "football-1", "day": 1, "slot": "G1" } ] }
      ]
    }
  ]
}
```

### scores.json 结构（摘要）

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

状态值说明：

- `scheduled`：未开始
- `final`：已结束
- `delayed`：延误
- `postponed`：推迟（可填写 `rescheduledAt` 如 "3.25 15:30"）

### 时间段与日期

`schedule.json` 中的 `meta.startDate` 与 `meta.dayMap` 控制 D1/D2 的真实日期；
`meta.timeSlots` 控制各项目 G1/G2 的具体时间段。当前时间段为占位值，后续可直接修改。

## 我的班级自动筛选

- 页面顶部可选择“我的班级”（中预 1-10、初一 1-8、初二 1-8、高一/高二 含 VCE）
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
