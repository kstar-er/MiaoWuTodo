<!-- 项目概览弹窗：展示所有项目概览，按编号排序 -->
<template>
  <el-dialog
    v-model="visible"
    title="项目概览大屏"
    width="92%"
    top="4vh"
    class="overview-dialog"
    :show-close="false"
    @close="onClose"
  >
    <template #header>
      <div class="dialog-header">
        <div class="dialog-title">
          <el-icon class="title-icon"><Monitor /></el-icon>
          <span>项目概览大屏</span>
          <span class="project-count">共 {{ sortedProjects.length }} 个项目</span>
        </div>
        <el-button
          class="btn-close"
          type="danger"
          :icon="CloseBold"
          circle
          @click="onClose"
        />
      </div>
    </template>

    <div class="overview-content">
      <!-- 统计卡片 -->
      <div class="stat-cards">
        <div class="stat-card" v-for="item in statCards" :key="item.label">
          <div class="stat-icon" :style="{ backgroundColor: item.bg }">
            <el-icon :size="20" :color="item.color"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </div>
      </div>

      <!-- 概览表格 -->
      <el-table
        :data="sortedProjects"
        border
        stripe
        height="calc(78vh - 140px)"
        class="overview-table"
        :row-class-name="rowClassName"
        :default-sort="{ prop: 'id', order: 'ascending' }"
      >
        <el-table-column label="项目编号" prop="id" width="110" align="center" fixed sortable>
          <template #default="{ row }">
            <span class="project-no">{{ formatProjectNo(row.id) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="项目名称" prop="projectName" min-width="160" align="center" show-overflow-tooltip fixed />

        <el-table-column label="客户/来源" prop="customerSource" min-width="130" align="center" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.customerSource || '—' }}
          </template>
        </el-table-column>

        <el-table-column label="优先级" prop="priority" width="100" align="center">
          <template #default="{ row }">
            <span class="priority-tag" :class="priorityClass(row.priority)">
              <span class="priority-dot"></span>
              {{ row.priority || '未设置' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="当前阶段" prop="currentStage" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.currentStage" size="small" effect="plain" type="warning">
              {{ row.currentStage }}
            </el-tag>
            <span v-else>{{ row.schedule || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="整体进度" prop="overallProgress" width="180" align="center">
          <template #default="{ row }">
            <div class="progress-box">
              <el-progress
                :percentage="Number(row.overallProgress) || 0"
                :color="progressColor(row.overallProgress)"
                :stroke-width="14"
                :text-inside="true"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="流程状态(卡点提醒)" prop="processStatus" min-width="180" align="center" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.processStatus" class="status-tag" :class="statusClass(row.processStatus)">
              {{ row.processStatus }}
            </span>
            <span v-else class="status-normal">🟢 正常</span>
          </template>
        </el-table-column>

        <el-table-column label="计划上线日" prop="planOnlineDate" width="130" align="center" sortable>
          <template #default="{ row }">
            <span :class="{ 'date-overdue': isOverdue(row.planOnlineDate) }">
              {{ formatDate(row.planOnlineDate) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="项目经理" prop="projectManager" width="110" align="center">
          <template #default="{ row }">
            {{ row.projectManager || (row.userNameList && row.userNameList.length ? row.userNameList[0] : '—') }}
          </template>
        </el-table-column>

        <el-table-column label="阶段停留天数" prop="stageStayDays" width="120" align="center" sortable>
          <template #default="{ row }">
            <span class="stay-days" :class="stayDaysClass(row.stageStayDays)">
              {{ row.stageStayDays != null ? row.stageStayDays + ' 天' : '—' }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { Monitor, CloseBold, WarningFilled, SuccessFilled, Timer, TrendCharts } from "@element-plus/icons-vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  projects: {
    type: Array,
    default: () => [],
  },
});

const emits = defineEmits(["update:modelValue"]);

const visible = ref(props.modelValue);
watch(() => props.modelValue, (val) => {
  visible.value = val;
});
watch(visible, (val) => {
  if (!val) emits("update:modelValue", false);
});

// 按项目编号(id)升序排序
const sortedProjects = computed(() => {
  return [...props.projects].sort((a, b) => a.id - b.id);
});

// 统计卡片
const statCards = computed(() => {
  const list = props.projects;
  const total = list.length;
  const riskCount = list.filter(p => p.processStatus && p.processStatus.includes('风险')).length;
  const doneCount = list.filter(p => Number(p.overallProgress) >= 100).length;
  const overdueCount = list.filter(p => isOverdue(p.planOnlineDate)).length;
  return [
    { label: "项目总数", value: total, icon: TrendCharts, color: "#7f3a12", bg: "#f5e6d3" },
    { label: "风险项目", value: riskCount, icon: WarningFilled, color: "#f56c6c", bg: "#fde2e2" },
    { label: "已上线", value: doneCount, icon: SuccessFilled, color: "#67c23a", bg: "#e1f3d8" },
    { label: "即将逾期", value: overdueCount, icon: Timer, color: "#e6a23c", bg: "#faecd8" },
  ];
});

const onClose = () => {
  visible.value = false;
  emits("update:modelValue", false);
};

// 项目编号格式化：1 -> P-001
const formatProjectNo = (id) => {
  if (id == null) return "—";
  return "P-" + String(id).padStart(3, "0");
};

// 优先级样式
const priorityClass = (priority) => {
  if (!priority) return "priority-none";
  const p = priority.toLowerCase();
  if (p.includes("高") || p === "p0" || p === "p1") return "priority-high";
  if (p.includes("中") || p === "p2" || p === "p3") return "priority-medium";
  if (p.includes("低") || p === "p4" || p === "p5") return "priority-low";
  return "priority-none";
};

// 进度条颜色
const progressColor = (progress) => {
  const p = Number(progress) || 0;
  if (p >= 100) return "#67c23a";
  if (p >= 80) return "#409eff";
  if (p >= 40) return "#e6a23c";
  return "#909399";
};

// 流程状态样式
const statusClass = (status) => {
  if (!status) return "";
  if (status.includes("风险")) return "status-risk";
  if (status.includes("正常")) return "status-normal-bg";
  if (status.includes("预警") || status.includes("提醒") || status.includes("卡")) return "status-warn";
  return "status-normal-bg";
};

// 日期格式化
const formatDate = (date) => {
  if (!date) return "—";
  return String(date).split(" ")[0];
};

// 是否逾期
const isOverdue = (date) => {
  if (!date) return false;
  const target = new Date(String(date).split(" ")[0]);
  if (isNaN(target.getTime())) return false;
  // 只标记未完成且过期的
  return target < new Date();
};

// 阶段停留天数样式
const stayDaysClass = (days) => {
  const d = Number(days);
  if (isNaN(d)) return "";
  if (d > 14) return "stay-days-danger";
  if (d > 7) return "stay-days-warn";
  return "stay-days-normal";
};

// 行样式：风险项目高亮
const rowClassName = ({ row }) => {
  if (row.processStatus && row.processStatus.includes("风险")) return "row-risk";
  return "";
};
</script>

<style lang="less" scoped>
@import "../../../assets/global.less";

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 10px;
  .dialog-title {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: #7f3a12;
    .title-icon {
      margin-right: 8px;
      font-size: 22px;
    }
    .project-count {
      margin-left: 12px;
      font-size: 13px;
      font-weight: 400;
      color: #a08570;
    }
  }
}

.overview-content {
  padding: 0 4px;
}

/* 统计卡片 */
.stat-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  .stat-card {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background-color: #fffcfa;
    border: 1px solid #ead9c8;
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(139, 69, 19, 0.06);
    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
    }
    .stat-info {
      .stat-value {
        font-size: 24px;
        font-weight: 700;
        line-height: 1.2;
      }
      .stat-label {
        font-size: 13px;
        color: #8d7565;
      }
    }
  }
}

/* 优先级标签 */
.priority-tag {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  .priority-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 5px;
    display: inline-block;
  }
}
.priority-high {
  color: #f56c6c;
  .priority-dot { background-color: #f56c6c; }
}
.priority-medium {
  color: #e6a23c;
  .priority-dot { background-color: #e6a23c; }
}
.priority-low {
  color: #67c23a;
  .priority-dot { background-color: #67c23a; }
}
.priority-none {
  color: #909399;
  .priority-dot { background-color: #c0c4cc; }
}

/* 进度条 */
.progress-box {
  padding: 0 4px;
}

/* 流程状态 */
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.status-risk {
  color: #f56c6c;
  background-color: #fde2e2;
}
.status-warn {
  color: #e6a23c;
  background-color: #faecd8;
}
.status-normal-bg {
  color: #67c23a;
  background-color: #e1f3d8;
}
.status-normal {
  color: #67c23a;
}

/* 逾期日期 */
.date-overdue {
  color: #f56c6c;
  font-weight: 600;
}

/* 阶段停留天数 */
.stay-days {
  font-weight: 500;
}
.stay-days-normal { color: #67c23a; }
.stay-days-warn { color: #e6a23c; }
.stay-days-danger { color: #f56c6c; font-weight: 600; }

.project-no {
  font-weight: 600;
  color: #7f3a12;
}
</style>

<style lang="less">
/* 风险行高亮（非 scoped 以覆盖 el-table） */
.overview-dialog .el-table .row-risk {
  background-color: #fef0f0 !important;
}
.overview-dialog .el-dialog__body {
  padding: 10px 16px;
}
</style>
