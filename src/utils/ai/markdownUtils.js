import { marked } from 'marked'

/**
 * 检测文本是否包含 Markdown 格式
 * @param {string} text - 要检测的文本
 * @returns {boolean} - 是否包含 Markdown 格式
 */
export function hasMarkdown(text) {
  if (!text || typeof text !== 'string') return false
  
  // 检查常见的 Markdown 标记
  const markdownPatterns = [
    /^#{1,6}\s/m,           // 标题 # ## ### 等
    /\*\*.*?\*\*/,           // 粗体 **text**
    /\*.*?\*/,               // 斜体 *text*
    /__.*?__/,               // 粗体 __text__
    /_.*?_/,                 // 斜体 _text_
    /`[^`]+`/,               // 行内代码 `code`
    /```[\s\S]*?```/,        // 代码块 ```code```
    /^\s*[-*+]\s/m,          // 无序列表 - * +
    /^\s*\d+\.\s/m,          // 有序列表 1.
    /^\s*>\s/m,              // 引用 >
    /\[.*?\]\(.*?\)/,        // 链接 [text](url)
    /!\[.*?\]\(.*?\)/,       // 图片 ![alt](url)
    /\|.*?\|.*?\|/,          // 表格
    /^---+$/m,               // 分割线 ---
    /~~.*?~~/                // 删除线 ~~text~~
  ]
  
  return markdownPatterns.some(pattern => pattern.test(text))
}

/**
 * 将 Markdown 文本转换为 HTML
 * @param {string} markdown - Markdown 文本
 * @returns {string} - HTML 字符串
 */
export function markdownToHtml(markdown) {
  if (!markdown || typeof markdown !== 'string') return ''
  
  try {
    // 配置 marked 选项
    marked.setOptions({
      breaks: true,
      gfm: true,
      pedantic: false,
      sanitize: false
    })
    
    return marked(markdown)
  } catch (error) {
    console.error('Markdown 转换失败:', error)
    return markdown
  }
}

/**
 * 获取文本的渲染类型
 * @param {string} text - 要检测的文本
 * @returns {string} - 'markdown' 或 'plain'
 */
export function getContentType(text) {
  return hasMarkdown(text) ? 'markdown' : 'plain'
}
