---
title: '编写一个简单的Vite插件'
description: '最近在开发项目的过程中，我在 index.ts 导出模块时发现了一个略显麻烦的小问题，于是我决定编写一个 Vite 插件来帮助我自动化地处理这个问题。'
pubDate: 'Feb 12 2025'
heroImage: '/src/images/hero/hero-write-a-simple-vite-plugin.png'
---

### 事情的经过……

是这样的，最近在开发项目时遇到了一个看起来简单但是又没有很好解决方法的小问题：当我用 `index.ts` 导出模块时，默认的补全是不带有后缀的，这其实没什么问题。但是当我使用 `tsc` 构建之后，我发现在产生的 `index.d.ts` 里面，路径依然是无后缀形式。

我的 NestJS 工程并不认这些无后缀的路径，在我想要构建 NestJS 工程时它会抛出错误，内容大概是找不到路径对应的文件（因为没有后缀所以搜不到），这就让我很烦。

### 尝试解决

🤔我先后想到了三个方法：
1. 方法一，就是在每次构建完后手动去修改构建出来的文件，但是这样太过于繁琐，而且也不利于后续的维护。
2. 方法二，我直接把 `index.ts` 中的路径后面加上 `.js` 这样打包出来的 `.d.ts` 文件里面，路径的后缀也是 `.js` 了。
3. 方法三，编写一个 Vite 插件帮助我自动在将生成的 `.d.ts` 文件里面的路径加上 `.js` 后缀。

我没有尝试方法一，我觉得这绝对是个十分~~傻逼~~低效率的做法。

最开始我尝试的是方法二，但是后面我发现这样测试就跑不了了，会报错，就很烦😅。（其实只有在 Windows 上会这样，原来在 Mac 上是没问题的，估计是 Jest 在两端的表现不一样）

毫无疑问，接下来要尝试方法三了。

### 编写一个 Vite 插件

插件的开发思路倒也很简单：拦截到生成的 `.d.ts` 产物，然后用正则表达式匹配里面的导入路径，检查路径是否以 `.js` 结尾，如果是就不修改，否则加上 `.js` 后缀。

那么，上代码：

```typescript
// src/plugins/add-js-extension-plugin.ts
import { Plugin } from 'vite';

export default function addJsExtensionPlugin(): Plugin {
   return {
      name: 'add-js-extension',
      generateBundle(_, bundle) {
        // 对于每个产物
         Object.values(bundle).forEach((chunk: any) => {
            // 如果是以 .d.ts 结尾的话，就进行替换
            if (chunk.fileName.endsWith('.d.ts') && chunk.source) {
               chunk.source = addJsExtension(chunk.source);
            }
         });
      },
   };
}

function addJsExtension(code: string): string {
    // 使用正则表达式直接替换
   const transformed = code.replace(/export \* from '(.+)';/g, (match, p1) => {
      return p1.endsWith('.js') ? match : `export * from '${p1}.js';`;
   });
   return transformed;
}

```

然后在 `vite.config.ts` 中应用它：

```typescript
export default defineConfig({
    plugins: [
        // ...
        addJsExtension(),
    ],
    // ...
});
```

然后启动 `npx vite build` 开始构建，检查产物，果然有了 `.js` 后缀！

自此，问题顺利解决。

### 总结

Vite 可以做的远不止这些，这玩意可真是个好东西😋