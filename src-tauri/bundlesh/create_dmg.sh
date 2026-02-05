#!/bin/bash

# 设置变量
APP_NAME="MiaoWuTodo"
APP_PATH="target/release/bundle/macos/${APP_NAME}.app"
DMG_PATH="target/release/bundle/macos/${APP_NAME}.dmg"
VOLUME_NAME="${APP_NAME}"
TEMP_DMG="temp_${APP_NAME}.dmg"
    
# 1. 创建临时目录结构
mkdir -p dist/dmg
rm -rf dist/dmg/*

# 2. 复制应用
cp -R "${APP_PATH}" dist/dmg/

# 3. 创建Applications文件夹的符号链接
ln -s /Applications dist/dmg/Applications

# 4. 计算DMG大小（增加一些额外空间）
APP_SIZE=$(du -sm "${APP_PATH}" | cut -f1)
DMG_SIZE=$((APP_SIZE + 20))  # 增加20MB额外空间

# 5. 创建可读写的DMG
hdiutil create -srcfolder dist/dmg \
              -volname "${VOLUME_NAME}" \
              -fs HFS+ \
              -fsargs "-c c=64,a=16,e=16" \
              -format UDRW \
              -size ${DMG_SIZE}m \
              "${TEMP_DMG}"

# 6. 挂载DMG
MOUNT_DIR="/Volumes/${VOLUME_NAME}"
DEVICE=$(hdiutil attach -readwrite -noverify -noautoopen "${TEMP_DMG}" | \
         awk 'NR==1{print $1}' | sed 's/[[:space:]]*$//')

# 7. 设置DMG窗口布局
echo '
    tell application "Finder"
        tell disk "'${VOLUME_NAME}'"
            open
            set current view of container window to icon view
            set toolbar visible of container window to false
            set statusbar visible of container window to false
            set the bounds of container window to {400, 100, 920, 440}
            set viewOptions to the icon view options of container window
            set arrangement of viewOptions to not arranged
            set icon size of viewOptions to 72
             
            # 设置应用图标位置
            set position of item "'${APP_NAME}.app'" of container window to {120, 180}
            # 设置Applications链接位置
            set position of item "Applications" of container window to {380, 180}
            
            update without registering applications
            delay 2
            close
        end tell
    end tell
' | osascript

# 8. 设置权限
chmod -Rf go-w "${MOUNT_DIR}"
sync

# 9. 卸载DMG
hdiutil detach "${DEVICE}"

# 10. 转换为压缩格式
hdiutil convert "${TEMP_DMG}" -format UDZO -imagekey zlib-level=9 -o "${DMG_PATH}"

# 11. 清理临时文件
rm -f "${TEMP_DMG}"
rm -rf dist/dmg

echo "DMG created at: ${DMG_PATH}"