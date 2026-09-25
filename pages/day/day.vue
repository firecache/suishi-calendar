<template>
  <view class="page" :class="themeClass" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="back-btn" @click="goBack">‹ 返回</view>

    <view class="day-hero">
      <text class="big serif">{{ d }}</text>
      <text class="date-line">{{ y }}年{{ m }}月{{ d }}日 · {{ weekday }}</text>
      <view class="lunar-line">
        <text>{{ lunarLine }}</text>
        <text v-if="tag" class="tag" :class="tagCls">{{ tag }}</text>
        <text v-if="holiday" class="tag" :class="holidayCls">{{ holiday }}</text>
      </view>
      <view class="gz-row" v-if="info && info.supported">
        <text class="chip">{{ info.yearGanZhi }}年</text>
        <text class="chip">{{ info.monthGanZhi }}月</text>
        <text class="chip">{{ info.dayGanZhi }}日</text>
        <text class="chip">属{{ info.zodiac }}</text>
      </view>
    </view>

    <!-- 当日天气 -->
    <view class="weather-card">
      <text class="w-icon">{{ weather.icon }}</text>
      <text class="w-temp serif">{{ weather.temp }}°</text>
      <view class="w-info">
        <text class="w-desc">{{ weather.text }} · {{ weather.temp }}°</text>
        <text class="w-meta">体感{{ weather.feels }}° · 湿度{{ weather.humidity }}% · {{ weather.windDir }}{{ weather.windScale }}<text v-if="weather.aqiText"> · 空气{{ weather.aqiText }}</text></text>
      </view>
    </view>

    <!-- 7 日预报 -->
    <view class="sec-title">7 日天气预报</view>
    <view class="forecast">
      <view v-for="(f, i) in forecast" :key="i" class="row">
        <text class="fd">{{ i === 0 ? '今天' : f.week }} {{ f.date }}</text>
        <text class="fi">{{ f.icon }}</text>
        <text class="fd-desc">{{ f.text }}</text>
        <text class="ft"><text class="lo">{{ f.tempMin }}°</text> / <text class="hi">{{ f.tempMax }}°</text></text>
      </view>
    </view>
  </view>
</template>

<script>
import Lunar from '@/utils/lunar.js'
import { getNow, getForecast7d } from '@/utils/weather.js'
import { getHolidayType } from '@/utils/holiday.js'

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

export default {
  data() {
    return {
      statusBarHeight: 20,
      y: new Date().getFullYear(),
      m: new Date().getMonth() + 1,
      d: new Date().getDate(),
      info: null,
      holidayType: null,
      weather: { icon: '🌤', text: '', temp: '--', feels: '--', humidity: '--', windDir: '', windScale: '', aqiText: '' },
      forecast: []
    }
  },
  computed: {
    themeClass() {
      const t = getApp().globalData.theme || 'system'
      return t === 'dark' ? 'theme-dark' : t === 'light' ? 'theme-light' : ''
    },
    weekday() { return '星期' + WEEK[new Date(this.y, this.m - 1, this.d).getDay()] },
    lunarLine() {
      if (!this.info || !this.info.supported) return '农历信息暂不支持（超出 1900–2100）'
      return '农历 ' + this.info.lunarMonthName + ' ' + this.info.lunarDayName
    },
    tag() {
      if (!this.info || !this.info.supported) return ''
      return this.info.solarTerm || this.info.lunarFestival || this.info.solarFestival || ''
    },
    tagCls() {
      if (!this.info) return ''
      return this.info.solarTerm ? 'term' : 'fest'
    },
    holiday() {
      return this.holidayType === 'rest' ? '休' : this.holidayType === 'work' ? '班' : ''
    },
    holidayCls() {
      return this.holidayType === 'rest' ? 'rest' : 'work'
    }
  },
  onLoad(options) {
    const sys = uni.getSystemInfoSync()
    this.statusBarHeight = sys.statusBarHeight || 20
    if (options && options.y) {
      this.y = parseInt(options.y)
      this.m = parseInt(options.m)
      this.d = parseInt(options.d)
    }
    this.info = Lunar.getDateInfo(this.y, this.m, this.d)
    this.holidayType = getHolidayType(this.y, this.m, this.d)
    this.loadWeather()
    this.loadForecast()
  },
  methods: {
    goBack() { uni.navigateBack() },
    async loadWeather() {
      try {
        const city = getApp().globalData.city
        // 当日天气用当日基准的模拟值（真实模式返回当前实况，此处取当前）
        this.weather = await getNow(city)
      } catch (e) { /* 忽略 */ }
    },
    async loadForecast() {
      try {
        const list = await getForecast7d(getApp().globalData.city)
        this.forecast = list.map((f, i) => {
          const parts = f.date.split('-')
          const mm = parseInt(parts[0]), dd = parseInt(parts[1])
          const wd = new Date(this.y, mm - 1, dd).getDay()
          return { ...f, week: WEEK[wd] }
        })
      } catch (e) { /* 忽略 */ }
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background-color: var(--paper);
  color: var(--ink);
  box-sizing: border-box;
  padding-left: 32rpx;
  padding-right: 32rpx;
  padding-bottom: 48rpx;
}
.back-btn {
  display: inline-flex; align-items: center; margin: 20rpx 0 0 8rpx; padding: 14rpx 28rpx;
  border: 1rpx solid var(--border); background: var(--surface); border-radius: 32rpx;
  font-size: 26rpx; color: var(--ink-soft);
}

.day-hero { text-align: center; padding: 40rpx 0 12rpx; }
.big { font-size: 140rpx; font-weight: 600; line-height: 1; }
.date-line { display: block; margin-top: 16rpx; font-size: 28rpx; color: var(--ink-soft); }
.lunar-line { margin-top: 12rpx; font-size: 40rpx; font-weight: 600; }
.tag { font-size: 24rpx; font-weight: 600; padding: 4rpx 16rpx; border-radius: 20rpx; margin-left: 12rpx; }
.tag.term { color: var(--jade); background: rgba(74, 124, 89, 0.12); }
.tag.fest { color: var(--gold); background: rgba(169, 128, 31, 0.12); }
.tag.rest { color: var(--vermilion); background: rgba(192, 58, 43, 0.12); }
.tag.work { color: var(--muted); background: rgba(148, 139, 126, 0.16); }
.gz-row { display: flex; justify-content: center; gap: 16rpx; margin-top: 24rpx; flex-wrap: wrap; }
.chip { font-size: 24rpx; color: var(--ink-soft); border: 1rpx solid var(--border); border-radius: 28rpx; padding: 8rpx 20rpx; background: var(--surface); }

.weather-card {
  margin-top: 36rpx; border: 1rpx solid var(--border); border-radius: 32rpx; background: var(--surface);
  padding: 28rpx 32rpx; display: flex; align-items: center; gap: 24rpx;
}
.w-icon { font-size: 64rpx; line-height: 1; }
.w-temp { font-size: 80rpx; font-weight: 600; line-height: 1; }
.w-info { flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
.w-desc { font-size: 30rpx; font-weight: 600; }
.w-meta { font-size: 24rpx; color: var(--ink-soft); }

.sec-title { font-size: 26rpx; color: var(--muted); margin: 40rpx 8rpx 16rpx; font-weight: 600; letter-spacing: 0.05em; }
.forecast { display: flex; flex-direction: column; }
.row {
  display: flex; align-items: center; gap: 24rpx; padding: 22rpx 28rpx; background: var(--surface);
  border-bottom: 1rpx solid var(--border);
}
.row:first-child { border-radius: 32rpx 32rpx 0 0; }
.row:last-child { border-radius: 0 0 32rpx 32rpx; border-bottom: none; }
.fd { width: 130rpx; font-size: 26rpx; color: var(--ink-soft); font-weight: 500; }
.fi { font-size: 40rpx; }
.fd-desc { flex: 1; font-size: 26rpx; color: var(--ink-soft); }
.ft { font-weight: 600; font-size: 26rpx; }
.lo { color: var(--weather-cold); }
.hi { color: var(--weather-hot); }
</style>
