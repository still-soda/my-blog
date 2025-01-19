---
title: '类比 Vue3 学习 Svelte'
description: '我对 Svelte 这个前端框架早有耳闻，但是之前一直没有上手学习过它。这篇文章我将通过类比 Vue 介绍 Svelte 的基本语法和 API。'
pubDate: 'Jan 19 2025'
heroImage: '/src/images/hero/hero-learn-svelte-from-vue.png'
---

## 前言

我对 Svelte 这个前端框架早有耳闻，但是之前一直没有上手学习过它。最近我花了点时间看了看官方文档，浅浅地了解了这个号称 “无虚拟 DOM 且非常快速的框架”。接下来我通过将类比 Vue 来介绍 Svelte 的基础语法和功能。

## 组件的基本结构

在 Vue3 中，一个组件的基本结构如下所示：

```vue
<script lang="ts" setup>
  /* 这是脚本部分 */
</script>

<template>
  <p>这是模板部分</p>
</template>

<style scope>
  /* 这是样式部分 */
</style>
```

在 Svelte 中，组件的结构也差不多如此，只不过没有 `<template>`，而是更加接近原生 `.html` 文件：

```svelte
<script lang="ts">
  /* 这是脚本部分 */
</script>

<style>
  /* 这是样式部分 */
</style>

<p>这是模板部分</p>
```

组件的模板部分并不需要在类似于 `<template>` 之类的标签中定义。

Svelte 的样式是**默认隔离**的（跟 Vue 中的 style scope 类似），如果需要让样式影响子组件，则需要使用 `:global()` 选择器：

```svelte
<style>
  p :global(div) {
    /* 需要共享的样式 */
  }
</style>
```

## Svelte 语法

### 模板

Svelte 使用诸如 ` {#if condition}` 之类的**控制流语句**来实现条件渲染和列表渲染等特性，跟 Vue 的指令有一定的区别，只不过也并不算晦涩。

#### 文本插值

跟 Vue 中的 `{{}}` 类似，Svelte中通过 `{}` 来在模板中插入变量：

```svelte
<script>
  let count = 20;
</script>

<p>Count is {count}</p>
```

等同于 Vue 中的：

```vue
<script setup>
  let count = 20;
</script>

<template>
  <p>Count is {{count}}</p>
</template>
```

比较特别的是，Svelte 的文本插值也能用在属性中，例如：

```svelte
<script>
  const url = 'www.example.com';
</script>

<a src='https://{url}'>例子</a>
```

这里的 `src` 属性会被拼接为 `https://www.example.com` 。

#### 条件渲染

在 Vue 中，我们通过 `v-if` 、`v-else-if` 和 `v-else` 指令来实现条件渲染，而在 Svelte 中，则使用  `${#if}...{:else-if}...{:else}...{/if}` 来实现：

```svelte
<script>
  let count = 20;
</script>

{#if count < 10}
  <p>Count 小于 10</p>
{:else-if count === 10}
  <p>Count 等于 10</p>
{:else}
  <p>Count 大于 10</p>
{/if}
```

等同于 Vue 中的：

```vue
<script setup>
  let count = 20;
</script>

<template>
  <p v-if="count < 10">Count 小于 10</p>
  <p v-else-if="count === 10">Count 等于 10</p>
  <p v-else >Count 大于 10</p>
</template>
```

#### 列表渲染

在 Vue 中，我们使用 `v-for` 指令来实现列表渲染，而在 Svelte 中，可以使用 `{#each}...{/each}` 流程控制语句来实现：

```svelte
<script>
  const list = [1, 2, 3, 4];
</script>

{#each list as item, index (index)}
  <p>第 {index} 个元素的内容是 {item}</p>
{/each}
```

`{#each}` 语句的语法是 `{#each 列表 as 元素, 元素索引 (元素的 key)}`，这跟 Vue 中  `v-for="元素, 元素索引 in 列表"` 的语法有一定区别。

以上代码等同于 Vue 中的：

```vue
<script setup>
  const list = [1, 2, 3, 4];
</script>

<template>
    <p v-for="item, index in list" key="index">
        第 {{ index }} 个元素的内容是 {{ item }}
    </p>
</template>
```

#### 等待块

Svelte 的这个特性比较特别，在 Vue 中并没有完全与之功能相等的特性。`{#await}...{:then}...{:catch}...{/await}` 允许你去等待一个异步操作完成，并在等待、成功和失败的时候渲染不同的 DOM：

```svelte
<script>
  const promise = Promise.resolve(666);
</script>

{#await promise}
  <p>等待中...</p>
{:then number}
  <p>数字是：{number}</p>
{:catch error}
  <p>发生错误：{error}</p>
{/await}
```

可以看到 `promise` 中的数据是可以传递到 `:then` 块中的，而捕获到的错误又可以传递到 `:catch` 块中。

当然，如果不需要处理 **等待中** 的状态，也可以直接写成：

```svelte
<script>
  const promise = Promise.resolve(666);
</script>

{#await promise then number}
  <p>数字是：{number}</p>
{:catch error}
  <p>发生错误：{error}</p>
{/await}
```

在 Vue 中我们可以使用 `<Suspense>` 来实现类似的操作，但是不如这个方便，尤其是在处理异常的时候。

#### 可复用代码片段

Svelte 允许我们使用 `{#snippet fn(...args)}...{/snippet}` 定义一个可以被重复使用的代码片段，并允许我们使用 `{@render fn(...args)}` 来在任意位置渲染这段代码。其中 `fn()` 是这个代码片段的名字，而 `args` 则是代码片段渲染时可传入的参数：

```svelte
<script></script>

{#snippet man(name, age)}
  <p>名字：{name} ｜ 年龄：{age}</p>
{/#snippet}

<div>
  {@render man('mike', 20)}
  {@render man('john', 23)}
  {@render man('soda', 10)}
</div>
```

Svelte 用它来实现类似于 Vue 的插槽机制：通过在参数中传入代码片段，组件会将传入的代码片段渲染在指定的地方。

```svelte
<MyComponents slot1={man} />
```

组件的子组件将被自动收集为一个名为 `chilren` 的代码片段：

```svelte
//--- main.svelte.js ---//
<script>
  import Component from './Component.svelte.js';
</script>

<div>
  <Component>
    <div>我是 children 代码片段</div>
  </Component>
</div>

//--- Component.svelte.js ---//
<script>
  const { children } = $props();  // 从参数中获取children
</script>

<div>
  <!-- 渲染 children -->
  {@render children()}
</div>
```

#### 单向数据绑定

在 Vue 中，使用 `:prop="value"` 前缀来绑定数据，用 `@event="fn"` 前缀来绑定方法。而在 Svelte 中，使用 `prop={value}` 来绑定属性和组件的方法属性，使用 `onevent={fn}` 来绑定 DOM 操作：

```svelte
<script>
  import MyComponent from './MyCompoent.svelte.js';
  let value = 20;
</script>

<MyComponent 
  value={value} 
  onclick={() => alert('click')}
/>
```

以上代码同于 Vue 中的：

```vue
<script setup>
  import MyComponent from './MyCompoent.vue';
  let value = 20;
</script>

<template>	
  <MyComponent 
    :value="value"
    @click="() => alert('click')"
  />
</template>
```

如果变量名与属性名相同，也可以直接把 `value={value}` 简写为 `{value}`。

如果所有的数据都在一个对象内，且对象属性的名字与组件属性名字一一对应，则可以直接使用展开运算符 `...` 直接装入全部属性，这称为**事件传播**：

```svelte
<script>
  import MyComponent from './MyCompoent.svelte.js';
  const props = {
    value: 20,
    onclick: () => alert('click')
  };
</script>

<MyComponent {...props} />
```

#### 双向绑定

在 Vue 中，我们通过 `v-model="value"` 或 `v-model:target="value"` 来实现对数据的双向绑定，而在 Svelte 中，我们可以通过 `bind:target={value}` 来实现双向绑定：

```svelte
<script>
  let value = $state(0); // 创建一个响应式数据
</script>

<form>
  <input bind:value={value} placeholder="请输入..." /> 
</form>
```

这等同于 Vue 中的：

```vue
<script setup>
  const value = ref(0);
</script>

<template>	
  <form>
    <input v-model="value" placeholder="请输入..." />
  </form>
</template>
```

通过 `bind:` 当然也可以绑定其他属性，甚至我们可以绑定 DOM 的属性（比如 `clientWidth` 之类的）。而在 Vue 中`v-model` 受到的限制就比较多。

对于使用了 `contenteditable` 的元素，我们可以直接绑定它的 `innerHTML` 属性：

```html
<p 
   contenteditable
   bind:innerHTML={content}
>
  这是内容
</p>
```

#### 类

在 Vue 中，我们可以给模板的 `class` 属性传入一个字符串、一个数组或是一个 `Record<string, boolean>` 类型的对象来控制元素具有哪些类，而在 Svelte 中同样如此：

```svelte
<p class="my-class-1 my-class-2">
  字符串
</p>

<p class={['my-class-1', { 'my-class-2': true }]}>
  带有控制对象的数组
</p>

<p class={{
  'my-class-1': true,
  'my-class-2': false
}}>
  控制对象
</p>
```

这等同于 Vue 中的：

```vue
<template>
  <p class="my-class-1 my-class-2">
    字符串
  </p>

  <p :class="['my-class-1', { 'my-class-2': true }]">
    带有控制对象的数组
  </p>

  <p :class="{
    'my-class-1': true,
    'my-class-2': false
  }">
    控制对象
  </p>
</template>
```

基本上完全一致。

#### 指令

Svelte 中提供了简单的指令系统。没有太多的钩子，Svelte 的指令是一个普通函数，其函数签名很简单：第一个参数为 `node` —— 即绑定的元素 DOM；第二个参数为 `args` —— 即 `use:directive={args}` 中传入的参数 `args`。使用 Svelte 指令可以对目标 DOM 元素做指定处理。

由于 DOM 需要在挂载阶段才能操作，因此指令函数中具体的绑定操作需要在 `$effect()` 方法（类似于 Vue 的 `onMounted()`）中执行：

```javascript
/// action.svelte.js
export function myDirective(node, args) {
  // 定义一些函数...
  $effect(() => {
  	// 具体的 DOM 操作
  });
}
```

然后我们在模板中可以使用 `use:` 来对元素应用指令：

```svelte
<script>
  import myDirective from './action.svelte.js';
</script>

<p use:myDirective={/*...*/}>
  使用指令
</p>
```

这点与 Vue 中的 `v-directive="/* ... */"` 有异曲同工之妙。

#### 样式指令

Svelte 允许我们直接通过指令的形式修改元素的样式属性，这也是 Svelte 的特点之一：

```svelte
<script>
  const width = 20;
</script>

<button
  style:color="red"
  style:--width="{width}rem"
>
  Click
</button>
```

这部分的模板相当于：

```svelte
<button
  style="color: red; --width: {width}rem;"
>
  Click
</button>
```

通过 `style:prop="value"` 的形式，可以直接修改元素的样式。

Svelte 允许我们用一种简单的方法修改组件的 CSS 变量，那就是直接用 `--prop="value"` 的语法进行修改：

```svelte
<script>
  import MyComponent from './MyComponent.svelte.js';
  const width = 20;
</script>

<MyComponent --width="{width}rem" />
```

#### 过渡指令

在 Vue 中，我们可以使用 `<transition>` 和 `<transition-group>` 组件对元素的创建销毁和变化添加过渡动画，而在 Svelte 中，我们可以使用 `transition:` 指令来指定元素的过渡效果：

```svelte
<script>
  import { fade } from 'svelte/transition';
</script>

<p transition:fade>
  Fades in and out
</p>
```

在 `p` 元素被添加或删除的时候，会产生对应的 `fade` 动画。

对于有参数的动画，我们也可以在后面添加参数：

```svelte
<script>
  import { fly } from 'svelte/transition';
</script>

<p transition:fly={{ y: 200, duration: 2000 }}>
  Flies in and out
</p>
```

如果你想要出入的动画不一样，可以用 `in:` 和 `out:` 指令代替 `transition:` 指令：

```javascript
<script>
  import { fade, fly } from 'svelte/transition';
</script>

<p 
  in:fly={{ y: 200, duration: 2000 }} 
  out:fade
>
  Flies in and out
</p>
```

###  API

#### 响应式数据

Svelte 中可以使用 `$state` 函数来创建一个响应式变量：

```javascript
/// 原始值
let count = $state(0);
count = 20;
count++;  // 可以直接赋值修改

/// 对象
let obj = $state({ a: 20 });
obj.a = 30;
```

类似于 Vue 中 `ref` 和 `reactive` 的结合体：

```javascript
/// 原始值
let count = ref(0);
count.value = 20;
count.value++;

/// 对象
let obj = reactive({ a: 20 });
obj.a = 30;
```

由于 Svelte 的响应式数据都是属于编译时响应式的，并不依赖于 `Proxy API`（Vue 使用的），因此我们是能够直接在模板中直接修改变量值的。在编译的时候编译器会自动识别对响应式数据做的操作，并生成对应的更新操作。

如果数据是一个对象，`$state` 会将对象内所有的数据全部转化为响应式数据。如果我们只想创建不想这样子，可以使用 `$state.raw` 来创建（类似于 Vue 中的 `shallowRef` ）：

```javascript
let obj = $state.raw({ a: 20 });
obj.a = 30;			// 不触发更新
obj = { a: 30 };	// 会触发更新
```

类似于 Vue 中的 `:ref="el"` ，我们可以通过 `bind:this={el}` 来获取到元素的 DOM，并赋予 `el`：

```svelte
<script>
  let el = $state(null); // 创建一个响应式变量
  
  // $effect 类似于 onMounted
  $effect(() => {
    // 操作 DOM
  });
</script>

<p bind:this={el}>获取我</p>
```

#### 计算属性

在 Svelte 中我们可以用 `$derived` 来定义一个计算属性：

```javascript
const a = $state(0), b = $state(0);
const sum = $derived(() => a + b);
```

类似于 Vue 中的 `computed`：

```javascript
const a = ref(0), b = ref(0);
const sum = computed(() => a.value + b.value);
```

#### 打印响应式数据

比较有意思的是，Svelte 中的响应式数据都是 **不可复制的**，这就以为这它无法被 `console.log` 之类的调试函数直接打印。

Svelte 为我们提供了一个专门用于打印响应式变量的 API —— `$state.snapshot` 和 `$inspect` ：

```javascript
let count = $state(0);

console.log($state.snapshot(count));	// => 0

$inspect(count);	// => init 0
count = 1;			// => update 1

// 指定用什么函数打印
$inspect(count).with(console.error);	// > init(0)	> ...
```

可见 `$inspect` 在某些情况下可能更适合追踪调试数据。

#### 副作用函数

有点类似于 Vue 的 `watch` ，Svelte 的 `$effect` 允许我们创建内容发生变化时重新调用的函数，只不过 Svelte 官方并不推荐经常用它，称它为 “最后的手段” 😂。

```javascript
let elapsed = $state(0);
let interval = $state(1000);

$effect(() => {
  const timer = setInterval(() => {
    elapsed += 1;
  }, interval);
  
  return () => clearInterval(timer);
});
```

跟 React 中的 `useEffect` 一样，`$effect` 返回一个 `cleanup` 函数，当 `$effect` 被**重新调用**（一般发生在组件重渲染的时候）时会调用这个函数以清楚上次调用产生的副作用。

`$effect` 将会在元素挂载的时候调用，因此它可以在脱围机制中起到类似于 Vue 中 `onMounted` 函数的作用（见上文 ***指令*** 一节）。

#### 共享响应式变量

类似于 Vue 的 `ref` 和 `reactive`，Svelte 中的响应式变量也是可以专门放在一个文件里导出，然后被多个组件共享的，只不过这必须要求导出的数据是一个***响应式对象***，并且存放响应式变量的文件名必须以 `.svelte.{ts|js}` 结尾：

```javascript
// data.svelte.js
export const counter = $state({
  value: 20
});
```

## 总结

不得不说 Svelte 的一些语法构想确实是不错的，但是并没有给我一种想要转向他的冲动。 相比于 Svelte，我会更加愿意使用 Vue 和 React 这些的大型主流框架来进行我的项目开发。至于静态网页，我就用 AstroJS 啦，SSG 还是很不错的！

这篇文章我通过类比 Vue 介绍了 Svelte 的基本语法和 API。希望看完对你也能够有一些帮助。😄
