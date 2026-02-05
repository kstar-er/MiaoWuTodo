#!/bin/bash

# 创建DMG背景图片的脚本
# 可选：用户可以运行此脚本来创建自定义背景图片

echo "🎨 创建DMG背景图片..."

# 检查是否有ImageMagick或sips
if command -v convert &> /dev/null; then
    # 使用ImageMagick创建渐变背景
    convert -size 500x300 gradient:#f0f0f0-#e0e0e0 background.png
    echo "✅ 使用ImageMagick创建背景图片"
elif command -v sips &> /dev/null; then
    # 使用系统图标作为基础创建背景
    sips -s format png --resampleWidth 500 --resampleHeight 300 \
        /System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns \
        --out background.png 2>/dev/null
    echo "✅ 使用系统图标创建背景图片"
else
    echo "⚠️  未找到图片处理工具，将使用默认背景"
    echo "💡 建议安装ImageMagick: brew install imagemagick"
fi

if [ -f "background.png" ]; then
    echo "✅ 背景图片已创建: background.png"
    echo "💡 你可以替换此文件为自定义的500x300像素PNG图片"
else
    echo "❌ 背景图片创建失败"
fi