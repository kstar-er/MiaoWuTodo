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
        :show-save-button="showSaveButton"
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
        <template #selectAppend>
          <el-form-item
            label="团队/项目"
            prop="groupId"
            style="width:100%;"
            v-if="formData.reportType === 'group' || formData.reportType === 'project'"
          >
            <template #label>
              <el-popover
                placement="top"
                width="300"
                :hide-after="0"
              >
                <template #reference>
                  <el-icon style="color: #d47549" size="18">
                    <User v-if="formData.reportType === 'group'"/>
                    <List v-else/>
                  </el-icon>
                </template>
                <template #default>
                  该模板的所属{{formData.reportType === 'group' ? '团队' : '项目' }}
                </template>
              </el-popover>
            </template>

            <el-select
              v-if="formData.reportType === 'group'"
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

            <el-select
              v-if="formData.reportType === 'project'"
              v-model="formData.projectId"
              placeholder="请选择该模板的所属项目"
              clearable
              @change="handleChangeProject"
            >
              <el-option
                v-for="item in formData.projectList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </template>

        <template #timeAndNumberAppend>
          <div class="full-width">
            <div class="switch-container">
              <el-form-item
                v-for="(item, index) in formSwitchEl"
                :key="index"
                :label="item.title"
                :rules="item.rules"
                :prop="item.key"
                class="switch-item"
              >
                <template #label>
                  <el-popover
                    v-if="item.illustrate"
                    placement="top"
                    width="300"
                    :hide-after="0"
                  >
                    <template #reference>
                      <el-icon :style="`color: ${item.color ? item.color : 'orange'}`" :size="item.size ? item.size : ''">
                        <component :is="item.icon ? item.icon : 'Warning'" />
                      </el-icon>
                    </template>
                    <template #default>
                      {{ item.illustrate }}
                    </template>
                  </el-popover>
                  <div v-if="!item.icon">{{ item.title }}</div>
                </template>
                <el-switch
                  v-model="formData[item.key]"
                  :disabled="item.disabled"
                  inline-prompt
                  @change="item.change"
                />
              </el-form-item>
            </div>
          </div>
        </template>

        <template #textAreaAppend v-if="formData.type === 'template'">
          <el-form-item
            label="可用模板"
            prop="contentFormat"
            style="width: 100%;"
            class="full-width"
          >
            <template #label>
              <el-popover
                placement="top"
                width="300"
                :hide-after="0"
              >
                <template #reference>
                  <el-icon style="color: #d47549" size="18">
                    <FolderOpened />
                  </el-icon>
                </template>
                <template #default>
                  快速选择可用模板（重复点击某个模板即可取消选中）
                </template>
              </el-popover>
            </template>

            <div class="template-card-container">
              <div
                v-for="tmpl in templateList"
                :key="tmpl.id"
                class="template-card"
                @click="handleTemplateSelect(tmpl.id)"
                :class="{ selected: formData.contentFormat === tmpl.id }"
              >
                <!-- 图标 -->
                <img
                  v-if="!tmpl.isMore"
                  src="@/assets/images/template.png"
                  alt="文档"
                  class="template-icon"
                />
                <img
                  v-else
                  src="@/assets/images/more.png"
                  alt="更多"
                  class="template-icon"
                />

                <!-- 名称 -->
                <span class="template-name">{{ tmpl.name }}</span>
              </div>
            </div>
          </el-form-item>
        </template>
      </publicIconForm>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, getCurrentInstance } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import publicIconForm from "../../components/public/publicIconForm.vue";
import customDragWindow from "../../components/public/customDragWindow.vue";
import { createReport, saveReportConfig } from "@/utils/reportManagement/index.js";
import { createOSSClient } from "../../../utils/upload/secureOSSUpload";
import { marked } from "marked";

const { proxy } = getCurrentInstance();

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
const showSaveButton = ref(false)
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

  await initReportTemplate()
});

const initDataSource = async (event) => {
  const { data, emitWin } = event.payload;
  emit_win = emitWin;
  if (data.type !== 'template') {
    data.renderedContent = marked(data.content)
  }
  formData.value = {...data};

  // 根据数据设置表单字段
  setupFormByData(data);
  nextTick(() => {
    ruleFormRef.value?.updateFormData(formData.value);
  });
};

const initInlineData = async (data) => {
  loading.value = true;
  try {
    if (data.type !== 'template') {
      data.renderedContent = marked(data.content)
    }

    formData.value = { ...data };
    
    // console.log('initInlineData - data.type:', data.type);
    setupFormByData(data);
    nextTick(() => {
      ruleFormRef.value?.updateFormData(formData.value);
    });
  } finally {
    loading.value = false;
  }
};

/**
 * 初始化周报模板列表数据
 */
const templateList = ref([])
const initReportTemplate = async () => {
  // 对应 OSS 中的“目录”，先默认拿public下的公共模板
  // 等后续扩展成用户自定义，再拿： 公共模板 + 用户自定义模板 “template/用户id”
  const prefix = 'template/public/';

  let client;
  try {
    client = await createOSSClient(); // ✅ 必须 await
    if (!client || client.success === false) {
      throw new Error('OSS客户端创建失败');
    }
  } catch (error) {
    console.error('创建OSS客户端失败:', error);
    proxy.$message.error('模板列表加载失败，请稍后重试');
    return;
  }

  try {
    const result = await client.list({ prefix, delimiter: '/' });
    
    if (result.objects) {
      console.log("result.objects---", result.objects)
      const templates = result.objects
        .filter(file => !file.name.endsWith('/')) // 排除目录，只获取目录下的文件列表
        .map(file => ({
          id: file.name,
          name: file.name.split('/').pop().replace(/\.(md|html|txt)$/, ''),
          isMore: false,
          lastModified: file.lastModified,
          size: file.size
        }));

      // 添加“更多模板”选项---后续扩展成用户自定义新增模板
      // templates.push({
      //   id: 'more',
      //   name: '更多模板',
      //   isMore: true
      // });

      templateList.value = templates;

      console.log("templateList---", templateList.value)
    }
  } catch (error) {
    console.error('加载OSS模板列表失败:', error);
    proxy.$message.error('模板列表加载失败');
  }
}

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
  formTextAreaEl: [],
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
        if (params.reportType === 'person') {
          if (params.groupId) delete params.groupId;
          if (params.projectId) delete params.projectId;
        }

        if (params.reportType === 'group') {
          if (params.projectId) delete params.projectId;
        }

        if (params.reportType === 'project') {
          if (params.groupId) delete params.groupId;
        }

        delete params.groupList;
        delete params.projectList;
        
        // 获取用户信息
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        params.userId = userInfo.userId || null;
        
        console.log("提交参数---", params)
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

const formSwitchEl = [{
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
}]

// 根据数据类型设置表单字段
const setupFormByData = (data) => {
  if (data.type === 'template') {
    // 保存按钮是否显示
    showSaveButton.value = true
    // 模板详情
    detailForm.value.formInputEl[0].title = "模板名称";
    detailForm.value.formInputEl[0].key = "templateType";
    // detailForm.value.formTextAreaEl[0].title = "模板描述";
    // detailForm.value.formTextAreaEl[0].key = "description";
    
    // 设置模板配置的特定字段
    detailForm.value.formSelectEl = [
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
        // change: (val) => {
        //   formData.value.templateFormat = val;

        //   if (val === 'markdown') {
        //     detailForm.value.formEditorEl[0].element = 'markdown'
        //   } else if (val === 'html') {
        //     detailForm.value.formEditorEl[0].element = 'html'
        //   } else {
        //     detailForm.value.formEditorEl[0].element = 'input'
        //   }

        //   formData.value.description = ''

        //   nextTick(() => {
        //     if (ruleFormRef.value) {
        //       ruleFormRef.value.updateFormData(formData.value);
        //     }
        //   });
        // }
      },
      {
        title: "周期类型",
        key: "scheduleType",
        element: "select",
        type: "default",
        illustrate: "选择周期类型",
        icon: "Clock",
        color: "#d47549",
        size: "18",
        options: [
          { label: "手动", value: "manual" },
          { label: "周报", value: "weekly" },
          { label: "月报", value: "monthly" },
        ],
        fullWidth: false,
        change: (val) => {
          formData.value.scheduleType = val;

          // 生成日的下标
          const index = detailForm.value.formSelectEl.findIndex(item => item.key === 'generateDay')

          if (val === 'manual') {
            formData.value.generateDay = null
            formData.value.autoGenerateTime = null
            detailForm.value.formTimeAndNumber = []
            detailForm.value.formSelectEl.splice(index, 1)

            updateForm({scheduleType: val, generateDay: null, autoGenerateTime: null})
          } else if (val !== 'manual') {
            
            if (index === -1) {
              detailForm.value.formSelectEl.push({
                title: "生成日",
                key: "generateDay",
                element: "select",
                options: [],
                illustrate: "周/月生成日（1-31）",
                icon: "Calendar",
                color: "#d47549",
                size: "18",
                min: 1,
                max: 31,
                fullWidth: false
              })
            }

            // 动态更新 generateDay 字段
            updateGenerateDayField(val);

            if (formData.value.id && detailForm.value.formTimeAndNumber.length === 0) {
              detailForm.value.formTimeAndNumber.push(
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
                }
              )
            }
            formData.value.generateDay = null

            updateForm({scheduleType: val, generateDay: null})
          }
        },
      },
      {
        title: "报告类型",
        key: "reportType",
        element: "select",
        type: "default",
        illustrate: "选择报告类型（个人/团队/项目）",
        icon: "Document",
        color: "#d47549",
        size: "18",
        options: [
          { label: "个人", value: "personal" },
          { label: "团队", value: "group" },
          { label: "项目", value: "project" }
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
          formData.value.reportType = val;

          updateForm({reportType: val})
        }
      }
    ];

    detailForm.value.formTimeAndNumber = [];

    // 添加开关选项
    detailForm.value.formSwitchEl = [];

    detailForm.value.formTextAreaEl = [];

    detailForm.value.formEditorEl = [
      // {
      //   title: "模板描述",
      //   key: "description",
      //   element: "markdown",
      //   illustrate: "模板描述",
      //   icon: "ChatDotRound",
      //   color: "#d47549",
      //   size: "18",
      //   type: "textarea",
      //   minRows: 8,
      //   maxRows: 12,
      //   placeholder: "请输入模板描述",
      //   config: {
      //     menus: [ "code", "head", "bold", "fontSize", "fontName", "italic", "underline", "strikeThrough", "indent", "lineHeight",
      //       "foreColor", "backColor", "link", "list", "todo", "justify", "emoticon", "image", "splitLine", "undo", "redo"
      //     ]
      //   },
      //   height: 300,
      //   fullWidth: true
      // }
    ];

    // 编辑模式
    if (data.id) {
      if (data.scheduleType === 'manual') {
        detailForm.value.formTimeAndNumber = []
      } else {
        const index = detailForm.value.formSelectEl.findIndex(item => item.key === 'generateDay')
        if (index === -1) {
          detailForm.value.formSelectEl.push({
            title: "生成日",
            key: "generateDay",
            element: "select",
            options: [],
            illustrate: "周/月生成日（1-31）",
            icon: "Calendar",
            color: "#d47549",
            size: "18",
            min: 1,
            max: 31,
            fullWidth: false
          })
        }
        // 自动生成时间--显示
        detailForm.value.formTimeAndNumber.push({
          title: "自动生成时间",
          key: "autoGenerateTime",
          element: "time",
          illustrate: "自动生成时间",
          icon: "Clock",
          color: "#d47549",
          size: "18",
          fullWidth: false,
          format: 'HH:mm:ss'
        })
      }

      // 初始化 generateDay 字段
      updateGenerateDayField(data.scheduleType);
      
      // 回显周报模板格式
      // if (data.templateFormat === 'markdown') {
      //   detailForm.value.formEditorEl[0].element = 'markdown'
      // } else if (data.templateFormat === 'html') {
      //   detailForm.value.formEditorEl[0].element = 'html'
      // } else {
      //   detailForm.value.formEditorEl[0].element = 'input'
      // }
    }
  } else {
    // 保存按钮是否显示
    showSaveButton.value = false
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
        title: "周期类型",
        key: "scheduleType",
        element: "select",
        type: "default",
        illustrate: "手动/周/月",
        icon: "Clock",
        color: "#d47549",
        size: "18",
        options: [
          { label: "手动", value: "manual" },
          { label: "周报", value: "weekly" },
          { label: "月报", value: "monthly" },
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
        title: "周报类型",
        key: "reportType",
        element: "select",
        type: "default",
        illustrate: "个人周报/团队周报/项目周报",
        icon: "Document",
        color: "#d47549",
        size: "18",
        options: [
          { label: "个人", value: "personal" },
          { label: "团队", value: "group" },
          { label: "项目", value: "project" }
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
          formData.value.reportType = val;

          updateForm({reportType: val})
        }
      },
    ];
    // 清空模板相关字段
    detailForm.value.formSwitchEl = [];
    detailForm.value.formTextAreaEl = [{
      title: "周报内容",
      key: "renderedContent",
      element: "markdown",
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

// 新增：动态更新 generateDay 字段
const updateGenerateDayField = (type) => {
  // 从 formSelectEl 中获取item

  if (type === "manual") return

  const index = detailForm.value.formSelectEl.findIndex(item => item.key === 'generateDay')
  if (index === -1) return

  if (type === "weekly") {
    detailForm.value.formSelectEl[index].options = [
      { label: "周一", value: 1 },
      { label: "周二", value: 2 },
      { label: "周三", value: 3 },
      { label: "周四", value: 4 },
      { label: "周五", value: 5 },
      { label: "周六", value: 6 },
      { label: "周日", value: 7 }
    ]
  } else if (type === "monthly") {
    let options = []
    for (let i = 1; i <= 31; i++) {
      options.push({
        label: i + "号",
        value: i,
      });
    }
    // 月报：选择 1~31 号
    detailForm.value.formSelectEl[index].options = options
  }
};

/**
 * 个人/团队/项目
 * @param val 选择的模板类型
 */
const handleChangeGroup = (val) => {
  formData.value.groupId = val

  updateForm({
    groupId: val
  })
}

/**
 * 个人/团队/项目
 * @param val 选择的模板类型
 */
const handleChangeProject = (val) => {
  formData.value.projectId = val

  updateForm({
    projectId: val
  })
}


/**
 * 选择通用模板--markdown
 */
const handleTemplateSelect = (id) => {
  if (formData.value.contentFormat === id) {
    formData.value.contentFormat = ''
  } else {
    formData.value.contentFormat = id;
  }
  
  updateForm({
    contentFormat: formData.value.contentFormat
  })
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

/**
 * 更新某个值
 */
const updateForm = (params) => {
  nextTick(() => {
    if (ruleFormRef.value) {
      ruleFormRef.value.updateInput(params);
    }
  });
}
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

.template-card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  // justify-content: space-between;
  width: calc(25% - 4px);
  .template-card {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    
    &:hover {
      border-color: #d47549;
      background-color: #f8f9fa;
      transform: translateY(-4px);
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }

    .template-icon {
      width: 24px;
      margin-right: 8px;
    }

    .template-name {
      font-size: 14px;
      color: #303133;
    }
  }

  .selected {
    border-color: #d47549;
    background-color: #f5f7fa;
  }
}

.full-width {
  grid-column: span 2;
}

.switch-container {
  display: flex;
  flex-wrap: wrap;
}

.switch-item {
  flex: 1 1 calc(50% - 5px); /* 每行两个，自动适应宽度 */
  min-width: 200px; /* 防止过窄 */
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
