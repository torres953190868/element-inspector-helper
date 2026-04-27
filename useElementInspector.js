(function() {
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return Promise.reject(new Error("Clipboard API is unavailable"));
  }

  function createElementInspector(options) {
    const config = options || {};
    const hotkey = (config.hotkey || "i").toLowerCase();
    const hotkeyModifier = config.hotkeyModifier || "alt";
    const onSelect = typeof config.onSelect === "function" ? config.onSelect : null;
    const onHover = typeof config.onHover === "function" ? config.onHover : null;
    const onToggle = typeof config.onToggle === "function" ? config.onToggle : null;

    let active = false;
    let hoveredInfo = null;
    let hoveredElement = null;

    const overlay = document.createElement("div");
    overlay.setAttribute("data-inspector", "overlay");
    overlay.style.position = "fixed";
    overlay.style.left = "0";
    overlay.style.top = "0";
    overlay.style.pointerEvents = "none";
    overlay.style.border = "2px solid #ff5a36";
    overlay.style.background = "rgba(255, 90, 54, 0.12)";
    overlay.style.boxSizing = "border-box";
    overlay.style.zIndex = "9998";
    overlay.style.display = "none";

    const badge = document.createElement("div");
    badge.setAttribute("data-inspector", "badge");
    badge.style.position = "fixed";
    badge.style.pointerEvents = "none";
    badge.style.maxWidth = "320px";
    badge.style.padding = "8px 10px";
    badge.style.borderRadius = "8px";
    badge.style.background = "rgba(20, 22, 24, 0.92)";
    badge.style.color = "#f5f5f5";
    badge.style.font = "12px/1.4 Consolas, Monaco, monospace";
    badge.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.18)";
    badge.style.zIndex = "9999";
    badge.style.display = "none";
    badge.style.whiteSpace = "nowrap";
    badge.style.textOverflow = "ellipsis";
    badge.style.overflow = "hidden";

    function ensureUi() {
      if (!document.body.contains(overlay)) {
        document.body.appendChild(overlay);
      }
      if (!document.body.contains(badge)) {
        document.body.appendChild(badge);
      }
    }

    function getElementInfo(element) {
      const tag = element.tagName.toLowerCase();
      const id = element.id || "";
      const classes = element.className && typeof element.className === "string"
        ? element.className.trim().split(/\s+/).filter(Boolean)
        : [];
      const rect = element.getBoundingClientRect();
      return {
        tag: tag,
        id: id,
        classes: classes,
        selector: tag + (id ? "#" + id : "") + (classes.length ? "." + classes.join(".") : ""),
        rect: rect,
        text: (element.textContent || "").trim().slice(0, 80)
      };
    }

    function updateOverlay(info) {
      const rect = info.rect;
      overlay.style.display = "block";
      overlay.style.left = rect.left + "px";
      overlay.style.top = rect.top + "px";
      overlay.style.width = Math.max(rect.width, 0) + "px";
      overlay.style.height = Math.max(rect.height, 0) + "px";
    }

    function updateBadge(info, mouseEvent) {
      const label = info.selector + (info.text ? " | " + info.text : "");
      badge.textContent = label;
      badge.title = label;
      badge.style.display = "block";

      const offset = 14;
      const maxLeft = Math.max(window.innerWidth - badge.offsetWidth - 8, 8);
      const maxTop = Math.max(window.innerHeight - badge.offsetHeight - 8, 8);
      const left = Math.min(mouseEvent.clientX + offset, maxLeft);
      const top = Math.min(mouseEvent.clientY + offset, maxTop);

      badge.style.left = left + "px";
      badge.style.top = top + "px";
    }

    function clearUi() {
      overlay.style.display = "none";
      badge.style.display = "none";
    }

    function stop() {
      if (!active) {
        return;
      }
      active = false;
      hoveredInfo = null;
      hoveredElement = null;
      clearUi();
      document.body.style.cursor = "";
      if (onToggle) {
        onToggle(false);
      }
    }

    function start() {
      if (active) {
        return;
      }
      ensureUi();
      active = true;
      document.body.style.cursor = "crosshair";
      if (onToggle) {
        onToggle(true);
      }
    }

    function toggle() {
      if (active) {
        stop();
      } else {
        start();
      }
    }

    function onMove(event) {
      if (!active) {
        return;
      }

      const element = event.target instanceof HTMLElement ? event.target : null;
      if (!element || element.closest("[data-inspector]")) {
        return;
      }

      hoveredElement = element;
      hoveredInfo = getElementInfo(element);
      updateOverlay(hoveredInfo);
      updateBadge(hoveredInfo, event);
      if (onHover) {
        onHover(hoveredInfo);
      }
    }

    function onClick(event) {
      if (!active) {
        return;
      }

      const element = event.target instanceof HTMLElement ? event.target : null;
      if (!element || element.closest("[data-inspector]")) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      hoveredElement = element;
      hoveredInfo = getElementInfo(element);
      copyToClipboard(hoveredInfo.selector).catch(function(error) {
        console.warn("Failed to copy selector:", error);
      });
      if (onSelect) {
        onSelect(hoveredInfo);
      }
      stop();
    }

    function onKeyDown(event) {
      const modifierPressed =
        hotkeyModifier === "alt" ? event.altKey :
        hotkeyModifier === "ctrl" ? event.ctrlKey :
        event.metaKey;

      if (modifierPressed && event.key.toLowerCase() === hotkey) {
        event.preventDefault();
        toggle();
        return;
      }

      if (event.key === "Escape" && active) {
        event.preventDefault();
        stop();
      }
    }

    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown);

    return {
      start: start,
      stop: stop,
      toggle: toggle,
      isActive: function() {
        return active;
      },
      getHoveredInfo: function() {
        return hoveredInfo;
      },
      getHoveredElement: function() {
        return hoveredElement;
      },
      destroy: function() {
        stop();
        document.removeEventListener("mousemove", onMove, true);
        document.removeEventListener("click", onClick, true);
        document.removeEventListener("keydown", onKeyDown);
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        if (badge.parentNode) {
          badge.parentNode.removeChild(badge);
        }
      }
    };
  }

  window.createElementInspector = createElementInspector;
})();
