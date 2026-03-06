<template>
  <div class="markdown-content" v-html="renderedHtml"></div>
</template>

<script setup>
import { computed } from 'vue'
import { markdownToHtml } from '@/utils/ai/markdownUtils'

const props = defineProps({
  content: {
    type: String,
    required: true
  }
})

const renderedHtml = computed(() => {
  return markdownToHtml(props.content)
})
</script>

<style lang="less" scoped>
.markdown-content {
  // 标题样式
  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 12px 0 8px 0;
    color: #80695b;
    font-weight: 600;
    line-height: 1.4;
  }

  :deep(h1) {
    font-size: 24px;
    border-bottom: 2px solid #d9bfb8;
    padding-bottom: 8px;
  }

  :deep(h2) {
    font-size: 20px;
  }

  :deep(h3) {
    font-size: 18px;
  }

  :deep(h4) {
    font-size: 16px;
  }

  :deep(h5),
  :deep(h6) {
    font-size: 14px;
  }

  // 段落样式
  :deep(p) {
    margin: 8px 0;
    line-height: 1.6;
    color: #80695b;
  }

  // 强调样式
  :deep(strong),
  :deep(b) {
    color: #8b4513;
    font-weight: 600;
  }

  :deep(em),
  :deep(i) {
    color: #80695b;
    font-style: italic;
  }

  // 代码样式
  :deep(code) {
    background: #f0e6e0;
    color: #8b4513;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
  }

  :deep(pre) {
    background: #f0e6e0;
    border-left: 3px solid #8b4513;
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 10px 0;

    :deep(code) {
      background: transparent;
      color: #80695b;
      padding: 0;
      font-size: 12px;
    }
  }

  // 列表样式
  :deep(ul),
  :deep(ol) {
    margin: 8px 0;
    padding-left: 24px;
    color: #80695b;

    :deep(li) {
      margin: 4px 0;
      line-height: 1.6;
    }
  }

  :deep(ul) {
    list-style-type: disc;
  }

  :deep(ol) {
    list-style-type: decimal;
  }

  // 引用样式
  :deep(blockquote) {
    border-left: 4px solid #8b4513;
    padding-left: 12px;
    margin: 10px 0;
    color: #80695b;
    font-style: italic;
    background: #f0e6e0;
    padding: 8px 12px;
    border-radius: 4px;
  }

  // 链接样式
  :deep(a) {
    color: #8b4513;
    text-decoration: none;
    border-bottom: 1px solid #8b4513;
    transition: all 0.3s;

    &:hover {
      color: #a0522d;
      border-bottom-color: #a0522d;
    }
  }

  // 图片样式
  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 8px 0;
  }

  // 表格样式
  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 10px 0;
    font-size: 13px;

    :deep(th),
    :deep(td) {
      border: 1px solid #d9bfb8;
      padding: 8px 12px;
      text-align: left;
    }

    :deep(th) {
      background: #f0e6e0;
      color: #8b4513;
      font-weight: 600;
    }

    :deep(tr:nth-child(even)) {
      background: #fbf2c450;
    }
  }

  // 删除线样式
  :deep(del) {
    color: #c9b1a7;
    text-decoration: line-through;
  }

  // 分割线样式
  :deep(hr) {
    border: none;
    border-top: 2px solid #d9bfb8;
    margin: 12px 0;
  }
}
</style>
