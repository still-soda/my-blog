---
title: '手写 call、apply 和 bind 函数'
description:
   '手写 JS 经典函数 call、apply 和 bind，以此巩固我的基础能力。'
pubDate: 'Feb 22 2025'
heroImage: '/src/images/hero/hero-hand-write-call-apply-and-bind-functions.png'
---

### 各个函数的功能解释

这仨函数确实是非常基础且重要的，可惜我到现在才决定正式了解他们的原理和实现。

在具体的实现前，我们先来了解各个函数的功能：

#### call

> `Function` 实例的 `call()` 方法会以给定的 `this` 值和逐个提供的参数调用该函数。

```js
function fn(num1, num2) { /* ... */ }
fn.call(this, 1, 2);
```

#### apply

> `Function` 实例的 `apply()` 方法会以给定的 `this` 值和作为数组（或类数组对象）提供的 `arguments` 调用该函数。

这个函数几乎与 `call` 函数完全相同，差别是参数列表以数组形式提供。

```js
function fn(num1, num2) { /* ... */ }
fn.call(this, [1, 2]);
```

#### bind

> `Function` 实例的 `bind()` 方法创建一个新函数，当调用该新函数时，它会调用原始函数并将其 `this` 关键字设置为给定的值，同时，还可以传入一系列指定的参数，这些参数会插入到调用新函数时传入的参数的前面。

```js
function fn() { /* ... */ }
const newFn = fn.bind(this);
newFn();
```

### 实现 call 函数

实现 `call` 函数的核心其实就是一件事：将当前函数转化为传入的 `_this` 对象的成员函数，然后再通过该对象调用这个函数即可。

```js
Function.prototype._call = function (_this) {
   // 判断当前的 this 是否是一个函数
   // 这是为了过滤掉将 `_call` 函数单独提取出来运行的情况
   // 这种情况下 this 不是函数
   if (typeof this !== 'function') {
      throw new Error('This is not a function!');
   }

   // 没有指定 _this 的值就默认为 window
   // 并且要使用 Object(_this) 转化为对象，以防止传入的是基本数据类型
   _this = _this ? Object(_this) : window;

   // 获取参数，第一个参数是 _this 对象，所以要去掉
   const args = [...arguments].slice(1);

   // 将函数转化为 _this 对象的成员函数，然后调用它
   // 最后删除这个属性
   // 使用 Symbol 是为了防止与其他属性冲突
   const key = Symbol();
   _this[key] = this;
   const result = _this[key](...args);
   delete _this[key];
   return result;
};
```

> 实现细节：
> 1. `_call` 不能是一个箭头函数，因为箭头函数没有 `this`；
> 2. 需要保证 `this` 是函数，`_this` 是对象。

### 实现 apply 函数

`apply` 的实现方法其实和 `call` 大同小异

```js
Function.prototype._apply = function (_this) {
   // 检测是否为函数
   if (typeof this !== 'function') {
      throw new Error('This is not a function!');
   }

   // 获取到执行上下文
   _this = _this ? Object(_this) : window;

   // 获取参数
   // apply 函数的第二个参数是一个数组，也可能为空
   const args = arguments[1] || [];

   // 老样子
   const key = Symbol();
   _this[key] = this;
   const result = _this[key](...args);
   delete _this[key];
   return result;
};
```

可以看到唯一的区别在于 `args` 的获取方式上， `apply` 的第二个参数为数组，也可能为空。

### 实现 bind 函数

`bind` 函数创建一个以指定对象为 `this` 值的函数并返回，其实就相当于将当前对象绑定到传入的上下文对象上。同时，绑定时也能指定前置参数是什么。

```js
Function.prototype._bind = function (_this) {
   // 检测是否为函数
   if (typeof this !== 'function') {
      throw new Error('This is not a function!');
   }

   // 获取到执行上下文
   _this = _this ? Object(_this) : window;

   // 将函数绑定到 _this 上
   const key = Symbol();
   _this[key] = this;

   // 获取前置参数
   const additionalArgs = [...arguments].slice(1);

   // 返回一个函数，这个函数会调用绑定的函数
   return function (...args) {
      return _this[key](...additionalArgs, ...args);
   };
};
```

### 总结

这三个函数的实现总体来说都是很简单的，核心就在于一点：需要将 `this` 绑定到给定的上下文对象上，然后通过对象来调用。

同时，通过 `arguments` 来自动获取所有参数也是一个很重要的点。