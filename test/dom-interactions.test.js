import test from "node:test";
import assert from "node:assert/strict";

class FakeClassList {
  constructor(classes = []) {
    this.classes = new Set(classes);
  }

  add(...classes) {
    classes.forEach((className) => this.classes.add(className));
  }

  remove(...classes) {
    classes.forEach((className) => this.classes.delete(className));
  }

  contains(className) {
    return this.classes.has(className);
  }

  toggle(className, force) {
    const enabled = typeof force === "boolean" ? force : !this.classes.has(className);
    if (enabled) this.classes.add(className);
    else this.classes.delete(className);
    return enabled;
  }
}

class FakeStyle {
  constructor() {
    this.values = {};
  }

  setProperty(name, value, priority = "") {
    this.values[name] = { value, priority };
  }

  removeProperty(name) {
    delete this.values[name];
  }
}

class FakeNode {
  constructor({ classNames = [], dataset = {}, rect = {}, selectorAliases = [] } = {}) {
    this.classList = new FakeClassList(classNames);
    this.dataset = { ...dataset };
    this.style = new FakeStyle();
    this.attributes = {};
    this.children = [];
    this.parentNode = null;
    this.textContent = "";
    this.hidden = false;
    this.disabled = false;
    this.outerHTML = "";
    this.rect = {
      left: 0,
      top: 0,
      width: 100,
      height: 40,
      bottom: 40,
      ...rect
    };
    this.selectorAliases = new Set(selectorAliases);
    this.listeners = {};
    this.focused = false;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  append(child) {
    this.appendChild(child);
  }

  querySelectorAll(selector) {
    const results = [];
    const visit = (node) => {
      node.children.forEach((child) => {
        if (matchesSelector(child, selector)) results.push(child);
        visit(child);
      });
    };
    visit(this);
    return results;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  closest(selector) {
    let node = this;
    while (node) {
      if (matchesSelector(node, selector)) return node;
      node = node.parentNode;
    }
    return null;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }

  insertAdjacentHTML(position, markup) {
    const node = new FakeNode({
      classNames: [
        "quick-card",
        markup.includes("quick-card--add") ? "quick-card--add" : "quick-card--custom"
      ]
    });
    node.outerHTML = markup;
    if (!this.parentNode || position === "beforeend") {
      this.appendChild(node);
      return;
    }
    const index = this.parentNode.children.indexOf(this);
    this.parentNode.children.splice(position === "beforebegin" ? index : index + 1, 0, node);
    node.parentNode = this.parentNode;
  }

  insertBefore(node, reference) {
    if (node.parentNode) {
      node.parentNode.children = node.parentNode.children.filter((child) => child !== node);
    }
    const index = reference ? this.children.indexOf(reference) : -1;
    const insertIndex = index >= 0 ? index : this.children.length;
    this.children.splice(insertIndex, 0, node);
    node.parentNode = this;
  }

  addEventListener(type, listener) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(listener);
  }

  dispatch(type, event = {}) {
    (this.listeners[type] || []).forEach((listener) => listener(event));
  }

  getBoundingClientRect() {
    return this.rect;
  }

  animate(keyframes, options) {
    this.lastAnimation = { keyframes, options };
  }

  focus() {
    this.focused = true;
  }
}

function matchesSelector(node, selector) {
  return selector.split(",").some((part) => matchesSingleSelector(node, part.trim()));
}

function matchesSingleSelector(node, selector) {
  if (!selector) return false;
  if (node.selectorAliases.has(selector)) return true;
  if (selector.includes(":not(")) {
    const [base, notPart] = selector.split(":not(");
    const excluded = notPart.replace(")", "");
    return matchesSingleSelector(node, base) && !matchesSingleSelector(node, excluded);
  }
  if (selector.startsWith(".")) {
    return selector
      .split(".")
      .filter(Boolean)
      .every((className) => node.classList.contains(className));
  }
  const dataAttr = selector.match(/^\[data-([^=]+)(?:="([^"]+)")?\]$/);
  if (dataAttr) {
    const key = dataAttr[1].replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    return dataAttr[2] === undefined ? key in node.dataset : node.dataset[key] === dataAttr[2];
  }
  return false;
}

function setDocument(root) {
  globalThis.document = root;
}

function setWindow(overrides = {}) {
  globalThis.window = {
    JH_APP_VIEW: "",
    clearTimeout() {},
    setTimeout(callback) {
      callback();
      return 1;
    },
    clearInterval() {},
    setInterval() {
      return 1;
    },
    requestAnimationFrame(callback) {
      callback();
    },
    matchMedia() {
      return { matches: false };
    },
    ...overrides
  };
  globalThis.location = {
    pathname: "/Users/zengweihao/Desktop/Repos/JiaHong/",
    search: "",
    ...(overrides.location || {})
  };
}

test("dom helpers locate consult roots, toggle readonly shells, refresh chat threads, and mount app states", async () => {
  const root = new FakeNode();
  const body = new FakeNode();
  const app = new FakeNode();
  const main = new FakeNode({ classNames: ["consult-room-main"] });
  const readonlyCard = new FakeNode({ classNames: ["text-card--readonly"] });
  const shell = new FakeNode({ classNames: ["consult-shell"] });
  const thread = new FakeNode({ classNames: ["video-chat-thread"], dataset: { chatKey: "chat_1" } });
  root.body = body;
  root.getElementById = (id) => (id === "app" ? app : null);
  root.appendChild(main);
  root.appendChild(readonlyCard);
  root.appendChild(shell);
  root.appendChild(thread);

  const {
    getConsultMainElement,
    isConsultReadonlyView,
    mountApp,
    mountAppError,
    refreshChatThread,
    setConsultShellReadonly
  } = await import("../src/presentation/ui/dom.js");

  assert.equal(getConsultMainElement(root), main);
  assert.equal(isConsultReadonlyView(root), true);

  setConsultShellReadonly(true, root);
  assert.equal(shell.classList.contains("consult-shell--readonly"), true);

  refreshChatThread((chatKey, { threadClass }) => `<div class="${threadClass}" data-chat-key="${chatKey}">new</div>`, "chat_1", root);
  assert.equal(thread.outerHTML, '<div class="video-chat-thread" data-chat-key="chat_1">new</div>');

  mountApp("<main>ok</main>", "home", root);
  assert.equal(body.classList.contains("page-mode-responsive"), true);
  assert.equal(body.classList.contains("page-view-home"), true);
  assert.equal(app.innerHTML, "<main>ok</main>");

  mountAppError(root);
  assert.match(app.innerHTML, /页面数据加载失败/);
});

test("interaction primitives manage overlays, toasts, and popup menus", async () => {
  const root = new FakeNode();
  const toast = new FakeNode({ classNames: ["toast", "toast--success", "toast--home-status"] });
  const overlay = new FakeNode({ classNames: ["overlay"], selectorAliases: [".overlay"] });
  const input = new FakeNode({ selectorAliases: [".focus-target"] });
  const closeButton = new FakeNode({ selectorAliases: [".close"] });
  const dialog = new FakeNode({ selectorAliases: [".dialog"] });
  const container = new FakeNode({ classNames: ["popup"] });
  const trigger = new FakeNode({ classNames: ["trigger"] });
  const menu = new FakeNode({ classNames: ["menu"] });
  root.appendChild(toast);
  root.appendChild(overlay);
  overlay.appendChild(input);
  overlay.appendChild(closeButton);
  overlay.appendChild(dialog);
  root.appendChild(container);
  container.appendChild(trigger);
  container.appendChild(menu);
  setDocument(root);
  setWindow({
    clearTimeout() {},
    setTimeout() {
      return 1;
    }
  });
  globalThis.document.createElement = () => new FakeNode();

  const {
    bindOverlayDismiss,
    closeOverlay,
    closePopupMenus,
    openOverlay,
    setOverlayOpen,
    showToast,
    stopEvent,
    togglePopupMenu
  } = await import("../src/presentation/ui/interactionPrimitives.js");

  showToast("保存成功", { tone: "success", duration: 10 });
  assert.equal(toast.classList.contains("toast--success"), true);
  assert.equal(toast.classList.contains("is-visible"), true);
  assert.equal(toast.getAttribute("role"), "status");
  assert.equal(toast.children.at(-1).textContent, "保存成功");

  setOverlayOpen(".overlay", true, { focusSelector: ".focus-target" });
  assert.equal(overlay.classList.contains("is-open"), true);
  assert.equal(overlay.getAttribute("aria-hidden"), "false");
  assert.equal(input.focused, true);

  const stoppedEvent = {
    prevented: false,
    stopped: false,
    preventDefault() {
      this.prevented = true;
    },
    stopPropagation() {
      this.stopped = true;
    }
  };
  closeOverlay(".overlay", stoppedEvent);
  assert.equal(stoppedEvent.prevented, true);
  assert.equal(stoppedEvent.stopped, true);
  assert.equal(overlay.getAttribute("aria-hidden"), "true");

  openOverlay(".overlay", ".focus-target");
  let closeCalls = 0;
  bindOverlayDismiss(overlay, {
    close() {
      closeCalls += 1;
    },
    closeSelector: ".close",
    dialogSelector: ".dialog"
  });
  closeButton.dispatch("click", {});
  overlay.dispatch("click", { target: overlay });
  assert.equal(closeCalls, 2);

  togglePopupMenu(trigger, {
    menuSelector: ".menu",
    containerSelector: ".popup",
    triggerSelector: ".trigger"
  });
  assert.equal(menu.classList.contains("is-open"), true);
  assert.equal(trigger.getAttribute("aria-expanded"), "true");
  closePopupMenus({
    menuSelector: ".menu",
    containerSelector: ".popup",
    triggerSelector: ".trigger"
  });
  assert.equal(menu.classList.contains("is-open"), false);
  assert.equal(trigger.getAttribute("aria-expanded"), "false");

  stopEvent(null);
});

test("quick entry grid helpers count, insert, remove, replace, edit, and reorder cards", async () => {
  setWindow();
  const grid = new FakeNode({ classNames: ["quick-grid"] });
  const cardRoot = new FakeNode({ classNames: ["quick-entry-card", "is-editing"] });
  cardRoot.appendChild(grid);
  const customOne = new FakeNode({ classNames: ["quick-card", "quick-card--custom"], rect: { left: 0, top: 0, width: 100, height: 40, bottom: 40 } });
  const customTwo = new FakeNode({ classNames: ["quick-card", "quick-card--custom"], rect: { left: 120, top: 0, width: 100, height: 40, bottom: 40 } });
  const addCard = new FakeNode({ classNames: ["quick-card", "quick-card--add"] });
  const deleteControl = new FakeNode({ classNames: ["quick-card__delete"] });
  const dragControl = new FakeNode({ classNames: ["quick-card__drag"] });
  customOne.appendChild(deleteControl);
  customOne.appendChild(dragControl);
  grid.appendChild(customOne);
  grid.appendChild(customTwo);
  grid.appendChild(addCard);
  setDocument({
    querySelector(selector) {
      return selector === ".quick-grid" ? grid : null;
    },
    querySelectorAll() {
      return [];
    }
  });

  const {
    addCustomQuickCardToGrid,
    ensureQuickAddCard,
    getQuickActionCount,
    getQuickGridCards,
    getQuickGridCustomCards,
    moveDraggingQuickCard,
    removeCustomQuickCardWithMotion,
    replaceQuickCard,
    setQuickCardEditControlsState,
    shouldReduceMotion
  } = await import("../src/presentation/interactions/quickEntryGridDom.js");

  assert.equal(shouldReduceMotion(), false);
  assert.equal(getQuickGridCards(grid).length, 3);
  assert.equal(getQuickGridCustomCards(grid).length, 2);
  assert.equal(getQuickActionCount(grid), 2);

  setQuickCardEditControlsState(grid, true);
  assert.equal(deleteControl.style.values.opacity.value, "1");
  setQuickCardEditControlsState(grid, false);
  assert.equal(deleteControl.style.values.opacity, undefined);

  assert.deepEqual(addCustomQuickCardToGrid(null, {}), { ok: false, reason: "missing-grid" });
  assert.deepEqual(addCustomQuickCardToGrid(grid, { title: "新入口", desc: "打开" }), { ok: true });
  assert.equal(getQuickActionCount(grid), 3);

  assert.equal(replaceQuickCard(customTwo, { title: "替换入口", desc: "打开" }), true);
  assert.match(customTwo.outerHTML, /替换入口/);
  assert.equal(replaceQuickCard(null, {}), false);

  removeCustomQuickCardWithMotion(customOne);
  assert.equal(grid.children.includes(customOne), false);

  const dragging = grid.querySelector(".quick-card--custom");
  const activeDrag = { slotIndex: 99 };
  moveDraggingQuickCard({ clientX: 0, clientY: 0 }, grid, dragging, activeDrag);
  assert.equal(activeDrag.slotIndex, 0);

  ensureQuickAddCard(grid);
  assert.equal(Boolean(grid.querySelector(".quick-card--add")), true);
});

test("runtime DOM sync applies service, doctor, and waiting queue state", async () => {
  const root = new FakeNode();
  const textService = new FakeNode({ dataset: { serviceKey: "text" } });
  const videoService = new FakeNode({ dataset: { serviceKey: "video" } });
  const statusText = new FakeNode({ classNames: ["jh-status-badge--offline"], dataset: { statusText: "" } });
  const roomStatus = new FakeNode({ classNames: ["room-status"] });
  const statusTrigger = new FakeNode({ classNames: ["doctor-status-trigger"] });
  const busyItem = new FakeNode({ classNames: ["doctor-status-menu__item"], dataset: { doctorStatus: "busy" } });
  const offlineItem = new FakeNode({ classNames: ["doctor-status-menu__item"], dataset: { doctorStatus: "offline" } });
  const switchButton = new FakeNode({ classNames: ["jh-switch"] });
  const waitingTotal = new FakeNode({ dataset: { waitingTotal: "" } });
  const waitingText = new FakeNode({ dataset: { waitingType: "text" } });
  const consultCard = new FakeNode({ classNames: ["consult-card"] });
  [
    textService,
    videoService,
    statusText,
    roomStatus,
    statusTrigger,
    busyItem,
    offlineItem,
    switchButton,
    waitingTotal,
    waitingText,
    consultCard
  ].forEach((node) => root.appendChild(node));
  setDocument(root);

  const { initRuntimeState } = await import("../src/application/state/runtimeState.js?v=20260528-06");
  initRuntimeState({
    services: [
      { key: "text", enabled: true },
      { key: "video", enabled: false }
    ],
    doctor: { status: "busy" },
    consultationRecords: [
      { id: "text_1", type: "text", state: "ongoing", time: "10:00" },
      { id: "video_1", type: "video", state: "ongoing", time: "11:00" }
    ]
  });
  const { applyRuntimeStateToDom, applyServiceStateToDom } = await import(
    "../src/presentation/interactions/runtimeDomSync.js?dom-sync"
  );

  applyRuntimeStateToDom();

  assert.equal(textService.getAttribute("aria-checked"), "true");
  assert.equal(textService.classList.contains("is-selected"), true);
  assert.equal(videoService.getAttribute("aria-checked"), "false");
  assert.equal(statusText.textContent, "忙碌");
  assert.equal(statusText.classList.contains("jh-status-badge--busy"), true);
  assert.match(roomStatus.getAttribute("aria-label"), /忙碌/);
  assert.equal(busyItem.getAttribute("aria-checked"), "true");
  assert.equal(offlineItem.getAttribute("aria-checked"), "false");
  assert.equal(switchButton.classList.contains("is-on"), true);
  assert.equal(waitingTotal.textContent, "2");
  assert.equal(waitingText.textContent, "1");
  assert.equal(consultCard.classList.contains("consult-card--has-queue"), true);

  applyServiceStateToDom("text", false);
  assert.equal(textService.getAttribute("aria-checked"), "false");
  assert.equal(textService.classList.contains("is-selected"), false);
});

test("video prescription countdown binds once and unlocks the submit button", async () => {
  const submitButton = new FakeNode({ classNames: ["jh-prescription-submit"] });
  const value = new FakeNode({ classNames: ["video-submit-countdown__value"] });
  const wrapper = new FakeNode({ classNames: ["video-prescription-submit-wrap"] });
  const countdown = new FakeNode({ dataset: { videoSubmitCountdown: "", remaining: "1" } });
  wrapper.appendChild(countdown);
  wrapper.appendChild(submitButton);
  countdown.appendChild(value);
  const root = new FakeNode();
  root.appendChild(wrapper);
  setDocument(root);
  const intervals = [];
  setWindow({
    setInterval(callback) {
      intervals.push(callback);
      return intervals.length;
    },
    clearInterval(id) {
      intervals.cleared = id;
    }
  });

  const { bindVideoPrescriptionSubmitCountdown } = await import(
    "../src/presentation/interactions/videoSubmitLockBindings.js?countdown"
  );

  bindVideoPrescriptionSubmitCountdown();
  assert.equal(countdown.dataset.bound, "true");
  assert.equal(value.textContent, "1s");
  assert.equal(submitButton.disabled, true);
  assert.equal(submitButton.getAttribute("aria-disabled"), "true");

  intervals[0]();
  assert.equal(value.textContent, "0s");
  assert.equal(submitButton.disabled, false);
  assert.equal(countdown.hidden, true);

  bindVideoPrescriptionSubmitCountdown();
  assert.equal(intervals.length, 1);
});
