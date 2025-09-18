<template>
  <el-icon
    class="add_icon"
    ref="iconRef"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    @click="handleClick"
    @mousedown="startDrag"
    @mouseup="stopDrag"
    @mousedown.prevent
  >
    <CirclePlusFilled />
  </el-icon>
</template>

<script setup>
import { CirclePlusFilled } from "@element-plus/icons-vue";
import { onMounted, ref, nextTick } from "vue";

const position = ref({
  x: 0,
  y: 0,
});
const startPostion = ref({
  startX: 0,
  startY: 0,
});
const iconParams = ref({
  iconWidth: 0,
  iconHeight: 0,
});

let isDragging = ref(false);
const iconRef = ref(null);
let dragTimeout = ref(null);

onMounted(() => {
  getIconParams();
  setInitialPosition(); // 初始化悬浮按钮初始位置
});

const _emits = defineEmits(["onClick"]);

const getIconParams = async () => {
  await nextTick(); // 确保DOM已更新
  if (iconRef.value) {
    // 获取图标尺寸
    const iconRect = iconRef.value.$el.getBoundingClientRect();
    if (iconRect) {
      iconParams.value.iconWidth = iconRect.width;
      iconParams.value.iconHeight = iconRect.height;
    } else {
      console.error("Icon element not found or not ready");
    }
  } else {
    console.error("Element not found");
  }
};
const setInitialPosition = async () => {
  await nextTick();
  if (iconRef.value) {
    // 获取窗口尺寸
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    // 设置初始位置为窗口最下角
    position.value.x =
      windowWidth - iconParams.value.iconWidth - 10;
    position.value.y =
      windowHeight - iconParams.value.iconHeight - 10;
  }
};

const startDrag = (event) => {
  event.preventDefault(); // 阻止默认选中行为
  startPostion.value.startX = event.clientX - position.value.x;
  startPostion.value.startY = event.clientY - position.value.y;
  isDragging.value = true;

  // 设置一个短暂的延迟，防止点击事件触发
  dragTimeout.value = setTimeout(() => {
    isDragging.value = true;
  }, 200);
  window.addEventListener("mousemove", onDrag);
  window.addEventListener("mouseup", stopDrag);
};

const onDrag = (event) => {
  if (isDragging.value) {
    const newX = event.clientX - startPostion.value.startX;
    const newY = event.clientY - startPostion.value.startY;

    // 获取窗口尺寸
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    // 限制拖拽范围
    position.value.x = Math.max(
      0,
      Math.min(
        newX,
        windowWidth - iconParams.value.iconWidth
      )
    );
    position.value.y = Math.max(
      90,
      Math.min(
        newY,
        windowHeight - iconParams.value.iconHeight
      )
    );
  }
};

const stopDrag = () => {
  isDragging.value = false;
  window.removeEventListener("mousemove", onDrag);
  window.removeEventListener("mouseup", stopDrag);
  dragTimeout.value = 0; // 清除延迟 
  console.log("点击事件---1", dragTimeout.value);

  // 吸边处理
  const windowWidth = window.innerWidth;
  const edgeThreshold = windowWidth / 2; // 吸附阈值
  const halfIconWidth = iconParams.value.iconWidth / 2;

  if (position.value.x < edgeThreshold) {
    // 吸附到左边
    position.value.x = 0;
  } else if (
    windowWidth - position.value.x - halfIconWidth <
    edgeThreshold
  ) {
    // 吸附到右边
    position.value.x =
      windowWidth - iconParams.value.iconWidth - 10;
  }
};
const handleClick = (event) => {
  console.log("点击事件---", dragTimeout.value);

  console.log("1111---isDragging", isDragging.value)

  if (!isDragging.value && !dragTimeout.value) {
    // 执行点击事件逻辑
    dragTimeout.value = 0;
    _emits("onClick");
    console.log("点击事件");
  } else {
    // 取消点击事件
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
};
</script>

<style lang="less" scoped>
@import "../../../assets/global.less";

.add_icon {
  position: absolute;
  font-size: 45px;
  color: rgb(212, 117, 73);
  user-select: none;
  background-color: rgb(255, 247, 240);
  border-radius: 50px;
  z-index: 1000;
  cursor: pointer;
  overflow: hidden;
  animation: float 2s infinite ease-in-out;
  transition: all 0.3s ease;
}

.add_icon::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: 0.5s;
}

.add_icon:hover::before {
  left: 100%;
}

.add_icon:hover {
  transform: scale(1.1);
  background-color: rgb(212, 117, 73);
  color: #fff;
  box-shadow: 0 0 15px rgba(212, 117, 73, 0.3);
}



@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
