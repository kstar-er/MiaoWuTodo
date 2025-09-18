<template>
  <main class="container">
    <customDragWindow>
      <template #header>
        <div class="drag-header-area">
          <div class="close-btn" @click="handleDialogClose">
            <el-icon>
              <Close />
            </el-icon>
          </div>
        </div>
      </template>
    </customDragWindow>

    <!-- 顶层关闭按钮（保证可见与可点） -->
    <div class="top-close" @click="handleDialogClose">
      <el-icon><Close /></el-icon>
    </div>
    
    <!-- 消息查看区域 -->
    <div class="message_area">
      <div class="message-list">
        <div v-if="cachedMessages.length === 0" class="no-message">
          <el-empty description="暂无消息" />
        </div>
        <div v-else>
          <div 
            v-for="(message, index) in cachedMessages" 
            :key="message.id"
            class="message-item"
          >
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
            <div class="message-actions">
              <el-button 
                size="small" 
                type="danger" 
                circle
                @click="removeMessage(index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>
      <div class="message-actions">
        <el-button 
          size="small" 
          type="danger" 
          circle
          @click="clearAllMessages"
        >
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Close, Delete } from '@element-plus/icons-vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import customDragWindow from "../../views/components/public/customDragWindow.vue"; // 封装窗口拖拽

const cachedMessages = ref([])
let unlistenTauri = null

// 消息缓存键
const MESSAGE_CACHE_KEY = 'notification_messages'

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 从缓存加载消息
const loadMessagesFromCache = () => {
  try {
    const cached = localStorage.getItem(MESSAGE_CACHE_KEY)
    if (cached) {
      const messages = JSON.parse(cached)
      cachedMessages.value = messages
      console.log(`成功加载 ${messages.length} 条消息`)
    } else {
      cachedMessages.value = []
      console.log('缓存为空，清空消息列表')
    }
  } catch (error) {
    console.error('加载消息缓存失败:', error)
    cachedMessages.value = []
  }
}

// 保存消息到缓存
const saveMessagesToCache = () => {
  try {
    localStorage.setItem(MESSAGE_CACHE_KEY, JSON.stringify(cachedMessages.value))
  } catch (error) {
    console.error('保存消息缓存失败:', error)
  }
}

// 添加新消息
const addMessage = (content) => {
  const newMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content: content,
    timestamp: Date.now()
  }
  cachedMessages.value.unshift(newMessage)
  saveMessagesToCache()
}

// 删除单条消息
const removeMessage = (index) => {
  cachedMessages.value.splice(index, 1)
  saveMessagesToCache()
  
  // 如果删除后没有消息了，关闭通知窗口
  if (cachedMessages.value.length === 0) {
    close()
  }
}

// 清空所有消息
const clearAllMessages = () => {
  cachedMessages.value = []
  saveMessagesToCache()
  // 当消息被清空时，关闭通知窗口
  close()
}

// 监听缓存变化，当消息被清空时关闭窗口
let cacheCheckInterval = null

const watchCacheChanges = () => {
  const checkCache = () => {
    try {
      const cached = localStorage.getItem(MESSAGE_CACHE_KEY)
      if (cached) {
        const messages = JSON.parse(cached)
        if (messages.length === 0) {
          close()
        }
      } else {
        // 如果缓存为空，也关闭窗口
        close()
      }
    } catch (error) {
      console.error('检查缓存变化失败:', error)
    }
  }
  
  // 监听storage事件
  window.addEventListener('storage', (e) => {
    if (e.key === MESSAGE_CACHE_KEY) {
      checkCache()
    }
  })
  
  // 定期检查缓存
  cacheCheckInterval = setInterval(checkCache, 1000)
}

// 处理窗口关闭
const handleDialogClose = () => {
  close()
}

// 关闭通知窗口
const close = async () => {
  const window = await getCurrentWindow()
  if (window.label === 'notificationPopup') {
    await window.close()
  }
}

onMounted(async () => {
  // 加载缓存的消息
  loadMessagesFromCache()

  // 监听消息缓存更新
  const handleStorageChange = (e) => {
    if (e.key === MESSAGE_CACHE_KEY) {
      console.log('检测到缓存变化，重新加载消息列表')
      loadMessagesFromCache()
    }
  }
  
  window.addEventListener('storage', handleStorageChange)
  
  // 定期检查缓存变化（用于同窗口内的缓存更新）
  const cacheCheckInterval = setInterval(() => {
    try {
      const cached = localStorage.getItem(MESSAGE_CACHE_KEY)
      if (cached) {
        const messages = JSON.parse(cached)
        // 检查消息数量是否与当前显示的不同
        if (messages.length !== cachedMessages.value.length) {
          console.log(`检测到消息数量变化: ${cachedMessages.value.length} -> ${messages.length}，更新消息列表`)
          loadMessagesFromCache()
        }
      } else {
        // 如果缓存为空但当前有消息，也更新
        if (cachedMessages.value.length > 0) {
          console.log('缓存为空但当前有消息，清空消息列表')
          loadMessagesFromCache()
        }
      }
    } catch (error) {
      console.error('检查缓存变化失败:', error)
    }
  }, 1000) // 每秒检查一次
  
  // 启动缓存监听
  watchCacheChanges()
  
  // 保存清理函数
  const cleanup = () => {
    window.removeEventListener('storage', handleStorageChange)
    clearInterval(cacheCheckInterval)
  }  
  // 在组件卸载时清理
  onUnmounted(() => {
    if (unlistenTauri) unlistenTauri()

    
    // 清理定时器
    if (cacheCheckInterval) {
      clearInterval(cacheCheckInterval)
    }
    
    // 清理缓存监听
    cleanup()
  })
})

defineExpose({
  addMessage
})
</script>

<style lang="less" scoped>
.container {
  margin: 0px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  background: linear-gradient(rgba(245, 245, 245, 0.7), rgba(245, 245, 245, 0.7)),
    url('../../assets/images/ghibli-bg.png') center/cover no-repeat;
  border-radius: 50px;
  box-shadow: 0 0 20px rgba(139, 69, 19, 0.1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(2px);

  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 50%;
    height: 50%;
    background: url('../../assets/images/ghibli-pattern.png') no-repeat;
    background-size: contain;
    opacity: 0.15;
    pointer-events: none;
    transform: translate(-10%, 10%);
    z-index: 0;
  }
}

.message_area {
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 1;
  flex: 1;
  overflow: hidden;
}

.message-list {
  width: 100%;
  max-width: 600px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.message-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.9);
  padding: 16px;
  margin-left: 20px;
  margin-right: 20px;
  margin-bottom: 12px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.1);
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(139, 69, 19, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139, 69, 19, 0.15);
    background: rgba(255, 255, 255, 0.95);
  }
}

.message-content {
  flex: 1;
  margin-right: 12px;
}

.message-text {
  color: #8b4513;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
  word-break: break-all;
  font-family: 'Ghibli', sans-serif;
}

.message-time {
  color: #d4b895;
  font-size: 12px;
  font-family: 'Ghibli', sans-serif;
}

.message-actions {
  flex-shrink: 0;
}

.message-actions .el-button {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  background: rgba(139, 69, 19, 0.1);
  border: 1px solid rgba(139, 69, 19, 0.2);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    background: rgba(139, 69, 19, 0.2);
  }
}

.message-actions .el-button .el-icon {
  font-size: 14px;
  color: #8b4513;
}

.no-message {
  text-align: center;
  padding: 40px 20px;
  color: #8b4513;
  font-family: 'Ghibli', sans-serif;
}

.drag-header-area {
  width: 100%;
  height: 30px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 15px;
  cursor: move;
  -webkit-app-region: drag;
  z-index: 3; /* 提高层级，防止被内容覆盖 */
}

.close-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(139, 69, 19, 0.12);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 4;
  -webkit-app-region: no-drag;
  pointer-events: auto; /* 确保可点击 */

  &:hover {
    background: rgba(139, 69, 19, 0.22);
    transform: scale(1.08);
  }

  :deep(.el-icon) {
    font-size: 16px; /* 增大可见度 */
    color: #8b4513;
  }
}

.top-close {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.6);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 9999; /* 最高层级 */
  cursor: pointer;
  -webkit-app-region: no-drag; /* 可点击 */
}

.top-close:hover { background: rgba(255,255,255,0.8); transform: scale(1.05); }
.top-close :deep(.el-icon) { color: #8b4513; font-size: 16px; }


@font-face {
  font-family: 'Ghibli';
  src: url('../../assets/fonts/DottedSongtiSquareRegular.otf') format('truetype');
}

/* 使用更强大的选择器来覆盖全局样式 */
:global(body) {
  background-color: transparent !important;
}

:global(html) {
  background-color: transparent !important;
}

:global(#app) {
  background-color: transparent !important;
}

:global(.container) {
  background-color: transparent !important;
}

/* 移除其他重复的样式声明 */
:deep(body) {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

html,
body,
.container {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  border-radius: 25px;
}

.message_area {
  animation: fadeIn 1s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 自定义滚动条样式 */
.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-track {
  background: rgba(139, 69, 19, 0.1);
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb {
  background: rgba(139, 69, 19, 0.3);
  border-radius: 3px;
  
  &:hover {
    background: rgba(139, 69, 19, 0.5);
  }
}
</style>