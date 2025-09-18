import axios from 'axios'
import { errorHandle } from './errorHandle'
import router from '../../router/index'
import { ElMessageBox } from 'element-plus'
import { ref } from 'vue'
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createLoginWin } from '../../multiwins/action'

// axios.defaults.headers["Content-Type"] = "application/json"

/**
 * 加载动画
 */
let loading = ref(false)

/**
 * 获取当前时间
 */
const getTime = () => {
  let date = new Date()
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDate()
  let hour = date.getHours()
  let minute = date.getMinutes()
  let second = date.getSeconds()
  return year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second.toString().padStart(2, '0')
}

/**
 * 创建请求实例
 */
const pbRequest = axios.create({

  baseURL: process.env.VUE_APP_TITLE === 'pro' ? 'https://www.baiaidu.com:9822' : 'http://192.168.1.13:9820',
  // baseURL: 'https://www.baiaidu.com:9822',
  headers: {
    "Content-Type": "application/json"
  }
})


/** 时间戳转换 */
const changeTime = (time) => {
  let date = new Date(time)
  let y = date.getFullYear()
  let MM = date.getMonth() + 1
  MM = MM < 10 ? '0' + MM : MM
  let d = date.getDate()
  d = d < 10 ? '0' + d : d
  let h = date.getHours()
  h = h < 10 ? '0' + h : h
  let m = date.getMinutes()
  m = m < 10 ? '0' + m : m
  let s = date.getSeconds()
  s = s < 10 ? '0' + s : s
  return y + '-' + MM + '-' + d + ' ' + h + ':' + m + ':' + s

  // return y + '-' + MM + '-' + d;
}

/**
 * 创建请求拦截器
 */
pbRequest.interceptors.request.use(

  // 对请求之前需要做的操作
  config => {
    loading.value = true
    // console.log('---------请求拦截---------' + config.url + `  请求开始时间：${ getTime() }`)
    config.requestStartTime = Date.parse(new Date())

    // post请求需要序列化参数
    // if (config.method === 'post' && config.data) {
    //   config.data = JSON.stringify(config.data)
    // }

    if (config.url === '/eam/group/applyGroup') {
      config.headers["Content-Type"] = "text/plain;charset=UTF-8"
    }

    if (sessionStorage.getItem('token')){
      const token = sessionStorage.getItem('token')
      if (token) {
        config.headers['Authorization'] = 'Bearer ' + token
      } else {
        router.push('/login')
      }
    }
    return config
  },

  // 请求错误时需要做的操作
  error => {
    conosle.log(error)
  }
)

/**
 * 创建响应拦截器
 */
pbRequest.interceptors.response.use(

  // 对响应数据需要做的操作
  response => {
    loading.value = false
    // console.log('---------响应拦截---------' + response.config.url + `  请求响应时间：${ getTime() }`)
    response.responseTime = Date.parse(new Date())

    // 接口响应超过10秒钟
    if (response.responseTime - response.config.requestStartTime >= 10000) {
      console.warn(response.config.url + '该接口响应时间过长')
    }

    if (response.data.code === 401){
      ElMessageBox.alert('登录过期，请重新登录', '提示', {
        confirmButtonText: '确定',
        type: 'warning',
        icon: 'InfoFilled',
        callback: async (action) => {
          if (action === 'confirm') {
            sessionStorage.clear() // 清除缓存

            const main_win = getCurrentWindow("main_task") // 获取主窗口实例
            
            // 打开登录窗口
            // 等待登录窗口创建打开后再关闭主窗口---即等待主窗口给登录窗口发送完消息以后
            await createLoginWin() 
            main_win.close()
          }
        }
      }).then(res => {
        //null
      }).catch(() => {
        //null
      })
      return response
    }

    if (response.data.code !== 200){
      ElMessageBox.alert(response.data.msg ?? response.data.message, '提示', {
        type: 'warning',
        icon: 'InfoFilled',
        confirmButtonText: '我知道了',
        dangerouslyUseHTMLString: true
      }).then(res => {
        //null
      }).catch(() => {
        //null
      })
      return response
    }

    return response
  },

  // 响应错误处理
  error => {
    loading.value = false
    let alertText = '出现了预期之外的错误'
    if (error.code === 'ERR_NETWORK'){
      alertText = `系统正在更新，请稍后再试！`
    }
    else if (error.code === 'ERR_BAD_REQUEST'){
      alertText = `出现了预期之外的错误；这可能是个桌面端的错误！`
    }
    ElMessageBox.alert(alertText, '提示', {
      type: 'warning',
      icon: 'InfoFilled',
      confirmButtonText: '我知道了',
      dangerouslyUseHTMLString: true
    }).then(res => {
      //null
    }).catch(() => {
      //null
    })
    return { data: { code: 'ERR_BAD_REQUEST', msg: 'Error', data: null } }

  }
)

export { pbRequest, loading, changeTime }