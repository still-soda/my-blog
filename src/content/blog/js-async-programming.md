---
title: '一文讲清楚 JavaScript 异步编程'
description: '本文介绍了 JavaScript 的异步编程模型通过使用 Promise、async/await 等机制，使得程序能够在不阻塞主线程的情况下执行多个任务，提高了效率和代码的可维护性。'
pubDate: 'Jan 17 2025'
heroImage: '/src/images/hero/hero-js-async-programming.png'
---

## 前言

一直以来，JavaScript 以其出色的异步模型著称。特别在 ES6 之后，JavaScript 正式变成一门完善的编程语言，`Promise` 使其异步特性也趋近于完善，并且在 ES2017 中新增了基于 `Promise` 的 `async/await` 语法糖，使得异步操作变得更加简单。可以说，如果不学习 JavaScript 的异步编程，就根本不算真正接触 JavaScript 这门语言。

那么究竟什么是异步编程，接下来让我开始为你讲解。

## 异步能干什么？

异步在现代软件开发中非常重要，其核心优势在于**能够在不阻塞主线程的情况下执行多个任务。**

如果你在过去曾经学习过一些基于同步模型的语言（如 C/C++），你一定会知道，在大多数情况下，你的代码都是**同步执行**的。也就是说代码的执行顺序严格按照代码的编写顺序，如果你想要在实现同步代码中实现延迟等待，最简单的方式是运行一个不停止的循环来**阻塞**代码执行。但是即使在这种情况下，如果你不使用多线程这类技术，你仍然无法改变代码执行顺序。

而在 JavaScript 这种具有异步模型的语言中，代码的执行顺序并不严格按照代码的编写顺序，如以下代码：

```javascript
console.log('A');

setTimeout(() => {
  console.log('B');
}, 10);

console.log('C');
```

这段代码执行后，会输出 `A C B` 而非 `A B C`，这就意味着代码并非同步执行，而是异步执行。

这种特性也使得我们在执行耗时任务（如等待接口返回）的时候不必等待当前任务执行完毕才去执行下一个，从而提高了运行效率。同一段时间内执行多个任务也称为并行。

难道我们一定要使用 `setTimeout` 或 `setInterval` 才能执行异步吗？当然不是，接下来讲解的 `Promise` 能够让你更加自由地进行异步操作。

## 认识 Promise

### 所谓回调地狱

在 ES6 以前，JavaScript 采用**回调函数**的方式来处理异步操作：

```javascript
getImage('path/to/img', (img) => {
  /* 对获取的图片进行处理... */
});
```

这个异步模式其实非常常见，如果你接触过 NodeJS，你就会发现其 API 大多数都是这种形式的（这也是 NodeJS 长久以来被广大开发者诟病的点之一，就连其创始人都曾吐槽过）。在异步操作较少或不需要考虑处理操作先后顺序的情况下，采用这个模式的确是不错的选择。但是如果操作的数量一大，这个模式就容易导致**回调地狱**的出现。

> #### 什么是回调地狱？
>
> 回调地狱指的是当需要按顺序执行多个异步操作时，回调函数往往会被**大量嵌套**，从而导致可读性大大下降的情况。如以下代码：
>
> ```javascript
> //// ====== ⛩️ 「登神长阶」 ⛩️ ====== ////
> getData1('/data1', (data1) => {
>   getData2(data1.next, (data2) => {
>     getData3(data2.next, (data3) => {
>       getData4(data3.next, (data4) => {
>         getData5(data4.next, (data5) => {
>           getData6(data5.next, (data6) => {
>             // ...
>           });
>         });
>       });
>     });
>   });
> });
> ```
>
> 这种情况是非常糟糕的，尤其是在大型的项目中，这会导致项目可维护性和可读性大大下降。

### Promise 被引入 JS

在 ES6 中，Promise（期约） 被正式引入 JavaScript。

**Promise 是一种用于处理异步操作的 JavaScript 对象，它表示一个在未来某个时间点一定会落定的操作的结果。**

注意到这句话中的 “落定” 一词吗？依照 [Promise/A+ 的定义](https://promisesaplus.com/#point-11)，Promise 共有 3 个状态：

- **待定 `pending`**：这是期约的初始状态，表示操作未完成前的状态；

- **兑现 `fulfilled`**：表示操作成功，也可以称为 `resolved`；
- **拒绝 `rejected`**：表示操作失败；

其中，`fulfilled` 和 `rejected` 都表示操作完成的状态，合称落定 `settled`。

### 使用 Promise

Promise 允许我们通过**链式调用** `.then()` 的方法来确保异步操作执行的先后次序，并用 `.catch()` 来处理异步操作链上发生的错误。

老样子，还是建议去阅读 MDN 文档：[Promise - MDN  Docs](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise)。

以下我只介绍最最常用的一些 API 和操作。

#### 创建 Promise 对象

我们通常使用 Promise 构造函数来创建一个 Promise 对象：

```javascript
const p = new Promise((resolve, reject) => {
  /* 异步操作，以调用 resolve 或 reject 结束 */
});
```

Promise 构造函数仅有一个函数类型的参数，即 Promise 执行器。在执行器函数中，两个入参分别对应 **兑现** 和 **拒绝** 操作。

`resolve` 和 `reject` 也是函数，你可以给它们任何实际的名称。它们的函数签名很简单：它们接受一个任意类型的参数。你可以在执行器的函数体中调用 `resolve` 或 `reject` 来返回一个值，**表示该 Promise 落定的值**。如果调用时 `value` 和 `reason` 都为空，Promise 将落定为 `undefined`。
```javascript
resolve(value); // 兑现时调用
reject(reason);  // 拒绝时调用
```

> 这里需要澄清的一点是 Promise 对象究竟是一个什么东西。
> 
> ```javascript
> const p = new Promise((resolve) => {
>   setTimeout(() => {
>     resolve(123)
>   }, 100);
> });
>
> console.log(p);       // => [object Promise]
>
> setTimeout(() => {
>   console.log(p);     // => [object Promise]
> }, 200);
> 
> p.then(val => {
>   console.log(val);   // => 123
> });
> 
> const pp = await p;
> console.log(pp);      // => 123
> ```
> 
> 这里我们列举了使用 Promise 的四种情况，让我来逐一解释：
> 
> 1. **第一种情况**：`p` 显然是一个 Promise 对象，因此输出结果为 Promise 对象没有问题；
> 2. **第二种情况**: 虽然在 $200ms$ 后 `p` 已经落定为值 `123`，但是如果不使用 `await`（后文会做介绍），`p` 并不会直接转化为落定的值，而是需要我们使用 `.then()` 去获取这个值；
> 3. **第三种情况**：就是如何通过 `.then()` 去获取落定的值并对其进行操作；
> 4. **第四种情况**：使用 `await` 关键字等待 `p` 落定的值，并将其赋予 `pp`。注意在此时 `p` 仍然为 Promise 对象，而 `pp` 为 `p` 落定的值；
>
> 可见 Promise 表示的一种未来将会落定为具体值的对象，并不是其所落定的值。其落定的值就是调用 `resolve` 或 `reject` 时传入的值。

如果你既不调用 `resolve` 也不调用 `reject` ，将会导致 Promise **永远处于待定状态**。这个时候如果你使用 `await` 去等待该 Promise 落定，将会导致等待者永远阻塞！

需要注意的是，调用 `reject` 将会导致 Promise 的 `.catch()` 方法被调用，如果没有抛出任何一个错误，`.catch(err => {})` 接受到的 `err` 参数将为 `undefined`。

#### 使用 then 和 catch

使用 Promise 的一种方法是使用 `.then()` 来指定执行顺序：

```javascript
const todo = new Promise(/* ... */);
todo
  .then(/* do something ... */)
  .then(/* do something ... */)
  .then(/* do something ... */);
```

这样的写法称为**链式调用**，理解起来也非常简单，就是先干什么 **然后 (then)** 干什么。

> #### 链式调用？
>
> 链式调用是一种非常 nice 的函数调用风格，它允许我们通过编写 “函数链” 的形式来对目标执行一系列操作。实现链式调用的最简单方法是在对象方法中返回 `this`，确保方法的返回值为对象本身。

我们可以在链式调用的最后追加一个 `.catch()` 的调用来处理链上抛出的错误：

```javascript
todo
  .then(/* do something ... */)		// step.1
  .then(/* do something ... */)		// step.2
  .then(/* do something ... */)		// step.3
  .catch(err => console.log(err));// step.4
```

假设链上任意一个点抛出了错误或拒绝，函数链将直接跳到 `.catch()` 的调用。例如：*step.1* 发生错误或拒绝，函数链将会略过 *step.2* 和 *step.3*，直接跳到 *step.4* 处理错误。

#### 立即落定

可以通过 Promise 的静态方法 `resolve` 或 `reject` 来创建一个立即落定的期约，立即落定一般用于开启 Promise 链式调用。

```javascript
Promise.resolve()	// 立即兑现
  .then(/* ... */);

Promise.reject()	// 立即拒绝
  .then(/* ... */);
```

#### 全部兑现

如果你需要创建一个 Promise 来等待其他所有 Promise 落定，你可以使用 `Promise.all()`：

```javascript
const allSettle = Promise.all([promise1, promise2, promise3]);
```

`allSettle` 将在三个 Promise 全部兑现的时候兑现，如果其中有任意一个拒绝，它也将会拒绝。

#### 任意兑现

只要一个兑现就兑现，全都拒绝就拒绝。

```javascript
const anySettle = Promise.any([promise1, promise2, promise3]);
```

#### 分解执行器

`Promise.withResolver()` 是一个非常新的特性，其在 2024 年刚刚被各家浏览器广泛支持。这是一个非常好用的方法，可以让你将执行器的两个参数从执行器中抽离。

```javascript
let { promise, resolve, reject } = Promise.withResolver();
```

这句代码等同于以下操作：

```javascript
let resolve, reject;
let promise = new Promise((res, rej) => {
  resolve = res;
  reject = rej;
});
```

稍后我将会在例子中使用该特性。

---

那么相信你对 Promise 大概有一个印象了，接下来让我们进行更进一步的学习。

### 用 Promise 解决回调地狱

我们将 ***所谓回调地狱*** 一节中会导致回调地狱的代码进行用 Promise 重写：

```javascript
// 这里假设每个 getData 都返回对应的 Promise
getData1('data1')
  .then(data1 => await getData2(data1.next))
  .then(data2 => await getData3(data2.next))
  .then(data3 => await getData4(data3.next))
  .then(data4 => await getData5(data4.next))
  .then(data5 => await getData6(data5.next))
  // ...
  .catch(err => console.error(err)); // 最后用 .catch() 处理异常
```

这样一来，你会发现回调地狱神奇地被消除了，变得格外顺眼，其可维护性自然也就变得很好了。

但是你可能会感到迷惑，这个 `await` 是个什么玩意儿？字面意思上看起来像是等待？实际上确实如此。

### async 与 await

好吧，现在我问你，同步的英文是什么？答案是：synchronization，缩写为 sync。而异步的英文则是在同步英文的前面加上一个 *a* ，即 asynchronization，简称 **async**。

#### 使用 async

在 ES2017 后，我们可以通过 `async` 关键字将一个函数标记为异步函数：

```javascript
// 普通函数
async function func1() {
  /* 可使用 await */
}

// 箭头函数
const func2 = async () => {
  /* 可使用 await */
}
```

异步函数允许我们使用 `await` 等待 Promise 落定，而这在普通函数中则不被允许。

> 如果你使用 TypeScript 并试图在一个普通函数中使用 await，编译器会警告你该函数不是一个异步函数。

#### 使用 await

上面提到了 `await` ，这个关键字允许我们直接以同步调用的形式调用异步函数，并获取其返回值。听起来有点抽象，来看看这段代码：

```javascript
// 定义一个异步函数
async function fn() {
  return Promise.resolve(666);
}

async function main() {
  // 不用 await
  const a = fn();
  console.log(a); // 输出：[object Promise]
  // 使用 await
  const b = await fn();
  console.log(b); // 输出：666
}
main();
```

可以看到，在不使用 `await` 关键字的情况下，输出的值为一个 Promise 对象而不是 666。这是因为 Promise 即使是立即返回，它也必须在**微任务**才能落定（此处关于微任务的概念将在下文讲解，现在只需要知道微任务在普通代码之后执行即可）。

使用 `await` 关键字即表示你希望程序**等待**异步函数落定，并**获取其落定的结果**。这也就解释了为什么 `b` 的值为 `666`。

### 例子：编写一个延迟器

让我们实现：先输出 `Hello, world`，1s 后输出 `I'm still-soda!`。

在学习 Promise 前，你也许会这样实现：

```javascript
console.log('Hello, world');
setTimeout(() => {
  console.log(`I'm still-soda!`);
}, 1000);
```

但是现在你已经学习了 Promise，你可以基于 Promise 封装一个延时函数 `delay`，从而实现延时操作。让我们实现它：

```javascript
function delay(time) {
  const { promise, resolve, reject } = Promise.withResolver();
  // 在 time 毫秒后兑现期约
  setTimeout(() => resolve(), time);
  return promise;
}
```

在此处，我使用了 `Promise.withResolver` 特性进行编写, 如果你的浏览器不支持 `Promise.withResolver`，则需要改写为：

```javascript
function delay(time) {
  let resolve;
  const promise = new Promise((res) => resolve = res);
  // 在 time 毫秒后兑现期约
  setTimeout(() => resolve(), time);
  return promise;
}
```

接下来让我们使用 `delay` 函数来实现目标操作：

```javascript
// 使用 await
console.log('Hello, world');
await delay(1000);
console.log(`I'm still-soda!`);

// 不用 await
console.log('Hello, world');
delay(1000).then(() => {
  console.log(`I'm still-soda!`);
});
```

OK，大功告成！你应该已经意识到了使用 `await` 在某些情况下比使用 `.then()` 更加优雅，所以在代码编写中，我们可以适当地使用 `await`。这会让你的代码变得更加易读。

## JavaScript 异步模型

JavaScript 能够实现异步的核心在于其采用了异步模型。JS 异步模型是通过 **事件循环（Event Loop）** 和 **任务队列（Task Queue）** 来实现的。

### 关键组成部分

#### 执行栈

> 先来聊聊 **栈（Stack）** 这个数据结构吧。
>
> 栈是一种 **先进后出（LIFO，Last In First Out）** 的数据结构。
>
> 你可以把一个栈想象成一张餐桌，栈中每一条数据就是餐桌上的一个盘子。盘子只能通过堆叠的方式存放，那么最先放上去的盘子就会在最底部（即最先进入的数据在栈底），最后放上去的盘子在最上面（即最后进入的数据在栈顶）。
>
> 如果你要取出一个盘子，就只能在顶部拿一个（即每次拿一条数据都是从栈顶取出）。而这个在顶部的盘子就是最后放上去的，所以我们就称该操作方式为后进先出，也就是先进后出。

执行栈是用来存放当前正在执行的同步代码的地方。当 JavaScript 代码执行的时候，函数会被逐一推入执行栈，执行完毕后会从栈顶弹出。

同步代码会逐行执行，只有当前函数执行完毕后，栈才能弹出，继续执行下一个任务。**而异步代码并不会被推入执行栈，而是会被推入任务队列中**。

#### 任务队列

> **队列（Queue）** 是一种 **先进先出（FIFO，First In First Out）** 的数据结构。
>
> 顾名思义，可以把队列想象成一条正在排队的队伍，每次只能从队头消费，而最先入队的人越靠前，所以我们称为先进先出。

任务队列也称为事件队列，是异步任务等待执行的地方。异步任务进入任务队列后，会在主线程有空的时候被取出执行。

任务队列中的任务分为 **微任务（Microtasks）** 和 **宏任务（Macrotasks）** ，**宏任务在微任务后执行**。

- 微任务包括：`Promise.then`、`MutationObserver`；

- 宏任务包括：`setTimeout`、`setInterval`、网络请求等 I/O 操作；

任务队列中的任务会在同步代码之后被执行，所以我们可以得出同步代码、微任务、宏任务三者的执行顺序为：

```bash
同步代码 --> 微任务 --> 宏任务
```

而按这个顺序不断执行，就是浏览器的**事件循环**。

#### 事件循环

事件循环是 JavaScript 异步执行的核心机制，它负责从任务队列中**取出任务并交给执行栈执行**（记住这句话）。现在有以下代码：

```javascript
console.log('A');

setTimeout(() => {
  console.log('B');
}, 0);

Promise.resolve().then(() => {
  console.log('C');
});

console.log('D');
```

猜猜这段代码会输出什么？

答案是：`A D C B`

在上文我们提到了同步代码和两大任务之间的先后执行顺序，接下来让我们来从 JS 引擎的视角逐步分析这段代码：

**首先是同步任务执行阶段**：

1. 读取 `console.log('A')` ：这段代码是同步任务，直接执行；
2. 读取 `setTimeout(...)` ：在介绍任务队列的时候我们提到 `setTimeout` 属于宏任务，因此被推入任务队列；
3. 读取 `Promise.resolve().then(...)`：`Promise.then` 属于微任务，因此被推入任务队列；
4. 读取 `console.log('D')` ：这段代码是同步任务，直接执行；

**然后进入任务队列执行阶段**：

1. 执行微任务：
   1. 读取到 `Promise.resolve().then(...)`：开始执行任务。
      1. 读取到 `console.log('B')` ：这段代码是同步任务，直接执行；
2. 执行宏任务：
   1. 读取到 `setTimeout(...)` ：开始执行任务
      1. 读取到 `console.log('C')`：这段代码是同步任务，直接执行；

接着再经过渲染循环等，一轮事件循环就完成了。

> #### 微任务的优先级比宏任务高
>
> 这是 JavaScript 事件循环中非常重要的一点。微任务（如 Promise）具有更高的优先级。即使事件循环已经执行了一个宏任务，它会先去执行微任务队列中的任务，直到微任务队列清空为止。因此，在宏任务执行后，**事件循环会去处理微任务**，而不是直接执行下一个宏任务。
>
> 也就是说，只要微任务队列中还存在未执行的微任务，就不可能去执行宏任务。

## 实现 async 和 await

在上面我们介绍了 `async` 和 `await` ，它们是 ES2017 中新增的用于简化 Promise 操作的语法糖。那么既然是语法糖，我们就一定可以用原生的操作实现它。

实际上这个语法糖是基于 **生成器（Generator）** 实现的。

> #### 什么是生成器？
>
> [生成器](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Iterators_and_generators)是 ES6 中新增的一个特性，它允许你定义一个可以暂停执行并在稍后恢复的函数。我们可以通过 `function*` 来定义一个生成器函数，调用这个函数将会返回一个生成器对象，而这个生成器对象满足[迭代器协议](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Iteration_protocols#%E8%BF%AD%E4%BB%A3%E5%99%A8%E5%8D%8F%E8%AE%AE)。
>
> 在生成器函数中，我们可以使用 `yield` 来从当前位置返回一个值，而当下一次调用的时候，程序会从上次返回的地方继续执行，直到遇到下一个 `yield` 或 `return`。需要注意的是，生成器函数中的 `return` 表示终止生成。举个例子：
>
> ```javascript
> // 定义生成器函数
> function* getGenerator(n) {
>   yield n;
>   yield n + 10;
>   yield n + 20;
> }
> // 创建生成器对象
> const gen = getGenerator(3);
> // 通过 .next() 调用生成器
> console.log(gen.next());  // => { value: 3, done: false }
> console.log(gen.next());  // => { value: 13, done: false }
> console.log(gen.next());  // => { value: 23, done: false }
> console.log(gen.next());  // => { value: undefined, done: true }
> ```
>
> 可以看到每次调用生成器对象的 `.next()` 方法，都会返回一个包含 `done` 和 `value` 的对象，对应的含义为：
>
> - `done`：迭代是否已经完成；
> - `value`：`yield` 的返回结果，当 `done` 为 `true` 的时候其值为 `undefined`；

实现思路的其实很简单，说白了就是基于生成器去按顺序地等待 Promise 兑现：

1. 用 `function asyncFn(fn)` 代替 `async function`，其参数 `fn` 为一个生成器函数，返回值为一个返回 Promise 的函数；
2. `fn` 中用 `yield` 代替 `await`，`yield` 每次暂停返回一个 Promise；
3. 创建一个函数并返回，这个函数需要完成以下操作：
   1. 创建一个 Promise，并分离出它的 `resolve` 方法；
   2. 创建一个生成器；
   3. 定义一个 `waitNext` 函数，这个函数用于从生成器中取出一个 Promise 进行等待，并在兑现后执行递归调用自己。这个函数带有一个参数 `value`，表示上一轮 Promise 兑现的结果，当迭代结束的时候，主函数将被兑现为该值。
   4. 调用 `waitNext` 函数；
   5. 返回先前创建的 Promise；

接下来让我们用代码实现它：

```javascript
function asyncFn(fn) {
  return () => {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      [resolve, reject] = [res, rej];
    });
    const gen = fn();
    
    const waitNext = (value) => {
      const { value: promise, done } = gen.next();
      if (done) {
        resolve(value);
        return;
      }
      promise
        .then((result) => waitNext(result))
      	.catch((err) => reject(err));
    }
    waitNext(undefined);
    
    return promise;
  }
}
```

这样，我们就实现了 `async/await` 语法糖。

对于以下使用 `async` 和 `await` 的代码片段：

```javascript
const getData = async () => {
  console.log('A');
  await delay(1000);
  console.log('B');
  await delay(1000);
  console.log('C');
}
getData().then(() => console.log('D'));
```

我们可以写成这种形式：

```javascript
const getData = asyncFn(function* () {
  console.log('A');
  yield delay(1000);
  console.log('B');
  yield delay(1000);
  console.log('C');
});
getData().then(() => console.log('D'));
```

效果完全一致！至此，我们完成了这个语法糖的编写。