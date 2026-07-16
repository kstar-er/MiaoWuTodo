<template>
  <div 
    v-if="visible" 
    class="context-menu"
    :style="menuStyle"
    @click.stop
    @mouseenter="handleMenuMouseEnter"
    @mouseleave="handleMenuMouseLeave"
  >
    <div class="menu-item" @click="handleTaskBar">
      <span>任务栏</span>
    </div>
    
    <div class="menu-item" @click="handleSmallWindow">
      <span>小窗口</span>
    </div>
    
    <div class="menu-item" @click="handleSwitchPet">
      <span>宠物</span>
    </div>

    
    <div class="menu-item" @click="handleCreateTask">
      <span>新任务</span>
    </div>

    <div class="menu-item" @click="handleAIDialog">
      <span>AI对话</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { createMainWin, createTaskWin, createProjectWin, createPetManagementWin, createTeskWin, createAIDialogWin } from '@/multiwins/action';

// 定义组件名称
defineOptions({ name: 'ContextMenu' });

// 定义props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  petElement: {
    type: Object,
    default: null
  }
});

// 定义emits
const emit = defineEmits(['close', 'show']);

// 菜单位置状态
const menuPosition = ref({ bottom: '25%', left: '50%' });
const autoHideTimer = ref(null);
const isHovering = ref(false);

// 计算菜单样式
const menuStyle = computed(() => ({
  bottom: menuPosition.value.bottom,
  left: menuPosition.value.left,
  transform: 'translateX(-50%)',
  opacity: visible.value ? 1 : 0,
  pointerEvents: visible.value ? 'auto' : 'none'
}));

// 获取visible的引用
const visible = computed(() => props.visible);

// 方案3：直接基于宠物元素位置计算菜单位置
const calculateMenuPositionFromPet = () => {
  try {
    // 如果传入了宠物元素引用，使用精确位置
    if (props.petElement) {
      const petRect = props.petElement.getBoundingClientRect();
      const menuOffset = 0; // 宠物底部上方20px
      const menuBottom = window.innerHeight - petRect.bottom + menuOffset;
      menuPosition.value = {
        bottom: `${Math.max(0, menuBottom)}px`, // 最小距离底部10px
        left: '50%'
      };
      
      return;
    }
    
   
  } catch (error) {
    console.error('计算菜单位置失败:', error);
    // 最终回退到固定位置
    menuPosition.value = { bottom: '25%', left: '50%' };
  }
};

// 监听窗口大小变化和缩放变化
const handleResize = () => {
  calculateMenuPositionFromPet();
};

// 监听visible变化，重新计算位置
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    nextTick(() => {
      calculateMenuPositionFromPet();
      // 清除之前的定时器
      if (autoHideTimer.value) {
        clearTimeout(autoHideTimer.value);
      }
      // 10秒后自动淡去（仅在非悬浮状态下）
      autoHideTimer.value = setTimeout(() => {
        if (!isHovering.value) {
          closeMenu();
        }
      }, 10000);
    });
  } else {
    // 清除定时器
    if (autoHideTimer.value) {
      clearTimeout(autoHideTimer.value);
    }
  }
});

// 监听petElement变化，重新计算位置并添加事件监听
watch(() => props.petElement, (newPetElement, oldPetElement) => {
  // 移除旧元素的事件监听
  if (oldPetElement) {
    oldPetElement.removeEventListener('mouseenter', handlePetMouseEnter);
    oldPetElement.removeEventListener('mouseleave', handlePetMouseLeave);
    oldPetElement.removeEventListener('mousedown', handlePetMouseDown);
  }
  
  // 添加新元素的事件监听
  if (newPetElement) {
    newPetElement.addEventListener('mouseenter', handlePetMouseEnter);
    newPetElement.addEventListener('mouseleave', handlePetMouseLeave);
    newPetElement.addEventListener('mousedown', handlePetMouseDown);
  }
  
  if (props.visible) {
    nextTick(() => {
      calculateMenuPositionFromPet();
    });
  }
});

// 关闭菜单
const closeMenu = () => {
  emit('close');
};

// 处理任务栏
const handleTaskBar = async () => {
  try {
    // 打开主任务窗口
    await createMainWin();
    closeMenu();
  } catch (error) {
    console.error('打开任务栏失败:', error);
  }
};

// 处理小窗口
const handleSmallWindow = async () => {
  try {
    // 创建小窗口
    await createTeskWin();
    closeMenu();
  } catch (error) {
    console.error('创建小窗口失败:', error);
  }
};

// 处理切换宠物
const handleSwitchPet = async () => {
  try {
    // 打开宠物管理窗口
    await createPetManagementWin();
    closeMenu();
  } catch (error) {
    console.error('切换宠物失败:', error);
  }
};

// 处理创建任务
const handleCreateTask = async () => {
  try {
    // 参考 menu.js 中的方法，直接使用 'pet' 作为窗口标签
    if (localStorage.getItem('lastTaskAddData')) {
      const formData = JSON.parse(localStorage.getItem('lastTaskAddData'));
      formData.isCanSelectProject = true; // 是否能够更改项目
      sessionStorage.setItem("formdata", JSON.stringify(formData));
      await createTaskWin('pet');
      console.log("传输的数据:", formData);
    } else {
      const formData = {
        isCanSelectProject: true,
        nickName: "",
      }
      sessionStorage.setItem("formdata", JSON.stringify(formData));

      // 如果没有缓存数据，直接创建任务窗口
      await createTaskWin('pet');
    }
    closeMenu();
  } catch (error) {
    console.error('创建任务失败:', error);
  }
};

// 处理创建项目
const handleCreateProject = async () => {
  try {
    // 创建项目窗口，传入当前窗口标签
    const currentWin = getCurrentWindow();
    const label = await currentWin.label();
    await createProjectWin(label);
    closeMenu();
  } catch (error) {
    console.error('创建项目失败:', error);
  }
};

// 处理AI对话
const handleAIDialog = async () => {
  try {
    // 打开AI对话窗口
    await createAIDialogWin();
    closeMenu();
  } catch (error) {
    console.error('打开AI对话窗口失败:', error);
  }
};

// 点击外部关闭菜单
const handleClickOutside = (event) => {
  const menu = document.querySelector('.context-menu');
  if (menu && !menu.contains(event.target)) {
    closeMenu();
  }
};

// 处理宠物元素鼠标进入
const handlePetMouseEnter = () => {
  isHovering.value = true;
  // 清除自动隐藏定时器
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value);
  }
  // 如果菜单不可见，显示菜单
  if (!props.visible) {
    emit('show');
  }
};

// 处理宠物元素鼠标离开
const handlePetMouseLeave = () => {
  isHovering.value = false;
  // 鼠标离开宠物后，设置延迟隐藏（给用户时间移动到菜单栏）
  autoHideTimer.value = setTimeout(() => {
    closeMenu();
  }, 300);
};

// 处理宠物元素左键点击（拖动意图）
const handlePetMouseDown = (event) => {
  // 只处理左键点击
  if (event.button === 0) {
    closeMenu();
  }
};

// 处理菜单栏鼠标进入
const handleMenuMouseEnter = () => {
  isHovering.value = true;
  // 清除自动隐藏定时器
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value);
  }
};

// 处理菜单栏鼠标离开
const handleMenuMouseLeave = () => {
  isHovering.value = false;
  // 鼠标离开菜单后，设置延迟隐藏
  autoHideTimer.value = setTimeout(() => {
    closeMenu();
  }, 1000);
};

// 监听点击事件
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', handleResize);
  
  // 添加宠物元素事件监听
  if (props.petElement) {
    props.petElement.addEventListener('mouseenter', handlePetMouseEnter);
    props.petElement.addEventListener('mouseleave', handlePetMouseLeave);
    props.petElement.addEventListener('mousedown', handlePetMouseDown);
  }
  
  // 初始计算位置
  calculateMenuPositionFromPet();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', handleResize);
  
  // 移除宠物元素事件监听
  if (props.petElement) {
    props.petElement.removeEventListener('mouseenter', handlePetMouseEnter);
    props.petElement.removeEventListener('mouseleave', handlePetMouseLeave);
    props.petElement.removeEventListener('mousedown', handlePetMouseDown);
  }
  
  // 清除定时器
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value);
  }
});
</script>

<style lang="less" scoped>
.context-menu {
  position: fixed;
  /* 位置通过 JavaScript 动态计算 */
  background: #ffffff;
  border: 0.5px solid #e4e7ed; /* 边框缩小10倍 */
  border-radius: 10px; /* 圆角缩小10倍 */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15); /* 阴影缩小10倍 */
  padding: 4px 9px; /* 内边距缩小10倍 */
  min-width: 120px; /* 横向长条宽度缩小10倍 */
  height: 10px; /* 固定高度缩小10倍 */
  z-index: 9999;
  user-select: none;
  display: flex; /* 使用flexbox布局 */
  align-items: center; /* 垂直居中 */
  justify-content: space-between; /* 左右分布 */
  gap: 0.8px; /* 项目间距缩小10倍 */
  transition: opacity 0.3s ease-out;
  animation: contextMenuSlideUp 0.3s ease-out;
}

.menu-item {
  display: flex;
  flex-direction: column; /* 垂直排列图标和文字 */
  align-items: center;
  justify-content: center;
  padding: 0.8px 1.2px; /* 内边距缩小10倍 */
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 2px; /* 字体大小缩小10倍 */
  color: #606266;
  border-radius: 5px; /* 圆角缩小10倍 */
  min-width: 6px; /* 最小宽度缩小10倍 */
  height: 4px; /* 高度缩小10倍 */
  
  &:hover {
    background-color: #f5f7fa;
    color: #409eff;
    transform: translateY(-1px); /* 悬停效果缩小10倍 */
  }
  
  .el-icon {
    margin-bottom: 1.2px; 
    font-size: 11px; 
    filter: contrast(1.2) brightness(0.9); /* 增强对比度和亮度 */
    -webkit-filter: contrast(1.2) brightness(0.9); /* Webkit兼容 */
  }
  
  span {
    font-size: 8.5px; 
    line-height: 1;
    text-align: center;
    font-weight: 600; /* 加粗字体 */
    -webkit-font-smoothing: antialiased; /* 抗锯齿 */
    -moz-osx-font-smoothing: grayscale; /* Firefox抗锯齿 */
    text-rendering: optimizeLegibility; /* 优化字体渲染 */
    letter-spacing: 0.2px; /* 增加字母间距 */
  }
}

.menu-divider {
  width: 0.1px; 
  height: 3px; 
  background-color: #e4e7ed;
  margin: 0 0.4px; 
}

/* 动画效果 */
.context-menu {
  animation: contextMenuSlideUp 0.3s ease-out;
}

@keyframes contextMenuSlideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(2px); /* 移动距离缩小10倍 */
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
