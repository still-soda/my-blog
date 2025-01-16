---
title: '《Vue.js设计与实现》学习笔记 | 响应系统的作用与实现'
description: '本章围绕 Vue.js 响应式数据系统展开。先讲副作用函数原理，通过数据读写捕获实现响应式，再用 Proxy 和 WeakMap 绑定触发。引入依赖清理，封装函数优化，用栈管理嵌套 effect，通过调度机制构建完善响应式系统 。'
pubDate: 'Jul 20 2024'
heroImage: '/src/images/hero/hero-role-and-implementation-of-response-systems.png'
---

## 响应式数据与副作用函数

### 副作用函数

如果一个函数的调用会对函数外的数据，并且这些数据可以被其他函数访问到，那么就可以称该函数的调用会产生副作用，是一个副作用函数。例如：

```javascript
const obj = { value: 5 };
// 副作用函数
function effect() {
    document.body.innerText = obj.value; // 副作用
}
```

要实现数据的响应式，主要就是要实现以下两点：

1.  在数据被读取时自动收集并绑定相应的副作用函数；
2.  在数据被赋值的时候调用该数据绑定的副作用函数；

因此，如何对读取和赋值操作进行捕获就成为一个重要且核心的问题。

### 如何捕获对数据的操作

在 ES2015 前，Vue.js 主要依赖于 `Object.defineProperty` 来捕获这些操作，这是 Vue.js 2 采用的方案。而在 ES2015 之后，Vue.js 依赖于 `Proxy API` 来进行操作捕获，这是 Vue.js 3 采用的方案。

## 响应式数据的基本实现

现在让我们从头开始实现一个可以将给定数据转化为响应式数据的方法。为了达到这个目的，我们要考虑如何实现上述两点要求。

### 在数据被读取时自动收集并绑定相应的副作用函数

首先需要面对第一个问题：数据在副作用函数内被读取的时候怎么知道当前是哪一个副作用函数？

答案是：只需要一个全局变量来保存当前的副作用函数，然后数据在被读取的时候就能通过这个全局变量知道自己在哪了。

我们定义一个名为 `activeEffect` 的变量来存储当前副作用函数，定义一个名为 `effectFn` 的变量来存放所有已经收集的副作用函数：

```javascript
// 存放当前活跃的副作用函数
let activeEffect;

// 存放收集的所有副作用函数
// 为啥用 Set，因为副作用函数不能重复
const effectFn = new Set();
```

然后我们写一个名为 `effect` 的函数，当它被调用的时候，自动将副作用函数注册到全局，然后调用副作用函数，然后副作用函数内的所有被读取的变量就能够自动收集该副作用函数。

```javascript
function effect(fn) {
    activeEffect = fn; // 注册 fn 到全局变量上
    fn(); // 触发副作用函数收集操作
}
```

好了，现在我们知道当 `fn` 被调用的时候，里面的变量一旦被读取就会自动从全局变量中获取当前副作用函数，并将其收集到 `effectFn` 中。我们要怎么实现这一步呢？答案是利用 `Proxy` 来捕获读取操作。

在这里我们编写一个名为 `responsive` 的方法，这个方法会将入参转化为一个代理对象，并设置 `get` 夹子。当 `get` 夹子被触发的时候，它会自动获取当前副作用函数，并把它加入到副作用函数列表中。

```javascript
function responsive(data) {
    // 把入参 data 转为代理对象
    const obj = new Proxy(data, {
        get(target, key) {
            // 如果存在 activeEffect，就加入列表
            activeEffect && effectFn.add(activeEffect);
            return target[key];
        }
    });
    
    return obj;
}
```

这样，我们就实现了在数据被读取时自动收集并绑定相应的副作用函数。

### 在数据被赋值的时候调用该数据绑定的副作用函数

你应该已经猜到了，要实现这个目的只需要设置代理对象的 `set` 夹子即可，确实如此。

我们在 `set` 夹子被触发的时候调用副作用函数列表中所有的函数即可。

```javascript
function responsive(data) {
    // 把入参 data 转为代理对象
    const obj = new Proxy(data, {
        get(target, key) {
            // 如果存在 activeEffect，就加入列表
            activeEffect && effectFn.add(activeEffect);
            return target[key];
        },
        // 这是 set 夹子
        set(target, key, val) {
        	target[key] = val;
            // 把副作用函数列表中所用函数都调用一遍
            effectFn.forEach(fn => fn());
            return true;
        }
    });
    
    return obj;
}
```

这样我们就初步实现了一个响应式数据的创建方法。

我们可以用这种方式来调用它们：

```javascript
const data = { value: 100 };
// 创建
const obj = responsive(data);
effect(() => {
    console.log(obj.value); // 在值改变的时候自动输出新的值
}); // 输出：100

obj.value = 200; // 输出：200
obj.value = 300; // 输出：300
```

这样我们就实现了最简单的响应式数据。

## 设计一个完善的相应系统

### 修改数据结构

上述实现中存在这个一个显著的漏洞，譬如对于以下代码：

```javascript
const data = { a: 200, b: -200 };
// 创建
const obj = responsive(data);
effect(() => {
    console.log(obj.a); // 在 a 属性的值改变时自动输出新的值
}); // 输出：200

obj.a = 300; // 输出：300
obj.b = -999; // 输出：300
```

你会发现，尽管注册的副作用函数里面只包含对 `a` 的读取，但是当我们修改 `b` 属性的时候，仍然触发了副作用函数，而这是我们不希望看到的。

归根结底，这个漏洞出现在存放副作用的变量 `effectFn` 的数据结构上。因为 `effectFn` 是集合，并不存在哪个属性对哪些副作用的映射，因此是无法满足我们想要达到的效果的。

因此，我们可以选择使用 `Map` 和 `WeakMap` 来达到这个效果：

```javascript
// 这里将 effectFn 的数据结构改为 WeakMap
// 因为 WeakMap 中对 key 的引用不会影响对 key 的 GC
const effectFn = new WeakMap();

function responsive(data) {
    // 把入参 data 转为代理对象
    const obj = new Proxy(data, {
        get(target, key) {
            // 如果存在 activeEffect，就加入列表
            if (activeEffect) {
                // 第一层: WeakMap[obj] -> Map
                let depsMap = effectFn.get(target);
                if (!depsMap) {
                    depsMap = new Map();
                    effectFn.set(target, depsMap);
                }
                // 第二层: Map[key] -> Set
                let deps = depsMap.get(key);
                if (!deps) {
                    deps = new Set();
                    depsMap.set(key, dep);
                }
                deps.add(activeEffect);
            }
            return target[key];
        },
        // 这是 set 夹子
        set(target, key, val) {
        	target[key] = val;
            // 找到对应的副作用函数列表
            const depsMap = effectFn.get(target);
            if (!depsMap) return;
            const deps = depsMap.get(key);
            // 把副作用函数列表中所用函数都调用一遍
            deps && deps.forEach(fn => fn());
        }
    });
    
    return obj;
}
```

这个新的数据结构我们可以用下面这张图来表示：

![image-20240716175217279](https://cos1-1322468699.cos.ap-guangzhou.myqcloud.com/img/202407162113161.png)

可以直观的看到，`effectFn` 是一个以 `obj` 为键，`Map` 为值的 `WeakMap`。而这里的 `obj` 就是响应式对象，我们要对其每个键都建立一个副作用函数列表，因此我们使用一个 `Map` 来将 `obj` 的 `key` 映射到一个存放副作用的集合 `Set`。

这样一来，如果我们想要将副作用函数注册到对应的键，我们只需要通过当前响应式对象和要注册的键找到对应的 `Set`，然后再将副作用函数放入即可。

### 为什么是 WeakMap ?

`WeakMap` 是 ES6 中新增的 API，`WeakMap` 与 `Map` 的不同之处在于：由于其不会创建对键的强引用， **一个对象作为 `WeakMap` 的键存在，不会阻止垃圾收集器对其的回收**。

在上述例子中，`effectFn` 被设计为一个以 **对象为键** ，`Map` 为值的映射。如果使用 `Map`，那么就会出现一种我们不希望看到的情况：如果一个对象被作为该 `Map` 的 `key`，那么即使该对象再也无法被程序访问到，其占用的内存也永远得不到释放，因为 `Map` 始终保存着该对象的引用。那么这就有导致内存溢出的风险。为了避免这种情况，我们就需要使用不会干扰 GC 的 `WeakMap` 来代替 `Map`。

### 封装 track 和 trigger 函数

最后，我们对上文代码做一些封装，将注册副作用函数的代码封装为 `track`  函数 ，将触发副作用函数的代码封装为 `trigger` 函数：

```javascript
function responsive(data) {
    // 在 get 夹子内调用 track 函数追踪变化
    function track(target, key) {
        // 第一层: WeakMap[obj] -> Map
        let depsMap = effectFn.get(target);
        if (!depsMap) {
            depsMap = new Map();
            effectFn.set(target, depsMap);
        }
        // 第二层: Map[key] -> Set
        let deps = depsMap.get(key);
        if (!deps) {
            deps = new Set();
            depsMap.set(key, dep);
        }
        deps.add(activeEffect);
    }
    
    // 在 set 夹子内调用 trigger 函数触发所有副作用函数
    function trigger(target, key) {
        // 找到对应的副作用函数列表
        const depsMap = effectFn.get(target);
        if (!depsMap) return;
        const deps = depsMap.get(key);
        // 把副作用函数列表中所用函数都调用一遍
        deps && deps.forEach(fn => fn());
    }
    
    // 把入参 data 转为代理对象
    const obj = new Proxy(data, {
        get(target, key) {
            // 如果存在 activeEffect，就加入列表
            activeEffect && track(target, key);
            return target[key];
        },
        // 这是 set 夹子
        set(target, key, val) {
        	target[key] = val;
            trigger(target, key);
        }
    });
    
    return obj;
}
```

## 分支切换 与 cleanup

在上述情况中，我们的副作用函数并不包含有判断等不一定执行的语句。但是如果副作用函数中存在判断呢？

```javascript
effect(() => {
   	console.log(obj.ok ? obj.a : obj.b);
});
```

在上述代码中，假设第一次执行收集的时候 `obj.ok` 为 `false`， 那么此时该副作用函数会被 `obj.b` 收集；在第二次执行的时候，`obj.ok` 的值变为了 `true` ，该副作用函数就被 `obj.a` 收集了，这个过程我们称为 **分支切换**。

但是这时候就出现了一个问题，分支切换的过程中会产生遗留的副作用函数：当 `obj.ok` 为 `true` 的时候，`obj.b` 不会被执行，也就是说在理想情况下，此时 `obj.b` 的改变不应该触发该副作用函数的二次执行，但是由于在第一次调用的时候该副作用函数已经被收集，因此我们无法避免该函数的反复执行。所以这里将对 `effect` 函数进行改造：编写一个 `cleanup` 函数，在每次收集之前先将该副作用函数从所有注册的对象中删去，再重新进行注册。

```javascript
// 修改 effect 函数
function effect(f) {
    const fn = () => {
        activeEffect = fn;
        f();
    }
    // 在 fn 上定义一个 deps 列表来存放与之绑定的所有依赖集合
    fn.deps = [];
    fn();
}
```

然后我们对 `track` 方法进行修改：

```javascript
// 在 get 夹子内调用 track 函数追踪变化
function track(target, key) {
    // 第一层: WeakMap[obj] -> Map
    let depsMap = effectFn.get(target);
    if (!depsMap) {
        depsMap = new Map();
        effectFn.set(target, depsMap);
    }
    // 第二层: Map[key] -> Set
    let deps = depsMap.get(key);
    if (!deps) {
        deps = new Set();
        depsMap.set(key, dep);
    }
    deps.add(activeEffect);
    // ⭐将当前副作用函数存在的依赖集合加入到副作用函数的依赖列表中
    activeEffect.deps.push(deps);
}
```

有了这个依赖列表后，我们就可以在每次副作用执行之前，根据 `fn.deps` 获取所有与之相关联的依赖集合，并从这些集合中删除该副作用函数。

```javascript
function cleanup(fn) {
    fn && fn.deps.forEach(dep => {
        dep.delete(fn);
    });
    // 重置 fn 的依赖列表
    fn.deps.length = 0;
}

// 修改 effect 函数
function effect(f) {
    const fn = () => {
        // ⭐在每次调用之前先从依赖中删除自己
        cleanup(fn);
        activeEffect = fn;
        f();
    }
    // 在 fn 上定义一个 deps 列表来存放与之绑定的所有依赖集合
    fn.deps = [];
    fn();
}
```

### 解决无限循环

此时的代码存在一个 bug，就是当它运行时会陷入无限循环。这是因为 `trigger` 函数发生了问题，当 `trigger` 函数执行所有的副作用函数时，每个副作用函数都会触发 `cleanup` 操作，这就导致副作用函数从当前对象的副作用函数集合中被删去，但是随后又重新被添加到当前的集合。

ES6 中声明最好不要在遍历集合的时候加入新元素，因为当正在遍历的集合被删除时，不会影响当前遍历的进行；但是当有新元素被加入当前集合的时候，该新元素会被放在该集合的最后，并且遍历能够访问到该变化。因此如果你每一层遍历都往集合中加新的元素，遍历将永远无法停止，类似以下代码：

```javascript
const set = new Set();

set.forEach(i => {
    set.delete(0);
    set.add(0);
});
```

解决方法也很简单，只需要在遍历之前将 `deps` 复制一份即可：

```javascript
// 在 set 夹子内调用 trigger 函数触发所有副作用函数
function trigger(target, key) {
    // 找到对应的副作用函数列表
    const depsMap = effectFn.get(target);
    if (!depsMap) return;
    const deps = depsMap.get(key);
    if (!deps) return;
    // ⭐ 复制 deps
    const depsCpy = new Set(deps);
    // 把副作用函数列表中所用函数都调用一遍
    depsCpy.forEach(fn => fn());
}
```

## 嵌套 effect 与 effect 栈

为啥会发生 `effect` 嵌套呢？实际上，在渲染组件的时候就会发生 `effect` 嵌套：

```javascript
effect(() => {
    Comp1.render();
    effect(() => {
        Comp2.render();
    });
});
```

嵌套的 `effect` 会有个小问题，那就是内层的 `effect` 会影响外层 `effect` 的副作用函数收集。这是因为，每当进入一个新的 `effect`  方法， `activeEffect` 就会被替换为当前的副作用函数，但是当这个新的 `effect` 方法结束之后，却无法将 `activeEffect` 替换为曾经的副作用函数。这就会导致在调用这个新的 `effect` 函数之后，后面的依赖都无法被正确收集。

这个时候我们就需要新增一个 `effectStack` 栈，这样就能实现回溯的功能了。只需要在进入 `effect` 的时候将新的副作用函数压入栈，然后在 `effect` 退出的时候弹出栈顶的副作用函数，将 `activeEffect` 替换为新的栈顶即可。  

```javascript
const effectStack = [];

function effect(f) {
    const fn = () => {
        cleanup(fn);
        activeEffect = fn;
        // 入栈
        effectStack.push(fn);
        fn();
        // 弹出栈顶
        effectStack.pop();
        // 替换 activeEffect 为新的栈顶
        activeEffect = effectStack[effectStack.length - 1];
    }
    fn.deps = [];
    fn();
}
```

这样，我们就可以避免发生错乱了。

## 避免无限递归循环

好吧，目前为止我们好像都没有讨论过一种特别但是又很常见的情况：副作用函数中同时包含对某个值的读取和设置操作。例如以下代码：

```javascript
effect(() => {
    obj.val = obj.val + 1;
})
```

如果我们使用上述实现来添加依赖，会出现无限递归导致内存溢出的 bug。这是因为副作用函数首先读取了 `obj.val` 的值，这样就触发了 `track` 方法从而将当前副作用函数添加到了 `obj.val` 的依赖中，但是紧接着对 `obj.val` 的赋值操作又触发了 `trigger` 函数，这样就会导致刚刚被收集的副作用函数被调用。可是刚刚被收集的函数就是当前副作用函数，这样相当于无限递归调用了当前副作用函数，最终导致内存溢出。

为了解决这个问题，我们只需要在 `trigger` 中判断要执行的副作用函数是否是当前正在执行副作用函数，如果是则跳过即可。

```c++
// 在 set 夹子内调用 trigger 函数触发所有副作用函数
function trigger(target, key) {
    // 找到对应的副作用函数列表
    const depsMap = effectFn.get(target);
    if (!depsMap) return;
    const deps = depsMap.get(key);
    if (!deps) return;
    // 复制 deps
    const depsCpy = new Set(deps);
    // 把副作用函数列表中所用函数都调用一遍
    depsCpy.forEach(fn => {
        // ⭐ 这里做一个判断即可
        fn !== activeEffect && fn();
    });
}
```

## 调度执行

调度执行是响应式系统非常重要的特性。可调度性是指当 `trigger` 动作在触发副作用函数执行的时候，有能力决定如何执行副作用函数。

实现方式比较简单，通过在 `effect` 方法中引入第二参数 `options`，可以让用户通过 `options`  传入指定调度函数，从而决定如何执行副作用函数。

```javascript
effect(f, options = {}) {
    const fn = () => {
        // ...
    }
    // 将 options 挂载到 fn 上
    fn.options = options; 
    // ...
}
```

随后在 `trigger` 函数中，检测是否存在调度器，并在存在的情况下通过调度器执行副作用函数：

```javascript
// 在 set 夹子内调用 trigger 函数触发所有副作用函数
function trigger(target, key) {
    // 找到对应的副作用函数列表
    const depsMap = effectFn.get(target);
    if (!depsMap) return;
    const deps = depsMap.get(key);
    if (!deps) return;
    // 复制 deps
    const depsCpy = new Set(deps);
    // 把副作用函数列表中所用函数都调用一遍
    depsCpy.forEach(fn => {
        if (fn === activeEffect) {
            return;
        }
        // ⭐ 这里判断是否存在调度器
        if (fn.options.scheduler) {
            // ⭐ 通过调度器调用副作用函数
			fn.options.scheduler(fn);
        } else {
            fn();
        }
    });
}
```

然后我们就可以在调用 `effect` 的时候指定当前副作用函数应该被如何执行了：

```javascript
effect(() => {
    // ...
}, {
    scheduler: fn => {
        // 我们在这里规定副作用函数之前要输出信息 "fn was invoked"
        console.log('fn was invoked');
    	fn();
    }
})
```

从而就可以实现副作用函数的调度执行。

### 基于调度器实现批量更新

如果一个响应式对象被连续多次修改，但是我们不希望每次修改都调用其副作用函数，我们可以借助任务队列来去除重复的副作用函数，并将这些副作用函数放在微任务中执行。

我们都知道在浏览器一个事件循环中代码的执行循序为： `普通代码 → 微任务 → 宏任务`，那么实现批量更新的具体思路就有了：

1.  首先定义一个自动去重的任务队列；
2.  每次触发 `trigger` 操作的时候将要执行的副作用函数加入任务队列；
3.  在普通代码结束后的微任务中执行任务队列中的所有副作用函数。

那么要如何基于调度器实现它呢，看代码。

先定义一个自动去重的任务队列；

```javascript
// 基于 Set 实现任务队列 jobQueue
const jobQueue = new Set();
const p = Promise.resolve(); // 用于开启微任务

let isFlushing = false;
function flushJob() {
    // 确保在单次事件循环中该函数只生效一次
    if (isFlushing) {
        return;
    }
    isFlushing = true;
    // 在微任务队列中执行所有任务
    p.then(() => {
        jobQueue.forEach(job => job());
    }).finally(() => {
        // 在事件循环之前重置刷新状态
        isFlushing = false;
    });
}
```

通过调度器来将副作用函数加入到任务队列中：

```javascript
effect(() => {
    // ...
}, {
    scheduler: fn => {
        // 将副作用函数加入任务队列
        jobQueue.add(fn);
        // 触发刷新动作
        flushJob();
    }
});
```

这样我们就实现了批量更新。

## 实现 computed

如果我们想要让一个副作用函数仅在程序显式调用它时才执行，并且当内部值不发生改变时，能够缓存先前的计算结果，那么我们就可以将该函数称为一个懒计算函数。

我们要实现懒计算，首先在 `effect` 方法的 `options` 参数中引入一个 `lazy` 属性，用它来指定该副作用函数是否在调用 `effect` 的时候被执行。

```javascript
function effect(f, options = {}) {
    const fn = () => {
        // ...
    }
    // ...
    // ⭐ 如果不是懒计算，就直接执行副作用函数进行依赖收集
    if (!options.lazy) {
        fn();
    }
    // ⭐ 将副作用函数返回，自己决定何时调用
    return fn;
}
```

然后，我们就可以通过手动调用返回值 `fn` 来决定何时获取计算结果。

可是目前并没有缓存效果，咋搞？我们先定义一个名为 `value` 的变量来缓存计算结果；再定义一个名为 `dirty` 的变量，用于判断缓存的计算结果是否发生变化。每当计算函数被调用的时候，如果计算结果没有发生变化则返回缓存的值，否则重新计算。

```javascript
function computed(getter) {
    let value;
    let dirty = true;
    
    const fn = effect(getter, {
        lazy: true,
        // ⭐ 当依赖发生改变时，意味着计算结果将发生变化
        scheduler() {
            dirty = true;
        }
    });
    
    const obj = {
        get value() {
            // ⭐ 仅当结果发生变化的时候重新计算
            if (dirty) {
                value = fn();
                dirty = false;
            }
            return value;
        }
    }
    
    return obj;
}
```

上述 `computed` 函数对 `effect` 调用进行了封装，返回结果变为了一个 `obj`，当我么可以通过读取 `obj.value` 来获得计算结果。同时 `obj.value` 还具有缓存效果。

但是现在又出现了一个新的问题，如果我们将 `obj.value` 放在 `effect` 函数中，那么当 `effect` 函数对 `obj.value` 进行读取操作的时候，并不会对 `obj.value` 执行副作用函数收集的操作。这样一来，当计算结果出现变化的时候，不会触发外层副作用函数的重新执行。

这是因为 `obj.value` 实际上是一个 `getter` 方法，在读取的时候不会触发 `track` 操作，也就不会将外层副作用函数与 `obj.value` 相关联了。

这时候，我们只需要在读取 `obj.value` 的时候手动调用 `track` 函数进行收集即可。

```javascript
function computed(getter) {
    let value;
    let dirty = true;
    
    const fn = effect(getter, {
        lazy: true,
        scheduler() {
            dirty = true;
        }
    });
    
    const obj = {
        get value() {
            if (dirty) {
                value = fn();
                dirty = false;
            }
            // ⭐ 手动调用 track 进行依赖收集
            track(obj, 'value');
            return value;
        }
    }
    
    return obj;
}
```

这样我们就建立了 `obj.value` 与外层副作用函数的关联。

## 实现 watch

有了调度器，我们要实现 `watch` 方法可就非常简单了。我们将需要监听的响应式对象作为 `watch` 方法的第一个参数，回调函数作为第二个函数，来实现对响应式对象变化的监听。同时，为了实现监听对象内的所有属性，需要编写一个 `traverse` 方法对响应式对象进行遍历：

```javascript
// seen 是用来放已经检测过的对象的
function traverse(obj, seen = new Set()) {
    if (typeof obj !== 'object' || !obj || seen.has(obj)) {
        return;
    }
    // 标记访问
    seen.add(obj);
    // 递归遍历所有属性，触发收集
    for (const key in obj) {
        traverse(obj[key]);
    }
    
    return obj;
}

function watch(source, cb) {
    effect(
    	() => traverse(source),
      	{
            scheduler() {
                cb();
            }
        }  
    );
}
```

现在就能实现对第一个参数的监听了。可是有时候我们希望第一个参数可以传递一个函数，我们可以通过允许 `source` 参数为函数来实现：

```javascript
function watch(source, cb) {
    let getter;
    // ⭐ 检测 source 的类型
    if (typeof source === 'function') {
        getter = source;
    } else {
        getter = () => traverse(source);
    }
    
    effect(
        () => traverse(source),
        {
            scheduler() {
                cb();
            }
        }
    );
}
```

接下来添加一个更加重要的特性 —— 回调函数的新旧值参数。这里需要充分利用 `lazy` 的特性来实现对新旧值的获取：

```javascript
function watch(source, cb) {
    let getter;
    
    if (typeof source === 'function') {
        getter = source;
    } else {
        getter = () => traverse(source);
    }
    
    let oldValue, newValue;
    
    // ⭐ 这里注意 fn 的调用结果是返回 source，所以可以用来记录当前值
    const fn = effect(
        () => traverse(source),
        {
            scheduler() {
                // ⭐ 获取新的值
                newValue = fn();
                // ⭐ 给回调传入新旧值
                cb(newValue, oldValue);
                // ⭐ 回调结束，新值变旧值
                oldValue = newValue;
            },
            lazy: true
        }
    );
    
    // ⭐ 手动记录第一个旧值
    oldValue = fn();
}
```

在上述实现中，回调并不会在设置监听时被触发，如果我们想要回调在初始化时就触发一次，我们可以设置 `watch` 的第三个参数 `options`，然后通过 `options` 设置 `immediate` 属性来设置回调的执行时机。

```javascript
// 引入参数 options
function watch(source, cb, options = {}) {
    let getter;
    
    if (typeof source === 'function') {
        getter = source;
    } else {
        getter = () => traverse(source);
    }
    
    let oldValue, newValue;
    
    // 将调度器提取出来作为 job 函数
    function job() {
        newValue = fn();
        cb(newValue, oldValue);
        oldValue = newValue;
    }
    
    const fn = effect(
        () => traverse(source),
        {
            scheduler: job,
            lazy: true
        }
    );
    
    // 根据 immediate 决定是否在初始化时就执行回调
    if (options.immediate) {
        job();
    } else {
        fn();
    }
}
```

这样我们就实现了一个 `watch` 方法。

### 过期的副作用

过期回调的引入是为了解决当 `watch`  方法的回调为异步函数时，在上次回调尚未执行完毕却又触发了下一次回调所产生的冲突。这个冲突是由异步操作耗时的不确定性产生的。通过在回调方法的第三个参数引入过期回调，可以允许开发者定义当前回调过期时需要执行的操作。

```javascript
function watch(source, cb, options = {}) {
    let getter;
    
    if (typeof source === 'function') {
        getter = source;
    } else {
        getter = () => traverse(source);
    }
    
    let oldValue, newValue;
    // cleanup 用于存放过期回调
    let cleanup;
    
    // 这个函数可以用来注册过期回调
    function onInvalidate(fn) {
        cleanup = fn;
    }
    
    function job() {
        newValue = fn();
        // 如果存在过期回调，则执行过期回调
        cleanup && cleanup();
        cb(newValue, oldValue, onInvalidate);
        oldValue = newValue;
    }
    
    const fn = effect(
        () => traverse(source),
        {
            scheduler: job,
            lazy: true
        }
    );
    
    if (options.immediate) {
        job();
    } else {
        fn();
    }
}
```

这样就允许开发者快捷地进行回调过期处理。

## 总结

本章从 Vue.js 的响应式数据系统入手，探讨其核心机制。

先是介绍了副作用函数及其原理，通过对数据的读取和赋值捕获，实现响应式。

接着讲解了利用 `Proxy` 和 `WeakMap` 实现数据与副作用函数的绑定和触发。为解决副作用函数重复执行的问题，引入了依赖清理机制，并通过封装 `track` 和 `trigger` 函数优化代码。针对嵌套 `effect`，采用栈结构管理活动副作用函数，避免误收集。

最后通过调度执行机制，实现了副作用函数的可调度性，从而构建了一个完善的响应式系统。