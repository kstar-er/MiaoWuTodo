<!-- src/components/EmptyState.vue -->
<template>
  <div class="empty-state-container">
    <div class="empty-state-content">
      <img :src="imagePath" alt="空状态" class="empty-image" />
      <p class="empty-text">{{ text }}</p>
      <slot name="append" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    required: true
  }
});

const imagePath = '/emptyRobort.svg';
</script>

<style lang="less" scoped>
.empty-state-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}

.empty-state-content {
  display: flex;
  justify-content: center;
  flex-direction: column;
  text-align: center;
}

@keyframes float-up-down {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
}

.empty-image {
  width: 250px;
  height: 100%;
  animation: float-up-down 2.5s ease-in-out infinite;
}

.empty-text {
  color: #8d8c83;
  font-size: 14px;
  line-height: 1.5;
  cursor: default;
}
</style>