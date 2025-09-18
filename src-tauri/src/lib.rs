// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{ AppHandle,Manager};

// 单例模式，当二次启动时聚焦
pub fn show_window(app: &AppHandle) {
    let main = app.get_webview_window("main_task");
    if let Some(main) = main {
        main.unminimize().expect("Sorry, can't unminimize window");
        main.set_focus().expect("Sorry, can't focus window");
    } else {
        app.webview_windows()
            .values()
            .next()
            .expect("Sorry, no window found")
            .set_focus()
            .expect("Can't Bring Window to Focus");
    }
}

