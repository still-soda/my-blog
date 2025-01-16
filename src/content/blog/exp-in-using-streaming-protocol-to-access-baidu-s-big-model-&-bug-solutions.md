---
title: '用流式传输协议接入百度大模型的心得以及一些相关 bug 的解决方案'
description:
   '用流式传输协议接入百度大模型的心得以及一些相关 bug 的解决方案'
pubDate: 'Aug 19 2024'
heroImage: '/src/images/hero/hero-exp-in-using-streaming-protocol-to-access-baidu-s-big-model-&-bug-solutions.png'
---

## 前言

近日开发了一个基于AI的虚假数据生成工具：[still-soda/ai-mock-generator-react-web： 一个用于生成测试用虚假数据的工具](https://github.com/still-soda/ai-mock-generator-react-web)。

项目地址是：[汽水工具箱 | 智能 mock 生成 ](https://toolkit.still-soda.top/usage)

然后有使用者提出了反馈：生成速度太慢了。

这个慢固然是改变不了了，因为AI的生成速度就摆在那了，但是使用流式传输可以缓解等待过程中的焦虑，于是花了几个小时把原有的生成逻辑改成了应用流式传输的模式。

## 接入流式传输

大模型的接口都有提供流式传输的模式，首先通过 `fetch` 获取 `reader`，然后不断读取并用 `TextDecoder` 将数据转成文本，直到 `done === true` 即可。

```javascript
async function getData() {
    const res = await fetch(url, {/* ... */});	// 请求流式传输
    const reader = res.body.getReader();		// 获取读头
    const decoder = new TextDecoder('utf-8');	// 创建解码器
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) 
            return;
        const str = decoder.decode(value);
        // 处理获取的文本
    }
}
```

## 一些 bug

### 用Nginx做服务器并配置转发，流式传输失效

原因是 Nginx 在转发服务中会先缓存请求的响应，然后在请求结束后再一起发给客户端，这就导致流式传输完全失效。

解决方法就是在 Nginx 相关的转发配置下禁用缓存：

```nginx
location /api/
{
    proxy_pass http://localhost:4817/; # 转发服务
    
    proxy_buffering off;  // 禁用缓冲
    proxy_cache off;  // 禁用缓存（如果启用了缓存）   
}
```

### 明明后端服务器已经启动，但是在访问接口的时候响应 “Cannot POST /api/token”

原因是我在 Nginx 配置转发服务的时候 `proxy_pass` 最后没有加上 `/`：

```nginx
proxy_pass http://localhost:4817;  	// 错误的
proxy_pass http://localhost:4817/; 	// 正确的
```

也有可能是因为服务并没有启动 ......