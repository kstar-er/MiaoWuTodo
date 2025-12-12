<template>
  <div class="weekly-report-template">
    <!-- 搜索和操作栏 -->
    <div class="action-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索模板名称"
        clearable
        @clear="onClearSearch"
        @keyup.enter="doSearch"
        style="width: 200px; margin-right: 10px;"
      />
      <el-button type="primary" @click="doSearch">搜索</el-button>
      <el-button type="success" @click="handleAddTemplate">新增模板</el-button>
    </div>

    <!-- 模板列表 -->
    <div class="template-list scrollable-content">
      <div v-if="templates.length === 0" class="empty-state">
        <EmptyState text="暂无周报模板" />
      </div>
      <div v-else>
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
                <span>{{ getReportTypeLabel(template.reportType) }}</span>
              </div>
              <div class="info-row">
                <span class="label">模板格式：</span>
                <span>{{ getTemplateFormatLabel(template.templateFormat) }}</span>
              </div>
              <div class="info-row">
                <span class="label">语言：</span>
                <span>{{ getLanguageLabel(template.language) }}</span>
              </div>
              <div class="info-row">
                <span class="label">调度类型：</span>
                <span>{{ getScheduleTypeLabel(template.scheduleType) }}</span>
              </div>
            </div>
            <div class="template-meta">
              <span>创建时间：{{ formatDate(template.createTime) }}</span>
              <span>更新时间：{{ formatDate(template.updateTime) }}</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>

</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import EmptyState from "../../../public/components/EmptyState.vue";
import { getReportConfigs, saveReportConfig } from "@/utils/reportManagement/index.js";

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
    'weekly': '周报',
    'monthly': '月报',
    'quarterly': '季报'
  };
  return map[type] || type || '-';
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
      templates.value = configs;
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

defineExpose({ initData });

onMounted(() => {
  initData();
});
</script>

<style lang="less" scoped>
.weekly-report-template {
  .action-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    align-items: center;
  }

  .template-list {
    max-height: calc(100vh - 200px);
    overflow-y: auto;

    .template-card {
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

        .template-name {
          font-weight: bold;
          color: #8b4513;
          font-size: 16px;
        }
      }

      .card-content {
        .template-info {
          margin-bottom: 10px;
          
          .info-row {
            display: flex;
            margin-bottom: 5px;
            font-size: 13px;
            
            .label {
              color: #8b4513;
              font-weight: 500;
              min-width: 70px;
            }
          }
        }

        .template-meta {
          font-size: 12px;
          color: #999;
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #f0f0f0;
          padding-top: 8px;
        }
      }
    }
  }
}
</style>
