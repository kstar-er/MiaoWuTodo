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

    <el-divider class="content-divider" />

    <!-- 按截止日期筛选的下拉菜单 -->
    <el-dropdown @command="handleDropdownSelect" style="margin: 8px 0; cursor: pointer; transition: all 0.3ms ease;">
      <span class="dropdown-trigger">
        <el-icon><ArrowDown /></el-icon>
        <span>按截止日期定位</span>
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

    <!-- 周报列表，按endDate分组 -->
    <div v-if="Object.keys(groupedReports).length === 0" class="empty-state">
      <EmptyState text="暂无周报数据" />
    </div>
    <div class="scrollable-content" v-else>
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
                
                 <div class="navigate">
                  <el-tooltip content="查看具体报告" effect="dark">
                    <img src="/navigate.png"
                      class="img-btn"
                      alt="查看周报"
                      @click.stop="viewHtmlReport(report)"
                    />
                  </el-tooltip>
                </div>
              </div>
            </template>

            <div class="card-content">
              <div class="template-info">
                <div class="info-row">
                  <span class="label">报告类型：</span>
                  <el-tag :type="getReportTypeTagType(report.reportType)">{{ getReportTypeLabel(report.reportType) }}</el-tag>
                </div>

                <div class="info-row">
                  <span class="label">{{ report.reportType === 'group' ? '团队' : (report.reportType === 'project' ? '项目' : '个人') }}：</span>
                  <span>{{ report.reportType === 'group' ? report.groupName : (report.reportType === 'project' ? report.projectName : report.userName) }}</span>
                </div>

                <div class="info-row">
                  <span class="label">周期类型：</span>
                  <span>{{ getScheduleTypeLabel(report.scheduleType) }}</span>
                </div>
              </div>
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
                    {{ usernameMap[report.userId] || report.userId }}
                  </div>
                </div>
                <div class="report-date">
                  <span>{{ formatDate(report.startDate) }} 至 {{ formatDate(report.endDate) }}</span>
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
import { ref, onMounted, computed, watch, getCurrentInstance } from "vue";
import EmptyState from "@/public/components/EmptyState.vue";
import { queryReports, groupReportsByEndDate } from "@/utils/reportManagement/index.js";
import { ArrowUpBold } from "@element-plus/icons-vue";
import { openUrl } from '@tauri-apps/plugin-opener';
import { createWin } from "../../../multiwins/action";

const { proxy } = getCurrentInstance();

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
      expandedGroups.value[endDate] = false;
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

// 跳转到 report.html 并传递 content 数据
const viewHtmlReport = async (report) => {
  try {
    // 1. 解析 dataJson
    let data = JSON.parse(report.dataJson)

    let team = ''
    if (report.reportType === 'group') {
      team = report.groupName
    } else if(report.reportType === 'project') {
      team = report.projectName
    } else {
      team = report.userName
    }

    // 2. 构造完整数据
    const parseData = {
      title: report.title,
      reportStartDate: report.startDate,
      reportEndDate: report.endDate,
      generationTime: report.generationTime,
      teamName: team,
      ...data
    }

    // 3. 避免url过长，存入本地存储
    const jsonContent = JSON.stringify(parseData)
    const key = `weekly_report_${Date.now()}_${Math.random().toString(36)}`;
    localStorage.setItem(key, jsonContent);

    // 4. 获取模板路径并拼接完整 OSS 地址
    const templatePath = report.contentFormat;
    if (!templatePath) {
      proxy.$message.warning('该报告未指定模板');
      return;
    }

    // oss完整地址--直接访问html文件
    const ossHost = 'https://baiaidu.com';
    const fullUrl = `${ossHost}/${templatePath}`;

    // 方式一：新标签页打开
    // const url = `/report.html?key=${key}`;
    window.open(`/report.html?ossUrl=${encodeURIComponent(fullUrl)}&key=${key}`, '_blank');

    // 方式二: 用tauri的插件打开
    // await openUrl(`/report.html?ossUrl=${encodeURIComponent(fullUrl)}&key=${key}`);

    // 方式三: 用窗口打开--缺点: 这个只能打开一个周报窗口
    // const winLabel = 'report_preview';

    //  try {
    //   await closeWindow(winLabel);
    // } catch (e) {}

    // await createWin({
    //   label: winLabel, // 动态标签避免重复
    //   title: '周报预览',
    //   url: `/report.html?ossUrl=${encodeURIComponent(fullUrl)}&key=${key}`,
    //   width: 900,
    //   height: 700,
    //   resizable: true,
    //   center: true,
    //   decorations: true, // 显示标题栏以便关闭
    //   theme: 'Light',
    //   visible: true
    // });
  } catch (err) {
    console.error(err)
    proxy.$message.error('无法解析报告内容');
  }
};

// 辅助函数：格式化显示标签
const getReportTypeLabel = (type) => {
  const map = {
    'personal': '个人',
    'group': '团队',
    'project': '项目'
  };
  return map[type] || type || '-';
};

const getReportTypeTagType = (type) => {
  const tagMap = {
    'personal': 'primary',     // 蓝色
    'group': 'success',     // 绿色
    'project': 'warning'    // 橙色
  };
  return tagMap[type] || 'info';
};

const getScheduleTypeLabel = (type) => {
  const map = {
    'manual': '手动',
    'weekly': '每周',
    'monthly': '每月'
  };
  return map[type] || type || '-';
};

defineExpose({ initData });

const userAvatarsMap = ref({}); // 用户头像
const usernameMap = ref({}); // 用户名
onMounted(() => {
  initData();

  // 头像、用户名处理
  const avatars = localStorage.getItem('userAvatars');
  const usernames = localStorage.getItem('userIdUsernameMap')
  userAvatarsMap.value = avatars ? JSON.parse(avatars) : {};
  usernameMap.value = usernames ? JSON.parse(usernames) : {};
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
      cursor: default;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        border-color: #dcdfe6;
      }

      .card-header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1px 5px 0px 5px;

        .report-title {
          display: flex;
          justify-content: flex-start;
          width: 90%;
          font-weight: bold;
          color: #8b4513;
        }

        .navigate {
          width: 10%;
          padding-right: 5px;
          display: flex;
          align-items: center;
          .img-btn {
            width: 25px;
            height: 25px;
            cursor: pointer;
            padding: 3px;
            background-color: #ebe7e1;
            transition: all 0.3s ease;
          }
          .img-btn:hover {
            background-color: #e0e0ff;
            transform: scale(1.2) rotate(10deg);
            filter: hue-rotate(45deg) brightness(1.2);
          }
        }
      }

      .card-content {
        .template-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          
          .info-row {
            display: flex;
            font-size: 13px;
            
            .label {
              color: #8b4513;
              font-weight: 500;
              min-width: 70px;
              text-align: right;
            }
          }
        }
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
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
        .report-date {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }
}
</style>
