<template>
  <div class="ai-dialog-container">
    <!-- 模式切换 - 使用customDragWindow包装可拖动header -->
    <customDragWindow>
      <template #header>
        <div class="header-content">
          <div class="header-left">
            <div class="mode-label">{{ currentMode === 'chat' ? '对话模式' : '编辑模式' }}</div>
            <div class="switch-container">
              <input 
                type="checkbox" 
                :checked="currentMode === 'canvas'"
                @change="toggleMode"
                class="switch-input"
                id="mode-switch"
              />
              <label for="mode-switch" class="switch-label"></label>
            </div>
            <div v-if="shouldShowModelInHeader" class="current-model">
              {{ getCurrentModelDisplay() }}
            </div>
          </div>
          <div class="header-right">
            <button class="settings-btn" @click="openSettings" title="AI配置">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"></path>
              </svg>
            </button>
            <button class="close-btn" @click="closeWindow" title="关闭窗口">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </template>
    </customDragWindow>

    <!-- 设置模态框 -->
    <div v-if="showSettings" class="settings-modal-overlay" @click="showSettings = false">
      <div class="settings-modal" @click.stop>
        <div class="settings-header">
          <h3>AI配置</h3>
          <button class="close-btn" @click="showSettings = false">×</button>
        </div>
        <div class="settings-notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>配置信息仅缓存在本地浏览器，不会上传到服务器</span>
        </div>
        <div class="settings-content">
          <div class="setting-item">
            <label>连接平台：</label>
            <select v-model="tempApiConfig.platform" @change="onPlatformChange" class="platform-select">
              <template v-for="(platforms, category) in platformsByCategory" :key="category">
                <optgroup :label="platformCategories[category]">
                  <option v-for="platform in platforms" :key="platform.id" :value="platform.id">
                    {{ platform.name }}
                  </option>
                </optgroup>
              </template>
            </select>
          </div>
          <div class="setting-item">
            <label>{{ platformLabels[tempApiConfig.platform]?.endpoint || 'API端点' }}：</label>
            <div class="endpoint-input-group">
              <input 
                v-model="tempApiConfig.endpoint"
                type="text"
                :placeholder="platformLabels[tempApiConfig.platform]?.placeholder || '输入API端点'"
              />
              <button 
                v-if="tempApiConfig.endpoint && !platformLabels[tempApiConfig.platform]?.hideModelSelector" 
                @click="fetchAvailableModels"
                class="fetch-models-btn"
                :disabled="fetchingModels"
              >
                {{ fetchingModels ? '加载中...' : '获取模型' }}
              </button>
            </div>
            <div v-if="modelError" class="error-message">{{ modelError }}</div>
          </div>
          <div class="setting-item" v-if="!platformLabels[tempApiConfig.platform]?.hideModelSelector">
            <label>模型名称：</label>
            <select v-model="tempApiConfig.model" v-if="availableModels.length > 0" class="model-select">
              <option value="">-- 选择模型 --</option>
              <option v-for="model in availableModels" :key="model" :value="model">
                {{ model }}
              </option>
            </select>
            <input 
              v-else
              v-model="tempApiConfig.model"
              type="text"
              :placeholder="platformLabels[tempApiConfig.platform]?.modelPlaceholder || '输入模型名称'"
            />
          </div>
          <div class="setting-item" v-if="platformLabels[tempApiConfig.platform]?.note">
            <div class="platform-note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              {{ platformLabels[tempApiConfig.platform].note }}
            </div>
          </div>
          <div class="setting-item">
            <label>{{ platformLabels[tempApiConfig.platform]?.keyLabel || 'API密钥' }}（可选）：</label>
            <input 
              v-model="tempApiConfig.apiKey"
              type="password"
              :placeholder="platformLabels[tempApiConfig.platform]?.keyPlaceholder || '输入API密钥（如果需要）'"
            />
          </div>
        </div>
        <div class="settings-footer">
          <button class="cancel-btn" @click="showSettings = false">取消</button>
          <button class="save-btn" @click="saveSettings">保存</button>
        </div>
      </div>
    </div>

    <!-- 对话模式 -->
    <div v-if="currentMode === 'chat'" class="main-content">
      <!-- 对话模式左侧历史 -->
      <HistorySidebar
        :history="chatHistory"
        :current-id="currentSessionId"
        title="对话历史"
        new-button-text="新建对话"
        @select="switchSession"
        @delete="deleteSession"
        @clear="clearAllChatHistory"
        @create-new="createNewSession"
        @refresh="refreshChatHistory"
      />

      <!-- 对话区域 -->
      <div class="chat-mode">
        <div class="messages-container">
          <div 
            v-for="(msg, idx) in currentChatMessages" 
            :key="idx"
            :class="['message', msg.role]"
          >
            <!-- 纯文本消息 -->
            <div v-if="typeof msg.content === 'string'" class="message-content">
              <MarkdownContent v-if="hasMarkdown(msg.content)" :content="msg.content" />
              <span v-else>{{ msg.content }}</span>
            </div>
            <!-- 包含思考过程的消息 -->
            <div v-else class="message-content-with-think">
              <div v-if="msg.content.hasThink" class="think-section" :class="{ 'incomplete': !msg.content.isComplete }">
                <div class="think-header">💭 思考过程</div>
                <div class="think-content">{{ msg.content.think }}</div>
              </div>
              <div v-if="msg.content.content" class="main-content-section">
                <MarkdownContent v-if="hasMarkdown(msg.content.content)" :content="msg.content.content" />
                <span v-else>{{ msg.content.content }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="input-area">
          <textarea 
            v-model="userInput"
            placeholder="输入您的问题..."
            @keydown="handleTextareaKeydown"
          ></textarea>
          <div class="button-group">
            <!-- 发送按钮 -->
            <button 
              v-if="!loading"
              @click="sendMessage" 
              :disabled="!userInput.trim()"
              class="action-btn send-btn"
              title="发送消息 (Enter)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346272 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.99701575 L3.03521743,10.4380088 C3.03521743,10.5951061 3.19218622,10.7522035 3.50612381,10.7522035 L16.6915026,11.5376905 C16.6915026,11.5376905 17.1624089,11.5376905 17.1624089,12.0089827 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z"/>
              </svg>
            </button>
            <!-- 暂停按钮 -->
            <button 
              v-else
              @click="pauseMessage" 
              class="action-btn pause-btn"
              title="暂停接收消息"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑模式 -->
    <div v-if="currentMode === 'canvas'" class="canvas-mode">
      <div v-if="selectedFile" class="canvas-content">
        <div class="file-content">
          <h4>文件内容</h4>
          <div class="content-preview">{{ fileContent }}</div>
        </div>

        <div class="edit-prompt">
          <label>编辑指令：</label>
          <textarea 
            v-model="editPrompt"
            placeholder="请输入编辑指令，例如：请帮我优化这段文字，使更正式"
          ></textarea>
        </div>

        <div class="action-buttons">
          <button @click="applyEdit" :disabled="!editPrompt.trim() || loading">
            {{ loading ? '处理中...' : '应用修改' }}
          </button>
        </div>

        <!-- 修改预览 -->
        <div v-if="pendingDiff" class="diff-preview">
          <h4>修改预览</h4>
          <div class="diff-summary">{{ pendingDiff.summary }}</div>
          <div class="diff-content">
            <div v-for="(change, idx) in pendingDiff.changes" :key="idx" class="change">
              <div class="change-type">{{ change.type }}</div>
              <div class="change-text">{{ change.new_text }}</div>
            </div>
          </div>
          <div class="diff-actions">
            <button @click="confirmDiff" class="confirm-btn">确认修改</button>
            <button @click="rejectDiff" class="reject-btn">拒绝修改</button>
          </div>
        </div>

        <!-- 版本历史 -->
        <div class="version-history">
          <h4>编辑历史</h4>
          <div v-if="editHistory.length === 0" class="no-versions">暂无编辑记录</div>
          <div v-else class="versions-list">
            <div 
              v-for="(version, idx) in editHistory" 
              :key="idx"
              class="version-item"
            >
              <div class="version-header">
                <span class="version-id">{{ version.title }}</span>
                <span class="version-time">{{ version.timestamp }}</span>
              </div>
              <div class="version-summary">{{ version.summary }}</div>
              <button @click="rollbackVersion(idx)" class="rollback-btn">回滚</button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="no-file-selected">
        请先选择一个文件进入编辑模式
      </div>

      <!-- 文件选择侧边栏 -->
      <FileSelectorSidebar 
        :selected-file="selectedFile"
        @select="onFileSelected"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, reactive } from 'vue'
import { listen } from '@tauri-apps/api/event'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { getCurrentWindow } from '@tauri-apps/api/window'
import HistorySidebar from './components/HistorySidebar.vue'
import MarkdownContent from './components/MarkdownContent.vue'
import FileSelectorSidebar from './components/FileSelectorSidebar.vue'
import customDragWindow from '../components/public/customDragWindow.vue'
import { platformConfigs, platformCategories, getPlatformsByCategory, fetchAvailableModels as fetchModelsFromAPI, callAIAPI, extractThinkContent } from '@/utils/ai/platformConfig'
import { hasMarkdown } from '@/utils/ai/markdownUtils'
import { createChatAutoSaveManager, generateSessionTitle, processMessageContent } from '@/utils/ai/chatAutoSaveHelper'
import { getSessionListByUserId, getMessageListBySessionId, deleteSession as deleteSessionAPI } from '@/utils/ai/aiChatHistoryService'

defineOptions({ name: 'AIDialog' })

// 状态
const currentMode = ref(localStorage.getItem('ai_current_mode') || 'chat')
const userInput = ref('')
const loading = ref(false)
const showSettings = ref(false)
const abortController = ref(null)

// 对话历史管理
const chatHistory = ref([])
const currentSessionId = ref(0)

// 自动保存管理器
const chatAutoSaveManager = ref(null)
const isLoadingHistory = ref(false)
const userId = ref(null)

// 编辑模式状态
const selectedFile = ref(localStorage.getItem('ai_selected_file') || '')
const fileContent = ref('')
const editPrompt = ref('')
const pendingDiff = ref(null)
const editHistory = ref([]) // 用于版本历史（回滚功能）

// API配置
const apiConfig = ref({
  endpoint: localStorage.getItem('ai_endpoint') || '',
  model: localStorage.getItem('ai_model') || '',
  apiKey: localStorage.getItem('ai_api_key') || '',
  platform: localStorage.getItem('ai_platform') || 'openai'
})

// 临时API配置（用于设置表单）
const tempApiConfig = ref({
  endpoint: '',
  model: '',
  apiKey: '',
  platform: 'openai'
})

// 可用模型列表
const availableModels = ref([])
const fetchingModels = ref(false)
const modelError = ref('')

// 平台配置信息（从 platformConfig.js 导入）
const platformLabels = computed(() => platformConfigs)

const currentWindow = getCurrentWindow()

// 计算当前对话消息
const currentChatMessages = computed(() => {
  if (chatHistory.value.length === 0) return []
  return chatHistory.value[currentSessionId.value]?.messages || []
})

// 计算分组的平台列表
const platformsByCategory = computed(() => getPlatformsByCategory())

// 计算是否应该在header显示模型
const shouldShowModelInHeader = computed(() => {
  const platformConfig = platformConfigs[apiConfig.value.platform]
  // 如果隐藏模型选择器，显示平台名称；否则显示模型名称
  return apiConfig.value.platform && (platformConfig?.hideModelSelector || apiConfig.value.model)
})

// 获取header中显示的模型信息
const getCurrentModelDisplay = () => {
  const platformConfig = platformConfigs[apiConfig.value.platform]
  if (platformConfig?.hideModelSelector) {
    return platformConfig.name
  }
  return apiConfig.value.model || platformConfig?.name || '未配置'
}

onMounted(async () => {
  // 发送窗口就绪事件
  await currentWindow.emit('window-ready')
  
  // 监听登录信息
  await listen('login-info', (event) => {
    console.log('AI对话窗口收到登录信息:', event.payload)
    const userInfo = event.payload?.userInfo
    if (userInfo?.userId) {
      userId.value = userInfo.userId
      // 同时保存到 sessionStorage
      sessionStorage.setItem('userInfo', JSON.stringify(userInfo))
      sessionStorage.setItem('token', event.payload?.token || '')
      console.log('已保存用户信息到本窗口缓存，userId:', userId.value)
      // 初始化自动保存管理器
      if (!chatAutoSaveManager.value) {
        chatAutoSaveManager.value = createChatAutoSaveManager(userId.value, {
          autoSaveEnabled: true,
          platform: apiConfig.value.platform,
          model: apiConfig.value.model
        })
      }
      // 收到登录信息后立即加载历史记录
    }
  })

  // 尝试从 sessionStorage 获取已有的用户信息（窗口刷新时）
  const storedUserInfo = sessionStorage.getItem('userInfo')
  if (storedUserInfo) {
    try {
      const userInfo = JSON.parse(storedUserInfo)
      if (userInfo?.userId) {
        userId.value = userInfo.userId
        console.log('从 sessionStorage 恢复用户信息，userId:', userId.value)
        // 初始化自动保存管理器
        if (!chatAutoSaveManager.value) {
          chatAutoSaveManager.value = createChatAutoSaveManager(userId.value, {
            autoSaveEnabled: true,
            platform: apiConfig.value.platform,
            model: apiConfig.value.model
          })
        }
        // 立即加载历史记录
        await initializeHistoryData()
      }
    } catch (error) {
      console.error('恢复用户信息失败:', error)
    }
  }
  
  // 如果有缓存的文件路径，自动加载
  if (selectedFile.value) {
    try {
      fileContent.value = await readTextFile(selectedFile.value)
    } catch (error) {
      console.error('加载缓存文件失败:', error)
      // 清除无效的缓存
      selectedFile.value = ''
      localStorage.removeItem('ai_selected_file')
    }
  }
})

// 初始化历史数据（优先从后端加载）
const initializeHistoryData = async () => {
  if (!userId.value) {
    console.warn('未获取到用户ID，无法加载历史记录')
    // 如果没有用户ID，创建新会话
    if (chatHistory.value.length === 0) {
      await createNewSession()
    }
    return
  }
  
  try {
    // 优先从后端加载最新数据
    await loadHistoryFromBackend()
  } catch (error) {
    console.error('从后端加载历史记录失败:', error)
    // 如果后端加载失败且本地没有历史记录，创建新会话
    if (chatHistory.value.length === 0) {
      await createNewSession()
    }
  }
}

// 模式切换
const switchMode = (mode) => {
  currentMode.value = mode
  localStorage.setItem('ai_current_mode', mode)
}

// 切换模式
const toggleMode = () => {
  currentMode.value = currentMode.value === 'chat' ? 'canvas' : 'chat'
  localStorage.setItem('ai_current_mode', currentMode.value)
}

// 关闭窗口
const closeWindow = async () => {
  await currentWindow.close()
}

// ============ 对话模式方法 ============

// 从后端加载历史记录
const loadHistoryFromBackend = async () => {
  if (!userId.value) return
  
  try {
    isLoadingHistory.value = true
    console.log('开始从后端加载历史记录...')
    
    // 获取用户的所有会话
    const sessions = await getSessionListByUserId(userId.value)
    console.log('获取到会话列表:', sessions)
    
    // 清空本地历史记录，使用后端数据
    chatHistory.value = []
    
    if (!sessions || sessions.length === 0) {
      console.log('后端没有历史记录')
      // 不在这里创建新会话，让调用者决定
      return
    }
    
    // 加载每个会话的消息
    for (const session of sessions) {
      try {
        const messages = await getMessageListBySessionId(session.id)
        console.log(`会话 ${session.id} 的消息:`, messages)
        
        // 转换后端数据格式为前端格式
        const localSession = {
          id: session.id,
          title: session.sessionTitle,
          timestamp: session.createdTime,
          backendId: session.id, // 保存后端ID用于更新
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.hasThink ? {
              hasThink: true,
              think: msg.thinkContent || '',
              content: msg.content,
              isComplete: true
            } : msg.content
          }))
        }
        
        chatHistory.value.push(localSession)
      } catch (error) {
        console.error(`加载会话 ${session.id} 的消息失败:`, error)
      }
    }
    
    // 设置当前会话为最新的
    if (chatHistory.value.length > 0) {
      currentSessionId.value = 0
      console.log('后端历史记录加载完成，共', chatHistory.value.length, '个会话')
    }
  } catch (error) {
    console.error('从后端加载历史记录失败:', error)
    throw error
  } finally {
    isLoadingHistory.value = false
  }
}

// 创建新对话会话
const createNewSession = async () => {
  try {
    let backendSessionId = null
    
    // 如果有自动保存管理器，先在后端创建会话
    if (chatAutoSaveManager.value && userId.value) {
      const session = await chatAutoSaveManager.value.initChatSession('新对话')
      backendSessionId = session.id
      console.log('后端创建会话成功:', backendSessionId)
    }
    
    const newSession = {
      id: Date.now(),
      title: `对话 ${chatHistory.value.length + 1}`,
      timestamp: new Date().toLocaleString('zh-CN'),
      backendId: backendSessionId, // 保存后端会话ID
      messages: []
    }
    chatHistory.value.unshift(newSession)
    currentSessionId.value = 0
    saveChatHistory()
  } catch (error) {
    console.error('创建会话失败:', error)
    // 降级处理：仅创建本地会话
    const newSession = {
      id: Date.now(),
      title: `对话 ${chatHistory.value.length + 1}`,
      timestamp: new Date().toLocaleString('zh-CN'),
      backendId: null,
      messages: []
    }
    chatHistory.value.unshift(newSession)
    currentSessionId.value = 0
    saveChatHistory()
  }
}

// 切换对话会话
const switchSession = (idx) => {
  currentSessionId.value = idx
}

// 删除对话会话
const deleteSession = async (idx) => {
  try {
    const session = chatHistory.value[idx]
    
    // 如果有后端ID，调用后端接口删除
    if (session?.backendId) {
      console.log('开始删除后端会话:', session.backendId)
      await deleteSessionAPI(session.backendId)
      console.log('后端会话删除成功')
    }
    
    // 删除本地历史记录
    chatHistory.value.splice(idx, 1)
    if (currentSessionId.value >= chatHistory.value.length) {
      currentSessionId.value = Math.max(0, chatHistory.value.length - 1)
    }
    saveChatHistory()
    console.log('本地会话删除成功')
  } catch (error) {
    console.error('删除会话失败:', error)
    alert('删除会话失败，请重试')
  }
}

// 清空所有对话历史
const clearAllChatHistory = () => {
  chatHistory.value = []
  saveChatHistory()
}

// 刷新对话历史（从后端重新加载）
const refreshChatHistory = async () => {
  console.log('开始刷新对话历史...')
  if (!userId.value) {
    console.warn('未获取到用户ID，无法刷新历史记录')
    return
  }
  
  try {
    await loadHistoryFromBackend()
    console.log('对话历史刷新完成')
  } catch (error) {
    console.error('刷新对话历史失败:', error)
    alert('刷新历史记录失败，请重试')
  }
}

// 保存对话历史到本地存储
const saveChatHistory = () => {
  try {
    localStorage.setItem('ai_chat_history', JSON.stringify(chatHistory.value))
  } catch (error) {
    console.error('保存对话历史失败:', error)
  }
}

// 从本地存储加载对话历史
const loadChatHistory = () => {
  try {
    const saved = localStorage.getItem('ai_chat_history')
    if (saved) {
      chatHistory.value = JSON.parse(saved)
      if (chatHistory.value.length === 0) {
        createNewSession()
      }
    }
  } catch (error) {
    console.error('加载对话历史失败:', error)
    chatHistory.value = []
    createNewSession()
  }
}

// 更新当前会话标题（基于第一条消息）
const updateSessionTitle = () => {
  if (chatHistory.value.length > 0 && currentSessionId.value < chatHistory.value.length) {
    const session = chatHistory.value[currentSessionId.value]
    if (session.messages.length > 0) {
      const firstMsg = session.messages[0].content
      const titleText = typeof firstMsg === 'string' ? firstMsg : firstMsg.content || ''
      session.title = titleText.substring(0, 30) + (titleText.length > 30 ? '...' : '')
      saveChatHistory()
    }
  }
}

// 滚动到消息底部
const scrollToBottom = () => {
  const messagesContainer = document.querySelector('.messages-container')
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }
}

// 处理textarea的键盘事件
const handleTextareaKeydown = (event) => {
  // Enter 键发送消息
  if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault()
    sendMessage()
  }
  // Shift+Enter 换行（默认行为）
  // Ctrl/Cmd+Enter 也可以发送（兼容旧习惯）
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    sendMessage()
  }
}

// 发送聊天消息
const sendMessage = async () => {
  if (!userInput.value.trim()) return

  // 确保当前会话存在
  if (chatHistory.value.length === 0) {
    await createNewSession()
  }

  const currentSession = chatHistory.value[currentSessionId.value]
  
  // 添加用户消息
  currentSession.messages.push({
    role: 'user',
    content: userInput.value
  })

  const userMsg = userInput.value
  userInput.value = ''
  loading.value = true
  
  // 创建新的 AbortController 用于暂停消息接收
  abortController.value = new AbortController()

  try {
    // 保存用户消息到后端
    if (chatAutoSaveManager.value && currentSession.backendId) {
      try {
        await chatAutoSaveManager.value.saveUserMessage(userMsg)
        console.log('用户消息已保存到后端')
      } catch (error) {
        console.error('保存用户消息到后端失败:', error)
      }
    }

    // 添加一个空的助手消息，用于流式更新
    const assistantMessageIndex = currentSession.messages.length
    currentSession.messages.push({
      role: 'assistant',
      content: reactive({
        hasThink: false,
        isComplete: false,
        think: '',
        content: ''
      })
    })

    // 调用AI API，支持流式输出
    let accumulatedContent = ''
    const response = await callAIAPI_local(userMsg, 'chat', (chunk) => {
      // 检查是否被中止
      if (abortController.value?.signal.aborted) {
        throw new Error('消息接收已暂停')
      }
      
      // 累积内容
      accumulatedContent += chunk
      
      // 实时处理 <think> 标签，转换为对象格式以应用样式
      const processedContent = extractThinkContent(accumulatedContent)
      
      // 调试日志
      console.log('onChunk - accumulated length:', accumulatedContent.length)
      console.log('onChunk - processedContent type:', typeof processedContent)
      console.log('onChunk - hasThink:', processedContent?.hasThink)
      console.log('onChunk - isComplete:', processedContent?.isComplete)
      
      // 直接更新响应式对象的属性
      const msgContent = currentSession.messages[assistantMessageIndex].content
      if (typeof processedContent === 'object') {
        msgContent.hasThink = processedContent.hasThink
        msgContent.isComplete = processedContent.isComplete
        msgContent.think = processedContent.think
        msgContent.content = processedContent.content
      } else {
        // 如果是字符串，重新初始化为字符串
        currentSession.messages[assistantMessageIndex].content = processedContent
      }
      
      saveChatHistory()
      
      // 自动滚动到最新消息
      nextTick(() => {
        scrollToBottom()
      })
    })
    
    // 最终更新消息内容（处理 <think> 标签）
    const finalContent = typeof response === 'string' ? extractThinkContent(response) : response
    
    console.log('Final - response type:', typeof response)
    console.log('Final - finalContent type:', typeof finalContent)
    
    // 直接更新响应式对象的属性
    const msgContent = currentSession.messages[assistantMessageIndex].content
    if (typeof finalContent === 'object') {
      msgContent.hasThink = finalContent.hasThink
      msgContent.isComplete = finalContent.isComplete
      msgContent.think = finalContent.think
      msgContent.content = finalContent.content
    } else {
      currentSession.messages[assistantMessageIndex].content = finalContent
    }
    
    // 保存助手消息到后端
    if (chatAutoSaveManager.value && currentSession.backendId) {
      try {
        await chatAutoSaveManager.value.saveAssistantMessage(finalContent)
        console.log('助手消息已保存到后端')
      } catch (error) {
        console.error('保存助手消息到后端失败:', error)
      }
    }
    
    // 第一条消息时更新会话标题
    if (currentSession.messages.length === 2) {
      updateSessionTitle()
      
      // 更新后端会话标题
      if (chatAutoSaveManager.value && currentSession.backendId) {
        try {
          const title = generateSessionTitle(userMsg)
          await chatAutoSaveManager.value.updateChatSessionTitle(title)
          currentSession.title = title
          console.log('会话标题已更新到后端')
        } catch (error) {
          console.error('更新会话标题失败:', error)
        }
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    // 如果是暂停操作，不显示错误消息
    if (error.message !== '消息接收已暂停') {
      currentSession.messages.push({
        role: 'assistant',
        content: '抱歉，发生了错误。请检查API配置。'
      })
    }
  } finally {
    loading.value = false
    abortController.value = null
    saveChatHistory()
    
    // 最终滚动到底部
    nextTick(() => {
      scrollToBottom()
    })
  }
}

// 暂停接收消息
const pauseMessage = () => {
  if (abortController.value) {
    abortController.value.abort()
    loading.value = false
  }
}

// 文件选择处理
const onFileSelected = async (filePath) => {
  try {
    selectedFile.value = filePath
    fileContent.value = await readTextFile(filePath)
    // 保存选中的文件路径到缓存
    localStorage.setItem('ai_selected_file', filePath)
  } catch (error) {
    console.error('读取文件失败:', error)
    alert('读取文件失败')
  }
}

// 应用编辑
const applyEdit = async () => {
  if (!editPrompt.value.trim() || !selectedFile.value) return

  loading.value = true
  try {
    const response = await callAIAPI_local(
      `当前文件内容：\n${fileContent.value}\n\n用户指令：\n${editPrompt.value}`,
      'canvas'
    )

    // 解析JSON响应
    const diff = JSON.parse(response)
    pendingDiff.value = diff
  } catch (error) {
    console.error('应用编辑失败:', error)
    alert('AI返回格式错误，请重试')
  } finally {
    loading.value = false
  }
}

// 确认修改
const confirmDiff = async () => {
  if (!pendingDiff.value) return

  try {
    // 应用修改
    let newContent = fileContent.value
    const changes = [...pendingDiff.value.changes].reverse()

    for (const change of changes) {
      if (change.type === 'replace') {
        newContent = 
          newContent.substring(0, change.start) + 
          change.new_text + 
          newContent.substring(change.end)
      }
    }

    // 保存文件
    await writeTextFile(selectedFile.value, newContent)

    // 保存编辑历史到后端
    if (chatAutoSaveManager.value && currentSessionId.value >= 0) {
      const currentSession = chatHistory.value[currentSessionId.value]
      if (currentSession?.backendId) {
        try {
          await chatAutoSaveManager.value.saveEditHistory({
            filePath: selectedFile.value,
            editPrompt: editPrompt.value,
            summary: pendingDiff.value.summary,
            beforeContent: fileContent.value,
            afterContent: newContent,
            diffJson: pendingDiff.value
          })
          console.log('编辑历史已保存到后端')
        } catch (error) {
          console.error('保存编辑历史到后端失败:', error)
        }
      }
    }

    // 保存编辑历史到本地
    const editSession = {
      id: Date.now(),
      title: editPrompt.value.substring(0, 30) + (editPrompt.value.length > 30 ? '...' : ''),
      timestamp: new Date().toLocaleString('zh-CN'),
      file: selectedFile.value,
      content: newContent,
      prompt: editPrompt.value,
      summary: pendingDiff.value.summary,
      before_content: fileContent.value,
      after_content: newContent
    }
    editHistory.value.unshift(editSession)

    // 只保留最近5个版本
    if (editHistory.value.length > 5) {
      editHistory.value.pop()
    }

    // 更新当前内容
    fileContent.value = newContent
    editPrompt.value = ''
    pendingDiff.value = null

    alert('修改已应用')
  } catch (error) {
    console.error('确认修改失败:', error)
    alert('保存文件失败')
  }
}

// 拒绝修改
const rejectDiff = () => {
  pendingDiff.value = null
  editPrompt.value = ''
}

// 回滚版本
const rollbackVersion = async (idx) => {
  try {
    const version = editHistory.value[idx]
    await writeTextFile(selectedFile.value, version.after_content)
    fileContent.value = version.after_content

    // 添加回滚记录作为新版本
    const rollbackVersion = {
      id: Date.now(),
      title: `回滚到 ${version.title}`,
      timestamp: new Date().toLocaleString('zh-CN'),
      prompt: `回滚到 ${version.title}`,
      summary: `已回滚到版本 ${version.title}`,
      before_content: fileContent.value,
      after_content: version.after_content
    }
    editHistory.value.unshift(rollbackVersion)

    // 只保留最近5个版本
    if (editHistory.value.length > 5) {
      editHistory.value.pop()
    }

    alert('已回滚到该版本')
  } catch (error) {
    console.error('回滚失败:', error)
    alert('回滚失败')
  }
}

// ============ 设置方法 ============

// 打开设置时初始化临时配置
const openSettings = () => {
  tempApiConfig.value = {
    endpoint: apiConfig.value.endpoint,
    model: apiConfig.value.model,
    apiKey: apiConfig.value.apiKey,
    platform: apiConfig.value.platform
  }
  availableModels.value = []
  modelError.value = ''
  showSettings.value = true
  
  // 如果当前平台有默认模型且未设置模型，使用默认模型
  const platformConfig = platformConfigs[tempApiConfig.value.platform]
  if (platformConfig?.defaultModel && !tempApiConfig.value.model) {
    tempApiConfig.value.model = platformConfig.defaultModel
  }
}

// 平台切换处理
const onPlatformChange = () => {
  availableModels.value = []
  modelError.value = ''
  
  // 获取平台配置
  const platformConfig = platformConfigs[tempApiConfig.value.platform]
  
  // 自动填入默认端点（如果有）
  if (platformConfig?.defaultEndpoint) {
    tempApiConfig.value.endpoint = platformConfig.defaultEndpoint
  } else {
    tempApiConfig.value.endpoint = ''
  }
  
  // 如果平台有默认模型，自动设置
  if (platformConfig?.defaultModel) {
    tempApiConfig.value.model = platformConfig.defaultModel
  } else {
    tempApiConfig.value.model = ''
  }
}

// 获取可用模型列表
const fetchAvailableModels = async () => {
  if (!tempApiConfig.value.endpoint) {
    modelError.value = '请先输入API端点'
    return
  }

  fetchingModels.value = true
  modelError.value = ''
  availableModels.value = []

  try {
    const models = await fetchModelsFromAPI(
      tempApiConfig.value.platform,
      tempApiConfig.value.endpoint,
      tempApiConfig.value.apiKey
    )
    availableModels.value = models

    if (availableModels.value.length === 0) {
      modelError.value = '未找到可用模型，请手动输入'
    }
  } catch (error) {
    console.error('获取模型列表失败:', error)
    const config = platformConfigs[tempApiConfig.value.platform]
    if (!config?.supportsModelList) {
      modelError.value = `${config?.name || '该平台'}需要手动输入模型名称`
    } else {
      modelError.value = `获取失败: ${error.message}`
    }
    availableModels.value = []
  } finally {
    fetchingModels.value = false
  }
}

// 保存设置
const saveSettings = () => {
  const platformConfig = platformConfigs[tempApiConfig.value.platform]
  
  // 校验必填字段
  if (!tempApiConfig.value.endpoint) {
    alert('请输入API端点')
    return
  }
  
  // 对于不隐藏模型选择器的平台，需要校验模型
  if (!platformConfig?.hideModelSelector && !tempApiConfig.value.model) {
    alert('请输入或选择模型')
    return
  }
  
  // 如果平台隐藏模型选择器且有默认模型，使用默认模型
  let modelToSave = tempApiConfig.value.model
  if (platformConfig?.hideModelSelector && platformConfig?.defaultModel) {
    modelToSave = platformConfig.defaultModel
  }
  
  apiConfig.value = {
    endpoint: tempApiConfig.value.endpoint,
    model: modelToSave,
    apiKey: tempApiConfig.value.apiKey,
    platform: tempApiConfig.value.platform
  }

  // 保存到本地存储
  localStorage.setItem('ai_endpoint', apiConfig.value.endpoint)
  localStorage.setItem('ai_model', apiConfig.value.model)
  localStorage.setItem('ai_api_key', apiConfig.value.apiKey)
  localStorage.setItem('ai_platform', apiConfig.value.platform)

  showSettings.value = false
}

// 调用AI API
const callAIAPI_local = async (prompt, mode, onChunk) => {
  if (!apiConfig.value.endpoint) {
    throw new Error('请先配置AI API端点')
  }

  const systemPrompt = mode === 'canvas' 
    ? '你是一个文档编辑助手。用户会提供文件内容和编辑指令。你必须返回JSON格式的修改指令。禁止输出任何解释性文本。返回格式：{"summary": "...", "changes": [{"type": "replace", "start": number, "end": number, "new_text": "..."}]}'
    : '你是一个有帮助的助手。'

  try {
    const response = await callAIAPI({
      platform: apiConfig.value.platform,
      endpoint: apiConfig.value.endpoint,
      model: apiConfig.value.model,
      apiKey: apiConfig.value.apiKey,
      systemPrompt,
      userPrompt: prompt,
      mode: mode, // 传递模式参数
      onChunk: mode === 'chat' ? onChunk : undefined
    })
    
    // 对话模式下，直接返回响应（已在 onChunk 中处理过 think 标签）
    // 编辑模式下，返回原始响应
    return response
  } catch (error) {
    console.error('API调用失败:', error)
    throw error
  }
}
</script>

<style lang="less" scoped>
.ai-dialog-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #faf0ea;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

  :deep(.draggable-header) {
    display: flex;
    gap: 10px;
    padding: 15px;
    background: #fff9f5;
    border-bottom: 1px solid #d9bfb8;
    align-items: center;
    justify-content: space-between;
    cursor: move;
    user-select: none;
  }

  .header-content {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .mode-label {
    font-size: 14px;
    color: #80695b;
    font-weight: 500;
    min-width: 60px;
  }

  .current-model {
    font-size: 12px;
    color: #8b4513;
    background: #fbf2c450;
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid #d9bfb8;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .switch-container {
    position: relative;
    width: 50px;
    height: 28px;

    .switch-input {
      display: none;
    }

    .switch-label {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #d9bfb8;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid #d9bfb8;

      &::after {
        content: '';
        position: absolute;
        width: 22px;
        height: 22px;
        background: #fff9f5;
        border-radius: 50%;
        top: 2px;
        left: 2px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }

    .switch-input:checked + .switch-label {
      background: #8b4513;
      border-color: #8b4513;

      &::after {
        left: 26px;
      }
    }
  }

  .settings-btn {
    padding: 8px 12px;
    background: transparent;
    border: 1px solid #d9bfb8;
    border-radius: 4px;
    cursor: pointer;
    color: #80695b;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #fff9f5;
      border-color: #8b4513;
      color: #8b4513;
      transform: rotate(20deg);
    }
  }

  .close-btn {
    padding: 8px 12px;
    background: transparent;
    border: 1px solid #d9bfb8;
    border-radius: 4px;
    cursor: pointer;
    color: #80695b;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #fff9f5;
      border-color: #d9534f;
      color: #d9534f;
      transform: rotate(90deg);
    }
  }

  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .chat-mode {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      .message {
        display: flex;
        margin-bottom: 10px;

        &.user {
          justify-content: flex-end;

          .message-content {
            background: #8b4513;
            color: #fffcfa;
            border-radius: 8px;
            padding: 10px 15px;
            max-width: 70%;
            word-wrap: break-word;
          }
        }

        &.assistant {
          justify-content: flex-start;

          .message-content {
            background: #fff9f5;
            color: #80695b;
            border-radius: 8px;
            padding: 10px 15px;
            max-width: 70%;
            word-wrap: break-word;
            border: 1px solid #d9bfb8;
          }

          .message-content-with-think {
            background: #fff9f5;
            color: #80695b;
            border-radius: 8px;
            padding: 0;
            max-width: 70%;
            word-wrap: break-word;
            border: 1px solid #d9bfb8;
            overflow: hidden;

            .think-section {
              background: #f0e6e0;
              border-bottom: 2px solid #d9bfb8;
              padding: 12px 15px;
              border-radius: 8px 8px 0 0;
              position: relative;

              &.incomplete {
                // 未闭合的 think 标签样式
                border-bottom: 2px dashed #d9bfb8;
                
                &::after {
                  content: '';
                  position: absolute;
                  right: 12px;
                  top: 50%;
                  transform: translateY(-50%);
                  width: 8px;
                  height: 8px;
                  background: #8b4513;
                  border-radius: 50%;
                  animation: pulse 1.5s ease-in-out infinite;
                }
              }

              .think-header {
                font-size: 12px;
                font-weight: 600;
                color: #8b4513;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              .think-content {
                font-size: 13px;
                color: #80695b;
                line-height: 1.5;
                white-space: pre-wrap;
                word-break: break-word;
                font-style: italic;
              }
            }

            .main-content-section {
              padding: 12px 15px;
              font-size: 14px;
              line-height: 1.5;
              white-space: pre-wrap;
              word-break: break-word;
            }
          }
        }
      }
    }

    .input-area {
      padding: 15px;
      background: #fff9f5;
      border-top: 1px solid #d9bfb8;
      display: flex;
      gap: 10px;
      align-items: flex-end;

      textarea {
        flex: 1;
        height: 40px;
        padding: 8px 10px;
        border: 1px solid #d9bfb8;
        border-radius: 4px;
        resize: none;
        font-family: inherit;
        font-size: 14px;
        background: #fffcfa;
        color: #80695b;
        line-height: 1.2;
        box-sizing: border-box;

        &:focus {
          outline: none;
          border-color: #8b4513;
          background: #fbf2c450;
        }
      }

      .button-group {
        display: flex;
        gap: 8px;

        .action-btn {
          width: 40px;
          height: 40px;
          padding: 0;
          background: #8b4513;
          color: #fffcfa;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          svg {
            width: 20px;
            height: 20px;
          }

          &:hover:not(:disabled) {
            background: #a0522d;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
          }

          &:disabled {
            background: #c9b1a7;
            cursor: not-allowed;
          }

          &.send-btn {
            &:active:not(:disabled) {
              transform: translateY(0);
            }
          }

          &.pause-btn {
            background: #d9534f;

            &:hover {
              background: #e74c3c;
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(217, 83, 79, 0.2);
            }
          }
        }
      }
    }
  }

  .canvas-mode {
    flex: 1;
    display: flex;
    flex-direction: row;
    overflow: hidden;

    .canvas-content {
      flex: 1;
      overflow-y: auto;
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      min-width: 0;

      .file-content,
      .edit-prompt,
      .diff-preview,
      .version-history {
        background: #fff9f5;
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #d9bfb8;

        h4 {
          margin: 0 0 10px 0;
          color: #80695b;
          font-size: 14px;
        }
      }

      .content-preview {
        background: #fbf2c450;
        padding: 10px;
        border-radius: 4px;
        max-height: 150px;
        overflow-y: auto;
        font-size: 12px;
        color: #80695b;
        font-family: 'Courier New', monospace;
        white-space: pre-wrap;
        word-break: break-all;
      }

      .edit-prompt {
        textarea {
          width: 100%;
          min-height: 80px;
          padding: 10px;
          border: 1px solid #d9bfb8;
          border-radius: 4px;
          resize: vertical;
          font-family: inherit;
          font-size: 14px;
          background: #fffcfa;
          color: #80695b;

          &:focus {
            outline: none;
            border-color: #8b4513;
            background: #fbf2c450;
          }
        }
      }

      .action-buttons {
        display: flex;
        gap: 10px;

        button {
          flex: 1;
          padding: 10px;
          background: #8b4513;
          color: #fffcfa;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover:not(:disabled) {
            background: #a0522d;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
          }

          &:disabled {
            background: #c9b1a7;
            cursor: not-allowed;
          }
        }
      }

      .diff-preview {
        .diff-summary {
          background: #fbf2c450;
          padding: 10px;
          border-left: 3px solid #8b4513;
          margin-bottom: 10px;
          font-size: 13px;
          color: #80695b;
        }

        .diff-content {
          background: #fbf2c450;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 10px;
          max-height: 150px;
          overflow-y: auto;

          .change {
            margin-bottom: 8px;
            padding: 8px;
            background: #fffcfa;
            border-radius: 3px;
            border-left: 3px solid #8b4513;

            .change-type {
              font-size: 12px;
              color: #c9b1a7;
              margin-bottom: 4px;
            }

            .change-text {
              font-size: 12px;
              color: #80695b;
              font-family: 'Courier New', monospace;
              white-space: pre-wrap;
              word-break: break-all;
            }
          }
        }

        .diff-actions {
          display: flex;
          gap: 10px;

          button {
            flex: 1;
            padding: 8px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;

            &.confirm-btn {
              background: #8b4513;
              color: #fffcfa;

              &:hover {
                background: #a0522d;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
              }
            }

            &.reject-btn {
              background: #c9b1a7;
              color: #80695b;

              &:hover {
                background: #d9bfb8;
              }
            }
          }
        }
      }

      .version-history {
        .no-versions {
          color: #c9b1a7;
          text-align: center;
          padding: 20px;
        }

        .versions-list {
          display: flex;
          flex-direction: column;
          gap: 10px;

          .version-item {
            padding: 10px;
            background: #fbf2c450;
            border-radius: 4px;
            border-left: 3px solid #8b4513;

            .version-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 12px;

              .version-id {
                font-weight: 500;
                color: #80695b;
              }

              .version-time {
                color: #c9b1a7;
              }
            }

            .version-summary {
              font-size: 13px;
              color: #80695b;
              margin-bottom: 8px;
            }

            .rollback-btn {
              width: 100%;
              padding: 6px;
              background: #8b4513;
              color: #fffcfa;
              border: none;
              border-radius: 3px;
              cursor: pointer;
              font-size: 12px;
              transition: all 0.3s;

              &:hover {
                background: #a0522d;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
              }
            }
          }
        }
      }
    }

    .no-file-selected {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #c9b1a7;
      font-size: 16px;
      min-width: 0;
    }
  }

  // ============ 设置模态框样式 ============

  .settings-btn {
    padding: 8px 12px;
    background: transparent;
    border: 1px solid #d9bfb8;
    border-radius: 4px;
    cursor: pointer;
    color: #80695b;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;

    &:hover {
      background: #fff9f5;
      border-color: #8b4513;
      color: #8b4513;
      transform: rotate(20deg);
    }
  }

  .settings-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .settings-modal {
    background: #fff9f5;
    border-radius: 10px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 500px;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #d9bfb8;
      background: #fbf2c450;

      h3 {
        margin: 0;
        color: #80695b;
        font-size: 18px;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 28px;
        color: #c9b1a7;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;

        &:hover {
          color: #8b4513;
          transform: rotate(90deg);
        }
      }
    }

    .settings-notice {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      background: #e8f4f8;
      border-left: 4px solid #0288d1;
      margin: 0;
      font-size: 13px;
      color: #01579b;
      line-height: 1.5;

      svg {
        flex-shrink: 0;
        color: #0288d1;
      }

      span {
        flex: 1;
      }
    }

    .settings-content {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      max-height: 400px;
      overflow-y: auto;

      .setting-item {
        display: flex;
        flex-direction: column;
        gap: 8px;

        label {
          font-weight: 500;
          color: #80695b;
          font-size: 14px;
        }

        input,
        select {
          padding: 10px 12px;
          border: 1px solid #d9bfb8;
          border-radius: 4px;
          background: #fffcfa;
          color: #80695b;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.3s;

          &:focus {
            outline: none;
            border-color: #8b4513;
            background: #fbf2c450;
            box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
          }

          &::placeholder {
            color: #c9b1a7;
          }
        }

        select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23806959' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 8px center;
          background-size: 20px;
          padding-right: 32px;
        }

        .platform-select {
          font-weight: 500;
        }

        .endpoint-input-group {
          display: flex;
          gap: 8px;

          input {
            flex: 1;
          }

          .fetch-models-btn {
            padding: 10px 12px;
            background: #8b4513;
            color: #fffcfa;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            transition: all 0.3s;

            &:hover:not(:disabled) {
              background: #a0522d;
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
            }

            &:disabled {
              background: #c9b1a7;
              cursor: not-allowed;
            }
          }
        }

        .error-message {
          font-size: 12px;
          color: #d9534f;
          margin-top: 4px;
        }

        .platform-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px;
          background: #fbf2c450;
          border-left: 3px solid #8b4513;
          border-radius: 4px;
          font-size: 12px;
          color: #80695b;
          line-height: 1.5;

          svg {
            flex-shrink: 0;
            margin-top: 2px;
            color: #8b4513;
          }
        }
      }
    }

    .settings-footer {
      display: flex;
      gap: 10px;
      padding: 15px 20px;
      border-top: 1px solid #d9bfb8;
      background: #fbf2c450;

      button {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s;

        &.cancel-btn {
          background: #c9b1a7;
          color: #80695b;

          &:hover {
            background: #d9bfb8;
            transform: translateY(-2px);
          }
        }

        &.save-btn {
          background: #8b4513;
          color: #fffcfa;

          &:hover {
            background: #a0522d;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
          }
        }
      }
    }
  }
}

// 脉冲动画
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
  50% {
    opacity: 0.5;
    transform: translateY(-50%) scale(1.2);
  }
}
</style>
