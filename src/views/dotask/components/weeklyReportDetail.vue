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

    <div style="padding-bottom: 80px;">
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
        :form-editor-el="detailForm.formEditorEl"
        :my-client="myClient"
        :drawer-direction="props.drawerDirection"
        @hide-win="hideWin"
        @input-done="detailForm.inputDone"
        @delete-item="handleDeleteItem"
      >
        <template #selectAppend v-if="formData.type === 'template'">
          <el-form-item
            label="小组"
            prop="groupId"
            style="width:100%;"
            v-if="formData.createTemplateType === 'group'"
          >
            <template #label>
              <el-popover
                placement="top"
                width="300"
                :hide-after="0"
              >
                <template #reference>
                  <el-icon style="color: #d47549" size="18">
                    <User />
                  </el-icon>
                </template>
                <template #default>
                  该模板的所属小组
                </template>
              </el-popover>
            </template>

            <el-select
              v-model="formData.groupId"
              placeholder="请选择该模板的所属团队"
              clearable
              @change="handleChangeGroup"
            >
              <el-option
                v-for="item in formData.groupList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </template>

        <template #textAreaAppend v-if="formData.type === 'template' && formData.templateFormat === 'markdown'">
          <el-form-item
            label="可用模板"
            prop="templateId"
            style="width:100%;"
          >
            <template #label>
              <el-popover
                placement="top"
                width="300"
                :hide-after="0"
              >
                <template #reference>
                  <el-icon style="color: #d47549" size="18">
                    <User />
                  </el-icon>
                </template>
                <template #default>
                  快速选择可用模板，或自行编辑
                </template>
              </el-popover>
            </template>

            <el-select
              v-model="templateId"
              placeholder="选择通用模板"
              clearable
              @change="handleTemplateSelect"
            >
              <el-option
                v-for="tmpl in commonTemplates"
                :key="tmpl.id"
                :label="tmpl.name"
                :value="tmpl.id"
              />
            </el-select>
          </el-form-item>
        </template>
      </publicIconForm>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import publicIconForm from "../../components/public/publicIconForm.vue";
import customDragWindow from "../../components/public/customDragWindow.vue";
import { createReport, saveReportConfig } from "@/utils/reportManagement/index.js";
import commonTemplates from "../../components/commonTemplates";

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

const initDataSource = async (event) => {
  const { data, emitWin } = event.payload;
  emit_win = emitWin;
  formData.value = data;

  // 周报模板--编辑
  if (data.type === 'template' && data.id) {
    let createType = data.groupId ? 'group' : 'person'
    formData.value.createTemplateType = createType
  }

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
    
    // 周报模板--编辑
    if (data.type === 'template' && data.id) {
      let createType = data.groupId ? 'group' : 'person'
      formData.value.createTemplateType = createType
    }
    // console.log('initInlineData - data.type:', data.type);
    setupFormByData(data);
    nextTick(() => {
      ruleFormRef.value?.updateFormData(formData.value);
    });
  } finally {
    loading.value = false;
  }
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
    // {
    //   title: "周报模板",
    //   key: "content",
    //   element: "input",
    //   illustrate: "周报模板内容",
    //   icon: "ChatDotRound",
    //   color: "#d47549",
    //   size: "18",
    //   type: "textarea",
    //   minRows: 8,
    //   maxRows: 12,
    //   placeholder: "请输入周报模板",
    //   fullWidth: true
    // },
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
        if (params.createTemplateType === 'person') {
          if (params.groupId) delete params.groupId;
        }

        delete params.createTemplateType;
        delete params.groupList;
        
        // 获取用户信息
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        params.userId = userInfo.userId || null;
        
        console.log("提交参数---", params)
        // const response = await saveReportConfig(params);
        // if (response.data.code === 200) {
        //   console.log('模板保存成功');
        // } else {
        //   console.error('模板保存失败:', response.data.msg);
        // }
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

// 根据数据类型设置表单字段
const setupFormByData = (data) => {
  console.log('setupFormByData called with data:', data);
  console.log('data.type:', data.type);
  
  if (data.type === 'template') {
    console.log('Setting up template form fields');
    // 模板详情
    detailForm.value.formInputEl[0].title = "模板名称";
    detailForm.value.formInputEl[0].key = "templateType";
    // detailForm.value.formTextAreaEl[0].title = "模板描述";
    // detailForm.value.formTextAreaEl[0].key = "description";
    
    // 设置模板配置的特定字段
    detailForm.value.formSelectEl = [
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
        fullWidth: false,
        change: (val) => {
          formData.value.templateFormat = val;

          if (val === 'markdown') {
            detailForm.value.formEditorEl[0].element = 'markdown'
          } else if (val === 'html') {
            detailForm.value.formEditorEl[0].element = 'html'
          } else {
            detailForm.value.formEditorEl[0].element = 'input'
          }

          formData.value.description = ''

          nextTick(() => {
            if (ruleFormRef.value) {
              ruleFormRef.value.updateFormData(formData.value);
            }
          });
        }
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
      {
        title: "模板类型",
        key: "createTemplateType",
        element: "select",
        type: "default",
        illustrate: "选择模板类型（个人/团队）",
        icon: "Avatar",
        color: "#d47549",
        size: "18",
        options: [
          { label: "个人模板", value: "person" },
          { label: "团队模板", value: "group" }
        ],
        fullWidth: true,
        change: (val) => {
          formData.value.createTemplateType = val;

          const index = detailForm.value.formSelectEl.findIndex(item => item.key === 'createTemplateType')
          if (index !== -1) {

            console.log(index)
            if (val === 'group') {
              detailForm.value.formSelectEl[index].fullWidth = false
            } else {
              detailForm.value.formSelectEl[index].fullWidth = true
            }
          }
          
          nextTick(() => {
            if (ruleFormRef.value) {
              ruleFormRef.value.updateFormData(formData.value);
            }
          });
        }
      },
    ];

    detailForm.value.formTimeAndNumber = [
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
    detailForm.value.formSwitchEl = [
      {
        title: "包含指标",
        key: "includeMetrics",
        element: "switch",
        illustrate: "是否包含数据指标",
        color: "#d47549",
        size: "18",
        fullWidth: false
      },
      {
        title: "包含建议",
        key: "includeSuggestions",
        element: "switch",
        illustrate: "是否包含改进建议",
        color: "#d47549",
        size: "18",
        fullWidth: false
      },
      {
        title: "自动生成",
        key: "autoGenerate",
        element: "switch",
        illustrate: "是否自动生成报告",
        color: "#d47549",
        size: "18",
        fullWidth: false
      },
      {
        title: "启用配置",
        key: "enabled",
        element: "switch",
        illustrate: "是否启用当前配置",
        color: "#d47549",
        size: "18",
        fullWidth: false
      },
    ];

    detailForm.value.formTextAreaEl = [];

    detailForm.value.formEditorEl = [
      {
        title: "模板描述",
        key: "description",
        element: "markdown",
        illustrate: "模板描述",
        icon: "ChatDotRound",
        color: "#d47549",
        size: "18",
        type: "textarea",
        minRows: 8,
        maxRows: 12,
        placeholder: "请输入模板描述",
        // config: {
        //   menus: [ "code", "head", "bold", "fontSize", "fontName", "italic", "underline", "strikeThrough", "indent", "lineHeight",
        //     "foreColor", "backColor", "link", "list", "todo", "justify", "emoticon", "image", "splitLine", "undo", "redo"
        //   ]
        // },
        // height: 300,
        fullWidth: true
      }
    ];

    // 编辑模式
    if (data.id) {
      // 如果是团队模板
      if (data.groupId) {
        detailForm.value.formSelectEl[6].fullWidth = false
      } else {
        detailForm.value.formSelectEl[6].fullWidth = true
      }

      // 回显周报模板格式
      if (data.templateFormat === 'markdown') {
        detailForm.value.formEditorEl[0].element = 'markdown'
      } else if (data.templateFormat === 'html') {
        detailForm.value.formEditorEl[0].element = 'html'
      } else {
        detailForm.value.formEditorEl[0].element = 'input'
      }
    }
  } else {
    // 周报详情
    detailForm.value.formInputEl[0].title = "周报标题";
    detailForm.value.formInputEl[0].key = "title";
    // 显示周报的特定字段
    detailForm.value.formTimeAndNumber = [
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
    detailForm.value.formSelectEl = [
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
    detailForm.value.formSwitchEl = [];
    detailForm.value.formTextAreaEl = [{
      title: "周报内容",
      key: "content",
      element: "input",
      illustrate: "周报内容",
      icon: "ChatDotRound",
      color: "#d47549",
      size: "18",
      type: "textarea",
      minRows: 8,
      maxRows: 12,
      placeholder: "请输入周报内容",
      fullWidth: true
    }];
  }
  
  console.log('setupFormByData completed, detailForm.value:', detailForm.value);
  
  // 强制触发响应式更新
  nextTick(() => {
    console.log('nextTick - updating form data');
    if (ruleFormRef.value) {
      ruleFormRef.value.updateFormData(formData.value);
    }
  });
};

/**
 * 个人模板/团队模板
 * @param val 选择的模板类型
 */
const handleChangeGroup = (val) => {
  formData.value.groupId = val

  console.log("change", val)
  nextTick(() => {
    if (ruleFormRef.value) {
      ruleFormRef.value.updateFormData(formData.value);
    }
  });
}

/**
 * 选择通用模板--markdown
 */
const templateId = ref(null)
const handleTemplateSelect = (id) => {
  const selectedTemplate = commonTemplates.find(t => t.id === id);
  if (selectedTemplate) {
    formData.value.description = selectedTemplate.content;
    nextTick(() => {
      if (ruleFormRef.value) {
        ruleFormRef.value.updateFormData(formData.value);
      }
    });
  }
};


watch(() => props.inlineData, async (val) => {
  if (props.isInline && val) {
    await initInlineData(val);
  }
}, { deep: true, immediate: true });

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

:deep(.w-e-full-screen-editor) {
  top: 30px !important;
  height: 90% !important;
}

:deep(.w-e-menu .w-e-panel-container) {
  // margin-left: -180px !important;
  width: 300px !important;
}
</style>
