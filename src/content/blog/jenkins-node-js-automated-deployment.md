---
title: 'Jenkins + NodeJS 自动部署'
description:
   'Jenkins + NodeJS 自动部署'
pubDate: 'Aug 26 2024'
heroImage: '/src/images/hero/hero-jenkins-node-js-automated-deployment.png'
---

## CentOS 安装 Jenkins

1.  确保已经安装 Docker

2.  拉取镜像：

    https://hub.docker.com/_/jenkins?tab=tags 可查看jenkins版本最新镜像

    ```bash
    docker pull jenkins:2.60.3
    ```

3.  启动镜像：

    ```bash
    docker run -d -p 8080:8080 -p 50000:50000  --name zyz-jenkins jenkins:2.60.3
    ```

>  参考文章：[CentOS安装Jenkins - 玄同太子 - 博客园 (cnblogs.com)](https://www.cnblogs.com/zhi-leaf/p/11803959.html)

## 配置 Jenkins

1.  Jenkins安装Git、NodeJS和Publish Over SSH插件，如果插件安装出错，可在国内镜像下载安装文件进行离线安装，参考：[Jenkins安装第一个插件和通过离线安装包进行安装](https://www.cnblogs.com/zhi-leaf/p/11860422.html)

2.  配置环境变量（这一步和第4步均是为了让jenkins能够使用git和npm命令，可视情况操作，作者重新安装时这2步就没配置）

    在服务器上输入 `echo $PATH`，查看当前环境变量

    然后将上面的环境变量配置到Manage Jenkins>>Configure System>>Global properties中

3.  打开Manage Jenkins>>Configure System，配置Publish over SSH服务器

4.  创建NodeJS构建任务

    1.  创建一个自由风格的任务
    2.  配置Git，下载代码，点击Add配置Git的用户名密码
    3.  构建前台代码
    4.  通过Publish Over SSH将构建后的代码发布到远程服务器nginx下
    5.  执行任务

>  参考文章：[利用Jenkins打包并远程部署NodeJS应用 - 玄同太子 - 博客园 (cnblogs.com)](https://www.cnblogs.com/zhi-leaf/p/11834013.html)