const levels = [
  { name: "First steps", target: 8, maxSteps: 5, values: [3, 8, 2, 6, 1], hints: ["A loop can visit each position in order.", "Check whether the value at your current index equals the target.", "Return the current index when the comparison is true."], guided: "Start by adding a loop to check the array." },
  { name: "Keep looking", target: 11, maxSteps: 7, values: [4, 2, 11, 7, 1, 9], hints: ["You will need to remember which position you are checking.", "A while loop can keep going while the index is less than the array length.", "If the current value matches, return the index; otherwise increase it."], guided: "Set an index to 0, then loop while it is less than the array length." },
  { name: "Sorted out", target: 14, maxSteps: 4, values: [2, 5, 8, 11, 14, 17, 20, 23], sorted: true, hints: ["This array is sorted. You can eliminate many values at once.", "Compare the middle value to the target and keep the half that could contain it.", "Update low or high around the middle, then repeat while low is at most high."], guided: "Use low and high bounds. Checking the middle can cut the search space in half." },
  { name: "Left or right?", target: 29, maxSteps: 5, values: [3, 7, 12, 18, 24, 29, 35, 42, 51, 63, 78, 91], sorted: true, hints: ["Binary search works because the array is sorted.", "Keep a low and high boundary, then calculate their midpoint.", "If the middle is too small, move low right; if too large, move high left."], guided: "Build binary search: check the middle, then narrow the low/high bounds." },
  { name: "No match", target: 10, maxSteps: 6, values: [1, 4, 7, 13, 18, 22, 30, 41, 56, 72], sorted: true, hints: ["The target is not always in the array.", "A search can stop when its bounds cross without finding the target.", "Use the else path to keep narrowing the bounds; return -1 when no match exists."], guided: "The target is missing. Binary search should return -1 after the bounds cross." }
];

const paletteNames = { for: "↻", while: "↻", if: "◇", else: "↳", set: "x", increment: "+", compare: "=", return: "↗" };
const variableOptions = ["index", "low", "high", "mid"];
const operandOptions = [
  ["array[index]", "array[mid]", "array[low]", "array[high]", "index", "low", "high", "mid", "target", "length"],
  ["target", "array[index]", "array[mid]", "array[low]", "array[high]", "index", "low", "high", "mid", "length"]
];
const expressionOptions = ["0", "index", "low", "high", "mid", "length - 1", "index + 1", "mid + 1", "low + 1", "mid - 1", "high - 1", "floor((low + high) / 2)", "-1"];
const blockDocs = [
  { kind: "for", title: "For each index", description: "Visits every array position from left to right. The selected variable receives the current index before the nested blocks run. Use it for a straightforward linear search.", example: "for each index in array", when: "Use when every item may need to be checked." },
  { kind: "while", title: "While condition", description: "Checks its comparison before each pass and repeats the nested blocks while the condition is true. Change a variable inside the loop so the condition can eventually become false.", example: "while low ≤ high", when: "Use for searches with a changing index or search boundaries." },
  { kind: "if", title: "If condition", description: "Compares the two selected operands. Its nested blocks run only when the comparison is true. Use the + on its bottom tail to attach an else branch for the false case.", example: "if array[mid] == target", when: "Use to choose an action based on a value or condition." },
  { kind: "else", title: "Else", description: "Runs once when its matching if condition is false. Add it with the + on the if tail; it stays paired with that if while blocks are reordered.", example: "else → set low to mid + 1", when: "Use for the alternate path when an if test fails." },
  { kind: "set", title: "Set a variable", description: "Stores a value in index, low, high, or mid. Expressions can use the current variables, array length, or the midpoint formula.", example: "set low to 0", when: "Initialize a search or move a search boundary." },
  { kind: "increment", title: "Increase by 1", description: "Adds one to the selected variable. It does not inspect an array value by itself.", example: "increase index by 1", when: "Advance a linear-search index inside a loop." },
  { kind: "compare", title: "Comparison", description: "Evaluates two operands using ==, !=, <, >, <=, or >=. An array lookup such as array[index] reads the value at that position.", example: "array[index] == target", when: "Use to inspect values or reason about loop bounds." },
  { kind: "return", title: "Return an index", description: "Stops the whole program and returns the selected expression. Return the matching index, or -1 when the target is absent.", example: "return index", when: "Place inside a successful if branch to finish as soon as the target is found." },
  { kind: "comment", title: "Comment", description: "A note for you or another learner. Edit its text directly in the block. Comments are skipped during execution and do not count as steps.", example: "Explain what this loop does…", when: "Use to describe why a loop, condition, or boundary update is needed." }
];
let levelIndex = 0;
let program = [];
let mode = "guided";
let speed = 6;
let hintsUsed = 0;
let runToken = 0;
let toastTimer;
let currentIndex = null;
let checkedIndices = new Set();
let foundIndex = null;
let stepsTaken = 0;
const $ = (selector) => document.querySelector(selector);

function makeBlock(kind) {
  const id = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const block = { id, kind, children: [] };
  if (kind === "set") Object.assign(block, { variable: "index", expression: "0" });
  if (kind === "increment") Object.assign(block, { variable: "index" });
  if (kind === "while") Object.assign(block, { left: "index", operator: "<", right: "length" });
  if (kind === "for") Object.assign(block, { variable: "index" });
  if (kind === "if") Object.assign(block, { left: "array[index]", operator: "==", right: "target" });
  if (kind === "compare") Object.assign(block, { left: "array[index]", operator: "==", right: "target" });
  if (kind === "return") Object.assign(block, { expression: "index" });
  if (kind === "comment") Object.assign(block, { comment: "" });
  return block;
}

function makeSelect(options, value, onChange, className = "") {
  const select = document.createElement("select");
  select.className = className;
  for (const optionValue of options) {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionValue;
    select.append(option);
  }
  select.value = value;
  select.addEventListener("change", () => onChange(select.value));
  return select;
}

function renderDocs() {
  const list = $("#docs-list");
  list.replaceChildren();
  for (const doc of blockDocs) {
    const article = document.createElement("article");
    article.className = "doc-card";
    const heading = document.createElement("h3");
    heading.textContent = doc.title;
    const description = document.createElement("p");
    description.textContent = doc.description;
    const when = document.createElement("p");
    when.className = "doc-when";
    when.textContent = doc.when;
    const example = document.createElement("div");
    const kindClass = ["for", "while"].includes(doc.kind) ? "flow-block" : ["if", "else", "compare"].includes(doc.kind) ? "logic-block" : doc.kind === "comment" ? "comment-block" : "variable-block";
    example.className = `doc-example ${kindClass}${["for", "while", "if", "else"].includes(doc.kind) ? " has-body" : ""}`;
    if (["for", "while", "if", "else"].includes(doc.kind)) {
      const rail = document.createElement("span");
      rail.className = "statement-rail";
      example.append(rail);
    }
    const exampleText = document.createElement("span");
    exampleText.className = "doc-example-text";
    exampleText.textContent = doc.example;
    example.append(exampleText);
    const exampleLabel = document.createElement("span");
    exampleLabel.className = "doc-example-label";
    exampleLabel.textContent = "EXAMPLE";
    article.append(heading, description, when, exampleLabel, example);
    list.append(article);
  }
}

function setDataTab(tab) {
  document.querySelectorAll(".data-tab").forEach(button => {
    const selected = button === tab;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  document.querySelectorAll(".data-view").forEach(view => {
    const selected = view.id === tab.dataset.view;
    view.classList.toggle("active", selected);
    view.hidden = !selected;
  });
}

function addText(parent, text, className) {
  const element = document.createElement("span");
  element.textContent = text;
  if (className) element.className = className;
  parent.append(element);
}

function conditionControls(block) {
  const controls = document.createElement("div");
  controls.className = "block-toolbar";
  addDragHandle(controls);
  addText(controls, "◇", "block-icon");
  addText(controls, "if");
  controls.append(makeSelect(operandOptions[0], block.left, value => { block.left = value; }));
  controls.append(makeSelect(["==", "!=", "<", ">", "<=", ">="], block.operator, value => { block.operator = value; }));
  controls.append(makeSelect(operandOptions[1], block.right, value => { block.right = value; }));
  addRemoveButton(controls, block);
  return controls;
}

function addDragHandle(toolbar) {
  const handle = document.createElement("button");
  handle.className = "block-drag-handle";
  handle.type = "button";
  handle.draggable = true;
  handle.setAttribute("aria-label", "Drag to move block");
  handle.title = "Drag to move block";
  handle.textContent = "⠿";
  handle.addEventListener("dragstart", event => {
    const block = handle.closest(".code-block");
    event.dataTransfer.setData("text/block-id", block.dataset.blockId);
    event.dataTransfer.setData("text/plain", block.dataset.blockId);
    event.dataTransfer.effectAllowed = "move";
    block.classList.add("is-dragging");
  });
  handle.addEventListener("dragend", () => {
    document.querySelectorAll(".is-dragging").forEach(block => block.classList.remove("is-dragging"));
  });
  toolbar.append(handle);
}

function addRemoveButton(toolbar, block) {
  const remove = document.createElement("button");
  remove.className = "remove-block";
  remove.type = "button";
  remove.title = "Remove block";
  remove.setAttribute("aria-label", "Remove block");
  remove.textContent = "×";
  remove.addEventListener("click", () => {
    removeBlock(program, block.id);
    renderProgram();
  });
  toolbar.append(remove);
}

function installBlockContextMenu(element, block) {
  const openMenu = event => {
    event.preventDefault();
    event.stopPropagation();
    document.querySelector(".block-context-menu")?.remove();
    const menu = document.createElement("div");
    menu.className = "block-context-menu";
    menu.setAttribute("role", "menu");
    menu.style.left = `${Math.min(event.clientX, window.innerWidth - 185)}px`;
    menu.style.top = `${Math.min(event.clientY, window.innerHeight - 115)}px`;
    const title = document.createElement("span");
    title.className = "context-menu-title";
    title.textContent = `${blockDocs.find(doc => doc.kind === block.kind)?.title ?? "Block"} settings`;
    menu.append(title);
    const duplicate = document.createElement("button");
    duplicate.type = "button";
    duplicate.setAttribute("role", "menuitem");
    duplicate.textContent = "Duplicate block";
    duplicate.addEventListener("click", () => {
      const parent = findList(program, element.dataset.parentId);
      const index = parent.findIndex(item => item.id === block.id);
      parent.splice(index + 1, 0, cloneBlock(block));
      menu.remove();
      renderProgram();
    });
    menu.append(duplicate);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "context-delete";
    remove.setAttribute("role", "menuitem");
    remove.textContent = "Delete block";
    remove.addEventListener("click", () => {
      removeBlock(program, block.id);
      menu.remove();
      renderProgram();
    });
    menu.append(remove);
    document.body.append(menu);
    const dismiss = dismissal => {
      if (!menu.contains(dismissal.target)) {
        menu.remove();
        document.removeEventListener("pointerdown", dismiss);
        document.removeEventListener("keydown", onEscape);
      }
    };
    const onEscape = keyEvent => {
      if (keyEvent.key === "Escape") {
        menu.remove();
        document.removeEventListener("pointerdown", dismiss);
        document.removeEventListener("keydown", onEscape);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", onEscape);
    duplicate.focus();
  };
  element.addEventListener("contextmenu", openMenu);
  element.addEventListener("dblclick", openMenu);
}

function cloneBlock(block) {
  return { ...block, id: `${block.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, children: block.children.map(cloneBlock) };
}

function makeToolbar(block) {
  const toolbar = document.createElement("div");
  toolbar.className = "block-toolbar";
  const kind = block.kind;
  addDragHandle(toolbar);
  addText(toolbar, paletteNames[kind], "block-icon");
  if (kind === "for") {
    addText(toolbar, "for each");
    toolbar.append(makeSelect(variableOptions, block.variable, value => { block.variable = value; }));
    addText(toolbar, "in array");
  } else if (kind === "while") {
    addText(toolbar, "while");
    toolbar.append(makeSelect(operandOptions[0], block.left, value => { block.left = value; }));
    toolbar.append(makeSelect(["==", "!=", "<", ">", "<=", ">="], block.operator, value => { block.operator = value; }));
    toolbar.append(makeSelect(operandOptions[1], block.right, value => { block.right = value; }));
  } else if (kind === "if" || kind === "compare") {
    addText(toolbar, kind === "if" ? "if" : "compare");
    toolbar.append(makeSelect(operandOptions[0], block.left, value => { block.left = value; }));
    toolbar.append(makeSelect(["==", "!=", "<", ">", "<=", ">="], block.operator, value => { block.operator = value; }));
    toolbar.append(makeSelect(operandOptions[1], block.right, value => { block.right = value; }));
  } else if (kind === "else") {
    addText(toolbar, "else");
  } else if (kind === "set") {
    addText(toolbar, "set");
    toolbar.append(makeSelect(variableOptions, block.variable, value => { block.variable = value; }));
    addText(toolbar, "to");
    toolbar.append(makeSelect(expressionOptions, block.expression, value => { block.expression = value; }));
  } else if (kind === "increment") {
    addText(toolbar, "increase");
    toolbar.append(makeSelect(variableOptions, block.variable, value => { block.variable = value; }));
    addText(toolbar, "by 1");
  } else if (kind === "return") {
    addText(toolbar, "return");
    toolbar.append(makeSelect(expressionOptions, block.expression, value => { block.expression = value; }));
  }
  addRemoveButton(toolbar, block);
  return toolbar;
}

function makeDropZone(blocks, parentId, className = "nested-list") {
  const zone = document.createElement("div");
  zone.className = `${className} drop-zone`;
  zone.dataset.parent = parentId;
  zone.addEventListener("dragover", event => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = event.dataTransfer.types.includes("text/block-id") ? "move" : "copy";
    zone.classList.add("drag-over");
  });
  zone.addEventListener("dragleave", event => {
    if (!zone.contains(event.relatedTarget)) zone.classList.remove("drag-over");
  });
  zone.addEventListener("drop", event => {
    event.preventDefault();
    event.stopPropagation();
    zone.classList.remove("drag-over");
    handleBlockDrop(event, parentId);
  });
  blocks.forEach((block, index) => {
    const element = renderBlock(block, parentId);
    element.style.zIndex = String(blocks.length - index);
    zone.append(element);
  });
  return zone;
}

function takeBlock(blocks, id) {
  const index = blocks.findIndex(block => block.id === id);
  if (index >= 0) return blocks.splice(index, 1)[0];
  for (const block of blocks) {
    const nested = takeBlock(block.children, id);
    if (nested) return nested;
  }
  return null;
}

function containsBlock(blocks, id) {
  return blocks.some(block => block.id === id || containsBlock(block.children, id));
}

function handleBlockDrop(event, parentId, targetBlockId = null) {
  const draggedId = event.dataTransfer.getData("text/block-id");
  const kind = event.dataTransfer.getData("text/block-kind") || (draggedId ? "" : event.dataTransfer.getData("text/plain"));
  if (draggedId) {
    if (draggedId === targetBlockId) return;
    const moving = findBlock(program, draggedId);
    if (!moving || containsBlock(moving.children, parentId) || (targetBlockId && containsBlock(moving.children, targetBlockId))) return;
    const removed = takeBlock(program, draggedId);
    const destination = findList(program, parentId);
    if (!removed || !destination) return;
    let position = destination.length;
    if (targetBlockId) {
      const targetIndex = destination.findIndex(block => block.id === targetBlockId);
      if (targetIndex >= 0) {
        const rect = event.currentTarget.getBoundingClientRect();
        position = targetIndex + (event.clientY > rect.top + rect.height / 2 ? 1 : 0);
      }
    }
    destination.splice(position, 0, removed);
    renderProgram();
    return;
  }
  if (!kind) return;
  let destination = findList(program, parentId);
  let position = destination?.length ?? 0;
  if (targetBlockId) {
    const target = destination?.find(block => block.id === targetBlockId);
    if (target && ["for", "while", "if", "else"].includes(target.kind)) {
      destination = target.children;
      position = destination.length;
    } else {
      const index = destination?.findIndex(block => block.id === targetBlockId) ?? -1;
      if (index >= 0) {
        const rect = event.currentTarget.getBoundingClientRect();
        position = index + (event.clientY > rect.top + rect.height / 2 ? 1 : 0);
      }
    }
  }
  if (!destination) return;
  destination.splice(position, 0, makeBlock(kind));
  renderProgram();
}

function showBlockMenu(button, callback) {
  document.querySelector(".block-menu")?.remove();
  const menu = document.createElement("div");
  menu.className = "block-menu";
  for (const [kind, label] of Object.entries({
    for: "for each index", while: "while condition", if: "if condition", else: "else",
    set: "set a variable", increment: "increase by 1", compare: "comparison", return: "return an index", comment: "comment"
  })) {
    const option = document.createElement("button");
    option.type = "button";
    option.textContent = label;
    option.addEventListener("click", () => {
      callback(kind);
      menu.remove();
      document.removeEventListener("pointerdown", dismiss);
    });
    menu.append(option);
  }
  button.after(menu);
  const dismiss = event => {
    if (!menu.contains(event.target) && event.target !== button) {
      menu.remove();
      document.removeEventListener("pointerdown", dismiss);
    }
  };
  document.addEventListener("pointerdown", dismiss);
}

function renderBlock(block, parentId) {
  const element = document.createElement("div");
  const isStatement = ["for", "while", "if", "else"].includes(block.kind);
  const colorClass = ["for", "while"].includes(block.kind) ? "flow-block" : block.kind === "if" || block.kind === "else" ? "logic-block" : block.kind === "comment" ? "comment-block" : "variable-block";
  element.className = `code-block ${colorClass}${isStatement ? " has-body" : ""}`;
  element.dataset.blockId = block.id;
  element.dataset.parentId = parentId;
  installBlockContextMenu(element, block);
  element.addEventListener("dragover", event => event.preventDefault());
  element.addEventListener("drop", event => {
    event.preventDefault();
    event.stopPropagation();
    handleBlockDrop(event, parentId, block.id);
  });
  if (isStatement) {
    const rail = document.createElement("span");
    rail.className = "statement-rail";
    rail.setAttribute("aria-hidden", "true");
    element.append(rail);
  }
  if (block.kind === "if") {
    element.append(conditionControls(block));
  } else {
    element.append(makeToolbar(block));
  }
  if (block.kind === "comment") {
    const note = document.createElement("textarea");
    note.className = "comment-input";
    note.rows = 2;
    note.placeholder = "Write a note about your algorithm…";
    note.setAttribute("aria-label", "Comment text");
    note.value = block.comment;
    note.addEventListener("input", () => { block.comment = note.value; });
    element.append(note);
  }
  element.querySelectorAll("input, select, textarea").forEach(control => {
    control.addEventListener("dblclick", event => event.stopPropagation());
  });
  if (["for", "while", "if", "else"].includes(block.kind)) {
    const wrap = document.createElement("div");
    wrap.className = "nested-wrap";
    const label = document.createElement("span");
    label.className = "nested-label";
    label.textContent = block.kind === "if" ? "THEN" : block.kind === "else" ? "ELSE BODY" : "REPEAT";
    wrap.append(label, makeDropZone(block.children, block.id));
    if (block.kind === "if") {
      const siblings = findList(program, parentId);
      const index = siblings.findIndex(item => item.id === block.id);
      if (siblings[index + 1]?.kind !== "else") {
        const branchButton = document.createElement("button");
        branchButton.className = "if-branch-button";
        branchButton.type = "button";
        branchButton.textContent = "+";
        branchButton.title = "Add an else branch";
        branchButton.setAttribute("aria-label", "Add else branch");
        branchButton.addEventListener("click", () => {
          const refreshedSiblings = findList(program, parentId);
          const refreshedIndex = refreshedSiblings.findIndex(item => item.id === block.id);
          if (refreshedSiblings[refreshedIndex + 1]?.kind !== "else") {
            refreshedSiblings.splice(refreshedIndex + 1, 0, makeBlock("else"));
            renderProgram();
          }
        });
        wrap.append(branchButton);
      }
    }
    const add = document.createElement("button");
    add.className = "add-nested";
    add.type = "button";
    add.textContent = "+ add inside";
    add.addEventListener("click", () => showBlockMenu(add, kind => { block.children.push(makeBlock(kind)); renderProgram(); }));
    wrap.append(add);
    element.append(wrap);
  }
  return element;
}

function findList(blocks, parentId) {
  if (parentId === "root") return blocks;
  for (const block of blocks) {
    if (block.id === parentId) return block.children;
    const nested = findList(block.children, parentId);
    if (nested) return nested;
  }
  return null;
}

function findBlock(blocks, id) {
  for (const block of blocks) {
    if (block.id === id) return block;
    const nested = findBlock(block.children, id);
    if (nested) return nested;
  }
  return null;
}

function removeBlock(blocks, id) {
  const index = blocks.findIndex(block => block.id === id);
  if (index >= 0) {
    const [removed] = blocks.splice(index, 1);
    if (removed.kind === "if" && blocks[index]?.kind === "else") blocks.splice(index, 1);
    return true;
  }
  return blocks.some(block => removeBlock(block.children, id));
}

function renderProgram() {
  const root = makeDropZone(program, "root", "program-list");
  root.id = "program-list";
  $("#program-list").replaceWith(root);
  $(".add-root-button").onclick = () => showBlockMenu($(".add-root-button"), kind => { program.push(makeBlock(kind)); renderProgram(); });
  updateGuidance();
}

function getLevel() { return levels[levelIndex]; }

function updateGuidance() {
  const recommended = levelIndex === 0
    ? ["for", "if", "return"]
    : levelIndex === 1
      ? ["set", "while", "if", "increment", "return"]
      : ["set", "while", "if", "return"];
  const allBlocks = [];
  const collect = blocks => blocks.forEach(block => { allBlocks.push(block); collect(block.children); });
  collect(program);
  const missing = recommended.find(kind => !allBlocks.some(block => block.kind === kind));
  document.querySelectorAll(".palette-block").forEach(block => {
    block.classList.toggle("recommended", mode === "guided" && block.dataset.kind === missing);
  });
  if (mode === "guided" && missing) {
    const labels = { for: "a for loop", while: "a while loop", if: "an if block", return: "a return block", set: "a variable block", increment: "an increment block" };
    $("#guided-message").textContent = `Next, add ${labels[missing]} — it is highlighted in your toolbox.`;
  }
}

function setupLevel() {
  runToken++;
  document.querySelector(".next-level-button")?.remove();
  const level = getLevel();
  $("#level-select").value = String(levelIndex);
  $("#level-name").textContent = level.name;
  $("#level-count").textContent = `${levelIndex + 1} / ${levels.length}`;
  $("#challenge-text").innerHTML = `Find <strong>${level.target}</strong> and return its index${level.sorted ? " using the sorted array" : ""}.`;
  $("#target-stat").textContent = level.target;
  $("#steps-stat").textContent = level.maxSteps;
  $("#array-size").textContent = level.values.length;
  hintsUsed = 0;
  $("#hint-count").textContent = `0/${level.hints.length}`;
  $("#hint-button").disabled = false;
  $("#hint-button").style.opacity = "1";
  $("#guided-message").textContent = level.guided;
  $("#guided-banner").classList.toggle("hidden", mode !== "guided");
  currentIndex = null;
  checkedIndices = new Set();
  foundIndex = null;
  stepsTaken = 0;
  updateChart();
  updateMetrics();
  $("#result-card").classList.remove("success", "failure");
  $("#result-text").textContent = "Waiting to run";
  $("#execution-label").textContent = "Ready to run";
  $("#execution-dot").className = "execution-dot";
  $("#run-button").disabled = false;
  $("#run-button").innerHTML = "<span>▶</span> Run algorithm";
}

function updateChart() {
  const chart = $("#array-chart");
  chart.replaceChildren();
  const values = getLevel().values;
  const max = Math.max(...values);
  $("#max-value-label").textContent = max;
  $("#mid-value-label").textContent = Math.round(max / 2);
  values.forEach((value, index) => {
    const item = document.createElement("div");
    item.className = "bar-item";
    if (index === currentIndex) item.classList.add("current");
    if (checkedIndices.has(index)) item.classList.add("checked");
    if (index === foundIndex) item.classList.add("found");
    const label = document.createElement("span");
    label.className = "bar-value";
    label.textContent = value;
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${Math.max(7, (value / max) * 116)}px`;
    const indexLabel = document.createElement("span");
    indexLabel.className = "bar-index";
    indexLabel.textContent = index;
    bar.append(indexLabel);
    item.append(label, bar);
    chart.append(item);
  });
}

function updateMetrics(variables = {}) {
  $("#step-count").textContent = stepsTaken;
  $("#step-limit").textContent = `/ ${getLevel().maxSteps}`;
  $("#meter-fill").style.width = `${Math.min(100, stepsTaken / getLevel().maxSteps * 100)}%`;
  const variableList = $("#variable-list");
  variableList.replaceChildren();
  const entries = Object.entries(variables);
  if (!entries.length) {
    const empty = document.createElement("span");
    empty.className = "empty-vars";
    empty.textContent = "Variables appear as your program runs.";
    variableList.append(empty);
    return;
  }
  for (const [name, value] of entries) {
    const chip = document.createElement("span");
    chip.className = "variable-chip";
    const label = document.createElement("strong");
    label.textContent = `${name} = `;
    chip.append(label, document.createTextNode(String(value)));
    variableList.append(chip);
  }
}

function resolve(value, vars) {
  if (value.startsWith("array[")) {
    const variable = value.slice(6, -1);
    const index = variable === "middle" ? vars.mid : vars[variable];
    return Number.isInteger(index) && index >= 0 && index < getLevel().values.length ? getLevel().values[index] : NaN;
  }
  if (value === "length") return getLevel().values.length;
  if (value === "target") return getLevel().target;
  if (value === "length - 1") return getLevel().values.length - 1;
  if (value === "floor((low + high) / 2)") return Math.floor((vars.low + vars.high) / 2);
  const arithmetic = value.match(/^(index|low|high|mid) ([+-]) 1$/);
  if (arithmetic) return vars[arithmetic[1]] + (arithmetic[2] === "+" ? 1 : -1);
  if (/^-?\d+$/.test(value)) return Number(value);
  return vars[value];
}

function compare(left, operator, right) {
  switch (operator) {
    case "==": return left === right;
    case "!=": return left !== right;
    case "<": return left < right;
    case ">": return left > right;
    case "<=": return left <= right;
    case ">=": return left >= right;
    default: return false;
  }
}

function delay(ms, token) {
  return new Promise(resolveDelay => {
    const timer = setTimeout(resolveDelay, ms);
    if (token !== runToken) { clearTimeout(timer); resolveDelay(); }
  });
}

async function executeList(blocks, vars, token, depth = 0) {
  if (depth > 12 || token !== runToken) return null;
  let previousIf = false;
  for (const block of blocks) {
    if (token !== runToken) return null;
    document.querySelectorAll(".block-highlight").forEach(el => el.classList.remove("block-highlight"));
    document.querySelector(`[data-block-id="${block.id}"]`)?.classList.add("block-highlight");
    if (block.kind === "if" || block.kind === "compare") {
      const arrayOperand = [block.left, block.right].find(value => value.startsWith("array["));
      if (arrayOperand) {
        const variable = arrayOperand.slice(6, -1);
        const index = variable === "middle" ? vars.mid : vars[variable];
        if (Number.isInteger(index)) await visitIndex(index, vars, token);
      }
      const result = compare(resolve(block.left, vars), block.operator, resolve(block.right, vars));
      if (block.kind === "compare") { previousIf = result; continue; }
      previousIf = result;
      if (result) {
        const returned = await executeList(block.children, vars, token, depth + 1);
        if (returned) return returned;
      }
    } else if (block.kind === "else") {
      if (!previousIf) {
        const returned = await executeList(block.children, vars, token, depth + 1);
        if (returned) return returned;
      }
    } else if (block.kind === "set") {
      vars[block.variable] = resolve(block.expression, vars);
      updateMetrics(vars);
    } else if (block.kind === "increment") {
      vars[block.variable] = (Number.isFinite(vars[block.variable]) ? vars[block.variable] : 0) + 1;
      updateMetrics(vars);
    } else if (block.kind === "return") {
      return { value: resolve(block.expression, vars) };
    } else if (block.kind === "for") {
      for (let index = 0; index < getLevel().values.length && token === runToken; index++) {
        vars[block.variable] = index;
        const returned = await executeList(block.children, vars, token, depth + 1);
        if (returned) return returned;
      }
    } else if (block.kind === "while") {
      let iterations = 0;
      while (compare(resolve(block.left, vars), block.operator, resolve(block.right, vars)) && iterations < 100 && token === runToken) {
        const returned = await executeList(block.children, vars, token, depth + 1);
        if (returned) return returned;
        iterations++;
        if (iterations >= 100) throw new Error("The while loop ran too many times. Check that its condition can become false.");
      }
    }
    if (token !== runToken) return null;
    await delay(Math.round(getStepDelay() / 3), token);
  }
  return null;
}

async function visitIndex(index, vars, token) {
  if (index < 0 || index >= getLevel().values.length || token !== runToken) return Promise.resolve();
  if (currentIndex === index && checkedIndices.has(index)) return delay(Math.round(getStepDelay() / 3), token);
  currentIndex = index;
  checkedIndices.add(index);
  stepsTaken++;
  updateChart();
  updateMetrics(vars);
  await delay(getStepDelay(), token);
}

function getStepDelay() {
  return Math.round(900 / speed);
}

async function runProgram() {
  const token = ++runToken;
  currentIndex = null;
  checkedIndices = new Set();
  foundIndex = null;
  stepsTaken = 0;
  $("#result-card").classList.remove("success", "failure");
  $("#result-text").textContent = "Running…";
  $("#execution-label").textContent = "Running your blocks";
  $("#execution-dot").className = "execution-dot running";
  $("#run-button").disabled = true;
  $("#run-button").innerHTML = "<span>◌</span> Running…";
  const vars = {};
  updateMetrics(vars);
  updateChart();
  try {
    const result = await executeList(program, vars, token);
    if (token !== runToken) return;
    const success = result && result.value === getLevel().values.indexOf(getLevel().target) && stepsTaken <= getLevel().maxSteps;
    if (result) {
      const value = result.value;
      if (Number.isInteger(value) && value >= 0 && value < getLevel().values.length) {
        currentIndex = value;
        foundIndex = getLevel().values[value] === getLevel().target ? value : null;
        updateChart();
      }
      $("#result-text").textContent = `Returned ${value}`;
    } else {
      $("#result-text").textContent = "No index returned";
    }
    $("#result-card").classList.add(success ? "success" : "failure");
    $("#execution-label").textContent = success ? "Challenge complete!" : stepsTaken > getLevel().maxSteps ? "Step limit exceeded" : "Not quite — try again";
    $("#execution-dot").className = `execution-dot${success ? "" : " error"}`;
    if (success) {
      showToast("Nice work! You solved the challenge.");
      if (levelIndex < levels.length - 1) {
        document.querySelector(".next-level-button")?.remove();
        const next = document.createElement("button");
        next.className = "next-level-button";
        next.textContent = "Next level →";
        next.addEventListener("click", () => { levelIndex++; setupLevel(); next.remove(); });
        $(".canvas-actions").append(next);
      }
    } else {
      showToast(stepsTaken > getLevel().maxSteps ? "The step limit was exceeded. Try narrowing the search." : "Your algorithm didn't meet the challenge yet.");
    }
  } catch (error) {
    if (token !== runToken) return;
    $("#result-text").textContent = "Program error";
    $("#result-card").classList.add("failure");
    $("#execution-label").textContent = error.message;
    $("#execution-dot").className = "execution-dot error";
    showToast(error.message);
  } finally {
    if (token === runToken) {
      $("#run-button").disabled = false;
      $("#run-button").innerHTML = "<span>▶</span> Run algorithm";
      document.querySelectorAll(".block-highlight").forEach(el => el.classList.remove("block-highlight"));
    }
  }
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function installPalette() {
  document.querySelectorAll(".palette-block").forEach(button => {
    button.addEventListener("dragstart", event => {
      event.dataTransfer.setData("text/block-kind", button.dataset.kind);
      event.dataTransfer.setData("text/plain", button.dataset.kind);
      event.dataTransfer.effectAllowed = "copy";
    });
    button.addEventListener("click", () => { program.push(makeBlock(button.dataset.kind)); renderProgram(); });
  });
}

function filterPalette(search) {
  const query = search.trim().toLowerCase();
  document.querySelectorAll(".palette-group").forEach(group => {
    const buttons = [...group.querySelectorAll(".palette-block")];
    let visibleCount = 0;
    for (const button of buttons) {
      const kind = button.dataset.kind;
      const doc = blockDocs.find(item => item.kind === kind);
      const matches = !query || `${button.textContent} ${kind} ${doc?.description ?? ""} ${doc?.when ?? ""}`.toLowerCase().includes(query);
      button.hidden = !matches;
      visibleCount += Number(matches);
    }
    group.hidden = visibleCount === 0;
  });
}

function installEvents() {
  $("#level-select").addEventListener("change", event => {
    levelIndex = Number(event.target.value);
    setupLevel();
  });
  $("#run-button").addEventListener("click", runProgram);
  $("#clear-button").addEventListener("click", () => {
    runToken++;
    program = [];
    renderProgram();
    setupLevel();
  });
  $("#reset-button").addEventListener("click", () => {
    runToken++;
    setupLevel();
    showToast("Challenge reset. Your blocks are still here.");
  });
  $("#shuffle-button").addEventListener("click", () => {
    levelIndex = (levelIndex + 1) % levels.length;
    setupLevel();
  });
  $("#hint-button").addEventListener("click", () => {
    const hints = getLevel().hints;
    if (hintsUsed >= hints.length) return;
    $("#guided-message").textContent = hints[hintsUsed++];
    $("#guided-banner").classList.remove("hidden");
    $("#hint-count").textContent = `${hintsUsed}/${hints.length}`;
    if (hintsUsed === hints.length) {
      $("#hint-button").disabled = true;
      $("#hint-button").style.opacity = ".55";
    }
  });
  $("#dismiss-guided").addEventListener("click", () => $("#guided-banner").classList.add("hidden"));
  $("#speed-range").addEventListener("input", event => {
    speed = Number(event.target.value);
    $("#speed-value").textContent = `${speed}×`;
  });
  $("#block-search").addEventListener("input", event => filterPalette(event.target.value));
  $("#block-search").addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.currentTarget.value = "";
      filterPalette("");
      event.currentTarget.blur();
    }
  });
  const canvas = $(".program-scroll");
  let panStart = null;
  canvas.addEventListener("dragover", event => event.preventDefault());
  canvas.addEventListener("drop", event => {
    event.preventDefault();
    handleBlockDrop(event, "root");
  });
  canvas.addEventListener("pointerdown", event => {
    if (event.button !== 0 || event.target.closest(".code-block, button, input, select, textarea, a")) return;
    panStart = { x: event.clientX, y: event.clientY, left: canvas.scrollLeft, top: canvas.scrollTop, pointerId: event.pointerId };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("panning");
  });
  canvas.addEventListener("pointermove", event => {
    if (!panStart || panStart.pointerId !== event.pointerId) return;
    canvas.scrollLeft = panStart.left - (event.clientX - panStart.x);
    canvas.scrollTop = panStart.top - (event.clientY - panStart.y);
  });
  const stopPanning = event => {
    if (!panStart || (event.pointerId !== undefined && panStart.pointerId !== event.pointerId)) return;
    panStart = null;
    canvas.classList.remove("panning");
  };
  canvas.addEventListener("pointerup", stopPanning);
  canvas.addEventListener("pointercancel", stopPanning);
  document.addEventListener("keydown", event => {
    if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      $("#block-search").focus();
    }
  });
  document.querySelectorAll(".data-tab").forEach(tab => tab.addEventListener("click", () => setDataTab(tab)));
  document.querySelectorAll(".mode-button").forEach(button => button.addEventListener("click", () => {
    mode = button.dataset.mode;
    document.querySelectorAll(".mode-button").forEach(item => item.classList.toggle("active", item === button));
    $("#guided-banner").classList.toggle("hidden", mode !== "guided");
    updateGuidance();
  }));
}

const levelSelect = $("#level-select");
levels.forEach((level, index) => {
  const option = document.createElement("option");
  option.value = index;
  option.textContent = `${String(index + 1).padStart(2, "0")} · ${level.name}`;
  levelSelect.append(option);
});
installPalette();
installEvents();
renderDocs();
renderProgram();
setupLevel();
