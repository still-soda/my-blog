---
title: 'Object 和 Map 的区别'
description: '本文将会讲解 Object 和 Map 的区别'
pubDate: 'Mar 2 2025'
heroImage: '/src/images/hero/hero-diff-between-object-and-map.png'
---

### Object

#### 字面量形式

Object 对象可以通过 `{}` 字面量来创建，但是用字面量进行创建的Object对象会附带 Object 原型的方法，比如 `hasOwnPropertyOf` 等等，如果用这种对象来代替 Map 的话，有可能会发生冲突。

此外，Object 对象只能以 `String` 和 `Symbol` 作为 key，如果你尝试将数组设为它的 key，那么它会调用数组的 `toLocaleString` 方法将其转化为字符串，再作为 key。

#### 使用 Object.create(null)

要避免上面提到的第一个问题，我们可以使用 `Object.create(null)` 来创建一个空对象，这样相比于用字面量创建的对象更适合作为 Map，因为它不会继承 Object 原型上的方法，但是这也有可能成为其缺陷。

### Map

可以通过 `const map = new Map()` 来创造一个 Map 对象，并使用其自带的 **操作方法** 来操作表内容，这是与 Object 对象的第一个区别。

Map 对象的初始化是通过在构造函数中传入一个数组来实现的：

```js
const map = new Map([
    ['key1', 'value1'],
    ['key2', 'value2']
]);
```

这与 Object 也有区别。

最后，Map 允许使用任何类型的值作为 key，但是需要注意的是不应该随意使用引用类型作为 key，不然可能会导致内存泄漏。这种情况下应该使用 `WeakMap API` 来代替 Map。

### 总结

Object 与 Map 都可以被当作哈希表使用，但是 ES6 后，我们可以选择 Map 来创建更加纯粹的哈希表。
