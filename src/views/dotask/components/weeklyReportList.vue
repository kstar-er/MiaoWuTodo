<template>
  <div class="weekly-report-list">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索周报标题或内容"
        clearable
        @clear="onClearSearch"
        @keyup.enter="doSearch"
      />
      <el-button type="primary" @click="doSearch">搜索</el-button>
    </div>

    <!-- 周报列表，按endDate分组 -->
    <div class="report-list scrollable-content">
      <div v-if="Object.keys(groupedReports).length === 0" class="empty-state">
        <EmptyState text="暂无周报数据" />
      </div>
      <div v-else>
        <div v-for="(reports, endDate) in groupedReports" :key="endDate" class="report-group">
          <div class="group-header">
            <span class="group-title">截止日期：{{ endDate }}</span>
            <span class="group-count">共 {{ reports.length }} 条周报</span>
          </div>
          <el-card
            v-for="report in reports"
            :key="report.id"
            class="report-card"
            @click="handleItemClick(report)"
          >
            <template #header>
              <div class="card-header">
                <span class="report-title">{{ report.title }}</span>
                <span class="report-date">{{ formatDate(report.startDate) }} 至 {{ formatDate(report.endDate) }}</span>
              </div>
            </template>
            <div class="card-content">
              <div class="report-author">提交人：{{ report.author || report.userId }}</div>
              <div class="report-summary">{{ report.content ? report.content.substring(0, 100) + '...' : '暂无内容' }}</div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import EmptyState from "@/public/components/EmptyState.vue";
import { queryReports, groupReportsByEndDate } from "@/utils/reportManagement/index.js";

const emit = defineEmits(['item-click']);

const searchQuery = ref('');
const weeklyReports = ref([]);
const loading = ref(false);

// 计算属性：根据endDate分组
const groupedReports = computed(() => {
  return groupReportsByEndDate(weeklyReports.value);
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const doSearch = async () => {
  await initData();
};

const onClearSearch = async () => {
  searchQuery.value = '';
  await initData();
};

const handleItemClick = (report) => {
  emit('item-click', report);
};

const initData = async () => {
  loading.value = true;
  try {
    // 构建查询参数
    const queryParams = {};
    if (searchQuery.value.trim()) {
      // 这里可以扩展为多个字段的搜索，例如标题和内容
      // 由于后端接口可能不支持，这里暂时只做前端过滤
    }
    const response = await queryReports(queryParams);
    if (response.data.code === 200) {
      weeklyReports.value = response.data.data || [];
      // 如果有搜索关键词，进行前端过滤
      if (searchQuery.value.trim()) {
        weeklyReports.value = weeklyReports.value.filter(report =>
          (report.title && report.title.includes(searchQuery.value)) ||
          (report.content && report.content.includes(searchQuery.value))
        );
      }
    } else {
      console.error('查询周报列表失败:', response.data.msg);
      weeklyReports.value = [];
    }
  } catch (error) {
    console.error('查询周报列表异常:', error);
    weeklyReports.value = [];
  } finally {
    loading.value = false;
  }
};

defineExpose({ initData });

onMounted(() => {
  initData();
});
</script>

<style lang="less" scoped>
.weekly-report-list {
  .search-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    .el-input {
      flex: 1;
    }
  }

  .report-list {
    max-height: calc(100vh - 200px);
    overflow-y: auto;

    .report-card {
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(139, 69, 19, 0.1);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .report-title {
          font-weight: bold;
          color: #8b4513;
        }

        .report-date {
          font-size: 12px;
          color: #999;
        }
      }

      .card-content {
        .report-author {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .report-summary {
          font-size: 14px;
          color: #333;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }
    }
  }
}
</style>
