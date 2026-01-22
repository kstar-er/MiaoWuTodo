<template>
  <!-- 包裹整个宠物内容的可拖拽区域 -->
  <div class="content-area" @contextmenu="showContextMenu">
    <div class="pet-body" ref="petBodyRef" @mousedown="startDrag">
      <img :src="defaultPetSrc" alt="宠物" id="pet" />
      <canvas id="canvas" style="display: none"></canvas>
      
      <!-- Bell通知图标 -->
      <div v-if="messageCount > 0" class="notification-bell" @click="showNotificationDialog">
        <el-icon><Bell /></el-icon>
        <!-- 消息数量提示 -->
        <div class="message-badge">{{ messageCount }}</div>
      </div>
      
      <!-- 感叹号提示图标 -->
      <div v-if="outTimeCount > 0" class="hexagon-alert" @click="openOverdueInMain">
        <div class="hexagon-shape">
          <img src="/感叹号.svg" alt="感叹号" class="exclamation-svg" />
        </div>
      </div>
    </div>
    
         <!-- 右键菜单 -->
     <ContextMenu 
       :visible="contextMenuVisible"
       :petElement="petBodyRef"
       @close="closeContextMenu"
     />
  </div>
</template>

<script setup>
import { ref, onUnmounted, onMounted, computed } from "vue";
import { getCurrentWindow, LogicalPosition } from "@tauri-apps/api/window";

import { listen } from "@tauri-apps/api/event";
import { saveWindowPosition, getWindowPosition } from "../../utils/index.js";
import { preloadImagesFromDirectory, loadConfigFile } from "../../utils/imageLoader";
import { Bell } from '@element-plus/icons-vue';
import { createNotificationWin,createMainWin } from '@/multiwins/action';
import webSocketService from '@/utils/webSocket/websocket';
import ContextMenu from './components/ContextMenu.vue';

// 宠物图片来源
const defaultPetSrc = ref('');
let pet = ref(null);
let selectedPetSrc = ref(null);

// 消息缓存相关
const MESSAGE_CACHE_KEY = 'notification_messages';
const cachedMessages = ref([]);

// 超时任务缓存键
const OVERDUE_COUNT_KEY = 'overdue_count';

// 计算消息数量
const messageCount = computed(() => cachedMessages.value.length);
var outTimeCount = 0;

// 右键菜单状态
const contextMenuVisible = ref(false);

// 宠物元素引用
const petBodyRef = ref(null);

// 从缓存加载消息
const loadMessagesFromCache = () => {
  try {
    const cached = localStorage.getItem(MESSAGE_CACHE_KEY);
    if (cached) {
      cachedMessages.value = JSON.parse(cached);
    } else {
      cachedMessages.value = [];
    }
  } catch (error) {
    console.error('加载消息缓存失败:', error);
    cachedMessages.value = [];
  }
};

// 添加消息到缓存
const addMessageToCache = (msg) => {
  let messages = [];
  try {
    messages = JSON.parse(localStorage.getItem(MESSAGE_CACHE_KEY)) || [];
  } catch {}
  
  const newMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content: msg,
    timestamp: Date.now()
  };
  
  messages.unshift(newMessage);
  localStorage.setItem(MESSAGE_CACHE_KEY, JSON.stringify(messages));
  
  // 更新本地状态
  cachedMessages.value = messages;
};

// WebSocket消息处理
const handleWebSocketMessage = async (data) => {
  const notificationMsg = data.msg || '您有新的任务待处理';
  // 总是将消息添加到缓存
  addMessageToCache(notificationMsg);
};

// 检查并连接WebSocket
const checkAndConnectWebSocket = () => {
  console.log("检查并连接WebSocket");
  const userInfo = sessionStorage.getItem('userInfo')
  if (userInfo) {
    try {
      const userData = JSON.parse(userInfo)
      if (userData && userData.userId) {
        console.log('宠物页面连接 WebSocket')
        webSocketService.connect(userData.userId)
      }
    } catch (error) {
      console.error('解析用户信息失败:', error)
    }
  }
};

// 监听缓存变化
let cacheCheckTimer = null;
let cacheCleanup = null;

const startCacheListener = () => {
  // 监听storage事件
  const handleStorageChange = (e) => {
    if (e.key === MESSAGE_CACHE_KEY) {
      loadMessagesFromCache();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // 定期检查缓存
  cacheCheckTimer = setInterval(() => {
    loadMessagesFromCache();
  }, 1000);
  
  // 保存清理函数
  cacheCleanup = () => {
    window.removeEventListener('storage', handleStorageChange);
    if (cacheCheckTimer) {
      clearInterval(cacheCheckTimer);
    }
  };
};

// 显示通知对话框
const showNotificationDialog = async () => {
  await createNotificationWin();
};
// 设置宠物的状态枚举
// CRAWL是爬到顶部
const PetStatus = {
  STAND: "stand",
  WALK: "walk",
  SIT: "sit",
  GREET: "greet",
  CRAWL: "crawl",
  CLIMB: "climb",
  JUMP: "jump",
  FALL: "fall",
  DRAG: "drag",
};

// 当前宠物状态
let currentPetStatus = ref(PetStatus.WALK);
// 动画控制
const animationState = {
  currentAnimationId: null,
  isTransitioning: false,
  isUserControlled: false, // 标记是否处于用户控制状态（如拖拽）
  autoPlayTimer: null, // 自动播放定时器
};

// 可以自动切换的状态列表
const autoPlayStates = [
  PetStatus.WALK,
  PetStatus.SIT,
  PetStatus.STAND,
  PetStatus.GREET,
];

// 随机切换状态的函数
function randomizeState() {
  // 如果正在被用户控制，不执行随机动作
  if (animationState.isUserControlled) {
    return;
  }

  // 获取当前状态在可选状态中的索引
  const currentIndex = autoPlayStates.indexOf(currentPetStatus.value);

  // 从其他状态中随机选择一个（避免重复当前状态）
  let availableStates = autoPlayStates.filter(
    (_, index) => index !== currentIndex
  );
  const randomState =
    availableStates[Math.floor(Math.random() * availableStates.length)];

  // 更新状态
  updatePetStatus(randomState);
}

// 启动自动播放
function startAutoPlay() {
  // 清除可能存在的旧定时器
  if (animationState.autoPlayTimer) {
    clearInterval(animationState.autoPlayTimer);
  }

  // 设置新的定时器，每5-10秒随机切换一次状态
  animationState.autoPlayTimer = setInterval(() => {
    randomizeState();
  }, Math.random() * 5000 + 5000); // 5000-10000ms之间的随机时间
}

// 停止自动播放
function stopAutoPlay() {
  if (animationState.autoPlayTimer) {
    clearInterval(animationState.autoPlayTimer);
    animationState.autoPlayTimer = null;
  }
}
// 根据状态更新宠物图片的路径
function updatePetStatus(newStatus) {
  if (Object.values(PetStatus).includes(newStatus)) {
    currentPetStatus.value = newStatus;
    updateFrame();
  } else {
    console.error("Invalid pet status:", newStatus);
  }
}

const tauriWindow = getCurrentWindow();
const windowId = tauriWindow.label;
onMounted(async () => {
  console.log("宠物窗口已挂载完毕");
  await tauriWindow.emit("window-ready");
  console.log("宠物窗口 window-ready 事件已发送");
});

// 获取上次的位置
onMounted(async () => {
  const savedPosition = getWindowPosition(windowId);
  if (savedPosition) {
    const newPosition = new LogicalPosition(savedPosition.x, savedPosition.y);
    await tauriWindow.setPosition(newPosition);
  }
});

let unlistenFn, unlistenFn1, unlistenFn2;
onMounted(async () => {
  // 监听来自登录窗口的登录信息
  try {
    unlistenFn = await listen("login-info", async (event) => {
      console.log("宠物窗口接收到登录信息:", event.payload);
      const { token, userInfo } = event.payload;
      // 存储登录信息到本地
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("userInfo", JSON.stringify(userInfo));
      console.log("宠物窗口登录信息已保存");
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }

  try {
    unlistenFn1 = await listen("pet-task-detail-info-close", async (event) => {
      const { action } = event.payload;
      if (action === "cancel") {
        await resetLocalFormdata();
      }
      return;
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }

  // 监听通知消息更新
  try {
    unlistenFn2 = await listen("update-notification-count", async (event) => {
      // 重新加载消息缓存以更新数量
      loadMessagesFromCache();
    });
  } catch (error) {
    console.error("通知消息监听设置失败:", error);
  }

  // 初始化WebSocket连接
  checkAndConnectWebSocket();
});

// 在组件卸载时移除监听器
onUnmounted(() => {
  unlistenFn?.();
  unlistenFn1?.();
  unlistenFn2?.();
  
  // 清理缓存监听
  if (cacheCleanup) {
    cacheCleanup();
  }
  
  // 移除WebSocket消息处理器
  webSocketService.removeMessageHandler(handleWebSocketMessage);
});

/**
 * 重置本地存储
 */
const resetLocalFormdata = async () => {
  if (sessionStorage.getItem("formdata")) {
    sessionStorage.removeItem("formdata");
  }
}

// 加载用户选择的宠物
onMounted(() => {
  // 初始加载图片
  loadPetImage();
  // 启动自动播放
  startAutoPlay();
  // 加载消息缓存
  loadMessagesFromCache();
  // 启动缓存监听
  startCacheListener();
  
  // 添加WebSocket消息处理器
  webSocketService.addMessageHandler(handleWebSocketMessage);

  // 加载并监听超时任务数量
  loadOverdueCount();
  startOverdueCountListener();
});

const showContextMenu = (e) => {
  console.log("show context menu");
  e.preventDefault();
  e.stopPropagation();
  
  // 显示菜单
  contextMenuVisible.value = true;
  
  // 确保不会干扰宠物的动作状态，但不要在拖拽时重置状态
  if (animationState.isUserControlled && !isDragging.value) {
    animationState.isUserControlled = false;
    startAutoPlay();
  }
};

const closeContextMenu = () => {
  contextMenuVisible.value = false;
};

// 拖拽状态控制
const isDragging = ref(false);
let startX = 0;
let startY = 0;
let isUpdating = false;

// 鼠标按下时触发
const startDrag = async (e) => {
  // 如果是右键点击，不启动拖拽
  if (e.button === 2) {
    return;
  }
  
  console.log("开始拖拽");
  isDragging.value = true;
  
  // 记录鼠标起始位置
  startX = e.clientX;
  startY = e.clientY;
  
  console.log("起始鼠标位置:", { x: startX, y: startY });
  
  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", stopDrag);

  // 标记为用户控制状态并停止自动播放
  animationState.isUserControlled = true;
  stopAutoPlay();

  // 切换到拖拽状态
  console.log("切换到拖拽状态");
  updatePetStatus(PetStatus.DRAG);
};

// 鼠标移动时更新窗口位置
const handleDrag = async (e) => {
  if (!isDragging.value || isUpdating) return;
  
  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;

  isUpdating = true;
  
  try {
    const position = await tauriWindow.innerPosition();
    const scaleFactor = await tauriWindow.scaleFactor();
    const adjustedPosition = { x: position.x / scaleFactor, y: position.y / scaleFactor };
    const newX = adjustedPosition.x + deltaX;
    const newY = adjustedPosition.y + deltaY;
    
    const newPosition = new LogicalPosition(newX, newY);
    
    // 更新窗口位置
    await tauriWindow.setPosition(newPosition);
    
    // 保存当前位置
    await saveWindowPosition(windowId, newPosition);
    
    // 更新起始鼠标位置，避免累积误差
    startX = e.clientX - deltaX;
    startY = e.clientY - deltaY;
    
  } catch (error) {
    console.error("拖拽更新位置失败:", error);
  } finally {
    isUpdating = false;
  }
};

// 停止拖拽
const stopDrag = async () => {
  if (!isDragging.value) return;
  
  isDragging.value = false;
  console.log("拖拽结束");
  
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);

  // 重置用户控制状态
  animationState.isUserControlled = false;
  
  // 确保动画状态正确重置，避免闪烁
  if (animationState.currentAnimationId) {
    cancelAnimationFrame(animationState.currentAnimationId);
    animationState.currentAnimationId = null;
  }
  animationState.isTransitioning = false;
  
  // 立即切换到站立状态
  console.log("切换到站立状态");
  updatePetStatus(PetStatus.STAND);

  // 延迟一段时间后重新启动自动播放
  setTimeout(() => {
    if (!isDragging.value && !animationState.isUserControlled) {
      // 确保用户没有重新开始拖拽且不在用户控制状态
      console.log("重新启动自动播放");
      startAutoPlay();
    }
  }, 3000); // 3秒后恢复自动播放
};

onUnmounted(() => {
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
});

const image = new Image();

image.onload = () => {
  updateFrame();
};
image.onerror = (event) => {
  console.error("Failed to load image:", event.target.src);
  // 这里可以添加错误处理逻辑，比如显示备用图像或通知用户
};
// 动态加载宠物图片
async function loadPetImage() {
  try {
    console.log("开始加载宠物图片...");
    
    // 直接使用默认宠物图片路径
    const defaultPetName = 'shimeji_Germouser';
    const defaultImagePath = `/media/${defaultPetName}.png`;
    
    console.log("设置默认图片路径:", defaultImagePath);
    defaultPetSrc.value = defaultImagePath;

    // 获取用户选择的宠物图片
    const savedPetSrc = localStorage.getItem('selectedPet');
    if (savedPetSrc) {
      selectedPetSrc.value = savedPetSrc;
      console.log('使用保存的宠物图片:', selectedPetSrc.value);
    }

    // 使用用户选择的图片或默认图片
    const imagePath = selectedPetSrc.value || defaultPetSrc.value;
    console.log('最终图片路径:', imagePath);
    
    // 设置图片源
    image.src = imagePath;
    
    console.log("宠物图片加载完成");
  } catch (error) {
    console.error('加载宠物图片失败:', error);
  }
}

// 传入帧索引，更新宠物图像到指定帧
async function updateFrame() {
  const defaultPetName = 'shimeji_Germouser';
  try {
    console.log("更新帧，当前状态:", currentPetStatus.value);
    
    // 确保默认图片已设置
    if (!defaultPetSrc.value) {
      defaultPetSrc.value = `/media/${defaultPetName}.png`;
    }

    // 从路径中提取宠物名称
    var name = localStorage.getItem('selectedPetName');
    if (!name) {
      name = defaultPetName;
    }
    console.log("加载配置文件:", name);

    const config = await loadConfigFile(name);
    console.log("配置文件:", config);
    loadPetFrame(image, config, currentPetStatus.value);
  } catch (error) {
    console.error('更新帧失败:', error);
  }
}
function loadPetFrame(image, config, status) {
  // 如果正在过渡中，不启动新的动画
  if (animationState.isTransitioning) {
    return;
  }

  // 标记开始过渡
  animationState.isTransitioning = true;

  // 清理现有动画
  if (animationState.currentAnimationId) {
    cancelAnimationFrame(animationState.currentAnimationId);
    animationState.currentAnimationId = null;
  }

  // 配置参数
  const frameSize = config.frameSize;
  const stats = config.states;
  const currentState = stats[status] || stats[Object.keys(stats)[0]];
  const spriteLine = currentState.spriteLine;
  const maxFrames = currentState.frameMax;

  // 动画控制参数
  const fps = currentState.fps || 5; // 从配置中获取fps，如果没有则默认为5
  const frameInterval = 1000 / fps;
  let frameIndex = 0;
  let lastFrameTime = 0;

  // 设置画布
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = frameSize;
  canvas.height = frameSize;

  // 动画函数
  function animate(currentTime) {
    // 检查状态是否已经改变，如果改变则停止当前动画
    if (currentPetStatus.value !== status) {
      animationState.isTransitioning = false;
      return;
    }

    if (!lastFrameTime) {
      lastFrameTime = currentTime;
    }

    const elapsed = currentTime - lastFrameTime;

    if (elapsed >= frameInterval) {
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制当前帧
      ctx.drawImage(
        image,
        frameSize * frameIndex,
        (spriteLine - 1) * frameSize,
        frameSize,
        frameSize,
        0,
        0,
        frameSize,
        frameSize
      );

      // 更新图像
      const petImage = document.getElementById("pet");
      petImage.src = canvas.toDataURL();

      // 更新帧索引
      frameIndex = (frameIndex + 1) % maxFrames;

      // 更新时间戳
      lastFrameTime = currentTime - (elapsed % frameInterval);
    }

    // 只有当状态没有改变时才继续动画
    if (currentPetStatus.value === status) {
      animationState.currentAnimationId = requestAnimationFrame(animate);
    } else {
      // 如果状态已改变，结束当前动画
      animationState.isTransitioning = false;
    }
  }

  // 开始新的动画循环
  animationState.currentAnimationId = requestAnimationFrame(animate);

  // 标记过渡结束
  setTimeout(() => {
    animationState.isTransitioning = false;
  }, frameInterval);
}

// 在组件卸载时清理动画
onUnmounted(() => {
  // 清理所有动画
  if (animationState.currentAnimationId) {
    cancelAnimationFrame(animationState.currentAnimationId);
    animationState.currentAnimationId = null;
  }
  // 清理自动播放定时器
  stopAutoPlay();
  // 清理缓存监听
  if (cacheCleanup) {
    cacheCleanup();
  }
  // 重置所有状态
  animationState.isTransitioning = false;
  animationState.isUserControlled = false;
  
  // 完全清理WebSocket连接
  webSocketService.cleanup();
});

// 从缓存加载超时任务数量
const loadOverdueCount = () => {
  try {
    const cnt = parseInt(localStorage.getItem(OVERDUE_COUNT_KEY) || '0', 10);
    if (!Number.isNaN(cnt)) {
      outTimeCount = cnt;
    } else {
      outTimeCount = 0;
    }
  } catch {
    outTimeCount = 0;
  }
};

// 监听缓存变化，实时更新超时数量
const startOverdueCountListener = () => {
  const handleStorageChange = (e) => {
    if (e.key === OVERDUE_COUNT_KEY) {
      loadOverdueCount();
    }
  };
  window.addEventListener('storage', handleStorageChange);
  cacheCleanup = () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

// 点击感叹号 -> 打开主任务窗口并只显示超时任务
const openOverdueInMain = async () => {
  try {
    // 设置标记：仅显示超时任务
    localStorage.setItem('overdue_only', 'true');
    // 打开/显示主任务窗口
    await createMainWin();
    // 聚焦到任务管理页（索引页内置导航，使用自定义刷新事件）
    window.dispatchEvent(new Event('window-refresh'));
  } catch (e) {
    console.error('打开主任务窗口失败:', e);
  }
};

</script>
<style>
.pet-body {
  display: flex;
  /* 使用Flexbox布局 */
  justify-content: center;
  /* 水平居中 */
  align-items: center;
  /* 垂直居中 */
  cursor: move;
  transform: translateZ(0);
  backface-visibility: hidden;
  pointer-events: auto;
  background-color: transparent;
  /* 鼠标显示为可拖拽样式 */
  position: relative;
  /* 为Bell图标定位提供参考 */
  width: 100%;
  height: 100%;
}

.pet-body img {
  width: 100%;
  /* 图片宽度填充满容器 */
  height: auto;
  /* 高度自动调整以保持图片比例 */
  object-fit: cover;
  /* 确保图片覆盖整个容器，即使比例不匹配 */
  pointer-events: none;
  /* 防止图片拦截事件 */
  user-select: none;
  /* 防止图片被选中 */
  transform: translateZ(0);
  will-change: transform;
  /* 启用GPU加速 */
  image-rendering: crisp-edges;
}

/* Bell通知图标样式 */
.notification-bell {
  position: absolute;
  top: 5px;
  right: 5px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-bell:hover {
  background-color: rgba(255, 255, 255, 1);
  transform: scale(1.1);
}

.notification-bell .el-icon {
  font-size: 16px;
  color: #409EFF;
}

.message-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: #f56c6c;
  color: white;
  border-radius: 50%;
  min-width: 14px;
  height: 14px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* 六边形提示图标样式 */
.hexagon-alert {
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  cursor: pointer;
  z-index: 1001;
  animation: float 3s ease-in-out infinite;
  pointer-events: auto;
}

.hexagon-shape {
  width: 32px;
  height: 32px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 隐藏旧的六边形伪元素 */
.hexagon-shape::before,
.hexagon-shape::after {
  display: none !important;
  content: none !important;
}

/* 背景色容器，仅改变背景，不影响SVG本身颜色 */
.alert-bg {
  position: absolute;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  z-index: 1;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.exclamation-svg {
  position: relative;
  z-index: 2;
  width: 18px;
  height: 18px;
  display: block;
  margin: 0 auto;
  pointer-events: none;
}



@keyframes float {
  0%, 100% {
    transform: translateX(-50%) translateY(0px);
  }
  50% {
    transform: translateX(-50%) translateY(-5px);
  }
}

.hexagon-alert:hover {
  animation-play-state: paused;
}

.hexagon-alert:hover .hexagon-shape::before,
.hexagon-alert:hover .hexagon-shape::after {
  transform: scale(1.1);
}

.content-area {
  width: 100vw;
  height: 100vh;
  user-select: none;
  /* 防止文本选中 */
  overflow: visible; /* 允许右键菜单显示 */
}

html,
body,
.container {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  background-color: rgba(0, 0, 0, 0) !important;
  overflow: hidden;
  border-radius: 0;
}
</style>
