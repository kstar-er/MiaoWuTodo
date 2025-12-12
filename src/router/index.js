/**
 * 路由管理
 */
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getRouters } from "../utils/login/index";
import { createRouter, createWebHashHistory } from "vue-router";
// import { authState } from '@/pinia/modules/auth'
import NProgress from "nprogress"; // 顶部进度条配置

import "nprogress/nprogress.css";
NProgress.configure({
  easing: "ease",
  speed: 500,
  showSpinner: true,
  trickleSpeed: 200,
  minimum: 0.3,
});
/**
 * meta配置
 * @param meta.requireAuth 需登录验证页面
 */
const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/login.vue"),
    meta: {
      title: "登录",
      keepAlive: false, //设置页面是否需要使用缓存
    },
  },
  {
    path: "/index",
    name: "index",
    component: () => import("../views/dotask/index.vue"),
    meta: {
      title: "喵呜Todo",
      keepAlive: true, //设置页面是否需要使用缓存
    },
    children: [
      {
        path: "/projectManagement",
        name: "projectManagement",
        component: () => import("../views/dotask/projectManagement.vue"),
        meta: {
          title: "项目管理",
          keepAlive: true, //设置页面是否需要使用缓存
        },
      },
      {
        path: "/taskManagement",
        name: "taskManagement",
        component: () => import("../views/dotask/taskManagement.vue"),
        meta: {
          title: "任务管理",
          keepAlive: true, //设置页面是否需要使用缓存
        },
      },
      {
        path: "/groupManagement",
        name: "groupManagement",
        component: () => import("../views/dotask/groupManagement.vue"),
        meta: {
          title: "群组",
          keepAlive: true, //设置页面是否需要使用缓存
        },
      },
      {
        path: "/reportManagement",
        name: "reportManagement",
        component: () => import("../views/dotask/reportManagement.vue"),
        meta: {
          title: "报表管理",
          keepAlive: true, //设置页面是否需要使用缓存
        },
      },
      {
        path: "/weeklyReportManagement",
        name: "weeklyReportManagement",
        component: () => import("../views/dotask/weeklyReportManagement.vue"),
        meta: {
          title: "周报管理",
          keepAlive: true, //设置页面是否需要使用缓存
        },
      },
      {
        path: "/settingManagement",
        name: "settingManagement",
        component: () => import("../views/dotask/settingManagement.vue"),
        meta: {
          title: "设置",
          keepAlive: true, //设置页面是否需要使用缓存
        },
      }
    ]
  },
  {
    path: '/projectDetail',
    name: 'projectDetail',
    component: () => import('../views/dotask/components/projectDetail.vue'),
    meta: {
      title: '项目详情编辑与新增',
      keepAlive: false //设置页面是否需要使用缓存
    },
    children: []
  },
  {
    path: '/taskDetail',
    name: 'taskDetail',
    component: () => import('../views/dotask/components/taskDetail.vue'),
    meta: {
      title: '任务详情编辑与新增',
      keepAlive: false //设置页面是否需要使用缓存
    },
    children: []
  },
  {
    path: '/miniTaskFilter',
    name: 'miniTaskFilter',
    component: () => import('../views/dotask/components/miniTaskFilter.vue'),
    meta: {
      title: '悬浮框筛选器',
      keepAlive: false //设置页面是否需要使用缓存
    },
    children: []
  },
  {
    path: '/previewImage',
    name: 'previewImage',
    component: () => import('../views/components/public/previewImage.vue'),
    meta: {
      title: '预览图片',
      keepAlive: false //设置页面是否需要使用缓存
    },
    children: []
  },
  {
    path: '/createOrEditGroup',
    name: 'createOrEditGroup',
    component: () => import('../views/dotask/components/createOrEditGroup.vue'),
    meta: {
      title: '创建编辑群组',
      keepAlive: false //设置页面是否需要使用缓存
    },
    children: []
  },
  {
    path: '/groupMemberDetail',
    name: 'groupMemberDetail',
    component: () => import('../views/dotask/components/groupMemberDetail.vue'),
    meta: {
      title: '群组成员',
      keepAlive: false //设置页面是否需要使用缓存
    },
    children: []
  },
  {
    path: '/friendOrGroupInform',
    name: 'friendOrGroupInform',
    component: () => import('../views/dotask/components/friendOrGroupInform.vue'),
    meta: {
      title: '消息通知',
      keepAlive: false //设置页面是否需要使用缓存
    },
    children: []
  },
  {
    path: "/pet",
    name: "pet",
    component: () => import("../views/pet/pet.vue"),
    meta: {
      title: "桌面宠物",
      keepAlive: false, //设置页面是否需要使用缓存
    },
  },
  {
    path: "/pet-management",
    name: "petManagement",
    component: () => import("../views/pet/petManagement.vue"),
    meta: {
      title: "宠物管理",
      keepAlive: false,
    },
  },
  {
    path: "/miniTask",
    name: "MiniTask",
    component: () => import("../views/dotask/miniTask.vue"),
    meta: {
      title: "任务管理小窗口",
      keepAlive: false,
    },
  },
  {
    path: '/update-content',
    name: 'updateContent',
    component: () => import('../views/dotask/updateContent.vue'),
    meta: {
      title: '更新内容'
    }
  },
  {
    path: '/notificationPopup',
    name: 'notificationPopup',
    component: () => import('../public/components/NotificationPopup.vue'),
    meta: {
      title: '通知'
    }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 动态添加路由
// ...

// 全局路由钩子拦截
// router.beforeEach(async (to, from) => {
//   NProgress.start();
//   console.log("111---router", to)
//   if (to.path === "/login") {
//     console.log("router-index-login")
//     await loginWin();
//     // const login_win = await WebviewWindow.getByLabel('main_login');
//     // login_win.show()
//   } else {
//     console.log("router-index-other")
//     // await getCurrentWindow().show();
//     await getCurrentWindow().unminimize();
//     await getCurrentWindow().setFocus();
//     return true;
//   }
// });

// router.afterEach((to, from, next) => {
//   // ...
//   window.document.title = to.meta.title ? to.meta.title : "任务管理桌面端";
//   NProgress.done();
// });

router.onError((error) => {
  console.warn("[Router Error]", error);
});

export default router;
