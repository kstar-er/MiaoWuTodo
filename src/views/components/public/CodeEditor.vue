<template>
  <div class="code-editor">
    <ClientOnly>
      <codemirror
        v-model:value="props.value"
        :autofocus="true"
        :placeholder="placeholder"
        :indent-with-tab="true"
        :tabSize="4"
        :lineWrapping="true"
        :style="{ height: '300px', border: '1px solid #ddd', borderRadius: '4px' }"
        :extensions="extensions"
      />
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';

const props = defineProps({
  value: { type: String, default: '' },
  language: { type: String, default: 'html' },
  theme: { type: String, default: 'dark' },
  placeholder: { type: String, default: '请输入代码...' }
});

const emit = defineEmits(['input']);

// 根据语言选择语法高亮
const extensions = computed(() => {
  const langs = {
    html: html(),
    javascript: javascript(),
    js: javascript()
  };
  const lang = langs[props.language] || html();
  return [lang, props.theme === 'dark' ? oneDark : null];
});

watch(() => props.value, (newVal) => {
  // 外部更新时同步
}, { immediate: true });
</script>

<style scoped>
.code-editor {
  width: 100%;
}
</style>