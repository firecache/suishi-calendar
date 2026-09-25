/*!
 * lunar.js — 农历/干支/生肖/节气/节日 纯本地计算（1900–2100）
 * 无依赖，可在浏览器 / Node / uni-app 中直接使用（UMD）。
 * 算法为公开通用的农历算法，不依赖网络。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Lunar = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 1900–2100 农历数据表（闰月 + 大小月编码）
  var lunarInfo = [
    0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2, //1900-1909
    0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977, //1910-1919
    0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970, //1920-1929
    0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950, //1930-1939
    0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557, //1940-1949
    0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0, //1950-1959
    0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0, //1960-1969
    0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b5a0,0x195a6, //1970-1979
    0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570, //1980-1989
    0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0, //1990-1999
    0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5, //2000-2009
    0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930, //2010-2019
    0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530, //2020-2029
    0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45, //2030-2039
    0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0, //2040-2049
    0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0, //2050-2059
    0x0a2e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4, //2060-2069
    0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0, //2070-2079
    0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160, //2080-2089
    0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252, //2090-2099
    0x0d520 //2100
  ];

  var GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var ZODIAC = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
  var LUNAR_MONTH = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
  var LUNAR_DAY = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
    '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
    '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
  var SOLAR_TERMS = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨',
    '立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑',
    '白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];

  // 节气（近似，分钟级精度，1900–2100 适用）
  var sTermInfo = [0,21208,42467,63836,85337,107014,128867,150921,173149,195551,
    218072,240693,263343,285989,308563,331033,353350,375494,397447,419210,
    440795,462224,483532,504758];

  // 农历节日（按月-日）
  var LUNAR_FESTIVAL = {
    '1-1':'春节','1-15':'元宵节','2-2':'龙抬头','5-5':'端午节','7-7':'七夕节',
    '7-15':'中元节','8-15':'中秋节','9-9':'重阳节','12-8':'腊八节','12-23':'小年(北)',
    '12-24':'小年(南)','12-30':'除夕'
  };
  // 公历节日（按月-日）
  var SOLAR_FESTIVAL = {
    '1-1':'元旦','2-14':'情人节','3-8':'妇女节','3-12':'植树节','4-1':'愚人节',
    '5-1':'劳动节','5-4':'青年节','6-1':'儿童节','7-1':'建党节','8-1':'建军节',
    '9-10':'教师节','10-1':'国庆节','12-24':'平安夜','12-25':'圣诞节'
  };

  function leapMonth(y) { return lunarInfo[y - 1900] & 0xf; }
  function leapDays(y) { return leapMonth(y) ? ((lunarInfo[y - 1900] & 0x10000) ? 30 : 29) : 0; }
  function monthDays(y, m) { return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29; }
  function lunarYearDays(y) {
    var sum = 348, i;
    for (i = 0x8000; i > 0x8; i >>= 1) { sum += (lunarInfo[y - 1900] & i) ? 1 : 0; }
    return sum + leapDays(y);
  }

  function toIntDate(y, m, d) { return y * 10000 + m * 100 + d; }

  // 公历 → 农历（仅支持 1900-01-31 至 2100-12-31；超范围返回 null）
  function solarToLunar(y, m, d) {
    var offset = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 86400000);
    if (offset < 0 || y > 2100) return null;
    var i, temp = 0, ly;
    for (ly = 1900; ly < 2101 && offset > 0; ly++) { temp = lunarYearDays(ly); offset -= temp; }
    if (offset < 0) { offset += temp; ly--; }
    var year = ly;
    var leap = leapMonth(ly);
    var isLeap = false;
    for (i = 1; i < 13 && offset > 0; i++) {
      if (leap > 0 && i === (leap + 1) && !isLeap) { --i; isLeap = true; temp = leapDays(year); }
      else { temp = monthDays(year, i); }
      if (isLeap && i === (leap + 1)) { isLeap = false; }
      offset -= temp;
    }
    if (offset === 0 && leap > 0 && i === leap + 1) {
      if (isLeap) { isLeap = false; }
      else { isLeap = true; --i; }
    }
    if (offset < 0) { offset += temp; --i; }
    var month = i;
    var day = offset + 1;
    return {
      lYear: year, lMonth: month, lDay: day, isLeap: isLeap,
      yearGanZhi: yearGanZhi(year),
      zodiac: ZODIAC[(year - 4) % 12]
    };
  }

  function yearGanZhi(y) {
    var idx = (y - 4) % 60;
    if (idx < 0) idx += 60;
    return GAN[idx % 10] + ZHI[idx % 12];
  }

  // 立春之后的「节」下标及其月支（寅=正月起）
  var AFTER_LICHUN_TERM = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22]; // 惊蛰..大雪
  var AFTER_LICHUN_ZHI  = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0];      // 卯..亥,子

  // 月干支（以「节」分界；年柱在立春换年）
  function monthGanZhi(y, m, d) {
    var dateNum = toIntDate(y, m, d);
    var lichun = termDate(y, 2);
    var beforeLichun = dateNum < toIntDate(lichun[0], lichun[1], lichun[2]);
    var yearForMonth = beforeLichun ? y - 1 : y;

    var zhiIdx;
    if (beforeLichun) {
      var xiaohan = termDate(y, 0);
      // 小寒之后→丑月(腊月)；小寒之前→子月(仍属前一年大雪之后)
      zhiIdx = (dateNum >= toIntDate(xiaohan[0], xiaohan[1], xiaohan[2])) ? 1 : 0;
    } else {
      zhiIdx = 2; // 立春起为寅月
      for (var i = 0; i < AFTER_LICHUN_TERM.length; i++) {
        var t = termDate(y, AFTER_LICHUN_TERM[i]);
        if (dateNum >= toIntDate(t[0], t[1], t[2])) {
          zhiIdx = AFTER_LICHUN_ZHI[i];
        }
      }
    }

    var yearGanIdx = ((yearForMonth - 4) % 10 + 10) % 10;
    // 正月（寅月）月干：甲己年丙寅，乙庚年戊寅，丙辛年庚寅，丁壬年壬寅，戊癸年甲寅
    var firstMonthGan = ((yearGanIdx % 5) * 2 + 2) % 10;
    var ganIdx = (firstMonthGan + ((zhiIdx - 2 + 12) % 12)) % 10;
    return GAN[ganIdx] + ZHI[zhiIdx];
  }

  // 日干支（锚点：1900-01-31 = 甲辰日，即 60 甲子序数 40）
  function dayGanZhi(y, m, d) {
    var base = Date.UTC(1900, 0, 31);
    var cur = Date.UTC(y, m - 1, d);
    var diff = Math.floor((cur - base) / 86400000);
    var idx = ((diff + 40) % 60 + 60) % 60;
    return GAN[idx % 10] + ZHI[idx % 12];
  }

  // 24 节气：返回某公历日是否为节气，及其名称
  function solarTerm(y, m, d) {
    var dt = Date.UTC(y, m - 1, d);
    for (var n = 0; n < 24; n++) {
      var t = termDate(y, n);
      if (toIntDate(t[0], t[1], t[2]) === toIntDate(y, m, d)) {
        return SOLAR_TERMS[n];
      }
    }
    return null;
  }
  function termDate(y, n) {
    var offDate = new Date((31556925974.7 * (y - 1900) + sTermInfo[n] * 60000) + Date.UTC(1900, 0, 6, 2, 5));
    return [offDate.getUTCFullYear(), offDate.getUTCMonth() + 1, offDate.getUTCDate()];
  }

  function lunarFestival(lMonth, lDay, isLeap) {
    if (isLeap) return null;
    return LUNAR_FESTIVAL[lMonth + '-' + lDay] || null;
  }
  function solarFestival(m, d) {
    return SOLAR_FESTIVAL[m + '-' + d] || null;
  }
  function lunarMonthName(m, isLeap) {
    return (isLeap ? '闰' : '') + LUNAR_MONTH[m - 1] + '月';
  }
  function lunarDayName(d) { return LUNAR_DAY[d - 1]; }

  // 综合：某公历日的完整农历信息（超范围时 lunar 相关字段为 null）
  function getDateInfo(y, m, d) {
    var l = solarToLunar(y, m, d);
    if (!l) {
      return {
        solar: { y: y, m: m, d: d },
        lunar: null, lunarMonthName: null, lunarDayName: null,
        yearGanZhi: null, zodiac: null, monthGanZhi: null, dayGanZhi: null,
        solarTerm: null, lunarFestival: null, solarFestival: solarFestival(m, d),
        supported: false
      };
    }
    return {
      solar: { y: y, m: m, d: d },
      lunar: l,
      lunarMonthName: lunarMonthName(l.lMonth, l.isLeap),
      lunarDayName: lunarDayName(l.lDay),
      yearGanZhi: l.yearGanZhi,
      zodiac: l.zodiac,
      monthGanZhi: monthGanZhi(y, m, d),
      dayGanZhi: dayGanZhi(y, m, d),
      solarTerm: solarTerm(y, m, d),
      lunarFestival: lunarFestival(l.lMonth, l.lDay, l.isLeap),
      solarFestival: solarFestival(m, d),
      supported: true
    };
  }

  return {
    solarToLunar: solarToLunar,
    getDateInfo: getDateInfo,
    yearGanZhi: yearGanZhi,
    monthGanZhi: monthGanZhi,
    dayGanZhi: dayGanZhi,
    solarTerm: solarTerm,
    lunarFestival: lunarFestival,
    solarFestival: solarFestival,
    lunarMonthName: lunarMonthName,
    lunarDayName: lunarDayName,
    GAN: GAN, ZHI: ZHI, ZODIAC: ZODIAC,
    LUNAR_MONTH: LUNAR_MONTH, LUNAR_DAY: LUNAR_DAY, SOLAR_TERMS: SOLAR_TERMS
  };
}));
