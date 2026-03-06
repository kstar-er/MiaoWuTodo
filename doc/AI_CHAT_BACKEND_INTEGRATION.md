# AI对话后端集成完整指南

## 概述

本文档说明如何在aiDialog.vue中完整集成后端API，实现以下功能：
1. 打开窗口时自动加载历史记录
2. 点击历史记录返回对话详情
3. 对话完毕后自动保存到后端

## 集成完成的功能

### 1. 窗口打开时加载历史记录

在 `onMounted` 中自动执行：

```javascript
// 获取用户ID
userId.value = sessionStorage.getItem('userId')

// 初始化自动保存管理器
if (userId.value) {
  chatAutoSaveManager.value = createChatAutoSaveManager(userId.value, {
    autoSaveEnabled: true,
    platform: apiConfig.value.platform,
    model: apiConfig.value.model
  })
}

// 从后端加载历史记录
if (userId.value) {
  await loadHistoryFromBackend()
}
```

**流程：**
1. 获取用户ID（从sessionStorage）
2. 初始化自动保存管理器
3. 调用 `getSessionListByUserId` 获取所有会话
4. 对每个会话调用 `getMessageListBySessionId` 获取消息
5. 将后端数据转换为前端格式并显示

### 2. 点击历史记录返回对话详情

在 `switchSession` 中实现：

```javascript
const switchSession = (idx) => {
  currentSessionId.value = idx
  // 自动加载该会话的消息（已在后端加载时完成）
}
```

**工作原理：**
- 历史记录已在窗口打开时从后端加载
- 点击历史记录只需切换 `currentSessionId`
- 对应的消息会通过 `currentChatMessages` 计算属性自动显示

### 3. 对话完毕后自动保存

在 `sendMessage` 中实现：

```javascript
// 保存用户消息到后端
if (chatAutoSaveManager.value && currentSession.backendId) {
  await chatAutoSaveManager.value.saveUserMessage(userMsg)
}

// ... 调用AI API ...

// 保存助手消息到后端
if (chatAutoSaveManager.value && currentSession.backendId) {
  await chatAutoSaveManager.value.saveAssistantMessage(finalContent)
}

// 更新会话标题
if (currentSession.messages.length === 2) {
  const title = generateSessionTitle(userMsg)
  await chatAutoSaveManager.value.updateChatSessionTitle(title)
}
```

## 数据流转

### 打开窗口时的数据流

```
用户打开窗口
    ↓
获取userId (sessionStorage)
    ↓
初始化chatAutoSaveManager
    ↓
调用 getSessionListByUserId(userId)
    ↓
获取所有会话列表
    ↓
对每个会话调用 getMessageListBySessionId(sessionId)
    ↓
获取该会话的所有消息
    ↓
转换数据格式
    ↓
显示在HistorySidebar中
```

### 发送消息时的数据流

```
用户输入消息
    ↓
点击发送按钮
    ↓
保存用户消息到本地
    ↓
调用 saveUserMessage(userMsg) 保存到后端
    ↓
调用AI API获取响应
    ↓
保存助手消息到本地
    ↓
调用 saveAssistantMessage(response) 保存到后端
    ↓
如果是第一条消息，更新会话标题
    ↓
调用 updateChatSessionTitle(title) 更新后端
```

## 关键数据结构

### 前端会话格式

```javascript
{
  id: Number,              // 本地ID (Date.now())
  title: String,           // 会话标题
  timestamp: String,       // 创建时间
  backendId: Long,         // 后端会话ID（用于保存消息）
  messages: [
    {
      role: 'user' | 'assistant',
      content: String | Object  // 可能包含思考过程
    }
  ]
}
```

### 后端会话格式

```javascript
{
  id: Long,                    // 会话ID
  userId: Long,                // 用户ID
  sessionTitle: String,        // 会话标题
  mode: String,                // 对话模式
  platform: String,            // AI平台
  model: String,               // 模型名称
  messageCount: Integer,       // 消息数量
  createdTime: DateTime,       // 创建时间
  updatedTime: DateTime,       // 更新时间
  isDeleted: Integer           // 是否删除
}
```

### 后端消息格式

```javascript
{
  id: Long,                    // 消息ID
  sessionId: Long,             // 会话ID
  role: String,                // user | assistant
  content: String,             // 消息内容
  hasThink: Integer,           // 是否包含思考过程
  thinkContent: String,        // 思考过程内容
  tokenCount: Integer,         // Token数量
  createdTime: DateTime        // 创建时间
}
```

## API调用时序

### 初始化时序

```
1. onMounted()
   ├─ 获取userId
   ├─ 初始化chatAutoSaveManager
   └─ loadHistoryFromBackend()
      ├─ getSessionListByUserId(userId)
      │  └─ 返回: [session1, session2, ...]
      └─ 对每个session:
         └─ getMessageListBySessionId(sessionId)
            └─ 返回: [message1, message2, ...]
```

### 发送消息时序

```
1. sendMessage()
   ├─ 保存用户消息到本地
   ├─ saveUserMessage(userMsg)
   │  └─ POST /api/ai/message/add
   ├─ 调用AI API
   ├─ 保存助手消息到本地
   ├─ saveAssistantMessage(response)
   │  └─ POST /api/ai/message/add
   └─ 如果是第一条消息:
      └─ updateChatSessionTitle(title)
         └─ PUT /api/ai/session/{sessionId}/title
```

## 错误处理

### 加载历史记录失败

```javascript
try {
  await loadHistoryFromBackend()
} catch (error) {
  console.error('从后端加载历史记录失败:', error)
  // 降级处理：创建新会话
  if (chatHistory.value.length === 0) {
    createNewSession()
  }
}
```

### 保存消息失败

```javascript
try {
  await chatAutoSaveManager.value.saveUserMessage(userMsg)
} catch (error) {
  console.error('保存用户消息到后端失败:', error)
  // 消息仍保存在本地，可稍后重试
}
```

### 失败消息重试

```javascript
// 检查是否有失败的消息
if (chatAutoSaveManager.value.hasFailedMessages()) {
  // 稍后重试
  setTimeout(async () => {
    await chatAutoSaveManager.value.retryFailedMessages()
  }, 5000)
}
```

## 配置说明

### 用户ID获取

用户ID需要从以下来源获取（优先级从高到低）：

1. **sessionStorage** - 登录后保存的用户ID
   ```javascript
   const userId = sessionStorage.getItem('userId')
   ```

2. **登录事件** - 通过Tauri事件监听
   ```javascript
   await listen('login-info', (event) => {
     userId.value = event.payload?.userId
   })
   ```

3. **Vuex/Pinia** - 如果使用状态管理
   ```javascript
   const userId = store.state.user.id
   ```

### 自动保存配置

```javascript
const manager = createChatAutoSaveManager(userId, {
  autoSaveEnabled: true,      // 是否启用自动保存
  platform: 'openai',         // AI平台
  model: 'gpt-4'              // 模型名称
})
```

## 常见问题

### Q1: 为什么历史记录没有加载？

**检查清单：**
1. 用户ID是否正确获取？
   ```javascript
   console.log('userId:', userId.value)
   ```

2. 后端API是否正常运行？
   ```javascript
   // 在浏览器控制台测试
   fetch('/api/ai/session/listAll?userId=123')
   ```

3. 是否有网络错误？
   ```javascript
   // 查看浏览器Network标签
   ```

### Q2: 为什么消息没有保存到后端？

**检查清单：**
1. 会话是否有backendId？
   ```javascript
   console.log('backendId:', currentSession.backendId)
   ```

2. 自动保存是否启用？
   ```javascript
   console.log('autoSaveEnabled:', chatAutoSaveManager.value.isAutoSaveEnabled())
   ```

3. 是否有API错误？
   ```javascript
   // 查看浏览器控制台的错误信息
   ```

### Q3: 如何手动重试失败的消息？

```javascript
if (chatAutoSaveManager.value.hasFailedMessages()) {
  const retried = await chatAutoSaveManager.value.retryFailedMessages()
  console.log(`重试成功 ${retried.length} 条消息`)
}
```

### Q4: 如何禁用自动保存？

```javascript
chatAutoSaveManager.value.setAutoSaveEnabled(false)
```

### Q5: 如何查看当前会话的后端ID？

```javascript
const currentSession = chatHistory.value[currentSessionId.value]
console.log('后端会话ID:', currentSession.backendId)
```

## 调试技巧

### 1. 启用详细日志

在 `aiDialog.vue` 中添加：

```javascript
// 在 onMounted 中
console.log('=== AI对话窗口初始化 ===')
console.log('userId:', userId.value)
console.log('chatAutoSaveManager:', chatAutoSaveManager.value)
```

### 2. 监控API调用

在浏览器开发者工具中：

```javascript
// Network标签查看所有API请求
// 检查请求头、响应状态、响应体
```

### 3. 检查本地存储

```javascript
// 在浏览器控制台
localStorage.getItem('ai_chat_history')
sessionStorage.getItem('userId')
```

### 4. 测试后端API

```bash
# 获取用户会话列表
curl -X GET "http://localhost:9820/api/ai/session/listAll?userId=123"

# 获取会话消息
curl -X GET "http://localhost:9820/api/ai/message/listAll?sessionId=456"

# 添加消息
curl -X POST "http://localhost:9820/api/ai/message/add" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": 456,
    "role": "user",
    "content": "Hello"
  }'
```

## 性能优化

### 1. 批量加载

如果会话很多，可以使用分页：

```javascript
const sessions = await getSessionsByUserId(userId, 1, 10)
```

### 2. 延迟加载消息

只在用户点击会话时加载消息：

```javascript
const switchSession = async (idx) => {
  currentSessionId.value = idx
  // 如果消息未加载，则加载
  if (!chatHistory.value[idx].messagesLoaded) {
    const messages = await getMessageListBySessionId(
      chatHistory.value[idx].backendId
    )
    chatHistory.value[idx].messages = messages
    chatHistory.value[idx].messagesLoaded = true
  }
}
```

### 3. 异步保存

消息保存不阻塞UI：

```javascript
// 异步保存，不等待结果
chatAutoSaveManager.value.saveUserMessage(userMsg).catch(error => {
  console.error('保存失败:', error)
})
```

## 相关文件

- 前端服务：`doTask/src/utils/ai/aiChatHistoryService.js`
- 前端Hook：`doTask/src/utils/ai/useAiChatAutoSave.js`
- 前端助手：`doTask/src/utils/ai/chatAutoSaveHelper.js`
- 对话组件：`doTask/src/views/ai/aiDialog.vue`
- 后端控制器：`pet-task/src/main/java/com/xxl/miaowu/controller/AiChatSessionController.java`
- 后端服务：`pet-task/src/main/java/com/xxl/miaowu/service/AiChatSessionService.java`
- 数据库脚本：`pet-task/doc/AI对话历史记录.sql`

## 下一步

1. **测试集成** - 在开发环境中测试所有功能
2. **性能测试** - 测试大量历史记录的加载性能
3. **错误处理** - 完善网络错误和异常情况的处理
4. **用户体验** - 添加加载动画、错误提示等
5. **生产部署** - 部署到生产环境并监控
