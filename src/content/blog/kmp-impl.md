---
title: 'KMP算法简单实现'
description: '本文主要讲解了KMP算法的简单实现'
pubDate: 'Jul 10 2024'
heroImage: '/src/images/hero/hero-kmp-impl.png'
---

## 简介

KMP算法是一种高效的字符串匹配算法，比起传统的BF算法来说，KMP引入了动态规划和有限
状态机 (FA) 从而将字符串模式匹配的时间复杂度由 O(n^2) 降低到了 O(n x m)

## 实现方法

1. 定义 状态转移(dp) 数组，一个二维数组，x轴保存了字符串中每个字符遭遇到的所有情
   况后将会跳转到的状态，y轴保存了字符串匹配过程中会出现的所有状态
2. 定义历史状态(x)，如果有限自动机从当前状态转移到下一状态，则当前状态将会在转移
   后成为历史状态
3. 利用被匹配字符串、历史状态、状态转移数组构建有限自动机
4. 传入要匹配目标字符串进行匹配

## 伪代码

```c++
// 状态转移数组dp
int[x, y] dp
// 历史状态x
int x = 0
// 构建有限自动机
void build_FA(string str, int case):
    dp = new Array(x=case, y=length_of(str))
    dp[0] = new Array(x=case, fill=0)
    int first_case = case_of(str[0])
    dp[0][first_case] = 1
    for_each char C of str:
        if is_first:
            continue
        int state = str.index_of(C)
        dp[state] = copy_of(dp[x])
		int case = case_of ( C )
        dp[state][case] = index + 1
        x = dp[x][case]

// 使用KMP匹配字符串
int find(string str):
    int state = 0
    for_each char C of str:
        int case = case_of( C )
        state = dp[case]
        if state == dp.heigth:
            return str.index_of(C) - dp.heigth
	return -1
```
