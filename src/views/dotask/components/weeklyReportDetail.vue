<template>
  <main class="container" :class="{ inline: isInline }">
    <customDragWindow v-if="!isInline">
      <template #header>
        <div class="title-header">
          <div class="title-content">
            <!-- 标题 -->
            <div class="title-text">
              {{ formData?.id ? (formData.title || '周报详情') : '新增周报模板' }}
            </div>
          </div>
        </div>
      </template>
    </customDragWindow>
    <div v-else class="title-header">
      <div class="title-content">
        <div class="title-text">
          {{ formData?.id ? (formData.title || '周报详情') : '新增周报模板' }}
        </div>
      </div>
    </div>

    <publicIconForm
      ref="ruleFormRef"
      :label-width="'90px'"
      :form-data="formData"
      :form-input-el="detailForm.formInputEl"
      :form-select-el="detailForm.formSelectEl"
      :form-text-area-el="detailForm.formTextAreaEl"
      :form-upload-el="detailForm.formUploadEl"
      :form-time-and-number="detailForm.formTimeAndNumber"
      :form-switch-el="detailForm.formSwitchEl"
      :my-client="myClient"
      :drawer-direction="props.drawerDirection"
      @hide-win="hideWin"
      @input-done="detailForm.inputDone"
      @delete-item="handleDeleteItem"
    >
      <!-- 可以根据需要添加额外的插槽内容 -->
    </publicIconForm>
  </main>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import publicIconForm from "../../components/public/publicIconForm.vue";
import customDragWindow from "../../components/public/customDragWindow.vue";
import { createReport, saveReportConfig } from "@/utils/reportManagement/index.js";

const myClient = ref();
const props = defineProps({
  isInline: {
    type: Boolean,
    default: false
  },
  inlineData: {
    type: Object,
    default: null
  },
  drawerDirection: {
    type: String,
    default: 'rtl'
  }
});
const emitInline = defineEmits(["inlineClose", "inlineSaved"]);
const formData = ref({});
const ruleFormRef = ref(null);
const loading = ref(false);

let emit_win = '';
let detailWin = null;
if (!props.isInline) {
  detailWin = getCurrentWindow("weekly_report_detail");
  onMounted(async () => {
    await detailWin.emit("weeklyReportDetail-window-ready");
  });
}

let unlistenFn;
onMounted(async () => {
  if (!props.isInline) {
    loading.value = true;
    try {
      unlistenFn = await listen("weekly-report-detail-info", async (event) => {
        await initDataSource(event);
        loading.value = false;
      });
    } catch (error) {
      console.error("事件监听设置失败:", error);
    }
  } else if (props.inlineData) {
    await initInlineData(props.inlineData);
  }
});

watch(() => props.inlineData, async (val) => {
  if (props.isInline && val) {
    await initInlineData(val);
  }
}, { deep: true });

const initDataSource = async (event) => {
  const { data, emitWin } = event.payload;
  emit_win = emitWin;
  formData.value = data;
  // 根据数据设置表单字段
  setupFormByData(data);
  nextTick(() => {
    ruleFormRef.value?.updateFormData(formData.value);
  });
};

const initInlineData = async (data) => {
  loading.value = true;
  try {
    formData.value = { ...data };
    setupFormByData(data);
    nextTick(() => {
      ruleFormRef.value?.updateFormData(formData.value);
    });
  } finally {
    loading.value = false;
  }
};

// 根据数据类型设置表单字段
const setupFormByData = (data) => {
  if (data.type === 'template') {
    // 模板详情
    detailForm.formInputEl[0].title = "模板名称";
    detailForm.formInputEl[0].key = "templateType";
    detailForm.formTextAreaEl[0].title = "模板描述";
    detailForm.formTextAreaEl[0].key = "description";
    
    // 设置模板配置的特定字段
    detailForm.formSelectEl = [
      {
        title: "报告类型",
        key: "reportType",
        element: "select",
        type: "default",
        illustrate: "选择报告类型",
        icon: "Document",
        color: "#d47549",
        size: "18",
        options: [
          { label: "周报", value: "weekly" },
          { label: "月报", value: "monthly" },
          { label: "季报", value: "quarterly" },
        ],
        rules: [
          {
            required: true,
            message: "该项不能为空",
            trigger: "blur",
          },
        ],
        fullWidth: false
      },
      {
        title: "模板格式",
        key: "templateFormat",
        element: "select",
        type: "default",
        illustrate: "选择模板格式",
        icon: "Document",
        color: "#d47549",
        size: "18",
        options: [
          { label: "Markdown", value: "markdown" },
          { label: "HTML", value: "html" },
          { label: "纯文本", value: "text" },
        ],
        rules: [
          {
            required: true,
            message: "该项不能为空",
            trigger: "blur",
          },
        ],
        fullWidth: false
      },
      {
        title: "内容格式",
        key: "contentFormat",
        element: "select",
        type: "default",
        illustrate: "选择内容格式",
        icon: "Edit",
        color: "#d47549",
        size: "18",
        options: [
          { label: "简洁", value: "brief" },
          { label: "详细", value: "detailed" },
          { label: "图表", value: "chart" },
        ],
        fullWidth: false
      },
      {
        title: "语言",
        key: "language",
        element: "select",
        type: "default",
        illustrate: "选择语言",
        icon: "ChatDotRound",
        color: "#d47549",
        size: "18",
        options: [
          { label: "中文", value: "zh-CN" },
          { label: "英文", value: "en-US" },
        ],
        fullWidth: false
      },
      {
        title: "详细程度",
        key: "detailLevel",
        element: "select",
        type: "default",
        illustrate: "选择详细程度",
        icon: "List",
        color: "#d47549",
        size: "18",
        options: [
          { label: "简要", value: "brief" },
          { label: "标准", value: "standard" },
          { label: "详细", value: "detailed" },
        ],
        fullWidth: false
      },
      {
        title: "调度类型",
        key: "scheduleType",
        element: "select",
        type: "default",
        illustrate: "选择调度类型",
        icon: "Clock",
        color: "#d47549",
        size: "18",
        options: [
          { label: "手动", value: "manual" },
          { label: "每周", value: "weekly" },
          { label: "每月", value: "monthly" },
        ],
        fullWidth: false
      },
    ];

    detailForm.formTimeAndNumber = [
      {
        title: "生成日",
        key: "generateDay",
        element: "number",
        illustrate: "周/月生成日（1-31）",
        icon: "Calendar",
        color: "#d47549",
        size: "18",
        min: 1,
        max: 31,
        fullWidth: false
      },
      {
        title: "自动生成时间",
        key: "autoGenerateTime",
        element: "time",
        illustrate: "自动生成时间",
        icon: "Clock",
        color: "#d47549",
        size: "18",
        fullWidth: false,
        format: 'HH:mm:ss'
      },
    ];

    // 添加开关选项
    detailForm.formSwitchEl = [
      {
        title: "包含指标",
        key: "includeMetrics",
        element: "switch",
        illustrate: "是否包含数据指标",
        icon: "DataAnalysis",
        color: "#d47549",
        size: "18",
        fullWidth: false
      },
      {
        title: "包含建议",
        key: "includeSuggestions",
        element: "switch",
        illustrate: "是否包含改进建议",
        icon: "ChatDotRound",
        color: "#d47549",
        size: "18",
        fullWidth: false
      },
      {
        title: "自动生成",
        key: "autoGenerate",
        element: "switch",
        illustrate: "是否自动生成报告",
        icon: "Setting",
        color: "#d47549",
        size: "18",
        fullWidth: false
      },
      {
        title: "启用配置",
        key: "enabled",
        element: "switch",
        illustrate: "是否启用当前配置",
        icon: "Switch",
        color: "#d47549",
        size: "18",
        fullWidth: false
      },
    ];
  } else {
    // 周报详情
    detailForm.formInputEl[0].title = "周报标题";
    detailForm.formInputEl[0].key = "title";
    detailForm.formTextAreaEl[0].title = "周报内容";
    detailForm.formTextAreaEl[0].key = "content";
    // 显示周报的特定字段
    detailForm.formTimeAndNumber = [
      {
        title: "开始日期",
        key: "startDate",
        element: "date",
        illustrate: "周报开始日期",
        icon: "Calendar",
        color: "#d47549",
        size: "18",
        fullWidth: false,
        valueFormat: 'YYYY-MM-DD'
      },
      {
        title: "结束日期",
        key: "endDate",
        element: "date",
        illustrate: "周报结束日期",
        icon: "Calendar",
        color: "#d47549",
        size: "18",
        fullWidth: false,
        valueFormat: 'YYYY-MM-DD'
      },
    ];
    detailForm.formSelectEl = [
      {
        title: "周报类型",
        key: "reportType",
        element: "select",
        type: "default",
        illustrate: "个人或团队周报",
        icon: "User",
        color: "#d47549",
        size: "18",
        options: [
          { label: "个人", value: "个人" },
          { label: "团队", value: "团队" },
        ],
        rules: [
          {
            required: true,
            message: "该项不能为空",
            trigger: "blur",
          },
        ],
        fullWidth: false
      },
    ];
    // 清空模板相关字段
    detailForm.formSwitchEl = [];
  }
};

const hideWin = (type, params) => {
  if (props.isInline) {
    if (type === 'save') {
      emitInline('inlineSaved', params);
    } else {
      emitInline('inlineClose');
    }
    return;
  }

  let mainWin = getCurrentWindow(emit_win);
  if (type === 'save') {
    mainWin.emit("weekly-report-detail-saved", { action: formData.value.id ? "updated" : "add", data: params });
  } else {
    mainWin.emit(`${emit_win}-weekly-report-detail-close`, { action: "cancel" });
  }
  formData.value = {};
  unlistenFn?.();
  detailWin.destroy();
};

const handleDeleteItem = (itemData) => {
  // 处理删除逻辑
  console.log('删除项目:', itemData);
  // 这里可以调用删除API，然后关闭窗口
  hideWin();
};

// 表单配置
const detailForm = ref({
  formInputEl: [
    {
      title: "周报标题",
      key: "title",
      element: "input",
      style: "width: 100%;",
      illustrate: "周报标题",
      icon: "Document",
      color: "#d47549",
      size: "18",
      rules: [
        {
          required: true,
          message: "该项不能为空",
          trigger: "blur",
        },
      ],
      fullWidth: true
    },
  ],
  formTimeAndNumber: [],
  formSelectEl: [],
  formSwitchEl: [],
  formTextAreaEl: [
    {
      title: "周报内容",
      key: "content",
      element: "input",
      illustrate: "周报详细内容",
      icon: "ChatDotRound",
      color: "#d47549",
      size: "18",
      type: "textarea",
      minRows: 8,
      maxRows: 12,
      placeholder: "请输入周报内容",
      fullWidth: true
    },
  ],
  formPasteImageEl: [
    {
      title: "",
      key: "attachments",
      illustrate: "",
      fullWidth: true
    }
  ],
  inputDone: async (val) => {
    const params = { ...formData.value, ...val };
    // 判断是周报还是模板
    if (params.type === 'template') {
      // 保存模板配置
      try {
        const response = await saveReportConfig(params);
        if (response.data.code === 200) {
          console.log('模板保存成功');
        } else {
          console.error('模板保存失败:', response.data.msg);
        }
      } catch (error) {
        console.error('模板保存异常:', error);
      }
    } else {
      // 保存周报
      try {
        const response = await createReport(params);
        if (response.data.code === 200) {
          console.log('周报保存成功');
        } else {
          console.error('周报保存失败:', response.data.msg);
        }
      } catch (error) {
        console.error('周报保存异常:', error);
      }
    }
    hideWin('save', params);
  },
});
</script>

<style lang="less" scoped>
@import "../../../assets/global.less";

.container {
  width: 100vw;
  height: 100vh;
  position: relative;
  transform: none;
  background: #faf0ea;
  overflow-y: auto;
}
.container.inline {
  width: 100%;
  height: 100%;
  background: #faf0ea;
}

.title-header {
  width: 100%;
  padding: 25px 20px 10px 20px;
  margin-bottom: 15px;
  background-color: #d9cbb8;
  .title-content {
    display: flex;
    justify-content: center;
    align-items: center;
    .title-text {
      font-size: larger;
      color: #7f3a12;
      font-weight: 600;
      background-blend-mode: multiply;
      text-shadow: 2px 3px 1px #8b451330;
    }
  }
}
</style>
