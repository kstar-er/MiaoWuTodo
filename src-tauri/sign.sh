# 配置信息 - 请根据实际情况修改
DEVELOPER_ID="Developer ID Application: kaixing zheng (VQ4L622F58)"  # 替换为你的证书名称
APP_NAME="MiaoWuTodo"
BUNDLE_ID="com.miaowutodo"

echo "🍎 macOS签名打包脚本 (修复版本)"
echo "================================"
echo "📋 配置信息:"
echo "   应用名称: $APP_NAME"
echo "   Bundle ID: $BUNDLE_ID"
echo "   开发者证书: $DEVELOPER_ID"
echo

# 检查开发者证书
echo "🔍 检查开发者证书..."
if ! security find-identity -v -p codesigning | grep -q "$DEVELOPER_ID"; then
    echo "❌ 错误: 未找到开发者证书"
    echo "可用的证书:"
    security find-identity -v -p codesigning
    echo
    echo "请确保:"
    echo "1. 已安装正确的开发者证书"
    echo "2. 更新脚本中的DEVELOPER_ID变量"
    exit 1
fi

echo "✅ 找到开发者证书"
echo "🔐 开始代码签名..."

# 首先签名可执行文件
echo "   签名可执行文件..."
codesign --force --verify --verbose --sign "$DEVELOPER_ID" \
    --options runtime \
    "target/release/bundle/macos/$APP_NAME.app/Contents/MacOS/$APP_NAME"

if [ $? -ne 0 ]; then
    echo "❌ 可执行文件签名失败"
    exit 1
fi

echo "   签名应用程序包..."
codesign --force --verify --verbose --sign "$DEVELOPER_ID" \
        --options runtime \
        --entitlements entitlements.plist \
        "target/release/bundle/macos/$APP_NAME.app"
if [ $? -ne 0 ]; then
    echo "❌ 应用程序包签名失败"
    exit 1
fi

# 验证签名
echo "🔍 验证签名..."
codesign --verify --deep --strict --verbose=2 "target/release/bundle/macos/$APP_NAME.app"

if [ $? -eq 0 ]; then
    echo "✅ 签名验证成功"
else
    echo "❌ 签名验证失败"
    exit 1
fi