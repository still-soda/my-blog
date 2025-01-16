---
title: '《Vue.js设计与实现》学习笔记 | 框架设计的核心要素'
description:
   '书中在本章主要讲了应当如何使用特定方法来在生产环境中给开发者带去优质的开发体验。以及如何使用
   `rollup.js`
   等打包工具缩减构建体积，删除生产环境下不必要的代码。然后分多钟情况讲解了在不同的需求下需要输出哪些不同的构建产物。最后讲解了如何在框架中加入不错的错误处理。'
pubDate: 'Jul 13 2024'
heroImage: '/hero/hero-vue-core-elements-of-framework-design.png'
---

## 框架如何提升用户的开发体验

> 衡量一个框架是否足够优秀的指标之一就是看它的开发体验如何

### 合理输出警示信息

书中举了 Vue.js 3 的一个例子，当我们创建一个 Vue 应用并试图将其挂载在一个并不存
在的节点时：

```javascript
createApp(App).mount('#not-exist-el'); // 此处Id为'not-exist-el'的元素不存在
```

我们会在浏览器控制台收到这样一条警告：

```text
[Vue warn]: Fail to mount app: mount target selector "#not-exist-el" return null.
```

这条信息是框架告诉开发者的，可以帮助开发者快速了解发生的问题。

很多时候，框架还需要打印调用栈来帮助开发者快速定位问题发生的位置。为了实现这个目
的，作为框架开发者的你可以选择提供一个打印警告信息的方法，这个方法不仅能够打印警
告信息，还能够自动获取当前调用栈，并对其进行输出。

在 Vue.js 的源码中大量使用了一个名为 `warn` 的方法，这个方法就能够达到上述效果。

### 使用更加友好的格式打印数据

当开发者想要打印 `Ref` 类型的数据时，他们会得到一个完整的对象，类似于：

```shell
> RefImpl { _rawValue: 0, _shallow: false, __V_isRef: true, _value: 0 }
```

对于只想知道 `_rawValue` 是多少的开发者来说，这并不是特别的友好。那么此时我们可
以通过编写自定义的 `formatter` 方法来指定输出格式。开发者只需要勾选浏览器开发者
控制台中的 `Console → Enable custom formatter` 选项即可获得更加友好的输出格式。

```shell
> Ref<0>
```

---

## 控制代码体积

上述提到的 `warn` 方法实际上仅仅只需要在开发的过程中使用，那么有没有什么办法可以
在打包后的生成版本中移除这个方法的调用，以此来减少生成文件的体积呢？🤔答案是肯定
的。

在 Vue.js 的源码中，每一个 `warn` 方法都会配合着 `\_\_DEV__` 这样一个布尔类型常
量使用，大概长这样：

```javascript
if (__DEV__ && !ok) {
   warn('ouput something...');
}
```

类似于 `\_\_DEV__` 的这种常量我们称为 **特性开关** 。它允许框架在不同的配置下呈
现出不同的行为，同时我们还能使用 `rollup.js` 等打包工具对代码进行 **摇树（Tree
Shaking）**。所谓摇树，就是将代码中永远不会使用到的或者不会产生任何副作用的方法
进行删除，从而达到减小包体积的操作。

例如在下述代码中：

```javascript
// 文件 utils.js
export function A() {
   console.log('A');
}

export function B() {
   console.log('B');
}

// 文件 input.js
import { A } from 'utils.js';

A();
```

如果我们对上述代码以 `input.js` 作为入口文件进行摇树，并输出到文件 `bundle.js`
中，那么在 `bundle.js` 中我们可以发现，方法 `B` 不见了。输出文件长这样：

```javascript
// 文件 bundle.js
function A() {
   console.log('A');
}

A();
```

然后你可能发现，`A` 的调用好像也没什么意义，但是 `rollup.js` 并不会删除 `A`。这
是因为 `rollup.js` 并不确定该方法的调用会不会产生“副作用”。

**所谓副作用，就是 `A` 的调用有可能会导致全局变量等外界因素发生改变**，此时删除
`A` 是对程序有影响的。

如果已经确定该方法的调用不会产生副作用，那么可以使用 `\\\*#\_\_PURE__*\\` 对其进
行标记，告诉 `rollup.js` 这东西的调用不会产生副作用，删掉也没毛病。此时再进行构
建，就会发现它的内容是空的。

然后我们再回到特性开关这一问题上。对于刚刚提到的代码：

```javascript
if (__DEV__ && !ok) {
   warn('ouput something...');
}
```

如果 `\_\_DEV__` 常量为 `false` 的话，那么这个条件语句就是所谓的`dead code`——永
远都不会被执行，因此在摇树时这部分就会被删掉。Vue.js 3 就是通过控制诸如
`\_\_DEV__` 的这种特性开关来实现开发期间和构建期间的不同行为，以及打包时自动删除
多余代码的操作。

---

## 框架应该输出什么样的产物

> 不同类型的产物一定有对应的需求背景

要讨论应该输出什么样的产物，我们需要从需求讲起。

### 可以直接由 \<script> 标签引入并使用的

你或许想要通过这种方式将资源引入到开发者的程序中：

```html
<script src="./path/to/resource.js"></script>
```

为了实现这个目的，我们首先要知道一种名为 **IIFE** 格式的资源。**IIFE 全称
Immediately Invoked Function Expression（立即调用表达式）**。这个在 Javascript
中主要用于进行闭包操作，将变量等资源锁定在函数作用域内并导出。它主要长这样：

```javascript
// 文件 ./path/to/resource.js
const Res = ((exports) => {
   exports.a = 12;
   // ...
   return exports;
})({});
```

**实际上就是把一个匿名函数的定义的调用写在一起了。**

IIFE 有个特点，就是当对应代码块被读取的时候，它会立即被调用，从而达到引入全局资
源的效果。一部分通过 CDN 引入的资源文件也使用了这种格式，这也就是为什么你只需要
引入 CDN 的链接，资源就会自动加载到程序中。

```javascript
// 开发者的程序中
const { a } = Res;

console.log(a); // 输出 12
```

在 `rollup.js` 中，我们可以通过配置 `output.format = 'iife'` 来将构建结果转化为
IIFE 格式的文件。

### 作为ESM引入

```html
<script type="module" src="/path/to/resource.esm-browser.js"></script>
```

现在很多浏览器对 `ESM` 格式的资源支持都不错，因此我们也可以直接让开发者引入
`ESM` 格式的资源，只需要在 `rollup.js` 中配置 `output.format = 'esm'` 即可。

### 多端引入

你可能注意到了 `/path/to/resource.esm-browser.js` 中的 `-browser` 字样，同样的还
有 `-bundle` 字样，这两个后缀分别用于浏览器端和服务端。其中后者主要是为了实现
SSR（即 Server-Side Render 服务端渲染）的需求。它们的主要差异是特性开关的不同，
在 `-browser` 中，主要采用诸如 `\_\_DEV__` 作为特性开关；而在 `-bundle` 中，则主
要采用了诸如 `process.env.NODE_ENV` 作为特性开关。

在 `Node.js` 中我们会使用 `require` 方法来引入资源，这就要求我们的资源是 `cjs`
格式的，我们可以通过配置 `rollup.js` 中的 `ouput.format = 'cjs'` 来实现。

---

## 错误处理

> 框架错误处理机制的好坏直接决定了用户应用程序的健壮性

书中介绍道：为了帮助用户减少编写异常处理代码的功夫，可以提供 `callWithHandling`
方法，允许在发生错误的时候抛出异常；也可以提供 `registerErrorHandler` 的方法，允
许用户注册异常处理方法，以实现自定义异常处理。

```javascript
{
   let handleError = (e) => {};

   function callWithHandling(fn) {
      try {
         fn && fn();
      } catch (e) {
         handleError(e);
      }
   }

   function registerErrorHandler(handler) {
      handleError = handler;
   }
}
```

## 良好的TypeScript支持

虽然你可能不用 TS，但是你必须满足开发者使用 TS 的需求，因此在框架中加入良好的
TypeScript 支持也是非常重要的。但是这一步往往比想的要困难。

---

## 总结

本章主要讲了应当如何使用特定方法来在生产环境中给开发者带去优质的开发体验，如合
理、友好地输出各种信息。以及如何使用 `rollup.js` 等打包工具缩减构建体积，删除生
产环境下不必要的代码。

然后分多钟情况讲解了在不同的需求下需要输出哪些不同的构建产物。

最后再讲解了如何在框架中加入不错的错误处理，以及加入TS支持的需求。
