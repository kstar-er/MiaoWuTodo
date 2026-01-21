<template>
  <main class="container">
    <!-- 加载动画 -->
    <loadingAnimation :loading="loading" loadingText="加载周报数据中..." />

    <div class="weekly-report-container" v-if="!loading">
      <!-- 标签页切换：周报查看和周报模板管理 -->
      <el-tabs v-model="activeTab" type="card" class="sticky-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="周报查看" name="reportList">
          <WeeklyReportList ref="reportListRef" @item-click="handleItemClick" />
        </el-tab-pane>
        <el-tab-pane label="周报模板管理" name="templateManagement">
          <WeeklyReportTemplate ref="templateRef" @item-click="handleItemClick" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 详情抽屉面板 -->
    <div
      v-if="detailDrawerVisible"
      class="inline-detail-panel"
      :class="['side-' + drawerDirection, { show: detailDrawerVisible, 'no-anim': noAnim }]"
      :style="{ width: drawerSize, '--drawer-size': drawerSize }"
    >
      <WeeklyReportDetail
        :isInline="true"
        :inlineData="inlineDetailData"
        :drawerDirection="drawerDirection"
        @inlineClose="handleInlineClose"
        @inlineSaved="handleInlineSaved"
      />
    </div>
    <div class="add_but" v-if="activeTab==='templateManagement'" >
      <FloatIcon @onClick="openTemplateDetail('add', {}, '')"></FloatIcon>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from "vue";
import FloatIcon from "./components/dragFloatBtn.vue"; // 拖拽按钮
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize, LogicalPosition } from "@tauri-apps/api/window";
import loadingAnimation from "../components/public/loadingAnimation.vue";
import WeeklyReportList from "./components/weeklyReportList.vue";
import WeeklyReportTemplate from "./components/weeklyReportTemplate.vue";
import WeeklyReportDetail from "./components/weeklyReportDetail.vue";
import { getGroupList } from "@/utils/groupManagement/index.js";
import { getProject } from "@/utils/taskManagement/index.js";

const loading = ref(false);
const activeTab = ref('reportList');
const detailDrawerVisible = ref(false);
const inlineDetailData = ref(null);
const drawerDirection = ref('rtl');
const drawerSize = ref('');
const originalWindowPos = ref(null);
const originalWindowSize = ref(null);
const isWindowExpanded = ref(false);
const noAnim = ref(false);
const isClosing = ref(false);
const reportListRef = ref(null);
const templateRef = ref(null);

const handleTabChange = (tabName) => {
  // 切换标签页时，可以重新加载对应数据
  if (tabName === 'reportList' && reportListRef.value) {
    reportListRef.value.initData();
  } else if (tabName === 'templateManagement' && templateRef.value) {
    templateRef.value.initData();
  }
};

const handleItemClick = (item) => {
  // 点击列表项，打开详情抽屉
  openDetailDrawer(item);
};

const computeDrawerSide = async () => {
  try {
    const win = getCurrentWindow();
    const pos = originalWindowPos.value || await win.innerPosition();
    const size = originalWindowSize.value || await win.innerSize();
    const scaleFactor = await win.scaleFactor();
    
    // 对获取到的位置和尺寸先除以缩放因子
    const adjustedPos = originalWindowPos.value || { x: pos.x / scaleFactor, y: pos.y / scaleFactor };
    const adjustedSize = originalWindowSize.value || { width: size.width / scaleFactor, height: size.height / scaleFactor };
    
    const screenWidth = window.screen?.width || 1920;
    const screenCenterX = (adjustedPos.x + adjustedSize.width / 2);
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
    const scaleFactor = await win.scaleFactor();
    
    // 对获取到的位置和尺寸先除以缩放因子
    const adjustedCurrentPos = { x: currentPos.x / scaleFactor, y: currentPos.y / scaleFactor };
    const adjustedCurrentSize = { width: currentSize.width / scaleFactor, height: currentSize.height / scaleFactor };
    
    if (!originalWindowPos.value || !originalWindowSize.value) {
      originalWindowPos.value = { x: adjustedCurrentPos.x, y: adjustedCurrentPos.y };
      originalWindowSize.value = { width: adjustedCurrentSize.width, height: adjustedCurrentSize.height };
    }
    const maxDrawer = 620;
    const screenWidth = window.innerWidth || 1920;
    const dw = Math.min(maxDrawer, Math.floor(screenWidth * 1.8));
    drawerSize.value = dw + 'px';
    const basePos = originalWindowPos.value;
    const baseSize = originalWindowSize.value;
    const targetWidth = baseSize.width + dw;
    const targetX = drawerDirection.value === 'ltr' ? basePos.x - dw : basePos.x;
    if (adjustedCurrentSize.width !== targetWidth || adjustedCurrentPos.x !== targetX) {
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
    const currentPos = await win.innerPosition();
    const currentSize = await win.innerSize();
    const scaleFactor = await win.scaleFactor();
    
    // 对获取到的位置和尺寸先除以缩放因子
    const adjustedCurrentPos = { x: currentPos.x / scaleFactor, y: currentPos.y / scaleFactor };
    const adjustedCurrentSize = { width: currentSize.width / scaleFactor, height: currentSize.height / scaleFactor };
    
    const targetWidth = originalWindowSize.value.width;
    const maxDrawer = 620;
    const screenWidth = window.innerWidth || 1920;
    const dw = Math.min(maxDrawer, Math.floor(screenWidth * 0.8));
    const targetX = drawerDirection.value === 'ltr' ? adjustedCurrentPos.x + dw : adjustedCurrentPos.x;
    await win.setSize(new LogicalSize(targetWidth, adjustedCurrentSize.height));
    await win.setPosition(new LogicalPosition(targetX, adjustedCurrentPos.y));
  } catch (e) {
    console.error('还原主窗口失败:', e);
  } finally {
    isWindowExpanded.value = false;
    originalWindowPos.value = null;
    originalWindowSize.value = null;
  }
};

const openDetailDrawer = async (item) => {
  console.log('openDetailDrawer called with item:', item);
  inlineDetailData.value = {
    ...item,
    groupList: groupList.value,
    projectList: projectList.value
  }
  console.log('inlineDetailData.value set to:', inlineDetailData.value);
  await computeDrawerSide();
  await expandMainWindowForDrawer();
  detailDrawerVisible.value = true;
};

const handleInlineSaved = async (params) => {
  detailDrawerVisible.value = false;
  // 根据操作刷新对应列表
  if (activeTab.value === 'reportList' && reportListRef.value) {
    reportListRef.value.initData();
  } else if (activeTab.value === 'templateManagement' && templateRef.value) {
    templateRef.value.initData();
  }
};

const handleInlineClose = async () => {
  isClosing.value = true;
  noAnim.value = true;
  detailDrawerVisible.value = false;
  try {
    await restoreMainWindow();
  } finally {
    requestAnimationFrame(() => {
      noAnim.value = false;
      isClosing.value = false;
    });
  }
};

// 监听detailDrawerVisible，如果是false，就恢复窗口
watch(detailDrawerVisible, async (visible) => {
  if (!visible) {
    if (isClosing.value) return; // 已在 handleInlineClose 中处理
    await restoreMainWindow();
  }
});

const openTemplateDetail = (action, data, extra) => {
  // 构建新增模板的数据对象
  const newTemplate = {
    id: null,
    type: 'template', // 标识为模板类型
    templateType: '',
    description: '',
    reportType: 'personal',
    templateFormat: 'markdown',
    contentFormat: 'detailed',
    language: 'zh-CN',
    detailLevel: 'standard',
    scheduleType: 'manual',
    generateDay: 1,
    autoGenerateTime: '09:00:00',
    includeMetrics: true,
    includeSuggestions: true,
    autoGenerate: false,
    enabled: true,
    userId: null, // 可以后续从用户信息获取
    groupId: null,
    creator: '', // 可以后续从用户信息获取
    createTime: new Date().toISOString().split('T')[0]
  };
  console.log('openTemplateDetail - newTemplate:', newTemplate);
  openDetailDrawer(newTemplate);
};

/**
 * 获取团队列表
 */
const groupList = ref([])
const initGroupList = async () => {
  const res = await getGroupList({pageNum: 1, pageSize: 999, groupName: ''})
  if (res.code === 200) {
    if (res.data.total > 0) {
      groupList.value = res.data.records.map(item => {
        return {
          ...item,
          value: item.id,
          label: item.groupName
        }
      })
    } else {
      groupList.value = []
    }
  } else {
    groupList.value = []
  }
}

/**
 * 获取项目列表
 */
const projectList = ref([])
const initProjectList = async () => {
  const res = await getProject({pageNum: 1, pageSize: 999})
  if (res.code === 200) {
    if (res.total > 0) {
      projectList.value = res.rows.map(item => {
        return {
          ...item,
          value: item.id,
          label: item.projectName
        }
      })
    } else {
      projectList.value = []
    }
  } else {
    projectList.value = []
  }
}

const initData = async () => {
  loading.value = true;
  // 初始化数据
  initGroupList() // 获取群组列表
  initProjectList() // 获取项目列表
  setTimeout(() => {
    loading.value = false;
  }, 500);
};

defineExpose({ initData });

onMounted(() => {
  initData();
});

/**
 * 组件卸载
 * 如果是在打开内联详情窗口的情况下，切换主页面，则需恢复窗口
 */
onUnmounted(() => {
  if (detailDrawerVisible.value) {
    restoreMainWindow()
  }
});
</script>

<style lang="less" scoped>
.container {
  padding-top: 10px;
  font-size: 15px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  // text-align: center;
}

.weekly-report-container {
  width: 100%;
  max-width: 360px;
  text-align: center;
  flex: 0 0 auto;
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

.inline-detail-panel.side-rtl { right: 0; transform: translateX(100%); }
.inline-detail-panel.side-ltr { left: 0; transform: translateX(-100%); }

.container.drawer-ltr .weekly-report-container { margin-left: auto; }
.inline-detail-panel.show { width: var(--drawer-size, 620px); transform: translateX(0); opacity: 1; visibility: visible; pointer-events: auto; }

:root { --drawer-size: 620px; }

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
  margin: 0 0 2px 5px !important;
}
</style>
