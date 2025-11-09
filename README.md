# 洞察中国：旅游交通与消费水平的联动关系 (TTC-Platform)

[![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?logo=vue.js)](https://cn.vuejs.org/)
[![ECharts](https://img.shields.io/badge/Apache-ECharts-E63841?logo=apache)](https://echarts.apache.org/zh/index.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[cite_start]这是一个基于 Vue.js 3 + Echarts 构建的交互式数据可视化分析系统，聚焦中国**交通建设 (T)**、**旅游产业 (T2)** 与**居民消费 (C)** 三大核心领域的联动关系 [cite: 1]。

[cite_start]本项目旨在将复杂、抽象的经济学模型（如空间溢出、向量自回归）与现代Web技术相结合，通过**数据叙事**与**HCI（人机交互）创新**，将2005-2023年的多维面板数据转化为直观、可交互的分析场景，揭示T-T-C关系从“单向拉动”到“双向互哺”的动态演化规律 [cite: 1, 25]。

---

## ✨ 核心功能与HCI创新

[cite_start]本项目不仅是图表的堆砌，更是一套集成了多种HCI创新模式的分析工具，有效降低了复杂经济模型的认知门槛 [cite: 1, 35]。

### 1. 🤖 “GUI + LUI” 双模式交互
[cite_start]为降低非专业用户的使用门槛，系统在全局集成了 **COZE 智能聊天机器人** [cite: 1, 32][cite_start]。用户不仅可以通过传统的图形界面（GUI）操作，还可以通过自然语言用户界面（LUI）直接提问（例如：“四川省近十年的铁路客运量变化？”），实现“智慧咨询” [cite: 1, 33]。

### 2. 🔄 动态因果挖掘 (数据侦探之旅)
[cite_start]本项目的核心价值所在。通过“数据叙事”  [cite_start]的设计理念，引导用户按“①宏观共振 → ②量化相关 → ③时序因果 → ④最终结论”的逻辑层层深入 。
* [cite_start]**交互式建模**：用户可切换“早期 (2005-2014)”和“后期 (2015-2023)”两个阶段，直观对比因果关系网络图（Graph）从“单向驱动” [cite: 26] [cite_start]到“双向互哺” [cite: 27] 的质变。
* [cite_start]**参数化交互**：支持用户通过滑块实时调节“脉冲响应”的冲击强度，即时演算并可视化结果 [cite: 25, 28, 29]。

### 3. 🔗 跨图表视图联动
[cite_start]为解决多图表孤立、难以对比的问题 [cite: 11][cite_start]，系统在“结构变迁”模块实现了视图联动 [cite: 1, 13, 14, 15, 16]：
* [cite_start]**交互**：当用户的鼠标悬停在“全国客运结构条形图”（Act 2）的Y轴省份上时 [cite: 11, 14, 15][cite_start]，系统会通过 `dispatchAction` 事件，在“铁路效率散点图”（Act 3）中高亮对应的省份数据点 [cite: 11, 14, 15, 16]。
* [cite_start]**价值**：在“结构特征”与“效率水平”之间建立了直接的视觉关联 。

### 4. 🗺️ “概览 + 详情” 过滤模式
[cite_start]在“空间溢出”模块中，为解决全国流向图杂乱的问题 [cite: 17, 21, 22][cite_start]，系统采用了“概览 + 详情”模式 [cite: 1]：
* [cite_start]**默认**：展示全国所有省份的模拟溢出关系总览 [cite: 22]。
* [cite_start]**交互**：当用户点击左侧地图的任一省份（如江苏省）时 [cite: 18][cite_start]，右侧的流向图会立刻过滤，仅显示“以江苏省为源头”的溢出关系 [cite: 20, 23, 24][cite_start]，同时更新统计卡片 [cite: 19]。

### 5. 💡 超级工具提示 (Super Tooltip)
[cite_start]在“多维数据探索”模块中，为提升热力图的信息密度 [cite: 1, 2]，系统设计了“超级工具提示”：
* [cite_start]**交互**：当鼠标悬停在热力图的任意色块（如“四川省-2020年”）时 [cite: 6, 7][cite_start]，Tooltip 内会通过 `nextTick` 异步渲染一个 Echarts 微型图（Sparkline） [cite: 7, 8, 9][cite_start]，展示该省份完整的历史趋势，实现了“宏观”与“微观”的瞬时切换 [cite: 2]。

---

## 🛠️ 系统架构与技术栈

### 系统功能架构
[cite_start]系统采用“门户-功能-交互”三层架构，以 `Home.vue` 为统一入口 [cite: 1][cite_start]，四大功能模块并行布局 [cite: 1][cite_start]，配合全局COZE智能助手，形成“全景概览-深度分析-智能问答”的三维交互体系 [cite: 1]。

[cite_start](建议：此处插入您论文中的 **图1.系统功能设计思维导图** [cite: 1])
