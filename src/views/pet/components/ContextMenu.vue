<template>
  <div 
    v-if="visible" 
    class="context-menu"
    :style="menuStyle"
    @click.stop
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
  

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { createMainWin, createTaskWin, createProjectWin, createPetManagementWin, createTeskWin } from '@/multiwins/action';

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
const emit = defineEmits(['close']);

// 菜单位置状态
const menuPosition = ref({ bottom: '25%', left: '50%' });

// 计算菜单样式
const menuStyle = computed(() => ({
  bottom: menuPosition.value.bottom,
  left: menuPosition.value.left,
  transform: 'translateX(-50%)'
}));

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
      
      console.log('基于宠物元素位置计算:', {
        petRect: {
          bottom: petRect.bottom,
          left: petRect.left,
          right: petRect.right,
          width: petRect.width,
          height: petRect.height,
          innerHeight:  window.innerHeight
        },
        menuBottom,
        finalPosition: menuPosition.value
      });
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
    });
  }
});

// 监听petElement变化，重新计算位置
watch(() => props.petElement, () => {
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

// 点击外部关闭菜单
const handleClickOutside = (event) => {
  const menu = document.querySelector('.context-menu');
  if (menu && !menu.contains(event.target)) {
    closeMenu();
  }
};

// 监听点击事件
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('contextmenu', handleClickOutside);
  window.addEventListener('resize', handleResize);
  
  // 初始计算位置
  calculateMenuPositionFromPet();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('contextmenu', handleClickOutside);
  window.removeEventListener('resize', handleResize);
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
