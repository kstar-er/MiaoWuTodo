/**
 * AI对话自动保存辅助模块
 * 用于在aiDialog.vue中集成自动保存功能
 * 
 * 这个模块提供了一些辅助函数，用于在对话过程中自动保存消息到后端
 */

import { useAiChatAutoSave } from './useAiChatAutoSave'
import { recordEditHistory } from './aiChatHistoryService'

/**
 * 创建对话自动保存管理器
 * @param {Long} userId - 用户ID
 * @param {Object} options - 配置选项
 * @returns {Object} 返回自动保存管理器实例
 */
export const createChatAutoSaveManager = (userId, options = {}) => {
  const {
    autoSaveEnabled = true,
    platform = 'openai',
    model = ''
  } = options

  const autoSave = useAiChatAutoSave(userId)
  
  // 初始化自动保存
  autoSave.setAutoSaveEnabled(autoSaveEnabled)

  /**
   * 初始化对话会话
   * @param {String} sessionTitle - 会话标题
   * @returns {Promise<Object>}
   */
  const initChatSession = async (sessionTitle = '新对话') => {
    return await autoSave.initSession({
      sessionTitle,
      mode: 'chat',
      platform,
      model
    })
  }

  /**
   * 保存用户消息
   * @param {String} content - 消息内容
   * @returns {Promise<Object>}
   */
  const saveUserMessage = async (content) => {
    if (!autoSave.autoSaveEnabled.value) {
      console.warn('自动保存已禁用')
      return null
    }

    return await autoSave.saveMessage({
      role: 'user',
      content,
      hasThink: false
    })
  }

  /**
   * 保存助手消息
   * @param {String|Object} content - 消息内容（可能包含思考过程）
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  const saveAssistantMessage = async (content, options = {}) => {
    if (!autoSave.autoSaveEnabled.value) {
      console.warn('自动保存已禁用')
      return null
    }

    // 处理包含思考过程的消息
    let messageContent = content
    let hasThink = false
    let thinkContent = null

    if (typeof content === 'object' && content.hasThink) {
      hasThink = content.hasThink
      thinkContent = content.think
      messageContent = content.content
    }

    return await autoSave.saveMessage({
      role: 'assistant',
      content: messageContent,
      hasThink,
      thinkContent,
      tokenCount: options.tokenCount || 0
    })
  }

  /**
   * 保存对话轮次（用户消息 + 助手消息）
   * @param {String} userMessage - 用户消息
   * @param {String|Object} assistantMessage - 助手消息
   * @returns {Promise<Array>} 返回保存的消息列表
   */
  const saveChatRound = async (userMessage, assistantMessage) => {
    if (!autoSave.autoSaveEnabled.value) {
      console.warn('自动保存已禁用')
      return []
    }

    try {
      // 保存用户消息
      const userMsg = await saveUserMessage(userMessage)
      
      // 保存助手消息
      const assistantMsg = await saveAssistantMessage(assistantMessage)
      
      return [userMsg, assistantMsg]
    } catch (error) {
      console.error('保存对话轮次失败:', error)
      throw error
    }
  }

  /**
   * 更新会话标题（通常基于第一条消息）
   * @param {String} title - 新标题
   * @returns {Promise<Boolean>}
   */
  const updateChatSessionTitle = async (title) => {
    return await autoSave.updateTitle(title)
  }

  /**
   * 保存编辑历史（Canvas模式）
   * @param {Object} editData - 编辑数据
   * @returns {Promise<Object>}
   */
  const saveEditHistory = async (editData) => {
    if (!autoSave.sessionId.value) {
      console.warn('会话未初始化，无法保存编辑历史')
      return null
    }

    const historyData = {
      sessionId: autoSave.sessionId.value,
      userId: userId,
      filePath: editData.filePath,
      editPrompt: editData.editPrompt,
      summary: editData.summary,
      beforeContent: editData.beforeContent,
      afterContent: editData.afterContent,
      diffJson: editData.diffJson ? JSON.stringify(editData.diffJson) : null
    }

    return await recordEditHistory(historyData)
  }

  /**
   * 获取当前会话ID
   * @returns {Long}
   */
  const getSessionId = () => autoSave.sessionId.value

  /**
   * 获取当前会话信息
   * @returns {Object}
   */
  const getSessionInfo = () => autoSave.currentSession.value

  /**
   * 检查是否有失败的消息
   * @returns {Boolean}
   */
  const hasFailedMessages = () => autoSave.failedMessageCount.value > 0

  /**
   * 获取失败消息数量
   * @returns {Number}
   */
  const getFailedMessageCount = () => autoSave.failedMessageCount.value

  /**
   * 重试保存失败的消息
   * @returns {Promise<Array>}
   */
  const retryFailedMessages = async () => {
    return await autoSave.retryFailedMessages()
  }

  /**
   * 清空失败队列
   */
  const clearFailedMessages = () => {
    autoSave.clearFailedMessages()
  }

  /**
   * 启用/禁用自动保存
   * @param {Boolean} enabled
   */
  const setAutoSaveEnabled = (enabled) => {
    autoSave.setAutoSaveEnabled(enabled)
  }

  /**
   * 获取自动保存是否启用
   * @returns {Boolean}
   */
  const isAutoSaveEnabled = () => autoSave.autoSaveEnabled.value

  return {
    // 初始化
    initChatSession,
    
    // 消息保存
    saveUserMessage,
    saveAssistantMessage,
    saveChatRound,
    
    // 会话管理
    updateChatSessionTitle,
    getSessionId,
    getSessionInfo,
    
    // 编辑历史
    saveEditHistory,
    
    // 失败处理
    hasFailedMessages,
    getFailedMessageCount,
    retryFailedMessages,
    clearFailedMessages,
    
    // 配置
    setAutoSaveEnabled,
    isAutoSaveEnabled,
    
    // 原始autoSave对象（用于高级用法）
    _autoSave: autoSave
  }
}

/**
 * 从localStorage中恢复会话ID
 * @param {String} key - localStorage的key
 * @returns {Long|null}
 */
export const restoreSessionIdFromStorage = (key = 'ai_current_session_id') => {
  try {
    const sessionId = localStorage.getItem(key)
    return sessionId ? parseInt(sessionId) : null
  } catch (error) {
    console.error('恢复会话ID失败:', error)
    return null
  }
}

/**
 * 保存会话ID到localStorage
 * @param {Long} sessionId - 会话ID
 * @param {String} key - localStorage的key
 */
export const saveSessionIdToStorage = (sessionId, key = 'ai_current_session_id') => {
  try {
    localStorage.setItem(key, sessionId.toString())
  } catch (error) {
    console.error('保存会话ID失败:', error)
  }
}

/**
 * 处理消息内容（提取思考过程等）
 * @param {String} content - 原始内容
 * @returns {Object} 返回处理后的消息对象
 */
export const processMessageContent = (content) => {
  if (typeof content !== 'string') {
    return content
  }

  // 检查是否包含思考标签
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/)
  
  if (thinkMatch) {
    const thinkContent = thinkMatch[1].trim()
    const mainContent = content.replace(/<think>[\s\S]*?<\/think>/, '').trim()
    
    return {
      hasThink: true,
      think: thinkContent,
      content: mainContent,
      isComplete: true
    }
  }

  return {
    hasThink: false,
    think: '',
    content: content,
    isComplete: true
  }
}

/**
 * 生成会话标题（基于第一条用户消息）
 * @param {String} firstUserMessage - 第一条用户消息
 * @param {Number} maxLength - 最大长度
 * @returns {String}
 */
export const generateSessionTitle = (firstUserMessage, maxLength = 30) => {
  if (!firstUserMessage) {
    return '新对话'
  }

  // 移除特殊字符和换行
  const cleanedMessage = firstUserMessage
    .replace(/[\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleanedMessage.length > maxLength) {
    return cleanedMessage.substring(0, maxLength) + '...'
  }

  return cleanedMessage
}
