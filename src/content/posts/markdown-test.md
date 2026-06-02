---
title: Markdown 语法全面测试
published: 2026-06-02
updated: 2026-06-02
category: 测试
tags:
  - Markdown
  - LaTeX
  - 测试
description: 测试各种 Markdown 语法、LaTeX、GitHub 风格告示等的渲染效果
---

## 标题测试

### 三级标题

#### 四级标题

##### 五级标题

## 文本格式

**粗体文本** *斜体文本* ~~删除线文本~~ `行内代码`

~~***粗斜体删除线结合***~~

## 列表

### 无序列表

- 苹果
- 香蕉
- 樱桃
  - 子项 1
  - 子项 2

### 有序列表

1. 第一步
2. 第二步
3. 第三步

### 任务列表

- [x] 已完成任务
- [ ] 未完成任务
- [ ] 另一个未完成任务

## 引用

> 这是一段引用文本。
> 
> 引用可以跨多行。
>
> > 嵌套引用

## 表格

| 语法 | 支持情况 | 备注 |
| :--- | :----: | ---: |
| 表格 | ✅ | 标准 GFM 表格 |
| 对齐 | ✅ | 左/中/右对齐 |
| 合并 | ❌ | GFM 不支持合并单元格 |
| 代码块 | ✅ | 支持语法高亮 |

## 代码块

### Python

```python
def hello(name: str) -> str:
    """一个简单的问候函数"""
    print(f"Hello, {name}!")
    return f"Hello, {name}!"

class Greeter:
    def __init__(self, greeting: str = "Hello"):
        self.greeting = greeting
    
    def greet(self, name: str) -> None:
        print(f"{self.greeting}, {name}!")
```

### JavaScript

```javascript
// 异步函数示例
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

const arr = [1, 2, 3, 4, 5];
const doubled = arr.map(x => x * 2);
console.log(doubled); // [2, 4, 6, 8, 10]
```

### 内联代码

在段落中可以使用 `console.log()` 这样的内联代码。

## LaTeX 数学公式

### 行内公式

爱因斯坦的质能方程 $E = mc^2$ 是行内公式。

勾股定理：$a^2 + b^2 = c^2$

### 块级公式

$$
\int_{0}^{\infty} e^{-x^2} \, dx = \frac{\sqrt{\pi}}{2}
$$

$$
\nabla \times \mathbf{B} = \mu_0 \left( \mathbf{J} + \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t} \right)
$$

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

矩阵：

$$
\begin{pmatrix}
a_{11} & a_{12} & a_{13} \\
a_{21} & a_{22} & a_{23} \\
a_{31} & a_{32} & a_{33}
\end{pmatrix}
$$

## GitHub 风格告示 (Alert)

> [!note]
> 这是一个 Note 类型的告示

> [!tip]
> 这是一个 Tip 类型的告示

> [!important]
> 这是一个 Important 类型的告示

> [!warning]
> 这是一个 Warning 类型的告示

> [!caution]
> 这是一个 Caution 类型的告示

## 自定义告示块 (Directive)

:::note
这是一个 note 自定义块

可以包含多行内容。
:::

:::tip
这是一个 tip 自定义块
:::

:::important
这是一个 important 自定义块
:::

:::caution
这是一个 caution 自定义块
:::

:::warning
这是一个 warning 自定义块
:::

## 链接

[内联链接](https://example.com)

[GitHub 卡片](https://github.com/SigureMo/nyakku.moe)

## 图片

![测试图片](/avatar.jpg)

## 水平分割线

---

***

## 脚注

这是一段带脚注的文本[^1]。

[^1]: 这是脚注的内容。

## 删除线 ~~

~~这行文字应该被删除~~

## 上下标

H~2~O （下标）

X^2^ （上标）

## 表情符号

:smile: :heart: :rocket: :+1:
