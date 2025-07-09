---
title: 'tRPC 入门学习（一）'
pubDate: 'Jul 9 2025'
description: 'tRPC 是个相当不错的全栈开发工具，这篇博客介绍了 tRPC 最基础最入门的用法,适合 tRPC 入门学习.'
heroImage: '/src/images/hero/hero-trpc-learn-1.png'
---

## tRPC 是什么？

### 背景

随着类型安全和静态类型日益成为现代 Web 开发的最佳实践，API 约定成为了一个主要痛点。在以往的全栈开发中，API 端点的数据类型无法在服务端和客户端之间共享。人们意识到在使用 TypeScript 作为**唯一**语言的全栈开发中，可以通过后端导出类型，前端应用类型的方式来统一 API 端点类型，从而大幅减少 API 对接所耗费的精力和时间。因此 tRPC 应运而生。

### 为什么选择 tRPC

在以往（甚至是现在），GraphQL 被视作是实现类型安全 API 的主要方式。但是由于 GraphQL 被设计为语言无关的形式（即任何语言都通用），因此无法充分利用到到 TypeScript 的类型优势。

使用 tRPC，你可以通过在服务端定义 API 端点的同时导出类型，并在客户端中通过这些类型像本地调用一样使用这些 API。

![[/images/trpc-learn/1.png]]

此外 tRPC 还有 **自动合并请求(Batch)** 等功能，可以自动帮助开发者优化查询过程。

## 安装 tRPC

要在你的 TypeScript 全栈项目中使用 tRPC，只需要安装 `@trpc/server` 和 `@trpc/client` 软件包即可。

```bash
npm install @trpc/server @trpc/client
```

## 开始使用 tRPC

### 服务端

要在服务端配置 tRPC，你只需要完成以下几个步骤：

1. 创建路由实例；
2. 添加查询和修改过程；
3. 导出路由类型；
4. 监听端口。

#### 创建路由实例

一般情况下，我们会将 tRPC 实例与路由分离，在新建的 trpc.ts 文件中，我们创建路由实例并导出可供路由定义使用的 `router` 和 `procedure` 方法。

```typescript
// trpc.ts
// 创建 tRPC 实例
const t = initTRPC.create();
// 导出定义路由所需方法
export router = t.router;
export publicProcedure = t.procedure;
```

#### 添加查询和修改过程

接下来我们将在 `route.ts` 中定义一个最简单的查询 API `/hello`，它将获取传入的 `name` 参数，并返回 `Hello, {{name}}`。

```typescript
// route.ts
import z from 'zod'
import { router, publicProcedure } from './trpc.ts'

const appRouter = router({
	// 定义 /hello 端点，使用 zod 来限制输入类型为 string
	hello: publicProcedure.input(z.string()).query((opt) => {
		const name = opt.input;
		return {
			greet: `Hello, ${name}`
		}
	})
});
```

这里我们使用了 `zod` 这个工具库进行数据验证，`zod` 是现代 TypeScript 中常用的类型工具，它提供了类型验证和自动 TypeScript 断言的功能，使得类型安全不仅存在于使用 TypeScript 的开发过程中。这里的 `z.string()` 表示输入是一个字符串，你也可以使用 `z.object(...)` 、 `z.enum(...)` 和 `z.number()` 等等来限制输入类型。

一般情况下，使用 `query()` 方法来定义查询端点，用 `mutate` 来定义修改端点 —— 尽管这两个方法在服务端上的行为并没有任何区别，但是主要是用于语义化地区分 API 行为。

```typescript
// 使用 .mutate 来定义修改端口
const appRouter = router({
	// ...
	update: publicProcedure.input(z.string()).mutate((opt) => {
		// 执行更新操作...
	})
});
```

#### 导出路由实例和类型

在 `route.ts` 的最后，我们导出路由类型和路由实例，以便于创建服务器和在客户端上使用 tRPC。

```typescript
// route.ts
// ...

// 导出路由类型，供客户端使用
export type AppRouter = typeof appRouter;

// 导出路由实例，供启动 tRPC 服务器使用
export appRouter;
```

#### 启动服务器

我们在新建的 `server.ts` 中，通过 `route.ts` 导出的 `appRouter` ，并且使用 `createTRPCServer` 来创建一个 tRPC 服务器。

```typescript
// server.ts
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import appRouter from './route';  

const server = createHTTPServer({
	// 使用导出的 API 路由
	router: appRouter,
});

// 监听 3000 端口，启动服务器
server.listen(3000);
```

### 客户端

在客户端中使用 tRPC 更加简单，只需要创建 tRPC Client，并且使用服务端导出的 AppRouter 作为类型即可。

```typescript
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './route';

// 创建 tRPC Client，并导入服务器导出的 AppRouter 类型
const trpc = createTRPCClient<AppRouter>({
	// 你可以将 links 看作请求管道，
	// 请求会按列表顺序从上到下执行
	links: [
		httpBatchLink({
			url: 'http://localhost:3000/trpc',
		}),
	],
});

// 使用与服务端的定义几乎一致的方式进行请求
// 就好像本地调用
trpc.hello.query('Mike').then((response) => {
	console.log(response); // 输出：Hello, Mike
});
```

你可以发现 `response` 的类型是 string ，这是因为 tRPC 通过 TypeScript 的类型系统确保了类型安全。至此你就完成了这个最入门的教学。

## 总结

tRPC 是个相当不错的全栈开发工具，这篇博客介绍了 tRPC 最基础最入门的用法，接下来我将会继续介绍 tRPC 的其他特性，欢迎订阅收看。
