# 历史记录组件重构文档

## 概述

将历史记录功能从 aiDialog.vue 中抽象出来，创建了独立的 `HistorySidebar` 组件，使其可以被对话模式和编辑模式共用。

## 文件结构

```
doTask/src/views/ai/
├── aiDialog.vue                    # 主组件
└── components/
    └── HistorySidebar.vue          # 历史记录侧边栏组件（新增）
```

## HistorySidebar 组件

### Props

| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `history` | Array | ✓ | 历史记录数组 |
| `currentId` | Number | ✓ | 当前选中的记录索引 |
| `title` | String | - | 侧边栏标题（默认："历史记录"） |
| `newButtonText` | String | - | 新建按钮文本（默认："新建"） |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `select` | idx: number | 选中某条记录 |
| `delete` | idx: number | 删除某条记录 |
| `clear` | - | 清空所有记录 |
| `create-new` | - | 创建新记录 |

### 使用示例

```vue
<HistorySidebar
  :history="chatHistory"
  :current-id="currentSessionId"
  title="对话历史"
  new-button-text="新建对话"
  @select="switchSession"
  @delete="deleteSession"
  @clear="clearAllChatHistory"
  @create-new="createNewSession"
/>
```

## 对话模式（Chat Mode）

### 数据结构

```javascript
{
  id: number,              // 时间戳作为唯一ID
  title: string,           // 对话标题
  timestamp: string,       // 创建时间
  messages: Array          // 消息数组
}
```

### 关键方法

- `createNewSession()` - 创建新对话
- `switchSession(idx)` - 切换对话
- `deleteSession(idx)` - 删除对话
- `clearAllChatHistory()` - 清空所有对话
- `saveChatHistory()` - 保存到 localStorage
- `loadChatHistory()` - 从 localStorage 加载
- `updateSessionTitle()` - 更新对话标题

### 存储键

- localStorage 键：`ai_chat_history`

## 编辑模式（Canvas Mode）

### 数据结构

```javascript
{
  id: number,              // 时间戳作为唯一ID
  title: string,           // 编辑标题（从编辑指令生成）
  timestamp: string,       // 创建时间
  file: string,            // 编辑的文件路径
  content: string,         // 编辑后的文件内容
  prompt: string,          // 用户的编辑指令
  summary: string,         // AI 修改摘要
  before_content: string,  // 修改前内容
  after_content: string    // 修改后内容
}
```

### 关键方法

- `createNewEditSession()` - 创建新编辑会话
- `switchEditSession(idx)` - 切换编辑会话
- `deleteEditSession(idx)` - 删除编辑会话
- `clearAllEditHistory()` - 清空所有编辑历史
- `saveEditHistory()` - 保存到 localStorage
- `loadEditHistory()` - 从 localStorage 加载
- `updateEditSessionTitle(title)` - 更新编辑标题
- `rollbackVersion(idx)` - 回滚到指定版本

### 存储键

- localStorage 键：`ai_edit_history`

## 功能特性

### 共享特性

两种模式都支持：
- 创建新记录
- 切换记录
- 删除单条记录
- 清空所有记录
- 本地持久化存储
- 自动标题生成

### 对话模式特性

- 消息历史保存
- 自动从第一条消息生成标题
- 支持多轮对话

### 编辑模式特性

- 文件编辑历史
- 修改前后内容对比
- 版本回滚功能
- 最多保留 5 个版本

## 使用流程

### 对话模式

1. 初始化时自动创建第一个空对话
2. 用户发送消息
3. 第一条消息后自动生成对话标题
4. 可切换、删除、清空对话
5. 所有数据自动保存到 localStorage

### 编辑模式

1. 初始化时自动创建第一个空编辑会话
2. 用户选择文件
3. 输入编辑指令
4. AI 返回修改建议
5. 用户确认修改后保存到历史
6. 编辑标题自动从编辑指令生成
7. 支持回滚到任何历史版本

## 性能考虑

- 对话模式：无版本限制，消息数量无限制
- 编辑模式：最多保留 5 个版本，防止 localStorage 溢出
- 每次操作自动保存，确保数据不丢失

## 浏览器兼容性

- 依赖 localStorage API
- 支持所有现代浏览器
- 数据存储大小限制：通常 5-10MB

## 未来改进方向

- [ ] 对话/编辑搜索功能
- [ ] 导出/导入功能
- [ ] 分类/标签功能
- [ ] 云端同步
- [ ] 统计分析
- [ ] 快捷键支持
