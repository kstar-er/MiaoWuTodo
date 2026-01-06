<!-- 自定义窗口拖拽 -->
<template>
  <div 
    class="draggable-header" 
    @mousedown="startDrag"
  >
    <slot name="header"></slot>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";
import { getCurrentWindow, LogicalPosition, PhysicalSize } from "@tauri-apps/api/window";
import { saveWindowPosition, getWindowPosition } from "../../../utils";

const isDragging = ref(false);
let isUpdating = false;
let startX = 0;
let startY = 0;

const windowInstance = getCurrentWindow();
const windowId = windowInstance.label;

// 恢复窗口上次保存的位置
onMounted(async () => {
  const savedPosition = getWindowPosition(windowId);
  if (savedPosition) {
    const newPosition = new LogicalPosition(savedPosition.x, savedPosition.y);
    await windowInstance.setPosition(newPosition);
  }
});

// 开始拖拽
const startDrag = (event: MouseEvent) => {
  isDragging.value = true;
  startX = event.clientX;
  startY = event.clientY;
  // 添加监听事件
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('mousemove', onDrag);
}

// 获取屏幕尺寸
const getScreenSize = (): { width: number; height: number } => {
  return {
    width: window.screen.width,
    height: window.screen.height,
  };
}

// 确保窗口不超出屏幕范围
const constrainToScreen = async(newX: number, newY: number): Promise<LogicalPosition> => {
  const screenSize = await getScreenSize();
  const windowSize = await windowInstance.innerSize();
  const scaleFactor = await windowInstance.scaleFactor();
  const adjustedWindowSize = { width: windowSize.width / scaleFactor, height: windowSize.height / scaleFactor };
  const maxWidth = screenSize.width - adjustedWindowSize.width;
  const maxHeight = screenSize.height - adjustedWindowSize.height;

  return new LogicalPosition(
    Math.max(0, Math.min(maxWidth, newX)),
    Math.max(0, Math.min(maxHeight, newY))
  );
}

// 拖拽中
const onDrag = async (event: MouseEvent) => {
  if (!isDragging.value || isUpdating) return; // 没有拖拽，直接返回

  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;

  isUpdating = true;
  const position = await windowInstance.innerPosition();
  const scaleFactor = await windowInstance.scaleFactor();
  const adjustedPosition = { x: position.x / scaleFactor, y: position.y / scaleFactor };
  const newX = adjustedPosition.x + deltaX;
  const newY = adjustedPosition.y + deltaY;

  // 确保窗口不超出屏幕范围
  const constrainedPosition = await constrainToScreen(newX, newY);

  // 更新窗口位置
  await windowInstance.setPosition(constrainedPosition);

  // 保存当前位置
  await saveWindowPosition( windowId, constrainedPosition);

  startX = event.clientX - deltaX;
  startY = event.clientY - deltaY;
  isUpdating = false;
}

// 停止拖拽
const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('mousemove', onDrag);
}

onUnmounted(() => {
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
});
</script>

<style scoped>
</style>