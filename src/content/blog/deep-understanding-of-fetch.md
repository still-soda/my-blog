---
title: '深入学习 Fetch API'
description:
   '最近我深入学习了 Fetch API 的各个参数，并探索其使用场景的可能性。'
pubDate: 'Feb 23 2025'
heroImage: '/src/images/hero/hero-deep-understanding-of-fetch.png'
---

### Fetch API 的出现

Fetch API 是 ES6 中新增的一个特性，它是一种基于 `Promise` 的数据请求方式。

相较于先前传统的基于 `XMLHttpRequest` 的 AJAX 请求方法，它提供了更加方便快捷的操作模式，并通过 `Promise` 的链式调用有效地消除了回调地狱。

### fetch 和 XMLHttpRequest 的差异

1. `XMLHttpRequest` 使用回调函数，而 `fetch` 使用 `Promise`，比较简洁。
2. `fetch` 采用模块化设计，请求配置和请求相应都有专门的对象，比如 `Header`、`Request` 和 `Response` 等等，而 `XMLHttpRequest` 则把所有的配置都通过 `XMLHttpRequest` 对象的接口进行传输。
3. `fetch` 支持流式传输，而 `XMLHttpRequest` 不支持，它必须等到所有数据全部获取之后才能响应结果，如果是获取大文件的话非常不利。

以发送一个 POST 请求为例：

- `XMLHttpRequest`
  ```js
  const xhr = new XMLHttpRequest();

  xhr.open('POST', 'www.example.com', true);

  xhr.setRequestHeader('ContentType', 'application/json');

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
        if (xhr.status === 200) {
            console.log('请求成功');
            conosle.log(`响应数据是：${xhr.responseText}`)
        } else {
            console.log('请求失败');
        }
    }
  }

  const data = JSON.stringify({
    name: 'still-soda',
    age: 20
  });
  xhr.send(data);
  ```
- `fetch`
  ```js
  const data = {
    name: 'still-soda',
    age: 20
  };

  fetch('www.example.com', {
    method: 'POST',
    header: { ContentType: 'application/json' },
    body: JSON.stringify(data)
  })
    .then((res) => {
        if (res.ok) {
            console.log('请求成功');
            return res.json();
        } 
        throw new Error('请求失败'); 
    })
    .then((data) => {
        console.log(`响应数据是：${data}`);
    })
    .catch((err) => {
        console.error(err);
    });
  ```

可以看出 `fetch` 的结构和流程显然更加简洁和清晰，因此现代开发更适合选择 `fetch`。

### Response 对象

`Response` 对象是 `fetch` 请求成功后的返回值，他具有以下属性：

#### 同步属性

同步属性是指 `Response` 对象的非数据部分，请求的数据通过 `Stream` 接口异步读取，如果使用链式调用的方式，至少在第二个 `.then()` 中才能获取到异步数据，而同步数据可以在第一个 `.then()` 中直接获取。

同步属性有以下部分：

- `Response.ok`
  
  如果状态码是 200 到 299 之间的值，那么这个值为 `true`，反之为 `false`；

- `Response.status`
  
  请求的状态码；

- `Response.statusText`：
  
  请求的状态信息，如 `OK`；

- `Response.url`
  
  请求最终的 URL，为什么说是“最终”呢，因为请求有可能发生了重定向，在这种情况下，这个值将会指向重定向最后的 URL；

- `Response.redirected`
  
  一个用于表示请求是否跳转过的布尔值；

- `Response.type`
  
  表示请求的类型，主要有以下几类
  - `basic`：基本请求，也就是同源的
  - `cors`：跨域请求
  - `error`：网络错误
  - `opaque`：当 `fetch` 的 `type` 是 `no-cors` 的时候它会为 `true`，值得注意的事这个 `no-cors` 一般是在无需响应的时候才使用。
  - `opaqueredirected`：当 `fetch` 的 `redirec` 是 `manual` 时就会返回这个值。
  
- `Response.headers`
  
  这个属性是响应的 headers，可以通过 `for ([key, value] of Response.headers)` 来操作它，一般情况下修改它没什么意义。

  可以用来读取令牌什么的（如果是放在响应头的话）。

#### 异步属性

异步属性基本上都是读取数据的方法

- `Response.text()`
  
  这个方法用来读取响应的文本。
  
- `Response.json()`
  
  这个方法用来读取响应的对象，差不多是对 `.text()` 的结果使用 `JSON.stringify()` 得到的结果。

- `Response.formData()`
  
  一般用在 Service Worker 里面拦截和修改用户提交的表单。

- `Response.blob()`
  
  这个方法读取响应的二进制数据，比如图片啥的。

- `Response.arraybuffer()`
  
  主要用于获取流媒体数据，比如音乐。

- `Response.clone()`
  
  前面几个读取方法对同一个 Response 对象只能调用一次，如果试图调用第二次会报错，比如：

  ```js
  .then(async (res) => {
    const json = await res.json();
    const text = await res.text(); // 报错
  })
  ```

  这个时候使用 `Response.clone` 来克隆多个 `res` 即可。
  
- `Response.body`
  
  调用这个会获取一个 `ReadableStream` 对象，主要用于流式读取。通过获取这个 `ReadableStream` 对象的 `reader`，可以不断读取新的内容。

  此处有个关于 *Nginx* 的坑可以查看我先前的文章：[用流式传输协议接入百度大模型的心得以及一些相关 bug 的解决方案](https://www.still-soda.top/blog/exp-in-using-streaming-protocol-to-access-baidu-s-big-model--bug-solutions/)

#### fetch 的第二参数

`fetch` 的第二参数用来定制请求：

- `cache`
  
  请求的缓存使用和更新策略。
  - `default` 先看缓冲再请求，然后更新缓存
  - `no-store` 直接请求，不更新缓存
  - `reload` 直接请求，然后更新缓存
  - `no-cache` 比较缓存和服务器资源，有更新才使用服务器资源
  - `force-cache` 不存在缓存才会请求服务器
  - `only-if-cache` 只看缓存
  
- `mode`
  
  请求模式，涉及同源和跨域。
  - `cors` 默认，允许跨域
  - `same-origin` 只允许同源
  - `no-cors` 只允许 GET、POST 和 HEAD 请求，相当于表单的请求。在这个模式下，跨域请求的响应会被屏蔽掉，**无论请求是否成功你都不能知道响应的数据是什么**，`Response.body` 这些方法都调用不了，会报错。

- `credential`
  
  指定请求是否携带 Cookie。
  - `same-origin` 默认，同源情况下才携带 Cookie
  - `include` 一律发送 Cookie
  - `omit` 一律不发送
  
  **如果跨域请求要发送 Cookie 的话，必须将这个值设为 `include` 才行。**

- `signal`
  
  这个值是配合 `AbortController` 实现中断请求的信号量，类型为 `AbortSignal`。

- `keepalive`
  
  这个值指定请求不会收到页面关闭的影响，当页面卸载的时候，请求将会转移到后台运行，可以用于向服务器提交数据等等。

  类似功能的还有 `Navigator.sendBeacon()`，日后再做解释。

- `redirect`
  
  这个值指定请求在遇到重定向时候的行为：
  - `follow` 默认，跟随重定向
  - `error` 发生重定向时报错并中断
  - `manual` 这个值比较特别，在发生重定向的时候不跟随跳转，而是在返回的请求中包含一些数据，`response.url` 为将要跳转的 URL，`response.redirect` 为真，交由开发者自己决定后续操作

- `integrity`
  
  这个值指定一个哈希值，用于校验请求数据是否符合此值，防止篡改。

- `referrer`
  
  这个值指定请求的 `referrer` 属性，可以设置为空，即不发送。

  referer 主要用于验证请求来源，可以有效预防 CSRF 攻击。

- `referrerPolicy`
  
  指定 referrer 请求头发送策略：
  - `no-referrer-when-downgrade` 默认，除 HTTPS 向 HTTP 发送请求之外全部携带
  - `no-referer` 不发送
  - `origin` 只包含域名而不包含完整请求路径，如 `www.example.com/hello` 会发送 `www.example.com`
  - `same-origin` 同源才发送
  - `strict-origin` 相当于 `no-referer-when-downgrade` 加 `origin`
  - `unsafe-url` 总是发送

#### 通过 AbortController 取消请求

`AbortController` 可以用于取消请求，只需要实例化一个 `AbortController` 对象，让后将对象的 `signal` 属性传入 `fetch` 的第二参数即可。

```js
const { signal, abort } = new AbortController();

// 监听中断事件
signal.addEventListener('abort', () => console.log('Abort!'));

fetch('...', { signal });

console.log(signal.aborted); // => false

// 调用 abort() 中断请求
abort();

console.log(signal.aborted); // => true
```

### 参考资料

- [Fetch API 教程 - 阮一峰的网络日志](https://www.ruanyifeng.com/blog/2020/12/fetch-tutorial.html)