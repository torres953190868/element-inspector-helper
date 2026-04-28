(function() {
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return Promise.reject(new Error("Clipboard API is unavailable"));
  }

  const stableAttributes = [
    "data-testid",
    "data-test",
    "data-id",
    "data-node-id",
    "aria-label",
    "name",
    "role"
  ];

  const utilityClassNames = {
    absolute: true,
    block: true,
    contents: true,
    fixed: true,
    flex: true,
    "flow-root": true,
    grid: true,
    hidden: true,
    inline: true,
    "inline-block": true,
    "inline-flex": true,
    relative: true,
    static: true,
    sticky: true,
    table: true,
    border: true,
    rounded: true,
    shadow: true
  };

  const utilityClassPatterns = [
    /^-?(?:m|p)(?:[trblxy])?-/,
    /^(?:min-|max-)?[wh]-/,
    /^(?:flex|grid|inline|table|border|rounded|shadow|text|bg|font|leading|tracking)-/,
    /^(?:top|right|bottom|left|inset|z|gap|space|items|justify|content|self|place)-/,
    /^(?:overflow|object|opacity|duration|ease|transition|transform|origin)-/,
    /^(?:scale|rotate|translate|skew|cursor|select|pointer-events)-/,
    /^(?:basis|grow|shrink|order|col|row|auto-cols|auto-rows|columns|break)-/,
    /^(?:sr-only|not-sr-only|container|whitespace|align)-/
  ];

  function cssEscape(value) {
    const string = String(value);
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(string);
    }

    let result = "";
    for (let index = 0; index < string.length; index += 1) {
      const character = string.charAt(index);
      const code = character.charCodeAt(0);
      const isDigit = code >= 48 && code <= 57;
      const isLetter = code >= 65 && code <= 90 || code >= 97 && code <= 122;

      if (code === 0) {
        result += "\uFFFD";
      } else if (
        code >= 1 && code <= 31 ||
        code === 127 ||
        index === 0 && isDigit ||
        index === 1 && isDigit && string.charCodeAt(0) === 45
      ) {
        result += "\\" + code.toString(16) + " ";
      } else if (index === 0 && string.length === 1 && code === 45) {
        result += "\\-";
      } else if (code >= 128 || code === 45 || code === 95 || isDigit || isLetter) {
        result += character;
      } else {
        result += "\\" + character;
      }
    }
    return result;
  }

  function escapeAttributeValue(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
  }

  function getTagName(element) {
    return element.tagName.toLowerCase();
  }

  function getClassNames(element) {
    return element.className && typeof element.className === "string"
      ? element.className.trim().split(/\s+/).filter(Boolean)
      : [];
  }

  function isUtilityClass(className) {
    if (utilityClassNames[className] || /[\/\[\]:]/.test(className)) {
      return true;
    }
    return utilityClassPatterns.some(function(pattern) {
      return pattern.test(className);
    });
  }

  function getSemanticClasses(element) {
    return getClassNames(element).filter(function(className) {
      return !isUtilityClass(className);
    }).slice(0, 2);
  }

  function getStableAttributeSelector(element, includeTag) {
    const tag = includeTag ? getTagName(element) : "";
    for (let index = 0; index < stableAttributes.length; index += 1) {
      const attribute = stableAttributes[index];
      const value = element.getAttribute(attribute);
      if (value) {
        return tag + "[" + attribute + "=\"" + escapeAttributeValue(value) + "\"]";
      }
    }
    return "";
  }

  function getUniqueSelector(element, selectors) {
    for (let index = 0; index < selectors.length; index += 1) {
      const selector = selectors[index];
      if (selector && isUniqueSelector(element, selector)) {
        return selector;
      }
    }
    return "";
  }

  function isUniqueSelector(element, selector) {
    try {
      const matches = document.querySelectorAll(selector);
      return matches.length === 1 && matches[0] === element;
    } catch (error) {
      return false;
    }
  }

  function isUniqueWithinParent(element, segment) {
    if (!element.parentElement) {
      return true;
    }

    try {
      let matchCount = 0;
      Array.prototype.forEach.call(element.parentElement.children, function(child) {
        if (child.matches(segment)) {
          matchCount += 1;
        }
      });
      return matchCount === 1;
    } catch (error) {
      return false;
    }
  }

  function getNthOfType(element) {
    const tag = getTagName(element);
    let index = 1;
    let sibling = element.previousElementSibling;
    while (sibling) {
      if (getTagName(sibling) === tag) {
        index += 1;
      }
      sibling = sibling.previousElementSibling;
    }
    return index;
  }

  function getPathSegment(element) {
    const tag = getTagName(element);
    const idSegment = element.id ? tag + "#" + cssEscape(element.id) : "";
    const stableAttributeSegment = getStableAttributeSelector(element, true);
    const semanticClasses = getSemanticClasses(element);
    const classSegment = semanticClasses.length
      ? tag + "." + semanticClasses.map(cssEscape).join(".")
      : "";
    let segment = idSegment || stableAttributeSegment || classSegment || tag;

    if (!isUniqueWithinParent(element, segment)) {
      segment += ":nth-of-type(" + getNthOfType(element) + ")";
    }

    return segment;
  }

  function buildPathSelector(element) {
    const segments = [];
    let current = element;

    while (current && current.nodeType === 1) {
      segments.unshift(getPathSegment(current));
      const selector = segments.join(" > ");
      if (isUniqueSelector(element, selector)) {
        return selector;
      }
      if (current === document.body) {
        break;
      }
      current = current.parentElement;
    }

    return segments.join(" > ");
  }

  function buildElementSelector(element) {
    const tag = getTagName(element);
    const selectors = [];
    const stableAttributeSelector = getStableAttributeSelector(element, false);
    const semanticClasses = getSemanticClasses(element);

    if (element.id) {
      selectors.push("#" + cssEscape(element.id));
    }
    if (stableAttributeSelector) {
      selectors.push(stableAttributeSelector);
    }
    if (semanticClasses.length) {
      selectors.push(tag + "." + semanticClasses.map(cssEscape).join("."));
    }

    return getUniqueSelector(element, selectors) || buildPathSelector(element);
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
      const classes = getClassNames(element);
      const rect = element.getBoundingClientRect();
      return {
        tag: tag,
        id: id,
        classes: classes,
        selector: buildElementSelector(element),
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
