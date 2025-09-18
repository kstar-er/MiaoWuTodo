<template>
  <div class="progress-background" aria-hidden="true">
    <!-- 底层暗色进度（带相位错位的波浪） -->
    <div
      class="progress-fill-bg"
      :style="{
        width: computedWidth,
        background: fillColorDark,
        clipPath: showWave ? bgWaveClipPath : undefined,
        opacity: isOverdue && !props.isFinalStage ? 0.10 : 0.16,
      }"
    />
    <div
      class="progress-fill"
      :style="{
        width: computedWidth,
        background: fillColor,
        opacity: isOverdue && !props.isFinalStage ? 0.15 : 0.16,
        boxShadow: props.isFinalStage ? '0 0 8px rgba(255, 215, 0, 0.45), 0 0 16px rgba(255, 215, 0, 0.25)' : 'none',
        clipPath: showWave ? waveClipPath : undefined,
      }"
    />
    <div v-if="!isOverdue && remainingText" class="progress-label" :style="{ right: '13%' }">{{ remainingText }}</div>
    <div v-if="isOverdue && !props.isFinalStage" class="overdue-stripe" />
    <div v-if="props.isFinalStage" class="final-shine" />
  </div>
</template>

<script setup>
import { computed,  onMounted, onUnmounted, ref } from 'vue';

const props = defineProps({
  startTime: { type: [String, Number, Date], default: null },
  endTime: { type: [String, Number, Date], default: null },
  currentTime: { type: [String, Number, Date], default: () => new Date() },
  // 当所在进度为流程列表的最后一项时，强制金色并发光
  isFinalStage: { type: Boolean, default: false },
  // 波形参数（像素单位与周期数）
  waveAmplitude: { type: Number, default: 1.5 }, // 水平振幅（px）
  waveCycles: { type: Number, default: 0.75 },     // 垂直方向内的波形周期数
  waveSpeed: { type: Number, default: 7 },      // 相位速度（弧度/秒）
  waveInset: { type: Number, default: 1.5 },      // 基础右内缩（px），避免过尖
  // 抖动参数
  waveJitterMin: { type: Number, default: 0.5 },  // 每周期振幅随机系数下限
  waveJitterMax: { type: Number, default: 1.7 }, // 每周期振幅随机系数上限
  waveJitterSmooth: { type: Number, default: 6 }, // 振幅朝目标过渡的速度（越大越快）
  // 相位随机偏移幅度（弧度，0~π），每周期独立随机，使前景/背景波浪交错更自然
  wavePhaseJitterRange: { type: Number, default: 1 },
  // 相位随机偏移的平滑速度（越大越快）
  wavePhaseJitterSmooth: { type: Number, default: 6 },
});

const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'number') return new Date(val);
  if (typeof val === 'string') {
    const s = val.trim();
    // 若为 ISO 8601（包含 T 或 Z 或 时区偏移），直接交给 Date 解析
    if (/T|Z|[+-]\d{2}:?\d{2}$/.test(s)) {
      const dIso = new Date(s);
      return isNaN(dIso.getTime()) ? null : dIso;
    }
    // 否则兼容 "yyyy-MM-dd HH:mm:ss" → Safari 需要斜杠
    const normalized = s.replace(/-/g, '/');
    const dCompat = new Date(normalized);
    return isNaN(dCompat.getTime()) ? null : dCompat;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const start = computed(() => toDate(props.startTime));
const end = computed(() => toDate(props.endTime));
const now = computed(() => toDate(props.currentTime) || new Date());

const totalMs = computed(() => {
  if (!start.value || !end.value) return 0;
  return Math.max(0, end.value.getTime() - start.value.getTime());
});

const elapsedMs = computed(() => {
  if (!start.value) return 0;
  return Math.max(0, (now.value.getTime() - start.value.getTime()));
});

const rawPercent = computed(() => {
  if (!totalMs.value) return 0;
  return (elapsedMs.value / totalMs.value) * 100;
});

const percent = computed(() => {
  if (!isFinite(rawPercent.value)) return 0;
  return Math.min(Math.max(rawPercent.value, 0), 100);
});

const isOverdue = computed(() => {
  if (!end.value) return false;
  return now.value.getTime() > end.value.getTime();
});

const computedWidth = computed(() => `${percent.value}%`);

// 是否显示波浪右缘
const showWave = computed(() => !isOverdue.value && !props.isFinalStage);

// 正弦右缘：基于高度方向采样点，生成 clip-path polygon
const wavePhase = ref(0);
let rafId = 0; let lastTs = 0;
// 每个 2π 相位作为一个周期，在周期开始随机一个目标振幅，并对振幅做平滑过渡
const amplitudeBase = computed(() => Math.max(0, props.waveAmplitude));
const amplitudeTarget = ref(amplitudeBase.value);
const amplitudeCurrent = ref(amplitudeBase.value);
let lastPhaseWrapped = 0; // 上一次 phase 映射到 [0, 2π) 的值

// 前景/背景相位随机偏移：使用 目标 + 当前 的双缓动，避免周期切换闪回
const fgPhaseOffsetTarget = ref(0);
const bgPhaseOffsetTarget = ref(0);
const fgPhaseOffsetCurrent = ref(0);
const bgPhaseOffsetCurrent = ref(0);

const randomInRange = (min, max) => min + Math.random() * (max - min);
const wrapTwoPi = (x) => {
  const t = x % (Math.PI * 2);
  return t < 0 ? t + Math.PI * 2 : t;
};
const startWave = (ts) => {
  if (!showWave.value) { lastTs = ts || performance.now(); rafId = requestAnimationFrame(startWave); return; }
  const nowTs = ts || performance.now();
  if (!lastTs) lastTs = nowTs;
  const dt = (nowTs - lastTs) / 1000; // s
  lastTs = nowTs;
  // 相位推进
  wavePhase.value += props.waveSpeed * dt;
  // 检测是否跨过 2π 周期边界
  const phaseWrapped = wrapTwoPi(wavePhase.value);
  if (phaseWrapped < lastPhaseWrapped) {
    // 新周期开始：随机一个新的目标振幅（基于基础振幅）
    const jitterMin = Math.max(0, props.waveJitterMin);
    const jitterMax = Math.max(jitterMin, props.waveJitterMax);
    const factor = randomInRange(jitterMin, jitterMax);
    amplitudeTarget.value = amplitudeBase.value * factor;

    // 同步为本周期随机前景/背景相位偏移，使两层交错
    const range = Math.max(0, Math.min(Math.PI, props.wavePhaseJitterRange));
    // 均匀随机 [-range, +range] 作为新“目标相位偏移”，当前值将缓动过去
    fgPhaseOffsetTarget.value = (Math.random() * 2 - 1) * range;
    bgPhaseOffsetTarget.value = (Math.random() * 2 - 1) * range;
  }
  lastPhaseWrapped = phaseWrapped;
  // 将当前振幅平滑逼近目标振幅
  const smooth = Math.max(0, props.waveJitterSmooth);
  if (smooth > 0) {
    const k = 1 - Math.exp(-smooth * dt); // 指数趋近，帧率无关
    amplitudeCurrent.value += (amplitudeTarget.value - amplitudeCurrent.value) * k;
  } else {
    amplitudeCurrent.value = amplitudeTarget.value;
  }
  // 将相位偏移平滑逼近目标，避免突然跳变导致闪回
  const phaseSmooth = Math.max(0, props.wavePhaseJitterSmooth);
  if (phaseSmooth > 0) {
    const k2 = 1 - Math.exp(-phaseSmooth * dt);
    fgPhaseOffsetCurrent.value += (fgPhaseOffsetTarget.value - fgPhaseOffsetCurrent.value) * k2;
    bgPhaseOffsetCurrent.value += (bgPhaseOffsetTarget.value - bgPhaseOffsetCurrent.value) * k2;
  } else {
    fgPhaseOffsetCurrent.value = fgPhaseOffsetTarget.value;
    bgPhaseOffsetCurrent.value = bgPhaseOffsetTarget.value;
  }
  rafId = requestAnimationFrame(startWave);
};
onMounted(() => { rafId = requestAnimationFrame(startWave); });
onUnmounted(() => { if (rafId) cancelAnimationFrame(rafId); });

const waveClipPath = computed(() => {
  // 采样设置
  const samples = 24; // 越大越平滑
  const amp = Math.max(0, amplitudeCurrent.value);
  const inset = Math.max(0, props.waveInset);
  const cycles = Math.max(0.25, props.waveCycles);
  const phase = wavePhase.value + fgPhaseOffsetCurrent.value;
  const points = [];
  // 顶边到右波缘
  points.push(`0% 0%`);
  // 在 0%→100% 的高度上采样，构造右侧波浪 x 坐标
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;             // 0..1 高度比
    const yPct = (t * 100).toFixed(2) + '%';
    const angle = 2 * Math.PI * (t * cycles) + phase; // 正弦相位
    const dx = Math.sin(angle) * amp;  // 水平偏移（px）
    // 右侧从 100% 往左偏移：基础内缩 + 正弦偏移
    const xExpr = `calc(100% - ${inset + dx}px)`;
    points.push(`${xExpr} ${yPct}`);
  }
  // 回到底边左下角
  points.push(`0% 100%`);
  return `polygon(${points.join(',')})`;
});
const bgWaveClipPath = computed(() => {
  const samples = 24;
  const amp = Math.max(0, amplitudeCurrent.value);
  const inset = Math.max(0, props.waveInset + 2);
  const cycles = Math.max(0.25, props.waveCycles);
  const phase = wavePhase.value + Math.PI / 2 + bgPhaseOffsetCurrent.value;
  const points = [];
  points.push(`0% 0%`);
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const yPct = (t * 100).toFixed(2) + '%';
    const angle = 2 * Math.PI * (t * cycles) + phase;
    const dx = Math.sin(angle) * amp;
    const xExpr = `calc(100% - ${inset + dx}px)`;
    points.push(`${xExpr} ${yPct}`);
  }
  points.push(`0% 100%`);
  return `polygon(${points.join(',')})`;
});

// 暗色基底，与 fillColor 同色系但更暗
const darken = (hex, factor = 0.7) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = Math.max(0, Math.min(255, Math.round(parseInt(m[1], 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(m[2], 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(m[3], 16) * factor)));
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// 按区间设置颜色：
const fillColor = computed(() => {
  if (props.isFinalStage) {
    return '#FFFF00'; // 金黄色
  }
  const p = percent.value;
  if (p < 20) return '#00FF7F';      // 浅绿色
  if (p < 50) return '#FFA500';      // 橙色
  if (p < 80) return '#FF7F50';      // 珊瑚
  return '#FF4500';                  // 橙红色
});
const fillColorDark = computed(() => darken(fillColor.value, 0.6));

// 右侧常显标签：格式 2D 2H（天数为 0 时不显示天）
const remainingText = computed(() => {
  if (!end.value) return '';
  const ms = end.value.getTime() - now.value.getTime();
  if (ms <= 0) return '';
  const day = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hour = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const dayPart = day > 0 ? `${day}D ` : '';
  const hourPart = `${hour}H`;
  return `${dayPart}${hourPart}`.trim();
});

// 标签跟随进度的位置（在进度条前进方向的末端，预留 8px 内边距，不越界）
// const labelLeft = computed(() => {
//   const p = Math.max(0, Math.min(100, percent.value));
//   const offsetPx = 8; // 与边缘保持一点距离
//   // 使用 calc 将百分比位置转换为 CSS 值，同时避免超出容器
//   return `calc(${p}% - ${offsetPx}px)`;
// });

// 调试：打印传入与计算值
const logDebug = () => {
  // 仅在控制台存在时输出
  try {
    // 原始 props
    console.log('[ProgressBackground] props:', {
      startTime: props.startTime,
      endTime: props.endTime,
      currentTime: props.currentTime,
    });
    // 解析后的时间与进度
    console.log('[ProgressBackground] parsed:', {
      start: start.value?.toISOString?.() || start.value,
      end: end.value?.toISOString?.() || end.value,
      now: now.value?.toISOString?.() || now.value,
      totalMs: totalMs.value,
      elapsedMs: elapsedMs.value,
      rawPercent: rawPercent.value,
      percent: percent.value,
      width: computedWidth.value,
      isOverdue: isOverdue.value,
    });
  } catch (_) {}
};

// 透传点击到下层：直接将事件派发到卡片容器（最近的 .task_card）
const dispatchToCard = (e) => {
  try {
    // 以 hover 区域父级（progress-background）的父级作为起点寻找卡片，避免 elementFromPoint 选中遮罩本身
    const host = (e.currentTarget && e.currentTarget.parentElement) || document.elementFromPoint(e.clientX, e.clientY);
    if (!host) return;
    const card = host.closest && host.closest('.task_card');
    if (card) {
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      card.dispatchEvent(clickEvent);
    }
  } catch (_) {}
};
const forwardEvent = (e) => dispatchToCard(e);
</script>

<style scoped>
.progress-background {
  position: absolute;
  inset: 0;
  pointer-events: none; /* 容器不拦截事件 */
  z-index: 9; /* 提升层级，确保可悬浮触发 */
}
.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
  pointer-events: none; /* 不阻挡点击，由 hover 区域专门负责触发提示 */
  z-index: 1;
  will-change: clip-path;
}
.progress-fill-bg {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
  mix-blend-mode: multiply; /* 与底色融合作为阴影层 */
  pointer-events: none; /* 不拦截任何交互 */
  z-index: 0;
  will-change: clip-path;
}
.progress-hover-area {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  pointer-events: none; /* 默认不阻挡点击，仅用于定位 tooltip */
}
.overdue-stripe {
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(255, 69, 0, 0.14) 0px,
    rgba(255, 69, 0, 0.14) 10px,
    rgba(255, 69, 0, 0.0) 10px,
    rgba(255, 69, 0, 0.0) 20px
  );
  background-size: 28px 28px;
  background-position: 0 0;
  animation: stripe-move 3s linear infinite;
  border-radius: 10px;
  pointer-events: none; /* 不阻挡交互 */
}

/* 最后一项流程：45° 斜向白色透明光条滑过效果 */
.final-shine {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.final-shine::before {
  content: '';
  position: absolute;
  top: -100%;
  left: -50%;
  width: 100%;
  height: 300%;
  background: linear-gradient(
    45deg,
    rgba(255,255,255,0) 0%,
    rgba(255,255,255,0.0) 35%,
    rgba(255,255,255,0.28) 50%,
    rgba(255,255,255,0.0) 65%,
    rgba(255,255,255,0) 100%
  );
  transform: rotate(0deg);
  animation: shine-sweep 2s linear infinite;
  filter: blur(0.2px);
}

@keyframes shine-sweep {
  0%   { transform: translate(-20%, -20%) rotate(0deg); }
  100% { transform: translate(140%, 40%) rotate(0deg); }
}

@keyframes stripe-move {
  0% { background-position: 0 0; }
  100% { background-position: 28px 28px; }
}

.progress-label {
  position: absolute;
  top: 80%;
  transform: translateY(-50%);
  font-size: 10px;
  color: rgba(85, 37, 5, 0.7); /* 降低文字不透明度以融入背景 */
  /* 叠加两层背景：柔和玻璃效果 + 极淡纹理，增强融合感 */
  background:
    linear-gradient(90deg, rgba(255,255,255,0.28), rgba(255,255,255,0.12)),
    repeating-linear-gradient(-45deg, rgba(255,255,255,0.06) 0 6px, rgba(255,255,255,0.0) 6px 12px);
  backdrop-filter: saturate(120%) blur(2px);
  -webkit-backdrop-filter: saturate(120%) blur(2px);
  border: 1px solid rgba(255,255,255,0.35);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
  padding: 0 6px;
  border-radius: 6px;
  line-height: 18px;
  height: 18px;
  opacity: 0.92; /* 适度整体透明度，进一步融合 */
  mix-blend-mode: multiply; /* 与底色相乘混合，融入进度背景 */
  pointer-events: none;
  z-index: 2; /* 文本置顶显示 */
}
</style>

