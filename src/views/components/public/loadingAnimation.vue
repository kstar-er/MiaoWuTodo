<!-- LoadingAnimation.vue -->
<template>
  <div v-if="loading" class="loading-animation">
    <div class="spinner"></div>
    <p style="color: gray">{{ loadingText }}</p>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  loading: {
    type: Boolean,
    required: true,
    default: false,
  },
  loadingText: {
    type: String,
    default: "加载中...",
  },
});
</script>

<style lang="less" scoped>
.loading-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #8b4513;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>