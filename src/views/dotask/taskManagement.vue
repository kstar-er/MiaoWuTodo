<!-- 任务列表页面 -->
<template>
  <main class="container" :class="['drawer-' + drawerDirection]">
    <!-- 加载动画 -->
    <loadingAnimation :loading="loading" loadingText="加载任务中..." />

    <!-- 数据 -->
    <div class="tabs-container" v-if="!loading">
      <!-- 数据为空 显示空状态 -->
      <div v-if="projectList.length === 0">
        <EmptyState text="暂无项目，无法新增任务，请先新增项目">
          <template #append>
            <div class="empty-btn">
              <el-tooltip content="点击按钮，进入项目管理页面，新增项目">
                <el-button
                  class="btn-base btn-default"
                  @click="handleChangeMenu"
                >
                  进入项目管理
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </EmptyState>
      </div>

      <!-- 点击全部 将 所有任务分类 展示 -->
      <el-tabs
        v-else
        v-model="active_process"
        type="card"
        class="sticky-tabs"
        style="margin: 0 5px"
        @tab-click="handleProject"
      >
        <!-- 项目 下拉菜单 -->
        <el-dropdown class="dropdown-menu" @command="handleDropdownProject">
          <el-icon class="dropdown-icon" size="19"><ArrowDown /></el-icon>
          <template #dropdown>
            <el-dropdown-menu class="dropdown-menu-box">
              <div class="dropdown-menu-item">
                <!--可对项目进行搜索-->
                <el-input
                  v-model="searchDropdownProject"
                  placeholder="搜索项目"
                  size="small"
                  style="margin: 5px"
                  clearable
                ></el-input>
                <!--全部 选项-->
                <el-dropdown-item command="all"
                  >全部{{
                    "（" + filteredProjectList.length + "）"
                  }}</el-dropdown-item
                >
                <!-- 其他单个项目 -->
                <el-dropdown-item
                  v-for="project in filteredProjectList"
                  :key="project.projectName"
                  :command="project.projectName"
                >
                  {{ project.projectName }}
                </el-dropdown-item>
              </div>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 全部任务: 流程tab + 卡片列表 -->
        <el-tab-pane name="all">
          <template #label>
            <div class="custom-tabs-label">
              <div class="all-text">全部</div>
              <div class="all-number-box">
                <div class="all-number">
                  {{ filteredProjectList.length }}
                </div>
              </div>
            </div>
          </template>
          <taskScheduleList
            ref="taskCardListRef1"
            :tasks="filteredAllSchedules"
            :activeTabValue="active_alltask"
            :imageList="imageList"
            :searchQueryValue="searchQuery"
            :loadingMore="loadingMore"
            :noMore="noMore"
            :showProjectName="true"
            :filterLength="filterLength"
            :currentTime="progressNow"
            @update:activeTab="active_alltask = $event"
            @update:searchQueryValue="(val) => (searchQuery = val)"
            @doSearch="doSearch"
            @openFilter="openFilter"
            @delete="handleDeleteTask"
            @previewImage="handleImage"
            @nextStep="handleChangeSchedule"
            @addSubtask="handleAddOrUpdateSubTask"
            @subTaskFinished="handleAddOrUpdateSubTask"
            @taskDetail="openTaskDetail"
            @tab-change="handleAllTask"
          />
        </el-tab-pane>

        <!-- 单个项目任务: 流程tab + 卡片列表-->
        <el-tab-pane
          v-for="(project, index) in filteredProjectList"
          :label="project.projectName"
          :name="project.projectName"
        >
          <taskScheduleList
            ref="taskCardListRef2"
            :tasks="project.oneSchedulesList"
            :activeTabValue="active_onetask"
            :imageList="imageList"
            :searchQueryValue="searchQuery"
            :loadingMore="loadingMore"
            :noMore="noMore"
            :showProjectName="false"
            :filterLength="filterLength"
            :currentTime="progressNow"
            @update:activeTab="active_onetask = $event"
            @update:searchQueryValue="(val) => (searchQuery = val)"
            @doSearch="doSearch"
            @openFilter="openFilter"
            @delete="handleDeleteTask"
            @previewImage="handleImage"
            @nextStep="handleChangeSchedule"
            @addSubtask="handleAddOrUpdateSubTask"
            @subTaskFinished="handleAddOrUpdateSubTask"
            @taskDetail="openTaskDetail"
            @tab-change="handleOneTask"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!--筛选弹出层-->
    <el-popover
      :visible="filterVisible"
      :width="360"
      trigger="click"
      teleport="body"
      popper-style="box-shadow: rgb(14 18 22 / 35%) 0px 10px 38px -10px, rgb(14 18 22 / 20%) 0px 10px 20px -15px; padding: 10px 20px 20px 20px;"
    >
      <div>
        <taskFilter
          :leader-list="leaderList"
          @doFilter="doFilter"
          @cancel="clearFilter"
          @close="closeFilter"
        />
      </div>
    </el-popover>

    <!-- 新增按钮：新增该项目该流程下的任务进度内容 -->
    <div class="add_but" v-if="projectList.length !== 0">
      <FloatIcon @onClick="openTaskDetail('add', {}, '')"></FloatIcon>
    </div>

    <!-- 点击下一步：选择负责人员 -->
    <selectUserDialog
      v-model="showNextSchedule"
      :users="nextScheduleUser"
      :nextSchedule="nextSchedule"
      :selectedUsers="selectedScheduleUsers"
      @confirm="confirmSelection"
    />
    <!-- 新手指引组件 -->
    <GuidedTour ref="guidedTourRef" />
  </main>
  <div
    v-if="detailDrawerVisible"
    class="inline-detail-panel"
    :class="['side-' + drawerDirection, { show: detailDrawerVisible, 'no-anim': noAnim }]"
    :style="{ width: drawerSize, '--drawer-size': drawerSize }"
  >
    <TaskDetail
      :isInline="true"
      :inlineData="inlineDetailData"
      :drawerDirection="drawerDirection"
      @inlineClose="handleInlineClose"
      @inlineSaved="handleInlineSaved"
    />
  </div>
</template>

<script setup>
import {
  onMounted,
  reactive,
  ref,
  nextTick,
  onUnmounted,
  getCurrentInstance,
  watch,
  computed,
} from "vue";
import {
  getProject,
  getTreeTask,
  getAllTask,
  updateNextSchedule,
  getScheduleNumList,
  addOrUpdateTask
} from "../../utils/taskManagement/index";
import FloatIcon from "./components/dragFloatBtn.vue"; // 拖拽按钮
import taskFilter from "./components/taskFilter.vue"; // 筛选器
import taskScheduleList from "./components/taskScheduleList.vue"; // 封装好的项目任务列表
import loadingAnimation from "../components/public/loadingAnimation.vue"; // 加载动画
import selectUserDialog from "./components/selectUserDialog.vue";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import TaskDetail from "./components/taskDetail.vue";
import { LogicalSize, LogicalPosition } from "@tauri-apps/api/window";
import { handleDelete, handlePreviewImage } from "./utils/eventHandler";
import { ArrowDown } from "@element-plus/icons-vue";
import { getUserInfo } from "../../utils/login";
import GuidedTour from "../../components/GuidedTour.vue";
import EmptyState from "@/public/components/EmptyState.vue";

const { proxy } = getCurrentInstance();

const imageList = ref({
  user: "/user.svg",
  deleteRed: "/deleteRed.svg",
  projectLeader: "/projectLeader.svg",
});

const loading = ref(false);
const loadingMore = ref(false);
const noMore = ref(false);

// 进度条刷新定时器（每15分钟刷新一次）
const progressNow = ref(new Date());
let progressTimer = null;
const startProgressTimer = () => {
  stopProgressTimer();
  progressNow.value = new Date();
  progressTimer = setInterval(() => {
    progressNow.value = new Date();
  }, 15 * 60 * 1000);
};
const stopProgressTimer = () => {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
};

// 分页参数 - 仅用于具体项目的任务加载
const projectTaskParams = reactive({
  pageSize: 20,
  pageNum: 1,
  total: 0,
});

// 分页参数 - 用于全部任务的加载
const allTaskParams = reactive({
  pageSize: 20,
  pageNum: 1,
  total: 0,
});

// 重置分页参数
const resetProjectTaskParams = () => {
  projectTaskParams.pageNum = 1;
  projectTaskParams.total = 0;
  noMore.value = false;
};

// 重置分页参数
const resetAllTaskParams = () => {
  allTaskParams.pageNum = 1;
  allTaskParams.total = 0;
  noMore.value = false;
};

// 初始时加载
const localSchedule = ref(""); // 缓存中的数据
const initData = async () => {
  loading.value = true;
  try {
    localSchedule.value = localStorage.getItem("schedule") || "";

    await getProcessList();
    if (projectList.value.length === 0 ) {
      return;
    }

    // 重置全部任务的分页参数
    if (active_process.value === "all") {// 加载全部任务
      resetAllTaskParams();
      await getStorage();
      await loadAllTasks();
    } else {
      resetProjectTaskParams();
      await getStorage();
      await loadProjectTasks(projectList.value);
    }
  } catch (error) {
    console.error("加载数据失败:", error);
    proxy.$message.error("加载数据失败，请重试");
  } finally {
    loading.value = false;
  }
};

defineExpose({ initData }); // 将加载数据方法暴露给父组件

const projectList = ref([]); // // 每个项目的项目详情及任务列表
const allSchedules = ref([]); // 所有流程状态 --- 用于 全部时
const allLeaderList = ref([]); // 筛选器要用的leaderList
const userIdUsernameMap = ref({}); // id与username的映射
const searchQuery = ref(""); // 存储搜索关键词
const filteredAllSchedules = ref([]); // 存储过滤后的所有任务列表
const filteredProjectList = ref([]); // 存储过滤后的项目任务列表
const getProcessList = async () => {
  // 调接口获取到项目列表
  const { rows } = await getProject({ pageSize: 999, pageNum: 1 });

  // 项目为空，无需处理
  if (rows.length === 0) {
    projectList.value = [];
    return;
  }

  // 获取到所有流程状态并定位到第一个流程
  const allSchedulesList = rows
    .map((item) => item.scheduleList.split(","))
    .flat();
  const newAllSchedules = [...new Set(allSchedulesList)];
  allSchedules.value = newAllSchedules.map((item) => ({
    schedule: item,
    taskList: [],
    taskCount: 0,
  }));

  // 提取并处理 用户负责人、用户头像 字段
  const allLeadersMap = new Map();
  const avatarMap = {};
  rows.forEach(item => {

    // 对用户负责人的处理
    const userIdList = item.userIdList || [];
    const userNameList = item.userNameList || [];
    userIdList.forEach((id, index) => {
      const value = id;
      const label = userNameList[index] || id;
      if (!allLeadersMap.has(value)) {
        allLeadersMap.set(value, { value, label});
      }
    });

    // 对头像的处理
    const userAvatarMap = item.userAvatarMap || {};
    Object.entries(userAvatarMap).forEach(([id, url])=> {
      if (url && !avatarMap[id]) {
        avatarMap[id] = url;
      }
    })
  })

  console.log("allLeaderMap", allLeadersMap)

  // 将id和username映射保存起来
  allLeadersMap.forEach((value, key) => { userIdUsernameMap.value[key] = value.label;});
  localStorage.setItem('userIdUsernameMap', JSON.stringify(userIdUsernameMap.value));

  // 将map值转为数组
  allLeaderList.value = Array.from(allLeadersMap.values());
  
  // 将头像缓存
  localStorage.setItem('userAvatars', JSON.stringify(avatarMap));

  // 初始化项目列表
  const updatedRows = rows.map((item) => {
    return {
      ...item,
      oneSchedulesList: item.scheduleList.split(",").map((schedule) => ({
        schedule,
        taskList: [],
        taskCount: 0,
      })),
    };
  });

  projectList.value = updatedRows;
  await nextTick();

  let schedule = localStorage.getItem("schedule");
  if (schedule) {
    active_alltask.value = schedule;
    active_onetask.value = schedule;
  } else {
    active_alltask.value = newAllSchedules[0];
    active_onetask.value = projectList.value[0].oneSchedulesList[0].schedule;
  }

  leaderList.value = allLeaderList.value;

  filteredAllSchedules.value = allSchedules.value;
  filteredProjectList.value = projectList.value;
  //console.log("111---leader1", updatedRows);
};


/**
 * 切换菜单页面
 */
const handleChangeMenu = () => {
  proxy.$emit('menuSelect', '1'); 
}

// 对过滤器参数进行整理
const getFilterParams = () => {
  let params = {};
  // 处理创建时间
  if (filterConditions.startTime && filterConditions.endTime) {
    params.datetimerange = `${filterConditions.startTime},${filterConditions.endTime}`;
  }
  // 处理其他筛选条件
  if (filterConditions.userIdList?.length > 0) {
    params.userIdList = filterConditions.userIdList;
  }
  if (filterConditions.priority?.length > 0) {
    params.priority = filterConditions.priority.join(",");
  }
  if (filterConditions.deadline) {
    params.deadline = filterConditions.deadline;
  }
  if (searchQuery.value) {
    params.taskDetail = searchQuery.value;
  }
  return params;
};

/**
 * 获取任务流程下的任务数量
 */
// 对任务数量进行整理
const loadProjectTaskCounts = async () => {
  if (active_process.value === "all") {
    // 点击全部
    const counts = await getScheduleTaskCount();

    filteredAllSchedules.value.forEach(async (schedule) => {
      schedule.taskCount = counts[schedule.schedule] || 0;
    });
  } else {
    // 点击其他项目
    const currentProject = filteredProjectList.value.find(
      (project) => project.projectName === active_process.value
    );
    if (currentProject) {
      const counts = await getScheduleTaskCount({
        projectId: currentProject.id,
      });
      currentProject.oneSchedulesList.forEach(async (schedule) => {
        schedule.taskCount = counts[schedule.schedule] || 0;
      });
    }
  }
};

// 调接口获取任务数量
const getScheduleTaskCount = async (projectId) => {
  try {
    const filterParams = getFilterParams();
    const params = projectId
      ? { ...projectId, ...filterParams }
      : { ...filterParams }; // 请求参数
    const result = await getScheduleNumList(params);
    if (result.code === 200) {
      return result.data;
    }
  } catch (error) {
    console.error("获取任务数量异常", error);
    return [];
  }
};

// 加载所有任务（优化后的逻辑）
const loadAllTasks = async () => {
  try {
    if (noMore.value) return;
    loadingMore.value = true;

    // 构建请求参数
    const filterParams = getFilterParams(); // 过滤器参数
    const params = {
      queryScheduleList: [ active_alltask.value ],
      ...allTaskParams,
      ...filterParams
    };

    const { rows: taskRows, total } = await getAllTask(params);

    allTaskParams.total = total;

    // 处理任务数据
    taskRows.forEach((task) => {
      const allMatchingSchedule = allSchedules.value.find(
        (schedule) => schedule.schedule === task.schedule
      );

      // 判断是否为最后一个任务流程
      if (task?.scheduleList) {
        const scheduleArray = task?.scheduleList?.split(',') || [];
        if (scheduleArray && scheduleArray.length === 1) {
          task.isFinalSchedule = true;
        } else {
          task.isFinalSchedule = (task.schedule === scheduleArray[scheduleArray?.length - 1]);
        }
      }
      

      // 主任务的子任务--是否为最后一个任务流程 跟随主任务
      if (task.parentId && task.parentId === 0) {
        if (task.children.length > 0) {
          task.children.map((item) => {
            item.isFinalSchedule = task.isFinalSchedule;
          })
        }
      }

      if (allMatchingSchedule) {
        task.taskExecutorList = task.userIdList && task.userIdList.length > 0 
          ? task.userIdList.map(id => userIdUsernameMap.value[id] || id) 
          : [];

        // 检查任务是否已存在
        const taskExists = allMatchingSchedule.taskList.some(
          (existingTask) => existingTask.id === task.id
        );
        if (!taskExists) {
          allMatchingSchedule.taskList.push(task);
        }
      }
    });

    // 更新状态
    filteredAllSchedules.value = allSchedules.value;

    console.log("fillterAllTask", filteredAllSchedules.value)
    await nextTick(() => {
      loadProjectTaskCounts();
    });

    // 统计并缓存超时任务
    try {
      const isTaskOverdue = (deadline) => {
        if (!deadline) return false;
        const now = new Date();
        const deadlineDate = new Date(String(deadline).replace(/-/g, '/'));
        if (isNaN(deadlineDate.getTime())) return false;
        return deadlineDate.getTime() - now.getTime() < 0;
      };
      const allLoadedTasks = filteredAllSchedules.value.flatMap(s => s.taskList || []);
      const overdueTasks = allLoadedTasks.filter(t => isTaskOverdue(t.deadline));
      localStorage.setItem('overdue_tasks', JSON.stringify(overdueTasks.map(t => t.id)));
      localStorage.setItem('overdue_count', String(overdueTasks.length));
    } catch (e) {
      console.error('统计超时任务失败:', e);
    }

    // 如有只显示超时任务的标记，则应用过滤
    try {
      const overdueOnly = localStorage.getItem('overdue_only') === 'true';
      if (overdueOnly) {
        filteredAllSchedules.value = filteredAllSchedules.value.map(s => ({
          ...s,
          taskList: (s.taskList || []).filter(t => {
            if (!t) return false;
            const dl = t.deadline;
            if (!dl) return false;
            const d = new Date(String(dl).replace(/-/g, '/'));
            return !isNaN(d.getTime()) && d.getTime() - Date.now() < 0;
          })
        }));
        // 使用后清除标记
        localStorage.removeItem('overdue_only');
      }
    } catch (e) {
      console.error('应用超时筛选失败:', e);
    }

    // console.log("数据", filteredAllSchedules.value);
    noMore.value = allTaskParams.pageNum * allTaskParams.pageSize >= total;
  } catch (error) {
    console.error("加载所有任务失败:", error);
    throw error;
  } finally {
    loadingMore.value = false;
  }
};

// 加载项目任务（新的分页加载逻辑）
const loadProjectTasks = async (projects) => {
  try {
    if (noMore.value) return;
    loadingMore.value = true;

    const currentProject = projects.find(
      (project) => project.projectName === active_process.value
    );

    if (!currentProject) return;

    // 构建请求参数
    const filterParams = getFilterParams(); // 过滤器参数
    const params = {
      projectId: currentProject.id,
      queryScheduleList: [ active_onetask.value ],
      ...projectTaskParams,
      ...filterParams,
    };

    const { rows: taskRows, total } = await getTreeTask(params);

    projectTaskParams.total = total;

    // 处理任务数据
    taskRows.forEach((task) => {
      const matchingSchedule = currentProject.oneSchedulesList.find(
        (scheduleItem) => scheduleItem.schedule === task.schedule
      );

      // 判断是否为最后一个任务流程
      if (task?.scheduleList) {
        const scheduleArray = task?.scheduleList?.split(',') || [];
        console.log("scheduleA", scheduleArray.length)
        if (scheduleArray && scheduleArray.length === 1) {
          task.isFinalSchedule = true;
        } else {
          task.isFinalSchedule = (task.schedule === scheduleArray[scheduleArray?.length - 1]);
        }
      }

      // 主任务的子任务--是否为最后一个任务流程 跟随主任务
      if (task.parentId && task.parentId === 0) {
        if (task.children.length > 0) {
          task.children.map((item) => {
            item.isFinalSchedule = task.isFinalSchedule;
          })
        }
      }

      if (matchingSchedule) {
        // 将负责人的名字映射出来
        task.taskExecutorList = 
          task.userIdList && task.userIdList.length > 0 ? 
          task.userIdList.map(id => userIdUsernameMap.value[id] || id) : [];

        // 检查任务是否已存在
        const taskExists = matchingSchedule.taskList.some(
          (existingTask) => existingTask.id === task.id
        );
        if (!taskExists) {
          matchingSchedule.taskList.push(task);
        }
      }
    });

    // 更新状态
    // filteredProjectList.value = projects;
    filteredProjectList.value = projectList.value.filter(
      (project) =>
        !searchDropdownProject.value ||
        project.projectName.includes(searchDropdownProject.value)
    );
    await nextTick(() => {
      loadProjectTaskCounts();
    });
    noMore.value =
      projectTaskParams.pageNum * projectTaskParams.pageSize >= total;
  } catch (error) {
    console.error("加载项目任务失败:", error);
    throw error;
  } finally {
    loadingMore.value = false;
  }
};


/**
 * 任务搜索 前端模糊过滤
 */
const doSearch = () => {
  if (active_process.value === "all") {
    filteredAllSchedules.value = allSchedules.value.map((schedule) => ({
      ...schedule,
      taskList: schedule.taskList.filter((task) =>
        task.taskDetail.includes(searchQuery.value)
      ),
    }));
  } else {
    filteredProjectList.value = projectList.value.map((project) => ({
      ...project,
      oneSchedulesList: project.oneSchedulesList.map((schedule) => ({
        ...schedule,
        taskList: schedule.taskList.filter((task) =>
          task.taskDetail.includes(searchQuery.value)
        ),
      })),
    }));
  }
};

/**
 * 筛选器
 */
const filterVisible = ref(false); // 筛选器
const leaderList = ref([]); // 筛选器要用的leaderList
const filterConditions = reactive({
  // 过滤条件
  userIdList: [],
  priority: [],
  startTime: "",
  endTime: "",
  deadline: "",
});

const filterLength = ref(0);
const doFilter = async (val, type) => {
  // 更新过滤条件的值
  Object.assign(filterConditions, val);

  // 计算过滤条件的个数，用于存储缓存
  filterLength.value = Object.entries(filterConditions).reduce(
    (count, [key, value]) => {
      if (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        value.length > 0
      ) {
        return count + 1;
      }
      return count;
    },
    0
  );

  // 存储缓存
  localStorage.setItem("filter", JSON.stringify(filterConditions));
  localStorage.setItem("filterLength", filterLength.value);

  if (type !== "getStorage") {
    if (active_process.value === "all") {
      await handleAllTask();
    } else {
      await handleOneTask();
    }
  }

  closeFilter();
};

// 是否清空筛选器
const isClear = ref(false);
const clearFilter = () => {
  isClear.value = true;
};

const closeFilter = () => {
  // 关闭筛选器
  filterVisible.value = false;
};

const openFilter = () => {
  filterVisible.value = true;
};

const getStorage = async () => {
  if (isClear.value) {
    let params = {
      userIdList: [],
      priority: [],
      startTime: "",
      endTime: "",
      deadline: "",
    };
    await doFilter(params, "getStorage");
    isClear.value = false;
  } else {
    let filter = JSON.parse(localStorage.getItem("filter")) ?? {}; // 获取本地缓存
    await doFilter(filter, "getStorage");
  }
};

/**
 * 点击顶部项目标签的处理
 */
// 各个标签 点击标志
const active_process = ref("all"); // 点击全部的 active
const active_alltask = ref(""); // 点击 全部-任务 的 active
const active_onetask = ref(""); // 点击 项目-任务 的 active
const handleProject = async (tab, event) => {
  leaderList.value = [];
  if (tab.index === "0") {
    // 点击全部 - 重置分页并加载所有任务
    resetAllTaskParams();

    if (localSchedule.value !== "") {
      if (
        allSchedules.value.find(
          (item) => item.schedule === localSchedule.schedule
        )
      ) {
        active_alltask.value = localSchedule.value;
      } else {
        active_alltask.value = allSchedules.value[0].schedule;
      }
    } else {
      active_alltask.value = allSchedules.value[0].schedule;
    }

    leaderList.value = allLeaderList.value;

    console.log("leaderList--tab", allLeaderList.value)

    // 清空所有任务列表
    allSchedules.value = allSchedules.value.map((schedule) => ({
      ...schedule,
      taskList: [],
    }));

    await getStorage();
    await loadAllTasks();
  } else {
    // 点击具体项目 - 使用分页加载
    resetProjectTaskParams();
    let projectIndex = tab.index - 1;
    let project = projectList.value[projectIndex];

    // 清空当前项目的任务列表
    project.oneSchedulesList = project.oneSchedulesList.map((schedule) => ({
      ...schedule,
      taskList: [],
    }));

    await nextTick(() => {
      if (localSchedule.value !== "") {
        if (
          project.oneSchedulesList.find(
            (item) => item.schedule === localSchedule.value
          )
        ) {
          active_onetask.value = localSchedule.value;
        } else {
          active_onetask.value = project.oneSchedulesList[0].schedule;
        }
      } else {
        active_onetask.value = project.oneSchedulesList[0].schedule;
      }
    });

    // 处理负责人列表
    if (project.userIdList && project.userIdList.length > 0) {
      project.userIdList.forEach((id, index) => {
        leaderList.value.push({ value: id, label: project.userNameList[index] })
      })
    }

    addTaskParams.value = {
      scheduleUserList: project.scheduleUserList,
      scheduleList: project.scheduleList,
      projectId: project.id,
      projectName: project.projectName
    };

    await getStorage();
    await loadProjectTasks(projectList.value);
  }
  // 重新绑定滚动事件
  bindScrollEvent();
};

/**
 * 下拉菜单的事件处理
 * @param project 选中的项目
 */
const searchDropdownProject = ref(""); // 下拉菜单的输入搜索框

watch(
  [projectList, searchDropdownProject],
  () => {
    filteredProjectList.value = projectList.value.filter(
      (project) =>
        !searchDropdownProject.value ||
        project.projectName.includes(searchDropdownProject.value)
    );
  },
  { immediate: true }
);

// 点击下拉菜单中的某个项目
const handleDropdownProject = async (project) => {
  active_process.value = project; // 更新当前选中的 项目tab
  
  // 调用handleProject方法定位刷新
  // 选中到全部，索引直接定位到0
  if (project === "all") {
   await handleProject({
      index: "0",
    });
    return;
  }

  await handleProject({
    index: projectList.value.findIndex((p) => p.projectName === project) + 1,
  });
};

/**
 *  点击 "全部" 下的流程
 */
const handleAllTask = async () => {
  if (active_process.value === "all") {
    resetAllTaskParams();
    // 清空当前schedule的任务列表
    allSchedules.value = allSchedules.value.map((schedule) => ({
      ...schedule,
      taskList:
        schedule.schedule === active_alltask.value ? [] : schedule.taskList,
    }));
    localStorage.setItem("schedule", active_alltask.value);
    localSchedule.value = active_alltask.value;
    await getStorage();
    await loadAllTasks();
    // 重新绑定滚动事件
    bindScrollEvent();
  }
};

/**
 *  点击 其他项目 下的流程
 */
const handleOneTask = async () => {
  if (active_process.value !== "all") {
    // 只有在具体项目中才重新加载
    const currentProject = filteredProjectList.value.find(
      (project) => project.projectName === active_process.value
    );
    if (currentProject) {
      resetProjectTaskParams();
      // 清空当前schedule的任务列表
      currentProject.oneSchedulesList = currentProject.oneSchedulesList.map(
        (schedule) => ({
          ...schedule,
          taskList:
            schedule.schedule === active_onetask.value ? [] : schedule.taskList,
        })
      );
      localStorage.setItem("schedule", active_onetask.value);
      localSchedule.value = active_onetask.value;
      await getStorage();
      await loadProjectTasks(filteredProjectList.value);
      // 重新绑定滚动事件
      bindScrollEvent();
    }
  }
};

/**
 * 任务新增、编辑操作
 * @param isCanSelectProject 是否可以选择项目
 */
const formData = ref({});
const addTaskParams = ref({});
const detailDrawerVisible = ref(false);
const inlineDetailData = ref(null);
const drawerDirection = ref('rtl');
const drawerSize = ref('620px');
const drawerPixelWidth = ref(620);
const originalWindowPos = ref(null);
const originalWindowSize = ref(null);
const isWindowExpanded = ref(false);
const noAnim = ref(false);
const isClosing = ref(false);

// 打开 任务弹窗-进行编辑/新增
const computeDrawerSide = async () => {
  try {
    const win = getCurrentWindow();
    // 若已有原始位置，则基于原始位置判断，避免窗口移动后方向切换
    const pos = originalWindowPos.value || await win.innerPosition();
    const size = originalWindowSize.value || await win.innerSize();
    const screenWidth = window.screen?.width || 1920;
    const screenCenterX = (pos.x + size.width / 2);
    // 窗口中心在屏幕左侧 -> 从右侧打开；在右侧 -> 从左侧打开
    drawerDirection.value = screenCenterX < (screenWidth / 2) ? 'rtl' : 'ltr';
  } catch (e) {
    drawerDirection.value = 'rtl';
  }
};

const expandMainWindowForDrawer = async () => {
  try {
    const win = getCurrentWindow();
    const currentPos = await win.innerPosition();
    const currentSize = await win.innerSize();
    // 初始化原始尺寸与位置（仅第一次记录）
    if (!originalWindowPos.value || !originalWindowSize.value) {
      originalWindowPos.value = { x: currentPos.x, y: currentPos.y };
      originalWindowSize.value = { width: currentSize.width, height: currentSize.height };
    }
    // 使用固定抽屉宽度（外部已设置 drawerSize/drawerPixelWidth）
    const dw = drawerPixelWidth.value || parseInt(String(drawerSize.value)) || 620;
    const basePos = originalWindowPos.value;
    const baseSize = originalWindowSize.value;
    // 基于原始尺寸计算目标（幂等）
    const targetWidth = baseSize.width + dw;
    const targetX = drawerDirection.value === 'ltr' ? basePos.x - dw : basePos.x;
    if (currentSize.width !== targetWidth || currentPos.x !== targetX) {
      await win.setSize(new LogicalSize(targetWidth, baseSize.height));
      await win.setPosition(new LogicalPosition(targetX, basePos.y));
    }
    isWindowExpanded.value = true;
  } catch (e) {
    console.error('扩展主窗口失败:', e);
  }
};

const restoreMainWindow = async () => {
  try {
    if (!isWindowExpanded.value) return;
    const win = getCurrentWindow();
    // 使用当前展开状态下的位置与尺寸，按抽屉宽度收缩，避免跳回原位置
    const currentPos = await win.innerPosition();
    const currentSize = await win.innerSize();
    const dw = drawerPixelWidth.value || parseInt(String(drawerSize.value)) || 620;
    const targetWidth = Math.max(100, currentSize.width - dw);
    const targetX = drawerDirection.value === 'ltr' ? currentPos.x + dw : currentPos.x;
    await win.setSize(new LogicalSize(targetWidth, currentSize.height));
    await win.setPosition(new LogicalPosition(targetX, currentPos.y));
  } catch (e) {
    console.error('还原主窗口失败:', e);
  } finally {
    isWindowExpanded.value = false;
    // 清理原始记录，避免下次基于旧数据重复扩展
    originalWindowPos.value = null;
    originalWindowSize.value = null;
  }
};

const openTaskDetail = async (type, task, index) => {
  // 内联抽屉方式
  let data = {};
  if (active_process.value === "all" && type === "add") {
    data = { ...JSON.parse(localStorage.getItem("lastTaskAddData")) };
    data.isCanSelectProject = true;
  } else if (type === "add") {
    const project = addTaskParams.value;
    data = {
      ...project,
      leaderList: [],
      schedule: active_onetask.value,
      isCanSelectProject: true,
    };
    data.scheduleList = project.scheduleList.split(",");
  } else if (type === "edit") {
    data = {
      ...task,
      leaderList: [],
      // 兼容 taskExecutor 为空或已为数组的情况
      taskExecutorList:
          task.userIdList && task.userIdList.length > 0 ? 
          task.userIdList.map(id => userIdUsernameMap.value[id] || id) : [],
      isCanSelectProject: true,
      scheduleUserList: task.scheduleUserList || "",
    };
    data.scheduleList = Array.isArray(task.scheduleList)
      ? task.scheduleList
      : (task.scheduleList?.split(",") || []);
  }

  if (leaderList.value?.length > 0) {
    data.leaderList = leaderList.value;
  }
  try {
    data.nickName = JSON.parse(sessionStorage.getItem("userInfo")).user.nickname;
  } catch (_) {
    data.nickName = '';
  }
  if (type === "add") {
    localStorage.setItem("lastTaskAddData", JSON.stringify(data));
  }
  // 若抽屉已展开且窗口可能被用户拖动，仅更新内容，避免重算方向与重新定位导致跳动
  if (detailDrawerVisible.value) {
    inlineDetailData.value = data;
    return;
  }
  inlineDetailData.value = data;
  await computeDrawerSide();
  await expandMainWindowForDrawer();
  // await new Promise((resolve) => setTimeout(resolve, 300));
  detailDrawerVisible.value = true;
};

const handleInlineSaved = async (params) => {
  detailDrawerVisible.value = false;
  // 复用现有的刷新逻辑
  if (params?.id) {
    // 编辑
    if ( params.parentId === 0 && ((active_process.value === "all" && active_alltask.value !== params.schedule)
        || ( active_process.value !== "all" && params.schedule !== active_onetask.value))) {
      await updateScheduleTaskList(params)
    } else {
      await updateTaskList(params, params.schedule);
    }
  } else {
    // 新增--刷新卡片
    await initTaskList(params, params.schedule);
  }
};

const handleInlineClose = async (id) => {
  // 关闭时禁用过渡动画，立即隐藏
  isClosing.value = true;
  noAnim.value = true;
  detailDrawerVisible.value = false;
  if (id) {
    await updateScheduleTaskList(id);
  }

  // 立即收回展开的窗口（无等待）
  try {
    await restoreMainWindow();
  } finally {
    // 下一帧恢复动画，以便下次打开仍有动画
    nextTick(() => {
      requestAnimationFrame(() => {
        noAnim.value = false;
        isClosing.value = false;
      });
    });
  }
};

watch(detailDrawerVisible, async (visible) => {
  if (!visible) {
    if (isClosing.value) return; // 已在 handleInlineClose 中处理
    await restoreMainWindow();
  }
});

/*
  删除操作
*/
const handleDeleteTask = async (id) => {
  try {
    let activeTask = active_onetask.value;
    const result = await handleDelete(id);
    if (result.canceled) {
      console.log("用户取消了删除操作");
    } else if (result.success) {
      proxy.$message.success(result.message); // 提示删除成功
      await updateScheduleTaskList({ id });
      active_onetask.value = activeTask;
    }
  } catch (error) {
    proxy.$message.error(error.message || "删除任务时发生错误"); // 提示删除失败
  }
};

/**
 * 点击下一步：更新任务流程
 */
const nextScheduleUser = ref([]); // 下一流程已绑定的人员
const showNextSchedule = ref(false); // 选择人员弹窗
const selectedScheduleUsers = ref([]); // 用户选择的人员
const nextTask = ref({}); // 选择下一步的任务
const nextSchedule = ref(null); // 下一步流程

// 更新任务流程
const handleChangeSchedule = async (task) => {
  nextTask.value = { ...task };
  let nowSchedule = task.schedule;
  let scheduleList = task.scheduleList.split(",");

  scheduleList.forEach((item, index) => {
    // 匹配得到下一流程
    if (item === nowSchedule) {
      nextSchedule.value = scheduleList[index + 1];
    }
  });

  const data = await updateNextSchedule(task);
  if (data.code === 200) {
    nextScheduleUser.value = data.data;
    if (nextScheduleUser.value?.length > 1) {
      showNextSchedule.value = true;
      return;
    } else {
      await updateScheduleTaskList(nextTask.value);
      proxy.$message.success("更新成功！");
    }
  }
};

// 用户确认更新
const handleUpdateSchedule = async (params) => {
  let submitParams = {
    ...params,
    id: nextTask.value.id,
  };
  const res = await updateNextSchedule(submitParams);
  if (res.code === 200) {
    proxy.$message.success("更新成功！");
  }
};

// 提交保存
const confirmSelection = async () => {
  try {
    if (selectedScheduleUsers.value.length === 0) {
      proxy.$message.warning("请选择至少一个负责人员");
      return;
    }
    const selectedString = selectedScheduleUsers.value.join(" ");
    await handleUpdateSchedule({ name: selectedString }); // 调用接口更新
    await updateScheduleTaskList(nextTask.value); // 更新任务列表
    selectedScheduleUsers.value = [];
    nextScheduleUser.value = [];
  } catch (error) {
    console.error("更新任务失败:", error);
    proxy.$message.error("更新任务失败，请重试");
  }
};

/**
 * 不重新刷新当前列表，仅将更新了流程的任务卡片delete掉
 * @param task 删除的任务
 */

// 递归删除任务（主任务或子任务）
const removeTaskRecursively = (taskList, delTaskId) => {
  return taskList
    .map(task => {
      // 如果是当前主任务，直接移除
      if (task.id === delTaskId) {
        return null;
      }
      // 如果有子任务，递归处理子任务列表
      if (task.children && task.children.length > 0) {
        const filteredChildren = removeTaskRecursively(task.children, delTaskId);
        // 如果子任务被删空，也可以选择返回 null 或保留空数组
        return { ...task, children: filteredChildren };
      }
      return task;
    })
    .filter(task => task !== null); // 过滤掉被删除的任务
};

const updateScheduleTaskList = async (task) => {
  const delTaskId = task.id;
  if (active_process.value === "all") {
    filteredAllSchedules.value = filteredAllSchedules.value.map((schedule) => ({
      ...schedule,
      taskList: removeTaskRecursively(schedule.taskList, delTaskId),
    }));
  } else {
    const currentProject = filteredProjectList.value.find(
      (project) => project.projectName === active_process.value
    );
    if (currentProject) {
      currentProject.oneSchedulesList = currentProject.oneSchedulesList.map(
        (schedule) => ({
          ...schedule,
          taskList: removeTaskRecursively(schedule.taskList, delTaskId),
        })
      );
    }
  }
  await nextTick(() => {
    loadProjectTaskCounts();
  });
};


/**
 * 添加/更新 子任务
 */
const handleAddOrUpdateSubTask = async (subTaskData) => {
  const isFormattedDeadline = (subTaskData.deadline?.split(' ').length) > 1;
  let params = {
    ...subTaskData,
    deadline: isFormattedDeadline ? subTaskData.deadline : subTaskData.deadline?.substring(0, 19).replace("T", " ") || null
  }
  addOrUpdateTask({ list: [params] }).then( async (res) => {
    if (res && res.code){
      // 复用现有的刷新逻辑
      let schedule = localStorage.getItem('schedule');
      if (params?.id) {
        await updateTaskList(params, schedule);
      } else {
        await initTaskList(params, schedule);
      }
    }
  })
}


/**
 * 预览图片事件
 */
const handleImage = async (task) => {
  handlePreviewImage(task.caption, "main_task");
};

/**
 * 滚动慢加载事件
 */
// 处理滚动加载更多
const handleScroll = async (e) => {
  const scrollContainer = e.target;
  // 当距离底部小于50px时触发加载
  const isNearBottom =
    scrollContainer.scrollHeight -
      scrollContainer.scrollTop -
      scrollContainer.clientHeight <
    50;

  if (isNearBottom && !loadingMore.value && !noMore.value) {
    try {
      loadingMore.value = true;
      if (active_process.value === "all") {
        allTaskParams.pageNum++;
        await loadAllTasks();
      } else {
        projectTaskParams.pageNum++;
        await loadProjectTasks(projectList.value);
      }
    } catch (error) {
      console.error("加载更多数据失败:", error);
      if (active_process.value === "all") {
        allTaskParams.pageNum--; // 加载失败时恢复页码
      } else {
        projectTaskParams.pageNum--; // 加载失败时恢复页码
      }
      proxy.$message.error("加载更多数据失败，请重试");
    } finally {
      loadingMore.value = false;
    }
  }
};

// 添加绑定滚动事件的方法
const bindScrollEvent = () => {
  nextTick(() => {
    const scrollContainers = document.querySelectorAll(".scrollable-content");
    scrollContainers.forEach((container) => {
      if (container) {
        // 先移除之前的事件监听，避免重复绑定
        container.removeEventListener("scroll", handleScroll);
        container.addEventListener("scroll", handleScroll);
      }
    });
  });
};

/**
 * 在项目管理中，点击跳转过来时进行处理的事件
 */
// 定义props
const props = defineProps({
  selectedProject: {
    type: Object,
    default: null,
  },
});

defineEmits(['projectSelected', 'menuSelect']);

/**
 * 添加项目选择事件处理
 */
const handleProjectSelected = async (project) => {
  // 先获取项目列表数据
  await initData();

  active_process.value = project.projectName;

  // 调用handleProject方法定位刷新
  await handleProject({
    index:
      projectList.value.findIndex(
        (p) => p.projectName === project.projectName
      ) + 1,
  });
};

// 监听selectedProject的变化
watch(
  () => props.selectedProject,
  async (newProject) => {
    if (newProject) {
      await handleProjectSelected(newProject);
    }
  },
  { immediate: true }
);


/**
 * 新增时--刷新 当前任务卡片列表---initTaskList
 * 编辑时--仅替换 旧卡片---updateTaskList, 并通知子组件
 */
const taskCardListRef1 = ref(null);
const taskCardListRef2 = ref(null);
const initTaskList = async (data, schedule) => {
  if (active_process.value === "all") {
    // 点击全部
    active_alltask.value = schedule;
    taskCardListRef1.value.handleTabChange(active_alltask.value);
    resetAllTaskParams();
    await getStorage();
    await loadAllTasks();
  } else {
    active_onetask.value = schedule;
    let projectIndex = -1; // 更改信息卡片所属项目索引index
    filteredProjectList.value.forEach((project, index) => {
      if (project.id === data.projectId) {
        projectIndex = index;
      }
    });
    taskCardListRef2.value[projectIndex].handleTabChange(active_onetask.value);
    resetProjectTaskParams();
    await getStorage();
    await loadProjectTasks(projectList.value);
  }
  await loadProjectTaskCounts();
};

// 递归更新任务（主任务或子任务）
const updateTaskRecursively = (taskList, updatedTask, updateUserArray) => {
  return taskList.map(task => {
    // 如果是目标任务，替换并处理执行人
    if (task.id === updatedTask.id) {
      let usersArray = [];
      if (updateUserArray[0] !== "") {
        usersArray = updateUserArray[0].split("、");
      } else {
        usersArray = updatedTask.taskExecutorList;
      }
      return {
        ...updatedTask,
        taskExecutorList: usersArray
      };
    }

    // 如果有子任务，递归处理子任务
    if (task.children && task.children.length > 0) {
      return {
        ...task,
        children: updateTaskRecursively(task.children, updatedTask, updateUserArray)
      };
    }

    return task;
  });
};

// 仅修改更新的卡片
const updateTaskList = async (data, schedule) => {
  console.log("修改的卡片信息", data);
  let updatedTask = data;
  let updateUserArray = data.scheduleUserList.split(","); // 流程负责人

  // 更新主任务或子任务
  const updateTaskInSchedule = (taskList) => {
    return updateTaskRecursively(taskList, updatedTask, updateUserArray);
  };

  if (active_process.value === "all") {
    // active_alltask.value = schedule;
    filteredAllSchedules.value.forEach((item) => {
      if (item.schedule === data.schedule) {
        item.taskList = updateTaskInSchedule(item.taskList);
      }
    });
  } else {
    // active_onetask.value = schedule;
    filteredProjectList.value.forEach((project) => {
      if (project.id === data.projectId) {
        project.oneSchedulesList.forEach((schedule) => {
          schedule.taskList = updateTaskInSchedule(schedule.taskList);
        });
      }
    });
  }

  // 重新触发视图更新
  await nextTick();
};


/**
 * 监听父、子窗口发送的事件
 */
let unlistenFn, unlistenFn1, unlistenFn2;
let main_win = getCurrentWindow("main_task");

onMounted(async () => {
  console.log("任务管理组件已挂载完毕");
  await main_win.emit("window-ready");
  // 启动进度条刷新定时器
  startProgressTimer();
});

// 监听滚动事件
const guidedTourRef = ref(null); // 增加定义
onMounted(async () => {
  if (!sessionStorage.getItem("loginSuccessShown")) {
    // 监听来自登录窗口的登录信息
    try {
      unlistenFn = await listen("login-info", async (event) => {
        const { token } = event.payload;
        // 存储登录信息到本地
        sessionStorage.setItem("token", token);

        let userInfo = await getUserInfo(); // 获取当前登录用户数据
        if (userInfo.code === 200) {
          sessionStorage.setItem("userInfo", JSON.stringify(userInfo.data));
        } else {
          proxy.$message.error("获取登录用户信息失败");
        }

        // 检查是否已经显示过登录成功的提示
        if (!sessionStorage.getItem("loginSuccessShown")) {
          proxy.$message.success("登录成功");
          sessionStorage.setItem("loginSuccessShown", "true");
        }
        await initData(); // 加载数据
        
        // 登录成功后触发新手指引
        setTimeout(() => {
          if (guidedTourRef.value) {
            guidedTourRef.value.checkFirstLogin();
          }
        }, 1000); // 延迟1秒确保页面完全加载
      });
    } catch (error) {
      console.error("事件监听设置失败:", error);
    }
  }
  
  try {
    unlistenFn1 = await listen("task-info-updated", async (event) => {
      const { action, schedule, data } = event.payload;
      proxy.$message.success(`${action === "add" ? "新增" : "更新"}任务成功`); // 发送提示信息

      if (action === "add" || active_onetask.value !== schedule) {
        // 新增任务或是更新任务时有更新到流程，需刷新获得新卡片
        await initTaskList(data, schedule);
      } else {
        // 更新任务时，找到对应的任务并替换，这样无需刷新
        await updateTaskList(data, schedule);
      }
      await resetLocalFormdata();
      return;
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }

  try {
    unlistenFn2 = await listen(
      "main_task-task-detail-info-close",
      async (event) => {
        const { action } = event.payload;
        if (action === "cancel") {
          await resetLocalFormdata();
          return;
        }
      }
    );
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }

  await initData();
  // 初始绑定滚动事件
  bindScrollEvent();
  // 页面显示/隐藏时管理定时器
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopProgressTimer();
    } else {
      startProgressTimer();
    }
  });
});

onUnmounted(() => {
  unlistenFn?.();
  unlistenFn1?.();
  unlistenFn2?.();
  // 组件卸载时停止定时器
  stopProgressTimer();
  const scrollContainers = document.querySelectorAll(".scrollable-content");
  scrollContainers.forEach((container) => {
    if (container) {
      container.removeEventListener("scroll", handleScroll);
    }
  });
  restoreMainWindow()
});

/**
 * 重置本地存储
 */
const resetLocalFormdata = async () => {
  if (sessionStorage.getItem("formdata")) {
    sessionStorage.removeItem("formdata");
  }
};
</script>

<style lang="less" scoped>
@import "../../assets/global.less"; // 复用按钮样式

.container {
  padding-top: 10px;
  font-size: 15px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start; /* 防止子元素在窗口变宽时被拉伸到全宽 */
  text-align: center;
}

/* 外层容器 */
.tabs-container {
  /* 固定主列表区域的宽度，窗口变宽时保持不变 */
  width: 360px;
  max-width: 360px;
  flex: 0 0 360px;
  .tab-slider-controls {
    z-index: 9;
    position: absolute;
    .tab-slider-left {
      display: flex;
      justify-content: flex-start;
      .left-btn {
        width: 10px;
        padding: 10px;
      }
    }
    .tab-slider-right {
      right: 0px;
      .right-btn {
        width: 10px;
        padding: 10px;
      }
    }
  }
}

/* 侧边内联详情面板：基于主表侧边弹出 */
.inline-detail-panel {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
  background: #fff;
  box-shadow: 0 0 12px rgba(0,0,0,0.15);
  transition: transform 0.25s ease, width 0.25s ease, opacity 0.2s ease;
  overflow: hidden;
  z-index: 10;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}
// .inline-detail-panel.side-rtl { right: 0; transform: translateX(100%); }
// .inline-detail-panel.side-ltr { left: 0; transform: translateX(-100%); }
.inline-detail-panel.side-rtl { left: 360px; transform: translateX(-100%); }
.inline-detail-panel.side-ltr { right: 360px; transform: translateX(100%); }

.container.drawer-ltr .tabs-container { margin-left: auto; }
.inline-detail-panel.show { width: var(--drawer-size, 620px); transform: translateX(0); opacity: 1; visibility: visible; pointer-events: auto; }

:root { --drawer-size: 620px; }

.custom-tabs-label {
  display: flex;
  align-items: center;
  flex-direction: row;
  .all-text {
    font-size: 14px;
    font-weight: 500;
  }
  .all-number-box {
    margin-left: 3px;
    height: 15px;
    width: 15px;
    background-color: #f5caa3;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    .all-number {
      font-size: 12px;
      text-align: center;
    }
  }
}

.dropdown-icon {
  border: none;
  cursor: pointer;
  transition: color 0.3s, transform 0.3s;
}

.dropdown-icon:hover {
  border: none;
  color: #bd4516;
  transform: scale(1.2);
}

.dropdown-menu-box {
  width: 160px;
  max-width: 200px;
  max-height: 350px;
  overflow-y: auto;
  .dropdown-menu-item {
    width: 100%;
    align-items: center;
    display: flex;
    flex-direction: column;
  }
}

.dropdown-menu-box .el-input {
  width: 90%;
  margin: 5px;
}

:deep(.el-tabs__content) {
  margin: 0px 3px !important;
}

:deep(.el-tabs__nav-scroll) {
  overflow-x: auto;
  white-space: nowrap;
}

:deep(.el-tabs__item) {
  text-align: center !important;
}

:deep(.el-tabs__active-bar) {
  background-color: #7c3c00 !important;
}

:deep(.el-tabs__header) {
  margin: 0 0 2px !important;
}
</style>
