<template>
  <view class="page" :class="themeClass" :style="{ paddingTop: statusBarHeight + 'px' }">
    <swiper class="swiper" :current="tab" :duration="250" @change="onSwipeChange">
      <!-- ① 日历 -->
      <swiper-item>
        <scroll-view scroll-y class="tab-panel">
          <view class="cal-head">
            <picker mode="date" fields="month" :value="pickerValue" :start="'1900-01'" :end="'2100-12'" @change="onPickMonth">
              <view class="ym">
                <view class="ym-row">
                  <text class="ym-title">{{ year }}年{{ month }}月</text>
                  <text class="ym-caret">▾</text>
                </view>
                <text class="ym-lunar">{{ lunarYearLabel }}</text>
              </view>
            </picker>
            <view class="nav">
              <view class="nav-btn" @click="prevMonth">‹</view>
              <view class="today-btn" @click="goToday">今</view>
              <view class="nav-btn" @click="nextMonth">›</view>
              <view class="nav-btn gear" @click="openSettings">⚙</view>
            </view>
          </view>

          <view class="week-row">
            <text v-for="(w, i) in weekLabels" :key="i" class="week-item" :class="{ weekend: i >= 5 }">{{ w }}</text>
          </view>

          <view class="grid">
            <view
              v-for="(cell, i) in cells"
              :key="i"
              class="cell"
              :class="cell.cls"
              @click="openDay(cell)"
            >
              <text class="solar">{{ cell.d }}</text>
              <text v-if="cell.holiday" class="holiday" :class="cell.holidayCls">{{ cell.holiday }}</text>
              <text class="lunar">{{ cell.lunar }}</text>
              <text v-if="cell.mark" class="mark" :class="cell.markCls">{{ cell.mark }}</text>
            </view>
          </view>
        </scroll-view>
      </swiper-item>

      <!-- ② 天气 -->
      <swiper-item>
        <scroll-view scroll-y class="tab-panel weather-panel">
          <view class="w-head">
            <picker mode="selector" :range="cities" @change="onCityChange">
              <view class="w-city-row">
                <text class="w-city">{{ city }}</text>
                <text class="w-caret">▾</text>
              </view>
            </picker>
            <view class="w-actions">
              <text class="w-gear" @click="locate">📍</text>
              <text class="w-gear" @click="openSettings">⚙</text>
            </view>
          </view>

          <view class="w-hero">
            <text class="w-hero-icon">{{ weather.icon }}</text>
            <text class="w-hero-temp serif">{{ weather.temp }}°</text>
            <text class="w-hero-desc">{{ weather.text }} · 体感 {{ weather.feels }}°</text>
          </view>

          <view class="w-metrics">
            <view class="w-metric">
              <text class="w-m-label">体感</text>
              <text class="w-m-val">{{ weather.feels }}°</text>
            </view>
            <view class="w-metric">
              <text class="w-m-label">湿度</text>
              <text class="w-m-val">{{ weather.humidity }}%</text>
            </view>
            <view class="w-metric">
              <text class="w-m-label">风力</text>
              <text class="w-m-val">{{ weather.windDir }}{{ weather.windScale }}</text>
            </view>
            <view class="w-metric">
              <text class="w-m-label">空气</text>
              <text class="w-m-val">{{ weather.aqiText || '—' }}</text>
            </view>
          </view>

          <view class="sec-title">近 7 天预报</view>
          <view class="forecast">
            <view v-for="(f, i) in forecast" :key="i" class="f-row">
              <view class="f-day">
                <text class="f-week">{{ f.week }}</text>
                <text class="f-date">{{ f.date }}</text>
              </view>
              <text class="f-icon">{{ f.icon }}</text>
              <view class="f-mid">
                <text class="f-text">{{ f.text }}</text>
                <text class="f-meta">{{ f.windDir }}{{ f.windScale }} · 湿度 {{ f.humidity }}%</text>
              </view>
              <view class="f-temp">
                <text class="lo">{{ f.tempMin }}°</text>
                <text class="slash">/</text>
                <text class="hi">{{ f.tempMax }}°</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </swiper-item>
    </swiper>

    <!-- 底部 tab -->
    <view class="tabbar">
      <view class="tab" :class="{ active: tab === 0 }" @click="switchTab(0)">
        <text class="tab-ico">▦</text>
        <text>日历</text>
      </view>
      <view class="tab" :class="{ active: tab === 1 }" @click="switchTab(1)">
        <text class="tab-ico">☀</text>
        <text>天气</text>
      </view>
    </view>
  </view>
</template>

<script>
import Lunar from '@/utils/lunar.js'
import { getNow, getForecast7d, reverseGeoCity } from '@/utils/weather.js'
import { getHolidayType } from '@/utils/holiday.js'
import config from '@/utils/config.js'

const WEEK = ['一', '二', '三', '四', '五', '六', '日']
const WEEK7 = ['日', '一', '二', '三', '四', '五', '六']

export default {
  data() {
    const now = new Date()
    return {
      statusBarHeight: 20,
      tab: 0,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      today: { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() },
      weekStart: 1,
      cells: [],
      cities: config.CITIES,
      city: '杭州',
      weather: { icon: '🌤', text: '加载中', temp: '--', feels: '--', humidity: '--', windDir: '', windScale: '', aqiText: '' },
      forecast: []
    }
  },
  computed: {
    themeClass() {
      const t = getApp().globalData.theme || 'system'
      return t === 'dark' ? 'theme-dark' : t === 'light' ? 'theme-light' : ''
    },
    weekLabels() {
      return this.weekStart === 0 ? ['日', '一', '二', '三', '四', '五', '六'] : WEEK
    },
    lunarYearLabel() {
      const info = Lunar.getDateInfo(this.year, this.month, 1)
      return info.supported ? info.yearGanZhi + '年 · 属' + info.zodiac : ''
    },
    pickerValue() {
      return this.year + '-' + String(this.month).padStart(2, '0')
    }
  },
  onLoad() {
    const sys = uni.getSystemInfoSync()
    this.statusBarHeight = sys.statusBarHeight || 20
    this.weekStart = getApp().globalData.weekStart
  },
  onShow() {
    this.weekStart = getApp().globalData.weekStart
    this.city = getApp().globalData.city
    this.buildCells()
    this.loadWeather()
  },
  methods: {
    buildCells() {
      const y = this.year, m = this.month
      const first = new Date(y, m - 1, 1)
      const offset = (first.getDay() - this.weekStart + 7) % 7
      const dim = new Date(y, m, 0).getDate()
      const cells = []
      const prevDim = new Date(y, m - 1, 0).getDate()
      for (let i = offset - 1; i >= 0; i--) {
        let pd = prevDim - i, pm = m - 1, py = y
        if (pm === 0) { pm = 12; py-- }
        cells.push(this.makeCell(py, pm, pd, true))
      }
      for (let d = 1; d <= dim; d++) cells.push(this.makeCell(y, m, d, false))
      let nd = 1, nm = m + 1, ny = y
      if (nm === 13) { nm = 1; ny++ }
      while (cells.length < 42) cells.push(this.makeCell(ny, nm, nd++, true))
      this.cells = cells
    },
    makeCell(y, m, d, dim) {
      const info = Lunar.getDateInfo(y, m, d)
      const isToday = (y === this.today.y && m === this.today.m && d === this.today.d)
      let cls = 'cell'
      if (dim) cls += ' dim'
      if (isToday) cls += ' today'
      let lunar = '', mark = '', markCls = '', holiday = '', holidayCls = ''
      if (info.supported) {
        lunar = info.lunarDayName
        if (info.solarTerm) { mark = info.solarTerm; markCls = 'term' }
        else if (info.lunarFestival) { mark = info.lunarFestival; markCls = 'fest' }
        else if (info.solarFestival) { mark = info.solarFestival; markCls = 'fest' }
        else if (info.lunar.lDay === 1) lunar = info.lunarMonthName
      }
      const hType = getHolidayType(y, m, d)
      if (hType === 'rest') { holiday = '休'; holidayCls = 'rest' }
      else if (hType === 'work') { holiday = '班'; holidayCls = 'work' }
      return { y, m, d, cls, lunar, mark, markCls, holiday, holidayCls }
    },
    onPickMonth(e) {
      const v = (e && e.detail && e.detail.value) || this.pickerValue
      const parts = v.split('-')
      this.year = parseInt(parts[0])
      this.month = parseInt(parts[1])
      this.buildCells()
    },
    prevMonth() { this.month--; if (this.month === 0) { this.month = 12; this.year-- } this.buildCells() },
    nextMonth() { this.month++; if (this.month === 13) { this.month = 1; this.year++ } this.buildCells() },
    goToday() {
      this.year = this.today.y; this.month = this.today.m
      this.buildCells()
    },
    openDay(cell) {
      uni.navigateTo({ url: `/pages/day/day?y=${cell.y}&m=${cell.m}&d=${cell.d}` })
    },
    openSettings() {
      uni.navigateTo({ url: '/pages/settings/settings' })
    },
    switchTab(i) {
      this.tab = i
    },
    onSwipeChange(e) {
      this.tab = e.detail.current
    },
    onCityChange(e) {
      const c = this.cities[parseInt(e.detail.value)]
      this.city = c
      uni.setStorageSync('city', c)
      getApp().globalData.city = c
      this.loadWeather()
    },
    locate() {
      uni.getLocation({
        type: 'gcj02',
        success: async (res) => {
          const lat = res.latitude
          const lon = res.longitude
          const name = await reverseGeoCity(lat, lon)
          if (name) {
            this.city = name
            uni.setStorageSync('city', name)
            getApp().globalData.city = name
            uni.showToast({ title: '已定位到 ' + name, icon: 'none' })
            this.loadWeather()
          } else {
            uni.showToast({ title: '定位成功，请在设置切换真实模式显示城市', icon: 'none' })
          }
        },
        fail: () => {
          uni.showToast({ title: '定位失败，请检查定位权限', icon: 'none' })
        }
      })
    },
    async loadWeather() {
      try {
        const city = getApp().globalData.city
        this.city = city
        const [w, list] = await Promise.all([getNow(city), getForecast7d(city)])
        this.weather = w
        const now = new Date()
        this.forecast = list.map((f, i) => {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
          return {
            ...f,
            week: i === 0 ? '今天' : '周' + WEEK7[d.getDay()],
            date: f.date.replace('-', '/')
          }
        })
      } catch (e) {
        // 忽略，保留占位
      }
    }
  }
}
</script>

<style scoped>
.page {
  height: 100vh;
  background-color: var(--paper);
  color: var(--ink);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.swiper { flex: 1; height: 0; }
.tab-panel { height: 100%; box-sizing: border-box; padding-left: 32rpx; padding-right: 32rpx; padding-bottom: 32rpx; }

/* ===== 日历 ===== */
.cal-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 28rpx 8rpx 24rpx;
}
.ym { display: flex; flex-direction: column; }
.ym-row { display: flex; align-items: center; gap: 8rpx; }
.ym-title { font-size: 52rpx; font-weight: 700; line-height: 1.2; }
.ym-caret { font-size: 28rpx; color: var(--muted); font-weight: 600; }
.ym-lunar { margin-top: 6rpx; font-size: 26rpx; color: var(--ink-soft); }
.nav { display: flex; align-items: center; gap: 16rpx; }
.nav-btn {
  width: 68rpx; height: 68rpx; border-radius: 50%; border: 1rpx solid var(--border);
  background: var(--surface); color: var(--ink); font-size: 40rpx; line-height: 64rpx;
  text-align: center;
}
.nav-btn.gear { font-size: 32rpx; }
.today-btn {
  width: 68rpx; height: 68rpx; border-radius: 50%; background: var(--vermilion);
  color: #fff; font-size: 28rpx; font-weight: 600; line-height: 68rpx; text-align: center;
}

.week-row { display: flex; padding: 8rpx 0 16rpx; }
.week-item { flex: 1; text-align: center; font-size: 24rpx; color: var(--muted); font-weight: 500; }
.week-item.weekend { color: var(--vermilion); }

.grid {
  display: flex; flex-wrap: wrap;
  border-top: 1rpx solid var(--border);
  border-left: 1rpx solid var(--border);
  border-radius: 16rpx;
  overflow: hidden;
}
.cell {
  width: 14.2857%; height: 104rpx; box-sizing: border-box;
  display: flex; flex-direction: column; align-items: center; padding-top: 10rpx;
  position: relative;
  border-right: 1rpx solid var(--border);
  border-bottom: 1rpx solid var(--border);
}
.cell:active { transform: scale(0.96); }
.solar { font-size: 34rpx; font-weight: 600; line-height: 1.15; }
.lunar { font-size: 20rpx; color: var(--muted); margin-top: 4rpx; line-height: 1.2; }
.mark { font-size: 20rpx; margin-top: 4rpx; font-weight: 600; line-height: 1.2; white-space: nowrap; }
.mark.term { color: var(--jade); }
.mark.fest { color: var(--gold); }
.holiday { position: absolute; top: 8rpx; right: 10rpx; font-size: 18rpx; font-weight: 600; line-height: 1; }
.holiday.rest { color: var(--vermilion); }
.holiday.work { color: var(--muted); }
.cell.dim .solar { color: var(--muted); font-weight: 500; }
.cell.dim .lunar { color: var(--muted); opacity: 0.6; }
.cell.today { background: var(--vermilion); }
.cell.today .solar, .cell.today .lunar, .cell.today .mark { color: #fff; }
.cell.today .mark.term, .cell.today .mark.fest { color: #FFE3DB; }
.cell.today .holiday { color: #FFE3DB; }

/* ===== 天气 ===== */
.w-head { display: flex; align-items: center; justify-content: space-between; padding: 28rpx 8rpx 4rpx; }
.w-city-row { display: flex; align-items: center; gap: 8rpx; }
.w-city { font-size: 36rpx; font-weight: 700; }
.w-caret { font-size: 28rpx; color: var(--muted); font-weight: 600; }
.w-actions { display: flex; align-items: center; gap: 8rpx; }
.w-gear { font-size: 40rpx; color: var(--muted); padding: 0 8rpx; }

.w-hero { display: flex; flex-direction: column; align-items: center; padding: 20rpx 0 8rpx; }
.w-hero-icon { font-size: 120rpx; line-height: 1; }
.w-hero-temp { font-size: 140rpx; font-weight: 600; line-height: 1.05; }
.w-hero-desc { font-size: 30rpx; color: var(--ink-soft); margin-top: 12rpx; }

.w-metrics {
  display: flex; margin-top: 28rpx;
  border: 1rpx solid var(--border); border-radius: 24rpx; background: var(--surface); overflow: hidden;
}
.w-metric { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8rpx; padding: 22rpx 0; }
.w-metric + .w-metric { border-left: 1rpx solid var(--border); }
.w-m-label { font-size: 22rpx; color: var(--muted); }
.w-m-val { font-size: 26rpx; font-weight: 600; color: var(--ink); }

.sec-title { font-size: 26rpx; color: var(--muted); margin: 36rpx 8rpx 16rpx; font-weight: 600; letter-spacing: 0.05em; }
.forecast { display: flex; flex-direction: column; }
.f-row {
  display: flex; align-items: center; gap: 20rpx; padding: 24rpx 28rpx;
  background: var(--surface); border-bottom: 1rpx solid var(--border);
}
.f-row:first-child { border-radius: 32rpx 32rpx 0 0; }
.f-row:last-child { border-radius: 0 0 32rpx 32rpx; border-bottom: none; }
.f-day { width: 120rpx; display: flex; flex-direction: column; }
.f-week { font-size: 26rpx; font-weight: 600; color: var(--ink); }
.f-date { font-size: 22rpx; color: var(--muted); margin-top: 2rpx; }
.f-icon { font-size: 44rpx; width: 60rpx; text-align: center; }
.f-mid { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.f-text { font-size: 26rpx; color: var(--ink); font-weight: 500; }
.f-meta { font-size: 22rpx; color: var(--ink-soft); }
.f-temp { display: flex; align-items: baseline; gap: 6rpx; font-weight: 600; font-size: 28rpx; }
.f-temp .lo { color: var(--weather-cold); }
.f-temp .hi { color: var(--weather-hot); }
.f-temp .slash { color: var(--muted); font-weight: 400; }

/* ===== 底部 tab ===== */
.tabbar {
  flex-shrink: 0;
  display: flex;
  border-top: 1rpx solid var(--border);
  background: var(--surface);
  padding-bottom: env(safe-area-inset-bottom);
}
.tab {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4rpx; padding: 12rpx 0 16rpx;
  color: var(--muted); font-size: 22rpx;
}
.tab-ico { font-size: 40rpx; line-height: 1; }
.tab.active { color: var(--vermilion); }
</style>
