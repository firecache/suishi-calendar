# 岁时历（Suishi Calendar）

> 一个看**日期 · 农历 · 节气 · 节日 · 天气**一屏搞定的日历 App。
> 基于 **uni-app（Vue 3）**，用 **HBuilderX** 直接云打包 **Android / iOS**。

「岁时历」把公历、农历、24 节气、传统节日与天气预报收敛到一个首屏：月历格子内直接标注农历与节气/节日，顶部今日天气卡 + 日详情页 7 日预报。农历为**纯本地计算，离线可用**。

---

## 目录结构

```
suishi-calendar/
├── pages/                    # uni-app 页面
│   ├── index/index.vue       # 月历首页（核心）
│   ├── day/day.vue           # 日详情（干支/生肖/节气/节日 + 天气）
│   └── settings/settings.vue # 设置（城市/天气源/周起始日/主题）
├── utils/
│   ├── lunar.js              # 农历/干支/生肖/节气/节日本地计算（1900–2100）
│   ├── weather.js            # 天气（和风天气 QWeather + 演示降级）
│   └── config.js             # 应用配置（天气 Key / 演示开关 / 默认城市）
├── App.vue                   # 根组件（全局主题变量）
├── main.js                   # 入口（Vue3）
├── manifest.json             # 应用配置（名称/图标/appid/双端权限）
├── pages.json                # 路由
├── uni.scss                  # 全局颜色变量
├── PRD.md                    # 产品需求文档
├── DESIGN.md                 # 设计系统（令牌 + 规则）
├── preview.html              # 设计原型（浏览器直接打开可交互预览）
└── README.md
```

---

## 快速开始（HBuilderX）

1. **打开**：HBuilderX → `文件 → 打开目录`，选择本项目根目录（含 `manifest.json` 的这一层）。
2. **运行预览**：
   - 浏览器预览：`运行 → 运行到浏览器 → Chrome`（快速看效果）。
   - 真机预览：手机装 HBuilderX App，`运行 → 运行到手机或模拟器`。
3. **打包 Android**：`发行 → 原生App-云打包`，选 Android，填包名/证书（可勾选「公共测试证书」先试跑）。
4. **打包 iOS**：`发行 → 原生App-云打包`，选 iOS，需苹果开发者证书与描述文件（测试可用「越狱包/开发证书」，正式上架需企业/App Store 证书）。

> 提示：首次打包请在 `manifest.json` 里把 `appid` 换成你自己的（HBuilderX 会提示「重新获取」）。

---

## 天气数据配置（和风天气）

默认**演示模式**（内置模拟天气，无需任何 Key 即可跑通）。接入真实天气：

1. 到 [和风天气控制台](https://dev.qweather.com) 注册，创建应用，复制 **Web API Key**（免费版够用）。
2. 打开 `utils/config.js`，填入：
   ```js
   USE_DEMO: false,
   QWEATHER_KEY: '你的Key',
   DEFAULT_CITY: '杭州',
   ```
3. 真机运行时，若请求被拦，确认 `manifest.json` 中已声明 `devapi.qweather.com` / `geoapi.qweather.com` 域名白名单。

---

## 农历说明

- `utils/lunar.js` 实现公历 ↔ 农历、天干地支纪年/月/日、生肖、24 节气、农历/公历节日，支持 **1900–2100**。
- 已用独立参考库逐日校验（3.2 万+ 字段级断言通过）；节气为分钟级近似算法，极少数节气交界日可能 ±1 天（属已知可接受误差）。

---

## 设计规范

- `DESIGN.md`：完整设计令牌与规则（配色 / 字体 / 组件 / 留白 / 深色模式 / Do & Don't）。
- `preview.html`：高保真交互原型，浏览器打开即可点选日期、切月、查看三屏。

## 后续路线（见 PRD 里程碑）

- M2：农历主视图、天气缓存、节日倒计时、深色细化。
- M3：提醒推送、桌面小部件、黄历宜忌。
