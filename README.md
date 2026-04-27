# Element Inspector Helper

[English](README.md) | [简体中文](README.zh-CN.md)

A tiny browser-side element inspector for vibe coding and fast frontend debugging.

It lets you hover over elements, see their selector and text preview, then click to copy the selector to your clipboard. It is designed as a lightweight development helper that can be dropped into a page without a build step.

## Features

- Toggle inspector mode with a hotkey
- Highlight the element under the cursor
- Show a compact selector badge near the cursor
- Click an element to copy its selector
- Press `Escape` to exit inspector mode
- Optional callbacks for hover, select, and toggle events
- No dependencies

## Quick Start

Add the script to a page:

```html
<script src="./useElementInspector.js"></script>
<script>
  const inspector = window.createElementInspector();
</script>
```

Press `Alt + I` to start inspecting elements. Click an element to copy its selector.

## Configuration

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

Available options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `hotkey` | `string` | `"i"` | Key used to toggle inspector mode |
| `hotkeyModifier` | `"alt"`, `"ctrl"`, or `"meta"` | `"alt"` | Modifier key required with the hotkey |
| `onHover` | `function` | `null` | Called when hovering over an element |
| `onSelect` | `function` | `null` | Called when clicking an inspected element |
| `onToggle` | `function` | `null` | Called when inspector mode starts or stops |

## API

`createElementInspector(options)` returns an inspector instance:

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

## Returned Element Info

Hover and select callbacks receive an object like this:

```js
{
  tag: "button",
  id: "saveButton",
  classes: ["primary", "compact"],
  selector: "button#saveButton.primary.compact",
  rect: DOMRect,
  text: "Save"
}
```

## Notes

This script is intended for local development and debugging. Avoid enabling it by default in production user-facing pages.

Clipboard access depends on browser security rules. On some pages or protocols, copying may fail if the Clipboard API is unavailable.

## License

MIT
