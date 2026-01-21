<template>
  <div class="code-editor">
    <!-- 使用导入的 Codemirror 组件 -->
    <!-- <Codemirror
      v-model:value="props.value"
      :autofocus="true"
      :placeholder="placeholder"
      :indent-with-tab="true"
      :tabSize="4"
      :lineWrapping="true"
      :style="{ height: '300px', border: '1px solid #ddd', borderRadius: '4px' }"
      :extensions="extensions"
    /> -->
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
// import { EditorView } from '@codemirror/view'; // 用于自定义视图配置
// import { Codemirror } from 'vue-codemirror'; // 引入组件

const props = defineProps({
  value: { type: String, default: '' },
  language: { type: String, default: 'html' },
  theme: { type: String, default: 'dark' },
  placeholder: { type: String, default: '请输入代码...' }
});

const emit = defineEmits(['input']);

// 语法高亮语言扩展
const extensions = computed(() => {
  const langs = {
    html: html(),
    javascript: javascript(),
    js: javascript()
  };
  const lang = langs[props.language] || html();
  return [lang, props.theme === 'dark' ? oneDark : []];
});

watch(() => props.value, (newVal) => {
  emit('input', newVal);
});
</script>