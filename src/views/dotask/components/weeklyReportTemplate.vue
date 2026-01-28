<template>
  <div class="weekly-report-template">
    <!-- 搜索和操作栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索周报标题或内容"
        clearable
        @clear="onClearSearch"
        @keyup.enter="doSearch"
      />
      <el-button type="primary" @click="doSearch">搜索</el-button>
      <!-- <el-button type="success" @click="handleAddTemplate">新增模板</el-button> -->
    </div>
    <el-divider class="content-divider" />

    <!-- 模板列表 -->
    <div v-if="templates.length === 0" class="empty-state">
      <EmptyState text="暂无周报模板" />
    </div>
    <div class="template-list" v-else>
      <el-card
        v-for="template in templates"
        :key="template.id"
        class="template-card"
        @click="handleItemClick(template)"
      >
        <template #header>
          <div class="card-header">
            <span class="template-name">{{ template.templateType || '未命名模板' }}</span>
            <el-tag :type="template.enabled ? 'success' : 'info'" size="small">
              {{ template.enabled ? '启用' : '禁用' }}
            </el-tag>
          </div>
        </template>
        <div class="card-content">
          <div class="template-info">
            <div class="info-row">
              <span class="label">报告类型：</span>
              <el-tag :type="getReportTypeTagType(template.reportType)">{{ getReportTypeLabel(template.reportType) }}</el-tag>
            </div>
            <div class="info-row">
              <span class="label">模板格式：</span>
              <span>{{ getTemplateFormatLabel(template.templateFormat) }}</span>
            </div>
            <div class="info-row">
              <span class="label">周期类型：</span>
              <span>{{ getScheduleTypeLabel(template.scheduleType) }}</span>
            </div>
            <div class="info-row" v-if="template.scheduleType !== 'manual'">
              <span class="label">生成日：</span>
              <span v-if="template.scheduleType === 'monthly'">{{ getWeeklyLabel(template.generateDay) }}</span>
              <span v-else>{{ template.generateDay }}号</span>
            </div>
          </div>

          <div class="footer-actions">
            <el-tooltip :content="template.isGenerating ? '报告正在生成...请勿重复多次点击' : '根据该报告配置快速生成周报/月报'" effect="dark">
              <img src="/generate.png"
                class="img-btn"
                alt="生成周报"
                style="width: 18px; height: 18px;"
                :class="{ 'is-disabled': template.isGenerating }"
                @click.stop="!template.isGenerating && handleGenerateReport(template)"
              />
            </el-tooltip>
          </div>
          <div class="template-meta">
            <div class="footer-time">
              <span>创建时间：{{ formatDate(template.createTime) }}</span>
              <span>更新时间：{{ formatDate(template.updateTime) }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, getCurrentInstance } from "vue";
import EmptyState from "../../../public/components/EmptyState.vue";
import { getReportConfigs, saveReportConfig, createReportQuickly } from "@/utils/reportManagement/index.js";
import { getGroupList } from "../../../utils/groupManagement";

const { proxy } = getCurrentInstance()

const emit = defineEmits(['item-click']);

const searchQuery = ref('');
const templates = ref([]);
const loading = ref(false);

const doSearch = async () => {
  await initData();
};

const onClearSearch = async () => {
  searchQuery.value = '';
  await initData();
};

const handleAddTemplate = () => {
  // 打开新增模板的抽屉，传递一个空模板对象，表示新增
  const newTemplate = {
    id: null,
    type: 'template', // 标识为模板类型
    templateType: '',
    reportType: 'weekly',
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
    userId: null,
    groupId: null
  };
  emit('item-click', newTemplate);
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

// 标签颜色
const getReportTypeTagType = (type) => {
  const tagMap = {
    'personal': 'primary',     // 蓝色
    'group': 'success',     // 绿色
    'project': 'warning'    // 橙色
  };
  return tagMap[type] || 'info';
};

const getTemplateFormatLabel = (format) => {
  const map = {
    'markdown': 'Markdown',
    'html': 'HTML',
    'text': '纯文本'
  };
  return map[format] || format || '-';
};

const getLanguageLabel = (lang) => {
  const map = {
    'zh-CN': '中文',
    'en-US': '英文'
  };
  return map[lang] || lang || '-';
};

const getScheduleTypeLabel = (type) => {
  const map = {
    'manual': '手动',
    'weekly': '每周',
    'monthly': '每月'
  };
  return map[type] || type || '-';
};

const getWeeklyLabel = (val) => {
  const map = {
    1: '周一',
    2: '周二',
    3: '周三',
    4: '周四',
    5: '周五',
    6: '周六',
    7: '周日'
  };
  return map[val] || val || '-';
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  } catch (e) {
    return dateStr;
  }
};

const handleItemClick = (template) => {
  // 确保传递的数据包含 type 标识
  const templateData = {
    ...template,
    type: 'template'
  };
  emit('item-click', templateData);
};

/**
 * 根据点击的周报配置，快速生成一个周报
 * 涉及ai生成内容，禁止10s内重复点击
 * 加入 防抖+10s冷却
 * @param template 周报配置
 */
const handleGenerateReport = async (template) => {
  // 设置当前模板的生成状态
  template.isGenerating = true;

  try {
    const res = await createReportQuickly(template.id);
    if (res.code === 200) {
      proxy.$message.success(`生成报告: ${res.data.title} 成功!`);
    } else {
      proxy.$message.error('生成失败，请稍后重试');
    }
  } catch (error) {
    proxy.$message.error('生成过程中发生错误');
  } finally {
    // 10秒后恢复该按钮的可点击状态
    setTimeout(() => {
      template.isGenerating = false;
    }, 10000);
  }
};

const initData = async () => {
  loading.value = true;
  try {
    const response = await getReportConfigs();
    if (response.data.code === 200) {
      let configs = response.data.data || [];
      // 如果有搜索关键词，进行前端过滤
      if (searchQuery.value.trim()) {
        configs = configs.filter(config =>
          (config.templateType && config.templateType.includes(searchQuery.value)) ||
          (config.reportType && config.reportType.includes(searchQuery.value))
        );
      }
      templates.value = configs.map(config => ({
        ...config,
        isGenerating: false // 显示添加响应式字段
      }));
    } else {
      console.error('获取周报配置列表失败:', response.data.msg);
      templates.value = [];
    }
  } catch (error) {
    console.error('获取周报配置列表异常:', error);
    templates.value = [];
  } finally {
    loading.value = false;
  }
};


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

defineExpose({ initData });

onMounted(() => {
  initData();
});
</script>

<style lang="less" scoped>
.weekly-report-template {
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

  .template-list {
    height: calc(100vh - 194px);
    overflow-y: auto;
    padding: 8px;

    .template-card {
      --el-card-padding: 5px;
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
        padding: 5px 5px 0px 5px;

        .template-name {
          font-weight: bold;
          color: #8b4513;
          font-size: 16px;
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

        .footer-actions {
            display: flex;
            justify-content: flex-end;
            padding: 2px;
            .img-btn {
              cursor: pointer;
              padding: 5px;
              background-color: #ebe7e1;
              transition: all 0.3s ease;
              &:hover:not(.is-disabled) {
                background-color: #e0e0ff;
                transform: scale(1.3) rotate(10deg);
                filter: hue-rotate(45deg) brightness(1.2);
              }
            }

            .img-btn.is-disabled {
              cursor: not-allowed;
              opacity: 0.6;
              transform: scale(1) rotate(0deg);
              filter: none;
              background-color: #e0e0e0;
            }
          }

        .template-meta {
          padding-top: 8px;
          border-top: 1px solid #f0f0f0;
          .footer-time {
            font-size: 12px;
            color: #999;
            display: flex;
            justify-content: space-between;
          }
        }
      }
    }
  }
}
</style>
