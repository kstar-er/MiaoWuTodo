# AI对话功能实现文档

## 概述
为宠物应用增加了AI文档编辑能力，用户可以在两种模式之间切换：
- **对话模式（Chat Mode）**：用于自由对话、咨询、讨论文档内容
- **编辑模式（Canvas Mode）**：用于对当前文件进行AI协作编辑，并生成可确认的修改结果（diff）

## 实现内容

### 1. 菜单栏集成
**文件**: `doTask/src/views/pet/components/ContextMenu.vue`

在宠物右键菜单中添加了"AI对话"选项，点击可打开AI对话窗口。

**新增菜单项**:
```vue
<div class="menu-item" @click="handleAIDialog">
  <span>AI对话</span>
</div>
```

**新增处理函数**:
```javascript
const handleAIDialog = async () => {
  try {
    await createAIDialogWin();
    closeMenu();
  } catch (error) {
    console.error('打开AI对话窗口失败:', error);
  }
};
```

### 2. 窗口管理
**文件**: `doTask/src/multiwins/action.js`

新增 `createAIDialogWin()` 函数用于创建AI对话窗口：

```javascript
export async function createAIDialogWin() {
  const args = {
    label: "ai_dialog",
    url: "index.html#/ai-dialog",
    title: "AI对话",
    width: 600,
    height: 700,
    resizable: true,
    center: true,
    visible: false,
    alwaysOnTop: false,
    decorations: false,
    theme: 'Dark'
  };
  // ... 窗口创建逻辑
}
```

### 3. 路由配置
**文件**: `doTask/src/router/index.js`

添加AI对话路由：
```javascript
{
  path: '/ai-dialog',
  name: 'aiDialog',
  component: () => import('../views/ai/aiDialog.vue'),
  meta: {
    title: 'AI对话'
  }
}
```

### 4. AI对话组件
**文件**: `doTask/src/views/ai/aiDialog.vue`

完整的AI对话窗口组件，包含以下功能：

#### 4.1 对话模式（Chat Mode）
- 消息历史显示
- 用户输入框
- 实时消息发送
- 支持Ctrl+Enter快速发送

#### 4.2 编辑模式（Canvas Mode）
- 文件选择器（支持多种文件格式）
- 文件内容预览
- 编辑指令输入
- AI修改预览（diff展示）
- 修改确认/拒绝功能
- 版本历史管理（保留最近3个版本）
- 版本回滚功能

#### 4.3 核心功能

**模式切换**:
```javascript
const switchMode = (mode) => {
  currentMode.value = mode
}
```

**文件操作**:
- 打开文件对话框选择文件
- 读取文件内容
- 保存修改后的文件

**版本管理**:
- 每次修改生成版本记录
- 版本包含：版本ID、时间戳、用户Prompt、修改摘要、修改前后内容
- 支持回滚到任意版本

**AI API调用**:
```javascript
const callAIAPI = async (prompt, mode) => {
  // 支持自定义API端点、模型、API密钥
  // 对话模式和编辑模式使用不同的System Prompt
}
```

## 使用流程

### 对话模式
1. 点击宠物右键菜单 → "AI对话"
2. 选择"对话模式"标签
3. 在输入框输入问题
4. 按Ctrl+Enter或点击"发送"按钮
5. 查看AI回复

### 编辑模式
1. 点击宠物右键菜单 → "AI对话"
2. 选择"编辑模式"标签
3. 点击"浏览"按钮选择要编辑的文件
4. 在"编辑指令"框输入编辑要求
5. 点击"应用修改"按钮
6. 查看修改预览（diff）
7. 点击"确认修改"应用更改或"拒绝修改"取消
8. 在版本历史中查看和管理版本

## 配置说明

### API配置
组件从localStorage读取以下配置：
- `ai_endpoint`: AI API端点URL
- `ai_model`: 使用的模型名称
- `ai_api_key`: API密钥（可选）

### 支持的文件格式
- 文本文件: `.txt`
- Markdown: `.md`
- JavaScript: `.js`
- Vue: `.vue`
- Python: `.py`
- Java: `.java`
- 所有文件: `*`

## 数据结构

### 聊天消息
```javascript
{
  role: 'user' | 'assistant',
  content: string
}
```

### 修改差异（Diff）
```javascript
{
  summary: string,        // 修改摘要
  changes: [
    {
      type: 'replace',    // 操作类型
      start: number,      // 起始位置
      end: number,        // 结束位置
      new_text: string    // 新文本
    }
  ]
}
```

### 版本记录
```javascript
{
  version_id: string,           // 版本ID (v1, v2, ...)
  timestamp: string,            // 时间戳
  prompt: string,               // 用户Prompt
  summary: string,              // 修改摘要
  before_content: string,       // 修改前内容
  after_content: string         // 修改后内容
}
```

## 技术细节

### 编辑模式的System Prompt
```
你是一个文档编辑助手。
用户会提供文件内容和编辑指令。
你必须返回JSON格式的修改指令。
禁止输出任何解释性文本。

返回格式：
{
  "summary": "...",
  "changes": [
    {
      "type": "replace",
      "start": number,
      "end": number,
      "new_text": "..."
    }
  ]
}
```

### 版本保留策略
- 最多保留最近3个版本
- 每次修改（包括回滚）都会生成新版本
- 超过3个版本时，自动删除最旧的版本

## 文件清单

| 文件 | 说明 |
|------|------|
| `doTask/src/views/ai/aiDialog.vue` | AI对话主组件 |
| `doTask/src/views/pet/components/ContextMenu.vue` | 宠物菜单（已修改） |
| `doTask/src/multiwins/action.js` | 窗口管理（已修改） |
| `doTask/src/router/index.js` | 路由配置（已修改） |

## 后续扩展建议

1. **API配置界面**: 添加设置页面让用户配置API端点、模型、密钥
2. **更多操作类型**: 支持insert、delete等操作类型
3. **文件对比**: 显示修改前后的完整对比
4. **快捷键**: 添加更多快捷键支持
5. **本地存储**: 将版本历史持久化到本地数据库
6. **多文件编辑**: 支持同时编辑多个文件
7. **AI模型选择**: 支持切换不同的AI模型
8. **修改确认阈值**: 当修改超过50%时提示确认

## 注意事项

1. 需要配置有效的AI API端点才能使用
2. 编辑模式要求AI返回有效的JSON格式
3. 版本历史仅在当前会话中保留，刷新后会丢失
4. 文件操作需要相应的文件系统权限
