<template>
  <top-bar />
  <side-menu 
    :currentIndex="currentMenuIndex"
    @menuSelect="changePage" 
  />
  <div class="content">
    <component
      ref="pageComponent"
      :is="currentComponent" 
      :selectedProject="currentComponent === taskManagement ? selectedProject : null"
      @projectSelected="handleProjectSelected" 
      @menuSelect="changePage"
    />
  </div>
</template>

<script setup>
import { ref, markRaw, onMounted, onUnmounted } from "vue";
import topBar from "../../public/components/topBar.vue";
import sideMenu from "../../public/components/sideMenu.vue";
import TaskManagement from './taskManagement.vue';
import SettingManagement from './settingManagement.vue';
import GroupManagement from './groupManagement.vue';
import ProjectManagement from './projectManagement.vue';
import WeeklyReportManagement from "./weeklyReportManagement.vue";
const projectManagement = markRaw(ProjectManagement);
const taskManagement = markRaw(TaskManagement);
const settingManagement = markRaw(SettingManagement);
const groupManagement = markRaw(GroupManagement);
const weeklyReportManagement = markRaw(WeeklyReportManagement)

// 定义当前显示的页面
const currentComponent = ref(taskManagement);

// 存储选中的项目信息
const selectedProject = ref(null);

// 当前选中的菜单索引
const currentMenuIndex = ref('2');

// 添加项目选择处理函数
const handleProjectSelected = (project) => {
  selectedProject.value = project;
  // 切换到任务管理页面
  changePage('2');
};

// 修改切换页面逻辑
const changePage = (index) => {
  currentMenuIndex.value = index;
  switch (index) {
    case '1':
      currentComponent.value = projectManagement;
      break;
    case '2':
      currentComponent.value = taskManagement;
      break;
    case '3':
      currentComponent.value = groupManagement;
      break;
    case '4':
      currentComponent.value = weeklyReportManagement;
      break;
    case '5':
      currentComponent.value = settingManagement;
      break;
    default:
      currentComponent.value = taskManagement;
      currentMenuIndex.value = '2';
  }
};

/**
 * 刷新逻辑
 */

// 监听刷新事件
onMounted(() => {
  console.log("index.vue")
  window.addEventListener('window-refresh', handleRefresh);
});

// 卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('window-refresh', handleRefresh);
});

// 处理刷新逻辑
const pageComponent = ref(null)
const handleRefresh = () => {
  if (pageComponent.value) {
    pageComponent.value.initData();
  }
};
</script>

<style>
.top-bar {
  position: fixed; /* 固定在顶部 */
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000; /* 确保覆盖其他内容 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 可选：添加阴影效果 */
}

.content {
  padding-top: 13px;
  margin-bottom: 50px;
}
</style>