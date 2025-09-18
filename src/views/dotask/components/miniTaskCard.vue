<template>
  <el-card
    class="task_card"
    :model-value="task.id"
    shadow="hover"
    @click="handleClick"
  >
    <!-- 卡片顶部内容 -->
    <template #header>
      <div class="card-header">

        <slot name="card-header-append" />
        
        <div class="card-header-center"  
          :data-status="timeLeft?.startsWith('超时') ? 'overtime' : ''"
        >
          {{ timeLeft || "无截至日期" }}
        </div>

        <slot name="card-header-append1" />

        <div class="card-header-right" v-if="showDeleteButton">
          <img
            :src="imageList.deleteRed"
            alt="删除项目"
            class="hover-animation"
            @click.stop="onDelete"
          />
        </div>

        <slot name="card-header-append2" />
      </div>
    </template>

    <!-- 卡片中间内容 -->
    <div class="card-body">
      <slot name="card-body-content">
        <el-tooltip
          v-if="isContentOverflow"
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
        <div v-else>
          <div class="card-body-content" ref="contentRef">
            {{ task.taskDetail }}
          </div>
        </div>
      </slot>
      <div
        ref="remarkRef"
        class="card-body-remark"
        :class="{ 'show-all': isRemarkExpanded }"
        @mouseenter="isRemarkExpanded = true"
        @mouseleave="handleMouseLeave"
        @click.stop
        v-if="showRemark"
      >
        {{ task.remark }}
      </div>
      <div class="card-body-footer">
        <div class="card-image">
          <el-button @click.stop="onPreviewImage" :class="previewButtonClass">
            预览图片
            {{ task.caption ? '(' + task.caption.split(';').length + ')' : '' }}
          </el-button>
        </div>
        <el-tooltip v-if="isShowHint">
          <template #content>点击即可将任务流程更新到下一任务流程</template>
          <el-button
            :class="nextStepBtnClass"
            v-if="task.schedule !== '归档'"
            @click.stop="onNextStep"
          >
            下一步
          </el-button>
        </el-tooltip>
        <el-button
          v-else
          :class="nextStepBtnClass"
          v-if="task.schedule !== '归档'"
          @click.stop="onNextStep"
        >
          下一步
        </el-button>
      </div>
    </div>

    <!-- 卡片底部内容 -->
    <template #footer>
      <div class="card-footer">
        <slot name="card-footer-append" />
        <div class="card-footer-left" v-if="showExecutorTags">
          <img
            :src="imageList.user"
            alt=""
            style="width: 16px; height: 16px"
          />
          <div class="footer-left-people" v-if="task?.taskExecutorList?.length > 0">
            <div v-for="(user, userIndex) in task.taskExecutorList.slice(0, 1)" class="footer-left-tag">
              <el-tag :type="getTagColorWrapper(userIndex)" round>{{ user }}</el-tag>
            </div>
            <el-tooltip
              v-if="task.taskExecutorList.length > 1"
              class="footer-left-tag"
              effect="light"
              placement="right"
            >
              <template #content>
                <div v-for="(user, userIndex) in task.taskExecutorList.slice(1)">
                  <el-tag :type="getTagColorWrapper(userIndex + 1)" round>{{ user }}</el-tag>
                </div>
              </template>
              <el-tag type="warning" effect="plain" round>
                {{ '+' }}{{ task.taskExecutorList.length - 1 }}
              </el-tag>
            </el-tooltip>
          </div>
          <div v-else class="footer-left-people">{{ "-" }}</div>
        </div>
        <div v-if="showProjectName">
          <div class="footer-center-project">
            <el-tag type="danger" effect="plain">
              {{ task.projectName }}
            </el-tag>
          </div>
        </div>
        <span
          class="card-footer-right"
          v-if="task.priority !== null"
          :data-priority="task.priority"
        >
          &nbsp;{{ task.priority }}&nbsp;
        </span>
      </div>
    </template>
  </el-card>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted, watch, reactive } from 'vue';
import { getTagColor } from '../../../utils';
const props = defineProps({
  task: {
    type: Object,
    required: true,
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
  }
});

const isShowHint = ref(props.isHint)

// 对父组件暴露的事件
const emit = defineEmits(["delete", "previewImage", "nextStep", "click"]);

// 删除任务
const onDelete = () => emit("delete", props.task.id);

// 预览图片
const onPreviewImage = () => emit("previewImage", props.task);

// 更新任务流程
const onNextStep = () => emit("nextStep", props.task);

// 打开任务详情--新增、编辑
const handleClick = () => emit("click", props.task);

/**
 * 设置不同负责人的标签颜色
 */
 const getTagColorWrapper = (index) => {
  return getTagColor(index);
}

const contentRef = ref(null);
const isContentOverflow = ref(false);
// 检查内容是否溢出
const checkContentOverflow = () => {
  if (!contentRef.value) return;
  if (contentRef.value) {
    const contentHeight = contentRef.value.scrollHeight;
    isContentOverflow.value = contentHeight > 58; // 判断高度是否超过 58px
  }
};

// 在组件挂载后检查内容高度
onMounted(() => {
  nextTick(() => {
    checkContentOverflow();
  });
});


/**
 * 倒计时计算
 */
const timeLeft = ref("无截至日期"); // 设置默认值

const calculateTimeLeft = (deadline) => {
  console.log(deadline)
  const now = new Date();
  const deadlineDate = new Date(deadline.replace(/-/g, '/'));
  if (isNaN(deadlineDate.getTime())) return null;

  const difference = deadlineDate - now;

  if (difference > 0) {
    // 倒计时
    const daysLeft = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return daysLeft === 0 ? `DDL: ${hoursLeft}小时` : `DDL: ${daysLeft}天`;
  } else {
    // 超时
    const overTime = Math.abs(difference);
    const daysOver = Math.floor(overTime / (1000 * 60 * 60 * 24));
    const hoursOver = Math.floor((overTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return daysOver === 0 ? `超时: ${hoursOver}小时` :  `超时: ${daysOver}天`;
  }
};

onMounted(() => {
  const updateTimeLeft = () => {
    const scheduleArray = props.task?.scheduleList?.split(',');
    
    // 判断当前任务是否为最后一个流程
    if (!scheduleArray || scheduleArray.length === 0) {
      timeLeft.value = "无截至日期";
      return;
    }

    const isLastSchedule = props.task.schedule === scheduleArray[scheduleArray?.length - 1];

    if (isLastSchedule) {
      let endTime = props.task.endTime;
      timeLeft.value = endTime ? endTime.substring(0, 19).replace("T", " ") : '无完成时间'
    } else if (props.task.deadline) {
      timeLeft.value = calculateTimeLeft(props.task.deadline);
    } else {
      timeLeft.value = "无截至日期";
    }
  };

  updateTimeLeft(); // 初始化倒计时
  const intervalId = setInterval(updateTimeLeft, 60 * 60 * 1000); // 每小时更新一次

  onUnmounted(() => clearInterval(intervalId)); // 组件卸载时清除定时器
});

const updateCardContent = (updatedTask) => {
  // 更新卡片中的任务数据
  Object.assign(props.task, updatedTask);

  const scheduleArray = props.task.scheduleList.split(',');
  // 判断当前任务是否为最后一个流程
  const isLastSchedule = props.task.schedule === scheduleArray[scheduleArray.length - 1];

  // 重新计算倒计时
  if (isLastSchedule) {
    timeLeft.value = props.task.endTime || '无完成时间';
  } else if (props.task.deadline) {
    timeLeft.value = calculateTimeLeft(props.task.deadline);
  } else {
    timeLeft.value = "无截至日期";
  }
};

defineExpose({
  updateCardContent
});


/**
 * 对备注内容的事件处理
 */
const isRemarkExpanded = ref(false); // 是否显示全部备注内容
const remarkRef = ref(null); // 监听备注区域的 mouseup 事件

// 复制备注内容的函数
const copyRemarkText = (event) => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText) {
    // 如果有选中的文本，则复制到剪贴板
    navigator.clipboard.writeText(selectedText).then(() => {
      console.log('已复制选中的文本:', selectedText);
    }).catch((err) => {
      console.error('复制失败:', err);
    });
  } else {
    // 如果没有选中文本，则复制整个备注内容
    navigator.clipboard.writeText(props.task.remark).then(() => {
      console.log('已复制整个备注内容:', props.task.remark);
    }).catch((err) => {
      console.error('复制失败:', err);
    });
  }
};

// 鼠标移开时
const handleMouseLeave = () => {
  // 清除当前选中的文本
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    selection.removeAllRanges();
  }
  isRemarkExpanded.value = false;
};


onMounted(() => { // 监听挂载
  if (remarkRef.value) {
    remarkRef.value.addEventListener('mouseup', copyRemarkText);
  }
});

onUnmounted(() => { // 卸载监听
  if (remarkRef.value) {
    remarkRef.value.removeEventListener('mouseup', copyRemarkText);
  }
});

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
  background-color: var(--card-background, #fffcfa);
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
    .card-body-content {
      color: rgb(85, 37, 5);
      font-size: 14px;
      max-height: 46px;
      min-height: 24px;
      padding-bottom: 5px;
      text-overflow: ellipsis;
      overflow: hidden;
      display: flex;
      justify-content: center;
    }
    .card-body-remark {
      color: #b88651;
      font-size: 13px;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: all 1s ease;
      cursor: copy;

      line-clamp: 2; // 最多只显示2行备注
      -webkit-line-clamp: 2;

      &.show-all { // hover时显示全部, 最大高度为220px
        max-height: 220px;
        overflow-y: auto; // 启用垂直滚动条
        word-break: break-word;
        -webkit-line-clamp: unset;
        line-clamp: unset;
        // max-height: unset;
        // overflow: visible;
      }
    }
    .card-body-footer {
      display: flex;
      justify-content: space-between;
      padding: 0px 2px;
      .card-next-but {
        font-size: 13px;
        color: #fffcfa;
        background-color: #8b4513;
        padding: 0px 8px;
        border: none;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;

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
  }
  .card-footer {
    cursor: default;
    display: flex;
    justify-content: space-between;
    padding: 0 8px 0 8px;
    font-size: 13px;
    color: #4d3a35;
    max-height: 24px;
    .card-footer-left {
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      .footer-left-people {
        margin-left: 5px;
        display: flex;
        align-items: center;
        .footer-left-tag {
          margin-right: 2px;
        }
      }
    }
    .footer-center-project {
      color: #c9845a;
    }
    span.card-footer-right {
      padding: 2px 8px;
      border-radius: 12px;
      font-family: 'Ghibli', sans-serif;
      font-weight: 500;
      letter-spacing: 1px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;

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
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      // P0 - 紧急
      &[data-priority="P0"] {
        background: linear-gradient(135deg, #ff6b6b, #ff4757);
        color: #fff;
      }

      // P1 - 高优先级
      &[data-priority="P1"] {
        background: linear-gradient(135deg, #ffa502, #ff7f50);
        color: #fff;
      }

      // P2 - 中高优先级
      &[data-priority="P2"] {
        background: linear-gradient(135deg, #ffd700, #ffa500);
        color: #8b4513;
      }

      // P3 - 中优先级
      &[data-priority="P3"] {
        background: linear-gradient(135deg, #98fb98, #90ee90);
        color: #2f4f4f;
      }

      // P4 - 中低优先级
      &[data-priority="P4"] {
        background: linear-gradient(135deg, #87ceeb, #00bfff);
        color: #2f4f4f;
      }

      // P5 - 低优先级
      &[data-priority="P5"] {
        background: linear-gradient(135deg, #dda0dd, #da70d6);
        color: #fff;
      }

      // P6 - 最低优先级
      &[data-priority="P6"] {
        background: linear-gradient(135deg, #f0f0f0, #d3d3d3);
        color: #666;
      }
    }
  }
}

.card-body-tooltip {
  max-width: 315px; // 设置tooltip最大宽度
  word-wrap: break-word; // 长单词自动换行
  white-space: pre-wrap;
}
</style>
