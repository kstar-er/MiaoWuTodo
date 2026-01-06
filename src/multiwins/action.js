// 渲染进程/主进程通信
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow } from '@tauri-apps/api/window';
import { emit } from "@tauri-apps/api/event";

/**
 * @desc 监听事件并在完成后移除监听
 * @param windowInstance WebviewWindow 实例
 * @param eventName 事件名称
 * @param callback 回调函数
 */
export function listenAndRemove(windowInstance, eventName, callback) {
  let unlistenFn = windowInstance.listen(eventName, async (event) => {
    try {
      await callback(event);
      if (typeof unlistenFn === 'function') {
        unlistenFn();
      }
    } catch (error) {
      console.error("事件处理失败:", error);
    }
  });

  return unlistenFn; // 返回监听器以便外部管理（如果需要）
}


/**
 * @desc 创建主窗口和宠物管理窗口时传参
 * @param args {object} {label: 'new', url: '/new', width: 500, height: 300, ...}
 */
export async function createDefaultWin(args) {
  console.log("创建默认窗口，参数:", args);
  const newWindow = new WebviewWindow(args.label, args);

  let unlistenFn;
  newWindow.once("tauri://created", async () => {
    console.log("任务窗口已成功创建:", args.label);
    unlistenFn = newWindow.listen("window-ready", async (event) => {
      console.log("任务管理窗口已准备好:", args.label);
      try {
        const token = sessionStorage.getItem("token");
        const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
        console.log("发送登录信息到窗口:", { token: !!token, userInfo: !!userInfo });
        
        // 向新创建的窗口发送登录信息
        await newWindow.emit("login-info", { token, userInfo });
        await newWindow.show(); // 显示窗口
        console.log("窗口已显示:", args.label);
      } catch (error) {
        console.error("事件发送失败:", error);
      }
    });
  });

  newWindow.once("tauri://error", (e) => {
    console.error("创建任务窗口时出错:", args.label, e);
  });
}

/**
 * @desc 创建miniTask窗口时，从宠物窗口到该窗口传参
 * @param args {object} {label: 'new', url: '/new', width: 500, height: 300, ...}
 */
export async function createMiniTaskWin(args) {
  const newWindow = new WebviewWindow(args.label, args);

  let unlistenFn;
  newWindow.once("tauri://created", async () => {
    console.log("任务窗口已成功创建");
    unlistenFn = newWindow.listen("window-ready", async (event) => {
      console.log("任务管理窗口 已准备好");
      try {
        const token = sessionStorage.getItem("token");
        const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
        // 向新创建的窗口发送登录信息
        await newWindow.emit("login-info", { token, userInfo });
        await newWindow.show(); // 显示窗口
      } catch (error) {
        console.error("事件发送失败:", error);
      }
    });
  });

  newWindow.once("tauri://error", (e) => {
    console.error("创建任务窗口时出错:", e);
  });
}

/**
 * @desc 创建宠物窗口时传参
 * @param args {object} {label: 'new', url: '/new', width: 500, height: 300, ...}
 */
export async function createPetWin(args) {
  console.log("创建宠物窗口，参数:", args);
  const newWindow = new WebviewWindow(args.label, args);

  let unlistenFn;
  newWindow.once("tauri://created", async () => {
    console.log("宠物窗口已成功创建:", args.label);
    unlistenFn = newWindow.listen("window-ready", async (event) => {
      console.log("宠物窗口已准备好:", args.label);
      try {
        const token = sessionStorage.getItem("token");
        const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
        console.log("发送登录信息到宠物窗口:", { token: !!token, userInfo: !!userInfo });
        
        // 向宠物窗口发送登录信息
        await newWindow.emit("login-info", { token, userInfo });
        console.log("宠物窗口登录信息已发送");
      } catch (error) {
        console.error("宠物窗口事件发送失败:", error);
      }
    });
  });

  newWindow.once("tauri://error", (e) => {
    console.error("创建宠物窗口时出错:", args.label, e);
  });
}

/**
 * @desc 创建新窗口
 * @param args {object} {label: 'new', url: '/new', width: 500, height: 300, ...}
 */
export async function createWin(args) {
  console.log(args);
  const existingWindow = await WebviewWindow.getByLabel(args.label);
  if (existingWindow) {
    console.log("任务管理窗口已存在，尝试显示...");
    // 检查窗口是否最小化
    const isMinimized = await existingWindow.isMinimized();
    if (isMinimized) {
      // 如果最小化，则恢复窗口
      await existingWindow.unminimize();
    }
    await existingWindow.show();
    return;
  }

  if (args.label === 'mini_task') {
    await createMiniTaskWin(args);
  } else if (args.label === 'pet') {
    // 宠物窗口直接创建，不需要等待 window-ready
    await createPetWin(args);
  } else {
    await createDefaultWin(args)
  }
}


/**
 * @desc 检查该窗口是否已经存在
 * @return 处理：关闭该窗口
 */
export async function checkIsExisting(args) {
  console.log("检查是否存在", args);
  const existingWindow = await WebviewWindow.getByLabel(args.label);
  if (existingWindow) {
    console.log("窗口已存在，尝试将其销毁...");
    await existingWindow.destroy();
  }
}

/**
 * @desc 创建窗口操作
 * @return Promise<boolean> true/false
 */
export async function createNewWin(newWindow) {
  console.log("检查是否创建成功", newWindow);

  return new Promise((resolve, reject) => {
    const successHandler = () => {
      console.log("任务窗口已成功创建");
      resolve(true); // 成功时为 true
    };

    const errorHandler = (e) => {
      console.error("创建任务窗口时出错:", e);
      reject(false); // 失败时为 false
    };

    // 创建异步事件监听器
    newWindow.once("tauri://created", successHandler);
    newWindow.once("tauri://error", errorHandler);

    // 清理事件监听器
    return () => {
      newWindow.off("tauri://created", successHandler);
      newWindow.off("tauri://error", errorHandler);
    };
  })
}

/**
 * @desc 获取窗口
 * @param args {string} 'main'|'main_login' ...
 */
export async function getWin(label) {
  return await WebviewWindow.getByLabel(label);
}

/**
 * @desc 设置窗口
 * @param type {string} 'show'|'hide'|'close'|'min'|'max'|'max2min'|'exit'|'relaunch'
 * @param id {number}
 */
export async function setWin(type) {
  await emit("win-" + type);
}

/**
 * @desc 主|渲染进程数据传递
 * @param args {object} {type: 'MSG_TYPE_XXX', value: 123}
 */
export async function setWinData(args) {
  await emit("win-setdata", args);
}

/**
 * @desc 屏蔽系统右键菜单
 */
export function disableWindowMenu() {
  document.addEventListener("contextmenu", (e) => e.preventDefault());
}

/**
 * @desc 打开登录窗口
 */
export async function createLoginWin() {
  await createWin({
    label: "login",
    title: "登录",
    url: "index.html#/login",
    width: 400,
    height: 280,
    resizable: false,
    center: true,
    visible: true,
    decorations: false,
    transparent: true,
    backgroundColor: '#00000000',
    theme: 'Dark'
  });
}

/**
 * @desc 主窗口
 */
export async function createMainWin() {
  console.log("开始创建主窗口...");
  await createWin({
    label: "main_task",
    url: "index.html#/index",
    title: "喵呜Todo",
    width: 360,
    height: 700,
    resizable: false,
    center: true,
    visible: false, // 改回 false，等待 window-ready 事件
    decorations: false,
    alwaysOnTop: false,
    theme: 'Dark'
  });
  console.log("主窗口创建完成");
}

/**
 * @desc 项目新增/编辑窗口
 */
export async function createProjectWin(win) {
  const args = {
    label: "project_add_detail",
    url: "index.html#/projectDetail",
    title: "项目详情",
    width: 750,
    height: 550,
    resizable: false,
    center: true,
    visible: false,
    alwaysOnTop: false,
    decorations: false,
    theme: 'Dark'
  }

  await checkIsExisting(args);
  
  const newWindow = new WebviewWindow(args.label, args);
  const res = await createNewWin(newWindow);

  if (res) {
    console.log(args.label, "窗口 已准备好");
    listenAndRemove(newWindow, `project-detail-window-ready`, async (event) => {
      const formdata = JSON.parse(sessionStorage.getItem("formdata"));
      
      if (formdata) {
        const main_win = await WebviewWindow.getByLabel(win);
        const token = sessionStorage.getItem("token");
        if (win === 'main_task') {
          console.log("project---action----main", formdata);
          await main_win.emit("main-project-add-edit-info", { formdata, token, sendWin: 'main_task' });
          sessionStorage.removeItem("formdata");
        } else if (win === 'pet') {
          console.log("project---action----pet", formdata);
          await main_win.emit("pet-project-add-edit-info", { formdata, token, sendWin: 'pet' });
          sessionStorage.removeItem("formdata");
        }
        await newWindow.show(); // 显示窗口
      }
    });
  }
}

/**
 * @desc 任务新增/编辑窗口
 */
export async function createTaskWin(win) {
  const args = {
    label: "task_add_detail",
    url: "index.html#/taskDetail",
    title: "任务详情",
    width: 680,
    height: 620,
    resizable: false,
    center: true,
    visible: false,
    alwaysOnTop: false,
    decorations: false,
    theme: 'Dark'
  }
  await checkIsExisting(args);
  
  const newWindow = new WebviewWindow(args.label, args);
  const res = await createNewWin(newWindow);

  if (res) {
    console.log(args.label, "窗口 已准备好");
    listenAndRemove(newWindow, `taskDetail-window-ready`, async (event) => {
      const formdata = JSON.parse(sessionStorage.getItem("formdata"));
      if (formdata) {
        const main_win = await WebviewWindow.getByLabel(win);
        const token = sessionStorage.getItem("token");
        if (win === 'mini_task') {
          await main_win.emit("mini-task-add-edit-info", { formdata, token, emitWin: 'mini_task' });
          sessionStorage.removeItem("formdata");
        } else if (win === 'main_task') {
          await main_win.emit("main-task-add-edit-info", { formdata, token, emitWin: 'main_task' });
          sessionStorage.removeItem("formdata");
        } else if (win === 'pet') {
          await main_win.emit("pet-task-add-edit-info", { formdata, token, emitWin: 'pet' });
          sessionStorage.removeItem("formdata");
        }
        await newWindow.show(); // 显示窗口
      }
    });
  }
}

/**
 * @desc 从mini窗口进入：任务编辑窗口
 */
export async function createMiniDetailWin() {
  await createMiniTaskDetailWin({
    label: "mini_task_add_detail",
    url: "index.html#/taskDetail",
    title: "任务详情",
    width: 750,
    height: 580,
    resizable: false,
    center: true,
    visible: false,
    alwaysOnTop: false,
    decorations: false,
    theme: 'Dark'
  });
}

/**
 * @desc 预览图片窗口
 */
export async function createPreviewImageWin(win) {
  const args = {
    label: "preview_image",
    url: "index.html#/previewImage",
    title: "预览图片",
    width: 650,
    height: 450,
    resizable: false,
    center: true,
    visible: false,
    alwaysOnTop: false,
    theme: 'Dark'
  }
  await checkIsExisting(args);
  const main_win = await WebviewWindow.getByLabel(win);
  const newWindow = new WebviewWindow(args.label, args);
  const res = await createNewWin(newWindow);

  console.log("111---action----main_win", main_win);
  if (res) {
    console.log(args.label, "窗口 已准备好");
    listenAndRemove(newWindow, "preview-window-ready", async (event) => {
      const imagelist = JSON.parse(sessionStorage.getItem("imagelist"));
      
      if (imagelist) {
        console.log("111---action----", imagelist);
        await main_win.emit("preview-image-list", { imagelist });
        sessionStorage.removeItem("imagelist");
        await newWindow.show(); // 显示窗口
      }
    });
  }
}

/**
 * @desc 桌面宠物窗口
 */
export async function createWinPetWin() {
  console.log("开始创建宠物窗口...");
  await createWin({
    url: "index.html#/pet",
    label: "pet",
    title: "桌面宠物",
    width: 32,
    height: 160,
    resizable: false,
    center: false,
    visible: true,
    x: 100, // 改为更安全的位置
    y: 100,
    alwaysOnTop: true,
    transparent: true,
    decorations: false,
    shadow: false,
    skipTaskbar: true,
    theme: 'Dark'
  });
  console.log("宠物窗口创建完成");
}

/**
 * @desc 任务管理小窗口
 */
export async function createTeskWin() {
  await createWin({
    label: "mini_task",
    url: "index.html#/miniTask",
    title: "任务管理小窗口",
    width: 300,
    height: 220,
    resizable: false,
    center: true,
    visible: false,
    // x: 900,
    // y: 900,
    alwaysOnTop: true,
    transparent: true,
    decorations: false,
    shadow: false,
    skipTaskbar: true,
    theme: 'Dark'
  });
}
export async function createNotificationWin() {
    // 获取宠物窗口
   
      // 获取宠物窗口的位置,从localstorage中获取
      const notificationWidth = 300;
      const notificationHeight = 150;
      let x = JSON.parse(localStorage.getItem('window_position_pet')).x || 1900 - 300 - 20;
      let y = JSON.parse(localStorage.getItem('window_position_pet')).y || 1100 - 220 - 20;
      console.log(x, y);
      y-=120
      x-=60
      const args = {
        label: "notificationPopup",
        url: "index.html#/notificationPopup",
        title: "通知",
        width: notificationWidth,
        height: notificationHeight,
        resizable: false,
        center: false,
        x: x,
        y: y,
        visible: true,
        alwaysOnTop: true,
        transparent: true,
        decorations: false,
        shadow: false,
        skipTaskbar: true,
        theme: 'Dark'
      };
      await createWin(args);
}
/**
 * @desc 任务管理小窗口的筛选窗口
 */
export async function createFilterWin() {
  const args = {
    label: "mini_task_filter",
    url: "index.html#/miniTaskFilter",
    title: "筛选窗口",
    width: 660,
    height: 585,
    resizable: false,
    center: true,
    visible: false,
    alwaysOnTop: false,
    decorations: false,
    theme: 'Dark'
  };
  await checkIsExisting(args);
  const main_win = await WebviewWindow.getByLabel("mini_task");
  const newWindow = new WebviewWindow(args.label, args);
  const res = await createNewWin(newWindow);

  console.log("111---action----filter", main_win);
  if (res) {
    console.log(args.label, "窗口 已准备好");
    listenAndRemove(newWindow, "filter-window-ready", async (event) => {
      const token = sessionStorage.getItem("token");
      
      if (token) {
        console.log("111---action----token", token);
        await main_win.emit("filterToken", { token });
        await newWindow.show(); // 显示窗口
      }
    });
  }
}

/**
 * @desc 打开宠物管理窗口
 */
export async function createPetManagementWin() {
  console.log('createPetManagementWin');
  await createWin({
    url: 'index.html#/pet-management',
    label: "pet_management",
    title: "宠物管理",
    width: 800,
    height: 600,
    resizable: true,
    center: true,
    alwaysOnTop: true,
    theme: 'Dark'
  });
}

/**
 * @desc 打开好友通知/消息通知窗口
 */
export async function createInformWin() {
  const args = {
    label: "inform_win",
    url: "index.html#/friendOrGroupInform",
    title: "消息通知",
    width: 650,
    height: 450,
    resizable: false,
    center: true,
    visible: false,
    alwaysOnTop: false,
    decorations: false,
    theme: 'Dark'
  }
  await checkIsExisting(args);
  const main_win = await WebviewWindow.getByLabel('main_task');
  const newWindow = new WebviewWindow(args.label, args);
  const res = await createNewWin(newWindow);

  console.log("111---action----main_win", main_win);
  if (res) {
    console.log(args.label, "窗口 已准备好");
    listenAndRemove(newWindow, "apply-inform-window-ready", async (event) => {
      const token = sessionStorage.getItem("token");
      const applyInformType = sessionStorage.getItem("informType");
      await main_win.emit("apply-inform-info", { token, applyInformType });
      sessionStorage.removeItem("informType");
      await newWindow.show(); // 显示窗口
    });
  }
}

/**
 * @desc 群组成员
 */
export async function createGroupMemberDetailWin() {
  const args = {
    label: "group_member_detail",
    url: "index.html#/groupMemberDetail",
    title: "群组成员",
    width: 380,
    height: 600,
    resizable: false,
    center: true,
    visible: false,
    alwaysOnTop: false,
    decorations: false,
    theme: 'Dark'
  }
  await checkIsExisting(args);
  const main_win = await WebviewWindow.getByLabel("main_task");
  const newWindow = new WebviewWindow(args.label, args);
  const res = await createNewWin(newWindow);

  console.log("111---action----main_win", main_win);
  if (res) {
    console.log(args.label, "窗口 已准备好");
    listenAndRemove(newWindow, "group-member-window-ready", async (event) => {
      const formdata = JSON.parse(sessionStorage.getItem("formdata"));
      console.log("formdata", formdata)
      if (formdata) {
        const token = sessionStorage.getItem("token");
        const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
        await main_win.emit("group-member-info", { token, formdata, userInfo });
        sessionStorage.removeItem("formdata");
        await newWindow.show(); // 显示窗口
      }
    });
  }
}

/**
 * @desc 创建群组/群组拉人,移除人
 */
export async function createOrEditGroupWin() {
  const args = {
    label: "create_edit_group",
    url: "index.html#/createOrEditGroup",
    title: "创建群组",
    width: 620,
    height: 700,
    resizable: false,
    center: true,
    visible: false,
    alwaysOnTop: false,
    decorations: false,
    theme: 'Dark'
  }
  await checkIsExisting(args);
  const main_win = await WebviewWindow.getByLabel("main_task");
  const newWindow = new WebviewWindow(args.label, args);
  const res = await createNewWin(newWindow);

  console.log("111---action----main_win", main_win);
  if (res) {
    console.log(args.label, "窗口 已准备好");
    listenAndRemove(newWindow, "create-group-window-ready", async (event) => {
      const formdata = JSON.parse(sessionStorage.getItem("formdata"));
      console.log("formdata", formdata)
      if (formdata) {
        const token = sessionStorage.getItem("token");
        const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
        await main_win.emit("create-edit-group-info", { token, formdata, userInfo });
        sessionStorage.removeItem("formdata");
        await newWindow.show(); // 显示窗口
      }
    });
  }
}


export default {
  createWin,
  getWin,
  setWin,
  setWinData,
  disableWindowMenu,
  createLoginWin,
  createMainWin,
  createProjectWin,
  createTaskWin,
  createPreviewImageWin,
  createWinPetWin,
  createPetManagementWin,
  createTeskWin,
  createFilterWin,
  createInformWin,
  createOrEditGroupWin,
  createGroupMemberDetailWin
};