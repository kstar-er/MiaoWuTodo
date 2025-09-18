import { deleteTask } from "../../../utils/taskManagement";
import { showAlert, showMessage } from "./globalMessage";
import { createPreviewImageWin } from "../../../multiwins/action";
import { getProjectClass } from "../../../utils/taskManagement";
// import { DataSource as DeptDataSource } from "../../../utils/deptManagement/index"

// 删除任务逻辑
export const handleDelete = (taskId) => {
  console.log("删除任务:", taskId);
  return new Promise((resolve, reject) => {
    showAlert( "提示", "是否确认删除这个任务", {
      type: "error",
      showCancelButton: true,
      cancelButtonText: "再想想",
      confirmButtonText: "确认删除",
      confirmButtonClass: "delete-confirm-btn",
      callback: async (action) => {
        if (action === "cancel") {
          resolve({ canceled: true }); // 用户取消
        } else {
          try {
            const res = await deleteTask([taskId]);
            if (res.code === 200) {
              resolve({ success: true, message: "成功删除1条任务数据" }); // 删除成功
            } else {
              reject({ error: true, message: "删除失败" }); // 删除失败
            }
          } catch (error) {
            reject({ error: true, message: "删除过程中发生错误" }); // 捕获异常
          }
        }
      },
    });
  });
};

// 图片预览逻辑
export const handlePreviewImage = async (image, win) => {
  let srcList = []
  console.log("预览图片:", image, win);
  if (image) {
    srcList.value = image.split(';');

    if (sessionStorage.getItem("imagelist")) {
      sessionStorage.removeItem("imagelist");
    }
    sessionStorage.setItem("imagelist", JSON.stringify({srcList: srcList.value}));
    await createPreviewImageWin(win);
  } else {
    showMessage('warning', '该任务无图片列表')
  }
};

// 获取项目分组数据
export const initProjectClass = async () => {
  const data = await getProjectClass();
  if (data.code === 200 && data.data && data.data?.length > 0 ) {
    let res = []
    data.data.forEach(item => {
      res.push({
        label: item,
        value: item
      })
    })
    return res
  }
  return [];
};

// 准备新建项目所需的数据
export const prepareFormDataForNewProject = async () =>{
  try {
    // 构建 formData
    return {
      scheduleList: ['待接取', '进行中', '测试中', '待审批', '归档'], // 项目下任务的进度流程
      schedule: '待启动', // 项目的进度流程：待启动
      projectClassList: await initProjectClass(), // 获取分组列表
    };
  } catch (error) {
    console.error("准备新建项目数据失败:", error);
    return null;
  }
}