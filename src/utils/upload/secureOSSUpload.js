import { pbRequest } from '../../public/pbRequest/index.js'
import CryptoJS from 'crypto-js'

/**
 * 获取OSS上传临时凭证
 * @param {string} uploadPath - 上传路径前缀，默认为 "images/"
 * @returns {Promise<Object>} 包含临时凭证的响应数据
 */
export async function getOSSUploadToken(uploadPath = 'images/') {
  try {
    const SECRET_KEY = "do-task-secret-key"; // 加密密钥
    
    const cacheKey = `ossUploadToken:${uploadPath}`;
    const cachedRaw = localStorage.getItem(cacheKey);
    
    if (cachedRaw) {
      try {
        // 解密
        const decryptedInfo = CryptoJS.AES.decrypt(cachedRaw, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        const cached = JSON.parse(decryptedInfo);
        const now = Date.now();
        const expireMs = typeof cached.expiration === 'number'
          ? cached.expiration
          : (cached.expiration ? Date.parse(cached.expiration) : 0);
        // 预留60秒安全缓冲
        if (expireMs && now + 60000 < expireMs) {
          return { code: 200, data: cached }
        }
      } catch (_) {
        // ignore broken cache
      }
    }

    const response = await pbRequest.get(`/eam/oss/uploadToken?uploadPath=${uploadPath}`)
    // 成功则写入缓存（包含过期时间字段）
    if (response?.data?.code === 200 && response.data.data) {
      // 上传信息进行加密
      const encryptedInfo = CryptoJS.AES.encrypt( JSON.stringify(response.data.data), SECRET_KEY).toString();
      localStorage.setItem(cacheKey, encryptedInfo); // 存储缓存
    }
    return response.data
  } catch (error) {
    console.error('获取OSS上传凭证失败:', error)
    throw new Error('获取上传凭证失败')
  }
}

/**
 * 验证文件类型和大小
 * @param {string} fileName - 文件名
 * @param {number} fileSize - 文件大小（字节）
 * @returns {Promise<boolean>} 验证结果
 */
export async function validateOSSFile(fileName, fileSize) {
  try {
    const params = new URLSearchParams()
    params.append('fileName', fileName)
    params.append('fileSize', fileSize.toString())

    const response = await pbRequest.post('/eam/oss/validateFile', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data.code === 200 && response.data.data === true
  } catch (error) {
    console.error('文件验证失败:', error)
    return false
  }
}

/**
 * 获取OSS配置信息
 * @returns {Promise<Object>} OSS配置信息
 */
export async function getOSSConfig() {
  try {
    const response = await pbRequest.get('/eam/oss/config')
    return response.data
  } catch (error) {
    console.error('获取OSS配置失败:', error)
    throw new Error('获取OSS配置失败')
  }
}

/**
 * 使用临时凭证上传文件到OSS
 * @param {File|Blob} file - 要上传的文件
 * @param {string} uploadPath - 上传路径前缀，默认为 "images/"
 * @param {Object} options - 上传选项
 * @param {string} options.customFileName - 自定义文件名（可选）
 * @param {string} options.contentType - 文件类型（可选）
 * @returns {Promise<Object>} 上传结果
 */
export async function uploadToOSS(file, uploadPath = 'images/', options = {}) {
  try {
    // 1. 获取上传凭证
    const tokenResponse = await getOSSUploadToken(uploadPath)
    if (tokenResponse.code !== 200) {
      throw new Error(tokenResponse.message || '获取上传凭证失败')
    }
    
    const credentials = tokenResponse.data
    
    // 2. 验证文件
    const extFromType = file.type && file.type.includes('/') ? file.type.split('/')[1] : 'bin'
    const fallbackName = `upload_${Date.now()}.${extFromType}`
    const originalName = (file && typeof file.name === 'string' && file.name.length > 0) ? file.name : fallbackName
    const isValid = await validateOSSFile(originalName, file.size || 0)
    if (!isValid) {
      throw new Error('文件类型或大小不符合要求')
    }
    
    // 3. 生成唯一文件名
    const fileExtension = (originalName.includes('.') ? originalName.split('.').pop() : extFromType) || 'bin'
    const fileName = options.customFileName || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`
    const objectKey = `${credentials.uploadPath}${fileName}`
    
    // 4. 创建FormData对象（优先按 demo.html 的 OSS v4 表单字段组装）
    const formData = new FormData()
    const host = credentials.host || credentials.endpoint || ''
    const dir = credentials.dir || credentials.uploadPath || ''

    // 保证 objectKey 与最终 key 一致
    const finalKey = dir ? `${dir}${fileName}` : objectKey

    formData.append('success_action_status', '200')
    formData.append('key', finalKey)
    formData.append('policy', credentials.policy)
      // 按 demo.html 的字段命名
      formData.append('x-oss-signature', credentials.signature)
      formData.append('x-oss-signature-version', 'OSS4-HMAC-SHA256')
      formData.append('x-oss-credential',  credentials.xossCredential)
  
      formData.append('x-oss-date',  credentials.xossDate)
      formData.append('x-oss-security-token', credentials.securityToken )

    if (file && file.type) {
      formData.append('Content-Type', options.contentType || file.type)
    }
    // file 必须放在最后
    formData.append('file', file)
    
    // 5. 上传文件到OSS（使用 Bucket 级别域名以通过 CORS）
    const endpointHost = (host || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
    const bucketEndpoint = credentials.bucketName && !host.includes(credentials.bucketName)
      ? `https://${credentials.bucketName}.${endpointHost}`
      : (host || '')
    const uploadResponse = await fetch(bucketEndpoint, {
      method: 'POST',
      body: formData
    })
    
    if (!uploadResponse.ok) {
      throw new Error(`上传失败: ${uploadResponse.status} ${uploadResponse.statusText}`)
    }
    
    // 6. 返回上传结果
    const fileUrl = `${bucketEndpoint}/${finalKey}`
    return {
      success: true,
      url: fileUrl,
      objectKey: finalKey,
      fileName: fileName
    }
    
  } catch (error) {
    console.error('OSS上传失败:', error)
    return {
      success: false,
      error: error.message || '上传失败'
    }
  }
}

/**
 * 上传图片文件（专门用于图片上传）
 * @param {File|Blob} file - 图片文件
 * @param {string} uploadPath - 上传路径前缀，默认为 "images/"
 * @param {Object} options - 上传选项
 * @returns {Promise<Object>} 上传结果
 */
export async function uploadImageToOSS(file, uploadPath = 'images/', options = {}) {
  // 确保是图片文件
  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      error: '只能上传图片文件'
    }
  }
  
  return await uploadToOSS(file, uploadPath, options)
}

/**
 * 上传用户头像
 * @param {File|Blob} file - 头像文件
 * @returns {Promise<Object>} 上传结果
 */
export async function uploadAvatarToOSS(file) {
  return await uploadImageToOSS(file, 'images/avatar/')
}

/**
 * 上传任务图片
 * @param {File|Blob} file - 任务图片文件
 * @returns {Promise<Object>} 上传结果
 */
export async function uploadTaskImageToOSS(file) {
  return await uploadImageToOSS(file, 'images/task/')
}
