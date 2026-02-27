import { getCurrentWindow } from "@tauri-apps/api/window";
import packageJson from '../../../package.json';
import { ElMessageBox, ElMessage } from 'element-plus';
import { invoke } from '@tauri-apps/api/core';
import { pbRequest} from "../../public/pbRequest/index"
import { check } from '@tauri-apps/plugin-updater';
import { createUpdateWin } from "../../multiwins/action";

// 获取最新版本版本
export async function getVersion(win) {
  // 动态获取真实操作系统
  const getOs = async () => {
    if (typeof window.__TAURI__ !== 'undefined') {
      return await window.__TAURI__.os.platform(); // 'win32', 'darwin'
    }
    return navigator.userAgent.includes('Mac') ? 'darwin' : 'win32';
  };

  const platform = await getOs();
  const os = platform === 'darwin' ? 'mac' : 'windows'; // 转换为后端可识别的值

  const res = await pbRequest.get(`/eam/versionInformation/getLatestVersion?os=${os}`);
  console.log("res---", res);
  if (res.status !== 200) {
    throw new Error(`HTTP error: ${res.status}`);
  }

  const data = res.data;

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response format');
  }

  // 强制统一字段名
  const versionInfo = {
    version: data.version || data.VERSION, // 兼容大小写
    pub_date: data.pub_date,
    signature: data.signature,
    url: data.url,
    notes: data.notes,
    win
  };

  if (!versionInfo.version) {
    throw new Error('没有version');
  }

  return versionInfo;
}

// export const checkUpdate = async (versionInfo) => {
//   try {
//     console.log("检查更新:", versionInfo)
//     // 获取自动更新设置
//     const autoUpdate = localStorage.getItem('autoUpdate') !== 'false';
//     if (!autoUpdate) return;

//     // 获取当前版本和最新版本
//     const currentVersion = packageJson.version;
//     const latestVersion = versionInfo.version;

//     const update = await check();
//     console.log("更新信息:", update);

//     // 比较版本号
//     if (currentVersion !== latestVersion) {
//       ElMessageBox.confirm(
//         `发现新版本 ${latestVersion}，是否立即更新？`,
//         '更新提示',
//         {
//           confirmButtonText: '立即更新',
//           cancelButtonText: '稍后再说',
//           type: 'info',
//         }
//       ).then(async () => {
//         await update.downloadAndInstall();
//       }).catch((error) => {
//         console.error("error", error)
//         ElMessage.info('已取消更新');
//       });
//     }
    
//   } catch (error) {
//     console.error('检查更新失败:', error);
//   }
// }; 


export async function checkUpdate(versionInfo) {
  try {
    console.log("检查更新:", versionInfo)
    // 获取自动更新设置
    const autoUpdate = localStorage.getItem('autoUpdate') !== 'false';
    if (!autoUpdate) return;

    // 获取当前版本和最新版本
    const currentVersion = packageJson.version;
    const latestVersion = versionInfo.version;

    if (currentVersion === latestVersion) return

    // 比较版本号，不同则创建更新窗口
    // 发送调用该方法的主窗口的label：登录窗口/任务窗口
    const data = {
      ...versionInfo,
      currentVersion
    }
    
    await createUpdateWin(data)
  } catch (error) {
    console.error('检查更新失败:', error);
  }
}