<template>
  <!-- 欢迎对话框 -->
  <el-dialog
    v-model="showWelcomeDialog"
    title="欢迎使用喵呜Todo"
    width="300px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    center
    class="welcome-dialog"
  >
    <div class="welcome-content">
      <div class="welcome-icon">🐱</div>
      <p class="welcome-text">
        欢迎您使用喵呜Todo，一起来花1分钟熟悉一下所有功能吧~
      </p>
    </div>
    <template #footer>
      <div class="welcome-actions">
        <el-button @click="skipTour">跳过</el-button>
        <el-button type="primary" @click="startTour">开始了解</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 图片展示对话框 -->
  <el-dialog
    v-model="showImageDialog"
    :title="currentImage.title"
    width="300px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    center
    class="image-dialog"
  >
    <div class="image-content">
      <img :src="currentImage.src" :alt="currentImage.alt" class="tour-image" />
      <p class="image-description">{{ currentImage.description }}</p>
    </div>
    <template #footer>
      <div class="image-actions">
        <el-button v-if="currentImageIndex > 0" @click="prevImage"
          >上一步</el-button
        >
        <el-button type="primary" @click="nextImage">
          {{ currentImageIndex === tourImages.length - 1 ? "完成" : "下一步" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, getCurrentInstance } from "vue"
import tourImgGroup from "../assets/images/tour/群组功能.png"
import tourImgCreate from "../assets/images/tour/创建项目.png"
const { proxy } = getCurrentInstance()
// 本地存储键名
const TOUR_COMPLETED_KEY = "miaoTodo_tour_completed"
const FIRST_LOGIN_KEY = "miaoTodo_first_login"

// 状态管理
const showWelcomeDialog = ref(false)
const showImageDialog = ref(false)
const currentImageIndex = ref(0)

// 计算当前显示的图片
const currentImage = computed(() => {
  return tourImages.value[currentImageIndex.value] || tourImages.value[0]
})

// 引导图片数据
const tourImages = ref([
  {
    src: tourImgGroup,
    alt: "群组功能",
    title: "群组功能",
    description: "添加好友或者群组，邀请小伙伴"
  },
  {
    src: tourImgCreate,
    alt: "项目或任务功能",
    title: "项目或任务功能",
    description: "创建项目、分配任务、跟踪进度，让团队协作更高效"
  }
])

// 检查是否是首次登录
const checkFirstLogin = () => {
  const isFirstLogin = localStorage.getItem(FIRST_LOGIN_KEY) !== "true"
  const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY) === "true"

  console.log("isFirstLogin:", isFirstLogin, "tourCompleted:", tourCompleted)

  if (isFirstLogin && !tourCompleted) {
    showWelcomeDialog.value = true
  } else {
    // showWelcomeDialog.value = true
  }
}

// 开始引导
const startTour = () => {
  showWelcomeDialog.value = false
  localStorage.setItem(FIRST_LOGIN_KEY, "true")
  proxy.$emit("guide")
  //currentImageIndex.value = 0 // 重置到第一张图片
  // showImageDialog.value = true
}

// 下一张图片
const nextImage = () => {
  if (currentImageIndex.value < tourImages.value.length - 1) {
    currentImageIndex.value++
  } else {
    // 最后一张图片，完成引导
    completeTour()
  }
}

// 上一张图片
const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

// 跳过引导
const skipTour = () => {
  showWelcomeDialog.value = false
  showImageDialog.value = false
  localStorage.setItem(FIRST_LOGIN_KEY, "true")
  localStorage.setItem(TOUR_COMPLETED_KEY, "true")
}

// 完成引导
const completeTour = () => {
  showImageDialog.value = false
  localStorage.setItem(TOUR_COMPLETED_KEY, "true")
}

// 手动触发引导（用于测试或重新开始）
const triggerTour = () => {
  localStorage.removeItem(TOUR_COMPLETED_KEY)
  localStorage.removeItem(FIRST_LOGIN_KEY)
  currentImageIndex.value = 0 // 重置到第一张图片
  showWelcomeDialog.value = true
}

// 暴露方法供外部调用
defineExpose({
  startTour,
  skipTour,
  checkFirstLogin,
  triggerTour
})
</script>

<style lang="less" scoped>
.welcome-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }

  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #8b4513, #a0522d);
    color: white;
    border-radius: 12px 12px 0 0;
    padding: 20px;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
    }
  }

  :deep(.el-dialog__body) {
    padding: 30px;
  }

  :deep(.el-dialog__footer) {
    padding: 20px 30px;
    border-top: 1px solid #f0f0f0;
  }
}

.welcome-content {
  text-align: center;

  .welcome-icon {
    font-size: 48px;
    margin-bottom: 20px;
  }

  .welcome-text {
    font-size: 16px;
    color: #666;
    line-height: 1.6;
    margin: 0;
  }
}

.welcome-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.image-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }

  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #8b4513, #a0522d);
    color: white;
    border-radius: 12px 12px 0 0;
    padding: 20px;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
    }
  }

  :deep(.el-dialog__body) {
    padding: 30px;
  }

  :deep(.el-dialog__footer) {
    padding: 20px 30px;
    border-top: 1px solid #f0f0f0;
  }
}

.image-content {
  text-align: center;

  .tour-image {
    width: 100%;
    max-width: 200px;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 15px;
  }

  .image-description {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    margin: 0;
  }
}

.image-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
