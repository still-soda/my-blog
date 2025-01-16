---
title: '把 VSCode 中的颜色指示器改成圆角的一种办法'
description: '本文讲述了如何对 VSCode 中丑到爆的矩形颜色指示器进行样式修改。'
pubDate: 'Jul 27 2024'
heroImage: '/src/images/hero/hero-a-way-to-change-the-color-indicator-to-rounded-corners.png'
---

## 起因

![image-20240727161123782](https://cos1-1322468699.cos.ap-guangzhou.myqcloud.com/img/202407271616395.png)

真的是受不了 VSCode 丑到爆的矩形颜色指示器了，想起 VSCode 其实是 electron 开发
的，自然其中所有的样式都能调整，于是开始着手修改。

## 修改方法

1. 在插件市场中安装 `Custom CSS and JS Loader` 插件，这个插件可以允许我们自定义
   VSCode 中的样式；

2. 找到 `workbench.desktop.main.css` 这个文件，可以直接拿 `everything` 搜到。如
   果要自己找，这个文件放在
   `C:\Users\用户名\AppData\Local\Programs\Microsoft VS Code\_\resources\app\out\vs\workbench`
   下（我的是这样）；

3. 打开 `workbench.desktop.main.css`，在最后面插入以下 CSS 代码：

   ```css
   .ced-1-TextEditorDecorationType52-3::before {
      border-radius: 35% !important;
   }

   .colorpicker-color-decoration {
      border-radius: 35% !important;
   }

   .colorspan {
      border-radius: 35% !important;
      border-color: white !important;
   }
   ```

4. 保存文件；

5. 重启 VSCode；

## 效果

![image-20240727161315236](https://cos1-1322468699.cos.ap-guangzhou.myqcloud.com/img/202407271616027.png)

看起来舒服多了~ 😋

要想修改 VSCode 的其他样式，可以先通过 VSCode 左上角 `帮助 > 切换开发者工具` 打
开开发者工具，然后定位到想修改的元素，找到对应的类名，最后在
`workbench.desktop.main.css` 中修改即可。

（ps：建议把修改的样式保存在单独的文件备份起来，因为每次更新 VSCode 后这个文件都
会重置）
