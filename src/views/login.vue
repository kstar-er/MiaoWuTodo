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
    <div class="form_area" :style="(showRegisterForm || showForgotForm) ? `height: 436px` : `height: 216px;`">
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
                    <el-form-item label="" style="margin-bottom: 10px;">
            <div class="agreement-checkbox">
              <el-checkbox v-model="agreedToTerms" size="small">
                我已阅读并同意
                <span class="agreement-link" @click.stop="showAgreement">《用户协议》</span>
              </el-checkbox>
            </div>
          </el-form-item>
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
          <el-form-item>
            <div class="agreement-checkbox">
              <el-checkbox v-model="registerAgreedToTerms" size="small">
                我已阅读并同意
                <span class="agreement-link" @click.stop="showAgreement">《用户协议》</span>
              </el-checkbox>
            </div>
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

    <!-- 用户协议弹窗 -->
    <el-dialog
      v-model="showAgreementDialog"
      title="喵呜Todo用户协议"
      width="80%"
      :close-on-click-modal="false"
      class="agreement-dialog"
    >
      <div class="agreement-content">
        <p class="update-date">更新日期：2026年3月4日</p>

        <div class="important-notice">
          <strong>重要提示：</strong>在使用喵呜Todo服务之前，请您务必仔细阅读并充分理解本协议的全部内容。一旦您勾选同意并完成注册或登录，即表示您已充分理解并同意接受本协议的全部条款。
        </div>

        <h3>一、协议的接受与修改</h3>
        <p>1.1 本协议是您与喵呜Todo之间关于使用喵呜Todo桌面端任务管理软件及相关服务所订立的协议。</p>
        <p>1.2 喵呜Todo有权根据需要不时修改本协议条款。修改后的协议一经公布即生效，并替代原协议。</p>
        <p>1.3 如您不同意修改后的协议，您有权停止使用喵呜Todo服务；若您继续使用，则视为接受修改后的协议。</p>

        <h3>二、账号注册与使用</h3>
        <p><strong>2.1 账号注册</strong></p>
        <ul>
          <li>您需要使用有效的电子邮箱地址注册喵呜Todo账号</li>
          <li>您应提供真实、准确、完整的注册信息</li>
          <li>您应妥善保管账号和密码，对账号下的所有行为负责</li>
        </ul>

        <p><strong>2.2 账号使用规范</strong></p>
        <ul>
          <li>一个邮箱地址仅能注册一个账号</li>
          <li>禁止将账号转让、出售或出借给他人使用</li>
          <li>禁止利用账号从事违法违规活动</li>
        </ul>

        <h3>三、服务内容与使用规则</h3>
        <p><strong>3.1 服务内容</strong></p>
        <p>喵呜Todo为您提供任务管理、AI智能对话辅助、数据云端同步、周报生成等功能。</p>

        <p><strong>3.2 使用规则</strong></p>
        <ul>
          <li>您应遵守中华人民共和国相关法律法规</li>
          <li>不得利用本软件发布、传播违法违规信息</li>
          <li>不得对本软件进行反向工程、破解或修改</li>
        </ul>

        <h3>四、用户数据与隐私保护</h3>
        <p><strong>4.1 数据收集</strong></p>
        <p>为了向您提供服务，我们会收集：账号信息（邮箱、用户名、密码）、任务数据、AI对话数据等。</p>

        <div class="important-notice">
          <p><strong>4.2 数据使用承诺</strong></p>
          <ul>
            <li>您的所有数据仅用于为您提供服务，不会用于任何其他商业目的</li>
            <li>我们不会将您的数据出售、出租或提供给第三方</li>
            <li>我们不会使用您的任务内容、AI对话内容进行数据分析或模型训练</li>
            <li>您的数据仅存储在我们的安全服务器中，采用加密技术保护</li>
          </ul>
        </div>

        <p><strong>4.3 数据权利</strong></p>
        <p>您对自己的数据享有访问权、修改权、删除权、导出权和注销权。</p>

        <h3>五、知识产权</h3>
        <p>喵呜Todo软件及相关服务的知识产权归我们所有。您创建的任务内容、对话内容等数据的知识产权归您所有。</p>

        <h3>六、免责声明</h3>
        <p>因不可抗力、网络故障、系统维护等原因导致的服务中断或数据丢失，我们不承担责任。</p>

        <h3>七、争议解决</h3>
        <p>本协议适用中华人民共和国法律。如发生争议，应友好协商解决；协商不成的，可向我方所在地人民法院提起诉讼。</p>

        <div class="contact-info">
          <p><strong>联系我们</strong></p>
          <p>如有疑问，请通过软件内反馈功能或客服邮箱联系我们。</p>
        </div>

        <p style="text-align: center; margin-top: 20px; color: #666;">
          感谢您选择喵呜Todo！
        </p>
      </div>
      <template #footer>
        <el-button type="primary" @click="showAgreementDialog = false">我已阅读</el-button>
      </template>
    </el-dialog>
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
import { checkUpdate } from "../utils/settings/update";

import { listen } from '@tauri-apps/api/event'

const { proxy } = getCurrentInstance();

const erroring = ref(false);
let user = reactive({
  username: "",
  password: "",
});

// 用户协议勾选状态
const agreedToTerms = ref(false);
const registerAgreedToTerms = ref(false);
const showAgreementDialog = ref(false);

// 用户协议缓存键
const AGREEMENT_CACHE_KEY = "userAgreementAccepted";

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
let unlistenFn1 = null;

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

// 从缓存加载用户协议同意状态
const loadAgreementStatus = () => {
  const cachedStatus = localStorage.getItem(AGREEMENT_CACHE_KEY);
  if (cachedStatus === "true") {
    agreedToTerms.value = true;
    registerAgreedToTerms.value = true;
  }
}

// 保存用户协议同意状态到缓存
const saveAgreementStatus = () => {
  localStorage.setItem(AGREEMENT_CACHE_KEY, "true");
}

onMounted(async () => {
  user.username = "";
  user.password = "";
  getLastLoginInfo();
  loadAgreementStatus();

  if (proxy.$disconnect) proxy.$disconnect();
  
  // 检查更新
  await checkUpdate('login');
  
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

  try {
    unlistenFn1 = await listen('login-update-cancel', () => {
      proxy.$message.warning('已取消更新')
    });
    console.log('登录页面已监听 update-cancel事件');
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
  if (unlistenFn1) {
    await unlistenFn1();
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

  // 检查是否同意用户协议
  if (!agreedToTerms.value) {
    proxy.$message.error("请先阅读并同意用户协议");
    return;
  }

  console.log("开始登录...");
  let ctx = await userLogin(user); // 从后端调用接口，并将参数传入
  console.log("登录响应:", ctx);
  
  if (ctx.code === 200) { // 登录成功
    console.log("登录成功，保存token和用户信息");
    // 保存用户协议同意状态
    saveAgreementStatus();
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
  await getCurrentWindow().setSize(new LogicalSize(400, 530));
}

// 返回登录表单
const handleBackToLogin = async () => {
  showRegisterForm.value = false;
  showForgotForm.value = false;

  // 调整窗口高度
  await getCurrentWindow().setSize(new LogicalSize(400, 310));
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
  // 检查是否同意用户协议
  if (!registerAgreedToTerms.value) {
    proxy.$message.error("请先阅读并同意用户协议")
    return
  }
  const username = email;
  const res = await userRegister({ email, username, nickname, password, code })
  if (res && res.code === 200) {
    proxy.$message.success("注册成功，请使用邮箱登录")
    handleBackToLogin()
    // 保存用户协议同意状态
    saveAgreementStatus();
    // 清空注册表单
    register.email = ""
    register.nickname = ""
    register.username = ""
    register.password = ""
    register.confirmPassword = ""
    register.code = ""
    registerAgreedToTerms.value = false
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

// 打开用户协议
const showAgreement = () => {
  showAgreementDialog.value = true
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

/* 用户协议勾选框样式 */
.agreement-checkbox {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  color: #666;

  :deep(.el-checkbox__label) {
    font-size: 12px;
    color: #666;
  }

  .agreement-link {
    color: #409EFF;
    cursor: pointer;
    text-decoration: underline;
    transition: color 0.2s ease;

    &:hover {
      color: #66b1ff;
    }
  }
}

/* 用户协议弹窗样式 */
:deep(.agreement-dialog) {
  .el-dialog__header {
    background: linear-gradient(135deg, #8b4513 0%, #a0522d 100%);
    color: white;
    padding: 20px;
    border-radius: 8px 8px 0 0;
  }

  .el-dialog__title {
    color: white;
    font-size: 18px;
    font-weight: 600;
  }

  .el-dialog__body {
    max-height: 60vh;
    overflow-y: auto;
    padding: 20px 30px;
  }

  .el-dialog__footer {
    padding: 15px 20px;
    border-top: 1px solid #e4e7ed;
  }
}

.agreement-content {
  font-size: 14px;
  line-height: 1.8;
  color: #333;

  .update-date {
    text-align: center;
    color: #999;
    font-size: 12px;
    margin-bottom: 20px;
  }

  h3 {
    color: #8b4513;
    font-size: 16px;
    margin-top: 20px;
    margin-bottom: 10px;
    border-bottom: 2px solid #d4b895;
    padding-bottom: 5px;
  }

  p {
    margin: 10px 0;
    text-indent: 2em;
  }

  ul {
    margin: 10px 0;
    padding-left: 30px;
  }

  li {
    margin: 5px 0;
    list-style-type: disc;
  }

  .important-notice {
    background: #fff3cd;
    border-left: 4px solid #ffc107;
    padding: 15px;
    margin: 15px 0;
    border-radius: 4px;

    p {
      text-indent: 0;
      margin: 5px 0;
    }

    ul {
      margin-top: 10px;
    }
  }

  .contact-info {
    background: #e7f3ff;
    border-left: 4px solid #409EFF;
    padding: 15px;
    margin: 15px 0;
    border-radius: 4px;

    p {
      text-indent: 0;
      margin: 5px 0;
    }
  }
}

</style>
