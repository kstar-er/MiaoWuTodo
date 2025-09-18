// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
// src-tauri/src/main.rs
use tauri::Manager;
mod tray; // 引入 tray 模块
mod lib; // 引入 lib 模块
use std::path::Path;
use std::process::Command;
use std::env;
use dirs;  // 添加 dirs 导入

#[tauri::command]
fn get_download_path(filename: String) -> Result<String, String> {
    // 获取下载目录路径
    let download_dir = dirs::download_dir()
        .ok_or("无法获取下载目录")?
        .to_str()
        .ok_or("路径转换失败")?
        .to_string();
    
    // 构建完整的文件路径
    let file_path = Path::new(&download_dir).join(filename);
    Ok(file_path.to_str().unwrap().to_string())
}

#[tauri::command]
fn check_file_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

#[tauri::command]
fn open_file(path: String) -> Result<(), String> {
    let path = Path::new(&path);
    
    // 检查文件是否存在
    if !path.exists() {
        return Err("文件不存在".to_string());
    }
    
    // 使用系统默认程序打开文件
    if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(&["/C", "start", "", path.to_str().unwrap()])
            .spawn()
            .map_err(|e| e.to_string())?;
    } else if cfg!(target_os = "macos") {
        Command::new("open")
            .arg(path.to_str().unwrap())
            .spawn()
            .map_err(|e| e.to_string())?;
    } else {
        Command::new("xdg-open")
            .arg(path.to_str().unwrap())
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

fn main() {
    println!("======== 应用启动 ========");

    // 启用详细的错误处理和回溯
    std::env::set_var("RUST_BACKTRACE", "1");

    // 记录构建信息
    println!(
        "构建模式: {}",
        if cfg!(debug_assertions) {
            "Debug"
        } else {
            "Release"
        }
    );

    // 使用 lib.rs 中的插件配置
    let app_result = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            lib::show_window(app)
        }))
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_download_path,
            check_file_exists,
            open_file,
        ])
        .setup(|app| {
            println!("Tauri应用设置开始...");

            // 记录可用窗口
            let windows = app.webview_windows();
            println!("可用窗口: {:?}", windows.keys().collect::<Vec<_>>());

            // 尝试获取并显示登录窗口
            match app.get_webview_window("login") {
                Some(login_window) => {
                    println!("找到登录窗口，尝试显示...");

                    // 尝试设置焦点和显示窗口
                    let _ = login_window.set_focus();
                    if let Err(err) = login_window.show() {
                        eprintln!("显示登录窗口失败: {:?}", err);
                    } else {
                        println!("登录窗口显示成功");
                    }

                    // 显示窗口URL
                    match login_window.url() {
                        Ok(url) => println!("窗口URL: {}", url),
                        Err(e) => eprintln!("无法获取窗口URL: {:?}", e),
                    }
                }
                None => {
                    eprintln!("未找到登录窗口，这可能是配置问题");
                    // 列出所有可用窗口
                    println!(
                        "可用窗口: {:?}",
                        app.webview_windows().keys().collect::<Vec<_>>()
                    );
                }
            }
            println!("开始创建托盘");
            // 创建托盘图标
            if let Err(err) = tray::create_tray(app) {
                eprintln!("托盘创建失败: {:?}", err);
            } else {
                println!("托盘设置完成");
            }

            Ok(())
        })
        .run(tauri::generate_context!());

    // 处理运行结果
    match app_result {
        Ok(_) => println!("应用正常退出"),
        Err(err) => {
            eprintln!("运行Tauri应用程序时出错: {:?}", err);

            // 记录错误到文件
            use std::io::Write;
            if let Ok(mut file) = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open("tauri_error.log")
            {
                let _ = writeln!(file, "应用程序错误: {:?}", err);
            }

            // 为了调试，保持窗口打开
            std::thread::sleep(std::time::Duration::from_secs(5));
        }
    }

    println!("Tauri应用设置完成");
}
