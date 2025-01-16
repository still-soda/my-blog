---
title: '解决部分浏览器中出现的文字自动换行问题'
description:
   '解决 HTML + TailwindCSS 文本在老旧浏览器上最后一个字自动换行的问题。'
pubDate: 'Jul 23 2024'
heroImage: '/src/images/hero/hero-solving-text-wrap-problem.png'
---

### 问题

最近我在使用 TailwindCSS+ Next.js 进行开发的时候，出现了一些奇怪的问题：我的导航栏在夸克等内核较为老旧的浏览器展现时，标题会在最后一个字的时候自动换行，并且无论其长度如何改变，它都坚持在最后一个字换行。

![image-20240723184904512](https://cos1-1322468699.cos.ap-guangzhou.myqcloud.com/img/202407231853715.png)

代码：

```html
<div
   className="text-lg left-0 md:relative
        font-normal tracking-wide hidden md:flex
        absolute transition text-nowrap">
   still-soda 的个人博客
</div>
```

### 解决

`text-nowrap` 存在兼容性问题，加上 `whitespace-nowrap` 即可。

![image-20240723185342670](https://cos1-1322468699.cos.ap-guangzhou.myqcloud.com/img/202407231853704.png)

```html
<div
   className="text-lg left-0 md:relative 
	    whitespace-nowrap font-normal 
    	tracking-wide hidden md:flex absolute 
	    transition text-nowrap">
   still-soda 的个人博客
</div>
```
