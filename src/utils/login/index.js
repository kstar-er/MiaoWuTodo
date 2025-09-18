import { pbRequest, loading } from "../../public/pbRequest/index"
const handleAsync = ({ url, params }) => {
  return new Promise((resolve, reject) => {
    pbRequest.post(url, params).then(res => {
      let { data: { code, data, message } } = res
      if (code === 200) {
        resolve({ data, code })
      } else {
        resolve(message)
      }
    })
  })
}

const userLogin = function(params) {
  return handleAsync({ url: '/eam/auth/login', params })
}

/**
 * 发送注册邮箱验证码
 * @param {{ email: string }} params
 */
const sendRegisterCode = function(params) {
  return handleAsync({ url: '/eam/auth/sendEmailCode?email='+ params.email })
}

/**
 * 用户注册
 * @param {{ email: string, username: string, password: string, code: string }} params
 */
const userRegister = function(params) {
  return handleAsync({ url: '/eam/auth/register', params })
}

/**
 * 重置密码
 * @param {{ email: string, code: string, newPassword: string }} params
 */
const resetPassword = function(params) {
  return handleAsync({ url: '/eam/auth/forgotPassword', params })
}

const logout = async function() {
  let { data: { code, data, message } } = await pbRequest.delete('/eam/auth/logout')
  return code === 200 ? { data, code } : message
}

const getUserInfo = async function() {
  let { data: { code, data, message } } = await pbRequest.get('/eam/auth/getInfo')
  return code === 200 ? { data, code } : message
}

const getRouters = async function() {
  let { data: { code, data, message } } = await pbRequest.get('/system/menu/getRouters')
  return code === 200 ? { data, code } : message
}

// 修改用户信息
const updateProfile = async function(params) {
  let { data: { code, data, message } } = await pbRequest.post('/eam/auth/profile', params)
  return code === 200 ? { data, code } : message
}

export { loading, userLogin, getUserInfo, getRouters, logout, sendRegisterCode, userRegister, updateProfile, resetPassword }