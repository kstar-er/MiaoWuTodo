<template>
  <div class="mini-task-wrapper">
    <div class="mini-task-container" :class="{ 'collapsed': !isExpanded }">
      <customDragWindow>
        <template #header>
          <div class="task-header">
            <h3>最近任务</h3>
            <div class="header-buttons">
              <el-tooltip :content="`筛选(${filterLength})`">
                <el-icon class="filter-btn" @click="handleFilter"><Filter /></el-icon>
              </el-tooltip>
              <el-icon class="toggle-btn" @click="toggleContent">
                <ArrowUp v-if="!isExpanded" />
                <ArrowDown v-else />
              </el-icon>
              <el-tooltip content="刷新">
                <el-icon class="refresh-btn" @click="refreshPage">
                  <Refresh />
                </el-icon>
              </el-tooltip>
              <el-icon class="close-btn" @click="closeWindow">
                <Close />
              </el-icon>
            </div>
          </div>
        </template>
      </customDragWindow>
      <div class="task-list" :class="{ 'collapsed': !isExpanded }">
        <div v-for="(task, index) in recentTasks" :key="task.id" class="task-item">
          <miniTaskCard 
            :showDeleteButton="false" 
            :showExecutorTags="false" 
            :isHovered="false" 
            :task="task"
            :image-list="imageList" 
            :isHint="false" 
            :showRemark="false"
            @delete="handleDeleteTask" 
            @previewImage="handleImage"
            @nextStep="isChangeSchedule" 
            @click="openTaskDetail('edit', task, index)" 
            class="custom-task-card"
            @mouseenter="checkContentHeight(task, index)"
            @mouseleave="resetExpandState(task)"
          >
            <template #card-header-append1>
              <el-tag effect="plain" round :type="getScheduleTagColor(task.schedule)" class="card-tag">
                {{ task.schedule }}
              </el-tag>
            </template>
            <template #card-body-content>
              <div 
                class="card-body-content" 
                ref="contentRef"
                :style="{ maxHeight: task.isExpanded ? 'none' : task.showExpandText ? '48px' : '24px', overflow: task.isExpanded ? 'visible' : 'hidden' }"
              >
                <div :style="{maxHeight: task.isExpanded ? 'none' : '24px'}">
                  {{ task.taskDetail }}
                </div>
              </div>
              <span v-if="task.showExpandText" class="expand-text" @click.stop="toggleExpand(task)">
                {{ task.isExpanded ? '收起' : '展开全部' }}
              </span>
            </template>
            <template #card-footer-append>
              <div class="header-project-name">
                <el-tag type="warning" round class="card-tag">
                  {{ task.projectName }}
                </el-tag>
              </div>
            </template>
          </miniTaskCard>
        </div>
      </div>
    </div>
  </div>
  <!-- 点击下一步：选择负责人员 -->
  <selectUserDialog v-model="showNextSchedule" :users="nextScheduleUser" :nextSchedule="nextSchedule"
    :selectedUsers="selectedScheduleUsers" @confirm="confirmSelection" />
</template>

<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import { Close, ArrowUp, ArrowDown, Refresh, Filter } from '@element-plus/icons-vue';
import { getCurrentWindow } from '@tauri-apps/api/window';
import customDragWindow from "../components/public/customDragWindow.vue"; // 自定义拖拽
import { PhysicalSize } from '@tauri-apps/api/window';
import { listen } from "@tauri-apps/api/event";
import { getAllTask, getProject, updateNextSchedule } from '../../utils/taskManagement';
import miniTaskCard from './components/minitaskCard.vue';
import selectUserDialog from './components/selectUserDialog.vue';
import { handleDelete, handlePreviewImage } from "./utils/eventHandler";
import { createTaskWin, createFilterWin } from '../../multiwins/action';
import { getScheduleTagColor, formatToLocalTime } from '../../utils/index';

const { proxy } = getCurrentInstance();

let minitask_win = getCurrentWindow("mini_task");

onMounted(async () => {
  console.log("任务小窗口已挂载完毕");
  await minitask_win.emit("window-ready");

  if (sessionStorage.getItem('token')) {
    await initData();
  }
});

let unlistenFn, unlistenFn1, unlistenFn2, unlistenFn3;
onMounted(async () => {
  // 监听来自登录窗口的登录信息
  try {
    unlistenFn = await listen("login-info", async (event) => {
      const { token, userInfo } = event.payload;
      // 存储登录信息到本地
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("userInfo", JSON.stringify(userInfo));
      await initData(); // 加载数据
      return;
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }

  try {
    unlistenFn1 = await listen("task-info-updated", async (event) => {
      const { action, schedule, data } = event.payload;
      proxy.$message.success(`${action === "add" ? "新增" : "更新"}任务成功`); // 发送提示信息
      await resetLocalFormdata();

      await initData();
      return;
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }

  try {
    unlistenFn2 = await listen("mini_task-task-detail-info-close", async (event) => {
      const { action } = event.payload;
      if (action === "cancel") {
        await resetLocalFormdata();
      }
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }

  try {
    unlistenFn3 = await listen("miniFiter", async (event) => {
      const { action, filterdata } = event.payload;
      if (action === "doMiniFiter") {
        await initData();
        return;
      }
      if (action === "resetMiniFilter") {
        localStorage.removeItem("miniFilter");
        await initData();
        return;
      }
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }
});

// 在组件卸载时移除监听器
onUnmounted(() => {
  unlistenFn?.();
  unlistenFn1?.();
  unlistenFn2?.();
  unlistenFn3?.();
});

const imageList = ref({
  user: "/user.svg",
  projectLeader: '/projectLeader.svg'
});

const recentTasks = ref([]); // 最近任务列表
const initData = async () => {
  filterParams.value = getFilterParams();

  let params = {
    ...filterParams.value,
    pageNum: 1,
    pageSize: 3,
    onlyMyTask: true
  }
  const { rows: taskRows, total } = await getAllTask(params);
  recentTasks.value = taskRows;
  recentTasks.value.map(item => {
    item.isCanSelectProject = true;
    item.deadline = formatToLocalTime(item.deadline);

    if (item?.scheduleList) {
      const scheduleList = item.scheduleList;
      const scheduleArray = scheduleList?.split(',') || [];
      if (scheduleArray && scheduleArray.length === 1) {
        item.isFinalSchedule = true;
      } else {
        item.isFinalSchedule = (item.schedule === scheduleArray[scheduleArray?.length - 1]);
      }
    }
  })

  console.log("recent", recentTasks.value)
}

/**
 * 筛选功能
 * 
 */
const filterParams = ref({});
const filterLength = ref(0);
// 打开筛选窗口
const handleFilter = async () => {
  await createFilterWin();
}

// 获取筛选条件
const getFilterParams = () => {
  if (localStorage.getItem("miniFilter")) {
    const params = JSON.parse(localStorage.getItem("miniFilter"));
    let filter = {};
    let count = 0;
    if (params.priority && params.priority.length > 0) {
      filter.priority = params.priority.join(',');
      count++;
    }
    if (params.queryScheduleList && params.queryScheduleList.length > 0) {
      filter.queryScheduleList = params.queryScheduleList;
      count++;
    }
    if (params.datetimerange && params.datetimerange.length === 2) {
      filter.datetimerange = params.datetimerange[0] + ',' + params.datetimerange[1];
      count++;
    }
    if (params.deadline) {
      filter.deadline = params.deadline;
      count++;
    }
    filterLength.value = count;
    return {...filter}
  } else {
    filterLength.value = 0;
    return {}
  }
}

/*
  删除操作
*/
const handleDeleteTask = async (id) => {
  try {
    const result = await handleDelete(id);
    if (result.canceled) {
      console.log("用户取消了删除操作");
    } else if (result.success) {
      proxy.$message.success(result.message); // 提示删除成功
      await initData();
    }
  } catch (error) {
    proxy.$message.error(error.message || "删除任务时发生错误"); // 提示删除失败
  }
}

/**
 * 预览图片事件及有关参数
 */
const handleImage = async (task) => {
  console.log("image----task", task);
  handlePreviewImage(task.caption, 'mini_task');
};

/**
 * 任务新增、编辑操作
 */
const userIdUsernameMap = ref({});
const formData = ref({});
const addTaskParams = ref({});
const leaderList = ref([]);

const openTaskDetail = async (type, task, index) => {
  await resetLocalFormdata();
  await getProjectInfo(task.projectId);
  getLocalUsernameIdMap();

  let project = addTaskParams.value; // 任务流程所属的项目

  if (type === 'edit') {
    formData.value = {
      ...project,
      ...task,
    }
    formData.value.scheduleList = task.scheduleList?.split(",")
  }

  formData.value.taskExecutorList = task.userIdList && task.userIdList.length > 0 
    ? task.userIdList.map(id => userIdUsernameMap.value[id] || id) 
    : [];

  formData.value.nickName = JSON.parse(sessionStorage.getItem('userInfo')).nickname;
  sessionStorage.setItem("formdata", JSON.stringify(formData.value));

  console.log("数据转换后", formData.value);
  await createTaskWin('mini_task');
};

const getProjectInfo = async (id) => {
  const { rows } = await getProject({ pageSize: 999, pageNum: 1, id: id });
  addTaskParams.value = rows[0];

  // 对负责人的处理
  leaderList.value = [];
  if (rows[0].userIdList && rows[0].userIdList.length > 0) {
    rows[0].userIdList.forEach((id, index) => {
      leaderList.value.push({ value: id, label: rows[0].userNameList[index] })
    })
  }
  addTaskParams.value.leaderList = leaderList.value
  console.log("add", addTaskParams.value)
}

const getLocalUsernameIdMap = () => {
  if (localStorage.getItem('userIdUsernameMap')) {
    userIdUsernameMap.value = JSON.parse(localStorage.getItem('userIdUsernameMap'));
  }
}


/**
 * 点击下一步：更新任务流程
 */
const nextScheduleUser = ref([]); // 下一流程已绑定的人员
const showNextSchedule = ref(false); // 选择人员弹窗
const selectedScheduleUsers = ref([]); // 用户选择的人员
const nextTask = ref({}); // 选择下一步的任务
const nextSchedule = ref(null); // 下一步流程

// 更新任务流程
const isChangeSchedule = async (task) => {
  nextTask.value = { ...task };
  let nowSchedule = task.schedule;
  let scheduleList = task.scheduleList.split(',');

  scheduleList.forEach((item, index) => { // 匹配得到下一流程
    if (item === nowSchedule) {
      nextSchedule.value = scheduleList[index + 1];
    }
  })

  const data = await updateNextSchedule(task);
  if (data.code === 200) {
    nextScheduleUser.value = data.data;
    if (nextScheduleUser.value?.length > 1) {
      showNextSchedule.value = true;
      return;
    } else {
      await initData();
    }
  }
}

// 用户确认更新
const handleUpdateSchedule = async (params) => {
  let submitParams = {
    ...params,
    id: nextTask.value.id,
  }
  const res = await updateNextSchedule(submitParams);
  if (res.code === 200) {
    proxy.$message.success("更新成功！");
  }
}

// 提交保存
const confirmSelection = async () => {
  try {
    console.log("选中的人员:", selectedScheduleUsers.value);
    if (selectedScheduleUsers.value.length === 0) {
      proxy.$message.warning("请选择至少一个负责人员");
      return;
    }
    const selectedString = selectedScheduleUsers.value.join(' ');
    await handleUpdateSchedule({ name: selectedString }) // 调用接口更新
    await initData(); // 更新任务列表
    selectedScheduleUsers.value = [];
    nextScheduleUser.value = [];
  } catch (error) {
    console.error("更新任务失败:", error);
    proxy.$message.error("更新任务失败，请重试");
  }
};


/**
 * 窗口扩展
 */
const isExpanded = ref(true);

const toggleContent = async () => {
  const window = await getCurrentWindow();

  if (isExpanded.value) {
    // 收起动画：先改变状态，等待动画完成后调整窗口大小
    isExpanded.value = false;
    setTimeout(async () => {
      await window.setSize(new PhysicalSize(300, 80));
    }, 300);
  } else {
    // 展开动画：先调整窗口大小，等待调整完成后改变状态
    await window.setSize(new PhysicalSize(300, 280));
    setTimeout(() => {
      isExpanded.value = true;
    }, 50);
  }
};

const closeWindow = async () => {
  await getCurrentWindow().close();
};

onMounted(async () => {
  const window = await getCurrentWindow();
  await window.setSize(new PhysicalSize(300, 280));
});

/**
 * 重置本地存储
 */
const resetLocalFormdata = async () => {
  if (sessionStorage.getItem("formdata")) {
    sessionStorage.removeItem("formdata");
  }
}

/**
 * 页面刷新
 */
const refreshPage = async () => {
  await initData();
  proxy.$message.success('页面已刷新');
};


/**
 * 内容详情展开与收起
 */
const contentRef = ref([]);

// 获取到当前hover的卡片taskDetail高度
const checkContentHeight = (task, index) => {
  if (!contentRef.value[index]) return;
  const contentHeight = contentRef.value[index].scrollHeight;
  task.showExpandText = contentHeight > 24; // 一行的高度为24px
  task.isExpanded = false; // 初始状态为不展开
};

const resetExpandState = (task) => {
  task.showExpandText = false;
  task.isExpanded = false;
};

const toggleExpand = (task) => {
  task.isExpanded = !task.isExpanded;
};
</script>

<style lang="less">
.mini-task-wrapper {
  height: 100vh;
  padding: 15px;
  box-sizing: border-box;
}

.mini-task-container {
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
  position: relative;
  border: 1px solid rgba(139, 69, 19, 0.2);
  border-radius: 20px;
  box-shadow: 0 0 15px rgba(139, 69, 19, 0.1);
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  transform-origin: top;

  &.collapsed {
    height: 60px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    pointer-events: none;
    transition: all 0.3s ease;
  }
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 15px 10px;
  position: relative;
  z-index: 1;
  border-bottom: 1px solid rgba(139, 69, 19, 0.1);
  transition: all 0.3s ease;
  cursor: default;

  h3 {
    color: #8b4513;
    font-family: 'Ghibli', sans-serif;
    font-size: 18px;
    margin: 0;
    letter-spacing: 1px;
    text-shadow: 1px 1px 2px rgba(139, 69, 19, 0.2);
  }

  .header-buttons {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .filter-btn,
  .toggle-btn,
  .close-btn,
  .refresh-btn {
    color: #8b4513;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
    }
  }
}

.task-list {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  transition: all 0.3s ease;
  max-height: 200px;

  &.collapsed {
    max-height: 0;
    opacity: 0;
    padding: 0;
    margin: 0;
    overflow: hidden;
  }

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 69, 19, 0.2);
    border-radius: 2px;
  }
}

.custom-task-card {
  --card-background: rgba(255, 255, 255, 0.507);
  margin-bottom: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139, 69, 19, 0.15);
    background: rgba(255, 255, 255, 0.9);
    .card-tag {
      opacity: 1;
    }
  }

  .card-tag {
    opacity: 0.8;
    transition: opacity 0.3s ease;
  }

  .card-body-content {
    color: rgb(85, 37, 5);
    font-size: 14px;
    cursor: default;
    position: relative;
    display: flex;
    justify-content: center;
    text-align: center;
  }
  .expand-text {
    color: #8b4513;
    cursor: pointer;
    font-size: 12px;
    margin-right: 3px;
    text-decoration: underline;
    display: flex; 
    justify-content: flex-end;
  }

  .card-body-footer {
    .card-image,
    .card-next-but {
      opacity: 0;
      max-height: 0;
      margin: 0;
      padding: 0;
      overflow: hidden;
      transition: opacity 0.3s ease, max-height 0.3s ease, margin 0.3s ease, padding 0.3s ease;
    }
  }

  &:hover .card-body-footer {
    .card-image,
    .card-next-but {
      opacity: 1;
      max-height: 100px;
      margin: 3px 0;
      overflow: visible;
    }
  }

  .card-header {
    cursor: default;
    .card-header-left {
      font-size: 12px;
    }

    .card-header-right {
      font-size: 12px;
    }
  }

  .card-footer {
    .card-footer-right {
      opacity: 0.8;
    }
  }

  .header-project-name {
    color: #8b4513;
  }
}

:deep(body) {
  background-color: transparent;
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
  background-color: transparent !important;
  overflow: hidden;
  border-radius: 0;
}
</style>