---
title: '你好，TypeScript'
description:
   '我将在本文中详细介绍为什么学习 TypeScript，以及 TypeScript 的基础、高级知识。'
pubDate: 'Jun 08 2025'
heroImage: '/src/images/hero/hero-hello-typescript.png'
---

在稍大一些的前端项目开发中，我们不得不承认 —— 「写 JavaScript 是自由的，写 TypeScript 是安心的。」

![typescript](/images/hello-typescript/1.png)

## 为什么学习 TypeScript？

JavaScript 十分灵活，但也很“随意”：变量类型可以随意改变，函数调用时参数可以缺失却不报错，项目一旦变大就容易让人头疼。

于是 TypeScript 应运而生。它具备以下特点：

-  JavaScript 的超集（既能写 JS，也能写更多）
-  引入类型系统，帮你**提前发现错误**
-  被众多框架采用（如 Vue、React 生态均支持）

![演示](</images/hello-typescript/2.gif>)

如今，最新的 NodeJS 以及主流的 JavaScript 运行时（如 Bun 和 Deno）都已原生支持 TypeScript，可以直接运行 TS 代码。

## TypeScript 基本语法

TypeScript 的基础用法与其他强类型语言类似。在 C++ 中，你通过前置类型来声明变量类型和函数返回值：

```c++
int num = 20;
int add(int a, int b) {
    return a + b;
}
```

而在 TS 中，你使用**后置类型**来声明变量类型和函数返回值：

```typescript
// 定义变量
//（此处可以省略 number，因为 TS 会自动推断类型）
const num: number = 20;
// 定义函数：返回类型写在括号后
//（此处可以省略 string，因为 TS 会自动推断类型）
function add(a: number, b: number): string {
    return String(a + b);
}
```

你可以使用 `type` 或 `interface` 关键字来定义类型或接口。不同之处在于，`interface` 只能用于对象结构：

```typescript
type Union = string | number;   // 字符串或数字
type Name = 'Alice' | 'Bob';    // 字符串字面量
type Foo = {    // 对象结构
    a: number;
    b: string;
}

interface Bar { // 对象结构
    a: number;
    b: string;
}
```

你可以用 `keyof` 获取对象的键，用 `A[B]` 访问对象对应键的类型：

```typescript
type Foo = {
    a: number;
    b: string;
    c: boolean;
}

type Keys = keyof Foo;
// 结果相当于：
// type Keys = 'a' | 'b' | 'c';

Foo['a'];       // number
Foo['b'];       // string
Foo['a' | 'b']; // number | string
Foo[Keys];      // number | string | boolean
```

你可以用 `|` 表示**联合类型**（即可以为多个类型之一）：

```typescript
let foo: number | string = 20;
foo = 'hello';	// OK
foo = {};		// ⚠ 不允许
```

你可以用 `&` 表示**交叉类型**（即合并多个对象类型的字段）：

```typescript
type Foo = { a: number };
type Bar = { b: string };
type Cross = Foo & Bar;
// 结果相当于：
// type Cross = {
//     a: number;
//     b: string;
// }
```

在对象类型的 `:` 前加上 `?`，表示该字段**可选**：

```typescript
type Foo = { a: number };
const foo: Foo = {}; // 不允许，a 必须存在

type Bar = { a?: number };
const bar: Bar = {}; // OK，a 可选
```

## 重新认识类型系统

如果你学过 C、C++ 或 Java 等强类型语言，对它们的类型系统应该不陌生。相比之下，TS 的类型系统更为强大。

学习 TypeScript 时，你可以把它的类型系统看作一门独立的语言：拥有独立的运算逻辑和工作原理。

在 JavaScript 中，我们可以在语法层面定义函数：

```js
function add(a, b) {
    return a + b;
}
```

而在 TypeScript 中，我们甚至可以在类型层面定义“函数”！

```typescript
type Result<Name extends 'a' | 'b'> =
	Name extends 'a'
		? number
		: string;
```

是不是感觉有点绕？没关系，接下来我们从头学习 TypeScript 超强的类型系统。

## 基础运算

TypeScript 自带以下类型工具：

| 工具类型                   | 含义                                |
| :------------------------- | ----------------------------------- |
| `Partial<T>`               | 将 `T` 中的属性全部变为可选         |
| `Required<T>`              | 将 `T` 中的属性全部变为必填         |
| `Readonly<T>`              | 将所有属性设为只读                  |
| `Pick<T, K>`               | 从 `T` 中选出指定属性               |
| `Omit<T, K>`               | 从 `T` 中排除指定属性               |
| `Record<K, T>`             | 构建以 `K` 为键、`T` 为值的对象类型 |
| `ReturnType<T>`            | 获取函数类型 `T` 的返回值类型       |
| `Parameters<T>`            | 获取函数参数类型组成的元组          |
| `ConstructorParameters<T>` | 获取构造函数的参数类型              |
| `InstanceType<T>`          | 获取构造函数返回的实例类型          |
| `Awaited<T>`               | 获取 `Promise-like` 类型的结果      |

下面一一举例说明：

### 适用于对象的运算

1.  `Partial<T>`
2.  `Required<T>`
3.  `Readonly<T>`
4.  `Pick<T, K>`
5.  `Omit<T, K>`
6.  `Record<K, T>`

```typescript
interface Foo {
    a: number;
    b: string;
    c?: Array<number>;
}

// Partial<T>，所有属性变为可选
type PartialFoo = Partial<Foo>;
// 结果相当于：
// type PartialFoo = {
//     a?: number;
//     b?: string;
//     c?: Array<number>;
// }

// Required<T>，所有属性变为必选
type RequiredFoo = Required<Foo>;
// 结果相当于：
// type RequiredFoo = {
//     a: number;
//     b: string;
//     c: Array<number>;
// }

// Readonly<T>，所有属性变为只读
type ReadonlyFoo = Readonly<Foo>;
// 结果相当于：
// type ReadonlyFoo = {
//     readonly a: number;
//     readonly b: string;
//     readonly c?: Array<number>;
// }

// Pick<T, K>，提取 K 属性
type PickFoo = Pick<Foo, 'a' | 'b'>;
// 结果相当于：
// type PickFoo = {
//     a: number;
//     b: string;
// }

// Omit<T, K>，删除 K 属性
type OmitFoo = Omit<Foo, 'a' | 'b'>;
// 结果相当于：
// type OmitFoo = {
//     c?: Array<number>;
// }

// Record<K, T>
type StrToNum = Record<string, number>;
// 键为字符串，值为数字的类型
const obj: StrToNum = {
    a: 1,
    b: 2,
}
```

### 适用于函数的运算

1. `ReturnType<T>`
2. `Parameters<T>`

```typescript
function func(a: number, b: number): string {
    return 'hello world';
} 

// ReturnType<T>
type Result = ReturnType<typeof func>;
// 结果相当于：
// type Result = string;

// Parameters<T>
type Params = Parameters<typeof func>;
// 结果相当于：
// type Params = [number, number];
```

### 其他运算

1. `ConstructorParameters<T>`
2. `InstanceType<T>`         
3. `Awaited<T>`              

**前两个用于类：**

```typescript
class Bar {
    constructor(a: number) {}
}

// ConstructorParameters<T>
type BarParams = ConstructorParameters<typeof Bar>;
// 结果相当于：
// type BarParams = [number];

// InstanceType<T>
type BarInstance = InstanceType<typeof Bar>;
// const bar = new Bar;
// ✅ typeof bar extends BarInstance
```

**最后一个用于 PromiseLike 类型：**

```typescript
type Foo = Promise<number>;
type ResolveType = Awaited<Foo>;
// 结果相当于去掉 Promise：
// type ResolveType = number;
```

## 高级运算

在 TypeScript 中，你还可以进行一系列复杂的类型运算，通常称为“类型体操”。

### 定义变量（泛型）

在编程语言中都可以定义变量。在 JS 中你用 `let`、`const` 等关键字，而在 TypeScript 中则通过“泛型”来定义未知类型，这些泛型就像变量。例如：

```typescript
type Nullable<T = any> = T | null;
```

这里 `T` 是泛型参数，`Nullable` 是类型函数（类型运算），它将传入的类型 `T` 与 `null` 组合，返回 `T | null`。你可以这样使用：

```typescript
type NullableNumber = Nullable<number>;
```

此时 `number` 就像函数参数一样传入 `Nullable`，返回 `number | null`。

当然也可以定义多个泛型、指定类型范围、设置默认类型等：

```typescript
// 定义多个泛型，T、K、P
type Foo<T, K, P> = /* ... */ 

// 指定类型范围，T 只能是 number 或 string
type Bar<T extends number | string> = /* ... */ 

// 默认类型，默认为 number
type Dog<T = number> = /* ... */
```

### 条件运算

TypeScript 类型系统也支持条件运算。不同于其他语言的 `if (A in B) C else D`，TS 使用 `A extends B ? C : D`，类似三目运算符。

**示例：**

```typescript
type Foo<T extends '1' | '2'> =
    T extends '1'? number : string;
```

这段类型运算指定泛型 `T` 只能为 `'1'` 或 `'2'`，并根据 `T` 的值返回 `number` 或 `string` 类型。

条件判断还可以嵌套：

```typescript
type Foo<T extends '1' | '2' | '3'> =
    T extends '1'
        ? number 
        : T extends '2'
            ? string
            : object;
```

### infer 类型推导

`infer` 可以用于在特定的类型结构中推导出其中的某一类型。

![Infer功能](/images/hello-typescript/3.png)  

**提取类型：**

有时你想从一个类型中提取特定类型，例如：

```typescript
type Foo = (number | string)[];
```

你想提取数组元素类型而不是数组本身，这时可以用 `infer` 关键字：

```typescript
type ArrayType<T extends any[]> =
    T extends (infer R)[] ? R : unknown;
```

这段类型运算的含义是：

> `T` 至少是一个数组。
>
> 如果 `T` 符合 `R[]` 结构，则返回 `R`，否则返回 `unknown`。

**字符串运算：**

`infer` 还可以用于字符串类型的提取：

```typescript
type FirstLetter<S extends string> =
    S extends `${infer First}${infer Rest}`
        ? First
        : '';

type Foo = FirstLetter<'Hello'>;
// 结果相当于：
// type Foo = 'H';
```

既然你已经知道如何用 `infer` 提取字符串了，接下来看看如何从请求 URL 中提取 Query 参数吧！

#### 案例：提取 Query 参数

```typescript
type Query<T extends string, O extends string = never> = 
    T extends `${infer _}?${infer Q}`
        ? Query<Q>
        : T extends `${infer K}=${infer V}&${infer Rest}`
            ? Query<Rest, O | K>
            : T extends `${infer K}=${infer V}`
                ? { [K in O | K]: string }
                : {}

type Args = Query<'www.example.com/api?a=20&b=hello'>;
// 结果相当于：
// type Args =  {
//     a: string;
//     b: string;
// }
```

实现思路：

1. 定义 `T` 为传入的 URL 字符串；
2. 定义 `O` 用于收集参数名，默认为 `never`；
3. 如果符合 `K=V&R` 格式：
   1. 提取 `K` 和 `Rest`，丢弃 `V`；
   2. 将 `K` 与 `O` 联合，相当于把 `K` 放入 `O`，递归处理 `Rest`；
4. 如果符合 `K=V` 格式：
   1. 用 `O` 构建一个键值记录，键为所有参数名，值为 `string`；
5. 否则返回空对象。

是不是有点难？尤其是 `{ [K in O | Name]: string }` 看不懂？那就来看看对象运算吧。

### 对象运算

JS 中经常用到对象类型，在 TS 中进行对象运算也不复杂。

**构建带特定字段的记录：**

*TS 中的键值表称为记录（Record）*

```typescript
type Props = 'foo' | 'bar';

type Obj = {
    [K in Props]: number;
}
// 结果相当于：
// type Obj = {
//     foo: number;
//     bar: number;
// }
```

**过滤记录中的键**

可以用 `as` 关键字配合特殊运算过滤记录的键。你可以把 `as` 后的操作理解为对键的处理。

例如，只保留类型为 `string` 的键：

```typescript
type Foo = {
    a: number;
    b: string;
    c: string;
    d: boolean;
}

type Bar = {
    [K in keyof Foo as Foo[K] extends string ? K : never]: Foo[K]
}
// 如果 K 为 never，表示不存在该键，相当于被过滤掉
//
// 结果相当于：
// type Bar = {
//     b: string;
//     c: string;
// }
```

**只保留 `a` 和 `d` 字段：**

```typescript
type Foo = {
    a: number;
    b: string;
    c: string;
    d: boolean;
}

type Bar = {
    [K in keyof Foo as K extends 'a' | 'd' ? K : never]: Foo[K]
}
// 如果 K 为 never，表示不存在该键，相当于被过滤掉
//
// 结果相当于：
// type Bar = {
//     a: number;
//     d: boolean;
// }
```

## 写在最后

> 类型是你的朋友，不是负担。

到这里，我们已经初步领略了 TypeScript 类型系统的强大之处:它可以像函数一样**组合和传递类型**，也能做“数学”一样的**逻辑判断和运算**，还能像正则一样**提取字符串和数组的结构，甚至可以构造、映射、过滤出你想要的对象类型。

**TypeScript 的类型不是单纯地“写个类型”那么简单，而是一整套强大、灵活、抽象能力极强的语言系统。**

对于前端开发者来说，TS 既能减少调试时间，也能提高重构效率，更能让你在团队协作中如虎添翼！

未来如果你想深入探索，也可以去 GitHub 上搜索 `type-challenge`，尝试一下[类型体操挑战](https://github.com/type-challenges/type-challenges)，一定会有所收获。