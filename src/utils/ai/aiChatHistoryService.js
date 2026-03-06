import { pbRequest } from '@/public/pbRequest/index'

/**
 * AI对话历史服务
 * 用于管理AI对话会话、消息和编辑历史的API调用
 */

// ============ 会话管理 API ============

/**
 * 创建新的对话会话
 * @param {Object} sessionData - 会话数据
 * @param {Long} sessionData.userId - 用户ID
 * @param {String} sessionData.sessionTitle - 会话标题
 * @param {String} sessionData.mode - 对话模式：chat-对话模式, canvas-编辑模式
 * @param {String} sessionData.platform - AI平台：openai, deepseek, ollama等
 * @param {String} sessionData.model - 使用的模型名称
 * @returns {Promise<Object>} 返回创建的会话信息
 */
export const createSession = async (sessionData) => {
  try {
    const response = await pbRequest.post('/eam/ai/session/create', sessionData)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '创建会话失败')
    }
  } catch (error) {
    console.error('创建会话失败:', error)
    throw error
  }
}

/**
 * 获取用户的对话会话列表（分页）
 * @param {Long} userId - 用户ID
 * @param {Number} pageNum - 页码，默认1
 * @param {Number} pageSize - 每页数量，默认10
 * @returns {Promise<Object>} 返回分页的会话列表
 */
export const getSessionsByUserId = async (userId, pageNum = 1, pageSize = 10) => {
  try {
    const response = await pbRequest.get('/eam/ai/session/list', {
      params: {
        userId,
        pageNum,
        pageSize
      }
    })
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '获取会话列表失败')
    }
  } catch (error) {
    console.error('获取会话列表失败:', error)
    throw error
  }
}

/**
 * 获取用户的对话会话列表（不分页）
 * @param {Long} userId - 用户ID
 * @returns {Promise<Array>} 返回所有会话列表
 */
export const getSessionListByUserId = async (userId) => {
  try {
    const response = await pbRequest.get('/eam/ai/session/listAll', {
      params: { userId }
    })
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '获取会话列表失败')
    }
  } catch (error) {
    console.error('获取会话列表失败:', error)
    throw error
  }
}

/**
 * 获取会话详情
 * @param {Long} sessionId - 会话ID
 * @param {Long} userId - 用户ID
 * @returns {Promise<Object>} 返回会话详情
 */
export const getSessionDetail = async (sessionId, userId) => {
  try {
    const response = await pbRequest.get(`/eam/ai/session/${sessionId}`, {
      params: { userId }
    })
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '获取会话详情失败')
    }
  } catch (error) {
    console.error('获取会话详情失败:', error)
    throw error
  }
}

/**
 * 更新会话信息
 * @param {Object} sessionData - 会话数据（包含id）
 * @returns {Promise<Object>} 返回更新后的会话信息
 */
export const updateSession = async (sessionData) => {
  try {
    const response = await pbRequest.put('/eam/ai/session/update', sessionData)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '更新会话失败')
    }
  } catch (error) {
    console.error('更新会话失败:', error)
    throw error
  }
}

/**
 * 更新会话标题
 * @param {Long} sessionId - 会话ID
 * @param {String} title - 新标题
 * @returns {Promise<Boolean>} 返回是否更新成功
 */
export const updateSessionTitle = async (sessionId, title) => {
  try {
    const response = await pbRequest.put(`/eam/ai/session/${sessionId}/title`, null, {
      params: { title }
    })
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '更新会话标题失败')
    }
  } catch (error) {
    console.error('更新会话标题失败:', error)
    throw error
  }
}

/**
 * 删除会话
 * @param {Long} sessionId - 会话ID
 * @returns {Promise<Boolean>} 返回是否删除成功
 */
export const deleteSession = async (sessionId) => {
  try {
    const response = await pbRequest.delete(`/eam/ai/session/${sessionId}`)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '删除会话失败')
    }
  } catch (error) {
    console.error('删除会话失败:', error)
    throw error
  }
}

/**
 * 批量删除会话
 * @param {Array<Long>} sessionIds - 会话ID列表
 * @returns {Promise<Boolean>} 返回是否删除成功
 */
export const batchDeleteSessions = async (sessionIds) => {
  try {
    const response = await pbRequest.delete('/eam/ai/session/batch', {
      data: sessionIds
    })
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '批量删除会话失败')
    }
  } catch (error) {
    console.error('批量删除会话失败:', error)
    throw error
  }
}

/**
 * 清空用户的所有会话
 * @param {Long} userId - 用户ID
 * @returns {Promise<Boolean>} 返回是否清空成功
 */
export const clearUserSessions = async (userId) => {
  try {
    const response = await pbRequest.delete(`/eam/ai/session/clear/${userId}`)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '清空会话失败')
    }
  } catch (error) {
    console.error('清空会话失败:', error)
    throw error
  }
}

// ============ 消息管理 API ============

/**
 * 添加消息
 * @param {Object} messageData - 消息数据
 * @param {Long} messageData.sessionId - 会话ID
 * @param {String} messageData.role - 消息角色：user-用户, assistant-助手
 * @param {String} messageData.content - 消息内容
 * @param {Number} messageData.hasThink - 是否包含思考过程：0-否, 1-是
 * @param {String} messageData.thinkContent - 思考过程内容
 * @param {Number} messageData.tokenCount - Token数量（可选）
 * @returns {Promise<Object>} 返回添加的消息信息
 */
export const addMessage = async (messageData) => {
  try {
    const response = await pbRequest.post('/eam/ai/message/add', messageData)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '添加消息失败')
    }
  } catch (error) {
    console.error('添加消息失败:', error)
    throw error
  }
}

/**
 * 获取会话的消息列表（分页）
 * @param {Long} sessionId - 会话ID
 * @param {Number} pageNum - 页码，默认1
 * @param {Number} pageSize - 每页数量，默认20
 * @returns {Promise<Object>} 返回分页的消息列表
 */
export const getMessagesBySessionId = async (sessionId, pageNum = 1, pageSize = 20) => {
  try {
    const response = await pbRequest.get('/eam/ai/message/list', {
      params: {
        sessionId,
        pageNum,
        pageSize
      }
    })
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '获取消息列表失败')
    }
  } catch (error) {
    console.error('获取消息列表失败:', error)
    throw error
  }
}

/**
 * 获取会话的消息列表（不分页）
 * @param {Long} sessionId - 会话ID
 * @returns {Promise<Array>} 返回所有消息列表
 */
export const getMessageListBySessionId = async (sessionId) => {
  try {
    const response = await pbRequest.get('/eam/ai/message/listAll', {
      params: { sessionId }
    })
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '获取消息列表失败')
    }
  } catch (error) {
    console.error('获取消息列表失败:', error)
    throw error
  }
}

/**
 * 获取会话的消息数量
 * @param {Long} sessionId - 会话ID
 * @returns {Promise<Number>} 返回消息数量
 */
export const getMessageCount = async (sessionId) => {
  try {
    const response = await pbRequest.get('/eam/ai/message/count', {
      params: { sessionId }
    })
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '获取消息数量失败')
    }
  } catch (error) {
    console.error('获取消息数量失败:', error)
    throw error
  }
}

/**
 * 获取消息详情
 * @param {Long} messageId - 消息ID
 * @returns {Promise<Object>} 返回消息详情
 */
export const getMessageDetail = async (messageId) => {
  try {
    const response = await pbRequest.get(`/eam/ai/message/${messageId}`)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '获取消息详情失败')
    }
  } catch (error) {
    console.error('获取消息详情失败:', error)
    throw error
  }
}

/**
 * 删除消息
 * @param {Long} messageId - 消息ID
 * @returns {Promise<Boolean>} 返回是否删除成功
 */
export const deleteMessage = async (messageId) => {
  try {
    const response = await pbRequest.delete(`/eam/ai/message/${messageId}`)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '删除消息失败')
    }
  } catch (error) {
    console.error('删除消息失败:', error)
    throw error
  }
}

/**
 * 批量删除消息
 * @param {Array<Long>} messageIds - 消息ID列表
 * @returns {Promise<Boolean>} 返回是否删除成功
 */
export const batchDeleteMessages = async (messageIds) => {
  try {
    const response = await pbRequest.delete('/eam/ai/message/batch', {
      data: messageIds
    })
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '批量删除消息失败')
    }
  } catch (error) {
    console.error('批量删除消息失败:', error)
    throw error
  }
}

/**
 * 删除会话的所有消息
 * @param {Long} sessionId - 会话ID
 * @returns {Promise<Boolean>} 返回是否删除成功
 */
export const deleteMessagesBySessionId = async (sessionId) => {
  try {
    const response = await pbRequest.delete(`/eam/ai/message/session/${sessionId}`)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '删除会话消息失败')
    }
  } catch (error) {
    console.error('删除会话消息失败:', error)
    throw error
  }
}

/**
 * 批量添加消息
 * @param {Array<Object>} messageDTOs - 消息数据列表
 * @returns {Promise<Boolean>} 返回是否添加成功
 */
export const batchAddMessages = async (messageDTOs) => {
  try {
    const response = await pbRequest.post('/eam/ai/message/batchAdd', messageDTOs)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '批量添加消息失败')
    }
  } catch (error) {
    console.error('批量添加消息失败:', error)
    throw error
  }
}

// ============ 编辑历史管理 API ============

/**
 * 记录编辑历史
 * @param {Object} historyData - 编辑历史数据
 * @param {Long} historyData.sessionId - 会话ID
 * @param {Long} historyData.userId - 用户ID
 * @param {String} historyData.filePath - 文件路径
 * @param {String} historyData.editPrompt - 编辑指令
 * @param {String} historyData.summary - 修改摘要
 * @param {String} historyData.beforeContent - 修改前内容
 * @param {String} historyData.afterContent - 修改后内容
 * @param {String} historyData.diffJson - 差异信息（JSON格式）
 * @returns {Promise<Object>} 返回记录的编辑历史信息
 */
export const recordEditHistory = async (historyData) => {
  try {
    const response = await pbRequest.post('/eam/ai/editHistory/record', historyData)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '记录编辑历史失败')
    }
  } catch (error) {
    console.error('记录编辑历史失败:', error)
    throw error
  }
}

/**
 * 获取会话的编辑历史（分页）
 * @param {Long} sessionId - 会话ID
 * @param {Number} pageNum - 页码，默认1
 * @param {Number} pageSize - 每页数量，默认10
 * @returns {Promise<Object>} 返回分页的编辑历史列表
 */
export const getHistoryBySessionId = async (sessionId, pageNum = 1, pageSize = 10) => {
  try {
    const response = await pbRequest.get(`/eam/ai/editHistory/session/${sessionId}`, {
      params: {
        pageNum,
        pageSize
      }
    })
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '获取编辑历史失败')
    }
  } catch (error) {
    console.error('获取编辑历史失败:', error)
    throw error
  }
}

/**
 * 获取会话的编辑历史（不分页）
 * @param {Long} sessionId - 会话ID
 * @returns {Promise<Array>} 返回所有编辑历史列表
 */
export const getHistoryListBySessionId = async (sessionId) => {
  try {
    const response = await pbRequest.get(`/eam/ai/editHistory/session/${sessionId}/all`)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '获取编辑历史失败')
    }
  } catch (error) {
    console.error('获取编辑历史失败:', error)
    throw error
  }
}

/**
 * 获取用户的编辑历史（分页）
 * @param {Long} userId - 用户ID
 * @param {Number} pageNum - 页码，默认1
 * @param {Number} pageSize - 每页数量，默认10
 * @returns {Promise<Object>} 返回分页的编辑历史列表
 */
export const getHistoryByUserId = async (userId, pageNum = 1, pageSize = 10) => {
  try {
    const response = await pbRequest.get(`/eam/ai/editHistory/user/${userId}`, {
      params: {
        pageNum,
        pageSize
      }
    })
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '获取用户编辑历史失败')
    }
  } catch (error) {
    console.error('获取用户编辑历史失败:', error)
    throw error
  }
}

/**
 * 获取文件的编辑历史
 * @param {String} filePath - 文件路径
 * @returns {Promise<Array>} 返回文件的编辑历史列表
 */
export const getHistoryByFilePath = async (filePath) => {
  try {
    const response = await pbRequest.get('/eam/ai/editHistory/file', {
      params: { filePath }
    })
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '获取文件编辑历史失败')
    }
  } catch (error) {
    console.error('获取文件编辑历史失败:', error)
    throw error
  }
}

/**
 * 获取编辑历史详情
 * @param {Long} historyId - 编辑历史ID
 * @returns {Promise<Object>} 返回编辑历史详情
 */
export const getHistoryDetail = async (historyId) => {
  try {
    const response = await pbRequest.get(`/eam/ai/editHistory/${historyId}`)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '获取编辑历史详情失败')
    }
  } catch (error) {
    console.error('获取编辑历史详情失败:', error)
    throw error
  }
}

/**
 * 删除编辑历史
 * @param {Long} historyId - 编辑历史ID
 * @returns {Promise<Boolean>} 返回是否删除成功
 */
export const deleteHistory = async (historyId) => {
  try {
    const response = await pbRequest.delete(`/eam/ai/editHistory/${historyId}`)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '删除编辑历史失败')
    }
  } catch (error) {
    console.error('删除编辑历史失败:', error)
    throw error
  }
}

/**
 * 批量删除编辑历史
 * @param {Array<Long>} historyIds - 编辑历史ID列表
 * @returns {Promise<Boolean>} 返回是否删除成功
 */
export const batchDeleteHistory = async (historyIds) => {
  try {
    const response = await pbRequest.delete('/eam/ai/editHistory/batch', {
      data: historyIds
    })
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '批量删除编辑历史失败')
    }
  } catch (error) {
    console.error('批量删除编辑历史失败:', error)
    throw error
  }
}

/**
 * 删除会话的所有编辑历史
 * @param {Long} sessionId - 会话ID
 * @returns {Promise<Boolean>} 返回是否删除成功
 */
export const deleteHistoryBySessionId = async (sessionId) => {
  try {
    const response = await pbRequest.delete(`/eam/ai/editHistory/session/${sessionId}/all`)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '删除会话编辑历史失败')
    }
  } catch (error) {
    console.error('删除会话编辑历史失败:', error)
    throw error
  }
}

/**
 * 获取文件的版本对比
 * @param {Long} historyId - 编辑历史ID
 * @returns {Promise<Object>} 返回版本对比信息
 */
export const getVersionComparison = async (historyId) => {
  try {
    const response = await pbRequest.get(`/eam/ai/editHistory/${historyId}/compare`)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '获取版本对比失败')
    }
  } catch (error) {
    console.error('获取版本对比失败:', error)
    throw error
  }
}
