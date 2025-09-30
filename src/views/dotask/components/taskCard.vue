<template>
  <!-- task.parentId为0，即为主任务，可直接用这个字段判断 -->
  <el-card
    class="task_card"
    :model-value="task.id"
    shadow="hover"
    :style="task.parentId !== 0 ? `background: ${task.isFinished === 0 ? '' : '#fbf2c450'}` : ''"
  >
    <ProgressBackground
      v-if="task.parentId === 0"
      :start-time="task?.createTime || task?.startTime || null"
      :end-time="task?.deadline || null"
      :current-time="progressCurrentTime"
      :is-final-stage="task.isFinalSchedule"
    />

    <!-- 顶部左侧优先级旗帜（子任务不显示） -->
    <div v-if="task.parentId === 0" class="priority-flag" :data-priority="task?.priority || 'P1'"></div>

    <!-- 卡片中间内容 -->
    <div class="card-body">
      <div class="card-body-main" @click="handleClick">
        <div class="card-body-left-actions" v-if="task.parentId === 0">
          <el-tooltip placement="top" :show-after="200" effect="dark">
            <template #content>新增子任务</template>
            <el-button
              class="card-add-sub-but"
              circle
              size="small"
              @click.stop="onStartAddSubtask"
            >
              <el-icon><Plus /></el-icon>
            </el-button>
          </el-tooltip>

          <!-- 任务负责人头像 -->
          <div class="task-executors" v-if="taskExecutorLength > 0 && !isAddingSubtask">
            <div
              v-for="(executor, index) in displayExecutors"
              :key="index" 
              class="executor-avatar"
              :class="{ 'more-count': index === displayExecutors.length - 1 && hasMoreExecutors, 'me-glow': isMe(executor) }"
            >
              <img
                v-if="userAvatarsMap[executor]"
                :src="userAvatarsMap[executor]"
                :alt="executor"
                class="avatar-img"
              />
              <div v-else class="avatar-initials">{{ getAvatarInitials(executor) }}</div>
            </div>
            <div v-if="hasMoreExecutors" class="more-executors">+{{ moreCount }}</div>
          </div>
        </div>
        <div class="card-body-content-wrapper">
          <slot name="card-body-content">
            <el-tooltip
              :disabled="!isContentOverflow"
              placement="top"
              :show-after="100"
              effect="dark"
            >
              <template #content> 
                <div class="card-body-tooltip"> 
                  {{ task.taskDetail }} 
                </div> 
              </template>
              <div class="card-body-content" ref="contentRef">
                {{ task.taskDetail }}
              </div>
            </el-tooltip>
          </slot>
        </div>
        
        <div class="card-body-actions">
          <!-- 主任务点击next -->
          <div v-if="task.parentId === 0 && !task.isFinalSchedule">
            <el-tooltip v-if="isShowHint">
              <template #content>点击即可将任务流程更新到下一任务流程</template>
              <el-button
                :class="nextStepBtnClass"
                @click.stop="onNextStep"
                circle
                size="small"
              >
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </el-tooltip>
            <el-button
              v-else
              :class="nextStepBtnClass"
              @click.stop="onNextStep"
              circle
              size="small"
            >
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>

          <!-- 子任务checkbox -->
          <div v-if="task.parentId !== 0 && !task.isFinalSchedule">
            <el-checkbox 
              v-model="task.isFinished"
              :true-value="1"
              :false-value="0"
              @click.stop
              @change="handleChangeSubTask"
              border
              size="small"
            />
          </div>
        </div>
      </div>

      <!-- 子任务输入区域 -->
      <div v-if="isAddingSubtask" class="subtask-input-row">
        <div class="connector"></div>
        <div class="subtask-input-container">
          <el-input
            v-model="newSubtaskText"
            placeholder="请输入子任务内容并回车确认"
            size="small"
            @keyup.enter="onConfirmAddSubtask"
            clearable
          />
          <div class="subtask-input-actions">
            <el-tooltip content="确定" placement="top" :show-after="200">
              <el-button circle size="small" type="success" @click.stop="onConfirmAddSubtask" class="icon-action">
                <el-icon><Check /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="取消" placement="top" :show-after="200">
              <el-button circle size="small" type="danger" @click.stop="onCancelAddSubtask" class="icon-action">
                <el-icon><Close /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
  </el-card>


  <!-- 子任务列表 -->
  <div v-if="subtasks.length" class="subtasks">
    <div v-for="child in subtasks" :key="child.id" class="subtask-wrapper">
      <div class="connector"></div>
      <div class="subtask-container">
        <TaskCard
          :task="child"
          :imageList="imageList"
          :showDeleteButton="false"
          :showExecutorTags="false"
          :showProjectName="false"
          :is-hint="isHint"
          @nextStep="emit('nextStep', $event)"
          @click="handleSubTaskClick(child)"
          @subTaskFinished="handleChangeSubTask(child)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted, watch, reactive, computed } from 'vue';
import { getTagColor } from '../../../utils';
import { ArrowRight, Plus, Check, Close } from '@element-plus/icons-vue';
import ProgressBackground from './ProgressBackground.vue';
import { formatToLocalTime } from '../../../utils/index';

// Recursive self-reference by name
defineOptions({ name: 'TaskCard' });
const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
  taskList: {
    type: Array,
    required: false,
    default: () => []
  },
  imageList: {
    type: Object,
    required: true,
  },
  showDeleteButton: {
    type: Boolean,
    default: true,
  },
  showExecutorTags: {
    type: Boolean,
    default: true,
  },
  showProjectName: {
    type: Boolean,
    default: false,
  },
  showRemark: {
    type: Boolean,
    default: true,
  },
  previewButtonClass: {
    type: String,
    default: 'btn-base btn-primary'
  },
  nextStepBtnClass: {
    type: String,
    default: 'card-next-but'
  },
  isHint: {
    type: Boolean,
    default: true
  },
  currentTime: {
    type: [String, Number, Date],
    default: null
  }
});

// 接收来自上层的刷新时间（用于驱动进度条重算）
const progressCurrentTime = computed(() => props.currentTime ? new Date(props.currentTime) : new Date());

const isShowHint = ref(props.isHint)

// 任务负责人数据处理
const taskExecutors = computed(() => {
  return props.task.userIdList;
});

const taskExecutorLength = computed(() => {
  return taskExecutors.value?.length || 0;
});

// 当前登录用户名
const currentUsername = computed(() => {
  try {
    const info = JSON.parse(sessionStorage.getItem('userInfo'));
    return info?.user?.nickname || null;
  } catch (e) {
    return null;
  }
});

// 将当前用户置顶
const sortedExecutors = computed(() => {
  const list = Array.isArray(taskExecutors.value) ? [...taskExecutors.value] : [];
  if (!currentUsername.value || list.length === 0) return list;
  let idx = -1;
  list.findIndex((e, index) => {
    if (e && e === currentUsername.value) {
      idx = index;
      return;
    }
  });
  if (idx > 0) {
    const [me] = list.splice(idx, 1);
    list.unshift(me);
  }
  return list;
});

// 显示的执行者（最多显示1个）
const displayExecutors = computed(() => {
  //console.log("sort", sortedExecutors.value)
  return sortedExecutors.value.slice(0, 1);
});

// 是否有更多执行者
const hasMoreExecutors = computed(() => {
  return (sortedExecutors.value?.length || 0) > 1;
});

// 更多执行者数量
const moreCount = computed(() => {
  return Math.max(0, (sortedExecutors.value?.length || 0) - 1);
});

// 是否是当前用户
const isMe = (executor) => {
  if (!executor || !currentUsername.value) return false;

  // 归一化函数：支持字符串/数字/对象字段，去零宽字符、去空格、统一大小写
  const normalize = (val) => {
    if (val === null || val === undefined) return '';
    return String(val)
      .normalize('NFC')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim()
      .toLowerCase();
  };

  // 提取执行者名称，兼容多字段与直接字符串
  const execNameRaw = typeof executor === 'string'
    ? executor
    : '';

  const meNameRaw = currentUsername.value;

  return normalize(execNameRaw) === normalize(meNameRaw);
};

// 生成头像首字母
const userIdUsernameMap = ref({});
const getAvatarInitials = (nickname) => {
  // 若该用户id没有头像，则对应映射到ta的nickName
  userIdUsernameMap.value = JSON.parse(localStorage.getItem('userIdUsernameMap'));
  
  if (!nickname) return '?';
  
  const name = userIdUsernameMap.value[nickname];
  if (!name) return '?';
  
  // 检查是否包含中文字符
  const chineseMatch = name.match(/[\u4e00-\u9fff]/);
  if (chineseMatch) {
    return chineseMatch[0]; // 返回第一个中文字符
  }
  
  // 检查是否包含英文字符
  const englishMatch = name.match(/[a-zA-Z]/);
  if (englishMatch) {
    return englishMatch[0].toUpperCase(); // 返回第一个英文字母（大写）
  }
  
  // 检查是否包含数字
  const numberMatch = name.match(/\d/);
  if (numberMatch) {
    // 如果是数字，取后四位
    const numbers = name.match(/\d/g);
    if (numbers && numbers.length > 0) {
      const lastFour = numbers.slice(-4).join('');
      return lastFour;
    }
  }
  
  return name.charAt(0).toUpperCase(); // 默认返回第一个字符
};

// 对父组件暴露的事件
const emit = defineEmits(["delete", "previewImage", "nextStep", "click", "addSubtask", "subTaskClick", "subTaskFinished"]);

// 删除任务
const onDelete = () => emit("delete", props.task.id);

// 预览图片
const onPreviewImage = () => emit("previewImage", props.task);

// 更新任务流程
const onNextStep = () => emit("nextStep", props.task);

// 更新子任务是否完成
const handleChangeSubTask = (val) => {
  emit("subTaskFinished", val)
};

// 打开任务详情--新增、编辑
const handleClick = () => {
  emit("click", props.task)
};

// 打开子任务详情--新增、编辑
const handleSubTaskClick = (subtask) => {
  emit("subTaskClick", subtask);
}

/**
 * 设置不同负责人的标签颜色
 */
 const getTagColorWrapper = (index) => {
  return getTagColor(index);
}

const contentRef = ref(null);
const isContentOverflow = ref(false);
const resizeObserver = ref(null);
// 检查内容是否溢出
const checkContentOverflow = () => {
  if (!contentRef.value) return;
  if (contentRef.value) {
    const el = contentRef.value;
    isContentOverflow.value = el.scrollWidth > el.clientWidth; // 单行溢出判断
  }
};

// 在组件挂载后检查内容宽度并监听变化
const userAvatarsMap = ref({}); // 用户头像
onMounted(() => {

  // 头像处理
  const avatars = localStorage.getItem('userAvatars');
  userAvatarsMap.value = avatars ? JSON.parse(avatars) : {};

  nextTick(() => {
    checkContentOverflow();
  });

  window.addEventListener('resize', checkContentOverflow);
  if (contentRef.value && window.ResizeObserver) {
    resizeObserver.value = new ResizeObserver(() => checkContentOverflow());
    resizeObserver.value.observe(contentRef.value);
  }
});

watch(() => props.task.taskDetail, () => {
  nextTick(() => checkContentOverflow());
});

onUnmounted(() => {
  window.removeEventListener('resize', checkContentOverflow);
  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
    resizeObserver.value = null;
  }
});

// const updateCardContent = (updatedTask) => {
//   // 更新卡片中的任务数据
//   Object.assign(props.task, updatedTask);
// };

// defineExpose({
//   updateCardContent
// });


// 子任务本地状态（临时，具体落库逻辑应交由父组件处理）
const isAddingSubtask = ref(false);
const newSubtaskText = ref('');
const subtasks = ref(props.task.children || []);

watch(() => props.task.children, (val) => {
  subtasks.value = val || [];
}, { immediate: true, deep: true });

const onStartAddSubtask = () => {
  isAddingSubtask.value = true;
  newSubtaskText.value = '';
};

const onCancelAddSubtask = () => {
  isAddingSubtask.value = false;
  newSubtaskText.value = '';
};

const onConfirmAddSubtask = () => {
  const text = newSubtaskText.value?.trim();
  if (!text) return;

  // 子任务，只有 任务明细、备注、图片重置
  const child = {
    ...props.task,
    projectId: props.task.projectId,
    parentId: props.task.id,
    taskDetail: text,
    deadline: props.task.deadline? formatToLocalTime(props.task.deadline) : null,
    taskName: text.slice(0, 6),
    priority: props.task.priority || 'P1',
    caption: '',
    remark: '',
    children: []
  };

  delete child.id; // 新增子任务不携带id
  delete child.createBy;
  delete child.createTime;
  delete child.updateBy;
  delete child.updateTime;

  // 先本地加入，随后交由外部落库
  subtasks.value = [...subtasks.value, child];
  emit('addSubtask', child);
  isAddingSubtask.value = false;
  newSubtaskText.value = '';
};


</script>

<style lang="less" scoped>
@import "../../../assets/global.less"; // 复用按钮样式

@keyframes hover-effect { // 删除按钮动画
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.task_card {
  // max-height: 158px;
  --el-card-padding: 5px;
  --el-card-border-color: #d9bfb8;
  border-radius: 10px;
  background-color: var(--card-background, #faf0ea);
  position: relative;
  .card-header {
    cursor: default;
    display: flex;
    justify-content: space-between;
    padding: 1px 5px 0px 10px;
    font-size: 13px;
    color: #80695b;

    .card-header-right {
      display: flex;
      .hover-animation:hover {
        animation: hover-effect 0.4s ease-in-out forwards;
      }
    }
  }
  .card-body {
    cursor: default;
    // max-height: 85px;
    display: grid;
    padding: 0px 3px;
    .card-body-main {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      min-height: 34px;
    }
    .card-body-left-actions {
      width: auto;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      flex-shrink: 0;
      gap: 6px;
    }
    .card-add-sub-but {
      width: 26px;
      height: 26px;
      background-color: #8b4513;
      color: #fff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    .card-add-sub-but .el-icon { font-size: 14px; }

    /* 任务负责人头像区域 */
    .task-executors {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 2px;
      position: absolute;
      left: 35px;
      bottom: 2px;
      z-index: 3;
    }
    .executor-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      overflow: hidden;
      border: 1px solid rgba(139, 69, 19, 0.3);
      background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    /* 当前用户头像高亮光晕效果 */
    @keyframes halo-pulse {
      0% { box-shadow: 0 0 0 2px rgba(64,158,255,0.9), 0 0 4px rgba(64,158,255,0.6); }
      70% { box-shadow: 0 0 0 3px rgba(43, 135, 226, 0), 0 0 5px rgba(64,158,255,0.4); }
      100% { box-shadow: 0 0 0 2px rgba(64,158,255,0.9), 0 0 4px rgba(64,158,255,0.6); }
    }
    .executor-avatar.me-glow {
      border-color: #409EFF;
      box-shadow: 0 0 0 2px rgba(64,158,255,0.9), 0 0 3px rgba(64,158,255,0.6);
      animation: halo-pulse 3s ease-out infinite;
    }
    .executor-avatar.more-count {
      border-color: rgba(139, 69, 19, 0.6);
      background: linear-gradient(135deg, #8b4513, #a0522d);
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .avatar-initials {
      font-size: 10px;
      font-weight: 600;
      color: #8b4513;
      text-align: center;
      line-height: 1;
    }
    .executor-avatar.more-count .avatar-initials {
      color: #fff;
    }
    .more-executors {
      font-size: 8px;
      color: #8b4513;
      font-weight: 600;
      background: rgba(139, 69, 19, 0.1);
      padding: 1px 3px;
      border-radius: 6px;
      min-width: 12px;
      text-align: center;
    }

    .card-body-content-wrapper {
      flex: 0 0 200px;
      margin-left: 20px;
      min-width: 0;
    }
    .card-body-content {
      color: rgb(85, 37, 5);
      font-size: 14px;
      height: 24px;
      line-height: 24px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      display: block;
      text-align: center;
    }
    .card-body-actions {
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
      flex-shrink: 0;
      padding: 0px 2px;
      width: 40px;
      .card-next-but {
        font-size: 13px;
        color: #fffcfa;
        background-color: #8b4513;
        padding: 0px;
        border: none;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;

        .el-icon {
          font-size: 16px;
        }

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: 0.5s;
        }

        &:hover::before {
          left: 100%;
        }

        &:hover {
          background: #a0522d;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
        }
      }
      .card-image {
        display: grid;
        gap: 10px;
      }
    }
    /* 子任务输入行 */
    .subtask-input-row {
      display: flex;
      align-items: flex-start;
      margin-top: 6px;
    }
    .subtask-input-row .connector {
      width: 16px;
      flex-shrink: 0;
      border-left: 2px solid #c9b1a7;
      border-bottom: 2px solid #c9b1a7;
      height: 12px;
      margin-left: 12px; /* 对齐主卡左边按钮中心 */
    }
    .subtask-input-container {
      flex: 1;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .subtask-input-actions { display: flex;  margin-right: 5px;}
    .subtask-input-actions .icon-action {
      width: 20px;
      height: 20px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .subtask-input-actions .icon-action .el-icon { font-size: 14px; }
  }
}

/* 顶部左侧优先级旗帜（挂饰样式） */
.priority-flag {
  position: absolute;
  top: -14px; /* 轻微悬浮在卡片上方 */
  left: 38px;
  height: 25px;
  line-height: 25px;
  padding: 0 5px 0 6px;
  color: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  z-index: 2;
  user-select: none;
  background: var(--priority-bg, linear-gradient(135deg, #ffa502, #ff7f50));
}
.priority-flag::before{
  content: '';
  position: absolute;
  bottom: -6px;
  width: 6px;
  height: 6px;
  background: var(--priority-bg, linear-gradient(135deg, #ffa502, #ff7f50));
  clip-path: polygon(0 0, 100% 0, 100% 100%);
  opacity: .95;
}
.priority-flag::after {
  content: '';
  position: absolute;
  bottom: -6px;
  width: 6px;
  height: 6px;
  background: var(--priority-bg, linear-gradient(135deg, #ffa502, #ff7f50));
  clip-path: polygon(0 100%,100% 0, 0 0);
  opacity: .95;
}
.priority-flag::before { left: 5px; }
.priority-flag::after { right: 5px; }

/* 颜色根据优先级变化（与详情页、页脚保持一致的语义色） */
.priority-flag[data-priority="P0"] { --priority-bg: linear-gradient(135deg, #ff6b6b, #ff4757); color: #ffffff; }
.priority-flag[data-priority="P1"] { --priority-bg: linear-gradient(135deg, #ffa502, #ff7f50); color: #ffffff; }
.priority-flag[data-priority="P2"] { --priority-bg: linear-gradient(135deg, #ffd700, #ffa500); color: #5a3200; }
.priority-flag[data-priority="P3"] { --priority-bg: linear-gradient(135deg, #98fb98, #90ee90); color: #2f4f4f; }
.priority-flag[data-priority="P4"] { --priority-bg: linear-gradient(135deg, #87ceeb, #00bfff); color: #183d4d; }
.priority-flag[data-priority="P5"] { --priority-bg: linear-gradient(135deg, #dda0dd, #da70d6); color: #ffffff; }
.priority-flag[data-priority="P6"] { --priority-bg: linear-gradient(135deg, #f0f0f0, #d3d3d3); color: #666666; }

/* 子任务列表渲染 */
.subtasks { margin-top: 4px; }
.subtask-wrapper { display: flex; align-items: flex-start; }
.subtask-wrapper > .connector {
  width: 16px;
  flex-shrink: 0;
  border-left: 2px solid #c9b1a7;
  border-bottom: 2px solid #c9b1a7;
  height: 30px;
  margin-left: 12px;
}
.subtask-container {
  // margin-left: 2ch; /* 两字符缩进 */
  flex: 1;
}
.subtask-container :deep(.task_card) {
  --el-card-padding: 4px;
  background-color: #fff9f5;
}

.card-body-tooltip {
  max-width: 315px; // 设置tooltip最大宽度
  word-wrap: break-word; // 长单词自动换行
  white-space: pre-wrap;
}
</style>
