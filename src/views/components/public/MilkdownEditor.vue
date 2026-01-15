<!-- src/components/editor/MilkdownEditor.vue -->
<template>
  <div class="milkdown-editor" :style="{ height: height }">
    <!-- 使用组件而非解构 -->
    <Editor />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, shallowRef } from 'vue';
// ✅ 正确导入方式
import { Editor } from '@milkdown/vue';
import { commonmark } from '@milkdown/preset-commonmark';
import { nord } from '@milkdown/theme-nord';
import { history } from '@milkdown/plugin-history';
import { tooltip } from '@milkdown/plugin-tooltip';
import { upload } from '@milkdown/plugin-upload';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  height: {
    type: String,
    default: '400px'
  },
  placeholder: {
    type: String,
    default: '请输入内容...'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// 存储编辑器实例
const editorInstance = shallowRef(null);

// 配置选项
const editorConfig = {
  defaultValue: props.modelValue,
  setup: (editor) => {
    editor
      .config((ctx) => {
        ctx.set(nord);
      })
      .use(commonmark)
      .use(history)
      .use(tooltip)
      .use(upload);
  }
};
</script>

<style scoped>
.milkdown-editor {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
}

.milkdown-editor :deep(.ProseMirror) {
  min-height: 300px;
  padding: 1rem;
  outline: none;
}

.milkdown-editor :deep(.ProseMirror-focused) {
  outline: none;
}

.milkdown-editor :deep(img) {
  max-width: 100%;
  height: auto;
}
</style>