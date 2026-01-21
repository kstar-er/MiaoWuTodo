<!-- RichTextEditor.vue (v4 版本) -->
<template>
  <div class="rich-text-editor">
    <div ref="editorElem" style="border: 1px solid #ddd; border-radius: 4px;"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, getCurrentInstance } from 'vue';
import { uploadReportImageToOSS } from '@/utils/upload/secureOSSUpload';
import E from 'wangeditor';

const { proxy } = getCurrentInstance();

const instance = getCurrentInstance();

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  height: {
    type: Number,
    default: 400,
  },
  placeholder: {
    type: String,
    default: '请输入内容...',
  },
  config: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:modelValue', 'textChange']);

// 编辑器实例
const editorElem = ref(null);
let editor = null;
let isFirstInput = true;

onMounted(() => {
  // 创建编辑器实例
  editor = new E(editorElem.value);
  editor.config.height = props.height;
  editor.config.placeholder = props.placeholder;
  editor.config.menuTooltipPosition = 'down';
  editor.config.languageTab = '    ';

  editor.config.languageType = [
    'Bash',
    'C',
    'C#',
    'C++',
    'CSS',
    'Java',
    'JavaScript',
    'JSON',
    'TypeScript',
    'Plain text',
    'Html',
    'XML',
    'SQL',
    'Go',
    'Kotlin',
    'Lua',
    'Markdown',
    'PHP',
    'Python',
    'Shell Session',
    'Ruby',
  ]

  // 配置菜单
  editor.config.menus = props.config.menus ||  [
    // 标题
    "head",
    // 加粗、斜体、下划线、删除线
    "bold",
    "fontSize",
    "fontName",
    "italic",
    "underline",
    "strikeThrough",
    "indent",
    "lineHeight",
    "foreColor",
    "backColor",
    "link",
    // 列表相关
    "list",
    "todo",
    "justify",
    // 引用、代码块
    "quote",
    "emoticon",
    "image",
    "table",
    "code",
    "video",
    // 分割线
    "splitLine",
    // 撤销、重做
    "undo",
    "redo",
  ];

  // 图片上传配置
  editor.config.customUploadImg = async (resultFiles, insertImgFn) => {
    // resultFiles 是 input 中选中的文件列表
    // insertImgFn 是获取图片 url 后，插入到编辑器的方法
    const file = resultFiles[0];
    try {
      const response = await uploadReportImageToOSS(file);

      console.log("response", response)

      if (response.success) {
        const url = response.url;
        console.log("上传成功，尝试插入图片:", url);

        if (typeof insertImgFn === 'function') {
          try {
            insertImgFn(url);
          } catch (err) {
            console.warn('Failed to insert image into editor', err);
          }
        }
      } else {
        proxy.$message.error("图片上传失败：" + (response?.data?.message || "网络错误"));
      }
    } catch (err) {
      proxy.$message.error("图片上传失败");
    }
  }

  // 内容变化时回调
  editor.config.onchange = (html) => {
    // ⚠️ 安全 emit：防止组件已卸载
    if (!instance || instance.isUnmounted) return;

    emit('update:modelValue', html);
    emit('textChange', editor.txt.text());
  };

  // 创建编辑器
  editor.create();

  // 初始化内容
  if (props.modelValue) {
    editor.txt.html(props.modelValue);
  }
});

onBeforeUnmount(() => {
  if (instance) {
    instance.isUnmounted = true;
  }
  if (editor) editor.destroy();
});

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

// 修改上传图片方法以支持 Blob 类型（用于粘贴功能）
// const uploadImage = async (file, key) => {
//   try {
//     const result = await uploadTaskImageToOSS(file);
    
//     if (result.success) {
//       myformData.value[key].push(result.url);
//     } else {
//       proxy.$message.error(`图片上传失败: ${result.error}`);
//     }
//   } catch (error) {
//     console.error('上传失败:', error);
//     proxy.$message.error('图片上传失败');
//   }
// };

// 监听 modelValue 外部变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (editor && editor.txt.html() !== newVal) {
      editor.txt.html(newVal);
    }
  }
);

// 需要暴露给父组件的方法
defineExpose({
  editor,
  focus: () => editor?.focus()
});
</script>

<style scoped>
.rich-text-editor {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background-color: #fff;
  color: #333;
}
</style>