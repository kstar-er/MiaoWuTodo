import { WebviewWindow, appWindow, getAll } from "@tauri-apps/api/window";
import { relaunch, exit } from "@tauri-apps/api/process";
import { emit, listen } from "@tauri-apps/api/event";

import { setWin } from "../multiwins/actions";

// 创建窗口参数配置
export const windowConfig = {
  label: null, // 窗口唯一label
  title: "", // 窗口标题
  url: "", // 路由地址url
  width: 1000, // 窗口宽度
  height: 640, // 窗口高度
  minWidth: null, // 窗口最小宽度
  minHeight: null, // 窗口最小高度
  x: null, // 窗口相对于屏幕左侧坐标
  y: null, // 窗口相对于屏幕顶端坐标
  center: true, // 窗口居中显示
  resizable: true, // 是否支持缩放
  maximized: false, // 最大化窗口
  decorations: false, // 窗口是否装饰边框及导航条
  alwaysOnTop: false, // 置顶窗口
  fileDropEnabled: false, // 禁止系统拖放
  visible: false, // 隐藏窗口
};

class Windows {
  constructor() {
    // 主窗口
    this.mainWin = null;
  }

  // 创建新窗口
  async createWin(options) {
    console.log("-=-=-=-=-=开始创建窗口");

    const args = Object.assign({}, windowConfig, options);

    // 判断窗口是否存在
    const existWin = getAll().find((w) => w.label == args.label);
    if (existWin) {
      console.log("窗口已存在>>", existWin);
      if (existWin.label.indexOf("main") == -1) {
        // 自定义处理...
      }
    }

    // 是否主窗口
    if (args.label.indexOf("main") > -1) {
      console.log("该窗口是主窗口");
      // 自定义处理...
    }

    // 创建窗口对象
    let win = new WebviewWindow(args.label, args);
    // 是否最大化
    if (args.maximized && args.resizable) {
      win.maximize();
    }

    // 窗口创建完毕/失败
    win.once("tauri://created", async () => {
      console.log("window create success!");
      emit("success-create")
      await win?.show();
    });

    win.once("tauri://error", async () => {
      console.log("window create error!");
    });
  }

  // 获取窗口
  getWin(label) {
    return WebviewWindow.getByLabel(label);
  }

  // 获取全部窗口
  getAllWin() {
    return getAll();
  }

  async closeWin() {
    await emit("win-close")
  }

  // 开启主进程监听事件
  async listen() {
    console.log("——+——+——+——+——+开始监听窗口");

    // 创建新窗体
    await listen("win-create", (event) => {
      this.createWin(event.payload);
    });

    // 显示窗体
    await listen("win-show", async (event) => {
      console.log("111---action-index", appWindow)
      if (appWindow.label.indexOf("main") == -1) return;
      await appWindow.show();
      await appWindow.unminimize();
      await appWindow.setFocus();
    });

    // 隐藏窗体
    await listen("win-hide", async (event) => {
      if (appWindow.label.indexOf("main") == -1) return;
      await appWindow.hide();
    });

    // 关闭窗体
    await listen("win-close", async (event) => {
      await appWindow.close();
    });

    // 退出应用
    await listen("win-exit", async (event) => {
      setWin("logout");
      await exit();
    });
  }
}

export default Windows