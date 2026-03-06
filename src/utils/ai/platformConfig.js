/**
 * AI Platform Configuration and API Handler
 * Manages different LLM platform configurations and API calls
 */

// Platform categories
export const platformCategories = {
  cloud: '云服务平台',
  local: '本地部署',
  other: '其他'
}

// Platform configuration metadata
export const platformConfigs = {
  openai: {
    name: 'OpenAI',
    category: 'cloud',
    endpoint: 'API端点',
    defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
    placeholder: 'https://api.openai.com/v1/chat/completions',
    modelPlaceholder: '例如：gpt-4, gpt-3.5-turbo',
    keyLabel: 'API密钥',
    keyPlaceholder: '输入OpenAI API密钥',
    supportsModelList: true
  },
  azure: {
    name: 'Azure OpenAI',
    category: 'cloud',
    endpoint: 'Azure端点',
    defaultEndpoint: '', // Azure需要用户自定义资源名称和部署ID
    placeholder: 'https://<resource-name>.openai.azure.com/openai/deployments/<deployment-id>/chat/completions?api-version=2024-02-15-preview',
    modelPlaceholder: '输入部署名称（deployment-id）',
    keyLabel: 'API密钥',
    keyPlaceholder: '输入Azure API密钥',
    supportsModelList: false,
    hideModelSelector: false, // Azure需要输入部署名称
    requiresApiVersion: true, // Azure需要api-version参数
    note: '请将<resource-name>和<deployment-id>替换为您的实际值'
  },
  anthropic: {
    name: 'Anthropic Claude',
    category: 'cloud',
    endpoint: 'API端点',
    defaultEndpoint: 'https://api.anthropic.com/v1/messages',
    placeholder: 'https://api.anthropic.com/v1/messages',
    modelPlaceholder: '例如：claude-3-5-sonnet-20241022, claude-3-opus-20240229',
    keyLabel: 'API密钥',
    keyPlaceholder: '输入Anthropic API密钥',
    supportsModelList: false
  },
  google: {
    name: 'Google Gemini',
    category: 'cloud',
    endpoint: 'API端点',
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    placeholder: 'https://generativelanguage.googleapis.com/v1beta/models',
    modelPlaceholder: '例如：gemini-pro, gemini-1.5-pro',
    keyLabel: 'API密钥',
    keyPlaceholder: '输入Google API密钥',
    supportsModelList: true
  },
  deepseek: {
    name: 'DeepSeek',
    category: 'cloud',
    endpoint: 'API端点',
    defaultEndpoint: 'https://api.deepseek.com/chat/completions',
    placeholder: 'https://api.deepseek.com/chat/completions',
    modelPlaceholder: '例如：deepseek-chat',
    keyLabel: 'API密钥',
    keyPlaceholder: '输入DeepSeek API密钥',
    supportsModelList: false, // DeepSeek使用固定模型，不需要选择
    hideModelSelector: true, // 隐藏模型选择器
    defaultModel: 'deepseek-chat' // 默认模型
  },
  qwen: {
    name: '阿里云 Qwen',
    category: 'cloud',
    endpoint: 'API端点',
    defaultEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    placeholder: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    modelPlaceholder: '例如：qwen-max, qwen-plus, qwen-turbo',
    keyLabel: 'API密钥',
    keyPlaceholder: '输入阿里云API密钥',
    supportsModelList: false,
    hideModelSelector: false,
    note: '使用OpenAI兼容模式端点'
  },
  baidu: {
    name: '百度 Ernie',
    category: 'cloud',
    endpoint: 'API端点',
    defaultEndpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-4.0-8k-latest',
    placeholder: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-4.0-8k-latest',
    modelPlaceholder: '模型已包含在端点中',
    keyLabel: 'Access Token',
    keyPlaceholder: '输入百度Access Token',
    supportsModelList: false,
    hideModelSelector: true, // 百度的模型在端点URL中指定
    note: '模型名称已包含在端点URL中，如：/chat/ernie-4.0-8k-latest'
  },
  ollama: {
    name: 'Ollama',
    category: 'local',
    endpoint: 'Ollama服务地址',
    defaultEndpoint: 'http://localhost:11434',
    placeholder: 'http://localhost:11434',
    modelPlaceholder: '例如：llama2, mistral, qwen',
    keyLabel: 'API密钥',
    keyPlaceholder: '通常不需要（可选）',
    supportsModelList: true,
    modelsEndpoint: '/api/tags',
    chatEndpoint: '/api/chat',
    generateEndpoint: '/api/generate',
    supportsStreaming: true
  },
  'lm-studio': {
    name: 'LM Studio',
    category: 'local',
    endpoint: 'LM Studio服务地址',
    defaultEndpoint: 'http://localhost:1234/v1/chat/completions',
    placeholder: 'http://localhost:1234/v1/chat/completions',
    modelPlaceholder: '输入已加载的模型名称',
    keyLabel: 'API密钥',
    keyPlaceholder: '通常不需要（可选）',
    supportsModelList: true
  },
  vllm: {
    name: 'vLLM',
    category: 'local',
    endpoint: 'vLLM服务地址',
    defaultEndpoint: 'http://localhost:8000/v1/chat/completions',
    placeholder: 'http://localhost:8000/v1/chat/completions',
    modelPlaceholder: '输入已加载的模型名称',
    keyLabel: 'API密钥',
    keyPlaceholder: '通常不需要（可选）',
    supportsModelList: true
  },
  'text-generation-webui': {
    name: 'Text Generation WebUI',
    category: 'local',
    endpoint: 'Text Generation WebUI服务地址',
    defaultEndpoint: 'http://localhost:5000/api/v1/chat/completions',
    placeholder: 'http://localhost:5000/api/v1/chat/completions',
    modelPlaceholder: '输入已加载的模型名称',
    keyLabel: 'API密钥',
    keyPlaceholder: '通常不需要（可选）',
    supportsModelList: true
  },
  custom: {
    name: '自定义',
    category: 'other',
    endpoint: 'API端点',
    defaultEndpoint: '',
    placeholder: '输入自定义API端点',
    modelPlaceholder: '输入模型名称',
    keyLabel: 'API密钥',
    keyPlaceholder: '输入API密钥（如果需要）',
    supportsModelList: false
  }
}

/**
 * Fetch available models from the platform
 * @param {string} platform - Platform identifier
 * @param {string} endpoint - API endpoint
 * @param {string} apiKey - API key (optional)
 * @returns {Promise<Array>} Array of available model names
 */
export async function fetchAvailableModels(platform, endpoint, apiKey) {
  if (!endpoint) {
    throw new Error('请先输入API端点')
  }

  try {
    let response
    let modelsEndpoint = endpoint

    if (platform === 'openai' || platform === 'deepseek') {
      modelsEndpoint = endpoint.replace('/chat/completions', '/models')
      response = await fetch(modelsEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        }
      })
    } else if (platform === 'google') {
      modelsEndpoint = endpoint.replace('/models', '') + '?key=' + apiKey
      response = await fetch(modelsEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } else if (platform === 'ollama') {
      const config = platformConfigs[platform]
      modelsEndpoint = endpoint + config.modelsEndpoint
      response = await fetch(modelsEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } else if (platform === 'lm-studio' || platform === 'vllm' || platform === 'text-generation-webui') {
      modelsEndpoint = endpoint.replace('/chat/completions', '/models')
      response = await fetch(modelsEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } else {
      modelsEndpoint = endpoint.replace('/chat/completions', '/models')
      response = await fetch(modelsEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        }
      })
    }

    if (!response.ok) {
      throw new Error(`获取模型列表失败: ${response.status}`)
    }

    const data = await response.json()
    return parseModelsResponse(platform, data)
  } catch (error) {
    console.error('获取模型列表失败:', error)
    throw error
  }
}

/**
 * Get platforms grouped by category
 * @returns {Object} Platforms grouped by category
 */
export function getPlatformsByCategory() {
  const grouped = {}
  
  Object.entries(platformConfigs).forEach(([key, config]) => {
    const category = config.category
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push({
      id: key,
      name: config.name,
      ...config
    })
  })
  
  return grouped
}

/**
 * Parse models response based on platform format
 * @param {string} platform - Platform identifier
 * @param {Object} data - Response data
 * @returns {Array} Array of model names
 */
function parseModelsResponse(platform, data) {
  if (platform === 'ollama') {
    if (data.models && Array.isArray(data.models)) {
      return data.models.map(m => m.name)
    }
  } else if (data.data && Array.isArray(data.data)) {
    // OpenAI format
    return data.data.map(m => m.id)
  } else if (Array.isArray(data.models)) {
    return data.models.map(m => typeof m === 'string' ? m : m.id)
  } else if (Array.isArray(data)) {
    return data.map(m => typeof m === 'string' ? m : m.id)
  }
  return []
}

/**
 * Build request body based on platform
 * @param {string} platform - Platform identifier
 * @param {string} model - Model name
 * @param {string} systemPrompt - System prompt
 * @param {string} userPrompt - User prompt
 * @param {string} mode - Mode: 'chat' or 'canvas' (optional)
 * @returns {Object} Request body
 */
export function buildRequestBody(platform, model, systemPrompt, userPrompt, mode = 'chat') {
  switch (platform) {
    case 'openai':
    case 'custom':
    case 'lm-studio':
    case 'vllm':
    case 'text-generation-webui':
      const openaiBody = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: mode === 'chat'
      }
      // 编辑模式下强制 JSON 格式
      if (mode === 'canvas') {
        openaiBody.response_format = { type: 'json_object' }
      }
      return openaiBody

    case 'deepseek':
      // DeepSeek使用固定模型deepseek-chat
      const deepseekBody = {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: mode === 'chat'
      }
      if (mode === 'canvas') {
        deepseekBody.response_format = { type: 'json_object' }
      }
      return deepseekBody

    case 'azure':
      const azureBody = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      }
      // 编辑模式下强制 JSON 格式
      if (mode === 'canvas') {
        azureBody.response_format = { type: 'json_object' }
      }
      return azureBody

    case 'anthropic':
      return {
        model,
        max_tokens: 2048,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        system: systemPrompt
      }

    case 'google':
      return {
        contents: [
          {
            parts: [
              { text: userPrompt }
            ]
          }
        ]
      }

    case 'qwen':
      const qwenBody = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: mode === 'chat'
      }
      // 编辑模式下强制 JSON 格式
      if (mode === 'canvas') {
        qwenBody.response_format = { type: 'json_object' }
      }
      return qwenBody

    case 'baidu':
      // 百度文心一言不需要在body中传model，模型在URL中指定
      const baiduBody = {
        messages: [
          { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
        ],
        stream: mode === 'chat'
      }
      if (mode === 'canvas') {
        baiduBody.response_format = { type: 'json_object' }
      }
      return baiduBody

    case 'ollama':
      // 编辑模式使用 /api/generate，不使用流模式
      if (mode === 'canvas') {
        return {
          model,
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          stream: false,
          format: 'json' // Ollama 使用 format 参数强制 JSON 输出
        }
      }
      // 对话模式使用 /api/chat，使用流模式
      return {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: true
      }

    default:
      const defaultBody = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: mode === 'chat'
      }
      // 编辑模式下强制 JSON 格式
      if (mode === 'canvas') {
        defaultBody.response_format = { type: 'json_object' }
      }
      return defaultBody
  }
}

/**
 * Build request headers based on platform
 * @param {string} platform - Platform identifier
 * @param {string} apiKey - API key (optional)
 * @returns {Object} Request headers
 */
export function buildRequestHeaders(platform, apiKey) {
  const headers = {
    'Content-Type': 'application/json'
  }

  switch (platform) {
    case 'openai':
    case 'deepseek':
    case 'qwen':
    case 'custom':
    case 'lm-studio':
    case 'vllm':
    case 'text-generation-webui':
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
      }
      break

    case 'azure':
      if (apiKey) {
        headers['api-key'] = apiKey
      }
      break

    case 'anthropic':
      if (apiKey) {
        headers['x-api-key'] = apiKey
        headers['anthropic-version'] = '2023-06-01'
      }
      break

    case 'baidu':
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
      }
      break
  }

  return headers
}

/**
 * Parse response based on platform format
 * @param {string} platform - Platform identifier
 * @param {Object} data - Response data
 * @returns {string|Object} Extracted content or object with think and content
 */
export function parseResponse(platform, data) {
  let content = ''
  
  switch (platform) {
    case 'ollama':
      // Ollama /api/chat returns message in message.content field
      content = data.message?.content || '无响应'
      break

    case 'openai':
    case 'deepseek':
    case 'azure':
    case 'qwen':
    case 'baidu':
    case 'custom':
    case 'lm-studio':
    case 'vllm':
    case 'text-generation-webui':
      content = data.choices?.[0]?.message?.content || '无响应'
      break

    case 'anthropic':
      content = data.content?.[0]?.text || '无响应'
      break

    case 'google':
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || '无响应'
      break

    default:
      content = data.choices?.[0]?.message?.content || '无响应'
  }

  // 检查是否包含 <think> 标签
  return extractThinkContent(content)
}

/**
 * Extract think content from response
 * @param {string} content - Response content
 * @returns {string|Object} If contains think tags, returns object with think and content, otherwise returns original content
 */
export function extractThinkContent(content) {
  // 检查完整的 <think>...</think> 标签
  const completeThinkRegex = /<think>([\s\S]*?)<\/think>/
  const completeMatch = content.match(completeThinkRegex)
  
  if (completeMatch) {
    const thinkContent = completeMatch[1].trim()
    const mainContent = content.replace(completeThinkRegex, '').trim()
    
    return {
      hasThink: true,
      isComplete: true,
      think: thinkContent,
      content: mainContent
    }
  }
  
  // 检查未闭合的 <think> 标签（流式输出中）
  const openThinkRegex = /<think>([\s\S]*)$/
  const openMatch = content.match(openThinkRegex)
  
  if (openMatch) {
    const thinkContent = openMatch[1].trim()
    const mainContent = content.substring(0, content.indexOf('<think>')).trim()
    
    return {
      hasThink: true,
      isComplete: false,
      think: thinkContent,
      content: mainContent
    }
  }
  
  return content
}

/**
 * Call AI API with platform-specific handling
 * @param {Object} config - Configuration object
 * @param {string} config.platform - Platform identifier
 * @param {string} config.endpoint - API endpoint
 * @param {string} config.model - Model name
 * @param {string} config.apiKey - API key (optional)
 * @param {string} config.systemPrompt - System prompt
 * @param {string} config.userPrompt - User prompt
 * @param {string} config.mode - Mode: 'chat' or 'canvas' (optional)
 * @param {Function} config.onChunk - Callback for streaming chunks (optional)
 * @returns {Promise<string>} API response content
 */
export async function callAIAPI(config) {
  const { platform, endpoint, model, apiKey, systemPrompt, userPrompt, mode = 'chat', onChunk } = config

  if (!endpoint) {
    throw new Error('请先配置AI API端点')
  }

  try {
    const requestBody = buildRequestBody(platform, model, systemPrompt, userPrompt, mode)
    const headers = buildRequestHeaders(platform, apiKey)

    // Determine the actual endpoint to use
    let actualEndpoint = endpoint
    if (platform === 'ollama') {
      const platformConfig = platformConfigs[platform]
      // 编辑模式使用 /api/generate，对话模式使用 /api/chat
      if (mode === 'canvas') {
        actualEndpoint = endpoint + platformConfig.generateEndpoint
      } else {
        actualEndpoint = endpoint + platformConfig.chatEndpoint
      }
    }

    const response = await fetch(actualEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    // Handle streaming responses
    if (requestBody.stream) {
      // 对于 Ollama，使用特定的处理函数
      if (platform === 'ollama') {
        return await handleOllamaStream(response, onChunk)
      }
      // 对于其他平台，使用通用的流式处理
      return await handleGenericStream(response, platform, onChunk)
    }

    // Handle non-streaming responses
    const data = await response.json()
    
    // Ollama /api/generate 返回格式不同
    if (platform === 'ollama' && mode === 'canvas') {
      return data.response || '无响应'
    }
    
    return parseResponse(platform, data)
  } catch (error) {
    console.error('API调用失败:', error)
    throw error
  }
}

/**
 * Handle streaming response from Ollama
 * @param {Response} response - Fetch response object
 * @param {Function} onChunk - Callback for each chunk (optional)
 * @returns {Promise<string>} Concatenated response text
 */
async function handleOllamaStream(response, onChunk) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullResponse = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line)
            // Ollama /api/chat returns message in message.content field
            if (json.message?.content) {
              fullResponse += json.message.content
              // Call the callback with the chunk if provided
              if (onChunk) {
                onChunk(json.message.content)
              }
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullResponse || '无响应'
}

/**
 * Handle generic streaming response (OpenAI format, etc.)
 * @param {Response} response - Fetch response object
 * @param {string} platform - Platform identifier
 * @param {Function} onChunk - Callback for each chunk (optional)
 * @returns {Promise<string>} Concatenated response text
 */
async function handleGenericStream(response, platform, onChunk) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullResponse = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.trim() && line.startsWith('data: ')) {
          try {
            const data = line.slice(6) // Remove 'data: ' prefix
            if (data === '[DONE]') break
            
            const json = JSON.parse(data)
            let content = ''
            
            // Extract content based on platform format
            if (platform === 'openai' || platform === 'deepseek' || platform === 'custom' || 
                platform === 'lm-studio' || platform === 'vllm' || platform === 'text-generation-webui') {
              // OpenAI format
              content = json.choices?.[0]?.delta?.content || ''
            } else if (platform === 'qwen') {
              // Qwen format
              content = json.choices?.[0]?.delta?.content || ''
            }
            
            if (content) {
              fullResponse += content
              if (onChunk) {
                onChunk(content)
              }
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullResponse || '无响应'
}
