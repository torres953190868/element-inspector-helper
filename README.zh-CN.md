# Element Inspector Helper

[English](README.md) | [简体中文](README.zh-CN.md)

一个轻量级的浏览器端元素检查工具，用于 vibe coding 和快速前端调试。

它可以在鼠标悬停时高亮页面元素，显示元素 selector 和文本预览；点击元素后，会把 selector 复制到剪贴板。这个脚本不依赖构建工具，适合作为开发辅助工具直接插入页面使用。

## 功能

- 使用快捷键开启或关闭检查模式
- 高亮鼠标下方的页面元素
- 在鼠标附近显示简洁的 selector 标签
- 点击元素后复制该元素的 selector
- 按 `Escape` 退出检查模式
- 支持 hover、select、toggle 回调
- 无第三方依赖

## 快速开始

把脚本引入页面：

```html
<script src="./useElementInspector.js"></script>
<script>
  const inspector = window.createElementInspector();
</script>
```

按 `Alt + I` 开始检查元素。点击元素后，该元素的 selector 会被复制到剪贴板。

## 配置

```html
<script>
  const inspector = window.createElementInspector({
    hotkey: "e",
    hotkeyModifier: "ctrl",
    onHover(info) {
      console.log("Hover:", info.selector);
    },
    onSelect(info) {
      console.log("Selected:", info.selector);
    },
    onToggle(active) {
      console.log("Inspector active:", active);
    }
  });
</script>
```

可用配置：

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `hotkey` | `string` | `"i"` | 用于开启或关闭检查模式的按键 |
| `hotkeyModifier` | `"alt"`、`"ctrl"` 或 `"meta"` | `"alt"` | 与 hotkey 一起按下的修饰键 |
| `onHover` | `function` | `null` | 鼠标悬停到元素时触发 |
| `onSelect` | `function` | `null` | 点击被检查元素时触发 |
| `onToggle` | `function` | `null` | 检查模式开启或关闭时触发 |

## API

`createElementInspector(options)` 会返回一个 inspector 实例：

```js
const inspector = window.createElementInspector();

inspector.start();
inspector.stop();
inspector.toggle();
inspector.isActive();
inspector.getHoveredInfo();
inspector.getHoveredElement();
inspector.destroy();
```

## 元素信息

`onHover` 和 `onSelect` 回调会收到类似下面的对象：

```js
{
  tag: "button",
  id: "saveButton",
  classes: ["primary", "compact"],
  selector: "#saveButton",
  rect: DOMRect,
  text: "Save"
}
```

## 注意事项

这个脚本主要用于本地开发和调试。不要在面向真实用户的生产页面中默认启用它。

剪贴板访问受浏览器安全规则限制。在某些页面或协议下，如果 Clipboard API 不可用，复制 selector 可能会失败。

## 许可证

MIT
