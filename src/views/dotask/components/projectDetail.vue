<!-- 项目：新增/编辑窗口 -->
<template>
  <main class="container">
    <customDragWindow>
      <template #header>
        <div class="title-header" >
          <div class="title-content">
            <div class="title-number" v-if="projectData.id">
              <div> {{ "序号 #" +  projectData.id }} </div>
            </div>
            <div class="title-text">
              {{ projectData.projectName ? projectData.projectName : "新建项目"}}
            </div>
            <el-button
              class="btn-close"
              type="danger" 
              :icon="CloseBold"
              circle
              @click="hideWin"
            />
          </div>
        </div>
      </template>
    </customDragWindow>
    
    <publicForm
      ref="ruleFormRef"
      :form-data="projectData.value"
      :form-input-el="addOrEditProject.formInputEl"
      :form-select-el="addOrEditProject.formSelectEl"
      :form-text-area-el="addOrEditProject.formTextAreaEl"
      :form-upload-el="addOrEditProject.formUploadEl"
      :form-time-and-number="addOrEditProject.formTimeAndNumber"
      @hide-win="hideWin"
      @input-done="addOrEditProject.inputDone"
    >
      <template #append1>
        <el-form-item
          label="相关群组"
          prop="groupIdList"
          style="width:94%"
          class="form-item"
        >
          <el-select
            v-model="projectData.groupIdList"
            multiple
            filterable
            reserve-keyword
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择该项目的负责相关群组"
            style="width: 300px"
            clearable
            @change="handleChangeGroup"
          >
            <el-option
              v-for="item in groupList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          label="项目成员"
          prop="userIdList"
          style="width:94%"
          class="form-item"
        >
          <el-select
            v-model="projectData.userIdList"
            multiple
            filterable
            reserve-keyword
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择群组后再选择成员"
            style="width: 300px"
            :disabled="projectData.groupIdList?.length ? false : true"
            clearable
            @change="handleChangeUserList"
          >
            <el-option
              v-for="item in projectUserList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          label="任务进度规划"
          prop="scheduleList"
          class="full-width"
        >
          <div v-for="(item, index) in projectData.scheduleList" :key="item" class="schedule-list-box">
            <el-tag
              class="schedule-tag-box"
              style="margin-top:8px; margin-right: 8px;font-size: 13px;"
              type="warning"
              size="large"
              closable
              @close="deleteScheduleList(index)"
            >
              <div class="schedule-checkbox">
                <el-checkbox :value="item" size="small" @change="handleCheckedTag(item, index)" :checked="item.isChecked"/>
              </div>

              <el-tooltip placement="top">
                <template #content> 点击人物图标 <br/> 即可绑定&nbsp;{{ item.name }}&nbsp;流程的负责人 </template>
                <div class="schedule-name">
                  {{ item.name }}
                </div>
              </el-tooltip>
              
              <img 
                :src="imageList.scheduleUser"
                alt="流程负责人"
                class="schedule-user-img"
                @click="handleSelectVisibility(index)"
              >
              
              <div class="schedule-user-select" v-if="item.isSelectVisible">
                <el-select
                  v-model="projectData.scheduleUserMap[item.name]"
                  multiple
                  filterable
                  collapse-tags
                  collapse-tags-tooltip
                  placeholder="流程负责人"
                  style="margin-left: 5px; width: 175px;"
                  clearable
                >
                  <el-option
                    v-for="leader in projectUserList"
                    :key="leader.label"
                    :label="leader.label"
                    :value="leader.label"
                  />
                </el-select>
              </div>
            </el-tag>
          </div>
          <el-tooltip placement="bottom">
            <template #content> 对某个任务标签进行打勾<br />表示该任务流程为可选流程 </template>
            <el-input
              v-if="inputVisible"
              ref="InputRef"
              v-model="inputValue"
              size="small"
              class="inline-block mt10"
              style="width:100px;margin-top:8px"
              @keyup.enter="handleInputConfirm"
              @blur="handleInputConfirm"
            />
            <el-button
              v-else
              size="small"
              class="inline-block mt10"
              style="width:100px;margin-top:8px"
              @click="showInput"
            >
              + 新流程
            </el-button>
          </el-tooltip>
        </el-form-item>
      </template>
    </publicForm>
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
} from "vue";
import publicForm from "../../components/public/publicForm.vue"; // 封装表单
import { addOrUpdateProject } from "../../../utils/taskManagement";
import { getGroupList, getBatchGroupMemberList } from "../../../utils/groupManagement";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { CloseBold } from "@element-plus/icons-vue";
import customDragWindow from "../../components/public/customDragWindow.vue";
import { hasOwn } from "element-plus/es/utils/objects.mjs";

const { proxy } = getCurrentInstance();

let project_win = getCurrentWindow("project_add_detail"); // 项目新增编辑窗口
let send_win = ''; // 给该子窗口发送信息的父窗口
const imageList = ref({
  scheduleUser: '/scheduleUser.svg'
})

const projectData = ref({}) // 表单数据

onMounted(async () => {
  console.log("项目详情窗口组件已挂载完毕");
  await project_win.emit(`project-detail-window-ready`);
});

let unlistenFn0, unlistenFn1; // 监听
let hasListened = false;
const ruleFormRef = ref(null);
onMounted(async () => {
  if (sessionStorage.getItem("formdata")) {
    projectData.value = JSON.parse(sessionStorage.getItem("formdata"));
    addOrEditProject.formSelectEl[0].options = projectData.value.projectClassList;
    await handleInitMember();

    // 手动强制刷新表单数据
    nextTick(()=> {
      ruleFormRef.value?.updateFormData(projectData.value);
    })
    return;
  }

  if (!hasListened) {
    try {
      unlistenFn0 = await listen("main-project-add-edit-info", async (event) => {
        hasListened = true;
        await initDataSource(event);
        return;
      });
      unlistenFn1 = await listen("pet-project-add-edit-info", async (event) => {
        hasListened = true;
        await initDataSource(event);
        return;
      });
    } catch (error) {
      console.error("事件监听设置失败:", error);
    }
  }
});

onUnmounted(() => {
  unlistenFn0?.();
  unlistenFn1?.(); // 在组件卸载时移除监听器
});

const initDataSource = async (event) => {
  const { formdata, token, sendWin } = event.payload;

  send_win = sendWin;

  // 存储编辑或新增信息到本地
  sessionStorage.setItem("token", token)
  projectData.value = formdata;

  // 初始化项目分组列表数据
  addOrEditProject.formSelectEl[0].options = projectData.value.projectClassList;

  // 获取群组列表
  await handleGetGroupList();

  if (!formdata.id) { // 新增
    // 初始化scheduleList
    projectData.value.scheduleList = formdata.scheduleList.map(item => {
      // 如果是对象，就不用再处理了
      if (hasOwn(item, 'isChecked') || hasOwn(item, 'isSelectVisible')) {
        return item;
      }

      return {
        name: item,
        isChecked: false, // 是否设为 可选流程
        isSelectVisible: false // 是否设置负责人
      }
    })

    // 初始化 scheduleUserMap
    projectData.value.scheduleUserMap = {};
    projectData.value.scheduleList.forEach((task) => {
      projectData.value.scheduleUserMap[task.name] = [];
    });

  } else {
    handleInitMember();

    nextTick(()=> { // 手动强制刷新表单数据
      ruleFormRef.value?.updateFormData(projectData.value);
    })
  }
  console.log("1111---整合好的数据", projectData.value)
  sessionStorage.setItem("formdata", JSON.stringify(projectData.value));
}

const hideWin = (type, params) => {
  let main_win = getCurrentWindow(send_win);
  if (type === 'addOrEdit') {
    main_win.emit("info-updated", {action: projectData.value.id ? "updated" : "add", data: params})
  } else {
    main_win.emit(`${send_win}-info-close`, {action: "cancel"})
  }
  projectData.value = {};
  unlistenFn0?.();
  unlistenFn1?.();
  project_win.destroy();
}

const addOrEditProject = reactive({
  formInputEl: [{
    title: "项目名称",
    key: 'projectName',
    element: 'input',
    rules: [{
      required: true,
      message: '该项不能为空',
      trigger: 'blur'
    }],
    fullWidth: false
  }],
  formTimeAndNumber: [{
    title: "开始时间",
    key: 'startTime',
    element: 'date',
    rules: [{
      required: true,
      message: '该项不能为空',
      trigger: 'blur'
    }],
    fullWidth: false
  }, {
    title: "工期/天",
    key: 'duration',
    element: 'number',
    rules: [{
      required: true,
      message: '该项不能为空',
      trigger: 'blur'
    }],
    fullWidth: false
  }],

  formSelectEl: [{
    title: "项目分组",
    key: 'classification',
    element: 'select',
    options: [],
    footerAdd: true,
    fullWidth: false
  }],
  formTextAreaEl: [{
    title: "备注",
    key: 'remark',
    element: 'input',
    type: 'textarea',
    fullWidth: true
  }],
  formUploadEl: [],
  inputDone: async (val) => { // 提交表单，进行增改
    let params = { ...projectData.value, ...val };
    params.scheduleList = params.scheduleList.map(item=> item.isChecked===true ? item.name + '*' : item.name).join(",");
    params.scheduleUserList = await (generateScheduleUserList()) || ''; // 任务流程所对应的负责人
    delete params.scheduleUserMap;
    delete params.projectClassList;
    console.log("val", val)
    console.log("params", params)

    proxy.$alert(val.id ? "是否确认更新项目" : "是否确认新建项目", "提示", {
      type: "info",
      showCancelButton: true,
      confirmButtonText: "确认",
      callback: async (action) => {
        if (action === "cancel") return;
        else {
          addOrUpdateProject({ list: [params] }).then((res) => {
            if (res && res.code){
              proxy.$message.success('操作成功');
              hideWin('addOrEdit', params);
            }
          })
        }
      },
    });
  },
});

// 对绑定的流程负责人数据 整合成后端想要的数据结构
const generateScheduleUserList = async () => {
  // 防止绑定的负责人数据出现错乱，在获取到字符串前，先将其进行正确排序
  const sortedScheduleUserMap = projectData.value.scheduleList.reduce((sortedMap, task) => {
    if (projectData.value.scheduleUserMap[task.name]) {
      sortedMap[task.name] = projectData.value.scheduleUserMap[task.name];
    }
    return sortedMap;
  }, {});

  const scheduleUser = [];
  for (const [task, users] of Object.entries(sortedScheduleUserMap)) {
    if (users && users.length > 0) {
      const userString = users.join('、');
      scheduleUser.push(userString);
    } else {
      scheduleUser.push('')
    }
  }

  return scheduleUser.join(',');
}

/**
 * 获取群组列表
 */
const groupList = ref([]); // 群组列表
const handleGetGroupList = async () => {
  const res = await getGroupList({
    pageNum: 1,
    pageSize: 999,
    groupName: ""
  })
  if (res.code === 200 && res.data.total > 0) {
    groupList.value = res.data.records.map(item => {
      return {
        label: item.groupName,
        value: item.id
      }
    })
  }
}

/**
 * 选择群组后，将群组下的所有成员加入到项目成员中
 * 并进行去重
 */
const projectUserList = ref([]) // 项目成员列表
const handleChangeGroup = async (val) => {
  projectData.value.groupIdList = val;

  // 如果清空群组选项，就将 负责人列表projectUserList、选中的成员userIdList 清空
  if (!projectData.value?.groupIdList || projectData.value.groupIdList.length <= 0) {
    projectUserList.value = [];
    projectData.value.userIdList = [];
    return;
  };

  const res = await getBatchGroupMemberList({
    groupIdList: projectData.value.groupIdList
  })

  console.log("111---res",res)

  projectUserList.value = [];
  projectData.value.userIdList = [];
  if (res.code === 200 && res.data.length > 0) {
    res.data.map(item => {
      // select选择器负责人列表
      projectUserList.value.push({
        label: item.nickName,
        value: item.userId
      });

      // 默认将群组的所有成员都加进去
      projectData.value.userIdList = [...projectData.value.userIdList, item.userId];

      nextTick(()=> { // 手动强制刷新表单数据的人员、群组
        ruleFormRef.value?.updateInput({
          groupIdList: projectData.value.groupIdList,
          userIdList: projectData.value.userIdList
        });
      })
    })
  }
}

// 手动更新user列表
const handleChangeUserList = (val) => {
  console.log("user-val", val)
  projectData.value.userIdList = val;
  ruleFormRef.value?.updateInput({
    userIdList: projectData.value.userIdList
  });
}


/**
 * 初始化项目成员列表
 */
const handleInitMember = async () => {
  if (!projectData.value?.groupIdList || projectData.value.groupIdList.length <= 0) {
    projectUserList.value = [];
    return;
  };

  const res = await getBatchGroupMemberList({
    groupIdList: projectData.value.groupIdList
  })

  projectUserList.value = [];
  if (res.code === 200 && res.data.length > 0) {
    res.data.map(item => {
      // select选择器负责人列表
      projectUserList.value.push({
        label: item.nickName,
        value: item.userId
      });
    })
  }
}

/*
  对任务流程的操作
*/
const handleSelectVisibility = (index) => { // 绑定对应流程的负责人
  console.log("执行了visible")
  projectData.value.scheduleList[index].isSelectVisible = !(projectData.value.scheduleList[index].isSelectVisible);
}

// 增加任务流程
const inputVisible = ref(false)
const inputValue = ref('')
const handleInputConfirm = () => {
  projectData.value.scheduleList.push({
    name: inputValue.value,
    isChecked: false,
  });
  
  projectData.value.scheduleList.forEach((task) => {
    projectData.value.scheduleUserMap[task.name] = [];
  });
  inputVisible.value = false
  inputValue.value = ''
}
const showInput = () => {
  inputVisible.value = true
  inputValue.value = ''
}

// 设置流程为 可选流程
const handleCheckedTag = (item, index) => {
  item.isChecked = !(item.isChecked) 
}

// 对任务流程删减
const deleteScheduleList = (idx) => {
  const task = projectData.value.scheduleList[idx];
  delete projectData.value.scheduleUserMap[task.name];
  projectData.value.scheduleList.splice(idx, 1);
}
</script>

<style lang="less" scoped>
@import "../../../assets/global.less";

.container {
  width: 100vw;
  height: 100vh;
  position: relative;
  transform: none;
}

.title-header {
  padding: 15px 20px;
  margin-bottom: 10px;
  background-color: #d9cbb8;
  will-change: transform;
  .title-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title-number {
      font-size: 13px;
      color: #5b4d48;
    }
    .title-text {
      font-size: larger;
      color: #7f3a12;
      font-weight: 600;
      background-blend-mode: multiply;
      text-shadow: 2px 3px 1px #8b451330;
    }
  }
}

.schedule-user-img {
  width: 18px;
  height: 18px;
  margin-left: 5px;
  cursor: pointer;
}

.full-width {
  grid-column: span 2;
}

:deep(.el-tag__content) {
  display: flex;
  justify-content: center;
  align-items: center;
}

.el-dialog {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.el-dialog .el-dialog__body {
  flex: 1;
  overflow-y: auto;
  padding: 5px 10px;
}

.dialog-header {
  background-color: #d9cbb8;
  padding: 15px 20px;
  will-change: transform;
  .dialog-header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .dialog-title {
      margin: 0;
      color: #7f3a12
    }
  }
}

.dialog-footer-btn {
  height: 50px;
  bottom: 0;
  right: 15px;
  position: absolute;
}

:deep(.el-dialog.is-fullscreen) {
  padding: 0 !important;
}
</style>