import { ref, watch, computed } from 'vue'
import {
  createSession,
  addMessage,
  updateSessionTitle,
  updateSession
} from './aiChatHistoryService'

/**
 * AI对话自动保存Composable
 * 用于在每一轮对话完成后自动保存数据到后端
 * 
 * 使用示例：
 * const { 
 *   sessionId, 
 *   saveMessage, 
 *   initSession,
 *   isSaving 
 * } = useAiChatAutoSave(userId)
 */
export const useAiChatAutoSave = (userId) => {
  // 当前会话ID
  const sessionId = ref(null)
  
  // 当前会话信息
  const currentSession = ref(null)
  
  // 是否正在保存
  const isSaving = ref(false)
  
  // 保存队列（用于批量保存）
  const saveQueue = ref([])
  
  // 是否启用自动保存
  const autoSaveEnabled = ref(true)
  
  // 保存失败的消息队列（用于重试）
  const failedMessages = ref([])

  /**
   * 初始化新的对话会话
   * @param {Object} options - 会话选项
   * @param {String} options.sessionTitle - 会话标题，默认为"新对话"
   * @param {String} options.mode - 对话模式：chat-对话模式, canvas-编辑模式
   * @param {String} options.platform - AI平台
   * @param {String} options.model - 使用的模型
   * @returns {Promise<Object>} 返回创建的会话信息
   */
  const initSession = async (options = {}) => {
    try {
      isSaving.value = true
      
      const sessionData = {
        userId,
        sessionTitle: options.sessionTitle || '新对话',
        mode: options.mode || 'chat',
        platform: options.platform || 'openai',
        model: options.model || ''
      }
      
      const result = await createSession(sessionData)
      sessionId.value = result.id
      currentSession.value = result
      
      console.log('会话初始化成功:', result)
      return result
    } catch (error) {
      console.error('初始化会话失败:', error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  /**
   * 保存单条消息
   * @param {Object} messageData - 消息数据
   * @param {String} messageData.role - 消息角色：user-用户, assistant-助手
   * @param {String} messageData.content - 消息内容
   * @param {Number} messageData.hasThink - 是否包含思考过程
   * @param {String} messageData.thinkContent - 思考过程内容
   * @param {Number} messageData.tokenCount - Token数量
   * @returns {Promise<Object>} 返回保存的消息信息
   */
  const saveMessage = async (messageData) => {
    if (!sessionId.value) {
      console.warn('会话未初始化，无法保存消息')
      return null
    }

    try {
      isSaving.value = true
      
      const message = {
        sessionId: sessionId.value,
        role: messageData.role,
        content: messageData.content,
        hasThink: messageData.hasThink ? 1 : 0,
        thinkContent: messageData.thinkContent || null,
        tokenCount: messageData.tokenCount || 0
      }
      
      const result = await addMessage(message)
      console.log('消息保存成功:', result)
      
      // 从失败队列中移除（如果存在）
      failedMessages.value = failedMessages.value.filter(
        msg => msg.content !== messageData.content
      )
      
      return result
    } catch (error) {
      console.error('保存消息失败:', error)
      
      // 添加到失败队列，用于后续重试
      failedMessages.value.push({
        ...messageData,
        timestamp: Date.now()
      })
      
      throw error
    } finally {
      isSaving.value = false
    }
  }

  /**
   * 批量保存消息
   * @param {Array<Object>} messages - 消息列表
   * @returns {Promise<Array>} 返回保存的消息列表
   */
  const batchSaveMessages = async (messages) => {
    if (!sessionId.value) {
      console.warn('会话未初始化，无法保存消息')
      return []
    }

    try {
      isSaving.value = true
      
      const messagesToSave = messages.map(msg => ({
        sessionId: sessionId.value,
        role: msg.role,
        content: msg.content,
        hasThink: msg.hasThink ? 1 : 0,
        thinkContent: msg.thinkContent || null,
        tokenCount: msg.tokenCount || 0
      }))
      
      // 逐条保存（因为API可能不支持批量添加）
      const results = []
      for (const message of messagesToSave) {
        try {
          const result = await addMessage(message)
          results.push(result)
        } catch (error) {
          console.error('保存单条消息失败:', error)
          failedMessages.value.push(message)
        }
      }
      
      console.log('批量消息保存完成，成功:', results.length, '失败:', failedMessages.value.length)
      return results
    } finally {
      isSaving.value = false
    }
  }

  /**
   * 更新会话标题
   * @param {String} title - 新标题
   * @returns {Promise<Boolean>} 返回是否更新成功
   */
  const updateTitle = async (title) => {
    if (!sessionId.value) {
      console.warn('会话未初始化，无法更新标题')
      return false
    }

    try {
      isSaving.value = true
      const result = await updateSessionTitle(sessionId.value, title)
      
      if (currentSession.value) {
        currentSession.value.sessionTitle = title
      }
      
      console.log('会话标题更新成功')
      return result
    } catch (error) {
      console.error('更新会话标题失败:', error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  /**
   * 更新会话信息
   * @param {Object} sessionData - 会话数据
   * @returns {Promise<Object>} 返回更新后的会话信息
   */
  const updateSessionInfo = async (sessionData) => {
    if (!sessionId.value) {
      console.warn('会话未初始化，无法更新会话')
      return null
    }

    try {
      isSaving.value = true
      
      const data = {
        id: sessionId.value,
        ...sessionData
      }
      
      const result = await updateSession(data)
      currentSession.value = result
      
      console.log('会话信息更新成功')
      return result
    } catch (error) {
      console.error('更新会话信息失败:', error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  /**
   * 重试保存失败的消息
   * @returns {Promise<Array>} 返回重试成功的消息列表
   */
  const retryFailedMessages = async () => {
    if (failedMessages.value.length === 0) {
      console.log('没有失败的消息需要重试')
      return []
    }

    console.log('开始重试失败的消息，数量:', failedMessages.value.length)
    
    const successMessages = []
    const stillFailedMessages = []

    for (const message of failedMessages.value) {
      try {
        const result = await addMessage(message)
        successMessages.push(result)
      } catch (error) {
        console.error('重试保存消息失败:', error)
        stillFailedMessages.push(message)
      }
    }

    failedMessages.value = stillFailedMessages
    console.log('重试完成，成功:', successMessages.length, '仍失败:', stillFailedMessages.length)
    
    return successMessages
  }

  /**
   * 清空失败队列
   */
  const clearFailedMessages = () => {
    failedMessages.value = []
  }

  /**
   * 获取失败消息数量
   */
  const failedMessageCount = computed(() => failedMessages.value.length)

  /**
   * 启用/禁用自动保存
   * @param {Boolean} enabled - 是否启用
   */
  const setAutoSaveEnabled = (enabled) => {
    autoSaveEnabled.value = enabled
    console.log('自动保存已', enabled ? '启用' : '禁用')
  }

  return {
    // 状态
    sessionId,
    currentSession,
    isSaving,
    autoSaveEnabled,
    failedMessages,
    failedMessageCount,
    
    // 方法
    initSession,
    saveMessage,
    batchSaveMessages,
    updateTitle,
    updateSessionInfo,
    retryFailedMessages,
    clearFailedMessages,
    setAutoSaveEnabled
  }
}
