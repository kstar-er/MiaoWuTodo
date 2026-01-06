<template>
  <main class="container">
    <customDragWindow>
      <template #header>
        <div class="close-btn" @click="closeApp">
          <el-icon>
            <Close />
          </el-icon>
        </div>
        <h2>喵呜Todo</h2>
      </template>
    </customDragWindow>
    <!-- 登录/注册区域 -->
    <div class="form_area" :style="(showRegisterForm || showForgotForm) ? `height: 406px` : `height: 186px;`">
      <div class="login-pane" :class="{ 'slide-up': (showRegisterForm || showForgotForm) }" v-if="!(showRegisterForm || showForgotForm)">
        <el-form :model="user">
          <el-form-item label="" style="margin-bottom: 10px;">
            <el-input ref="name" v-model="user.username" clearable placeholder="请输入邮箱" @keyup.enter="login">
              <template v-slot:prefix>
                <el-icon class="el-icon--left" style="font-size: 16px">
                  <User />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="">
            <el-input ref="psw" v-model="user.password" type="passworld" clearable show-password placeholder="请输入密码"
              maxlength="" @keyup.enter="login">
              <template v-slot:prefix>
                <el-icon class="el-icon--left" style="font-size: 16px">
                  <Lock />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <div class="login-actions">
            <span class="register-link" @click="handleShowForgot">忘记密码</span>
            <el-button class="login_btn" type="primary" @click="login">登  录</el-button>
            <span class="register-link" @click="handleShowRegister">注册账号</span>
          </div>
        </el-form>
      </div>

      <!-- 注册 -->
      <div class="register-pane" :class="{ 'slide-in': showRegisterForm }" v-show="showRegisterForm">
        <el-form :model="register">
          <el-form-item>
            <el-input v-model="register.email" clearable placeholder="请输入邮箱">
              <template #prefix>
                <el-icon class="el-icon--left" style="font-size: 16px">
                  <Message />
                </el-icon>
              </template>
              <template #append>
                <el-button :disabled="isSendingCode || countdown > 0" @click="handleSendCode">
                  {{ countdown > 0 ? countdown + 's' : '发送验证码' }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="register.nickname" clearable placeholder="请输入用户名">
              <template #prefix>
                <el-icon class="el-icon--left" style="font-size: 16px">
                  <User />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="register.password" type="password" show-password clearable placeholder="请输入密码">
              <template #prefix>
                <el-icon class="el-icon--left" style="font-size: 16px">
                  <Lock />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="register.confirmPassword" type="password" show-password clearable placeholder="请再次输入密码">
              <template #prefix>
                <el-icon class="el-icon--left" style="font-size: 16px">
                  <Lock />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="register.code" clearable placeholder="请输入验证码">
              <template #prefix>
                <el-icon class="el-icon--left" style="font-size: 16px">
                  <Key />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <div class="register-actions-row">
            <el-button link type="primary" class="back-login" @click="handleBackToLogin">返回登录</el-button>
            <div class="register-actions-center">
              <el-button class="login_btn" type="primary" @click="handleRegisterSubmit">注册账号</el-button>
            </div>
          </div>
        </el-form>
      </div>

      <!-- 忘记密码（与注册同样式与表单结构：邮箱 + 验证码 + 新密码 + 确认密码） -->
      <div class="register-pane" :class="{ 'slide-in': showForgotForm }" v-show="showForgotForm">
        <el-form :model="forgot">
          <el-form-item>
            <el-input v-model="forgot.email" clearable placeholder="请输入邮箱">
              <template #prefix>
                <el-icon class="el-icon--left" style="font-size: 16px">
                  <Message />
                </el-icon>
              </template>
              <template #append>
                <el-button :disabled="isSendingForgotCode || forgotCountdown > 0" @click="handleSendForgotCode">
                  {{ forgotCountdown > 0 ? forgotCountdown + 's' : '发送验证码' }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="forgot.newPassword" type="password" show-password clearable placeholder="请输入新密码">
              <template #prefix>
                <el-icon class="el-icon--left" style="font-size: 16px">
                  <Lock />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="forgot.confirmPassword" type="password" show-password clearable placeholder="请再次输入新密码">
              <template #prefix>
                <el-icon class="el-icon--left" style="font-size: 16px">
                  <Lock />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="forgot.code" clearable placeholder="请输入验证码">
              <template #prefix>
                <el-icon class="el-icon--left" style="font-size: 16px">
                  <Key />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <div class="register-actions-row">
            <el-button link type="primary" class="back-login" @click="handleBackToLogin">返回登录</el-button>
            <div class="register-actions-center">
              <el-button class="login_btn" type="primary" @click="handleResetPasswordSubmit">重置密码</el-button>
            </div>
          </div>
        </el-form>
      </div>
    </div>
  </main>
</template>

<script setup>
import { getCurrentInstance, onMounted, reactive, ref, onUnmounted } from "vue";
import { User, Lock, Close, Message, Key } from "@element-plus/icons-vue";
import { userLogin, sendRegisterCode, userRegister, resetPassword } from "../utils/login";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { createMainWin, createWinPetWin } from "../multiwins/action";
import customDragWindow from "../views/components/public/customDragWindow.vue"; // 封装窗口拖拽
import CryptoJS from "crypto-js";
import { checkUpdate,getVersion } from "../utils/settings/update";

import { listen } from '@tauri-apps/api/event'

const { proxy } = getCurrentInstance();

const erroring = ref(false);
let user = reactive({
  username: "",
  password: "",
});

// 注册 / 忘记密码 表单
const showRegisterForm = ref(false)
const showForgotForm = ref(false)
const isSendingCode = ref(false)
const countdown = ref(0)
let countdownTimer = null
const register = reactive({
  email: "",
  nickname: "",
  password: "",
  confirmPassword: "",
  code: ""
})

// 忘记密码表单
const isSendingForgotCode = ref(false)
const forgotCountdown = ref(0)
let forgotTimer = null
const forgot = reactive({
  email: "",
  newPassword: "",
  confirmPassword: "",
  code: ""
})

let login_win = getCurrentWindow("login"); // 登录窗口实例
const SECRET_KEY = "do-task-secret-key"; // 加密密钥
let unlistenFn = null; // 事件监听器

// 清除登录表单的函数
const clearLoginForm = () => {
  sessionStorage.clear();
  console.log('登录表单已清除');
};

// 获取上一次登录的信息
const getLastLoginInfo = () => {
  const lastLoginInfo = localStorage.getItem("lastLoginInfo");
  if (lastLoginInfo) {
    const decryptedInfo = JSON.parse(CryptoJS.AES.decrypt(lastLoginInfo, SECRET_KEY).toString(CryptoJS.enc.Utf8));
    user.username = decryptedInfo.username;
    user.password = decryptedInfo.password;
  }
}

onMounted(async () => {
  user.username = "";
  user.password = "";
  getLastLoginInfo();

  if (proxy.$disconnect) proxy.$disconnect();
  
  // 检查更新
  await checkUpdate(await getVersion());
  
  // 使用 Tauri 事件系统监听清除登录表单的事件
  try {
    unlistenFn = await listen('logout-clear-form', () => {
      clearLoginForm();
      getLastLoginInfo();
    });
    console.log('登录页面已监听 logout-clear-form 事件');
  } catch (error) {
    console.error('设置事件监听器失败:', error);
  }
});

onUnmounted(async () => {
  // 移除事件监听器
  if (unlistenFn) {
    await unlistenFn();
    console.log('登录页面已移除事件监听器');
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (forgotTimer) {
    clearInterval(forgotTimer)
    forgotTimer = null
  }
});

// 登录
const login = async () => {
  // 对 账号和密码 校验输入
  proxy.$refs.psw?.blur();
  proxy.$refs.name?.blur();

  // 有一个未输入，弹出提示
  if (user.username.length === 0 || user.password.length === 0) {
    proxy.$message.error("账号或密码不能为空！");
    return;
  }

  console.log("开始登录...");
  let ctx = await userLogin(user); // 从后端调用接口，并将参数传入
  console.log("登录响应:", ctx);
  
  if (ctx.code === 200) { // 登录成功
    console.log("登录成功，保存token和用户信息");
    // 将token信息保存
    sessionStorage.setItem("token", ctx.data.accessToken);
    sessionStorage.setItem("userInfo", JSON.stringify(ctx.data.user));
    // 将最后一次登录的账号和密码加密保存
    const encryptedInfo = CryptoJS.AES.encrypt(
      JSON.stringify({ username: user.username, password: user.password }),
      SECRET_KEY
    ).toString();
    localStorage.setItem("lastLoginInfo", encryptedInfo)

    console.log("开始创建主窗口和宠物窗口...");
    // 打开任务列表窗口
    await createMainWin();
    await createWinPetWin();
    console.log("窗口创建完成，隐藏登录窗口");
    // 关闭登录窗口
    await login_win.hide();

  } else { // 登录失败
    console.log("登录失败:", ctx);
    erroring.value = true;
  }
};

// 关闭程序
const closeApp = async () => {
  await getCurrentWindow().close();
};

// 发送注册验证码
const handleSendCode = async () => {
  const email = register.email?.trim()
  if (!email) {
    proxy.$message.error("请先填写邮箱")
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    proxy.$message.error("邮箱格式不正确")
    return
  }
  if (isSendingCode.value || countdown.value > 0) return
  isSendingCode.value = true
  const res = await sendRegisterCode({ email })
  isSendingCode.value = false
  if (res && res.code === 200) {
    proxy.$message.success("验证码已发送，请查收邮箱")
    countdown.value = 60
    countdownTimer = setInterval(() => {
      if (countdown.value <= 1) {
        clearInterval(countdownTimer)
        countdownTimer = null
        countdown.value = 0
      } else {
        countdown.value = countdown.value - 1
      }
    }, 1000)
  }
}

// 显示注册表单
const handleShowRegister = async () => {
  showForgotForm.value = false
  showRegisterForm.value = true;

  // 调整窗口高度
  await getCurrentWindow().setSize(new LogicalSize(400, 500));
}

// 返回登录表单
const handleBackToLogin = async () => {
  showRegisterForm.value = false;
  showForgotForm.value = false;

  // 调整窗口高度
  await getCurrentWindow().setSize(new LogicalSize(400, 280));
}

// 提交注册
const handleRegisterSubmit = async () => {
  const { email, nickname, password, confirmPassword, code } = register
  if (!email || !nickname || !password || !confirmPassword || !code) {
    proxy.$message.error("请完整填写注册信息")
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    proxy.$message.error("邮箱格式不正确")
    return
  }
  if (password.length < 6) {
    proxy.$message.error("密码长度不能少于6位")
    return
  }
  if (password !== confirmPassword) {
    proxy.$message.error("两次输入的密码不一致")
    return
  }
  const username = email;
  const res = await userRegister({ email, username, nickname, password, code })
  if (res && res.code === 200) {
    proxy.$message.success("注册成功，请使用邮箱登录")
    handleBackToLogin()
    // 清空注册表单
    register.email = ""
    register.nickname = ""
    register.username = ""
    register.password = ""
    register.confirmPassword = ""
    register.code = ""
  }
}

// 显示忘记密码表单
const handleShowForgot = async () => {
  showRegisterForm.value = false
  showForgotForm.value = true
  await getCurrentWindow().setSize(new LogicalSize(400, 500));
}

// 发送忘记密码验证码
const handleSendForgotCode = async () => {
  const email = forgot.email?.trim()
  if (!email) { proxy.$message.error("请先填写邮箱"); return }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) { proxy.$message.error("邮箱格式不正确"); return }
  if (isSendingForgotCode.value || forgotCountdown.value > 0) return
  isSendingForgotCode.value = true
  const res = await sendRegisterCode({ email })
  isSendingForgotCode.value = false
  if (res && res.code === 200) {
    proxy.$message.success("验证码已发送，请查收邮箱")
    forgotCountdown.value = 60
    forgotTimer = setInterval(() => {
      if (forgotCountdown.value <= 1) {
        clearInterval(forgotTimer)
        forgotTimer = null
        forgotCountdown.value = 0
      } else {
        forgotCountdown.value = forgotCountdown.value - 1
      }
    }, 1000)
  }
}

// 提交重置密码
const handleResetPasswordSubmit = async () => {
  const { email, newPassword, confirmPassword, code } = forgot
  if (!email || !newPassword || !confirmPassword || !code) {
    proxy.$message.error("请完整填写信息"); return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) { proxy.$message.error("邮箱格式不正确"); return }
  if (newPassword.length < 6) { proxy.$message.error("密码长度不能少于6位"); return }
  if (newPassword !== confirmPassword) { proxy.$message.error("两次输入的密码不一致"); return }
  const res = await resetPassword({ email, code, newPassword })
  if (res && res.code === 200) {
    proxy.$message.success("密码重置成功，请使用新密码登录")
    handleBackToLogin()
    // 清空表单
    forgot.email = ""
    forgot.newPassword = ""
    forgot.confirmPassword = ""
    forgot.code = ""
  }
}

</script>

<style lang="less" scoped>
.container {
  margin: 0px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  background: linear-gradient(rgba(245, 245, 245, 0.7), rgba(245, 245, 245, 0.7)),
    url('../assets/images/ghibli-bg.png') center/cover no-repeat;
  border-radius: 35px;
  box-shadow: 0 0 20px rgba(139, 69, 19, 0.1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(2px);

  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 50%;
    height: 50%;
    background: url('../assets/images/ghibli-pattern.png') no-repeat;
    background-size: contain;
    opacity: 0.15;
    pointer-events: none;
    transform: translate(-10%, 10%);
    z-index: 0;
  }
}

.form_area {
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 1;
  gap: 24px;
  align-items: flex-start;
  

  :deep(.el-input) {
    width: 260px;
    height: 40px;
  }
}

.login-pane {
  background: rgba(255, 255, 255, 0.6);
  padding: 16px 12px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.08);
  transition: all 0.5s ease-in-out;
  transform: translateY(0);
}

.login-pane.slide-up {
  transform: translateY(-100%);
  opacity: 0;
}

.login-actions {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.register-actions-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
  min-height: 40px;
}

.register-actions-row .back-login {
  position: absolute;
  left: 0;
}

.register-actions-center {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.register-link {
  font-size: 12px;
  color: #8b4513;
  text-decoration: underline;
  padding: 0 4px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.register-link:hover {
  color: #409EFF;
}

/* 注册面板滑动动画 */
.register-pane {
  position: absolute;
  top: 0;
  left: 50%;
  right: auto;
  z-index: 2;
  width: 330px;
  max-height: 90vh;
  background: rgba(255, 255, 255, 0.6);
  padding: 16px 12px 20px 18px;
  border-radius: 12px;
  border: 1px solid #d4b895;
  box-shadow: 0 8px 20px rgba(139, 69, 19, 0.15);
  transition: all 0.5s ease-in-out;
  transform: translate(-50%, 100%);
  opacity: 0;

  :deep(.el-input) {
    width: 320px;
  }
}

.register-pane.slide-in {
  transform: translate(-50%, 0);
  opacity: 1;
}

.login_btn {
  font-weight: 500;
  height: 36px;
  border-radius: 10px;
  background: #8b4513;
  border: none;
  transition: all 0.3s ease;
  font-family: 'Ghibli', sans-serif;
  letter-spacing: 2px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent);
    transition: 0.5s;
  }

  &:hover::before {
    left: 100%;
  }
}

.login_btn:hover {
  background: #a0522d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
}

:deep(.el-input__wrapper) {
  padding: 6px 15px;
  color: #8b4513;
  border: 1px solid #d4b895;
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.1);
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
}

:deep(.el-input__wrapper:hover) {
  border-color: #8b4513;
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.15);
  background: rgba(255, 255, 255, 0.9);
}

:deep(.el-input__inner::first-line) {
  color: #8b4513;
  font-size: 15px;
  font-family: 'Ghibli', sans-serif;
}

:deep(.el-icon) {
  color: #8b4513;
}

h2 {
  color: #8b4513;
  font-weight: 600;
  margin-bottom: 30px;
  margin-top: 40px;
  text-shadow: 2px 2px 4px rgba(139, 69, 19, 0.1);
  font-family: 'Ghibli', sans-serif;
  font-size: 28px;
  letter-spacing: 3px;
  position: relative;
  display: inline-block;
  cursor: default;

  &::before,
  &::after {
    content: '✦';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    color: #d4b895;
    font-size: 20px;
    opacity: 0.8;
  }

  &::before {
    left: -40px;
  }

  &::after {
    right: -40px;
  }
}

@font-face {
  font-family: 'Ghibli';
  src: url('../assets/fonts/DottedSongtiSquareRegular.otf') format('truetype');
}

/* 使用更强大的选择器来覆盖全局样式 */
:global(body) {
  background-color: transparent !important;
}

:global(html) {
  background-color: transparent !important;
}

:global(#app) {
  background-color: transparent !important;
}

:global(.container) {
  background-color: transparent !important;
}

/* 移除其他重复的样式声明 */
:deep(body) {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

html,
body,
.container {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  border-radius: 25px;
}

.form_area {
  animation: fadeIn 1s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(139, 69, 19, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 2;

  &:hover {
    background: rgba(139, 69, 19, 0.2);
    transform: scale(1.1);
  }

  :deep(.el-icon) {
    font-size: 18px;
    color: #8b4513;
  }
}
</style>
