<!-- 任务新增、编辑窗口 -->
<template>
  <main class="container" :class="{ inline: isInline }">
    <customDragWindow v-if="!isInline">
      <template #header>
        <div class="title-header">
          <div class="title-content">

            <!-- 所属项目选择 -->
            <div class="project-select-box">
              <el-dropdown @command="handleChangeSelectProject">
                <div class="project-label-box">
                  <div class="project-label"> {{ selectedProject ? formData.projectName : '选择项目' }} </div>
                  <el-icon class="project-icon-right">
                    <arrow-down />
                  </el-icon>
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item 
                      v-for="item in projectList"
                      :disabled="!formData.isCanSelectProject"
                      :key="item.value"
                      :command="item.value"
                    >
                      {{ item.label }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <!-- 任务名称 -->
            <div class="title-text">
              {{ formData?.id ? ((formData.taskName || formData.taskDetail || '').slice(0, 6)) :  "新增"+ formData.schedule + "任务"}}
            </div>

            <!-- 优先级选择器 -->
            <div class="priority-picker">
              <el-button class="arrow left" :icon="ArrowLeft" size="small" @click="prevPriority" circle text bg/>
              <div class="priority-tag" :data-priority="priority"> {{ priority }} </div>
              <el-button class="arrow right" :icon="ArrowRight" size="small" @click="nextPriority" circle text bg/>
            </div>
          </div>
        </div>
      </template>
    </customDragWindow>
    <div v-else class="title-header">
      <div class="title-content">

        <!-- 所属项目选择 -->
        <div class="project-select-box">
          <el-dropdown @command="handleChangeSelectProject">
            <div class="project-label-box">
              <div class="project-label"> {{ selectedProject ? formData.projectName : '选择项目' }} </div>
              <el-icon class="project-icon-right">
                <arrow-down />
              </el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item 
                  v-for="item in projectList"
                  :disabled="!formData.isCanSelectProject"
                  :key="item.value"
                  :command="item.value"
                >
                  {{ item.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- 任务名称 -->
        <div class="title-text">
          {{ formData?.id ? ((formData.taskName || formData.taskDetail || '').slice(0, 6)) :  "新增"+ formData.schedule + "任务"}}
        </div>

        <!-- 优先级选择器 -->
        <div class="priority-picker">
          <el-button class="arrow left" :icon="ArrowLeft" size="small" @click="prevPriority" circle text bg/>
          <div class="priority-tag" :data-priority="priority"> {{ priority }} </div>
          <el-button class="arrow right" :icon="ArrowRight" size="small" @click="nextPriority" circle text bg/>
        </div>
      </div>
    </div>
    
    <publicIconForm
      ref="ruleFormRef"
      :label-width="'90px'"
      :form-data="formData"
      :form-input-el="addOrEditTask.formInputEl"
      :form-select-el="addOrEditTask.formSelectEl"
      :form-text-area-el="addOrEditTask.formTextAreaEl"
      :form-upload-el="addOrEditTask.formUploadEl"
      :form-time-and-number="addOrEditTask.formTimeAndNumber"
      :form-paste-image-el="addOrEditTask.formPasteImageEl"
      :my-client="myClient"
      :drawer-direction="props.drawerDirection"
      @hide-win="hideWin"
      @input-done="addOrEditTask.inputDone"
      @delete-task="handleDeleteTask"
    >
      <template #append1>
        <el-form-item
          label="任务流程"
          prop="scheduleList"
          class="full-width"
        >
          <template #label>
            <el-popover
              placement="top"
              width="300"
              :hide-after="0"
            >
              <template #reference>
                <el-icon style="color: #d47549" size="18">
                  <SetUp />
                </el-icon>
              </template>
              <template #default>
                <div v-if="formData?.id">
                  <div>任务流程：<strong style="color: #f56c6c">{{ formData.schedule }}</strong></div>
                </div>
                <div v-else>
                  <div>请点击选择该任务所属的流程，若无合适流程，请联系项目负责人添加。</div>
                </div>
              </template>
            </el-popover>
          </template>

          <div v-for="(item, index) in formData.scheduleList" :key="item" class="schedule-list-box">
            <el-check-tag
              class="schedule-tag-box"
              type="danger"
              :checked="item.isChecked"
              @change="handleChangeSchedule(item, index)"
              closable
            >
              <div class="schedule-item" v-if="item.name.endsWith('*')">
                <div class="schedule-checkbox">
                  <el-checkbox :value="item" size="small" :checked="item.required"/>
                </div>
                <div class="schedule-name">
                  {{ item.name }}
                </div>
              </div>
              <div class="schedule-name" v-else>
                  {{ item.name }}
              </div>
            </el-check-tag>
          </div>
        </el-form-item>

        <el-form-item
          label="流程负责人"
          prop="leaderList"
          class="full-width"
          style="width:60%;"
        >
          <template #label>
            <el-popover
              placement="top"
              width="300"
              :hide-after="0"
            >
              <template #reference>
                <el-icon style="color: #d47549" size="18">
                  <User />
                </el-icon>
              </template>
              <template #default>
                <strong style="color: #f56c6c">{{ formData.schedule }}</strong>流程的负责人
              </template>
            </el-popover>
          </template>

          <el-select
            v-model="formData.taskExecutorList"
            multiple
            filterable
            reserve-keyword
            placeholder="请选择该任务流程的负责人"
            clearable
            collapse-tags
            collapse-tags-tooltip
            @change="handleChangeTaskExecutor"
          >
            <el-option
              v-for="item in formData.leaderList"
              :key="item.value"
              :label="item.label"
              :value="item.label"
            />
          </el-select>
        </el-form-item>
      </template>
    </publicIconForm>
  </main>
</template>

<script setup>
import {
  onMounted,
  reactive,
  ref,
  onUnmounted,
  getCurrentInstance,
  nextTick,
  watch
} from "vue";
import publicIconForm from "../../components/public/publicIconForm.vue"; // 封装表单
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { CloseBold, ArrowRight, ArrowLeft } from "@element-plus/icons-vue";
import { addOrUpdateTask, getProject, deleteTask } from "../../../utils/taskManagement";
import { getCurrentFormattedTime } from "../../../utils"; // 获取当前时间js
import customDragWindow from "../../components/public/customDragWindow.vue"; // 封装窗口拖拽

const myClient = ref( );
const props = defineProps({
  isInline: {
    type: Boolean,
    default: false
  },
  inlineData: {
    type: Object,
    default: null
  },
  drawerDirection: {
    type: String,
    default: 'rtl'
  }
});
const emitInline = defineEmits(["inlineClose", "inlineSaved"]);
const { proxy } = getCurrentInstance();

let emit_win = '';
let task_win = null;
if (!props.isInline) {
  task_win = getCurrentWindow("task_add_detail");
  onMounted(async () => {
    console.log("任务管理组件已挂载完毕");
    await task_win.emit("taskDetail-window-ready");
  });
}

let unlistenFn, unlistenFn1, unlistenFn2;
const formData = ref({}); //表单数据
const ruleFormRef = ref(null); // 子组件表单
const loading = ref(false); // 加载动画标志
onMounted(async () => {
  // 监听来自父窗口的信息（仅独立窗口模式）
  if (!props.isInline) {
    loading.value = true;
    try {
      unlistenFn = await listen("main-task-add-edit-info", async (event) => {
        await initDataSource(event);
        loading.value = false;
        return;
      });
      unlistenFn1 = await listen("mini-task-add-edit-info", async (event) => {
        await initDataSource(event);
        loading.value = false;
        return;
      });
      unlistenFn2 = await listen("pet-task-add-edit-info", async (event) => {
        await initDataSource(event);
        loading.value = false;
        return;
      });
    } catch (error) {
      console.error("事件监听设置失败:", error);
    }
  } else if (props.inlineData) {
    // 内联模式：直接初始化表单
    await initInlineData(props.inlineData);
  }
});

// 内联数据变化时也要刷新
watch(() => props.inlineData, async (val) => {
  if (props.isInline && val) {
    await initInlineData(val);
  }
}, { deep: true });


// 在组件卸载时移除监听器
onUnmounted(() => {
  unlistenFn?.(); 
  unlistenFn1?.();
  unlistenFn2?.();
});

const initDataSource = async (event) => {
  const { formdata, token, emitWin } = event.payload;

  emit_win = emitWin; // 给窗口发送了信息的父窗口：main_task、pet

  // 存储编辑或新增信息到本地
  sessionStorage.setItem("token", token)
  formData.value = formdata;
  console.log("--获取到的数据--", formdata, emit_win)

  // 放入负责人的选择器数据
  addOrEditTask.formSelectEl[0].options = formdata.leaderList; 

  // 备注模块
  formData.value.remark = formdata.remark || '';

  //上传图片模块
  formData.value.caption = formdata.caption ? formdata.caption.split(';').map(url => `https://miaowutodo.oss-cn-hangzhou.aliyuncs.com/images/task/${url}`) : []

  if (!formdata.id) { // 新增
    // 截止时间默认选择
    if (!formData.value.deadline) formData.value.deadline = getCurrentFormattedTime();

    // 优先级
    priority.value = 'P1';

    // 对流程、流程负责人信息整合成所需的各种数据结构
    if (formdata?.scheduleList) {
      generateInitScheduleList(formdata.scheduleUserList, formdata.scheduleList, formdata);
    }
    
    // 右键进入的新增 需设置切换项目的数据
    if (formdata.isCanSelectProject) {
      await initProjectData();
      // 有缓存，且匹配到项目, 则直接放入选中的项目
      if (formdata.projectId && projectList.value.find(item => item.value === formdata.projectId)) { 
        selectedProject.value = formdata.projectId;
        
      } else { // 没有缓存 或 缓存项目被删除，默认选择第一个
        await handleChangeSelectProject(projectList.value[0].value);
      }
    }
  } else {
    priority.value = formdata.priority; // 优先级
    let usersArray = formdata.scheduleUserList?.split(',') || [];
    formData.value.scheduleList = formdata.scheduleList?.map((item, index) => {
      let itemName = item;
      let users = usersArray[index] ? (usersArray[index]).split('、') : '';
      if (itemName === formdata.schedule) { // 初始化已绑定的默认负责人
        formData.value.taskExecutorList = users;
      }
      return {
        name: item,
        isChecked: itemName === formdata.schedule ? true : false,
        required: item.endsWith('*') ? true : false, // 只有可选流程才会修改这个字段，用于表明该可选流程是否设为必需流程。
        taskExecutor: usersArray[index]!=='' ? users : []
      }
    })
    await initProjectData();
    selectedProject.value = formdata.projectId;
  }
  nextTick(()=> { // 手动强制刷新表单数据
    ruleFormRef.value?.updateFormData(formData.value);
  })

  // console.log("--整合后的数据--", formData.value)
}

// 内联模式初始化
const initInlineData = async (data) => {
  loading.value = true;
  try {
    // console.log("--内联模式数据--", data)
    formData.value = { ...data };
    // 放入负责人选择器数据
    if (data.leaderList) addOrEditTask.formSelectEl[0].options = data.leaderList; 
    // 备注模块
    formData.value.remark = data.remark || '';
    // 上传图片模块
    formData.value.caption = data.caption ? data.caption.split(';').map(url => `https://miaowutodo.oss-cn-hangzhou.aliyuncs.com/images/task/${url}`) : []
    if (!data.id) {
      // 截止时间默认选择
      if (!data.deadline) formData.value.deadline = getCurrentFormattedTime();

      // 优先级
      priority.value = 'P1';

      formData.value.id = null;
      formData.value.taskDetail = "";
      formData.value.taskName = "";
      formData.value.userIdList = [];
      //formData.value.taskExecutor = [];

      if (data?.scheduleList) {
        generateInitScheduleList(data.scheduleUserList, data.scheduleList, data);
      }

      // 右键进入的新增 需设置切换项目的数据
      if (formData.value.isCanSelectProject) {
        await initProjectData();
        // 有缓存，且匹配到项目, 则直接放入选中的项目
        if (data.projectId && projectList.value.find(item => item.value === data.projectId)) { 
          selectedProject.value = data.projectId;
          
        } else { // 没有缓存 或 缓存项目被删除，默认选择第一个
          await handleChangeSelectProject(projectList.value[0].value);
        }
      }
    } else {
      priority.value = data.priority; // 优先级
      let usersArray = data.scheduleUserList?.split(',') || [];
      formData.value.deadline = data?.deadline?.substring(0, 19).replace("T", " ") || null; // 去掉多余的.0
      formData.value.scheduleList = data.scheduleList?.map((item, index) => {
        let itemName = item;
        let users = usersArray[index] ? (usersArray[index]).split('、') : '';
        if (itemName === data.schedule) {
          formData.value.taskExecutorList = users;
        }
        return {
          name: item,
          isChecked: itemName === data.schedule ? true : false,
          required: item.endsWith('*') ? true : false,
          taskExecutor: usersArray[index]!=='' ? users : []
        }
      })

      await initProjectData();
      selectedProject.value = data.projectId;
    }
    // console.log("--内联模式整合后的数据--", formData.value)
    nextTick(()=> {
      ruleFormRef.value?.updateFormData(formData.value);
    })
  } finally {
    loading.value = false;
  }
}

// 整合成所需数据
const generateInitScheduleList = (scheduleUserList, scheduleList, formdata) => {
  let usersArray = scheduleUserList?.split(',') || [];
  formData.value.scheduleList = scheduleList?.map((item, index) => {
    let itemName = item;
    let users = usersArray[index] ? (usersArray[index]).split('、') : '';
    if (itemName === formdata.schedule) { // 初始化已绑定的默认负责人
      formData.value.taskExecutorList = users;
    } else {
      formData.value.taskExecutorList = [];
    }
    return {
      name: item,
      isChecked: itemName === formdata.schedule ? true : false,
      required: false, // 只有可选流程才会修改这个字段，用于表明该可选流程是否设为必需流程。
      taskExecutor: usersArray[index]!=='' ? users : []
    }
  })
}

// 关闭窗口/内联面板
const hideWin = (type, params) => {
  if (props.isInline) {
    if (type === 'addOrEdit') {
      emitInline('inlineSaved', params);
    } else {
      emitInline('inlineClose');
    }
    return;
  }

  let main_win = getCurrentWindow(emit_win); // 主窗口
  if (type === 'addOrEdit') {
    main_win.emit("task-info-updated", {action: formData.value.id ? "updated" : "add", schedule: params.schedule, data: params})
  } else {
    main_win.emit(`${emit_win}-task-detail-info-close`, {action: "cancel"})
  }
  formData.value = {};
  unlistenFn?.();
  unlistenFn1?.();
  unlistenFn2?.();
  task_win.destroy();
}

/**
 * 优先级处理
 */
const priority = ref('P1'); // 默认为P1
const priorityList = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6']; // 优先级选择options

// 左滑动
const nextPriority = () => {
  const index = priorityList.indexOf(priority.value);
  if (index < priorityList.length - 1) {
    priority.value = priorityList[index + 1];
  }
};

// 右滑动
const prevPriority = () => {
  const index = priorityList.indexOf(priority.value);
  if (index > 0) {
    priority.value = priorityList[index - 1];
  }
};


// 表单数据
const addOrEditTask = reactive({
  formInputEl: [
    {
      title: "任务内容",
      key: "taskDetail",
      element: "input",
      style: "width: 100%;",
      illustrate: "任务内容",
      icon: "Document",
      color: "#d47549",
      size: "18",
      rules: [
        {
          required: true,
          message: "该项不能为空",
          trigger: "blur",
        },
      ],
      fullWidth: true
    },
  ],
  formTimeAndNumber: [
    {
      title: "截至时间",
      key: "deadline",
      element: "date",
      illustrate: "任务截至时间",
      icon: "Calendar",
      color: "#d47549",
      size: "18",
      fullWidth: false,
      valueFormat: 'YYYY-MM-DD HH:mm:ss'
    },
  ],
  formSelectEl: [
    {
      title: "任务负责人",
      key: "userIdList",
      element: "select",
      type: "multiple",
      illustrate: "任务负责人",
      icon: "User",
      color: "#d47549",
      size: "18",
      options: [],
      rules: [
        {
          required: true,
          message: "该项不能为空",
          trigger: "blur",
        },
      ],
      fullWidth: false
    },
  ],
  formTextAreaEl: [
    {
      title: "备注",
      key: "remark",
      element: "input",
      illustrate: "任务备注",
      icon: "ChatDotRound",
      color: "#d47549",
      size: "18",
      type: "textarea",
      minRows: 4,
      maxRows: 4,
      placeholder: "请输入备注内容",
      fullWidth: true
    },
  ],
  formPasteImageEl: [
    {
      title: "",
      key: "caption",
      illustrate: "",
      fullWidth: true
    }
  ],
  inputDone: async (val) => {
    // console.log("111---val", val)
    let params = { ...formData.value, ...val };

    params.priority = priority.value; // 优先级
    params.scheduleList = generateScheduleList(); // 任务流程
    params.taskName = params.taskDetail.slice(0, 6); // 任务名
    params.scheduleUserList = await generateScheduleUserList(); // 流程负责人
    params.caption = params.caption.length === 0 ? null : formatCaptionForSave(params.caption).join(';'); // 任务说明图

    if (params.id === null) delete params.id;
    if (params?.taskExecutor) delete params.taskExecutor;
    delete params.leaderList;
    delete params.taskExecutorList;

    console.log("----提交的参数3----", params)
    addOrUpdateTask({ list: [params] }).then((res) => {
      if (res && res.code){
        proxy.$message.success('操作成功');
        hideWin('addOrEdit', params);
      }
    })
  },
});

// 将流程进行整合成所需的数据结构
const generateScheduleList = () => {
  const processSchedule = formData.value.scheduleList.map(item => {
    if (item.name.endsWith('*')) { // 查看可选流程是否被用户勾选
      return item.required ? item.name : null
    } else {
      return item.name
    }
  }).filter(name => name !== null) // 过滤掉null值
  return processSchedule.join(',');
}

// 将流程负责人整合
const generateScheduleUserList = async () => {
  // 防止绑定的负责人数据出现错乱，在获取到字符串前，先将其进行正确排序
  const processScheduleUser = formData.value.scheduleList.map(item => {
    let users = item.taskExecutor
    if (users.length > 0) { // 查看可选流程是否被用户勾选
      const usersString = users.join('、')
      return usersString
    } else {
      return ''
    }
  })

  return processScheduleUser.join(',');
}

/**
 * 处理 任务图片caption
 * @param captionList 任务图片列表
 * @returns 用户id/图片名.后缀
 */
const formatCaptionForSave = (captionList) => {
  return captionList.map(url => {
    const match = url.match(/\/images\/task\/(.+)$/);
    return match ? match[1] : url;
  });
};

// 修改绑定的流程负责人
const handleChangeTaskExecutor = (value) => {
  // value 是当前选中的负责人列表
  formData.value.taskExecutorList = value;

  formData.value.scheduleList.forEach((schedule, index) => {
    if (formData.value.schedule === schedule.name) {
      schedule.taskExecutor = value;
    }
  })
};


// 修改当前任务的流程
const handleChangeSchedule = (item, index) => {
  // 实现仅点击的tag为高亮，且一定有一个被选中
  formData.value.scheduleList.forEach((scheduleItem, idx) => {
    scheduleItem.isChecked = idx === index;
  })

  // 更新schedule
  formData.value.schedule = item.name.endsWith('*') ? item.name.slice(0, -1) : item.name;
  
  // 并将该任务流程的负责人进行绑定
  formData.value.taskExecutorList = item.taskExecutor;

  // 强制刷新变更的字段
  nextTick(() => {
    ruleFormRef.value?.updateInput({
      scheduleList: formData.value.scheduleList,
      schedule: formData.value.schedule,
      taskExecutorList: formData.value.taskExecutorList
    });
  });

  // console.log("1111---修改任务流程" , formData.value)
}


/**
 * 从右键进来的新增
 */
const projectList = ref([]);
const selectedProject = ref(null);
const initProjectData = async () => {
  const data = await getProject({pageNum: 1, pageSize: 999});
  if (data.code === 200) {
    projectList.value = data.rows.map(project => {
      return {
        ...project,
        label: project.projectName,
        value: project.id
      }
    })
  }
}

const handleChangeSelectProject = async (selectId) => {
  try {
    selectedProject.value = selectId;
    // console.log("切换项目：", selectedProject.value);
    // 找到选中的项目数据
    const selectedProjectData = projectList.value.find(project => project.value === selectedProject.value);

    if (!selectedProjectData) {
      proxy.$message.error('未找到对应项目数据');
      return;
    }

    // 整合项目负责人数据
    const projectLeaderOptions = selectedProjectData.userNameList.map(name => ({
      label: name,
      value: name,
    }));

    // 更新 formData 的负责人选择器数据
    addOrEditTask.formSelectEl[0].options = projectLeaderOptions;
    formData.value.leaderList = projectLeaderOptions;
    formData.value.projectId = selectedProject.value;
    formData.value.projectName = selectedProjectData.projectName;

    // 整合任务流程和负责人数据
    // 更新 formData 的任务流程数据
    let scheduleList = selectedProjectData.scheduleList.split(',');
    formData.value.schedule = scheduleList[0];
    if (selectedProjectData?.scheduleList) {
      generateInitScheduleList(selectedProjectData.scheduleUserList, scheduleList, {schedule: scheduleList[0]});
    }

    nextTick(()=> { // 手动强制刷新表单数据
      ruleFormRef.value?.updateFormData(formData.value);
    })

    console.log("整合后的项目数据：", formData.value);
  } catch (error) {
    console.error("切换项目时发生错误：", error);
    proxy.$message.error('切换项目失败，请稍后重试');
  }
}

// 处理删除任务
const handleDeleteTask = async (taskData) => {
  try {
    const result = await deleteTask([taskData.id]);
    
    if (result.code === 200) {
      proxy.$message.success('任务删除成功');
      
      // 关闭窗口
      hideWin();
      
      // 如果是内联模式，发送删除成功事件
      if (props.isInline) {
        emitInline("inlineClose", { id: taskData.id});
      }
    } else {
      proxy.$message.error(result.message || '删除任务失败');
    }
  } catch (error) {
    console.error('删除任务时发生错误：', error);
    proxy.$message.error('删除任务失败，请稍后重试');
  }
}
</script>

<style lang="less" scoped>
@import "../../../assets/global.less"; // 复用按钮样式
.container {
  width: 100vw;
  height: 100vh;
  position: relative;
  transform: none;
}
.container.inline {
  width: 100%;
  height: 100%;
}

.full-width {
  grid-column: span 2;
}

.title-header {
  width: 100%;
  padding: 25px 20px 10px 20px;
  margin-bottom: 15px;
  background-color: #d9cbb8;
  .title-number {
    font-size: 13px;
    color: #5b4d48;
  }
  .title-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title-text {
      font-size: larger;
      color: #7f3a12;
      font-weight: 600;
      background-blend-mode: multiply;
      text-shadow: 2px 3px 1px #8b451330;
    }

    .priority-picker {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      user-select: none;
      margin-right: 50px;
      .priority-tag {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: bold;
        transition: background 0.3s ease;

        &:active {
          opacity: 0.8;
        }

        // P0 - 紧急
        &[data-priority="P0"] {
          background: linear-gradient(135deg, #ff6b6b, #ff4757);
          color: #fff;
        }

        // P1 - 高优先级
        &[data-priority="P1"] {
          background: linear-gradient(135deg, #ffa502, #ff7f50);
          color: #fff;
        }

        // P2 - 中高优先级
        &[data-priority="P2"] {
          background: linear-gradient(135deg, #ffd700, #ffa500);
          color: #8b4513;
        }

        // P3 - 中优先级
        &[data-priority="P3"] {
          background: linear-gradient(135deg, #98fb98, #90ee90);
          color: #2f4f4f;
        }

        // P4 - 中低优先级
        &[data-priority="P4"] {
          background: linear-gradient(135deg, #87ceeb, #00bfff);
          color: #2f4f4f;
        }

        // P5 - 低优先级
        &[data-priority="P5"] {
          background: linear-gradient(135deg, #dda0dd, #da70d6);
          color: #fff;
        }

        // P6 - 最低优先级
        &[data-priority="P6"] {
          background: linear-gradient(135deg, #f0f0f0, #d3d3d3);
          color: #666;
        }
      }
    }

    .project-select-box {
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      .project-icon-left {
        margin-right: 5px;
        color: #f56c6c;
      }

      .project-label-box {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: medium;
        font-weight: bold;
        cursor: pointer;
        .project-label {
          color: #72503c;
          margin-right: 5px;
          background-blend-mode: multiply;
          text-shadow: 2px 3px 1px #8b451330;
        }
        .project-icon-right {
          margin-right: 5px;
          color: #72503c;
        }

      }
    }
  }
}

.btn-close {
  margin-right: 40px;
}

.schedule-list-box {
  margin-right: 8px;
  height: 32px;
  .schedule-tag-box {
    display: flex;
    align-items: center;
    .schedule-item {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>