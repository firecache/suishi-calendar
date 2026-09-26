<template>
  <view class="page" :class="themeClass" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="back-btn" @click="goBack">‹ 返回</view>
    <view class="page-title">设置</view>

    <view class="group">
      <view class="group-title">通用</view>
      <view class="list">
        <picker mode="selector" :range="cities" @change="onCityChange">
          <view class="item">
            <text>城市</text>
            <text class="val">{{ city }} ›</text>
          </view>
        </picker>
        <view class="item">
          <text>周起始日</text>
          <view class="seg">
            <text class="seg-opt" :class="{ on: weekStart === 1 }" @click="setWeekStart(1)">周一</text>
            <text class="seg-opt" :class="{ on: weekStart === 0 }" @click="setWeekStart(0)">周日</text>
          </view>
        </view>
        <view class="item">
          <text>主题</text>
          <view class="seg seg3">
            <text class="seg-opt" :class="{ on: theme === 'system' }" @click="setTheme('system')">跟随系统</text>
            <text class="seg-opt" :class="{ on: theme === 'light' }" @click="setTheme('light')">浅色</text>
            <text class="seg-opt" :class="{ on: theme === 'dark' }" @click="setTheme('dark')">深色</text>
          </view>
        </view>
      </view>
    </view>

    <view class="group">
      <view class="group-title">天气</view>
      <view class="list">
        <view class="item">
          <text>演示模式</text>
          <switch :checked="useDemo" color="#C03A2B" @change="onDemoChange" />
        </view>
        <view class="item" v-if="!useDemo">
          <text>和风天气 Key</text>
        </view>
        <view class="input-row" v-if="!useDemo">
          <input
            class="key-input"
            :value="qweatherKey"
            placeholder="粘贴 Web API Key（dev.qweather.com）"
            placeholder-class="ph"
            @input="onKeyInput"
          />
        </view>
      </view>
    </view>

    <view class="group">
      <view class="group-title">关于</view>
      <view class="list">
        <view class="item"><text>版本</text><text class="val">1.0.0</text></view>
        <view class="item"><text>农历</text><text class="val">本地计算 1900–2100</text></view>
      </view>
    </view>
  </view>
</template>

<script>
import config from '@/utils/config.js'

export default {
  data() {
    return {
      statusBarHeight: 20,
      cities: config.CITIES,
      city: config.DEFAULT_CITY,
      weekStart: config.WEEK_START,
      theme: 'system',
      useDemo: config.USE_DEMO,
      qweatherKey: ''
    }
  },
  computed: {
    themeClass() {
      return this.theme === 'dark' ? 'theme-dark' : this.theme === 'light' ? 'theme-light' : ''
    }
  },
  onLoad() {
    const sys = uni.getSystemInfoSync()
    this.statusBarHeight = sys.statusBarHeight || 20
    this.city = getApp().globalData.city
    this.weekStart = getApp().globalData.weekStart
    this.theme = getApp().globalData.theme
    const demo = uni.getStorageSync('useDemo')
    this.useDemo = (demo === '' || demo === null || demo === undefined) ? config.USE_DEMO : !!demo
    this.qweatherKey = uni.getStorageSync('qweatherKey') || config.QWEATHER_KEY
  },
  methods: {
    goBack() { uni.navigateBack() },
    onCityChange(e) {
      this.city = this.cities[parseInt(e.detail.value)]
      uni.setStorageSync('city', this.city)
      getApp().globalData.city = this.city
    },
    setWeekStart(v) {
      this.weekStart = v
      uni.setStorageSync('weekStart', v)
      getApp().globalData.weekStart = v
    },
    setTheme(v) {
      this.theme = v
      uni.setStorageSync('theme', v)
      getApp().globalData.theme = v
    },
    onDemoChange(e) {
      this.useDemo = e.detail.value
      uni.setStorageSync('useDemo', this.useDemo)
    },
    onKeyInput(e) {
      this.qweatherKey = e.detail.value
      uni.setStorageSync('qweatherKey', this.qweatherKey.trim())
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
  padding: 24rpx 32rpx 48rpx;
}
.back-btn {
  display: inline-flex; align-items: center; margin: 20rpx 0 0 8rpx; padding: 14rpx 28rpx;
  border: 1rpx solid var(--border); background: var(--surface); border-radius: 32rpx;
  font-size: 26rpx; color: var(--ink-soft);
}
.page-title { font-size: 40rpx; font-weight: 700; padding: 28rpx 8rpx 20rpx; }

.group { margin-top: 28rpx; }
.group-title { font-size: 24rpx; color: var(--muted); margin: 0 12rpx 12rpx; font-weight: 600; letter-spacing: 0.05em; }
.list { background: var(--surface); border: 1rpx solid var(--border); border-radius: 32rpx; overflow: hidden; }
.item {
  display: flex; align-items: center; justify-content: space-between; padding: 32rpx;
  border-bottom: 1rpx solid var(--border); font-size: 30rpx;
}
.item:last-child { border-bottom: none; }
.val { color: var(--muted); font-size: 28rpx; }

.seg { display: flex; background: var(--paper); border-radius: 20rpx; padding: 4rpx; gap: 4rpx; }
.seg-opt {
  padding: 10rpx 24rpx; font-size: 26rpx; color: var(--ink-soft); border-radius: 16rpx; line-height: 1.4;
}
.seg-opt.on { background: var(--surface); color: var(--ink); font-weight: 600; }
.seg3 .seg-opt { padding: 10rpx 16rpx; }

.input-row { padding: 8rpx 32rpx 32rpx; }
.key-input {
  height: 88rpx; border: 1rpx solid var(--border); border-radius: 20rpx; padding: 0 24rpx;
  font-size: 28rpx; color: var(--ink); background: var(--paper);
}
.ph { color: var(--muted); }
</style>
