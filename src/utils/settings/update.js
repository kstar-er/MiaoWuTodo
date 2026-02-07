import { getCurrentWindow } from "@tauri-apps/api/window";
import packageJson from '../../../package.json';
import { ElMessageBox, ElMessage } from 'element-plus';
import { invoke } from '@tauri-apps/api/core';
import { pbRequest} from "../../public/pbRequest/index"
import { check } from '@tauri-apps/plugin-updater';

// 获取最新版本版本
export async function getVersion() {
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
  };

  if (!versionInfo.version) {
    throw new Error('没有version');
  }

  return versionInfo;
}

// 下载并安装更新
export const downloadAndInstall = async (url) => {
  try {
    // 创建下载链接
    const link = document.createElement('a');
    link.href = url;
    link.download = url.split('/').pop(); // 获取文件名
    
    // 创建下载完成的事件监听器
    const downloadComplete = new Promise((resolve, reject) => {
      // 监听下载开始事件
      link.addEventListener('click', () => {
        // 创建一个定时器来检查下载是否完成
        const checkInterval = setInterval(async () => {
          try {
            // 使用 Tauri 的 API 检查文件是否存在
            const filePath = await invoke('get_download_path', { filename: link.download });
            const exists = await invoke('check_file_exists', { path: filePath });
            
            if (exists) {
              clearInterval(checkInterval);
              resolve(filePath);
            }
          } catch (error) {
            console.error('检查文件失败:', error);
          }
        }, 1000); // 每秒检查一次
      });
    });

    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 等待下载完成
    const downloadPath = await downloadComplete;

    // 使用 Tauri 的 API 打开文件
    await invoke('open_file', { path: downloadPath });

    // 关闭当前应用
    const currentWindow = getCurrentWindow();
    await currentWindow.close();

  } catch (error) {
    console.error('下载安装失败:', error);
    ElMessage.error('下载安装失败，请手动下载安装');
  }
};

// 检查更新
export const checkUpdate = async () => {
  const autoUpdate = localStorage.getItem('autoUpdate') !== 'false';
  if (!autoUpdate) return;

  try {

    const update = await check(); // ← 自动请求 endpoint 并解析 manifest

    console.log("update---", update);

    if (update?.available) {
      ElMessageBox.confirm(
        `发现新版本 ${update.rawJson.version}，是否立即更新？\n\n更新内容：${update.rawJson.notes}`,
        '更新提示',
        {
          confirmButtonText: '立即更新',
          cancelButtonText: '稍后再说',
          type: 'info',
        }
      ).then(async () => {
        // 开始下载并监听进度
        await update.download((event) => {
          console.log('下载事件:', event);
          switch (event.event) {
            case 'Started':
              console.log('开始下载', event.data.contentLength);
              break;
            case 'Progress':
              console.log('Progress 详情:', event.data); 
              const percent = Math.floor((event.data.chunkLength / event.data.contentLength) * 100);
              ElMessage.info(`下载中: ${percent}%`, { duration: 1000 });
              break;
            case 'Finished':
              ElMessage.success('下载完成，即将安装...');
              update.install(); // 安装
              break;
            case 'Errored':
              const errorMsg = event.data;
              console.error('下载出错:', errorMsg);
              ElMessage.error(`下载失败: ${errorMsg}`);
              break;
          }
        });
      }).catch(() => {
        ElMessage.info('已取消更新');
      });
    }
  } catch (error) {
    console.error('检查更新失败:', error);
    ElMessage.warning('检查更新时出错');
  }
};
// export const checkUpdate = async (versionInfo) => {
//   try {
//     console.log("检查更新:", versionInfo)
//     // 获取自动更新设置
//     const autoUpdate = localStorage.getItem('autoUpdate') !== 'false';
//     if (!autoUpdate) return;

//     // 获取当前版本和最新版本
//     const currentVersion = packageJson.version;
//     const latestVersion = versionInfo.version;

//     const update = await check(); // 获取 updater 实例

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

//         // 监听下载进度
//         await update.download((event) => {
//           if (event.event === 'Started') {
//             console.log('开始下载更新', event.data.contentLength);
//           } else if (event.event === 'Progress') {
//             const total = event.data.contentLength || 0;
//             const chunkLength = event.data.chunkLength;
//             const percent = total ? Math.floor((chunkLength / total) * 100) : 0;
//             console.log(`下载进度: ${percent}%`);
//             ElMessage.info(`下载中: ${percent}%`, { duration: 1000 });
//           } else if (event.event === 'Finished') {
//             ElMessage.success('下载完成，即将安装...');
//             // 安装更新
//             update.install().catch(err => {
//               console.error('安装失败:', err);
//               ElMessage.error('安装失败，请手动更新');
//             });
//           }
//         });
//       }).catch((error) => {
//         console.error("error", error)
//         ElMessage.info('已取消更新');
//       });
//     }
//   } catch (error) {
//     console.error('检查更新失败:', error);
//   }
// }; 
