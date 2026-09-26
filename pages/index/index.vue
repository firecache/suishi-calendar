<template>
  <view class="page" :class="themeClass" :style="{ paddingTop: statusBarHeight + 'px' }">
    <!-- 头部 -->
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
      </view>
    </view>

    <!-- 星期行 -->
    <view class="week-row">
      <text v-for="(w, i) in weekLabels" :key="i" class="week-item" :class="{ weekend: i >= 5 }">{{ w }}</text>
    </view>

    <!-- 6×7 网格 -->
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

    <!-- 今日天气卡 -->
    <view class="weather-card" @click="openToday">
      <text class="w-icon">{{ weather.icon }}</text>
      <text class="w-temp">{{ weather.temp }}°</text>
      <view class="w-info">
        <text class="w-desc">{{ weather.text }} · {{ weather.temp }}°</text>
        <text class="w-meta">体感{{ weather.feels }}° · 湿度{{ weather.humidity }}% · {{ weather.windDir }}{{ weather.windScale }}<text v-if="weather.aqiText"> · 空气{{ weather.aqiText }}</text></text>
      </view>
      <text class="w-city">{{ weather.city }}</text>
    </view>
  </view>
</template>

<script>
import Lunar from '@/utils/lunar.js'
import { getNow } from '@/utils/weather.js'
import { getHolidayType } from '@/utils/holiday.js'

const WEEK = ['一', '二', '三', '四', '五', '六', '日']

export default {
  data() {
    const now = new Date()
    return {
      statusBarHeight: 20,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      today: { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() },
      weekStart: 1,
      cells: [],
      weather: { icon: '🌤', text: '', temp: '--', feels: '--', humidity: '--', windDir: '', windScale: '', aqiText: '', city: '' }
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
      // 上月补位
      const prevDim = new Date(y, m - 1, 0).getDate()
      for (let i = offset - 1; i >= 0; i--) {
        let pd = prevDim - i, pm = m - 1, py = y
        if (pm === 0) { pm = 12; py-- }
        cells.push(this.makeCell(py, pm, pd, true))
      }
      // 本月
      for (let d = 1; d <= dim; d++) cells.push(this.makeCell(y, m, d, false))
      // 下月补位
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
    openToday() {
      uni.navigateTo({ url: `/pages/day/day?y=${this.today.y}&m=${this.today.m}&d=${this.today.d}` })
    },
    async loadWeather() {
      try {
        const w = await getNow(getApp().globalData.city)
        this.weather = w
      } catch (e) {
        // 忽略，保留占位
      }
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
  padding-bottom: 32rpx;
  display: flex;
  flex-direction: column;
}

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

.weather-card {
  margin-top: 28rpx; border: 1rpx solid var(--border); border-radius: 32rpx; background: var(--surface);
  padding: 28rpx 32rpx; display: flex; align-items: center; gap: 24rpx;
}
.w-icon { font-size: 64rpx; line-height: 1; }
.w-temp { font-size: 80rpx; font-weight: 600; line-height: 1; font-family: "Iowan Old Style", "Songti SC", "Noto Serif SC", serif; }
.w-info { flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
.w-desc { font-size: 30rpx; font-weight: 600; color: var(--ink); }
.w-meta { font-size: 24rpx; color: var(--ink-soft); }
.w-city { font-size: 24rpx; color: var(--muted); }
</style>
