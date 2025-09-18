<template>
  <div class="update-content-container">
    <div class="update-content-header">
      <div class="header-left">
        <h2 class="page-title">更新内容</h2>
      </div>
      <el-button type="primary" @click="goBack">返回</el-button>
    </div>
    <div class="update-content-body">
      <el-card class="content-card">
        <div class="text-content">{{ content }}</div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const content = ref(route.query.content || '暂无更新内容')

const goBack = () => {
  router.push({
    name: 'settingManagement'
  })
}
</script>

<style scoped>
.update-content-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20px;
  background-color: var(--el-bg-color);
  display: flex;
  flex-direction: column;
}

.update-content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  color: #8b4513;
  text-shadow: 2px 2px 4px rgba(139, 69, 19, 0.1);
  font-family: 'Ghibli', sans-serif;
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 5px;

}

.update-content-body {
  flex: 1;
  overflow: auto;
  position: relative;
}

.content-card {
  height: 100%;
  box-shadow: var(--el-box-shadow-light);
}

.text-content {
  padding: 20px;
  line-height: 1.6;
  white-space: pre-wrap;
}

:deep(.text-content h1) {
  font-size: 24px;
  margin-bottom: 20px;
}

:deep(.text-content h2) {
  font-size: 20px;
  margin: 15px 0;
}

:deep(.text-content p) {
  margin: 10px 0;
}

:deep(.text-content ul) {
  margin: 10px 0;
  padding-left: 20px;
}

:deep(.text-content li) {
  margin: 5px 0;
}
</style> 