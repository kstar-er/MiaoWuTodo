<!-- 项目列表页面 -->
<template>
  <main class="container">
    <!-- 加载动画 -->
    <loadingAnimation :loading="loading" loadingText="加载项目列表中..." />

    <!-- 数据 -->
    <div class="project-container" v-if="!loading">
      <div class="project-list-box">
        <div class="search-bar">
          <el-input
            class="search-input"
            v-model="searchData.searchProjectName"
            placeholder="请输入项目名称"
            clearable
            @clear="onClearSearch"
            @keyup.enter="doFilter"
          ></el-input>
          <el-button @click="doFilter"> 查询 </el-button>
        </div>
        <el-divider class="content-divider" />

        <!-- 空数据状态 -->
        <div v-if="projectList.length === 0">
          <EmptyState text="暂无项目数据，可点击按钮新增项目" />
        </div>

        <div class="scrollable-content" v-else>
          <div v-for="(project, index) in projectList" class="project-card-list scrollable-project-list">
            <el-card 
              class="project-card" 
              v-model="project.id"
            >
              <template #header>
                <div class="card-header">
                  <div class="card-header-left">
                    {{ "#" + project.id }}
                  </div>

                  <!-- 项目工期：开始时间 至 截止时间 -->
                  <div class="card-header-center"> 
                    {{ project.startTime ? project.startTime?.split(' ')[0] + ' 至 ' + project.endDate : '无项目工期' }}
                  </div>
                  
                  <div class="card-header-right">
                    <!-- 项目编辑 -->
                    <img 
                      :src="imageList.edit" 
                      alt="编辑项目" 
                      class="hover-animation" 
                      style="padding-right: 5px;"
                      @click="openProjectDetail('edit', project)"
                    >

                    <!-- 项目删除 -->
                    <img 
                      :src="imageList.deleteRed" 
                      alt="删除项目" 
                      class="hover-animation" 
                      @click="handleDeletePro(project.id)"
                    >
                  </div>
                </div>
              </template>

              <div class="card-body">
                <div class="card-body-header">
                  <!-- 项目进度，点击进度tag即可修改项目进度 -->
                  <el-tooltip content="点击即可更新项目进度">
                    <div class="card-body-header-left">
                      <el-popover
                        v-model:visible="project.showPopover"
                        placement="right"
                        trigger="click"
                      >
                        <template #reference>
                          <el-tag
                            :type="project.schedule==='待启动' ? 'info' : project.schedule === '正在进行中' ? 'primary' : 'success'"
                            style="cursor: pointer;"
                            @click.stop="changeShowPopover(project)"
                          >
                            <img 
                              :src="project.schedule==='待启动' ? imageList.toBeStarted : project.schedule === '正在进行中' ? imageList.doing : imageList.completed" 
                              alt="项目进度" 
                              style="width: 18px; height: 18px; margin-right: 2px;">
                            <span>{{ project.schedule }}</span>
                          </el-tag>
                        </template>
                        <el-radio-group v-model="project.newSchedule" @change="handleUpdateSchedule(project)">
                          <el-radio value="待启动">待启动</el-radio>
                          <el-radio value="正在进行中">正在进行中</el-radio>
                          <el-radio value="已完成">已完成</el-radio>
                        </el-radio-group>
                      </el-popover>
                    </div>
                  </el-tooltip>
                </div>

                <!-- 项目名 -->
                <div class="card-body-content" @click="handleProjectClick(project)">
                  {{ project.projectName }}
                </div>

                <!-- 项目备注 -->
                <div class="card-body-remark">
                  {{ project.remark }}
                </div>
              </div>

              <!-- 项目负责人：最多展示前5个，剩余的人员在el-tooltip中展示，即鼠标hover进行触发 -->
              <template #footer>
                <div class="card-footer">
                  <div class="card-footer-user-box" >
                    <img :src="imageList.projectLeader" alt="负责人" style="width: 18px;">
                    <!-- 显示前五个 -->
                    <el-tag
                      v-for="(user, userIndex) in project.userNameList.slice(0, 5)"
                      :key="user"
                        :type="getTagColorWrapper(userIndex)"
                        class="card-footer-user"
                        round
                      >
                      {{ user }}
                    </el-tag>

                    <!-- 显示剩余负责人 -->
                    <el-tooltip
                      v-if="project.userNameList.length > 5"
                      effect="light"
                    >
                      <template #content>
                        <div v-for="(user, userIndex) in project.userNameList.slice(5)">
                          <el-tag
                            :type="getTagColorWrapper(userIndex + 5)"
                            class="card-footer-user"
                            round>
                            {{ user }}
                          </el-tag>
                          </ br>
                        </div>
                      </template>
                      <el-tag type="warning" effect="plain" round>
                        {{ '+' }}
                        {{ project.userNameList.length - 5}}
                      </el-tag>
                    </el-tooltip>
                  </div>  
                </div>
              </template>
            </el-card>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增按钮：新增该项目该流程下的任务进度内容 -->
    <div class="add_but">
      <FloatIcon @onClick="openProjectDetail('add')"></FloatIcon>
    </div>
  </main>
</template>

<script setup>
import {
  onMounted,
  reactive,
  ref,
  onUnmounted,
  getCurrentInstance,
} from "vue";
import { getProject, deleteProject, addOrUpdateProject } from "../../utils/taskManagement/index";
import FloatIcon from "./components/dragFloatBtn.vue"; // 拖拽按钮
import loadingAnimation from "../components/public/loadingAnimation.vue"; // 加载动画
import { getTagColor } from "../../utils"; // 标签颜色
import { initProjectClass, prepareFormDataForNewProject } from "./utils/eventHandler";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createProjectWin } from "../../multiwins/action";
import EmptyState from "@/public/components/EmptyState.vue";

const { proxy } = getCurrentInstance();

const imageList = ref({
  deleteRed: '/deleteRed.svg',
  doing: '/scheduleProgressBlue.svg', // 进行中
  toBeStarted: '/scheduleProgressGray.svg', // 待启动
  completed: '/scheduleProgressGreen.svg', // 已完成
  projectLeader: '/projectLeader.svg',
  edit: '/edit.svg'
})

let main_win = getCurrentWindow("main_task");

onMounted(async ()=> {
  console.log("项目管理组件已挂载完毕");
  await main_win.emit("window-ready");
})

let unlistenFn2, unlistenFn3;
onMounted(async () => {
  // 监听来自子窗口的项目、任务更新信号
  try {
    unlistenFn2 = await listen("info-updated", async (event) => {
      const { action, data } = event.payload;
      // 提示用户操作结果
      proxy.$message.success(`${action === "add" ? "新增" : "更新"}项目成功`);

      // 刷新数据
      await initData();

      // 重置本地存储
      await resetLocalFormdata();
      return;
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }

  try {
    unlistenFn3 = await listen("main_task-info-close", async (event) => {
      const { action } = event.payload;
      if (action === "cancel") {
        await resetLocalFormdata();
      }
      return;
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }
  await initData();
});

// 在组件卸载时移除监听器
onUnmounted(() => {
  unlistenFn2?.();
  unlistenFn3?.();
});

/**
 * 设置不同部门的标签颜色
 */
const getTagColorWrapper = (index)=> {
  return getTagColor(index);
}

const params = reactive({
  pageSize: 999,
  pageNum: 1,
});

const loading = ref(false); // 数据加载动画
const initData = async () => {
  console.log("---加载数据---");
  loading.value = true;
  await getProcessList(); // 获取项目列表
  loading.value = false;
};


/**
 * 加载项目数据
 */
const projectList = ref([]); // // 每个项目的项目详情及任务列表
const getProcessList = async () => {
  // 调接口获取到项目列表
  const { rows } = await getProject(params);
  projectList.value = rows;
  projectList.value.forEach(item => {
    if (item.startTime && item.duration) { // 计算截止日期
      const startDate = new Date(item.startTime.split(' ')[0]);
      startDate.setDate(startDate.getDate() + item.duration); 
      const endDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      item.endDate = endDate;
    }
    item.showPopover = false;
    item.newSchedule = item.schedule;
  })
  console.log("1111---项目列表", rows)
};

defineExpose({ initData }); // 将加载数据方法暴露给父组件


/**
 * 不刷新列表，仅替换旧卡片/删除旧卡片
 */
const updateProjectList = async (data, action) => {
  if (action === "delete") {
    // 如果是删除操作，直接从项目列表中移除对应的项目
    projectList.value = projectList.value.filter(project => project.id !== data.id);
    return;
  }

  // if (action === "update") {
  //   // 如果是更新就替换
  //   console.log("111---更新", data)
  //   const updatedProject = data; // 更新后的项目对象
  //   const index = projectList.value.findIndex(project => project.id === updatedProject.id);
  //   if (index !== -1) {
  //     projectList.value[index] = { ...projectList.value[index], ...updatedProject };
  //   }
  // }
}


/**
 * 筛选搜索
 */
const searchData = ref({
  searchProjectName: ""
});

const doFilter = async () => {
  if (!searchData.value.searchProjectName) {
    await getProcessList(); // 重新加载完整数据
    return;
  }

  let filteredProjects = projectList.value;

  // 根据项目名称过滤
  if (searchData.value.searchProjectName) {
    filteredProjects = filteredProjects.filter(project => 
      project.projectName.includes(searchData.value.searchProjectName)
    );
  }

  // 更新项目列表显示
  projectList.value = filteredProjects;
}

const onClearSearch = async () => {
  if (!searchData.value.searchProjectName) {
    await getProcessList(); // 重新加载完整数据
  }
}


/*
  删除操作
*/
const handleDeletePro = ( id ) => {
  proxy.$alert('是否确认删除这个项目', '提示', {
    type: 'error',
    showCancelButton: true,
    cancelButtonText: '再想想',
    confirmButtonText: '确认删除',
    confirmButtonClass: 'delete-confirm-btn',
    callback: async (action) => {
      if (action === 'cancel') return
      else {
        await deleteProject([id]).then((res) => {
          if (res.code === 200){
            proxy.$message.success('成功删除1条项目数据');
            updateProjectList({ id }, "delete");
          }
        })
      }
    }
  })
}


/*
  新增编辑操作
*/
const projectClassList = ref([]) // 分组列表
const getProjectGroupData = async () => {
  projectClassList.value = await initProjectClass();
}

const formData = ref({})

// 打开 项目弹窗-进行编辑/新增
const openProjectDetail = async (params, data) => {
  await resetLocalFormdata();
  await getProjectGroupData(); // 获取项目分组列表

  if (params === 'add') {
    formData.value = {
      projectClassList: projectClassList.value
    }
    handleAddProject()
  }
  
  if(params === 'edit') {
    formData.value = {
      ...data,
      projectClassList: projectClassList.value
    }
    handleEditProject()
  }

  console.log("打开项目窗口")
  await createProjectWin('main_task')
}

// 新增
const handleAddProject = async () => {
  formData.value = await prepareFormDataForNewProject();
  console.log("新增", formData.value)
  if (formData.value) {
    sessionStorage.setItem("formdata", JSON.stringify(formData.value));
    console.log("新增传输的数据:", formData.value);
  }
}

// 编辑
const handleEditProject = async () => {
  console.log("1111---2", formData.value)

  formData.value.scheduleList = formData.value.scheduleList.split(',');

  // 初始化scheduleList，将其转换成编辑所需的数据结构
  formData.value.scheduleList = formData.value.scheduleList.map(item => {
    const itemName = item.endsWith('*') ? item.slice(0, -1) : item; // 去掉尾部
    return {
      name: itemName,
      isChecked: item.endsWith('*'), // 根据尾部是否有*，去设置isChecked的勾选
      isSelectVisible: false // 初始化为false
    }
  })

  // 初始化scheduleUserMap
  formData.value.scheduleUserMap = {};
  formData.value.scheduleList.forEach((task) => {
    formData.value.scheduleUserMap[task.name] = [];
  });

  // 将scheduleUserMap转换成编辑所需的数据结构
  if (formData.value.scheduleUserList) {
    generateEditScheduleUserList()
  }
  
  sessionStorage.setItem("formdata", JSON.stringify(formData.value));

  console.log("111----传输的数据", formData.value)
}

// 将scheduleUserMap转换成编辑所需的数据结构
const generateEditScheduleUserList = () => {
  const scheduleUserArray = formData.value.scheduleUserList.split(','); // 每个流程的负责人按逗号分隔
  formData.value.scheduleList.forEach((task, index) => {
    const users = scheduleUserArray[index];
    if (users) {
      formData.value.scheduleUserMap[task.name] = users.split('、');
    } else {
      formData.value.scheduleUserMap[task.name] = []
    }
  })
}


/**
 * 更新项目进度
 */
const changeShowPopover = (project) => {
  console.log("project-popover", project.showPopover)
  if (project.showPopover === false) {
    setTimeout(() => {
      project.showPopover = true;
    }, 300);
    setTimeout(() => { // 延迟关闭
      project.showPopover = false;
    }, 6000);
  } else {
    project.showPopover = false;
  }
  console.log("project-popover", project.showPopover)
}

const handleUpdateSchedule = async (project) => {
  console.log("1111---project.newSchedule", project.newSchedule)
  proxy.$alert('是否确认变更为：' + project.newSchedule, '提示', {
    type: 'warning',
    icon: 'InfoFilled',
    showCancelButton: true,
    cancelButtonText: '取消',
    confirmButtonText: '确认',
    callback: async (action) => {
      if (action === 'cancel') {
        project.newSchedule = project.schedule;
        return
      } else {
        project.showPopover = false; // 关闭popover
        project.schedule = project.newSchedule; // 更新项目进度
        await addOrUpdateProject({ list: [rowData] }).then((res) => {
          if (res && res.code){
            proxy.$message.success('更新成功');
            initData();
          }
        })
      }
    }
  })
}

// 添加项目点击处理函数
const handleProjectClick = (project) => {
  proxy.$emit("projectSelected", project); // 触发事件传递选中的项目
};

/**
 * 重置本地存储
 */
const resetLocalFormdata = async () => {
  if (sessionStorage.getItem("formdata")) {
    sessionStorage.removeItem("formdata");
  }
}

</script>

<style lang="less" scoped>
@keyframes hover-effect {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.function-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
  padding: 5px 10px;
  background-color: #d9c5b8;
  border-bottom: 1px solid #e6e0dc;
}

.container {
  font-size: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.project-container {
  .project-list-box {
    .search-bar {
      padding: 10px 10px 0px 10px;
      display: flex;
      justify-content: center;
      .search-input {
        margin-right: 10px;
      }

    }
  }
  .scrollable-content {
    height: calc(100vh - 130px);
    overflow-y: auto;
    .project-card-list {
      margin: 10px 18px 18px 18px;
    }
    .scrollable-project-list {
      display: flex;
      flex-direction: column;
    }
  }
}

.project-card {
  --el-card-padding: 5px;
  --el-card-border-color: #d9bfb8;
  border-radius: 10px;
  background-color: #fffcfa;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139, 69, 19, 0.1);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    padding: 3px 3px 0px 10px;
    font-size: 13px;
    color: #80695b;
    .card-header-center {
      color: #705143;
      font-weight: 500;
    }
    .card-header-right {
      z-index: 10;
      display: flex;
      .hover-animation:hover{
        animation: hover-effect 0.4s ease-in-out forwards;
      }
    }
  }
  .card-body {
    display: grid;
    padding: 0px 3px;
    .card-body-header {
      font-size: 14px;
      color: rgb(167, 106, 77);
      display: flex;
      justify-content: space-between;
      margin: 0 5px;
    }
    .card-body-content {
      color: rgb(85, 37, 5);
      font-size: 15px;
      font-weight: 540;
      padding-bottom: 5px;
      text-overflow: ellipsis;
      overflow: hidden;
      display: flex;
      justify-content: center;
      cursor: pointer;
    }
    .card-body-remark {
      display: flex;
      color: rgb(167, 113, 77);
      font-size: 13px;
      max-height: 20px;
      min-height: 10px;
      text-overflow: ellipsis;
      overflow: hidden;
      justify-content: center;
    }
    .card-body-footer {
      max-height: 29px;
      display: flex;
      justify-content: space-between;
      padding: 0px 2px;
    }
  }
}
.card-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0 8px 0 8px;
  font-size: 13px;
  color: #4d3a35;
  max-height: 25px;
  .card-footer-user-box {
    display: flex;
    .card-footer-user {
      margin: 0px 3px;
    }
  }
}

</style>
