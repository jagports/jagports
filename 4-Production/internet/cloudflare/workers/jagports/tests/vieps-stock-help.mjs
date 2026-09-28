import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("#888 Stock help is independent of checkbox and dismisses without focus reopening", () => {
  const listeners = new Map();
  const docListeners = new Map();
  const nestedPopoverNode = {};
  const outsideNode = {};
  const button = {
    attributes: {},
    contains(target) { return target === this; },
    setAttribute(key, value) { this.attributes[key] = value; },
    addEventListener(name, handler) { listeners.set(name, handler); },
    focus() { listeners.get("focus")?.(); },
  };
  const popover = {
    hidden: true,
    contains(target) { return target === this || target === nestedPopoverNode; },
  };
  const checkbox = { checked: false };
  const document = {
    readyState: "loading",
    getElementById(id) {
      return { stockHelpButton: button, stockHelpPopover: popover, availabilitySelect: checkbox }[id] ?? null;
    },
    addEventListener(name, handler) { docListeners.set(name, handler); },
  };
  runInNewContext(source + "\nsetupStockHelp();", { document, globalThis: {} });
  const event = () => ({ stopPropagation() {} });

  listeners.get("mouseenter")();
  assert.equal(popover.hidden, false, "desktop hover shows help");
  listeners.get("mouseleave")();
  assert.equal(popover.hidden, true, "unfocused hover ends");
  button.focus();
  assert.equal(popover.hidden, false, "keyboard focus shows help");
  listeners.get("blur")();
  assert.equal(popover.hidden, true);

  listeners.get("click")(event());
  assert.equal(popover.hidden, false, "click or mobile tap pins help");
  assert.equal(button.attributes["aria-expanded"], "true");
  docListeners.get("pointerdown")({ target: nestedPopoverNode });
  assert.equal(popover.hidden, false, "nested help interaction does not dismiss");
  docListeners.get("pointerdown")({ target: outsideNode });
  assert.equal(popover.hidden, true, "outside interaction dismisses");
  assert.equal(checkbox.checked, false, "help never toggles Stock-only");

  listeners.get("click")(event());
  assert.equal(popover.hidden, false);
  docListeners.get("keydown")({ key: "Escape" });
  assert.equal(popover.hidden, true, "Escape remains dismissed after trigger refocus");
  assert.equal(button.attributes["aria-expanded"], "false");
  listeners.get("click")(event());
  assert.equal(popover.hidden, false, "help can reopen after Escape");
  assert.equal(checkbox.checked, false);
});
