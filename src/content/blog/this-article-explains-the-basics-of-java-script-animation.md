---
title: '一文讲清 JavaScript 动画基础'
description: '本文介绍了前端动画的实现原理和方法，包括关键帧、插值、渲染循环等基本概念，并展示了如何使用JavaScript实现简单的插值动画和更复杂的物理动画。文章还探讨了缓动函数的作用，并提供了一个实用的在线资源，帮助开发者选择和实现各种缓动效果。'
pubDate: 'Nov 24 2024'
heroImage: '/src/images/hero/hero-this-article-explains-the-basics-of-java-script-animation.png'
---

## 前言

前端开发中，动画效果往往是点睛之笔。无论是元素的酷炫移动还是渐变效果，都能让页面变得更生动。简单的动画用 CSS 就能搞定，比如 `animation` + `@keyframes` 或者 `transition`。然而，当需要更复杂、更灵活的动画时，CSS 就显得力不从心了。这时，我们需要借助 JavaScript 动画。

## 原理

在 JavaScript 中，有两种常见方式来实现动画：

-  直接操作 DOM 元素（适合简单动画）
-  使用 canvas（更灵活，适合复杂效果）

今天我们将重点介绍动画的核心原理。🎨

### 帧（Frame）

动画是什么？其实就是一堆“帧”快速切换的结果，每一帧都是一个静态画面。

就像翻动连环画一样，切换得够快，静态画面也能动起来。

![翻页动画](/images/this-article-explains-the-basics-of-java-script-animation/img-1.png)

### 关键帧（Keyframe）

在动画中，我们可以通过关键帧来定义动画的开始和结束状态。在 CSS3 中，我们可以使用 `@keyframes` 来定义关键帧。

关键帧其实是对动画的一种简化方法。它只需要我们定义动画的 **起点（start）** 和 **终点（end）** ，至于中间过程，可以通过 **插值（lerp）** 来计算完成。

如果动画是一次长途旅行，那么关键帧就是你的起点和目的地，至于中间怎么开车，就靠 **插值(lerp)** 来实现了。

![关键帧和过渡帧](/images/this-article-explains-the-basics-of-java-script-animation/img-2.png)

插值听着高大上，其实就是算算中间值而已。

实现插值，我们主要关心以下几个参数：

-  开始值（start）
-  结束值（end）
-  当前动画进行百分比（p）

我们可以用以下公式计算插值：

$$
\text{value} = \text{start} + (\text{end} - \text{start}) \times p
$$

说人话：假如你想把一个物体从 0 移动到 100，持续 1 秒钟（也就是 1000 毫秒）。在第 500 毫秒时，物体的位置应该是 50。

用 JavaScript 实现插值公式，可以这样写：

```javascript
function lerp(start, end, p) {
   return start + (end - start) * p;
}

lerp(0, 100, 500 / 1000); // 会返回 50
```

**一般来说插值的次数越多，动画的效果就会越平滑。**

如果我们对一对持续1s的关键帧之间进行60次插值，那么我们就可以得到一个每秒60帧的动画。

需要注意的是插值次数过多也会导致动画的性能下降，所以我们需要在平滑和性能之间做一个权衡。

### 渲染循环（Render Loop）

动画需要一直更新画面，不能一动不动，所以我们需要一个循环来不断地更新画面。这个循环就是**渲染循环**（也叫做动画循环）。如果你使用的是 `canvas`，这个渲染循环的执行频率通常等于动画的刷新率。这意味着渲染循环会被重复且频繁地执行。

在 JavaScript 中，可以使用 `requestAnimationFrame` 来实现渲染循环。它会让浏览器根据显示器刷新率调用指定函数（通常每秒 60 次）。

```javascript
function renderLoop() {
   // 进行画面的更新
   console.log('新的一帧');

   // 调度下一帧
   requestAnimationFrame(renderLoop);
}

// 开始渲染循环
requestAnimationFrame(renderLoop);
```

**为什么无限递归不会炸掉？**

使用 `requestAnimationFrame` 进行递归并不像传统的函数递归。传统的递归如果无限制地调用自身，会导致栈溢出。而 `requestAnimationFrame` 的执行机制则有所不同。

普通递归会在每次调用时占用栈空间，每一层调用都需要等待子调用完成后返回。由于调用层级数可能迅速增加（特别是没有合适的递归终止条件时），最终导致栈溢出错误（stack overflow）。

`requestAnimationFrame` 的递归调用实际上是通过事件循环实现的，每次调用不是立即发生，而是等待浏览器准备好下一帧时再调用。这意味着调用之间没有直接的递归栈依赖。

`requestAnimationFrame` 会把指定的回调函数放到浏览器的任务队列中，等当前执行栈清空后，由浏览器根据刷新率调度回调函数。每一次 `requestAnimationFrame` 调用，实际上是独立的调度过程，并不会导致调用栈持续增长。

**简单说：浏览器会在准备好新的一帧时才调用，不会堆积成山，也不会导致内存溢出。**

在渲染循环中我们需要做以下几件事情：

1. 计算当前时间
2. 计算动画的进度
3. 根据进度计算出当前帧的画面
4. 渲染画面 _(only canvas)_

## 插值动画：方便快捷

插值动画的核心上面已经有所介绍，下面让我们进行一次简单的实践。

### 案例：让小球动起来 ⚽

有一个小球，它会在 $1000ms$ 的时间内从 $x=0$ 的位置移动到 $x=100$ 的位置。

我们可以使用以下代码来实现这个动画：

**HTML**

```html
<html lang="en">
   <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>小球运动</title>
   </head>
   <body>
      <div id="ball"></div>
   </body>
   <style>
      #ball {
         width: 50px;
         height: 50px;
         background-color: red;
         border-radius: 50%;
         position: absolute;
      }
   </style>
</html>
```

**JavaScript**

```javascript
const ball = document.getElementById('ball'); // 获取小球元素
const startTime = Date.now(); // 动画开始时间
const duration = 1000; // 动画总时长：1000ms
const startX = 0; // 开始位置
const endX = 100; // 结束位置

// 渲染循环
function renderLoop() {
   // 计算当前时间
   const currentTime = Date.now();
   // 计算动画进度
   const progress = (currentTime - startTime) / duration;

   // 计算小球的位置
   const x = startX + (endX - startX) * progress;

   // 更新小球的位置
   ball.style.left = x + 'px';

   // 如果动画未结束（进度小于100%），继续渲染
   if (progress < 1) {
      requestAnimationFrame(renderLoop);
   }
}

// 开始渲染循环
requestAnimationFrame(renderLoop);
```

运行起来，红色小球就会优雅地移动到指定位置啦！🎉

效果如下：

![移动小球动画](/images/this-article-explains-the-basics-of-java-script-animation/img-3.gif)

## 物理动画：更加灵活的模式

到目前为止，你可能依旧疑惑，为什么要使用 JavaScript 来实现动画效果？这些效果在 CSS3 中都可以实现啊。而且使用 CSS3 来实现动画效果更加简单，不需要关心动画的细节。

确实，在实际开发中，如果遇到简单的动画效果，我们更推荐使用 CSS3 来实现。但是当我们遇到一些复杂的动画效果，比如模拟一个小球的物理运动轨迹时，CSS 动画就显得力不从心了。

### 案例：更真实的物理动画

现在我想要模拟一个弹性小球的运动效果，如果要求其符合物理规律，那么这个效果就无法使用 CSS3 来实现。因为CSS中即使没有条件语句，也没有循环语句，连计算都十分困难，只能写一些“死动画”，不具备任何可以模拟物理运动的条件。

现在我们就来实现一个小球**自由落体和弹跳运动**的动画，完成效果如下：

![自由落体小球动画](/images/this-article-explains-the-basics-of-java-script-animation/img-4.gif)

首先，我们要创建一个长和宽都为 $20px$ 的橙色小球，以及左右方的墙和下方的地板：

```html
<div id="ball" style="width: 20px; height: 20px; background: orange;"></div>
<div id="wall-b" style="..."></div>
<div id="wall-l" style="..."></div>
<div id="wall-r" style="..."></div>
```

然后我们直接进入 JavaScript 编写环节。

我们首先获取这个小球：

```javascript
const ball = document.querySelector('#ball');
```

定义一些全局常量，比如重力加速度 $g$ ：

```javascript
const g = 9800; // 重力加速度为 9800px/ms^2
const bounceLoss = { x: 0.1, y: 0.1 }; // 速度的碰撞损失率，0的话就是完全弹性碰撞
const ballSize = { x: 20, y: 20 }; // 小球的尺寸
const containerSize = { width: 200, height: 200 }; // 内部空间的尺寸，此处为 200 x 200
const startPos = { x: 0, y: 0 }; // 小球的起始坐标
const startV = { x: 200, y: 0 }; // 小球的起始速度
```

再定义一些渲染更新中需要的变量：

```javascript
const v = { x: 0, y: 0 }; // 小球当前的速度
const pos = { x: 0, y: 0 }; // 小球当前的坐标
let lastTime = Date.now(); // 上次更新的时间，用来计算时间差，初始值为动画开始时间
```

然后编写一个初始化函数 `init()`：

```javascript
function init() {
   // 设置小球显示坐标
   ball.style.transform = `translate(${startPos.x}px, ${startPos.y}px)`;

   // 初始化当前坐标
   pos.x = startPos.x;
   pos.y = startPos.y;

   // 初始化当前速度
   v.x = startV.x;
   v.y = startV.y;
}
```

再编写最重要的一个函数 —— 更新函数 `update()`，即渲染循环：

```javascript
function update() {
   // 获取当前时间 currentTime，然后计算与上一次更新之间的时间差 deltaTime
   const currentTime = Date.now();
   const deltaTime = currentTime - lastTime;

   // 更新上次更新时间
   lastTime = currentTime;

   // 正交分解，更新 y 轴坐标
   v.y += (g * deltaTime) / 1000;
   pos.y += (v.y * deltaTime) / 1000;

   // 如果碰到地板了就把 y 轴速度方向反转，并乘以损失率
   if (pos.y + ballSize.height > containerSize.height) {
      // 这一步将小球复位到容器内，防止超出容器
      pos.y = containerSize.height - ballSize.height;
      v.y = -v.y * (1 - bounceLoss.y);
   }

   // 更新 x 轴坐标
   pos.x += (v.x * deltaTime) / 1000;

   // 如果碰到了墙壁就把 x 轴速度方向反转，并乘以损失率
   if (pos.x + ballSize.width > containerSize.width) {
      // 这一步将小球复位到容器内，防止超出容器
      pos.x = containerSize.width - ballSize.width;
      v.x = -v.x * (1 - bounceLoss.x);
   } else if (pos.x < 0) {
      // 这一步将小球复位到容器内，防止超出容器
      pos.x = 0;
      v.x = -v.x * (1 - bounceLoss.x);
   }

   // 设置小球显示坐标
   ball.style.transform = `translate(${pos.x}px, ${pos.y}px)`;

   // 开启下次渲染
   requestAnimationFrame(update);
}
```

最后我们再执行`init()` 函数和 `update()` 函数，就大功告成啦：

```javascript
init();
requestAnimationFrame(update);
```

## 插值动画的缓动函数

在上文我们提到了插值动画是基于时间进行插值得到过渡帧的动画技术。

这也就意味着物体的运动轨迹受到时间的绝对控制：**如果时间是线性流逝的，那么动画也会线性进行。**

线性进行的动画往往给人一种僵硬、古板的感觉，因此大多数情况下我们会对其赋予一个缓动函数。

![线性时间函数](/images/this-article-explains-the-basics-of-java-script-animation/img-5.png)

缓动函数可以被描述成一个 $real~time-mapping~time$ 的函数，即输入的值为真实的时间，输出的值为映射后的时间。时间一经缓动函数后就会被扭曲，从而实现我们想要的效果。

在CSS中，我们可以在 `animation-timing-function` 属性中指定动画的时间流逝曲线。

```css
/* 线性时间函数 */
animation-timing-function: linear;
```

用 JavaSCript 实现的话就是这样的：

```javascript
function linear(t) {
   return t;
}
```

如果你理解了缓动函数，你就能轻易地构造出你想要的运动效果：

假设我现在想要构建一个刚开始慢，然后越来越来越快的缓动函数，首先开动脑筋想一下：哪些函数的图像是斜率越来越大的？

很容易能联想到一个函数：$y=x^2$。它的函数图像是这样的：

![y=x^2的函数图像](/images/this-article-explains-the-basics-of-java-script-animation/img-6.png)

显然这就是我们想要的。先用 JavaScript 实现它：

```javascript
function power(t) {
   return t ** 2;
}
```

随后将它与 `lerp` 函数合并，包装成一个先慢后快的插值函数 `powerLerp`：

```javascript
function powerLerp(start, end, p) {
   // 这里用 power() 包裹 p 值
   return lerp(start, end, power(p));
}

powerLerp(0, 100, 0 / 1000); // 返回 0
powerLerp(0, 100, 500 / 1000); // 返回 25
powerLerp(0, 100, 1000 / 1000); // 返回 100
```

可以看到插值再也不是线性的了，而是变成了缓动函数的形状。这就是我们期望的样子。

这个缓动函数的动画效果如下：

![y=x^2缓动函数动画](/images/this-article-explains-the-basics-of-java-script-animation/img-7.gif)

如果你想了解更多缓动函数，或者不想自己写而是拿来即用，那么你可以看看
[这个网站](https://easings.net/zh-cn#)，非常有用。