import packageJson from '../../../package.json';
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

// 检查是否需要更新
export async function checkUpdate(win) {
  try {
    // 获取自动更新设置
    const autoUpdate = localStorage.getItem('autoUpdate') !== 'false';
    if (!autoUpdate) return;

    const update = await check()
    if (!update) return;
    console.log("检查更新:", update)

    // 比较版本号，不同则创建更新窗口
    if (update.currentVersion === update.version) return

    // 发送调用该方法的主窗口的label：登录窗口/任务窗口
    const data = {
      ...update,
      win
    }
    
    await createUpdateWin(data)
  } catch (error) {
    console.error('检查更新失败:', error);
  }
}