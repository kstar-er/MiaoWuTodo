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

【注意】若需要更改 签名密钥对，操作步骤：
（1）运行命令：npm run tauri signer generate -- -w ~/.tauri/myapp.key
（2）输入密码（该密码就是上面对安装包进行签名时，所需的密码）
    此时：会生成公钥myapp.key.pub、密钥myapp.key，输出的两个文件在该项目下的"~/.tauri/"目录
（3）将公钥文件myapp.key.pub，里面的字符串复制到 tauri.config.json文件 中的 plugins.pubkey
（4）将私钥文件myapp.key，复制到本地用户下路径（此步骤可进行，可不进行）
     e.g.  C:/用户/你的电脑用户名/.tauri/myapp.key）

更新新功能操作：
1. 修改版本号：tauri.conf.json ，package.json两个文件同时修改版本号
2. 记得修改请求路径：webSocket.js和pbrequest.js两个文件，如果有需要的话
3. 执行构建命令：npm run tauri build --no-log

4. 将打包好的安装文件，部署到oss服务器中：
  文件路径：/src-tauri/target/release/bundle/nsis
  oss路径：https://guoqinghh5.oss-cn-shanghai.aliyuncs.com

5. 获取签名文件.sig：
  方式一：将打包好的安装文件路径，运行命令，用私钥文件获取 签名signature
  步骤：（1）将项目下"~/.tauri/myapp.key"的私钥文件，复制到本地用户下路径，比如：C:/用户/你的电脑用户名/.tauri/myapp.key（若已复制，此步骤可跳过）
       （2）运行命令：tauri signer sign 打包好的文件路径> --private-key-path ~/.tauri/myapp.key
            e.g. windows版本: tauri signer sign src-tauri/target/release/bundle/nsis/MiaowuTodo_1.1.0_x64-setup.exe --private-key-path ~/.tauri/myapp.key
            e.g. mac版本：同理，但是需要用.tar.gz后缀的打包文件
       （3）输入密码：123456

  方式二：直接用私钥获取 签名
    （1）直接运行命令：tauri signer sign 打包好的文件路径> --private-key "<将项目下私钥文件里面的私钥复制到这里>"
      e.g. windows版本: tauri signer sign src-tauri/target/release/bundle/nsis/MiaowuTodo_1.1.0_x64-setup.exe --private-key "xxxxx"
    （2）输入密码：123456

6. 步骤五运行完tauri signer sign和输入密码以后，将获取到的.sig的签名文件里面的签名字符串发给后端：
  生成的.sig文件在该文件目录下：/src-tauri/target/release/bundle/nsis
  或是 直接复制命令行输出的Public signature后的字符串

7. 下载oss路径中的软件包，重新安装测试功能完整性。
8. 修改更新日志，将更新内容以及部署路径更新上去。



Mac签名命令：codesign  -s "Developer ID Application: kaixing zheng (VQ4L622F58)" MiaoWuTodo.app
查看当前证书的哈希值：security find-identity -v -p codesigning
验证证书信任链：security verify-cert -c  "Developer ID Application: kaixing zheng (VQ4L622F58)"