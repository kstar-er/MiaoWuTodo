<template>
  <div>
    <div class="form_area">
      <el-form
        ref="ruleFormRef"
        :label-width="labelWidth"
        autocomplete="off"
        :model="myformData"
        status-icon
        scroll-to-error
        :inline="false"
        :disabled="disabled"
        class="form"
      >
        <slot name="customFormItem" />
        <el-form-item
          v-for="item in formInputEl"
          :key="item.key"
          :label="item.title"
          :rules="item.rules"
          :prop="item.key"
          :class="{'full-width': item.fullWidth}"
          class="form-item"
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
                  <component :is="item.icon ? item.icon : Warning" />
                </el-icon>
              </template>
              <template #default>
                {{ item.illustrate }}
                <el-link
                  v-if="
                    item.key === 'mapLongitude' || item.key === 'mapLatitude'
                  "
                  href="https://lbs.qq.com/getPoint/"
                  target="_blank"
                  class="ml10"
                  type="primary"
                >
                  点击跳转拾取经纬度
                </el-link>
              </template>
            </el-popover>
            <div v-if="!item.icon">{{ item.title }}</div>
          </template>

          <el-input
            v-if="item.element === 'input'"
            v-model="myformData[item.key]"
            clearable
            :type="item.type"
            :style="item.style ? item.style : `width: 220px`"
            :placeholder="`请输入${item.title}`"
            :disabled="
              item.canInput
                ? !item.canInput
                : item.type === 'dialog' || item.disabled
            "
            :autosize="{ minRows: item.minRows ? item.minRows : 3, maxRows: item.maxRows ? item.maxRows : 6 }"
            :show-password="item.type === 'password' ? true : false"
            autocomplete="new-password"
            @change="item.change"
          >
            <template v-if="item.type === 'dialog'" #append>
              <el-button
                :disabled="item.disabled"
                @click="emitOpenDialog(item.key)"
              >
                <el-icon><Edit /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item
          v-for="item in formSelectEl"
          :key="item.key"
          :label="item.title"
          :rules="item.rules"
          :prop="item.key"
          :class="{'full-width': item.fullWidth}"
          class="form-item"
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
                  <component :is="item.icon ? item.icon : Warning" />
                </el-icon>
              </template>
              <template #default>
                {{ item.illustrate }}
              </template>
            </el-popover>
            <div v-if="!item.icon">{{ item.title }}</div>
          </template>
          
          <el-radio-group
            v-if="item.element === 'radio'"
            v-model="myformData[item.key]"
            :disabled="item.disabled"
            @change="item.change"
          >
            <el-radio
              v-for="option in item.options"
              :key="option.label"
              :label="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </el-radio>
          </el-radio-group>

          <el-select
            v-if="item.element === 'select'"
            v-model="myformData[item.key]"
            style="width: 220px"
            :disabled="item.disabled"
            :placeholder="`请选择${item.title}`"
            :multiple="item.type === 'multiple'"
            collapse-tags
            collapse-tags-tooltip
            @change="item.change"
            clearable
          >
            <el-option
              v-for="option in item.options"
              :key="option.label"
              :label="option.label"
              :value="option.value"
            />
          </el-select>

          <el-tree-select
            v-if="item.element === 'selectTree'"
            v-model="myformData[item.key]"
            :data="item.options"
            node-key="id"
            :placeholder="`请选择${item.title}`"
            check-strictly
            :default-expand-all="item.needExpand ?? false"
            :render-after-expand="false"
            show-checkbox
            check-on-click-node
            :disabled="item.disabled"
            :multiple="item.multiple"
            @check="item.check"
          />
        </el-form-item>

        <slot name="selectAppend" />

        <el-form-item
          v-for="item in formTimeAndNumber"
          :key="item.key"
          :label="item.title"
          :rules="item.rules"
          :prop="item.key"
          :class="{'full-width': item.fullWidth}"
          class="form-item"
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
                  <component :is="item.icon ? item.icon : Warning" />
                </el-icon>
              </template>
              <template #default>
                {{ item.illustrate }}
              </template>
            </el-popover>
            <div v-if="!item.icon">{{ item.title }}</div>
          </template>

          <el-date-picker
            v-if="item.element === 'date'"
            v-model="myformData[item.key]"
            :type="item.type ? item.type : 'date'"
            :placeholder="
              item.placeholder ? item.placeholder : `请选择${item.title}`
            "
            :value-format="item.valueFormat ? item.valueFormat : 'YYYY-MM-DD HH:mm:ss'"
            @change="(val) => handleDateChange(item.key, val, 'date')"
          />
          <el-date-picker
            v-if="item.element === 'datetime'"
            v-model="myformData[item.key]"
            type="datetime"
            :placeholder="
              item.placeholder ? item.placeholder : `请选择${item.title}`
            "
            value-format="YYYY-MM-DD HH:mm:ss"
            @change="(val) => handleDateChange(item.key, val, 'datetime')"
          />
          <el-time-picker
            v-if="item.element === 'timerange'"
            v-model="myformData[item.key]"
            is-range
            range-separator="至"
            start-placeholder="开始时间"
            style="width: 220px"
            end-placeholder="结束时间"
          />
          <el-date-picker
            v-if="item.element === 'datetimerange'"
            v-model="myformData[item.key]"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            style="width: 220px"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            :disabled="item.disabled"
          />
          <el-date-picker
            v-if="item.element === 'daterange'"
            v-model="myformData[item.key]"
            type="daterange"
            range-separator="至"
            start-placeholder="开始时间"
            style="width: 220px"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD"
            :disabled="item.disabled"
          />

          <el-input-number
            v-if="item.element === 'number'"
            v-model="myformData[item.key]"
            style="width: 220px"
            :disabled="item.disabled"
            :min="item.min ? item.min : 0"
            :precision="item.precision ? item.precision : 0"
            :max="item.max ? item.max : 100000000"
            controls-position="right"
            placeholder="1"
            size=""
          />
          
          <el-time-picker
            v-if="item.element === 'time'"
            v-model="myformData[item.key]"
            :format="item.format ? item.format : 'HH:mm:ss'"
            :value-format="item.format ? item.format : 'HH:mm:ss'"
            :placeholder="`请选择${item.title}`"
            style="width: 220px"
            :disabled="item.disabled"
          />
        </el-form-item>

        <slot name="timeAndNumberAppend" />

        <!-- 开关字段 -->
        <el-form-item
          v-for="item in formSwitchEl"
          :key="item.key"
          :label="item.title"
          :rules="item.rules"
          :prop="item.key"
          :class="{'full-width': item.fullWidth}"
          class="form-item"
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
                  <component :is="item.icon ? item.icon : Warning" />
                </el-icon>
              </template>
              <template #default>
                {{ item.illustrate }}
              </template>
            </el-popover>
            <div v-if="!item.icon">{{ item.title }}</div>
          </template>

          <el-switch
            v-model="myformData[item.key]"
            :disabled="item.disabled"
            inline-prompt
            @change="item.change"
          />
        </el-form-item>

        <slot name="append" />

        <el-form-item
          v-for="item in formTextAreaEl"
          :key="item.key"
          :label="item.title"
          :rules="item.rules"
          :prop="item.key"
          :class="{'full-width': item.fullWidth}"
          class="form-item"
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
                  <component :is="item.icon ? item.icon : Warning" />
                </el-icon>
              </template>
              <template #default>
                {{ item.illustrate }}
              </template>
            </el-popover>
            <div v-if="!item.icon">{{ item.title }}</div>
          </template>
          
          <el-input
            v-if="item.element === 'input'"
            v-model="myformData[item.key]"
            :type="item.type"
            :placeholder="item.placeholder ? item.placeholder : `请输入${item.title}`"
            :disabled="item.type === 'dialog' || item.disabled"
            :autosize="{ minRows: item.minRows ? item.minRows : 3, maxRows: item.maxRows ? item.maxRows : 6 }"
            clearable
          >
            <template v-if="item.type === 'dialog'" #append>
              <el-tooltip content="点击编辑内容">
                <el-button @click="emitOpenDialog(item.key)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
            </template>
          </el-input>

          <div v-if="item.element === 'markdown'" class="markdown-preview" v-html="myformData[item.key]"></div>
        </el-form-item>

        <slot name="textAreaAppend" />

        <el-form-item
          v-for="item in formEditorEl"
          :key="item.key"
          :label="item.title"
          :rules="item.rules"
          :prop="item.key"
          :class="{'full-width': item.fullWidth}"
          class="form-item"
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
                  <component :is="item.icon ? item.icon : Warning" />
                </el-icon>
              </template>
              <template #default>
                {{ item.illustrate }}
              </template>
            </el-popover>
            <div v-if="!item.icon">{{ item.title }}</div>
          </template>
          
          <el-input
            v-if="item.element === 'input'"
            v-model="myformData[item.key]"
            :type="item.type"
            :placeholder="item.placeholder ? item.placeholder : `请输入${item.title}`"
            :disabled="item.type === 'dialog' || item.disabled"
            :autosize="{ minRows: item.minRows ? item.minRows : 3, maxRows: item.maxRows ? item.maxRows : 6 }"
            clearable
          >
            <template v-if="item.type === 'dialog'" #append>
              <el-tooltip content="点击编辑内容">
                <el-button @click="emitOpenDialog(item.key)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
            </template>
          </el-input>

          <div v-if="item.element === 'richtext'" class="richtext-editor">
            <RichTextEditor
              v-model="myformData[item.key]"
              :mode="item.element"
              :placeholder="item.placeholder ? item.placeholder : `请输入${item.title}`"
              :height="item.height || 400"
              :config="item.config || {}"
              @input="item.onInput"
            />
          </div>

          <div v-if="item.element === 'html'" class="html-editor">
            <CodeEditor
              v-model="myformData[item.key]"
              :language="item.language || 'html'"
              :placeholder="item.placeholder ? item.placeholder : `请输入${item.title}`"
              :theme="item.theme || 'dark'"
              @input="item.onInput"
            />
          </div>
        </el-form-item>

        <!-- 粘贴或点击（点击可同时选多张） 上传图片 -->
        <el-form-item
          v-for="item in formPasteImageEl"
          :key="item.key"
          :label="item.title"
          :prop="item.key"
          :class="{'full-width': item.fullWidth}"
          class="form-item"
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
                  <component :is="item.icon ? item.icon : Warning" />
                </el-icon>
              </template>
              <template #default>
                {{ item.illustrate }}
              </template>
            </el-popover>
            <div v-if="!item.icon">{{ item.title }}</div>
          </template>

          <div class="image-upload-container">
            <input
              type="file"
              :ref="el => fileInputs[item.key] = el"
              accept="image/*"
              multiple
              style="display: none"
              @change="(e) => handleFileChange(e, item.key)"
            />
            <div class="image-list" :class="{ active: pasteActiveKey === item.key }" @click="onImageListBlankClick($event, item.key)" @paste="(e) => handlePaste(e, item.key)">
              <template v-if="myformData[item.key] && myformData[item.key].length">
                <div v-for="(image, index) in myformData[item.key]" :key="index" class="image-item">
                  <el-image
                    :src="image"
                    :preview-src-list="getPreviewList(item.key)"
                    fit="cover"
                    show-progress
                    class="image-thumbnail"
                  >
                    <template #error>
                      <div class="image-slot">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                  <div class="image-actions image-delete">
                    <el-button
                      type="danger"
                      :icon="Delete"
                      circle
                      size="small"
                      @click="removeImage(item.key, index)"
                    />
                  </div>
                </div>
                <div v-if="pasteActiveKey !== item.key" class="image-item add-tile" @click="triggerFileInput(item.key)">
                  <el-icon><Plus /></el-icon>
                </div>
              </template>
              <template v-else>
                <div v-if="pasteActiveKey !== item.key" class="upload-fab" @click.stop="triggerFileInput(item.key)">
                  <el-icon><Plus /></el-icon>
                </div>
                <div class="image-hint">
                  <div class="hint-title">暂无图片</div>
                  <div class="hint-sub">
                    {{ pasteActiveKey === item.key ? '复制图片后Ctrl+V粘贴' : '点击进入粘贴模式，或点击“+”上传' }}
                  </div>
                </div>
              </template>
            </div>
          </div>
        </el-form-item>
        
        <!-- 点击上传图片 -->
        <el-form-item
          v-for="item in formUploadEl"
          :key="item.key"
          :label="item.title"
          :rules="item.rules"
          :prop="item.key"
          :class="{'full-width': item.fullWidth}"
          class="form-item"
        >
          <div class="upload-container">
            <el-upload
              :ref="'upload' + item.key"
              v-model="myformData"
              :file-list="
                myformData[item.key] ? myformData[item.key].map((url) => ({ url })) : []
              "
              class="mr20"
              :http-request="customUploadRequest"
              :limit="item.limit ? item.limit : 1"
              :before-upload="item.beforeUpload"
              :on-success="item.onSuccess"
              :on-exceed="onExceed"
              accept=".png, .jpg, .jpeg"
              list-type="picture-card"
            >
              <el-icon><Plus /></el-icon>
              <template #file="{ file }">
                <el-image
                  style="width: 120px; height: 120px"
                  :src="file.url"
                  :zoom-rate="1.2"
                  :preview-src-list="[file.url]"
                  :initial-index="1"
                  fit="cover"
                />
                <el-button
                  class="resetUpload"
                  :icon="Delete"
                  circle
                  size="small"
                  @click="handleRemove(file, file.url, item.key)"
                />
              </template>
            </el-upload>
          </div>
          <div v-if="myformData[item.key]?.length > 3" class="hint">
            <img :src="imageList.hint" alt="" style="width: 18px; height: 18px;">
            <span class="hint-text" style="color: #b7c134">可上下滚动查看或继续添加图片</span>
            <span class="hint-text" style="color: #b7c134">({{ myformData[item.key].length }} / {{ item.limit }})</span>
          </div>
        </el-form-item>
        <slot name="append1" />
      </el-form>
    </div>
    <div class="footer-btn">
      <!-- 保存按钮 -->
      <el-tooltip
        v-if="showSaveButton"
        content="保存" 
        placement="top" 
        :show-after="800"
        :hide-after="200"
        effect="dark"
        :disabled="false"
      >
        <el-button
          type="primary"
          style="float: right; margin-right: 25px; width: 40px; height: 40px;"
          @click="submitForm"
          class="btn-base btn-primary"
          circle
        >
          <el-icon><Check /></el-icon>
        </el-button>
      </el-tooltip>

      <!-- 返回按钮 -->
      <el-tooltip 
        content="返回" 
        placement="top" 
        :show-after="800"
        :hide-after="200"
        effect="dark"
        :disabled="false"
      >
        <el-button
          type="danger"
          style="float: right; margin-right: 10px; width: 40px; height: 40px;"
          @click="hideWin"
          class="btn-base btn-danger"
          circle
        >
          <el-icon>
            <ArrowLeft v-if="_props.drawerDirection === 'rtl'" />
            <ArrowRight v-else />
          </el-icon>
        </el-button>
      </el-tooltip>

      <!-- 日志按钮 -->
      <el-tooltip
        v-if="showLogButton"
        content="查看日志" 
        placement="top" 
        :show-after="800"
        :hide-after="200"
        effect="dark"
        :disabled="false"
      >
        <el-button
          type="info"
          style="float: right; margin-right: 10px; width: 40px; height: 40px;"
          @click="openLogsDialog"
          class="btn-base btn-info"
          circle
        >
          <el-icon><Document /></el-icon>
        </el-button>
      </el-tooltip>

      <!-- 删除按钮 -->
      <el-button
        v-if="showDeleteButton"
        style="float: left; margin-left: 25px; width: 40px; height: 40px;"
        @click="handleDelete"
        class="delete-btn"
        circle
      >
        <img src="/deleteRed.svg" alt="删除" style="width: 25px; height: 25px;" />
      </el-button>
    </div>
  </div>

  <!-- 日志弹窗 -->
  <el-dialog
    v-model="logsDialogVisible"
    title="任务日志"
    width="60vw"
    :close-on-click-modal="false"
    :append-to-body="false"
    class="logs-dialog"
  >
    <el-table :data="logs"  max-height="360px" v-loading="logsLoading" size="small">
      <el-table-column prop="operator" label="操作人" width="80" />
      <el-table-column prop="action" label="动作" width="80" />
      <el-table-column prop="operateTime" label="操作时间" width="120" />
      <el-table-column prop="content" label="内容" />
    </el-table>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="logsDialogVisible = false">关 闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, getCurrentInstance, onMounted, onUnmounted } from "vue";
import { Edit, Plus, Delete, Picture, Check, Close, Document, ArrowLeft, ArrowRight, Warning } from "@element-plus/icons-vue";
import { getTaskLogs } from "../../../utils/taskManagement/index.js";
import { uploadTaskImageToOSS } from "../../../utils/upload/secureOSSUpload.js";
import RichTextEditor from './RichTextEditor.vue';
import CodeEditor from './CodeEditor.vue';
//import MilkdownEditor from './MilkdownEditor.vue';

const { proxy } = getCurrentInstance();

const imageList = ref({
  hint: './hint.svg'
})

const ruleFormRef = ref(null);
const showDeleteButton = ref(true);

const _props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },

  labelWidth: {
    type: String,
    default: '120px',
  },

  // 表单
  formSelectEl: {
    type: Object,
    default: () => {
      return {};
    },
  },

  // 表单
  formInputEl: {
    type: Object,
    default: () => {
      return {};
    },
  },

  // 表单
  formTextAreaEl: {
    type: Object,
    default: () => {
      return {};
    },
  },

  // 表单
  formUploadEl: {
    type: Object,
    default: () => {
      return {};
    },
  },

  // 表单
  formPasteImageEl: {
    type: Array,
    default: () => {
      return [];
    },
  },

  // 表单
  formTimeAndNumber: {
    type: Object,
    default: () => {
      return {};
    },
  },

  // 开关表单
  formSwitchEl: {
    type: Array,
    default: () => {
      return [];
    },
  },

  // 更多功能的编辑器
  formEditorEl: {
    type: Array,
    default: () => {
      return [];
    },
  },

  isLimits: {
    type: Boolean,
    default: false,
  },

  myClient: {
    type: Object,
    default: () => {
      return {};
    },
  },

  formData: {
    type: Object,
    default: () => {
      return {};
    },
  },

  selectTreeNode: {
    type: Object,
    default: () => {
      return [];
    },
  },

  defaultExpandedKeys: {
    type: Object,
    default: () => {
      return [];
    },
  },

  drawerDirection: {
    type: String,
    default: 'rtl'
  },

  // 保存按钮
  showSaveButton: {
    type: Boolean,
    default: true
  },

  // 日志按钮
  showLogButton: {
    type: Boolean,
    default: true
  },
});

const updateFormData = (newData) => { // 手动更新myformData的所有值
  myformData.value = {}; // 清空原有数据
  Object.assign(myformData.value, newData);
  checkDeletePermission(); // 检查删除权限

  console.log("updateFormData", myformData.value)
}

const updateInput = (propObj) => { // 手动更新某个值
  Object.keys(propObj).forEach(key => {
    myformData.value[key] = propObj[key]
  })
}

defineExpose({
  ruleFormRef,
  updateFormData,
  updateInput
});

const onExceed = () => {
  proxy.$message.error("已上传过图片，需要重新上传请先删除之前的图片");
};

let myformData = ref({});
const _emits = defineEmits(["hideWin", "inputDone", "emitOpenDialog", "deleteTask"]);
const emitOpenDialog = (key) => _emits('emitOpenDialog', key);
const hideWin = () => {
  myformData.value = {};
  _emits("hideWin");
}; // 关闭窗口

// 日志弹窗
const logsDialogVisible = ref(false);
const logsLoading = ref(false);
const logs = ref([]);

const openLogsDialog = async () => {
  const taskId = myformData.value?.id;
  if (!taskId) {
    proxy.$message.warning("未找到任务ID，无法查询日志");
    return;
  }
  logsDialogVisible.value = true;
  logsLoading.value = true;
  try {
    const res = await getTaskLogs(taskId);
    if (res.code === 200) {
      // 统一数据结构并格式化时间
      logs.value = (res.list || []).map(item => ({
        operator: item.operator || item.createBy || item.userName || item.username || '-',
        action: item.action || item.operateType || item.type || '-',
        operateTime: formatTime(item.operateTime || item.createTime || item.time),
        content: item.content || item.remark || item.message || '-',
      }));
    } else {
      proxy.$message.error(res.message || "获取日志失败");
    }
  } catch (e) {
    console.error(e);
    proxy.$message.error("获取日志失败");
  } finally {
    logsLoading.value = false;
  }
};

const formatTime = (val) => {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${M}-${dd} ${hh}:${mm}:${ss}`;
};

// 检查是否显示删除按钮（只有任务创建人可以删除）——改为基于 userId 判断
const getCurrentUser = () => {
  try {
    const info = JSON.parse(sessionStorage.getItem('userInfo'));
    return info?.user?.username|| null;
  } catch (e) {
    return null;
  }
};

const checkDeletePermission = () => {
  const currentUser = getCurrentUser();
  console.log("currentUserId", currentUser)
  // 兼容多种后端字段命名
  const creator =
    myformData.value?.createBy ?? null;

  const isEditMode = !!myformData.value?.id; // 有ID说明是编辑模式
  showDeleteButton.value = Boolean(isEditMode  && creator && currentUser === creator);
};

// 处理删除任务
const handleDelete = async () => {
  try {
    await proxy.$confirm('确定要删除当前任务吗？删除后无法恢复。', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    
    // 发送删除事件给父组件
    _emits("deleteTask", myformData.value);
  } catch (error) {
    // 用户取消删除
    console.log('用户取消删除操作');
  }
};

const submitForm = async () => {
  await proxy.$refs.ruleFormRef.validate((valid, fields) => {
    if (valid) {
      if (_props.isLimits) {
        let menuList = proxy.$refs.treeRef?.getCheckedKeys();
        let halfMenuList = proxy.$refs.treeRef?.getHalfCheckedKeys();
        myformData.value.menuIds = menuList.concat(halfMenuList);
      }
      _emits("inputDone", JSON.parse(JSON.stringify(myformData.value)));
    } else {
      console.log("error submit!", fields);
    }
  });
};

const handleRemove = (file, url, key) => {
  const fileList = myformData.value[key];
  // 获取剩余图片的 URL
  const updatedUrls = fileList.filter(f => f !== url);
  console.log("111updatedUrls", updatedUrls)
  myformData.value[key] = updatedUrls; // 更新表单数据
};


/**
 * 图片粘贴或点击上传
 */
// 图片上传相关
const fileInputs = ref({});

// 触发文件选择
const triggerFileInput = (key) => {
  fileInputs.value[key].click();
};

// 处理文件选择
const handleFileChange = async (event, key) => {
  const files = event.target.files;
  if (files) {
    if (!myformData.value[key]) {
      myformData.value[key] = [];
    }
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        await uploadImage(file, key);
      }
    }
  }
  // 清空input，以便可以重复选择同一文件
  event.target.value = '';
};

// 当前聚焦的表单项 key（仅用于兜底，不再绑定全局粘贴监听）
const currentKey = ref(null);
const isPicFocus = ref(false);

// 聚焦/失焦仅记录当前 key，不再注册全局粘贴监听，避免重复触发
const picFocus = (key) => {
  currentKey.value = key;
};

const picBlur = () => {
  currentKey.value = null;
};

// 处理粘贴事件（仅绑定在输入框上）并做去重
let lastPasteAt = 0;
const handlePaste = async (event, key) => {
  try {
    event?.stopPropagation?.();
    event?.preventDefault?.();
    const now = Date.now();
    if (now - lastPasteAt < 150) return; // 简单去重
    lastPasteAt = now;

    const clipboardItems = event.clipboardData?.items;
    if (!clipboardItems) return;

    const targetKey = key ?? currentKey.value;
    if (!targetKey) return;

    for (const item of clipboardItems) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          if (!myformData.value[targetKey]) myformData.value[targetKey] = [];
          await uploadImage(file, targetKey);
        }
      }
    }
  } catch (error) {
    console.error('粘贴失败:', error);
  }
};

// 自定义上传请求处理函数
const customUploadRequest = async (options) => {
  const { file, onSuccess, onError } = options;
  
  try {
    const result = await uploadTaskImageToOSS(file);
    
    if (result.success) {
      // 模拟 Element Plus 上传成功回调的数据结构
      const response = {
        url: result.url,
        name: result.fileName
      };
      onSuccess(response);
    } else {
      onError(new Error(result.error));
    }
  } catch (error) {
    onError(error);
  }
};

// 修改上传图片方法以支持 Blob 类型（用于粘贴功能）
const uploadImage = async (file, key) => {
  try {
    const result = await uploadTaskImageToOSS(file);
    
    if (result.success) {
      myformData.value[key].push(result.url);
    } else {
      proxy.$message.error(`图片上传失败: ${result.error}`);
    }
  } catch (error) {
    console.error('上传失败:', error);
    proxy.$message.error('图片上传失败');
  }
};

// 获取到要预览的图片列表
const getPreviewList = (key) => {
  return myformData.value[key] || [];
}

// 移除图片
const removeImage = (key, index) => {
  myformData.value[key].splice(index, 1);
};

// 预览框空白点击进入粘贴模式（浅蓝高亮）
const pasteActiveKey = ref(null);
const onImageListBlankClick = (event, key) => {
  const target = event.target;
  const blacklist = ['.image-item', '.el-image', '.image-actions', '.el-button'];
  for (const sel of blacklist) {
    if (target.closest && target.closest(sel)) return; // 点击在图片或控件上，忽略
  }
  pasteActiveKey.value = key;
};

// 点击页面其他区域时，退出粘贴模式
const handleDocumentClick = (event) => {
  const container = event.target?.closest && event.target.closest('.image-list');
  if (!container) {
    pasteActiveKey.value = null;
  }
};

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
});

/**
 * 处理日期变化
 */
const handleDateChange = (key, value, type) => {
  // 如果是 date 类型（只选择日期），自动设置时分秒为 23:59:59
  if (type === 'date' && value) {
    const date = new Date(value);
    date.setHours(15, 59, 59, 999);
    
    // 使用本地时间格式化
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    myformData.value[key] = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}
</script>

<style lang="less" scoped>
@import "../../../assets/global.less";

.form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  // gap: 5px;
  padding-right: 20px;
}

.form-item {
  grid-column: span 1;
}

.full-width {
  grid-column: span 2;
}

.footer-btn {
  height: 60px;
  bottom: 0;
  right: 0;
}

/* 确保删除图标按钮样式在 scoped 下正确生效并覆盖 Element Plus 默认样式 */
.footer-btn :deep(.delete-btn) {
  border-radius: 50% !important;
  background: #ffffff !important;
  border: 1px solid #e6e1dc !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
  padding: 0 !important;
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}
.footer-btn :deep(.delete-btn:hover) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(245,108,108,0.25) !important;
  border-color: #f56c6c !important;
}
.footer-btn :deep(.delete-btn:active) {
  transform: scale(0.96);
}
.footer-btn :deep(.delete-btn img) {
  width: 24px;
  height: 24px;
  display: block;
}

/* 日志弹窗样式，保持整体棕/米色主题，左右各留 10% 空白 */
:deep(.logs-dialog .el-dialog) { border-radius: 10px; }
:deep(.logs-dialog .el-dialog__header) {
  background: linear-gradient(180deg, #a05e29, #fff3e6) !important;
  border-bottom: 1px solid #e6e1dc !important;
}
:deep(.logs-dialog .el-dialog__title) {
  color: #7f3a12 !important;
  font-weight: 700;
  letter-spacing: .5px;
}
:deep(.logs-dialog .el-dialog__body) {
  padding: 10px 4px 6px 4px !important;
  background: #faf0ea !important;
}
:deep(.logs-dialog .el-table) {
  --el-table-header-bg-color: #f7eae2;
  --el-table-header-text-color: #7f3a12;
  --el-table-tr-bg-color: #fffaf6;
  --el-table-text-color: #5a3c2e;
  --el-table-border-color: #e6e1dc;
  border-radius: 8px;
  overflow: hidden;
}
:deep(.logs-dialog th.el-table__cell) {
  background: #f7eae2 !important;
  color: #7f3a12 !important;
  font-weight: 600;
}
:deep(.logs-dialog .el-table__row:hover > td) {
  background: #fff3e6 !important;
}
:deep(.logs-dialog .el-dialog__footer) {
  border-top: 1px solid #e6e1dc !important;
  padding-top: 10px !important;
}
:deep(.logs-dialog .dialog-footer .el-button) {
  background: #8b4513 !important;
  color: #fff !important;
  border: none !important;
}
:deep(.logs-dialog .dialog-footer .el-button:hover) {
  background: #a0522d !important;
}

.hint {
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.el-form-item__content) {
  width: 100%; /* 确保内容区域占满 form-item */
  align-items: flex-start;
}

:deep(.el-form-item__label) {
  text-align: right;
  // display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  align-items: center;
}

:deep(.el-textarea) {
  // width: 250px;
}

:deep(.el-upload-list__item,.el-upload){
  width: 120px;
  height: 120px;
}
:deep(.el-upload){
  width: 120px;
  height: 120px;
}

.resetUpload{
  position: absolute;
  top: 0;
  left: 0;
}

.image-upload-container {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  
  .image-toolbar-vertical {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 160px;
    flex-shrink: 0;
  }

  .upload-btn {
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .upload-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(64,158,255,.35);
  }
  .upload-btn:active {
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(64,158,255,.2);
  }

  .paste-input {
    height: 28px;
  }
  
  .image-list {
    flex: 1;
    flex-basis: 52%;
    max-width: 52%;
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    min-height: 120px;
    align-items: flex-start;
    border: 1px solid rgb(255 217 190);
    border-radius: 6px;
    background: linear-gradient(180deg, #fffaf6 0%, #fff3e6 100%);
    position: relative;
    padding: 6px;
    &.active {
      background: linear-gradient(180deg, #eef7ff 0%, #e6f2ff 100%);
      box-shadow: inset 0 0 0 1px #cfe7ff;
    }
    
    .image-item {
      position: relative;
      width: 60px;
      height: 60px;
      border-radius: 4px;
      overflow: hidden;
      
      &:hover {
        .image-delete {
          opacity: 1;
        }
      }

      .image-thumbnail {
        width: 100%;
        height: 100%;
      }
      
      .image-preview {
        width: 100%;
        height: 100%;
      }
      
      .image-delete {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 20px;
        height: 20px;
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s;
        cursor: pointer;
        z-index: 1;
        
        i {
          color: #fff;
          font-size: 12px;
        }
        
        &:hover {
          background-color: rgba(0, 0, 0, 0.7);
        }
      }
      
      .image-slot {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        background: #f5f7fa;
        color: #909399;
        font-size: 20px;
      }
    }
    .image-hint {
      width: 100%;
      min-height: 108px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #8c6a4a;
      text-align: center;
      .hint-title { font-weight: 700; color: #7f3a12; }
      .hint-sub { font-size: 12px; opacity: 0.95; margin-top: 6px; }
    }
    .add-tile {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      border-radius: 4px;
      border: 1px dashed #d9d9d9;
      background: #fff;
      cursor: pointer;
      transition: all .2s ease;
      .el-icon { color: #909399; font-size: 18px; }
      &:hover { border-color: #409eff; color: #409eff; }
    }
    .upload-fab {
      position: absolute;
      top: 6px;
      left: 6px;
      width: 60px;
      height: 60px;
      border-radius: 4px;
      border: 1px dashed #d9d9d9;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all .2s ease;
      .el-icon { color: #909399; font-size: 18px; }
      &:hover { border-color: #409eff; color: #409eff; }
    }
  }
  
  .delete-btn {
    transition: all 0.2s ease;
  }
}

.html-editor {
  width: 100%;
}

// markdown渲染区
.markdown-preview {
  border: 1px solid #e9e9e9;
  padding: 15px;
  background-color: #fff;
  border-radius: 4px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.4;
  color: #333;
}

/* 标题样式 */
.markdown-preview h1,
.markdown-preview h2,
.markdown-preview h3 {
  color: #d47549;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

/* 列表样式 */
.markdown-preview ul,
.markdown-preview ol {
  margin-left: 20px;
  margin-bottom: 1em;
}

/* 代码块样式 */
.markdown-preview pre {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 10px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  margin: 1em 0;
}
</style>