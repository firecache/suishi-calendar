// 天气数据源：和风天气 QWeather（v7）+ 演示模式降级
// 统一返回结构，页面直接渲染。
import config from './config.js'

const GEO_URL = 'https://geoapi.qweather.com/v2/city/lookup'
const NOW_URL = 'https://devapi.qweather.com/v7/weather/now'
const FORECAST_URL = 'https://devapi.qweather.com/v7/weather/7d'

// 天气现象 → 图标（unicode，跨端通用，避免引入图片资源）
const ICON_MAP = {
  晴: '☀', 多云: '⛅', 阴: '☁', 小雨: '🌦', 中雨: '🌧', 大雨: '🌧', 暴雨: '🌧',
  雷阵雨: '⛈', 雪: '❄', 雨夹雪: '🌨', 雾: '🌫', 霾: '🌫', 扬沙: '🌪'
}
function iconOf(text) {
  for (const k in ICON_MAP) { if (text && text.indexOf(k) >= 0) return ICON_MAP[k] }
  return '🌤'
}

// —— 确定性模拟天气（与 preview.html 一致，保证同日期结果稳定）——
const KIND_POOL = ['晴', '多云', '多云', '阴', '小雨', '晴', '多云', '中雨', '雷阵雨', '晴', '多云', '雪']
const MONTH_BASE = [2, 5, 12, 18, 24, 28, 30, 29, 25, 19, 11, 5]
function seeded(y, m, d) {
  let s = y * 10000 + m * 100 + d
  return function () { s = (s * 9301 + 49297) % 233280; return s / 233280 }
}
function mockDay(y, m, d) {
  const rnd = seeded(y, m, d)
  const text = KIND_POOL[Math.floor(rnd() * KIND_POOL.length)]
  const base = MONTH_BASE[m - 1]
  const tempMax = Math.round(base + rnd() * 6)
  const tempMin = Math.round(tempMax - 6 - rnd() * 4)
  const aqi = 30 + Math.floor(rnd() * 80)
  const aqiText = aqi <= 50 ? '优' : aqi <= 100 ? '良' : '轻度污染'
  return {
    text, icon: iconOf(text), tempMax, tempMin, aqi, aqiText,
    feels: tempMax + (text === '晴' ? 1 : -1),
    humidity: 40 + Math.floor(rnd() * 40),
    windDir: '东南风', windScale: '2级'
  }
}

function nowFromMock(city) {
  const d = new Date()
  const m = mockDay(d.getFullYear(), d.getMonth() + 1, d.getDate())
  return {
    city, icon: m.icon, text: m.text,
    temp: m.tempMax, feels: m.feels, humidity: m.humidity,
    windDir: m.windDir, windScale: m.windScale, aqi: m.aqi, aqiText: m.aqiText
  }
}
function forecastFromMock() {
  const d = new Date()
  const list = []
  for (let i = 0; i < 7; i++) {
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)
    const m = mockDay(t.getFullYear(), t.getMonth() + 1, t.getDate())
    list.push({
      date: `${t.getMonth() + 1}-${t.getDate()}`,
      text: m.text, icon: m.icon, tempMax: m.tempMax, tempMin: m.tempMin,
      windDir: m.windDir, windScale: m.windScale, humidity: m.humidity
    })
  }
  return list
}

// —— 和风天气请求 ——
function request(url, data) {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      data,
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === '200') resolve(res.data)
        else reject(new Error((res.data && res.data.code) || res.statusCode))
      },
      fail: (e) => reject(e)
    })
  })
}

// 读取运行时偏好（设置页写入），回退到 config.js 默认值
function useDemo() {
  const v = uni.getStorageSync('useDemo')
  if (v === '' || v === null || v === undefined) return config.USE_DEMO
  return !!v
}
function apiKey() {
  return uni.getStorageSync('qweatherKey') || config.QWEATHER_KEY
}

async function locationId(city) {
  const res = await request(GEO_URL, { location: city, key: apiKey() })
  const loc = res.location && res.location[0]
  return loc ? loc.id : null
}

// 当前天气（city: 城市名）
export async function getNow(city) {
  city = city || config.DEFAULT_CITY
  if (useDemo() || !apiKey()) return nowFromMock(city)
  try {
    const id = await locationId(city)
    if (!id) return nowFromMock(city)
    const res = await request(NOW_URL, { location: id, key: apiKey() })
    const n = res.now
    return {
      city, icon: iconOf(n.text), text: n.text,
      temp: n.temp, feels: n.feelsLike, humidity: n.humidity,
      windDir: n.windDir, windScale: n.windScale, aqi: '', aqiText: ''
    }
  } catch (e) {
    return nowFromMock(city) // 失败降级
  }
}

// 7 日预报
export async function getForecast7d(city) {
  city = city || config.DEFAULT_CITY
  if (useDemo() || !apiKey()) return forecastFromMock()
  try {
    const id = await locationId(city)
    if (!id) return forecastFromMock()
    const res = await request(FORECAST_URL, { location: id, key: apiKey() })
    return (res.daily || []).map((it) => ({
      date: `${it.fxMonth}-${it.fxDate}`,
      text: it.textDay, icon: iconOf(it.textDay), tempMax: it.tempMax, tempMin: it.tempMin,
      windDir: it.windDirDay, windScale: it.windScaleDay, humidity: it.humidity
    }))
  } catch (e) {
    return forecastFromMock()
  }
}

// 逆地理编码：经纬度 → 城市名（真实模式 + key 时可用；demo/无 key 返回 null）
export async function reverseGeoCity(lat, lon) {
  if (useDemo() || !apiKey()) return null
  try {
    const res = await request(GEO_URL, { location: `${lon},${lat}`, key: apiKey() })
    const loc = res.location && res.location[0]
    return loc && loc.name ? loc.name : null
  } catch (e) {
    return null
  }
}

// 图标辅助（供页面复用）
export { iconOf }
