---
title: '最近做项目出现的一些问题'
description: '最近在做一个前端 OJ 项目，遇到了诸多奇葩的问题，在此记录。'
pubDate: 'Feb 04 2025'
heroImage: '/src/images/hero/hero-some-problems-with-recent-project.png'
---

### 最近

最近在开发一个前端 OJ 的后端，遇到了些许奇奇怪怪的问题，有的让我焦头烂额调试许久才得以解决。因此，我写这篇博客将他们记录下来。

#### 项目开源链接

GitHub: [quanta-frontend-challenge](https://github.com/still-soda/quanta-frontend-challenge)

### 问题

#### NestJS + Monorepo调用项目中的其他库报错

这个问题是在我打算构建 NestJS 项目的时候发现的，构建的时候莫名其妙爆出一段错误：

```bash
> @challenge/backend@0.0.1 start /Users/still-soda/代码库/project/quanta-frontend-challenge/packages/backend
> nest start

node:internal/modules/cjs/loader:1412
  throw err;
  ^

Error: Cannot find module '@challenge/utils'
Require stack:
- /Users/still-soda/代码库/project/quanta-frontend-challenge/packages/backend/dist/modules/judgements/core/flow-data/actions/mouse-flow-data.validator.js
- /Users/still-soda/代...
    at Function._resolveFilename (node:internal/modules/cjs/loader:1409:15)
    at default... {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/Users/still-soda/代码库/project/quanta-frontend-challenge/packages/backend/dist/modules/judgements/core/flow-data/actions/mouse-flow-data.validator.js'
    '...'
  ]
}

Node.js v23.6.0
 ELIFECYCLE  Command failed with exit code 1.
```

起因是我在 NestJS 项目中调用了另外一个工作区的模块，测试的时候一切正常，但是当我想要构建项目的时候就报了找不到模块的项目。

我查资料得知 `nest-cli.json` 配置文件中有个名为 `projects` 的配置，用来指定工作区中有哪些项目。但是很遗憾的是这个是用于多个 NestJS 项目的，我的另外一个模块是用原生 TS 写的，所以这个配置项对我的问题并没有帮助。

后来询问 AI，得知需要在 `tsconfig.json` 中配置 `compilerOptions.paths` 选项，于是我写了：

```json
{
  "compilerOptions": {
    // ...
    "paths": {
      "@challenge/utils": ["../../utils"]
    }
  }
}
```

继续进行构建运行，果真有效。然而却报了另外一个错误：

```bash
node:internal/modules/cjs/loader:1412
  throw err;
  ^

Error: Cannot find module '/Users/still-soda/代码库/project/quanta-frontend-challenge/packages/backend/dist/main'
    at Function._resolveFilename (node:internal/modules/cjs/loader:1409:15)
    at default... {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v23.6.0
 ELIFECYCLE  Command failed with exit code 1.
```

好家伙，还是找不到。但是这次比较好的地方是生成了 `dist` 打包目录。

报错说找不到 `dist/main` ，于是我看了一眼 `dist` 目录，发现其结构非常诡异：

```txt
dist/
├──packages
│   └──backend/
│       └──main.js
└──utils/
```

预期中，`dist` 文件夹中的内容应该是现在 `dist/packages/backend` 中的内容才对，但是实际上却多出了很多东西。

我心想：怎么把 `@challenges/utils` 也给编译过来了，不应该只是引用吗？然后又转念一想，NestJS 构建的时候肯定不会再把其他模块编译到它们所在的目录里面啊，因此只能编译到当前的构建目录，这个 `utils` 文件夹就是这样执行的产物。

那么解决方案就有了：**把模块在它所在的工作区先编译好，然后将模块指向它编译后的文件夹即可。**

于是转向 `@challenge/utils` 工作区，配置好 `tsconfig.json`，然后调用 `tsc` 将代码编译到 `dist` 文件夹，再在 `package.json` 中将 `main` 配置项指向 `dist/index.js`。回到 `@challenge/backend` 工作区再次构建运行，果然成功！构建产生的 `dist` 目录结构变成了 NestJS 项目的结构，看起来是正确引用了模块的编译结果。

然而然而，又又报错了：

```bash
node:internal/modules/esm/resolve:1000
    throw error;
    ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/still-soda/代码库/project/quanta-frontend-challenge/utils/dist/src/compare-chain' imported from /Users/still-soda/代码库/project/quanta-frontend-challenge/utils/dist/index.js
```

问题出在构建生成的 `index.js` 上，其内容为：

```js
export * from './src/compare-chain';
export * from './src/date';
export * from './src/uuid';
export * from './src/unit-parse';
export * from './src/event-emitter';
export * from './src/range';
export * from './src/data-structure-validator';
```

问题显而易见，这个文件路径明显不对，应该要以 `.js` 结尾但是却没有后缀名。ChatGPT 告诉我诸如 `export * from 'xxx` 的语句是不会被编译的，也就是说 `.ts` 文件里面长啥样编译后它就长啥样。解决方案显然就是修改 `index.ts` 的导出，将文件路径的后缀改为 `.js` （这样并不会影响 TS 的解析，这就叫智能）。

修改完成后重新打包模块，回到 `@challenge/backend` 重新构建运行，终于成功。

#### 多模块项目跑 Jest 测试报错

书接上文，在搞定构建问题之后，发现跑测试出现大量报错，在排除代码出现的问题后，我发现还有很多报错是长这样的：

```bash
● Test suite failed to run

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

    By default "node_modules" folder is ignored by transformers.

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option.

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/configuration
    For information about custom transformations, see:
    https://jestjs.io/docs/code-transformation

    Details:

    /Users/still-soda/代码库/project/quanta-frontend-challenge/utils/dist/index.js:2
    export * from './src/compare-chain.js';
    ^^^^^^

    SyntaxError: Unexpected token 'export'

      4 |   ScrollMouseFlowData,
      5 | } from './mouse-flow-data.type';
    > 6 | import {
        | ^
      7 |   $enum,
      8 |   $number,
      9 |   $object,

      at Runtime.createScriptFromCode (../../../../../../../../opt/homebrew/lib/node_modules/jest/node_modules/jest-runtime/build/index.js:1505:14)
      at Object.<anonymous> (modules/judgements/core/flow-data/actions/mouse-flow-data.validator.ts:6:1)
      at Object.<anonymous> (modules/judgements/core/flow-data/index.ts:6:1)
      at Object.<anonymous> (modules/judgements/core/flow-data/__tests__/mouse-flow-data.validator.spec.ts:1:1)
```

显然，Jest 不认我们模块的 `export` 语法。解决问题的一个万能公式是恢复到从前不报错的情况，那么已知：
- 在解决上一个问题前 Jest 直接引用了模块的 `.ts` 文件，可以运行；
- 解决上一个问题后，模块指向改变为原先模块构建生成的 `dist` 文件夹；

我们就得到了解决方法：重新将 Jest 的解析目标改变为模块的 `index.ts` 文件。

查询资料得知 Jest 配置文件中的 `moduleNameMapper` 配置项可以用于指定模块解析目标，那么只需要将 `package.json` 修改为：

```json
{
  "jest": {
    "moduleNameMapper": {
      "@challenge/utils": "<rootDir>/../../../utils/index.ts"
    },
    "resolver": "jest-ts-webcompat-resolver",
  }
}
```

然后安装 `jest-ts-webcompat-resolver`：

```bash
pnpm install --save-dev jest-ts-webcompat-resolver
```

再次运行测试，全部通过，爽！