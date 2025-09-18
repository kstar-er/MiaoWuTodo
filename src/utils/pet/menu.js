import { Menu, Submenu, MenuItem } from "@tauri-apps/api/menu";
import { PhysicalPosition } from "@tauri-apps/api/window";
import {
  createPetManagementWin,
  createMainWin,
  createTeskWin,
  createProjectWin,
  createTaskWin
} from "../../multiwins/action";
import { prepareFormDataForNewProject } from "../../views/dotask/utils/eventHandler";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

// 创建一个菜单项
let initializedMenu = null;

export async function init() {
  let switchPetMenuItem = await MenuItem.new({
    id: "switchPet",
    rid: 1,
    enabled: true,
    text: "切换宠物",
    action: createPetManagementWin,
  });

  let taskMenuItem = await MenuItem.new({
    id: "task",
    rid: 2,
    enabled: true,
    text: "打开任务栏",
    action: createMainWin,
  });
  let projectMenuItem = await MenuItem.new({
    id: "project",
    rid: 3,
    enabled: true,
    text: "新建项目",
    action: async() => {
      if (sessionStorage.getItem("formdata")) {
        sessionStorage.removeItem("formdata");
      }
      const formData = await prepareFormDataForNewProject();
      if (formData) {
        sessionStorage.setItem("formdata", JSON.stringify(formData));
        console.log("传输的数据:", formData);
      }
      await createProjectWin('pet'); // 打开新建项目窗口
    }
  });
  let newTaskMenuItem = await MenuItem.new({
    id: "newTaskMenuItem",
    rid: 4,
    enabled: true,
    text: "新建任务",
    action: async() => {
      if (localStorage.getItem('lastTaskAddData')) {
        const formData = JSON.parse(localStorage.getItem('lastTaskAddData'));
        formData.isCanSelectProject = true; // 是否能够更改项目
        sessionStorage.setItem("formdata", JSON.stringify(formData));
        await createTaskWin('pet');
        console.log("传输的数据:", formData);
      }
    }
  });
  let showMiniTaskMenuItem = await MenuItem.new({
    id: "showMiniTaskMenuItem",
    rid: 5,
    enabled: true,
    text: "打开小窗口",
    action: async () => {
      const pet_win = await WebviewWindow.getByLabel("pet");
      if (pet_win) {
        const token = sessionStorage.getItem("token");
        const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
        // await pet_win.emit("login-info", { token, userInfo });
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("userInfo", JSON.stringify(userInfo));
      }
      await createTeskWin();
    },
  });
  // 创建菜单并存储到全局变量中
  initializedMenu = await Menu.new({
    id: "mainMenu",
    items: [
      switchPetMenuItem,
      newTaskMenuItem,
      projectMenuItem,
      taskMenuItem,
      showMiniTaskMenuItem,
    ],
  });
}

export async function show(posX, posY, window) {
  if (!initializedMenu) {
    console.log("init");
    await init();
  }

  console.log("show", initializedMenu);

  // 新建PhysicalPosition
  let position = new PhysicalPosition(posX, posY);
  await initializedMenu.popup(position, window);
}
