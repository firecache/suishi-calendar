<script>
import config from './utils/config.js'

export default {
  globalData: {
    theme: 'system',
    weekStart: config.WEEK_START,
    city: config.DEFAULT_CITY
  },
  onLaunch() {
    // 读取本地偏好
    this.globalData.theme = uni.getStorageSync('theme') || 'system'
    const ws = uni.getStorageSync('weekStart')
    this.globalData.weekStart = (ws === 0 || ws === 1) ? ws : config.WEEK_START
    this.globalData.city = uni.getStorageSync('city') || config.DEFAULT_CITY
  }
}
</script>

<style>
/* ===== 全局主题变量（浅色默认） ===== */
page {
  --ink: #1F1B16;
  --ink-soft: #5C554B;
  --muted: #948B7E;
  --paper: #FAF7F2;
  --surface: #FFFFFF;
  --border: #E7E0D4;
  --vermilion: #C03A2B;
  --vermilion-soft: #F7E4E0;
  --jade: #4A7C59;
  --gold: #A9801F;
  --weather-cold: #3B7CB8;
  --weather-hot: #C0392B;

  background-color: var(--paper);
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "HarmonyOS Sans SC", "MiSans", "Microsoft YaHei", sans-serif;
}

/* 跟随系统 → 深色 */
@media (prefers-color-scheme: dark) {
  page {
    --ink: #F2EDE5;
    --ink-soft: #B8AFA2;
    --muted: #7A7266;
    --paper: #141210;
    --surface: #1E1B17;
    --border: #322D26;
    --vermilion: #E05745;
    --vermilion-soft: #3A2622;
    --jade: #6FA583;
    --gold: #C9A24A;
  }
}

/* 强制主题（设置页选择「浅色/深色」时挂到根 view） */
.theme-dark {
  --ink: #F2EDE5;
  --ink-soft: #B8AFA2;
  --muted: #7A7266;
  --paper: #141210;
  --surface: #1E1B17;
  --border: #322D26;
  --vermilion: #E05745;
  --vermilion-soft: #3A2622;
  --jade: #6FA583;
  --gold: #C9A24A;
}
.theme-light {
  --ink: #1F1B16;
  --ink-soft: #5C554B;
  --muted: #948B7E;
  --paper: #FAF7F2;
  --surface: #FFFFFF;
  --border: #E7E0D4;
  --vermilion: #C03A2B;
  --vermilion-soft: #F7E4E0;
  --jade: #4A7C59;
  --gold: #A9801F;
  --weather-cold: #3B7CB8;
  --weather-hot: #C0392B;
}

/* 通用 */
.serif {
  font-family: "Iowan Old Style", "Songti SC", "Noto Serif SC", serif;
  font-variant-numeric: tabular-nums;
}
</style>
