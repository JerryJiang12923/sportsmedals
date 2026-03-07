# 春季运动会奖牌榜

静态站点 + 七牛云 JSON 数据源方案。通过隐藏的管理模式录入数据，导出 `medals.json` 上传七牛云即可同步。

## 使用方式

1. 直接打开 `index.html`
2. 默认读取 `data/medals.json`
3. 若使用七牛云数据源，访问：

```text
/?data=https://你的七牛域名/medals.json
```

## 管理模式

访问以下地址进入管理模式：

```text
/?admin=1
```

可录入奖牌数据，导出 JSON 后上传七牛云覆盖原文件。

## CSV 模板

```text
event_name,category,grade,class,gold,silver,bronze
100米短跑,田径,七年级,7-1,1,0,0
```
