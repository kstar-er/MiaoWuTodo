<template>
  <div class="side-menu">
    <el-menu
      :default-active="currentIndex"
      mode="horizontal"
      class="el-menu-vertical"
      @select="handleSelect"
      :background-color="'#000000'"
    >
      <el-menu-item index="1" data-tab="projectManagement">
        <el-icon><Folder /></el-icon>
      </el-menu-item>
      <el-menu-item index="2" data-tab="taskManagement">
        <el-icon><Document /></el-icon>
      </el-menu-item>
      <el-menu-item index="3" data-tab="groupManagement">
        <el-icon><User /></el-icon>
      </el-menu-item>
      <el-menu-item index="4" data-tab="settingManagement">
        <el-icon><Setting /></el-icon>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Folder, Document, Setting, User } from '@element-plus/icons-vue';

const props = defineProps({
  currentIndex: {
    type: String,
    default: '1'
  }
});

const emit = defineEmits(['menuSelect']);
const currentMenuIndex = ref(props.currentIndex);

// 监听currentIndex的变化
watch(() => props.currentIndex, (newIndex) => {
  currentMenuIndex.value = newIndex;
});

const handleSelect = (index: string) => {
  currentMenuIndex.value = index;
  emit('menuSelect', index);
};
</script>

<style scoped lang="less">
.side-menu {
  height: 50px;
  width: 100%;
  position: fixed;
  bottom: 0;
  left: 0;
  background: linear-gradient(180deg, #d4b895, #c19a6b);
  z-index: 999;
  box-shadow: 0 -4px 20px rgba(139, 69, 19, 0.2);
  border-top: 1px solid rgba(212, 184, 149, 0.8);
  backdrop-filter: blur(10px);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    background: url('data:image/svg+xml,<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="1" fill="%23ffffff" opacity="0.3"/></svg>') repeat;
    opacity: 0.5;
    pointer-events: none;
  }
}

.el-menu {
  border-right: none;
  display: flex;
  justify-content: center;
  background: transparent !important;

  :deep(.el-menu-item) {
    height: 45px;
    line-height: 45px;
    color: #8b4513;
    font-family: 'Ghibli', sans-serif;
    letter-spacing: 1px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    margin: 0 5px;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      transition: 0.5s;
    }

    &:hover::before {
      left: 100%;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #a0522d;
      transform: translateY(-2px);
    }

    &.is-active {
      color: #8b4513;
      background: rgba(255, 255, 255, 0.25);
      font-weight: 500;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 25px;
        height: 2px;
        background: linear-gradient(90deg, #8b4513, #a0522d);
        border-radius: 2px;
        box-shadow: 0 0 8px rgba(139, 69, 19, 0.3);
      }

      &::before {
        content: '✦';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 10px;
        color: #8b4513;
        opacity: 0.8;
        pointer-events: none;
      }
    }

    .el-icon {
      font-size: 18px;
      margin-right: 4px;
      vertical-align: middle;
      transition: all 0.3s ease;
      color: #8b4513;
    }

    &:hover .el-icon {
      transform: scale(1.1);
      color: #a0522d;
    }
  }
}
</style>