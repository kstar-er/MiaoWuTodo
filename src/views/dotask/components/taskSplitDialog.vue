<!-- 任务拆分结果弹窗 -->
<template>
  <el-dialog
    v-model="dialogVisible"
    title="任务拆分结果"
    width="70%"
    :close-on-click-modal="false"
    :append-to-body="true"
    class="task-split-dialog"
    @close="handleClose"
  >
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" size="24"><Loading /></el-icon>
      <span class="loading-text">正在分析任务内容...</span>
    </div>

    <!-- 分析结果 -->
    <div v-else-if="splitResult">
      <!-- 不可拆分 -->
      <div v-if="!splitResult.canSplit" class="no-split-container">
        <el-icon class="warning-icon" size="48"><WarningFilled /></el-icon>
        <h3>该任务暂时无法拆分</h3>
        <p class="reason-text">{{ splitResult.reason || '任务内容不符合拆分条件' }}</p>
        <el-alert
          title="拆分建议"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>为了更好地拆分任务，建议您：</p>
            <ul>
              <li>使用数字标题格式（如：1. 第一步、2. 第二步）</li>
              <li>将复杂任务分解为具体的执行步骤</li>
              <li>确保每个步骤都有明确的描述</li>
            </ul>
          </template>
        </el-alert>
      </div>

      <!-- 可拆分 -->
      <div v-else class="split-result-container">
        <div class="result-header">
          <el-icon class="success-icon" size="24"><SuccessFilled /></el-icon>
          <span class="result-title">
            检测到可拆分任务（{{ splitTypeText }}）
          </span>
        </div>

        <div class="subtasks-preview">
          <h4>预览子任务列表：</h4>
          <div class="subtasks-list">
            <div
              v-for="(subtask, index) in editableSubtasks"
              :key="index"
              class="subtask-item"
            >
              <div class="subtask-header">
                <el-icon class="subtask-icon"><Document /></el-icon>
                <span class="subtask-order">子任务 {{ subtask.order }}</span>
                <el-button
                  type="danger"
                  size="small"
                  :icon="Delete"
                  circle
                  class="delete-subtask-btn"
                  @click="removeSubtask(index)"
                  title="删除子任务"
                />
              </div>
              <div class="subtask-content">
                <el-input
                  v-model="subtask.title"
                  placeholder="请输入子任务标题"
                  class="subtask-title-input"
                  maxlength="100"
                  show-word-limit
                />
                <el-input
                  v-model="subtask.content"
                  type="textarea"
                  placeholder="请输入子任务描述（可选）"
                  class="subtask-content-input"
                  :rows="3"
                  maxlength="500"
                  show-word-limit
                />
              </div>
            </div>
          </div>
          
          <!-- 添加子任务按钮 -->
          <div class="add-subtask-container">
            <el-button
              type="primary"
              :icon="Plus"
              @click="addSubtask"
              class="add-subtask-btn"
            >
              添加子任务
            </el-button>
          </div>
        </div>

        <el-alert
          title="确认提示"
          type="warning"
          :closable="false"
          show-icon
        >
          确认拆分后，将会创建 {{ editableSubtasks.length }} 个子任务，并与当前任务建立关联关系。
        </el-alert>
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">
          取消
        </el-button>
        <el-button
          v-if="splitResult && splitResult.canSplit && editableSubtasks.length > 0"
          type="primary"
          @click="handleConfirm"
          :loading="confirming"
        >
          {{ confirming ? '创建中...' : '确认拆分' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Loading, WarningFilled, SuccessFilled, Document, Delete, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  splitResult: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'confirm', 'close']);

const dialogVisible = ref(false);
const confirming = ref(false);
const editableSubtasks = ref([]);

// 拆分类型文本
const splitTypeText = computed(() => {
  if (!props.splitResult) return '';
  switch (props.splitResult.splitType) {
    case 'RULE_BASED':
      return '规则拆分';
    case 'AI_BASED':
      return 'AI智能拆分';
    default:
      return '自动拆分';
  }
});

// 监听visible变化
watch(() => props.visible, (newVal) => {
  console.log('splitDialog visible changed:', newVal);
  dialogVisible.value = newVal;
});

watch(() => props.splitResult, (newVal) => {
  console.log('splitResult changed:', newVal);
  if (newVal && newVal.subtasks) {
    // 深拷贝子任务数据，使其可编辑
    editableSubtasks.value = JSON.parse(JSON.stringify(newVal.subtasks));
  } else {
    editableSubtasks.value = [];
  }
}, { deep: true });

watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal);
});

// 处理关闭
const handleClose = () => {
  dialogVisible.value = false;
  confirming.value = false;
  editableSubtasks.value = [];
  emit('close');
};

// 添加子任务
const addSubtask = () => {
  const newOrder = editableSubtasks.value.length + 1;
  editableSubtasks.value.push({
    title: '',
    content: '',
    order: newOrder
  });
};

// 删除子任务
const removeSubtask = (index) => {
  editableSubtasks.value.splice(index, 1);
  // 重新排序
  editableSubtasks.value.forEach((subtask, idx) => {
    subtask.order = idx + 1;
  });
};

// 处理确认拆分
const handleConfirm = async () => {
  if (!props.splitResult || !props.splitResult.canSplit) return;
  
  // 验证子任务数据
  const validSubtasks = editableSubtasks.value.filter(subtask => 
    subtask.title && subtask.title.trim()
  );
  
  if (validSubtasks.length === 0) {
    ElMessage.warning('请至少添加一个有效的子任务标题');
    return;
  }
  
  confirming.value = true;
  try {
    // 发送编辑后的子任务数据
    const splitData = {
      ...props.splitResult,
      subtasks: validSubtasks
    };
    await emit('confirm', splitData);
  } finally {
    confirming.value = false;
  }
};
</script>

<style lang="less" scoped>
.task-split-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }
  
  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px 12px 0 0;
    padding: 20px 24px;
  }
  
  :deep(.el-dialog__title) {
    color: white;
    font-weight: 600;
    font-size: 18px;
  }
  
  :deep(.el-dialog__body) {
    padding: 24px;
    background: #fafafa;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  
  .loading-text {
    margin-top: 16px;
    color: #666;
    font-size: 16px;
  }
}

.no-split-container {
  text-align: center;
  padding: 20px;
  
  .warning-icon {
    color: #f56c6c;
    margin-bottom: 16px;
  }
  
  h3 {
    color: #333;
    margin-bottom: 12px;
    font-size: 20px;
  }
  
  .reason-text {
    color: #666;
    margin-bottom: 24px;
    font-size: 14px;
  }
  
  :deep(.el-alert) {
    text-align: left;
    
    ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
      
      li {
        margin-bottom: 4px;
        color: #666;
      }
    }
  }
}

.split-result-container {
  .result-header {
    display: flex;
    align-items: center;
    margin-bottom: 24px;
    padding: 16px;
    background: linear-gradient(135deg, #e8f5e8 0%, #f0f9ff 100%);
    border-radius: 8px;
    border-left: 4px solid #67c23a;
    
    .success-icon {
      color: #67c23a;
      margin-right: 12px;
    }
    
    .result-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
  }
  
  .subtasks-preview {
    margin-bottom: 24px;
    
    h4 {
      color: #333;
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 600;
    }
    
    .subtasks-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .subtask-item {
      background: white;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
      }
      
      .subtask-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        
        .subtask-icon {
          color: #409eff;
          margin-right: 8px;
        }
        
        .subtask-order {
          font-size: 14px;
          color: #666;
          font-weight: 500;
          flex: 1;
        }
        
        .delete-subtask-btn {
          width: 24px;
          height: 24px;
          min-width: 24px;
          padding: 0;
          margin-left: 8px;
        }
      }
      
      .subtask-content {
        .subtask-title-input {
          margin-bottom: 12px;
          
          :deep(.el-input__inner) {
            font-weight: 600;
            font-size: 16px;
          }
        }
        
        .subtask-content-input {
          :deep(.el-textarea__inner) {
            font-size: 14px;
            line-height: 1.5;
          }
        }
      }
    }
  }
  
  .add-subtask-container {
    margin-top: 16px;
    text-align: center;
    
    .add-subtask-btn {
      border-style: dashed;
      background: #fafafa;
      border-color: #d9d9d9;
      color: #666;
      
      &:hover {
        border-color: #409eff;
        color: #409eff;
        background: #f0f9ff;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0 0 0;
  border-top: 1px solid #e4e7ed;
}
</style>