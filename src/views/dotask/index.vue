<template>
  <top-bar />
  <side-menu :currentIndex="currentMenuIndex" @menuSelect="changePage" />
  <div class="content">
    <component
      ref="pageComponent"
      :is="currentComponent"
      :selectedProject="
        currentComponent === taskManagement ? selectedProject : null
      "
      :stepChanged="stepChanged"
      :reportChanged="reportChanged"
      @projectSelected="handleProjectSelected"
      @menuSelect="changePage"
      @guide="handleGuide"
      @updateTab="handleGroupTab"
      @updateReportTab="handleReportTab"
    />
  </div>
  <el-tour
    v-model="openGuide"
    @change="handleStep"
    v-model:current="currentStep"
  >
    <el-tour-step :target="target1" title="创建团队" description="点击团队管理">
      <span style="color: #000 !important">点击团队管理</span>
    </el-tour-step>
    <el-tour-step
      :target="target2"
      title="创建团队"
      description="点击创建群组,复制邀请链接发送给团队成员，邀请团队成员下载并加入"
      @close="handleLink"
    >
      <span style="color: #000 !important"
        >点击创建群组,复制邀请链接发送给团队成员，邀请团队成员下载并加入</span
      >
    </el-tour-step>
    <el-tour-step :target="target3" title="创建团队" description="点击群组">
      <span style="color: #000 !important">点击群组</span>
    </el-tour-step>
    <el-tour-step
      :target="target4"
      title="创建团队"
      description="点击可查看群组成员，右侧操作栏可复制邀请链接"
    >
      <span style="color: #000 !important"
        >点击可查看群组成员，右侧操作栏可复制邀请链接</span
      >
    </el-tour-step>
    <el-tour-step
      :target="target5"
      title="创建团队"
      description="可复制邀请链接"
    >
      <span style="color: #000 !important">可复制邀请链接,或者操作群组</span>
    </el-tour-step>
    <el-tour-step :target="target6" title="创建项目" description="点击项目管理">
      <span style="color: #000 !important">点击项目管理</span>
    </el-tour-step>
    <el-tour-step :target="target7" title="创建项目" description="点击新增项目">
      <span style="color: #000 !important">点击新增项目</span>
    </el-tour-step>
    <el-tour-step :target="target8" title="创建任务" description="点击任务管理">
      <span style="color: #000 !important">点击任务管理</span>
    </el-tour-step>
    <el-tour-step :target="target9" title="创建任务" description="点击新增任务">
      <span style="color: #000 !important">点击新增任务</span>
    </el-tour-step>
    <el-tour-step
      :target="target10"
      title="生成周报"
      description="点击周报管理"
    >
      <span style="color: #000 !important">点击周报管理</span>
    </el-tour-step>
    <el-tour-step
      :target="target11"
      title="生成周报"
      description="点击周报模板管理"
    >
      <span style="color: #000 !important">点击周报模板管理</span>
    </el-tour-step>
    <el-tour-step
      :target="target12"
      title="生成周报"
      description="新增周报模板"
    >
      <span style="color: #000 !important">新增周报模板</span>
    </el-tour-step>
  </el-tour>
</template>

<script setup>
import { ref, markRaw, onMounted, onUnmounted } from "vue"
import topBar from "../../public/components/topBar.vue"
import sideMenu from "../../public/components/sideMenu.vue"
import TaskManagement from "./taskManagement.vue"
import SettingManagement from "./settingManagement.vue"
import GroupManagement from "./groupManagement.vue"
import ProjectManagement from "./projectManagement.vue"
import WeeklyReportManagement from "./weeklyReportManagement.vue"
const openGuide = ref(false)
const currentStep = ref(0)
const stepChanged = ref(false)
const reportChanged = ref(false)
const groupTab = ref("好友")
const reportTab = ref("reportList")
const target1 = () => document.querySelector("#team")
const target2 = () => document.querySelector("#groupBtn")
const target3 = () => document.querySelector("#tab-群组")
const target4 = () => document.querySelector("#groupOne")
const target5 = () => document.querySelector("#groupHandle")
const target6 = () => document.querySelector("#project")
const target7 = () => document.querySelector("#addProject")
const target8 = () => document.querySelector("#task")
const target9 = () => document.querySelector("#addTask")
const target10 = () => document.querySelector("#weeklyReport")
const target11 = () => document.querySelector("#tab-templateManagement")
const target12 = () => document.querySelector("#addTemplate")
const handleStep = step => {
  console.log(step, currentMenuIndex.value, "当前指引步骤")
  if (step === 1 && currentMenuIndex.value !== "3") {
    changePage("3")

    return
  }
  if (step === 2) {
    stepChanged.value = true

    return
  }
  if (step === 3) {
    stepChanged.value = true
    // console.log("currentMenuIndex.value", groupTab.value, stepChanged.value)
    return
  }
  if (step === 6 && currentMenuIndex.value !== "1") {
    changePage("1")
    return
  }
  if (step === 8 && currentMenuIndex.value !== "2") {
    changePage("2")
    return
  }
  if (step === 10 && currentMenuIndex.value !== "4") {
    changePage("4")
    return
  }
  if (step === 11) {
    reportChanged.value = true
    return
  }
}
const handleGuide = () => {
  openGuide.value = true
}
const handleLink = () => {
  //openGuide.value = false
}
const handleGroupTab = tab => {
  groupTab.value = tab
}
const handleReportTab = tab => {
  reportTab.value = tab
}
const startGuide = () => {
  currentStep.value = 0
  groupTab.value = "好友"
  stepChanged.value = false
  reportChanged.value = false
  openGuide.value = true
}
const projectManagement = markRaw(ProjectManagement)
const taskManagement = markRaw(TaskManagement)
const settingManagement = markRaw(SettingManagement)
const groupManagement = markRaw(GroupManagement)
const weeklyReportManagement = markRaw(WeeklyReportManagement)

// 定义当前显示的页面
const currentComponent = ref(taskManagement)

// 存储选中的项目信息
const selectedProject = ref(null)

// 当前选中的菜单索引
const currentMenuIndex = ref("2")

// 添加项目选择处理函数
const handleProjectSelected = project => {
  selectedProject.value = project
  // 切换到任务管理页面
  changePage("2")
}

// 修改切换页面逻辑
const changePage = index => {
  currentMenuIndex.value = index
  switch (index) {
    case "1":
      currentComponent.value = projectManagement
      currentStep.value = 6
      break
    case "2":
      currentComponent.value = taskManagement
      currentStep.value = 8
      break
    case "3":
      currentComponent.value = groupManagement
      currentStep.value = 1
      break
    case "4":
      currentComponent.value = weeklyReportManagement
      currentStep.value = 10
      break
    case "5":
      currentComponent.value = settingManagement
      break
    default:
      currentComponent.value = taskManagement
      currentMenuIndex.value = "2"
  }
}

/**
 * 刷新逻辑
 */

// 监听刷新事件
onMounted(() => {
  console.log("index.vue")
  window.addEventListener("window-refresh", handleRefresh)
})

// 卸载时移除监听
onUnmounted(() => {
  window.removeEventListener("window-refresh", handleRefresh)
})

// 处理刷新逻辑
const pageComponent = ref(null)
const handleRefresh = () => {
  if (pageComponent.value) {
    pageComponent.value.initData()
  }
}
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
