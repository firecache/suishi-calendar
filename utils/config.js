// 应用配置
export default {
  USE_DEMO: true,        // true = 演示模式（内置模拟天气，开箱即用）；false = 走和风天气
  QWEATHER_KEY: '',      // 和风天气 Web API Key（https://dev.qweather.com 免费申请）
  DEFAULT_CITY: '杭州',  // 默认城市
  WEEK_START: 1,         // 1 = 周一起始，0 = 周日起始
  CITIES: ['杭州', '北京', '上海', '广州', '深圳', '成都', '武汉', '西安', '南京', '重庆', '天津', '苏州', '青岛', '厦门', '长沙', '郑州', '昆明', '合肥', '福州', '济南']  // 城市选择列表
}
