---
title: 'Prisma ORM 入门教程'
pubDate: 'Jul 8 2025'
description: 'Prisma 是一个为 Node.js 和 TypeScript 设计的现代化 ORM 工具，提供直观的数据建模、自动化迁移和类型安全功能。通过 .prisma 文件定义数据模型后，Prisma 可自动生成 SQL 表结构和类型化客户端（Prisma Client）。其核心特性包括：自动化迁移（根据模型生成数据库结构）、类型安全（实时类型提示）以及关系管理（自动处理多对多关联）。安装使用只需通过 Prisma CLI 初始化项目，配置数据库连接，定义数据模型并运行迁移命令即可。此外，Prisma 还支持事务'
heroImage: '/src/images/hero/hero-prisma-orm-guide.png'
---

## Prisma 是什么？

Prisma 是一个现代化的 ORM（对象关系映射）工具，专为 Node.js 和 TypeScript 设计。它提供直观的数据建模方式、自动化迁移、类型安全和智能补全，极大地提升了数据库开发的效率和体验。

## Prisma 特性

### 自动化迁移

Prisma 内置了一套 DSL（领域特定语言），文件以 `.prisma` 为后缀，用于将 Prisma 模型映射到不同的数据库的数据库模式。开发者仅需编写 Prisma 模式文件，即可连接到不同的数据库，并对它们进行操作。

编写好 `.prisma` 文件后，只需指定你要连接的数据库类型（如 **SQLite**、**PostgreSQL** 等），Prisma 会根据定义自动生成对应的 SQL 表结构。

## 类型安全

在使用 `prisma generate` 命令生成 Prisma Client 时，Prisma 会自动从已经定义好的模式文件中提取类型，并生成对应的 `.d.ts` 文件，这样就可以在编码过程中实时地提供类型提示，确保类型安全。

Prisma Client 是由 `prisma generate` 命令更具你的 `.prisma` 文件生成的，所以模型改动后一定要重新生成。

## 开始使用

### 安装 Prisma CLI

首先需要安装 Prisma CLI：

```bash
npm install prisma typescript tsx @types/node --save-dev
```

然后运行 Prisma CLI 初始化项目：

```bash
npx prisma init --output ./generated/prisma
```

接着你会看到一个名为 `schema.prisma` 的 Prisma 模式文件生成在你项目的 `generated/prisma` 目录下，这就是我们需要的模式文件，接着完善模式文件。

### 配置数据库连接

通过创建 `.env` 文件，填入 `DATABASE_URL`，然后在 `.prisma` 文件中填写相应的数据库配置，如下所示：

```prisma
datasource db {  
	provider = "postgresql"  
	url = env("DATABASE_URL")  
}
```

其中：
- `provider` 是你想要使用的数据库，如 SQLite、PostgreSQL、MySQL 等等。
- `url` 是数据库连接。

### 完善模式文件

你可以在 Prisma 文件中编写数据模型，语法与创建数据表的 SQL 差不多。下面是一个 Prisma 文件示例：

```prisma
model Post {  
	id        Int      @id @default(autoincrement())  
	createdAt DateTime @default(now())  
	updatedAt DateTime @updatedAt  
	title     String   @db.VarChar(255)  
	content   String?  
	published Boolean  @default(false)  
	author    User     @relation(fields: [authorId], references: [id])  
	authorId  Int  
}  
  
model Profile {  
	id     Int     @id @default(autoincrement())  
	bio    String?  
	user   User    @relation(fields: [userId], references: [id])  
	userId Int     @unique  
}  
  
model User {  
	id      Int      @id @default(autoincrement())  
	email   String   @unique  
	name    String?  
	posts   Post[]  
	profile Profile?  
}
```
其中 `model` 关键字用于定义数据表，数据表的三列分别是：字段名、字段类型、字段属性。

常用的字段属性有：

- `@id` 用于指定主键
- `@unique` 用于标记该字段的值是 value
- `@default(value)` 用于指定默认值为 value
- `@now` 代指创建数据时的时间
- `@updatedAt` 代指更新数据时的时间
- `@autoincrement()` 用于创建一个自动自增的数字
- `@relation(fields: [...self_keys], references: [...foreign_keys])` 用于控制关系行为，指定外键，将每个自身的 self_key 字段关联到对应的 foreign_key 字段上

这里创建了一个用户 - 用户资料 - 帖子的关系数据表。这里需要提到的是，如果你在 Prisma 模式文件中指明了多对多关系，那么 Prisma 会自动创建相应的中间表，当然这个默认行为可以被显示阻止，并替换为响应的自定义表。

在 Prisma 中，默认关系是双向的，例如这里的 User 模型中的 `posts Post[]` 没有使用 `@relation()` 属性约束，因此即可以通过 User 访问 Post，也可以通过 Post 访问对应的 User。可以通过 `@relation()` 控制其行为。

### 运行数据迁移

运行以下命令将数据模型映射到数据库模式：

```bash
npx prisma migrate dev --name init
```

这个命令主要干了两件事：

1. 为此次迁移创建一个新的 SQL 迁移文件。
2. 对数据库运行这个 SQL 文件来完成迁移。

然后你就会发现数据库中多了三张表，迁移完成。

### 安装 Prisma/Client

要想在 TypeScript 中使用 Prisma，我们需要安装 `@Prisma/Client`（上面安装的是 Prisma CLI）。运行命令：

```bash
npm install @prisma/client
```

然后运行 `prisma generate` 命令，它会读取 Prisma 模式文件并生成 Prisma Client：

```bash
npx prisma generate
```

需要注意的是，当你每次运行 `prisma generate` 的时候，实际上是 Prisma 在根据**当前**的 Prisma 模式文件定制 TypeScript 代码，即 Prisma Client。所以当你修改了你的 Prisma 模式文件，你必须重新运行 `prisma generate` 来更新 Prisma Client。如果你修改的模式文件影响到了数据库，那么你必须重新运行 `prisma migerate` 来将 Prisma 模式文件应用到数据库模式。

![Prisma 工作原理图示](/images/prisma-orm-guide/1.png)

你可以将这些操作写在 `packages.json` 的 `scripts` 中以方便未来调用。

```json
{
	// ...
	"scripts": {
		"migrate": "prisma migrate dev --name init",
		"generate": "prisma generate"
	},
	// ...
}
```

然后就可以通过简单运行 `npm run migerate` 和 `npm run generate` 来重新运行命令。

### 在 TypeScript 中查询数据库

接下来我们创建 `index.ts` 文件，并使用 Prisma Client 编写一个简单的创建和查询。

```typescript
// 导入 Prisma Client
import { PrismaClient } from './generated/prisma'  
// 创建 Prisma Client
const prisma = new PrismaClient();

async function createUsers() {
	// 使用一个语句同时创建三条数据
	await prisma.user.create({
		data: {  
			name: '张三',  
			email: 'zhangsan@prisma.io',  
			// 同时创建帖子和资料
			posts: {  
				create: { title: '你好' },  
			},  
			profile: {  
				create: { bio: ' 我是人' },  
			},
		}
	});
}

async function queryUsers() {
	// 查询所以用户的同时联合他们的帖子和资料
	const allUsers = await prisma.user.findMany({
		include: {
			posts: true,
			profile: true,
		}
	});
	console.log(allUsers);
}
  
async function main() {
	// 等待连接数据库
	await prisma.$connect()  
	await createUsers();
	await queryUsers();
}  
  
main()  
	.then(async () => {  
		// 执行完成后关闭连接
		await prisma.$disconnect()  
	})  
	.catch(async (e) => {  
		console.error(e)  
		await prisma.$disconnect()  
		process.exit(1)  
	});
```

运行程序，你就可以在数据库中插入了以下数据：

| **id** | **email**            | **name** |
| ------ | -------------------- | -------- |
| 1      | "zhangsan@prisma.io" | "张三"   |

| id  | createdAt                | updatedAt                | title  | content | published | authorId |
| --- | ------------------------ | ------------------------ | ------ | ------- | --------- | -------- |
| 1   | 2025-07-08T16:45:01.246Z | 2025-07-08T16:45:01.246Z | "你好" | null    | false     | 1        |

| **id** | **bio**  | **userId** |
| ------ | -------- | ---------- |
| 1      | "我是人" | 1          |

## 其他功能

### 事务

可以通过 `prisma.$transcation` 来开启事务，并在回调中进行一系列操作：

```typescript
const prisma = new PrismaClient();

await prisma.$connect();

prisma.$transaction(async (tx) => {
	await tx.user.create({
		data: {
			name: 'Alice',
			email: 'alice@example.com'
		}
	});
});

await prisma.$disconnect();
```

### 监听数据库事件

可以通过 `prisma.$on(event_name, event_handler)` 来监听对应的数据库事件。

```typescript
prisma.$on('query', (e) => {
	console.log('Query:', e.query);
});
prisma.$on('info', handler);
prisma.$on('warn', handler);
prisma.$on('error', handler);
```

### 内置数据表查看器

你可以通过 `prisma studio` 来在浏览器启动内置的数据表查看器。

```bash
npx prisma studio
```

### 直接推送更改

相比起 `prisma migrate` 会生成一个 SQL 历史文件，如果你想要直接修改数据表，你可以使用 `prisma db push`，以下是特性对比：

| 功能                  | `prisma db push` | `prisma migrate`  |
| --------------------- | ---------------- | ----------------- |
| 是否生成 SQL 迁移文件 | ❌                | ✅                 |
| 是否保存迁移历史      | ❌                | ✅                 |
| 是否自动生成数据表    | ✅                | ✅                 |
| 会不会丢失已有数据    | ⚠️可能            | ✅                 |
| 是否用于生产环境      | ⚠️慎用            | ✅                 |
| 速度                  | 快               | 慢                |
| 推荐场景              | 本地开发快速迭代 | 正式开发/部署上线 |

## 总结

Prisma 是一个现代化的、简单易用的 ORM，它允许我们通过编写 Prisma  模式来创建和迁移数据表，并且通过自动生成的 Prisma Client 来在 TypeScript 中操作数据库，从此再也不用担心字段拼错、类型不对、SQL 写崩……你只需要专注写模型。这些特性使得它在现代全栈开发中占据重要地位。