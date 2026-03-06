# AI对话自动保存集成指南

## 概述

本指南说明如何在前端Vue应用中集成AI对话自动保存功能，使得每一轮对话完成后自动保存数据到后端。

## 文件结构

```
doTask/src/utils/ai/
├── aiChatHistoryService.js      # 后端API调用服务
├── useAiChatAutoSave.js         # Vue Composable Hook
├── chatAutoSaveHelper.js        # 自动保存辅助模块
└── aiDialog.vue                 # 对话组件（需要集成）
```

## 核心模块说明

### 1. aiChatHistoryService.js

提供所有后端API的调用接口，包括：

**会话管理API：**
- `createSession(sessionData)` - 创建新会话
- `getSessionsByUserId(userId, pageNum, pageSize)` - 获取用户会话列表
- `updateSessionTitle(sessionId, title)` - 更新会话标题
- `deleteSession(sessionId)` - 删除会话

**消息管理API：**
- `addMessage(messageData)` - 添加单条消息
- `batchAddMessages(messageDTOs)` - 批量添加消息
- `getMessagesBySessionId(sessionId, pageNum, pageSize)` - 获取会话消息
- `deleteMessage(messageId)` - 删除消息

**编辑历史API：**
- `recordEditHistory(historyData)` - 记录编辑历史
- `getHistoryBySessionId(sessionId, pageNum, pageSize)` - 获取编辑历史

### 2. useAiChatAutoSave.js

Vue 3 Composable Hook，提供自动保存的核心逻辑：

```javascript
const {
  sessionId,              // 当前会话ID
  currentSession,         // 当前会话信息
  isSaving,              // 是否正在保存
  autoSaveEnabled,       // 是否启用自动保存
  failedMessages,        // 失败的消息队列
  failedMessageCount,    // 失败消息数量
  
  initSession,           // 初始化会话
  saveMessage,           // 保存单条消息
  batchSaveMessages,     // 批量保存消息
  updateTitle,           // 更新会话标题
  updateSessionInfo,     // 更新会话信息
  retryFailedMessages,   // 重试失败消息
  clearFailedMessages,   // 清空失败队列
  setAutoSaveEnabled     // 启用/禁用自动保存
} = useAiChatAutoSave(userId)
```

### 3. chatAutoSaveHelper.js

高级辅助模块，提供更便捷的API：

```javascript
const manager = createChatAutoSaveManager(userId, {
  autoSaveEnabled: true,
  platform: 'openai',
  model: 'gpt-4'
})

// 初始化会话
await manager.initChatSession('新对话')

// 保存对话轮次
await manager.saveChatRound(userMessage, assistantMessage)

// 更新会话标题
await manager.updateChatSessionTitle('新标题')

// 保存编辑历史
await manager.saveEditHistory(editData)

// 处理失败消息
if (manager.hasFailedMessages()) {
  await manager.retryFailedMessages()
}
```

## 集成步骤

### 步骤1：在aiDialog.vue中导入模块

```javascript
import { createChatAutoSaveManager } from '@/utils/ai/chatAutoSaveHelper'
import { processMessageContent, generateSessionTitle } from '@/utils/ai/chatAutoSaveHelper'
```

### 步骤2：初始化自动保存管理器

在 `onMounted` 中初始化：

```javascript
onMounted(async () => {
  // ... 现有代码 ...
  
  // 获取用户ID（从sessionStorage或其他来源）
  const userId = sessionStorage.getItem('userId') // 需要根据实际情况修改
  
  // 初始化自动保存管理器
  chatAutoSaveManager.value = createChatAutoSaveManager(userId, {
    autoSaveEnabled: true,
    platform: apiConfig.value.platform,
    model: apiConfig.value.model
  })
  
  // 初始化第一个对话会话
  try {
    await chatAutoSaveManager.value.initChatSession('新对话')
  } catch (error) {
    console.error('初始化会话失败:', error)
  }
})
```

### 步骤3：在发送消息时自动保存

修改 `sendMessage` 函数：

```javascript
const sendMessage = async () => {
  if (!userInput.value.trim()) return

  const userMsg = userInput.value
  userInput.value = ''
  loading.value = true
  
  try {
    // 保存用户消息
    await chatAutoSaveManager.value.saveUserMessage(userMsg)
    
    // ... 调用AI API ...
    
    // 保存助手消息
    const assistantContent = extractThinkContent(response)
    await chatAutoSaveManager.value.saveAssistantMessage(assistantContent)
    
    // 如果是第一条消息，更新会话标题
    if (currentSession.messages.length === 2) {
      const title = generateSessionTitle(userMsg)
      await chatAutoSaveManager.value.updateChatSessionTitle(title)
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    // 处理失败消息
    if (chatAutoSaveManager.value.hasFailedMessages()) {
      console.warn('有消息保存失败，稍后将重试')
    }
  } finally {
    loading.value = false
  }
}
```

### 步骤4：处理编辑模式的自动保存

在 `confirmDiff` 函数中：

```javascript
const confirmDiff = async () => {
  if (!pendingDiff.value) return

  try {
    // ... 现有的文件保存逻辑 ...
    
    // 保存编辑历史到后端
    await chatAutoSaveManager.value.saveEditHistory({
      filePath: selectedFile.value,
      editPrompt: editPrompt.value,
      summary: pendingDiff.value.summary,
      beforeContent: fileContent.value,
      afterContent: newContent,
      diffJson: pendingDiff.value
    })
    
    // ... 其他逻辑 ...
  } catch (error) {
    console.error('确认修改失败:', error)
  }
}
```

### 步骤5：处理失败消息重试

添加定期重试机制：

```javascript
// 在onMounted中添加
onMounted(async () => {
  // ... 现有代码 ...
  
  // 每30秒检查一次是否有失败的消息需要重试
  setInterval(async () => {
    if (chatAutoSaveManager.value?.hasFailedMessages()) {
      console.log('检测到失败的消息，开始重试...')
      try {
        await chatAutoSaveManager.value.retryFailedMessages()
      } catch (error) {
        console.error('重试失败消息出错:', error)
      }
    }
  }, 30000)
})
```

## 数据结构

### 会话数据结构

```javascript
{
  id: Long,                    // 会话ID
  userId: Long,                // 用户ID
  sessionTitle: String,        // 会话标题
  mode: String,                // 对话模式：chat/canvas
  platform: String,            // AI平台
  model: String,               // 模型名称
  messageCount: Integer,       // 消息数量
  createdTime: DateTime,       // 创建时间
  updatedTime: DateTime,       // 更新时间
  isDeleted: Integer           // 是否删除
}
```

### 消息数据结构

```javascript
{
  id: Long,                    // 消息ID
  sessionId: Long,             // 会话ID
  role: String,                // 角色：user/assistant
  content: String,             // 消息内容
  hasThink: Integer,           // 是否包含思考过程
  thinkContent: String,        // 思考过程内容
  tokenCount: Integer,         // Token数量
  createdTime: DateTime        // 创建时间
}
```

### 编辑历史数据结构

```javascript
{
  id: Long,                    // 编辑历史ID
  sessionId: Long,             // 会话ID
  userId: Long,                // 用户ID
  filePath: String,            // 文件路径
  editPrompt: String,          // 编辑指令
  summary: String,             // 修改摘要
  beforeContent: String,       // 修改前内容
  afterContent: String,        // 修改后内容
  diffJson: String,            // 差异信息（JSON格式）
  createdTime: DateTime        // 创建时间
}
```

## 使用示例

### 示例1：基本的对话保存

```javascript
import { createChatAutoSaveManager } from '@/utils/ai/chatAutoSaveHelper'

export default {
  setup() {
    const userId = 123 // 从登录信息获取
    const manager = createChatAutoSaveManager(userId)
    
    const handleSendMessage = async (userMessage) => {
      // 初始化会话（第一次）
      if (!manager.getSessionId()) {
        await manager.initChatSession('新对话')
      }
      
      // 保存用户消息
      await manager.saveUserMessage(userMessage)
      
      // 调用AI API获取响应
      const response = await callAI(userMessage)
      
      // 保存助手消息
      await manager.saveAssistantMessage(response)
    }
    
    return { handleSendMessage }
  }
}
```

### 示例2：处理思考过程

```javascript
import { processMessageContent } from '@/utils/ai/chatAutoSaveHelper'

const response = await callAI(userMessage)
const processedContent = processMessageContent(response)

// 保存包含思考过程的消息
await manager.saveAssistantMessage(processedContent)
```

### 示例3：错误处理和重试

```javascript
try {
  await manager.saveChatRound(userMessage, assistantMessage)
} catch (error) {
  console.error('保存失败:', error)
  
  // 检查是否有失败的消息
  if (manager.hasFailedMessages()) {
    console.log(`有 ${manager.getFailedMessageCount()} 条消息保存失败`)
    
    // 稍后重试
    setTimeout(async () => {
      const retried = await manager.retryFailedMessages()
      console.log(`重试成功 ${retried.length} 条消息`)
    }, 5000)
  }
}
```

## 配置选项

### 自动保存管理器配置

```javascript
const manager = createChatAutoSaveManager(userId, {
  // 是否启用自动保存（默认true）
  autoSaveEnabled: true,
  
  // AI平台（默认openai）
  platform: 'openai',
  
  // 模型名称（默认空字符串）
  model: 'gpt-4'
})
```

## 常见问题

### Q1: 如何禁用自动保存？

```javascript
manager.setAutoSaveEnabled(false)
```

### Q2: 如何检查是否有失败的消息？

```javascript
if (manager.hasFailedMessages()) {
  console.log(`有 ${manager.getFailedMessageCount()} 条消息失败`)
}
```

### Q3: 如何手动重试失败的消息？

```javascript
const retried = await manager.retryFailedMessages()
console.log(`重试成功 ${retried.length} 条消息`)
```

### Q4: 如何获取当前会话ID？

```javascript
const sessionId = manager.getSessionId()
```

### Q5: 如何更新会话标题？

```javascript
await manager.updateChatSessionTitle('新标题')
```

## 性能优化建议

1. **批量保存**：如果需要保存多条消息，使用 `batchSaveMessages` 而不是逐条保存
2. **异步处理**：消息保存是异步的，不会阻塞UI
3. **失败重试**：自动重试机制会处理临时网络问题
4. **本地缓存**：可以结合localStorage实现本地缓存，提高用户体验

## 后端API端点

所有API端点都在 `/api/ai/` 路径下：

- 会话管理：`/api/ai/session/*`
- 消息管理：`/api/ai/message/*`
- 编辑历史：`/api/ai/editHistory/*`

详见后端接口文档。

## 故障排查

### 问题1：消息保存失败

检查：
1. 用户ID是否正确
2. 会话是否已初始化
3. 网络连接是否正常
4. 后端服务是否运行

### 问题2：自动保存没有触发

检查：
1. 是否调用了 `initChatSession`
2. 是否启用了自动保存（`autoSaveEnabled`）
3. 是否有JavaScript错误

### 问题3：消息重复保存

原因可能是：
1. 多次调用了保存函数
2. 网络重试导致的重复请求

解决方案：
1. 添加防抖处理
2. 检查调用逻辑

## 相关文件

- 后端实体类：`pet-task/src/main/java/com/xxl/miaowu/domain/table/`
- 后端API：`pet-task/src/main/java/com/xxl/miaowu/controller/`
- 数据库脚本：`pet-task/doc/AI对话历史记录.sql`
