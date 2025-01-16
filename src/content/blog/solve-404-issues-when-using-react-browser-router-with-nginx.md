---
title: '解决 React BrowserRouter 配合 Nginx 使用出现的 404 问题'
description:
   '解决 React BrowserRouter 配合 Nginx 使用出现的 404 问题'
pubDate: 'Aug 18 2024'
heroImage: '/src/images/hero/hero-solving-text-wrap-problem.png'
---

## 问题描述

在 React 中使用 React BrowserRouter 的时候，在部署到生产环境后，如果访问 `www.xxx.com/example` 会报 404 错误。只能通过访问 `www.xxx.com` 后再进行页内导航访问到 `/example` 页面。

## 解决方案

找到项目对应的 Nginx 配置文件，加入以下配置：

```nginx
location / {
  try_files $uri /index.html;
}
```

保存配置文件，问题解决。