---
title: '《Vue.js设计与实现》学习笔记 | Vue.js 3 的设计思路'
description:
   '本章主要讲解了 Vue.js 3 如何通过声明式描述 U。然后讲解了如何使用 JavaScript
   对象描述虚拟 DOM，使代码更加灵活，以及如何使用 `h`
   函数。最后讲解了渲染器的作用。'
pubDate: 'Jul 14 2024'
heroImage: '/src/images/hero/hero-vue-design-ideas.png'
---

## 声明式地描述UI

> Vue.js 3 是一个声明式的 UI 框架，意思是说用户在使用 Vue.js 3 开发页面时是声明
> 式地描述 UI 的。

我们知道在编写前端页面的时候主要涉及 4 点内容，它们包含：**DOM元素、元素属性、事
件（如 `click`、`keydown`）和元素的层级结构（DOM 树的结构）。**

### 使用模板语法

为了实现声明式的特性， Vue.js 创造了一套名为 **模板（template）** 的语法，其长相
酷似 HTML，但是又在 HTML 的基础上定义了一些特别的描述性语法。例如：

-  使用 `:` 或 `v-bind` 来描述 **动态** 绑定的属性；
-  使用 `@` 或 `v-on` 来描述事件；

### 使用 JS 对象

在 Vue.js 中，除了可以使用模板语法对 UI 进行描述，我们也可以使用 JavaScript 对象
对 UI 进行描述：

```javascript
const title = {
   // 标签名字
   tag: 'h1',
   // 标签属性
   props: {
      onClick: handler,
   },
   // 标签的子元素
   children: [{ tag: 'span' }],
};
```

**而这种对象，其实就是虚拟DOM。** 它们等同于以下的模板语法：

```html
<h1 @click="handler">
   <span></span>
</h1>
```

这两者的优势也显而易见，**前者更加灵活，后者更加直观**。书中举了个很好的例子，假
设我们要根据一个名为 `level `数字变量动态渲染 `h1` ~ `h6` 标签，如果我们使用模板
语法进行编写，代码是长这样的：

```html
<h1 v-if="level === 1"></h1>
<h2 v-else-if="level === 2"></h2>
<h3 v-else-if="level === 3"></h3>
<h4 v-else-if="level === 4"></h4>
<h5 v-else-if="level === 5"></h5>
<h6 v-else-if="level === 6"></h6>
```

这看起来非常繁琐！如果此时我们用 JavaScript 对象的形式进行编写，那么就会显得非常
简单：

```javascript
let level = 6; // 1 ~ 6

const title = {
   tag: `h${level}`, // 将 'h' 和 level 拼接就是标签名啦
};
```

实际上，模板语法只是帮助开发者描述 UI 的工具而已，其类似于 JSX，并不等同于
HTML。**所有模板在运行前都会被编译器编译成 JS 代码，并在运行时交由渲染器渲染为真
实 DOM。**

### 使用 h 函数

我们都知道， Vue.js 中有个名为 `h` 的函数，大多数人第一次见到这个函数的时候可能
都会感到迷惑，不知道它是干啥的 —— 其实这个函数是为了帮助我们更加方便地创造虚拟
DOM 而存在的。

譬如对于这段代码：

```javascript
const title = {
   tag: 'h1',
   props: {
      onClick: handler,
   },
   children: '这是标题文本',
};
```

而 `h` 函数的返回值就是这样的对象。如果我们借助 `h` 函数进行改写，代码是长这样
的：

```javascript
const title = h('h1', { onClick: handler }, '这是标题文本');
```

差别显而易见，这个函数帮助开发者**省去了书写属性名的功夫**，让手写虚拟 DOM 变得
更加简单。

在 Vue.js 组件中，我们可以在渲染函数中编写虚拟 DOM：

```javascript
import { h } from 'vue';

export default {
   render() {
      return h('h1', {}, 'Hello world!');
   },
};
```

那么这个组件的渲染内容就通过渲染函数描述出来了，而且并不需要借助模板语法。

---

## 初识渲染器

> 渲染器的作用就是把虚拟 DOM 渲染为真实 DOM

![image-20240713233026279](https://cos1-1322468699.cos.ap-guangzhou.myqcloud.com/img/202407140052541.png)

假设我们有如下虚拟 DOM：

```javascript
const vnode = {
   tag: 'div',
   props: {
      onClick: handler,
   },
   children: [{ tag: 'span', children: 'hello world' }],
};
```

我们应该如何把它渲染为真实 DOM 呢？**要实现自动渲染，我们要借助一个名为
`renderer` 的渲染函数来实现。**`renderer` 函数接收两个参数，第一个参数为一个虚拟
DOM 对象，第二个参数为渲染结果要挂载的目标 DOM。

这里假设我们要将上述虚拟 DOM 渲染并挂载在 `document.body` 节点下：

```javascript
renderer(vnode, document.body);
```

### 实现简单的渲染器函数

⭐接下来实现一个最简单 `renderer` 函数：

```javascript
/**
 * @param vnode 虚拟DOM
 * @param container 挂载点
 */
function renderer(vnode, container) {
   // 创建vnode的tag标签对应的元素，此处为div
   const el = document.createElement(vnode.tag);
   // 遍历vnode的props属性，将每个属性和事件都添加到元素中
   for (const attr in vnode.props) {
      // 以on开头的是事件
      // 可以把头两个字母去掉，转化为小写，并添加对应的监听器
      if (attr.startsWith('on')) {
         el.addEvenListener(attr.subStr(2).toLowerCase(), vnode.props[attr]);
         continue;
      }
      // 其他的就是普通属性
      el[attr] = vnode.props[attr];
   }
   // 处理children
   if (typeof vnode.children === 'string') {
      // 如果children是字符串，那么创建文本节点
      el.appendChild(document.createTextNode(vnode.children));
   } else if (Array.isArray(document.children)) {
      // 如果children是数组，那么遍历每个孩子并递归渲染
      vnode.children.forEach((child) => renderer(child, el));
   }
   // 将el挂载到container上
   container.appendChild(el);
}
```

上述关于渲染器的代码其实并不复杂。主要就是四个步骤：

1. 创建 `tag` 属性对应的节点
2. 循环创建事件监听，并对元素属性进行赋值
3. 利用递归分类处理子元素
4. 将创建的节点挂载到挂载点上

但是渲染器的精髓其实在于更新节点的阶段，如果我们对 `vnode` 做一些小小的修改，渲
染器需要精确地找到变更处并更新变更的内容。这里涉及到 Diff 算法的应用，书中的后续
章节将会重点讲解。

---

## 组件的本质

### 重要特性

如果你有学习过 React，那你一定对它的函数式组件印象深刻。在函数组件之前，React 使
用曾经提倡使用对象式组件。为什么这两种方式都能实现组件呢？因为它们都具备**闭包和
可复用**这两个重要特性。

Vue.js 中的组件本质上是对模板的复用，这就要求我们的组件**必须是能够被重复创建且
能够相互独立存在的**。我们在使用虚拟 DOM 形式编写组件的时候，会将 UI 编写在
`render` 方法中，那么每当这个方法被调用的时候，它就会产生一组虚拟 DOM，想要多少
组，你就调用多少次。这样就实现了组件的重复创建。并且由于函数的闭包特性，产生的每
组虚拟 DOM 之间都相互独立、互不相干，这样就实现了组件间的独立性。

我们都知道，虚拟 DOM 属于树形数据结构，因此一组虚拟 DOM 是可以挂载在另外一组虚拟
DOM 上的，那么组件就可以通过这种方式发挥作用。

### 如何在虚拟DOM中表示组件

在上述 `vnode` 的示例中，`tag` 属性都表示了对应元素的标签名。但是对于组件而言，
并没有一个明确的标签名，因此，我们可以选择使用该组件的 ` render` 函数来代替元素
的标签字符串。就像这样：

```javascript
const vnode = {
   // tag不再是字符串，而是一个返回虚拟DOM的函数
   tag: () => {
      return { tag: 'h1' };
   },
   props: { onClick: handler },
};
```

### 实现组件渲染函数

上面实现的 `renderer` 实际上是元素的渲染函数，为了实现组件的渲染函数，我们需要对
其进行重构：

```javascript
function renderer(vnode, container) {
   if (typeof vnode.tag === 'string') {
      // 字符串代表该虚拟DOM是一个元素
      mountElement(vnode, container);
   } else if (typeof vnode.tag === 'function') {
      // 函数代表该虚拟DOM是一个组件
      mountComponent(vnode, container);
   }
}
```

其中 `mountElement` 函数的实现与最开始实现的 `renderer` 函数是一样的，而接下来我
们将给出 `mountComponent` 函数的实现：

```javascript
function mountComponent(vnode, container) {
   // 因为vnode.tag是一个函数，所以直接调用它获得对于虚拟DOM即可
   const subtree = vnode.tag();
   // 递归调用renderer进行渲染
   renderer(subtree, container);
}
```

可以看到，非常简单。因为我们已经知道 `vnode.tag` 是一个返回虚拟 DOM 的函数，所以
我们直接调用它，获取返回的对象，然后继续使用 `renderer` 函数进行递归渲染即可。

我们也可以使用对象来创建组件，Vue.js 的有状态组件就是使用对象进行实现的。

### 模板的工作原理

上面已经提到，模板在编译阶段会被编译器编译为 JS 代码，然后再在运行阶段交由渲染器
渲染为真实 DOM。

对于下属 .vue 格式的代码：

```html
<template>
   <div @click="handler">Click me</div>
</template>

<script>
   export default {
      data() {
         /* ... */
      },
      methods: {
         handler: () => {
            /* ... */
         },
      },
   };
</script>
```

在编译阶段交由编译器编译后会产生以下代码：

```javascript
export default {
   data() {
      /* ... */
   },
   methods: {
      handler: () => {
         /* ... */
      },
   },
   // 多出来的内容
   render() {
      return h('div', { onClick: handler }, 'Click me');
   },
};
```

**很容易可以发现前后的差异：`<template>` 不见了，多出来了一个 `render` 函数，而
`render` 中的内容正是原先 `<template>` 中的内容经过编译后产生的虚拟 DOM 形式的代
码。**

我们可以用一张图来直观地了解这个过程：

![image-20240714004322279](https://cos1-1322468699.cos.ap-guangzhou.myqcloud.com/img/202407140052925.png)

---

## 总结

本章主要讲解了 Vue.js 3 如何通过声明式描述 UI，使开发者可以使用模板语法和
JavaScript 对象来定义 DOM 元素、属性和事件。

然后，讲解了如何使用 JavaScript 对象描述虚拟 DOM，使代码更加灵活，以及如何使用
`h` 函数简化虚拟 DOM 的创建，使手写虚拟 DOM 更加简便。

最后讲解了渲染器的作用，并指出模板在编译阶段被编译为 JavaScript 代码，在运行时由
渲染器渲染为真实 DOM。
