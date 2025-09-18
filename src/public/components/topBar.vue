<!-- 自定义主窗口界面顶部菜单栏 -->
<template>
  <customDragWindow>
    <template #header>
      <div class="top-bar" >
        <div class="title-box">
          <div class="title-icon">
            <img :src="title_icon" alt="" style="width: 20px; height: auto;">
          </div>
          <div class="title-text">
            任务管理桌面端
          </div>
        </div>
        <div class="actions">
          <!-- 置顶按钮 -->
          <div @click="pinWindow" class="actions-pin" :class="{ 'pinned-bg': isPinned }">
            <img :src="imageList.pin" alt="" :class="isPinned ? 'is-pinned' : 'not-pinned'"/>
          </div>
          <div @click="minimizeWindow" class="actions-minus">
            <el-icon color="#ffffffa6"><SemiSelect /></el-icon>
          </div>
          <div @click="refreshWindow" class="actions-refresh">
            <el-icon color="#ffffffd1"><RefreshLeft  /></el-icon>
          </div>
          <div @click="closeWindow" class="actions-close">
            <el-icon color="#ffffffd1"><Close /></el-icon>
          </div>
        </div>
      </div>
    </template>
  </customDragWindow>
</template>
<script setup>
import { ref } from 'vue';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { SemiSelect, Close, RefreshLeft } from '@element-plus/icons-vue';
import customDragWindow from '../../views/components/public/customDragWindow.vue';
import title_icon from '../../assets/pet_image/mainWinIcon.png'
const windowInstance = getCurrentWindow();

const imageList = ref({
  pin: './pin.svg'
})

// 置顶窗口
const isPinned = ref(false); // 是否置顶
const pinWindow = async () => {
  try {
    const newState = !isPinned.value;
    await windowInstance.setAlwaysOnTop(newState);
    isPinned.value = newState;
  } catch (error) {
    console.error('设置置顶状态失败:', error)
  }
}

// 最小化窗口
const minimizeWindow = async () => {
  await windowInstance.minimize();
};

// 刷新数据
const refreshWindow = async () => {
  console.log("topbar")
  window.dispatchEvent(new CustomEvent('window-refresh'));
}

// 关闭窗口
const closeWindow = async () => {
  await windowInstance.close();
};

</script>

<style lang="less" scoped>
.top-bar {
  background: linear-gradient(180deg, #d4b895, #c19a6b);
  height: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  padding-left: 10px;
  .title-box {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    .title-text {
      cursor: default;
      margin-left: 5px;
      font-size: 12px;
      font-weight: 500;
      color: #f5f5f5;
      user-select: none;
    }
  }
  .actions {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    .actions-pin,
    .actions-close,
    .actions-refresh,
    .actions-minus {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 43px;
      height: 30px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    .actions-close:hover {
      background-color: #e81123;
      .el-icon {
        color: #fff;
      }
    }
    .actions-pin:hover,
    .actions-refresh:hover,
    .actions-minus:hover {
      background-color: #ffffff36;
      .el-icon {
        color: #fff;
      }
    }
    .pinned-bg {
      background-color: #ffffff36;
    }
    .is-pinned {
      filter: invert(50%) sepia(100%) saturate(5000%) hue-rotate(30deg);
    }
    .not-pinned {
      filter: invert(82%) sepia(100%) saturate(0%) hue-rotate(275deg) brightness(95%) contrast(100%);
    }
  }
}
</style>