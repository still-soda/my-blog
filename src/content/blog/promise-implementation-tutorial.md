---
title: '全网最详细最完善的Promise实现教程，带你彻底掌握Promise'
description: '还在被网上粗制滥造的Promise实现教程误导吗？这是全网最详细最完善的Promise实现教程，带你彻底掌握Promise'
pubDate: 'Feb 24 2025'
heroImage: '/src/images/hero/hero-promise-implementation-tutorial.png'
---

## 前言

最近在学习各种 JS 函数的手写，看我这两天发布的文就知道了。

终于轮到 **Promise** 了，在网上搜寻一番之后发现功能大都不怎么完善，各种形形色色的 **Promise** 实现跟原生 Promise 的行为相比都不尽相同。

因此我决定自己实现一个 Promise，也算是深入学习了。

## Promise A+

关于这个规范并不在本文的重点论述中，但是还是简单提一嘴，这个规范的内容主要就是 Promise 由三个状态组成：

- `Pending` 待定
- `Fulfilled` 兑现
- `Rejected` 拒绝

并且后面两个状态都属于落定（Settled），唯独 Pending 属于未落定（Unsettled）。

**Promise 只能又未落定转化为落定。**

## 实现Promise的实例方法

我们就正式开始实现 Promise，我将一步步带你实现并了解其中的细节。

让我们先创建一个 Promise 的实现，就叫 `PromiseImpl` 吧。

```js
class PromiseImpl {
  // Promise 的三个状态
  static PENDING = 0;
  static FULFILLED = 1;
  static REJECTED = 2;

  // 初始状态为 pending
  #status = PromiseImpl.PENDING;

  constructor() {}
}
```

### Executor

Executor（执行器）是 Promise 构造函数中传入的回调函数，它用于初始化一个 Promise 对象，可以通过两个入参（resolve 和 reject）来决定兑现还是拒绝这个 Promise。

```js
class PromiseImpl {
   // ...

   constructor(executor) {
      try {
         executor(this.#resolve.bind(this), this.#reject.bind(this));
      } catch (err) {
         // 当执行器抛出错误的时候，Promise 应该被拒绝
         this.#reject(err);
      }
   }

   #reject(reason) {}

   #resolve(value) {}
}
```

我们创建了 `#resolve` 和 `#reject` 这两个用于兑现和拒绝的回调，并将其传入执行器中，供开发者决定何时落定。

### Thenable

Promise 实例是一个 “Thenable” 的对象，所谓 “Thenable” 就是有 `then()` 函数。这样的对象可以使用 `await` 关键字转化为同步调用，具体涉及到 ES2017 中 `await` 语法糖的实现细节，再此不多做赘述。

#### 返回一个新对象

通过以下代码，我们可以知道原生 Promise 的 `.then()` 方法实际上返回了一个 **全新的 Promise 对象**。

```js
const a = Promise.resolve(0);
const b = a.then((res) => res + 1);

console.log(a === b);   // => false
```

这就意味着我们不能通过 `return this` 的方法实现链式调用，而是需要在 `then` 方法中重新 new 一个 PromiseImpl 对象，因此可以给出以下实现。

```js
class PromiseImpl {
   // ...

   // 保存 then 方法的回调和新 Promise 执行器的入参
   #onFulfilled;
   #onRejected;
   #thenResolve;
   #thenReject;

   then(onFulfilled, onRejected) {
      this.#onFulfilled = onFulfilled;
      this.#onRejected = onRejected;
      return new PromiseImpl((resolve, reject) => {
         this.#thenResolve = resolve;
         this.#thenReject = reject;
      });
   }
}

```

> 这里的 `#onFulfilled` 和 `#onRejected` 可以理解为 **调度器**。调度器允许我们对传入的值做进一步的操作，并将其向后传递。
>
> 只不过此处 `#onRejected` 的行为并没有那么简单，我们会在后文做进一步讲解。

现在我们可以使用 `then()` 实现链式调用了：

```js
new PromseImpl(/* ... */)
  .then(/* ... */)
  .then(/* ... */);
```

但是目前我们还无法让下一个 `then()` 在上一个 PromiseImpl 落定时被调用，因此我们需要完善 `#resolve` 和 `#reject` 方法。

#### then回调的执行时机

我们知道，原生 Promise 构造函数中的执行器是一个同步回调，而 `Promise.then()` 方法中的回调则是异步回调，这部分异步回调被放在 **微任务** 中执行。

我们可以在上一个 Promise 落定时去准备好落定下一个 Promise（放入微任务中）。

```js
class PromiseImpl {
   // ...

   // 保存落定的值
   #settleValue;

   #resolve(value) {
      queueMicrotask(() => {
         let result;
         // 尝试通过调度器转化 value，发生错误则走拒绝流程
         try {
            result = this.#onFulfilled ? this.#onFulfilled(value) : value;
         } catch (err) {
            // 如果调度器出现错误则直接落定为拒绝，并将错误向后传递
            this.#status = PromiseImpl.REJECTED;
            this.#settledValue = err;
            this.#thenReject?.(err);
            return;
         }
         // 更新 Promise 的状态为 fulfilled
         this.#status = PromiseImpl.FULFILLED;
         this.#settledValue = result;
         // 调用下一个 Promise 的落定回调
         this.#thenResolve?.(result);
      });
   }

   #reject(reason) {
      queueMicrotask(() => {
         // 尝试通过调度器转化 reason，发生错误则更新 reason 为新的错误
         if (this.#onRejected) {
            try {
               reason = this.#onRejected(reason);
            } catch (err) {
               reason = err;
            }
         }
         // 更新 Promise 的状态为 rejected
         this.#status = PromiseImpl.REJECTED;
         this.#settledValue = reason;
         // 调用下一个 Promise 的拒绝回调
         this.#thenReject?.(reason);
      });
   }

   // ...
}
```

像这样，在落定的时候向微任务队列推入新的任务去落定下一个 Promise 的值，我们就可以实现落定值的链式传递了。

但是有一个潜在的问题我们没有考虑到：如果落定的值是一个对象，那该怎么办？

#### 等待 PromiseImpl 类型的落定值

通过观察原生 Promise 的行为，我们可以得知如果返回的是一个 Promise 对象，那么会将 **该 Promise 落定的值** 传递下去，而不是直接传递 Promise 对象。

让我们先将调度结束后的操作抽取成 `process` 方法：

```js
class PromiseImpl {
   // ...

   // 保存落定的值
   #settleValue;

   #resolve(value) {
      queueMicrotask(() => {
         let result;
         try {
            result = this.#onFulfilled ? this.#onFulfilled(value) : value;
         } catch (err) {
            this.#status = PromiseImpl.REJECTED;
            this.#settledValue = err;
            this.#thenReject?.(err);
            return;
         }
         // 封装为 process 方法
         function process(result) {
            this.#status = PromiseImpl.FULFILLED;
            this.#settledValue = result;
            this.#thenResolve?.(result);
         }
         process(result);
      });
   }

   #reject(reason) {
      queueMicrotask(() => {
         if (this.#onRejected) {
            try {
               reason = this.#onRejected(reason);
            } catch (err) {
               reason = err;
            }
         }
         // 封装为 process 方法
         function process(reason) {
            this.#status = PromiseImpl.REJECTED;
            this.#settledValue = reason;
            this.#thenReject?.(reason);
         }
         process(reason);
      });
   }

   // ...
}
```

随后我们需要实现一个名为 `#processPromiseResult` 的方法，它会在传入的 Promise 兑现的时候调用 process 方法。

然后，我们在刚刚封装的 `process` 方法中判断当前传入的值是否是一个 PromiseImpl 对象，如果是的话，调用 `#processPromiseResult` 解析传入值，并停止处理。

```js
class PromiseImpl {
   // ...

   // 等待当前 promise 落定再继续触发回调
   #processPromiseResult(promise, process) {
      promise.then(
         (res) => process(res),
         (err) => this.#reject(err)
      );
   }

   // 保存落定的值
   #settleValue;

   #resolve(value) {
      queueMicrotask(() => {
         let result;
         try {
            result = this.#onFulfilled ? this.#onFulfilled(value) : value;
         } catch (err) {
            this.#reject(err);
            return;
         }
         // 封装为 process 方法
         function process(result) {
            // 判断当前 result 是否是一个 Promise
            // 如果是的话等待落定再继续
            if (result instanceof PromiseImpl) {
               this.#processPromiseResult(result, process);
               return;
            }
            this.#status = PromiseImpl.FULFILLED;
            this.#settledValue = result;
            this.#thenResolve?.(result);
         }
         process(result);
      });
   }

   #reject(reason) {
      queueMicrotask(() => {
         if (this.#onRejected) {
            try {
               reason = this.#onRejected(reason);
            } catch (err) {
               reason = err;
            }
         }
         // 封装为 process 方法
         function process(reason) {
            // 判断当前 reason 是否是一个 Promise
            // 如果是的话等待落定再继续
            if (result instanceof PromiseImpl) {
               this.#processPromiseResult(result, process);
               return;
            }
            this.#status = PromiseImpl.REJECTED;
            this.#settledValue = reason;
            this.#thenReject?.(reason);
         }
         process(reason);
      });
   }

   // ...
}
```

观察到设置状态、设置落定值和落定下一个 Promise 这一系列将值向下传递的操作有所重复，我们将其可以提取出来做为 `#passResolve` 和 `#passReject` 方法以简化代码。

```js
class PromiseImpl {
   // ...

   // 对传递兑现值的操作进行封装
   #passResolve(result) {
      this.#status = PromiseImpl.FULFILLED;
      this.#settledValue = result;
      this.#thenResolve?.(result);
   }

   // 对传递拒绝值的操作进行封装
   #passReject(reason) {
      this.#status = PromiseImpl.REJECTED;
      this.#settledValue = reason;
      this.#thenReject?.(reason);
   }

   // 等待当前 promise 落定再继续触发回调
   #processPromiseResult(promise, process) {
      promise.then(
         (res) => process(res),
         (err) => this.#reject(err)
      );
   }

   // 保存落定的值
   #settleValue;

   #resolve(value) {
      queueMicrotask(() => {
         let result;
         try {
            result = this.#onFulfilled ? this.#onFulfilled(value) : value;
         } catch (err) {
            this.#passReject(err);
            return;
         }
         // 封装为 process 方法
         function process(result) {
            // 判断当前 result 是否是一个 Promise
            // 如果是的话等待落定再继续
            if (result instanceof PromiseImpl) {
               this.#processPromiseResult(result, process);
               return;
            }
            this.#passResolve(result);
         }
         process(result);
      });
   }

   #reject(reason) {
      queueMicrotask(() => {
         if (this.#onRejected) {
            try {
               reason = this.#onRejected(reason);
            } catch (err) {
               reason = err;
            }
         }
         // 封装为 process 方法
         function process(reason) {
            // 判断当前 reason 是否是一个 Promise
            // 如果是的话等待落定再继续
            if (result instanceof PromiseImpl) {
               this.#processPromiseResult(result, process);
               return;
            }
            this.#passReject(reason);
         }
         process(reason);
      });
   }

   // ...
}
```

这样我们就可以解析 PromiseImpl 类型的返回值了。

#### 处理落定状态下的then

目前我们 `then` 方法的实现并未考虑落定状态下的情况，在已经落定的时候，`then` 将会被立即落定为 `#settleValue` 的值。

```js
class PromiseImpl {
  // ...

  then(onFulfilled, onRejected) {
    this.#onFulfilled = onFulfilled;
    this.#onRejected = onRejected;
    // 分三种情况进行处理
    if (this.#status === PromiseImpl.PENDING) {
      return new PromiseImpl((resolve, reject) => {
        this.#thenResolve = resolve;
        this.#thenReject = reject;
      });
    } else if (this.#status === PromiseImpl.FULFILLED) {
      this.#onFulfilled?.(this.#settledValue);
      return PromiseImpl.resolve(this.#settledValue); // 此处暂没有实现 PromiseImpl.resolve() 方法
    } else {
      this.#onRejected?.(this.#settledValue);
      return PromiseImpl.reject(this.#settledValue); // 此处暂没有实现 PromiseImpl.reject()
    }
  }

  // ...
}
```

目前来说，我们的 “Thenable” 部分实现已经是比较完善的了，让我们继续实现 `finally` 和 `catch` 的部分吧。

### 捕获异常

当我们使用 `await` 等待一个 Promise 时，如果这个 Promise 发生了错误，那么此处会抛出一个异常。

你以为这部分需要我们自己来实现吗？非也非也。

经过我的观察，我发现当使用 `await` 去等待一个 Promise 的时候，它会自动在 Promise 末尾插上一个 `then`方法，据我的猜测，`await` 语法糖正是通过这个 `then()` 去获取 Promise 最终的返回值的，而如果这个 `then` 方法的 `onRejected` 调度器被调用，那么 `await` 语法糖会通过调度器传入的 `reason` 参数去实例化一个 Error 对象并抛出。

`await` 做的操作类似于以下代码：

```js
const a = await promise;

// 这段代码有点类似于 👇
let a;
promise.then(
  (res) => a = res,
  (reason) => throw new Error(reason) // 抛出异常
);
```

但是如果链上抛出的异常被 `onRejected` 调度器处理了，就不会触发异常，因此我们可以得出一个结论：被 `onRejected` 调度器处理过的错误将会变为一个兑现的值并向下传递，而没有调度器处理的则会被做为错误继续向下传递。

如图所示。

<img title="调度器处理示意图" src="/images/promise-implementation-tutorial/image.png" width="300" />

要想实现经 `onRejected` 调度器后转化为兑现状态，我们需要修改 `#reject` 回调中 `process` 方法的实现。

```js
class PromiseImpl {

  // ...

  #reject(reason) {
    queueMicrotask(() => {
      if (this.#onRejected) {
        try {
          reason = this.#onRejected(reason);
        } catch (err) {
          reason = err;
        }
      }

      const process = (reason) => {
        if (reason instanceof PromiseImpl) {
          this.#processPromiseResult(reason, process);
          return;
        }

        // 当存在 #onRejected 的时候要像 fulfuill 一样处理
        if (this.#onRejected) {
          this.#passResolve(reason);
          return;
        }

        this.#status = PromiseImpl.REJECTED;
        this.#settledValue = reason;
        this.#thenReject?.(reason);
      };
      process(reason);
    });
  }

  // ...
}
```

这样一来，如果异常被捕获并处理，外界就不会抛出错误。

#### catch异常处理

通过前文的讨论，我们不难总结出 `PromiseImpl.catch()` 其实就是一个对 `onReject` 调度器的封装方法。

```js
class PromiseImpl {
    // ...

    // catch 实际上就是构造一个只有 onReject 调度器的 then 方法
    catch(callback) {
        return this.then(null, (reason) => {
            // 构造 Error 对象并传递给回调
            const err = new Error(reason);
            callback(err);
        });
    }

    // ...
}
```

正因为 `PromiseImpl.catch()` 向传入了 `PromiseImpl.then()` 方法传入了 `onReject` 调度器，所以如果当调用链上有 `.catch()` 方法的时候，错误会被传递给它处理。并且如上文展示的那样，`.catch()` 方法返回的将是一个被兑现的 PromiseImpl 对象（因为错误被 onReject 调度器处理过了）。

#### 实现finally

`finally` 的实现原理也比较简单，它也可以看做是对 `.then()` 方法的封装：

```js
class PromiseImpl {
    // ...

    // finally 实际上就是构造一个即有 onReject 又有 onFulfill 调度器的 then 方法
    finally(callback) {
        const cb = () => {
            callback();
            // 将传递过来的值继续向下传递
            return #settleValue;
        }
        return this.then(cb, cb);
    }

    // ...
}
```

这样显然有问题，我相信你可能多少也察觉到了一点：如果是错误经过了 `finally` 的 `onReject` 调度器，就会被做为兑现值而不是异常向下传递，这样就干扰了后续的异常处理。

要解决这个问题，我们需要对 `finally` 中的调度器 `cb` 打上其 “专属标签”。

```js
// 用 Symbol 值防止与其他属性名发生冲突
const __FINAL__ = Symbol();

class PromiseImpl {
    // ...

    finally(callback) {
        const cb = () => {
            callback();
            return #settleValue;
        }
        // 打上标签
        cb[__FINAL__] = true;
        return this.then(cb, cb);
    }

    // ...
}
```

然后在 `#reject` 方法中单独处理它。

```js
class PromiseImpl {
   // ...

   #reject(reason) {
      queueMicrotask(() => {
         if (this.#onRejected) {
            try {
               reason = this.#onRejected(reason);
            } catch (err) {
               reason = err;
            }
         }

         const process = (reason) => {
            if (reason instanceof PromiseImpl) {
               this.#processPromiseResult(reason, process);
               return;
            }

            // 这里多了个条件，当调度器身上存在__FINAL__标签的时候
            // 不要做为兑现值向下传递
            if (this.#onRejected && !this.#onRejected[__FINAL__]) {
               this.#resolveNext(reason);
            } else {
               this.#rejectNext(reason);
            }
         };

         process(reason);
      });
   }

   // ...
}
```

这样一来，`finally` 就能正常工作了，至此，我们的 PromiseImpl 已经支持了原生的 Promise 所有的实例方法。

## 实现Promise的静态方法

### Promise.resolve()

这个方法没什么好说的，比较简单。

```js
class PromiseImpl {
   static resolve(value) {
      return new PromiseImpl((res) => res(value));
   }
}
```

### Promise.reject()

同上。

```js
class PromiseImpl {
   static reject(reason) {
      return new PromiseImpl((_, rej) => rej(reason));
   }
}
```

### Promise.allSettled()

> `Promise.allSettled()` 静态方法将一个 `Promise` 可迭代对象作为输入，并返回一个单独的 `Promise`。当所有输入的 `Promise` 都已敲定时（包括传入空的可迭代对象时），返回的 `Promise` 将被兑现，并带有描述每个 `Promise` 结果的对象数组。

初始化计数器为 Promise 的个数，在每个 Promise 落定的时候保存状态和结果并自减计数器，随后判断计数器是否等于 0，是则返回结果数组。

如果数组中元素不是 PromiseImpl 对象则会直接被兑现。

```js
class PromiseImpl {
   static allSettled(promises) {
      return new PromiseImpl((resolve) => {
         let count = promises.length;
         const results = new Array(count);

         // 每一个 Promise 落定时都会调用
         const onSettled = (state, value, idx) => {
            const resultKey = state === 'fulfilled' ? 'value' : 'reason';
            results[idx] = {
               state,
               [resultKey]: value,
            };
            // 当 count 为 0 时全部落定，兑现结果数组
            --count === 0 && resolve(results);
         };

         promises.forEach((promise, idx) => {
            // 如果不是 PromiseImpl 则直接兑现
            if (!(promise instanceof PromiseImpl)) {
                onSettled('fulfilled', promise, idx);
                return;
            }
            promise.then(
               (result) => onSettled('fulfilled', result, idx),
               (reason) => onSettled('rejected', reason, idx)
            );
         });
      });
   }
}
```

### Promise.all()

> `Promise.all()` 静态方法接受一个 `Promise` 可迭代对象作为输入，并返回一个 `Promise`。当所有输入的 `Promise` 都被兑现时，返回的 `Promise` 也将被兑现（即使传入的是一个空的可迭代对象），并返回一个包含所有兑现值的数组。如果输入的任何 `Promise` 被拒绝，则返回的 `Promise` 将被拒绝，并带有第一个被拒绝的原因。

`Promise.all()` 的实现思路总体来说与 `Promise.allSettled` 相似，只不过在遇到第一个拒绝的时候就可以直接拒绝，只有在全部兑现的时候兑现。

```js
class PromiseImpl {
   static all(promises) {
      return new PromiseImpl((resolve, reject) => {
         let count = promises.length;
         const results = new Array(count);

         // 每一个 Promise 落定时都会调用
         const onSettled = (state, value, idx) => {
            results[idx] = value;

            // 当全部兑现时兑现，任一个拒绝时拒绝
            if (--count === 0 || state === 'rejected') {
               status === 'fulfilled' ? resolve(results) : reject(value);
            }
         };

         promises.forEach((promise, idx) => {
            // 如果不是 PromiseImpl 则直接兑现
            if (!(promise instanceof PromiseImpl)) {
                onSettled('fulfilled', promise, idx);
                return;
            }
            promise.then(
               (result) => onSettled('fulfilled', result, idx),
               (reason) => onSettled('rejected', reason, idx)
            );
         });
      });
   }
}
```

### Promise.race()

> `Promise.race()` 静态方法接受一个 `promise` 可迭代对象作为输入，并返回一个 Promise。这个返回的 `promise` 会随着第一个 `promise` 的敲定而敲定。

在 `onSettled` 上做手脚使得其调用时立即返回结果即可。

```js
class PromiseImpl {
   static race(promises) {
      return new PromiseImpl((resolve, reject) => {
         // 只要 onSettled 被触发就会马上落定
         const onSettled = (status, value) => {
            status === 'fulfilled' ? resolve(value) : reject(value);
         };

         promises.forEach((promise, idx) => {
            if (!(promise instanceof PromiseImpl)) {
               onSettled('fulfilled', promise, idx);
               return;
            }
            promise.then(
               (result) => onSettled('fulfilled', result, idx),
               (reason) => onSettled('rejected', reason, idx)
            );
         });
      });
   }
}
```

### Promise.any()

> `Promise.any()` 静态方法将一个 `Promise` 可迭代对象作为输入，并返回一个 `Promise`。当输入的任何一个 `Promise` 兑现时，这个返回的 `Promise` 将会兑现，并返回第一个兑现的值。当所有输入 `Promise` 都被拒绝（包括传递了空的可迭代对象）时，它会以一个包含拒绝原因数组的 `AggregateError` 拒绝。

实现比较简单，不多赘述。

```js
class PromiseImpl {
   static any(promises) {
      return new PromiseImpl((resolve, reject) => {
         let count = promises.length;
         const reasons = new Array(count);

         // 只要任意一个兑现就会立刻返回，否则当所有拒绝之后拒绝为一个理由数组
         const onSettled = (status, value, idx) => {
            if (status === 'fulfilled') {
               resolve(value);
            } else {
               reasons[idx] = value;
               --count === 0 && reject(reasons);
            }
         };

         promises.forEach((promise, idx) => {
            if (!(promise instanceof PromiseImpl)) {
               onSettled('fulfilled', promise, idx);
               return;
            }
            promise.then(
               (result) => onSettled('fulfilled', result, idx),
               (reason) => onSettled('rejected', reason, idx)
            );
         });
      });
   }
}
```

以上就是所有 Promise 静态方法的实现，只不过此处没有实现一些比较新的 Promise 方法，我决定留到日后专门写文记录。

## 完整代码

```js
const __FINAL__ = Symbol();

class PromiseImpl {
   static PENDING = 0;
   static FULFILLED = 1;
   static REJECTED = 2;

   #status = PromiseImpl.PENDING;
   #settledValue = undefined;
   #onFulfilled;
   #onRejected;
   #thenResolve;
   #thenReject;

   constructor(executor) {
      try {
         executor(this.#resolve.bind(this), this.#reject.bind(this));
      } catch (err) {
         this.#reject(err);
      }
   }

   /// 私有方法

   #processPromiseResult(promise, callback) {
      promise.then(
         (result) => callback(result),
         (reason) => this.#rejectNext(reason)
      );
   }

   #resolve(value) {
      queueMicrotask(() => {
         let result;
         try {
            result = this.#onFulfilled ? this.#onFulfilled(value) : value;
         } catch (err) {
            this.#rejectNext(err);
            return;
         }

         const process = (result) => {
            if (result instanceof PromiseImpl) {
               this.#processPromiseResult(result, process);
               return;
            }

            this.#resolveNext(result);
         };

         process(result);
      });
   }

   #reject(reason) {
      queueMicrotask(() => {
         if (this.#onRejected) {
            try {
               reason = this.#onRejected(reason);
            } catch (err) {
               reason = err;
            }
         }

         const process = (reason) => {
            if (reason instanceof PromiseImpl) {
               this.#processPromiseResult(reason, process);
               return;
            }

            if (this.#onRejected && !this.#onRejected[__FINAL__]) {
               this.#resolveNext(reason);
            } else {
               this.#rejectNext(reason);
            }
         };

         process(reason);
      });
   }

   #rejectNext(reason) {
      this.#status = PromiseImpl.REJECTED;
      this.#settledValue = reason;
      this.#thenReject?.(reason);
   }

   #resolveNext(value) {
      this.#status = PromiseImpl.FULFILLED;
      this.#settledValue = value;
      this.#thenResolve?.(value);
   }

   /// 成员方法

   then(onFulfilled, onRejected) {
      this.#onFulfilled = onFulfilled;
      this.#onRejected = onRejected;

      if (this.#status === PromiseImpl.PENDING) {
         return new PromiseImpl((resolve, reject) => {
            this.#thenResolve = resolve;
            this.#thenReject = reject;
         });
      } else if (this.#status === PromiseImpl.FULFILLED) {
         this.#onFulfilled?.(this.#settledValue);
         return PromiseImpl.resolve(this.#settledValue);
      } else {
         this.#onRejected?.(this.#settledValue);
         return PromiseImpl.reject(this.#settledValue);
      }
   }

   catch(callback) {
      return this.then(null, (reason) => {
         const err = new Error(reason);
         callback(err);
      });
   }

   finally(callback) {
      const cb = (val) => {
         callback();
         return val;
      };
      cb[__FINAL__] = true;
      return this.then(cb, cb);
   }

   /// 静态方法

   static resolve(value) {
      return new PromiseImpl((res) => res(value));
   }

   static reject(reason) {
      return new PromiseImpl((_, rej) => rej(reason));
   }

   static all(promises) {
      return new PromiseImpl((resolve, reject) => {
         let count = promises.length;
         const results = new Array(count);

         const onSettled = (status, value, idx) => {
            results[idx] = value;

            if (--count === 0 || status === 'rejected') {
               status === 'fulfilled' ? resolve(results) : reject(value);
            }
         };

         promises.forEach((promise, idx) => {
            if (!(promise instanceof PromiseImpl)) {
               onSettled('fulfilled', promise, idx);
               return;
            }
            promise.then(
               (result) => onSettled('fulfilled', result, idx),
               (reason) => onSettled('rejected', reason, idx)
            );
         });
      });
   }

   static allSettled(promises) {
      return new PromiseImpl((resolve) => {
         let count = promises.length;
         const results = new Array(count);

         const onSettled = (status, value, idx) => {
            const resultKey = status === 'fulfilled' ? 'value' : 'reason';
            results[idx] = {
               status,
               [resultKey]: value,
            };
            --count === 0 && resolve(results);
         };

         promises.forEach((promise, idx) => {
            if (!(promise instanceof PromiseImpl)) {
               onSettled('fulfilled', promise, idx);
               return;
            }
            promise.then(
               (result) => onSettled('fulfilled', result, idx),
               (reason) => onSettled('rejected', reason, idx)
            );
         });
      });
   }

   static race(promises) {
      return new PromiseImpl((resolve, reject) => {
         const onSettled = (status, value) => {
            status === 'fulfilled' ? resolve(value) : reject(value);
         };

         promises.forEach((promise, idx) => {
            if (!(promise instanceof PromiseImpl)) {
               onSettled('fulfilled', promise, idx);
               return;
            }
            promise.then(
               (result) => onSettled('fulfilled', result, idx),
               (reason) => onSettled('rejected', reason, idx)
            );
         });
      });
   }

   static any(promises) {
      return new PromiseImpl((resolve, reject) => {
         let count = promises.length;
         const reasons = new Array(count);

         const onSettled = (status, value, idx) => {
            if (status === 'fulfilled') {
               resolve(value);
            } else {
               reasons[idx] = value;
               --count === 0 && reject(reasons);
            }
         };

         promises.forEach((promise, idx) => {
            if (!(promise instanceof PromiseImpl)) {
               onSettled('fulfilled', promise, idx);
               return;
            }
            promise.then(
               (result) => onSettled('fulfilled', result, idx),
               (reason) => onSettled('rejected', reason, idx)
            );
         });
      });
   }
}
```
