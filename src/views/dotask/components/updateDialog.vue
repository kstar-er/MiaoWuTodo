<!-- src/views/dotask/components/updateDialog.vue -->
<template>
  <div class="update-dialog">
    <customDragWindow>
      <template #header>
        <div class="title-header" >
          <div class="title-content">
            <div class="title-text">
              发现新版本
            </div>
          </div>
        </div>
      </template>
    </customDragWindow>

    <div class="content">
      <div class="item">
        <div class="item-label">更新版本：</div>
        <div class="item-value">
          <span>v{{ versionInfo.currentVersion }} 👉 </span>
          <span style="font-weight: bold;">v{{ versionInfo.version }}</span>
        </div>
      </div>

      <div class="item">
        <div class="item-label">更新时间：</div>
        <div class="item-value">{{ versionInfo.pub_date }}</div>
      </div>

      <div class="item">
        <div class="item-label">更新日志：</div>
        <div class="item-value">{{ versionInfo.notes }}</div>
      </div>
    </div>

    <div class="actions">
      <button v-if="!downloading" @click="handleLater" class="btn-base btn-danger">
        稍后更新
      </button>

      <button v-if="!downloading" @click="startUpdate" class="btn-base btn-primary">
        立即更新
      </button>

      <div v-else class="progress-box">
        <div class="progress-hint">正在准备更新，请稍后...</div>
        <div class="progress-bar">
          <div class="progress" :style="{ width: progress + '%' }"></div>
          <span class="progress-text">{{ progress }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import { relaunch } from '@tauri-apps/plugin-process';
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import customDragWindow from '../../components/public/customDragWindow.vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { performUpdate } from '../../../utils/settings/update.ts';

dayjs.extend(utc);
const { proxy } = getCurrentInstance()

let current_win = getCurrentWindow("update_dialog");
onMounted(async () => {
  console.log("更新窗口已挂载完毕");
  await current_win.emit("update-window-ready");
});

const versionInfo = ref({})

let unlistenFn;
onMounted(async () => {
  // 监听来自登录窗口的登录信息
  try {
    unlistenFn = await listen("update-info", async (event) => {
      const { token, data } = event.payload;
      // 存储登录信息到本地
      sessionStorage.setItem("token", token);
      versionInfo.value = {
        ...data,
        pub_date: dayjs.utc(data.pub_date?.split('.')[0]).local().format('YYYY-MM-DD HH:mm:ss')
      }
      return;
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }
});

// 在组件卸载时移除监听器
onUnmounted(() => {
  unlistenFn?.();
});

const downloading = ref(false);
const progress = ref(0);

/**
 * 稍后更新
 * 给主窗口发送取消更新消息
 */
const handleLater = () => {
  let main_win = getCurrentWindow(versionInfo.win); // 主窗口
  main_win.emit(`${versionInfo.win}-update-cancel`)

  unlistenFn?.();
  current_win.destroy()
};

/**
 * 
 * 立即更新
 */
const startUpdate = async () => {
  downloading.value = true;
  progress.value = 0;

  try {
    await performUpdate(
      (p) => {
        progress.value = p.toFixed(2);
      },
      () => {
        relaunch();
      }
    );
  } catch (error) {
    proxy.$message.error('更新失败，请重试');
    downloading.value = false;
  }
};
</script>

<style lang="less" scoped>
@import "../../../assets/global.less";
.update-dialog {
  width: 100vw;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #333;
}

.title-header {
  padding: 15px 20px;
  background-color: #d9cbb8;
  will-change: transform;
  .title-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title-text {
      font-size: larger;
      color: #7f3a12;
      font-weight: 600;
      background-blend-mode: multiply;
      text-shadow: 2px 3px 1px #8b451330;
    }
  }
}

.content {
  padding: 20px;
  margin-bottom: 20px;
  height: 220px;
  overflow-y: auto;
}

.item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  width: 100%;
  .item-label {
    width: 16%;
    font-weight: bold;
  }
  .item-value {
    width: 84%;
  }
}

.changelog {
  max-height: 100px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  margin-top: 5px;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 10px;
}

.btn-base {
  font-size: 14px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  letter-spacing: 1px;
  padding: 8px 16px;
}

.progress-box {
  width: 100%;
  .progress-hint {
    display: flex;
    justify-content: center;
    font-size: 13px;
    color: #999;
  }
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #e0e0e0;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: #a0522d;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
}
</style>