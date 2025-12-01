class WebSocketService {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 10000; // 3秒
        this.messageHandlers = new Set();
        // 心跳相关配置
        this.heartbeatMinInterval = 30000; // 最小30秒
        this.heartbeatMaxInterval = 35000; // 最大35秒
        this.heartbeatTimeout = 10000; // 10秒内没收到pong就断开
        this.heartbeatTimer = null;
        this.pongTimer = null;
        this.lastPongTime = null;
        this.isConnected = false;
        this.currentUserId = null;
    }

    // 生成随机心跳间隔
    getRandomHeartbeatInterval() {
        return Math.floor(Math.random() * (this.heartbeatMaxInterval - this.heartbeatMinInterval + 1)) + this.heartbeatMinInterval;
    }

    // 连接WebSocket
    connect(userId) {
        // 如果已经有连接，先断开
        if (this.ws) {
            this.disconnect();
            // console.log('不需要重新连接，直接返回已有连接');
            // return
        }
        
        // 重置重连计数器
        this.reconnectAttempts = 0;
        this.currentUserId = userId;
        
        // Vite风格环境变量判断
        const isPro = import.meta.env.VITE_API_ENV === 'pro';
        console.log('当前环境变量env:', import.meta.env);
        // const wsUrl = isPro
        //     ? `wss://www.baiaidu.com:9822/eam/websocket/${userId}` // 生产环境用wss
        //     : `ws://localhost:9820/eam/websocket/${userId}`;      // 开发环境用ws
            const wsUrl = `wss://www.baiaidu.com:9822/eam/websocket/${userId}`; // 生产环境用wss
        console.log('WebSocket连接地址1:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('=== WebSocket 连接成功 2===');
            this.reconnectAttempts = 0;
            this.isConnected = true;
            this.lastPongTime = Date.now();
            
            // 启动心跳机制
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('收到WebSocket消息:', data);
                
                // 检查是否是pong响应
                if (data.type === 'pong' || data.msg === 'pong') {
                    this.handlePong();
                    return;
                }
                
                console.log('当前注册的消息处理器数量:', this.messageHandlers.size);
                this.notifyHandlers(data);
            } catch (error) {
                console.error('WebSocket消息解析错误:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket连接关闭');
            this.isConnected = false;
            this.stopHeartbeat();
            
            // 只有在未达到最大重连次数时才重连
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnect(userId);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket错误:', error);
            this.isConnected = false;
        };
    }

    // 启动心跳机制
    startHeartbeat() {
        console.log('启动心跳机制');
        this.stopHeartbeat(); // 先清除之前的定时器
        
        // 使用递归的setTimeout而不是setInterval，这样可以实现随机间隔
        this.scheduleNextHeartbeat();
    }

    // 安排下一次心跳
    scheduleNextHeartbeat() {
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const interval = this.getRandomHeartbeatInterval();
        console.log(`安排下一次心跳，间隔: ${interval}ms (${interval/1000}秒)`);
        
        this.heartbeatTimer = setTimeout(() => {
            if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
                console.log('发送心跳ping');
                this.sendPing();
                
                // 设置pong超时检查
                this.pongTimer = setTimeout(() => {
                    console.log('心跳超时，未收到pong响应，断开连接');
                    this.handleHeartbeatTimeout();
                }, this.heartbeatTimeout);
                
                // 安排下一次心跳
                this.scheduleNextHeartbeat();
            }
        }, interval);
    }

    // 停止心跳机制
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearTimeout(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.pongTimer) {
            clearTimeout(this.pongTimer);
            this.pongTimer = null;
        }
        console.log('停止心跳机制');
    }

    // 发送ping心跳
    sendPing() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send("ping");
            console.log('发送ping心跳:', "ping");
        }
    }

    // 处理pong响应
    handlePong() {
        console.log('收到pong响应');
        this.lastPongTime = Date.now();
        
        // 清除pong超时定时器
        if (this.pongTimer) {
            clearTimeout(this.pongTimer);
            this.pongTimer = null;
        }
    }

    // 处理心跳超时
    handleHeartbeatTimeout() {
        console.log('心跳超时，强制断开连接');
        this.isConnected = false;
        
        if (this.ws) {
            this.ws.close();
        }
        
        // 触发重连
        if (this.currentUserId && this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log('心跳超时后触发重连');
            this.reconnect(this.currentUserId);
        }
    }

    // 重连机制
    reconnect(userId) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('达到最大重连次数');
            return;
        }

        this.reconnectAttempts++;
        console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        // 停止心跳
        this.stopHeartbeat();
        
        setTimeout(() => {
            this.connect(userId);
        }, this.reconnectInterval);
    }

    // 添加消息处理器
    addMessageHandler(handler) {
        console.log('添加新的消息处理器');
        this.messageHandlers.add(handler);
        console.log('当前消息处理器数量:', this.messageHandlers.size);
    }

    // 移除消息处理器
    removeMessageHandler(handler) {
        console.log('移除消息处理器');
        this.messageHandlers.delete(handler);
        console.log('当前消息处理器数量:', this.messageHandlers.size);
    }

    // 通知所有消息处理器
    notifyHandlers(data) {
        console.log('开始通知所有消息处理器');
        this.messageHandlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error('消息处理器错误:', error);
            }
        });
        console.log('消息处理器通知完成');
    }

    // 发送消息
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('WebSocket未连接，无法发送消息');
        }
    }

    // 关闭连接
    disconnect() {
        console.log('=== WebSocket disconnect 开始 ===');
        console.log('当前 WebSocket 状态:', this.ws ? this.ws.readyState : 'null');
        console.log('当前重连次数:', this.reconnectAttempts);
        console.log('当前消息处理器数量:', this.messageHandlers.size);
        
        // 停止心跳
        this.stopHeartbeat();
        
        // 清除重连机制
        this.reconnectAttempts = this.maxReconnectAttempts + 1; // 防止重连
        console.log('已设置重连次数为:', this.reconnectAttempts);
        
        // 注意：不在这里清除消息处理器，因为重连时需要保持处理器
        // this.messageHandlers.clear(); // 移除这行
        console.log('保持消息处理器，当前数量:', this.messageHandlers.size);
        
        // 关闭 WebSocket 连接
        if (this.ws) {
            console.log('开始关闭 WebSocket 连接');
            // 移除所有事件监听器
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onclose = null;
            this.ws.onerror = null;
            console.log('已移除所有事件监听器');
            
            // 关闭连接
            this.ws.close();
            this.ws = null;
            console.log('WebSocket 连接已关闭并设置为 null');
        } else {
            console.log('WebSocket 连接已经是 null');
        }
        
        this.isConnected = false;
        this.currentUserId = null;
        
        console.log('=== WebSocket disconnect 完成 ===');
    }

    // 完全清理（用于组件卸载时）
    cleanup() {
        console.log('=== WebSocket cleanup 开始 ===');
        
        // 停止心跳
        this.stopHeartbeat();
        
        // 清除重连机制
        this.reconnectAttempts = this.maxReconnectAttempts + 1;
        
        // 清除所有消息处理器
        this.messageHandlers.clear();
        console.log('已清除所有消息处理器，当前数量:', this.messageHandlers.size);
        
        // 关闭 WebSocket 连接
        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onclose = null;
            this.ws.onerror = null;
            this.ws.close();
            this.ws = null;
        }
        
        this.isConnected = false;
        this.currentUserId = null;
        
        console.log('=== WebSocket cleanup 完成 ===');
    }

    // 获取连接状态
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            readyState: this.ws ? this.ws.readyState : null,
            reconnectAttempts: this.reconnectAttempts,
            lastPongTime: this.lastPongTime
        };
    }
}

// 创建单例实例
const webSocketService = new WebSocketService();

export default webSocketService;
