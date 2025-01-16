---
title: '解决 Canvas 双击后拖拽失效问题'
description:
   '开发仿excalidraw Web应用时，遇双击页面后拖拽失效问题。双击后拖拽功能不可用，鼠标指针变copy样式，mousemove事件监听器不触发。经分析，非焦点转移所致。实际是双击触发浏览器默认行为（如文本选择、窗口最大化）干扰事件传播，dragstart事件在双击后可能误触发致拖拽异常。解决办法：在文档添加dragstart事件监听器，调用event.preventDefault()阻止默认拖拽行为，问题解决 。'
pubDate: 'Sep 05 2024'
heroImage: '/src/images/hero/hero-solve-canvas-drag-failure-problem.png'
---

## 问题描述

最近在开发一个仿 `excalidraw` Web 应用的时候遇到了一个小 bug：

1.  当我双击页面任意一处地方后，拖拽随即失效；
2.  每当拖拽时鼠标指针会变为 `copy` 样式（此时我的 `body` 元素的 `cursor` 属性为 `default`）；
3.  对 `window` 添加的 `mousemove` 监听器在拖拽进行期间也不再随着移动触发。

## 解决

### 焦点转移

当你双击某个元素时，浏览器可能将焦点（focus）转移到了该元素，从而停止在 `canvas` 上监听 `mousemove` 事件。

However，并不是这个原因。

###  事件捕获

在某些情况下，双击事件可能会触发浏览器的默认行为，如文本选择、窗口最大化等。这可能会干扰事件的正常传播。

由于拖动开始对应的是 `dragstart` 事件，所以在双击后拖动可能将会触发浏览器的 `dragstart` 事件，因此必须阻止 `dragstart` 事件：

```javascript
document.addEventListener('dragstart', (event) => {
    event.preventDefault(); // 阻止拖拽行为
});
```

运行，问题解决。

