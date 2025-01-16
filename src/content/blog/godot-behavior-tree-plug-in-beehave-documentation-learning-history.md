---
title: 'Godot 行为树插件 Beehave 文档学习记录'
description: ' Godot 行为树插件 Beehave 文档学习记录'
pubDate: 'Aug 08 2024'
heroImage: '/src/images/hero/hero-godot-behavior-tree-plug-in-beehave-documentation-learning-history.png'
--- 

### 复合节点

-  **Sequence 节点（AND）**：顺序执行的节点，一旦遇到一个子节点返回 FAILURE，该节点立即返回 FALURE，子节点正在 RUNNING 返回 RUNNING，子节点全部 SUCCESS 返回 SUCCESS。存在失败短路行为，类似布尔运算中的与操作。
   -  **SequenceComposite**：子节点返回 FAILURE 的时候将从头开始执行所有子节点，返回 RUNNING 的时候反复 tick 当前子节点；
   -  **SequenceReactiveComposite**：不论子节点返回 FAILURE 还是 RUNNING，都从头开始执行所有子节点（悲观）；
   -  **SequenceStarComposite**：不论子节点返回 FAILURE 还是 RUNNING，都反复 tick 当前子节点（乐观）；
   -  **SequenceRandomComposite**：以随机顺序执行子节点，其他不变。
-  **Selector 节点（OR）**：顺序选择节点，一旦遇到一个子节点返回 SUCCESS，该节点立即返回 SUCCESS，子节点正在 RUNNING 返回 RUNNING，子节点全部 FAILURE 返回 FAILURE，存在成功短路行为，类似布尔运算中的或操作。
   -  **SelectorComposite**：在子节点返回 RUNNING 的时候，节点会反复 tick RUNNING 的那个子节点；
   -  **SelectorReactiveComposite**：在子节点返回 RUNNING 的时候，节点会直接从头重新开始执行子节点；
   -  **SelectorRandomComposite**：随机打乱子节点的执行顺序，其他不变。
-  **SimpleParallel 节点**：并行节点，只允许存在两个节点，第一个为主节点，第二个为辅助节点，返回的状态以主节点为主，主节点终止后辅助节点也会立即停止，并且返回主节点的结果；在 delay 模式下，主节点终止后会等待辅助节点完成，随后返回主节点的结果。

### 叶子节点

-  **ActionLeaf （DO）节点**：行为语义节点，专门用于执行行为操作，行为完成返回 SUCCESS，正在执行返回 RUNNING，执行失败返回 FAILURE。
-  **ConditionLeaf 节点（IF）**：条件语义节点，专门用于条件判断操作，根据条件是否满足返回 SUCCESS 或 FAILURE，不能为 RUNNING（即为肯定的问题）。

### 装饰节点

装饰节点会修改其子节点的行为模式。

-  **Failer 节点**：失败者节点，无论子节点结果如何始终返回 FAILURE。
-  **Succeeder 节点**：成功者节点，无论子节点结果如何始终返回 SUCCESS。
-  **Inverter 节点**：逆变器节点，如果子节点结果为 FAILURE 或 SUCCESS，则将结果反转并返回。
-  **Limiter 节点**：次数限制器节点，该节点会执行其状态为 RUNNING 的节点最多 n 次，如果执行次数达到最大次数，该节点将返回 FAILURE；如果子节点返回 SUCCESS 或 FAILURE，该节点将返回对应结果，并且重置次数。
-  **TimeLimiter 节点**：时间限制器节点，该节点执行其状态为 RUNNING 的节点最多 n 的时间，一旦时间结束，该节点将返回 FAILURE；如果子节点返回 SUCCESS 或 FAILURE，该节点将返回对应结果，并且重置计时器。
-  **Delayer 节点**：延时器节点，该节点启动一个内部计时器并返回 RUNNING，直到计时完成再开始执行其子节点，在子节点返回 FAILURE 或 SUCCESS 后重置时间。
-  **Cooldown 节点**：冷却节点，该节点先开始执行其子节点，直到子节点返回 SUCCES 或 FAILURE，随后启动一个内部计时器并返回 RUNNING，直到计时完成再继续执行子节点。
-  **UntilFail 节点**：乐观节点，该节点反复执行其子节点，直到它返回 FAILURE，该节点将会返回 SUCCESS，其他状态下该节点返回 RUNNING。