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
      <el-button @click="doSearch">搜索</el-button>
    </div>

    <!-- 新增：按截止日期筛选的下拉菜单 -->
    <el-dropdown @command="handleDropdownSelect" style="margin: 8px 0;">
      <span class="dropdown-trigger">
        <el-icon><ArrowDown /></el-icon>
        <span>按截止日期筛选</span>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="all">全部</el-dropdown-item>
          <el-dropdown-item
            v-for="(reports, endDate) in groupedReports"
            :key="endDate"
            :command="endDate"
          >
            {{ endDate }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-divider class="content-divider" />

    <!-- 周报列表，按endDate分组 -->
    <div v-if="Object.keys(groupedReports).length === 0" class="empty-state">
      <EmptyState text="暂无周报数据" />
    </div>
    <div class="scrollable-content" v-else>
      <!-- el-dropdown-mune-->


      <div
        v-for="(reports, endDate) in groupedReports"
        :key="endDate"
        class="report-group"
        :data-end-date="endDate"
      >
        <div class="group-header" @click="toggleGroup(endDate)">
          <div class="group-title">
            <el-icon style="color: #d47549; padding-right: 4px;" size="16" > <DataLine /> </el-icon> 截止日期：{{ endDate }}
          </div>
          <div class="group-count">
            共 {{ reports.length }} 条周报
            <el-icon :style="{ color: '#999', marginLeft: '4px' }" size="16">
              <ArrowDownBold v-if="expandedGroups[endDate]" />
              <ArrowUpBold v-else />
            </el-icon>
          </div>
        </div>

        <div v-show="expandedGroups[endDate]" class="card-container">
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
              <!-- <div class="report-author">
                提交人：{{ report.author || report.userId }}
              </div> -->
              <div class="report-summary">{{ report.content ? report.content.substring(0, 100) + '...' : '暂无内容' }}</div>
            </div>

            <template #footer>
              <div class="card-footer">
                <div class="report-author">
                  <img
                    v-if="userAvatarsMap[report.userId]"
                    :src="userAvatarsMap[report.userId]"
                    :alt="report.userId"
                    class="avatar-img"
                  />
                  <el-icon :style="{ color: '#999' }" size="14" v-else>
                    <UserFilled />
                  </el-icon>
                  <div class="author-text">
                    {{ report.author || report.userId }}
                  </div>
                </div>
              </div>
            </template>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import EmptyState from "@/public/components/EmptyState.vue";
import { queryReports, groupReportsByEndDate } from "@/utils/reportManagement/index.js";
import { ArrowUpBold } from "@element-plus/icons-vue";

const emit = defineEmits(['item-click']);

const searchQuery = ref('');
const weeklyReports = ref([]);
const loading = ref(false);

// 计算属性：根据endDate分组
const groupedReports = computed(() => {
  return groupReportsByEndDate(weeklyReports.value);
});

// 记录每个 endDate 是否展开
const expandedGroups = ref({});

// 切换某个 endDate 的展开状态
const toggleGroup = (endDate) => {
  expandedGroups.value[endDate] = !expandedGroups.value[endDate];
};

// 默认展开第一个，其余收起
watch(
  () => groupedReports.value,
  (newVal) => {
    if (Object.keys(newVal).length > 0 && Object.keys(expandedGroups.value).length === 0) {
      const firstEndDate = Object.keys(newVal)[0];
      expandedGroups.value[firstEndDate] = true;
    }
  },
  { immediate: true }
);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const handleDropdownSelect = (command) => {
  if (command === 'all') {
    // 展开所有分组
    Object.keys(groupedReports.value).forEach(endDate => {
      expandedGroups.value[endDate] = true;
    });
  } else {
    // 只展开指定 endDate，其余收起
    Object.keys(expandedGroups.value).forEach(key => {
      expandedGroups.value[key] = false;
    });
    expandedGroups.value[command] = true;

    // 定位到该分组
    const element = document.querySelector(`[data-end-date="${command}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
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

    // 搜索完成后，重置展开状态
    const keys = Object.keys(groupedReports.value);
    if (keys.length > 0) {
      expandedGroups.value = {};
      expandedGroups.value[keys[0]] = true; // 默认展开第一个
    }
  }
};

defineExpose({ initData });

const userAvatarsMap = ref({}); // 用户头像
onMounted(() => {
  initData();

  // 头像处理
  const avatars = localStorage.getItem('userAvatars');
  userAvatarsMap.value = avatars ? JSON.parse(avatars) : {};

});
</script>

<style lang="less" scoped>
.weekly-report-list {
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

  .empty-state {
    height: calc(100vh - 178px);
  }

  .scrollable-content {
    height: calc(100vh - 194px);
    overflow-y: auto;
    margin: 8px;

    .report-group {
      margin-bottom: 16px;
      border-bottom: 1px solid #e9e9e9;
      padding-bottom: 8px;

      .group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 8px;
        font-weight: bold;
        color: #333;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          transform: translateY(-2px);
          opacity: 0.9;
        }

        .group-title {
          display: flex;
          align-items: center;
          text-align: center;
        }
        .group-count {
          display: flex;
          align-items: center;
          text-align: center;
        }
      }
    }

    .report-card {
      --el-card-padding: 5px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        border-color: #dcdfe6;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1px 5px 0px 5px;

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
        // .report-author {
        //   font-size: 14px;
        //   color: #666;
        //   margin-bottom: 8px;
        // }

        .report-summary {
          min-height: 40px;
          font-size: 14px;
          color: #333;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }

      .card-footer {
        display: flex;
        justify-content: center;
        .report-author {
          display: flex;
          align-items: center;
          text-align: center;
          
          .avatar-img {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            object-fit: cover;
            border: 1px solid rgba(139, 69, 19, 0.3);
            background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
          }
          .author-text {
            font-size: 12px;
            color: #666;
            margin-left: 5px;
          }
        }
      }
    }
  }
}
</style>
