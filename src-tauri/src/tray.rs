use std::env;
use std::path::Path;
use tauri::image::Image;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{App, Emitter};

/// 创建一个新的托盘图标
pub fn create_tray(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    println!("开始创建系统托盘...");
    let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let taskbar_i = MenuItem::with_id(app, "taskbar", "任务栏", true, None::<&str>)?;
    let mini_task_i = MenuItem::with_id(app, "miniTask", "小窗口", true, None::<&str>)?;
    let pet_i = MenuItem::with_id(app, "pet", "宠物", true, None::<&str>)?;
    let create_task_i = MenuItem::with_id(app, "createTask", "新任务", true, None::<&str>)?;
    let ai_dialog_i = MenuItem::with_id(app, "aiDialog", "AI对话", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &taskbar_i,
            &mini_task_i,
            &pet_i,
            &create_task_i,
            &ai_dialog_i,
            &quit_i,
        ],
    )?;

    // 获取当前可执行文件所在目录
    let exe_path = env::current_exe()?;
    let exe_dir = exe_path.parent().ok_or("无法获取可执行文件目录")?;
    println!("可执行文件目录: {:?}", exe_dir);

    // 尝试多个可能的图标路径
    let possible_icon_paths = [
        exe_dir.join("icons").join("icon.png"),
        exe_dir.join("icons").join("32x32.png"),
        exe_dir.join("icons").join("128x128.png"),
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("icons")
            .join("icon.png"),
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("icons")
            .join("32x32.png"),
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("icons")
            .join("128x128.png"),
    ];

    // 打印所有可能的路径
    for (i, path) in possible_icon_paths.iter().enumerate() {
        println!("可能的图标路径 {}: {:?}, 存在: {}", i, path, path.exists());
    }

    // 查找第一个存在的图标文件
    let icon_path = possible_icon_paths
        .iter()
        .find(|path| path.exists())
        .ok_or("找不到托盘图标文件")?;

    println!("使用图标路径: {:?}", icon_path);

    // 创建托盘图标
    let icon_image = Image::from_path(icon_path)?;
    TrayIconBuilder::new()
        .icon(icon_image)
        .tooltip("桌宠任务管理器")
        .menu(&menu)
        .build(app)?;

    app.on_menu_event(
        move |app_handle: &tauri::AppHandle, event| match event.id().0.as_str() {
            "quit" => {
                println!("quit event");
                app_handle.exit(0);
            }
            "taskbar" | "miniTask" | "pet" | "createTask" | "aiDialog" => {
                let menu_id = event.id().0.as_str();
                println!("tray menu event: {}", menu_id);
                if let Err(err) = app_handle.emit("tray-menu-event", menu_id) {
                    eprintln!("发送托盘菜单事件失败: {:?}", err);
                }
            }
            _ => {
                println!("未知菜单事件");
            }
        },
    );

    Ok(())
}
