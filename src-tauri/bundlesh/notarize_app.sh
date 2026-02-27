#!/bin/bash

# macOS应用程序公证脚本
# 需要Apple Developer账号和应用专用密码

# 创建美观DMG的函数 - 基于bundle_dmg.sh的逻辑
create_dmg() {
    local app_path="$1"
    local dmg_path="$2"
    local app_name="$3"
    
    echo "💿 创建安装DMG..."
    
    # 创建临时DMG目录
    local temp_dir="$(dirname "$dmg_path")/dmg_temp"
    rm -rf "$temp_dir"
    mkdir -p "$temp_dir"
    
    # 复制应用程序到临时目录
    cp -R "$app_path" "$temp_dir/"
    
    # 创建临时DMG (可读写格式)
    local temp_dmg="$(dirname "$dmg_path")/temp_$(basename "$dmg_path")"
    rm -f "$temp_dmg"
    
    echo "创建临时DMG..."
    hdiutil create -srcfolder "$temp_dir" -volname "$app_name" \
        -fs HFS+ -fsargs "-c c=64,a=16,e=16" -format UDRW \
        "$temp_dmg"
    
    # 调整DMG大小以容纳额外内容
    local disk_size=$(du -sm "$temp_dir" | cut -f1)
    disk_size=$((disk_size + 20))  # 添加20MB额外空间
    hdiutil resize -size ${disk_size}m "$temp_dmg"
    
    # 挂载临时DMG进行自定义
    echo "🎨 挂载并自定义DMG外观..."
    local dev_name=$(hdiutil attach -readwrite -noverify -noautoopen -nobrowse "$temp_dmg" | grep -E '^/dev/' | sed 1q | awk '{print $1}')
    local mount_dir="/Volumes/$app_name"
    
    # 等待挂载完成
    sleep 3
    
    # 创建Applications符号链接
    echo "创建Applications链接..."
    ln -s /Applications "$mount_dir/Applications"
    
    # 创建隐藏的背景图片目录
    mkdir -p "$mount_dir/.background"
    
    # 设置DMG窗口属性和图标位置
    echo "设置窗口外观..."
    osascript <<EOF
tell application "Finder"
    tell disk "$app_name"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {100, 100, 600, 400}
        set viewOptions to the icon view options of container window
        set arrangement of viewOptions to not arranged
        set icon size of viewOptions to 128
        set text size of viewOptions to 16
        set position of item "$app_name.app" of container window to {150, 200}
        set position of item "Applications" of container window to {350, 200}
        close
        open
        update without registering applications
        delay 3
        close
    end tell
end tell
EOF
    
    # 修复权限
    echo "修复权限..."
    chmod -Rf go-w "$mount_dir" &> /dev/null || true
    
    # 删除不必要的文件系统事件日志
    rm -rf "$mount_dir/.fseventsd" 2>/dev/null || true
    
    # 卸载DMG
    echo "卸载临时DMG..."
    hdiutil detach "$dev_name"
    
    # 转换为只读压缩格式
    echo "压缩DMG..."
    hdiutil convert "$temp_dmg" -format UDZO -imagekey zlib-level=9 -o "$dmg_path"
    
    # 清理临时文件
    rm -f "$temp_dmg"
    rm -rf "$temp_dir"
    
    echo "✅ DMG创建完成: $dmg_path"
}

# 配置信息 - 请根据实际情况修改
APP_NAME="MiaoWuTodo"
BUNDLE_ID="com.miaowutodo"
APPLE_ID="z_kxing@163.com"        # 替换为你的Apple ID
APP_PASSWORD="taku-knha-xqeq-vobh"    # 替换为应用专用密码
TEAM_ID="VQ4L622F58"                      # 替换为你的Team ID

echo "🔐 macOS应用程序公证脚本"
echo "========================"
echo "📋 配置信息:"
echo "   应用名称: $APP_NAME"
echo "   Bundle ID: $BUNDLE_ID"
echo "   Apple ID: $APPLE_ID"
echo "   Team ID: $TEAM_ID"
echo

# 检查配置
if [ "$APPLE_ID" = "your-apple-id@example.com" ] || [ "$APP_PASSWORD" = "your-app-specific-password" ] || [ "$TEAM_ID" = "YOUR_TEAM_ID" ]; then
    echo "❌ 错误: 请先配置Apple ID、应用专用密码和Team ID"
    echo
    echo "📋 配置步骤:"
    echo "1. 编辑此脚本文件"
    echo "2. 将 APPLE_ID 替换为你的Apple ID邮箱"
    echo "3. 将 APP_PASSWORD 替换为应用专用密码"
    echo "4. 将 TEAM_ID 替换为你的开发者Team ID"
    echo
    echo "💡 获取应用专用密码:"
    echo "1. 访问 https://appleid.apple.com"
    echo "2. 登录你的Apple ID"
    echo "3. 进入 '登录和安全性'"
    echo "4. 在 '应用专用密码' 部分生成新密码"
    echo
    echo "💡 获取Team ID:"
    echo "1. 访问 https://developer.apple.com/account"
    echo "2. 在 'Membership' 页面查看Team ID"
    exit 1
fi

# 检查应用程序包是否存在
if [ ! -d "../target/release/bundle/macos/$APP_NAME.app" ]; then
    echo "❌ 错误: 未找到 $APP_NAME.app"
    echo "请先运行签名打包脚本: ./build_macos_signed.sh"
    exit 1
fi

# 检查应用是否已签名
echo "🔍 检查应用签名状态..."
codesign -dv "../target/release/bundle/macos/$APP_NAME.app" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ 错误: 应用程序未签名"
    echo "请先运行签名打包脚本: ./build_macos_signed.sh"
    exit 1
fi

echo "✅ 应用程序已签名"

# 检查notarytool是否可用
if ! command -v xcrun &> /dev/null; then
    echo "❌ 错误: 未找到Xcode命令行工具"
    echo "请安装Xcode或运行: xcode-select --install"
    exit 1
fi

# 创建ZIP文件用于公证
echo "📦 创建公证用ZIP文件..."
ZIP_FILE="../target/release/bundle/macos/$APP_NAME.zip"
rm -f "$ZIP_FILE"

ditto -c -k --keepParent "../target/release/bundle/macos/$APP_NAME.app" "$ZIP_FILE"

if [ ! -f "$ZIP_FILE" ]; then
    echo "❌ 错误: ZIP文件创建失败"
    exit 1
fi

echo "✅ ZIP文件创建成功: $ZIP_FILE"
echo "   文件大小: $(ls -lh "$ZIP_FILE" | awk '{print $5}')"

# 提交公证
echo
echo "🚀 提交应用程序进行公证..."
echo "⏳ 这可能需要几分钟到几小时，请耐心等待..."
echo

# 使用notarytool提交公证
xcrun notarytool submit "$ZIP_FILE" \
    --apple-id "$APPLE_ID" \
    --password "$APP_PASSWORD" \
    --team-id "$TEAM_ID" \
    --wait \
    --timeout 3600

NOTARIZE_RESULT=$?

if [ $NOTARIZE_RESULT -eq 0 ]; then
    echo
    echo "✅ 公证成功！"
    
    # 装订公证票据
    echo "📎 装订公证票据到应用程序..."
    xcrun stapler staple -v "../target/release/bundle/macos/$APP_NAME.app"
    
    if [ $? -eq 0 ]; then
        echo "✅ 公证票据装订成功"
        
        # 验证装订
        echo "🔍 验证公证票据..."
        xcrun stapler validate "../target/release/bundle/macos/$APP_NAME.app"
        
        if [ $? -eq 0 ]; then
            echo "✅ 公证票据验证成功！"
            
            # 重新创建DMG（包含公证票据）
            create_dmg "../target/release/bundle/macos/$APP_NAME.app" "../target/release/bundle/macos/$APP_NAME.dmg" "$APP_NAME"
            
            if [ $? -eq 0 ]; then
                echo "✅ 已公证DMG创建成功"
                
                # 签名DMG
                echo "🔐 签名DMG文件..."
                DEVELOPER_ID=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -1 | sed 's/.*"\(.*\)".*/\1/')
                if [ -n "$DEVELOPER_ID" ]; then
                    codesign --force --sign "$DEVELOPER_ID" "../target/release/bundle/macos/$APP_NAME.dmg"
                    if [ $? -eq 0 ]; then
                        echo "✅ DMG签名成功"
                    else
                        echo "⚠️  DMG签名失败"
                    fi
                fi
            else
                echo "❌ DMG创建失败"
            fi
            
            # 最终验证
            echo
            echo "🔍 最终验证..."
            spctl --assess --type execute --verbose "../target/release/bundle/macos/$APP_NAME.app"
            
            if [ $? -eq 0 ]; then
                echo "✅ Gatekeeper验证通过！"
            else
                echo "❌ Gatekeeper验证失败"
            fi
            
        else
            echo "❌ 公证票据验证失败"
            exit 1
        fi
    else
        echo "❌ 公证票据装订失败"
        exit 1
    fi
    
else
    echo
    echo "❌ 公证失败"
    echo
    echo "🔍 可能的原因:"
    echo "1. Apple ID或密码错误"
    echo "2. Team ID错误"
    echo "3. 应用程序签名有问题"
    echo "4. 网络连接问题"
    echo
    echo "🛠️  排查步骤:"
    echo "1. 检查Apple ID和应用专用密码是否正确"
    echo "2. 确认Team ID是否正确"
    echo "3. 检查应用程序是否正确签名"
    echo "4. 查看详细错误信息"
    
    # 清理临时文件
    rm -f "$ZIP_FILE"
    exit 1
fi

# 清理临时文件
echo
echo "🧹 清理临时文件..."
rm -f "$ZIP_FILE"

echo
echo "🎉 应用程序公证完成！"
echo
echo "📁 最终文件:"
echo "   - ../target/release/bundle/macos/$APP_NAME.app (已签名已公证)"
if [ -f "../target/release/bundle/macos/$APP_NAME.dmg" ]; then
    echo "   - ../target/release/bundle/macos/$APP_NAME.dmg (已签名已公证)"
fi

echo
echo "📋 文件信息:"
if [ -d "$APP_NAME.app" ]; then
    echo "   应用程序包大小: $(du -sh "../target/release/bundle/macos/$APP_NAME.app" | cut -f1)"
fi
if [ -f "$APP_NAME.dmg" ]; then
    echo "   DMG文件大小: $(ls -lh "../target/release/bundle/macos/$APP_NAME.dmg" | awk '{print $5}')"
fi

echo
echo "✨ 公证完成！现在可以安全分发应用程序了。"
echo
echo "📤 分发建议:"
echo "- 优先分发DMG文件（用户体验更好）"
echo "- 也可以直接分发.app文件夹"
echo "- 用户下载后可以直接运行，无需额外操作"
echo
echo "🔍 验证命令:"
echo spctl --assess --type execute --verbose 'MiaoWuTodo.app'
echo "   spctl --assess --type execute --verbose '../target/release/bundle/macos/$APP_NAME.app'"