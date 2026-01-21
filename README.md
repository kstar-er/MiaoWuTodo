安装rust工具链：
\\DESKTOP-V0V9RO6\xxlTools\rust\rustup-init.exe 拿这个到自己本地安装
rustc -V
cargo -V 
成功显示版本号表示安装成功

安装tauri-cli
npm install -g @tauri-apps/cli


npm install 安装相关依赖

引入tauri-cli到项目中
npm install @tauri-apps/api

进入src-tauri目录
npm run tauri dev

得到debug文件，执行tauri.exe

仅调试前端的，可以在dotask目录执行
npm run dev
同平时web开发一样，调试前端


安装界面的文字配置------tauri.conf.json文件修改以下代码：
"nsis": {
  "languages": ["SimpChinese", "English"], // 可选择的语言
  "displayLanguageSelector": true // 如果可供用户自己选择语言，就改成true
}


构建命令：
npm run tauri build --no-log


更新新功能操作：
1. 修改版本号：tauri.conf.json ，package.json两个文件同时修改版本号
2. 记得修改请求路径：webSocket.js和pbrequest.js两个文件，如果有需要的话
2. 执行构建命令：npm run tauri build --no-log
4. 将打包好的安装文件，部署到oss服务器中：
  文件路径：/src-tauri/target/release/bundle/nsis
  oss路径：https://guoqinghh5.oss-cn-shanghai.aliyuncs.com
5.下载oss路径中的软件包，重新安装测试功能完整性
5.修改更新日志，将更新内容以及部署路径更新上去。

Mac签名命令：codesign  -s "Developer ID Application: kaixing zheng (VQ4L622F58)" MiaoWuTodo.app
查看当前证书的哈希值：security find-identity -v -p codesigning
验证证书信任链：security verify-cert -c  "Developer ID Application: kaixing zheng (VQ4L622F58)"