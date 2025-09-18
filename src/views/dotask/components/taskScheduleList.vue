<template>
  <div class="task-schedule-container">
    <!-- 使用 el-scrollbar 包裹 el-segmented 实现左右滑动 -->
    <div class="segmented-container">
      <el-button 
        class="scroll-button left" 
        :icon="ArrowLeft"
        circle
        @click="scrollSegmented('left')"
      />
      <el-scrollbar ref="scrollbarRef" class="segmented-scrollbar">
        <el-segmented
          v-model="activeTab"
          class="schedule-segmented"
          :options="segmentedOptions"
          @change="handleTabChange"
        />
      </el-scrollbar>
      <el-button 
        class="scroll-button right" 
        :icon="ArrowRight"
        circle
        @click="scrollSegmented('right')"
      />
    </div>

    <!-- 搜索框 -->
    <div class="search-bar">
      <el-input
        class="search-input"
        v-model="searchQuery"
        placeholder="请输入搜索任务..."
        clearable
      />
      <el-tooltip content="搜索" placement="top">
        <el-button :icon="Search" @click="doSearch" circle />
      </el-tooltip>
      <el-tooltip content="筛选" placement="top">
        <el-badge :value="filterLength" :hidden="filterLength === 0">
          <el-button :icon="Filter" @click="openFilter" circle />
        </el-badge>
      </el-tooltip>
      <el-tooltip :content="isSorted ? '取消排序' : '按截止时间排序'" placement="top">
        <el-button :icon="Sort" @click="toggleSort" circle :class="{ 'sort-active': isSorted }" />
      </el-tooltip>
    </div>
    <el-divider class="content-divider" />

    <!-- 内容区域 -->
    <div class="scrollable-content" ref="scrollContainer">
      <div
        v-for="(item, gi) in filteredTasks"
        :key="item.schedule"
        v-show="activeTab === item.schedule"
      >
        <!-- 每个进度任务的简介小卡片 -->
        <div
          v-for="(task, index) in item.taskList"
          v-if="item.taskList.length > 0"
        >
          <div class="task_card_list scrollable-task-list">
            <taskCard
              ref="taskCardRefs"
              :task="task"
              :taskList="item.taskList"
              :key="task.id"
              :image-list="imageList"
              :showProjectName="showProjectName"
              :current-time="currentTime"
              @delete="handleDeleteTask"
              @previewImage="handleImage"
              @nextStep="isChangeSchedule"
              @click="openTaskDetail('edit', task, index)"
              @subTaskClick="(subTask) => openSubTaskDetail('edit', subTask, index)"
              @addSubtask="handleAddSubTask"
              @subTaskFinished="handleChangeSubStatus"
            />
          </div>
        </div>
        <!-- 加载更多状态 -->
        <div v-if="item.taskList.length > 0">
            <div v-if="loadingMore" class="loading-more">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载更多...</span>
          </div>
          <div v-if="noMore" class="no-more">
            没有更多数据了
          </div>
        </div>
        <div v-else>
          <el-empty description="No Task List" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import taskCard from "./taskCard.vue";
import { ref, computed, watchEffect, watch, nextTick, onMounted } from "vue";
import { ArrowLeft, ArrowRight, Loading, Search, Filter, Sort } from '@element-plus/icons-vue';

const props = defineProps({
  tasks: {
    type: Array,
    required: true,
  },
  activeTabValue: {
    type: String,
    required: true,
  },
  imageList: {
    type: Object,
    required: true,
  },
  searchQueryValue: {
    type: String,
    required: false,
    default: "",
  },
  loadingMore: {
    type: Boolean,
    required: false,
    default: false
  },
  noMore: {
    type: Boolean,
    required: false,
    default: false
  },
  showProjectName: {
    type: Boolean,
    default: false
  },
  filterLength: {
    type: Number,
    default: 0
  },
  currentTime: {
    type: [String, Number, Date],
    default: null
  }
});

// onMounted(() => {
//   nextTick(() => {
//     autoScrollToActiveTab();
//   });
// });

const emit = defineEmits([
  "update:activeTab",
  "tab-change",
  "update:searchQueryValue",
  "doSearch",
  "openFilter",
  "delete",
  "previewImage", 
  "nextStep",
  "addSubtask",
  "subTaskFinished",
  "taskDetail",
  "update:task"
]);

const activeTab = ref(props.activeTabValue);
const isSorted = ref(false);

// 从本地缓存读取排序状态
const loadSortState = () => {
  const savedSortState = localStorage.getItem('taskScheduleList_sortEnabled');
  if (savedSortState !== null) {
    isSorted.value = JSON.parse(savedSortState);
  }
};

// 保存排序状态到本地缓存
const saveSortState = (sortEnabled) => {
  localStorage.setItem('taskScheduleList_sortEnabled', JSON.stringify(sortEnabled));
};

// 组件挂载时读取缓存
onMounted(() => {
  loadSortState();
});

watchEffect(() => {
  activeTab.value = props.activeTabValue;
  emit("update:activeTab", activeTab.value);
  // nextTick(() => {
  //   autoScrollToActiveTab(); // 当 activeTab 变化时自动滚动
  // });
});


const filteredTasks = computed(() => {
  if (!isSorted.value) {
    return props.tasks;
  }
  
  // 按 deadline 倒序排序，临近超时的放在最上方
  return props.tasks.map(taskGroup => ({
    ...taskGroup,
    taskList: [...taskGroup.taskList].sort((a, b) => {
      // 处理没有 deadline 的情况，将其放在最后
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      
      // 按 deadline 倒序排列（越早的 deadline 越靠前）
      return new Date(a.deadline) - new Date(b.deadline);
    })
  }));
});

/**
 * 任务流程切换
 * @param value 切换后的流程
 * @function autoScrollToActiveTab 自动滚动到当前选中的流程
 */
const handleTabChange = (value) => {
  emit("update:activeTab", value);
  emit("tab-change");
  nextTick(() => {
    autoScrollToActiveTab(); // 当 activeTab 变化时自动滚动
  });
};

// 滚动到当前选中的流程
const autoScrollToActiveTab = () => {
  if (!scrollbarRef.value) return;

  const segmentedEl = scrollbarRef.value.$el.querySelector('.el-segmented');
  const buttons = segmentedEl.querySelectorAll('.el-segmented__item');
  let index = -1;
  buttons.forEach((btn, i) => {
    const btnValue = btn.innerText.trim();
    if (btnValue.startsWith(activeTab.value)) {
      index = i;
    }
  });

  if (index < 0) return;

  const container = segmentedEl.parentElement;
  const button = buttons[index];
  const offsetLeft = button.offsetLeft;
  const scrollWidth = button.offsetWidth;

  // 计算目标位置（居中显示）
  const targetScrollLeft = offsetLeft - (container.clientWidth / 2) + (scrollWidth / 2);

  scrollbarRef.value.setScrollLeft(targetScrollLeft);
};

// 查询
const doSearch = () => {
  emit("doSearch");
};

const searchQuery = ref(props.searchQueryValue);
watchEffect(() => {
  emit("update:searchQueryValue", searchQuery.value);
});

// 打开筛选器进行筛选
const openFilter = () => {
  emit("openFilter");
};

// 切换排序状态
const toggleSort = () => {
  isSorted.value = !isSorted.value;
  saveSortState(isSorted.value);
};

// 删除任务
const handleDeleteTask = (task) => {
  emit("delete", task);
};

// 图片预览
const handleImage = (image) => {
  emit("previewImage", image);
};

// 更新任务流程
const isChangeSchedule = (schedule) => {
  emit("nextStep", schedule);
};

// 任务详情---编辑、新增
const openTaskDetail = (mode, task, index) => {
  emit("taskDetail", mode, task, index);
};

const openSubTaskDetail = (mode, task, index) => {
  emit("taskDetail", mode, task, index);
};

// 添加子任务
const handleAddSubTask = (subtask) => {
  emit("addSubtask", subtask);
};

// 更新子任务--标记为 已完成、未完成
const handleChangeSubStatus = (subtask) => {
  emit("subTaskFinished", subtask);
};


/**
 * 滑动事件
 */
const scrollbarRef = ref(null);
// 滚动处理函数
const scrollSegmented = (direction) => {
  if (!scrollbarRef.value) return;
  
  const scrollbar = scrollbarRef.value.$el.querySelector('.el-scrollbar__wrap');
  const scrollAmount = scrollbar.clientWidth / 1.2;

  if (direction === 'left') {
    scrollbar.scrollTo({
      left: scrollbar.scrollLeft - scrollAmount,
      behavior: 'smooth'
    });
  } else {
    scrollbar.scrollTo({
      left: scrollbar.scrollLeft + scrollAmount,
      behavior: 'smooth'
    });
  }
};

// 为 el-segmented 准备选项数据
const segmentedOptions = computed(() => {
  return filteredTasks.value.map(item => ({
    label: `${item.schedule} (${item.taskCount})`,
    value: item.schedule
  }));
});

/**
 * 收到父组件的更新信息
 */

 const taskCardRefs = ref([]);

const handleUpdateTask = async (updatedTask, index) => {
  await nextTick(); // 等待 DOM 更新
  const cardToUpdate = taskCardRefs.value[index];

  if (!cardToUpdate) {
    console.error(`未找到匹配的任务卡片，index: ${index}`);
    return;
  }
  cardToUpdate.updateCardContent(updatedTask);
};


// 导出 handleUpdateTask 方法
defineExpose({
  handleUpdateTask,
  handleTabChange
});
</script>

<style lang="less" scoped>
.task-schedule-container {
  .segmented-container {
    position: relative;
    display: flex;
    align-items: center;
    margin: 0px 0px 3px 0px;
    padding: 0 35px;

    .scroll-button {
      position: absolute;
      z-index: 1;
      background-color: #fff;
      border: 1px solid #e6e1dc;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      
      &:hover {
        background-color: #faf9f5;
      }

      &.left {
        left: 0;
      }

      &.right {
        right: 0;
      }
    }

    .segmented-scrollbar {
      width: 100%;
      overflow: hidden;

      :deep(.el-scrollbar__bar) {
        display: none;
      }

      :deep(.el-scrollbar__wrap) {
        overflow-x: auto;
        overflow-y: hidden;
      }
      .el-segmented {
        --el-border-radius-base: 16px;
      }
    }
  }

  .search-bar {
    padding: 5px;
    padding-bottom: 0px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    
    .el-button {
      position: relative;
      
      &.sort-active {
        background-color: var(--el-color-primary);
        color: white;
        border-color: var(--el-color-primary);
        
        &:hover {
          background-color: var(--el-color-primary-light-3);
          border-color: var(--el-color-primary-light-3);
        }
      }
    }
  }

  .schedule-segmented {
    width: 100%;
    background-color: #faf9f5;
    display: flex; // 确保子元素水平排列
  }

  .schedule-segmented .el-segmented-button {
    position: relative;
  }

  .schedule-segmented .el-segmented-button::after {
    content: attr(data-task-count);
    position: absolute;
    top: -8px;
    right: -8px;
    width: 16px;
    height: 16px;
    line-height: 16px;
    text-align: center;
    background: #ff4d4f;
    color: #fff;
    border-radius: 50%;
    font-size: 12px;
  }

  .scrollable-content {
    height: calc(100vh - 237px);
    overflow-y: auto;
    .task_card_list {
      margin: 10px 8px 15px 8px;

      :deep(.card-image, .card-next-but) {
        opacity: 1 !important; // 始终显示
        pointer-events: auto; // 确保可交互
      }
    }

    .scrollable-task-list {
      display: flex;
      flex-direction: column;
    }
  }

  .loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 10px;
    color: #909399;
    
    .el-icon {
      margin-right: 5px;
    }
  }

  .no-more {
    text-align: center;
    padding-bottom: 10px;
    color: #909399;
    font-size: 14px;
  }
}
</style>