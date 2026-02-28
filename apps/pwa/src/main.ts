import { createCalculatorFacade, keyIntentToCommand, KeyIntent } from "@rpn/contracts";
import "./style.css";

type KeypadIntent = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "." | "BACK";

type ConstKey = "PI" | "E";

const keypadIntents: ReadonlyArray<KeypadIntent> = [
  "7", "8", "9",
  "4", "5", "6",
  "1", "2", "3",
  "0", ".", "BACK"
];

const operatorIntents: ReadonlyArray<KeyIntent> = [
  "+", "-", "*", "/"
];

const functionIntents = [
  { label: "x^2", intent: "SQR" as KeyIntent },
  { label: "sqrt", intent: "SQRT" as KeyIntent },
  { label: "sin", intent: "SIN" as KeyIntent },
  { label: "cos", intent: "COS" as KeyIntent },
  { label: "tan", intent: "TAN" as KeyIntent },
  { label: "exp", intent: "EXP" as KeyIntent },
  { label: "ln", intent: "LN" as KeyIntent },
  { label: "log10", intent: "LOG" as KeyIntent }
];

const commandIntents = [
  { label: "UNDO", intent: "UNDO" as KeyIntent },
  { label: "REDO", intent: "REDO" as KeyIntent },
  { label: "CLEAR", intent: "CLR" as KeyIntent },
  { label: "DEL", intent: "DROP" as KeyIntent }
];

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("App root not found");
}

app.innerHTML = `
  <main class="screen">
    <section class="stack-area">
      <div id="error" class="error"></div>
      <div id="stack" class="stack"></div>
    </section>
    <section class="command-area">
      <div id="commands" class="commands"></div>
      <div id="ops" class="ops"></div>
    </section>
    <section class="input-area">
      <div id="fx-panel" class="fx-panel hidden"></div>
      <div id="const-panel" class="const-panel hidden">
        <button class="const-key" data-const="PI" type="button">π</button>
        <button class="const-key" data-const="E" type="button">e</button>
      </div>
      <div class="entry-row">
        <input id="entry" class="entry-input" type="text" readonly />
        <button id="const-toggle" class="const-toggle" type="button">π</button>
        <button id="enter-key" class="enter-key" type="button">ENTER</button>
      </div>
      <div id="keypad" class="keypad"></div>
    </section>
  </main>
`;

const facade = createCalculatorFacade();
let entryDraft = "";
let fxOpen = false;
let fxGesturePointerId: number | null = null;
let fxHoverIntent: KeyIntent | null = null;
let constOpen = false;
let constGesturePointerId: number | null = null;
let constHoverKey: ConstKey | null = null;

const errorEl = document.querySelector<HTMLDivElement>("#error");
const stackEl = document.querySelector<HTMLDivElement>("#stack");
const entryEl = document.querySelector<HTMLInputElement>("#entry");
const commandsEl = document.querySelector<HTMLDivElement>("#commands");
const opsEl = document.querySelector<HTMLDivElement>("#ops");
const fxPanelEl = document.querySelector<HTMLDivElement>("#fx-panel");
const constPanelEl = document.querySelector<HTMLDivElement>("#const-panel");
const constToggleEl = document.querySelector<HTMLButtonElement>("#const-toggle");
const keypadEl = document.querySelector<HTMLDivElement>("#keypad");
const enterKeyEl = document.querySelector<HTMLButtonElement>("#enter-key");

if (!errorEl || !stackEl || !entryEl || !commandsEl || !opsEl || !fxPanelEl || !constPanelEl || !constToggleEl || !keypadEl || !enterKeyEl) {
  throw new Error("Missing UI elements");
}

const runIntent = (intent: KeyIntent) => {
  facade.dispatch(keyIntentToCommand(intent));
  render();
};

const appendEntry = (value: string) => {
  if (!/^\d$/.test(value) && value !== ".") {
    return;
  }
  if (value === "." && entryDraft.includes(".")) {
    return;
  }
  entryDraft += value;
  render();
};

const backspaceEntry = () => {
  if (entryDraft.length === 0) {
    return;
  }
  entryDraft = entryDraft.slice(0, -1);
  render();
};

const commitEntry = () => {
  if (entryDraft === "") {
    return;
  }
  facade.dispatch({ type: "enter", value: entryDraft });
  entryDraft = "";
  render();
};

const runCommandIntent = (intent: KeyIntent) => {
  if (intent === "CLR") {
    entryDraft = "";
  }
  const needsCommittedEntry: ReadonlyArray<KeyIntent> = [
    "+", "-", "*", "/", "SWAP", "DROP",
    "SQR", "SQRT", "SIN", "COS", "TAN", "EXP", "LN", "LOG"
  ];
  if (needsCommittedEntry.includes(intent) && entryDraft !== "") {
    commitEntry();
  }
  runIntent(intent);
};

const createKey = (label: string, intent: string, className: string): HTMLButtonElement => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.intent = intent;
  button.textContent = label;
  button.addEventListener("click", () => {
    if (intent === "BACK") {
      backspaceEntry();
      return;
    }
    if (intent === "FX") {
      return;
    }
    if (/^\d$/.test(intent) || intent === ".") {
      appendEntry(intent);
      return;
    }
    runCommandIntent(intent as KeyIntent);
  });
  return button;
};

const createFxKey = (label: string, intent: KeyIntent): HTMLButtonElement => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "fx-key";
  button.dataset.intent = intent;
  button.textContent = label;
  return button;
};

const updateFxHover = (x: number, y: number) => {
  const hit = document.elementFromPoint(x, y);
  const button = hit?.closest(".fx-key") as HTMLButtonElement | null;
  const nextIntent = (button?.dataset.intent ?? null) as KeyIntent | null;
  if (fxHoverIntent === nextIntent) {
    return;
  }
  fxHoverIntent = nextIntent;
  render();
};

const finishFxGesture = () => {
  const selected = fxHoverIntent;
  fxGesturePointerId = null;
  fxHoverIntent = null;
  fxOpen = false;
  render();
  if (selected) {
    runCommandIntent(selected);
  }
};

const updateConstHover = (x: number, y: number) => {
  const hit = document.elementFromPoint(x, y);
  const button = hit?.closest(".const-key") as HTMLButtonElement | null;
  const next = (button?.dataset.const ?? null) as ConstKey | null;
  if (next === constHoverKey) {
    return;
  }
  constHoverKey = next;
  render();
};

const applyConstant = (key: ConstKey) => {
  entryDraft = key === "PI" ? `${Math.PI}` : `${Math.E}`;
};

const finishConstGesture = () => {
  const selected = constHoverKey ?? "PI";
  applyConstant(selected);
  constGesturePointerId = null;
  constHoverKey = null;
  constOpen = false;
  render();
};

commandIntents.forEach(({ label, intent }) => {
  commandsEl.append(createKey(label, intent, "command-key"));
});

keypadIntents.forEach((intent) => {
  keypadEl.append(createKey(intent, intent, "key"));
});

operatorIntents.forEach((intent) => {
  opsEl.append(createKey(intent, intent, "op-key"));
});

const fxToggleEl = createKey("f(x)", "FX", "fx-toggle");
opsEl.append(fxToggleEl);

functionIntents.forEach(({ label, intent }) => {
  fxPanelEl.append(createFxKey(label, intent));
});

fxToggleEl.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  constOpen = false;
  fxGesturePointerId = event.pointerId;
  fxHoverIntent = null;
  fxOpen = true;
  fxToggleEl.setPointerCapture(event.pointerId);
  render();
});

constToggleEl.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  fxOpen = false;
  constGesturePointerId = event.pointerId;
  constHoverKey = null;
  constOpen = true;
  constToggleEl.setPointerCapture(event.pointerId);
  render();
});

window.addEventListener("pointermove", (event) => {
  if (constGesturePointerId !== null && event.pointerId === constGesturePointerId) {
    updateConstHover(event.clientX, event.clientY);
    return;
  }
  if (fxGesturePointerId !== null && event.pointerId === fxGesturePointerId) {
    updateFxHover(event.clientX, event.clientY);
  }
});

window.addEventListener("pointerup", (event) => {
  if (constGesturePointerId !== null && event.pointerId === constGesturePointerId) {
    finishConstGesture();
    return;
  }
  if (fxGesturePointerId !== null && event.pointerId === fxGesturePointerId) {
    finishFxGesture();
  }
});

window.addEventListener("pointercancel", (event) => {
  if (constGesturePointerId !== null && event.pointerId === constGesturePointerId) {
    constGesturePointerId = null;
    constHoverKey = null;
    constOpen = false;
    render();
    return;
  }
  if (fxGesturePointerId !== null && event.pointerId === fxGesturePointerId) {
    fxGesturePointerId = null;
    fxHoverIntent = null;
    fxOpen = false;
    render();
  }
});

enterKeyEl.addEventListener("click", () => {
  commitEntry();
});

const renderStackLines = (lines: ReadonlyArray<string>): string =>
  lines.length === 0 ? "(empty)" : lines.join("\n");

const render = () => {
  const display = facade.toDisplayModel();
  stackEl.textContent = renderStackLines(display.stackLines);
  entryEl.value = entryDraft;
  entryEl.placeholder = "_";
  errorEl.textContent = display.error ?? "";
  fxPanelEl.classList.toggle("hidden", !fxOpen);
  constPanelEl.classList.toggle("hidden", !constOpen);
  fxToggleEl.classList.toggle("active", fxOpen);
  constToggleEl.classList.toggle("active", constOpen);
  fxPanelEl.querySelectorAll<HTMLButtonElement>(".fx-key").forEach((button) => {
    const active = button.dataset.intent === fxHoverIntent;
    button.classList.toggle("active", active);
  });
  constPanelEl.querySelectorAll<HTMLButtonElement>(".const-key").forEach((button) => {
    const active = button.dataset.const === constHoverKey;
    button.classList.toggle("active", active);
  });
};

window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) {
      runIntent("REDO");
    } else {
      runIntent("UNDO");
    }
    return;
  }
  if (event.ctrlKey && event.key.toLowerCase() === "y") {
    event.preventDefault();
    runIntent("REDO");
    return;
  }

  const map: Record<string, KeyIntent | undefined> = {
    "+": "+",
    "-": "-",
    "*": "*",
    "/": "/",
    Delete: "DROP",
    Escape: "CLR",
    F7: "UNDO",
    F8: "REDO"
  };

  if (event.key === "Enter") {
    event.preventDefault();
    commitEntry();
    return;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    backspaceEntry();
    return;
  }

  if (/^\d$/.test(event.key)) {
    event.preventDefault();
    appendEntry(event.key);
    return;
  }

  if (event.key === ".") {
    event.preventDefault();
    appendEntry(".");
    return;
  }

  const intent = map[event.key];
  if (!intent) {
    return;
  }
  event.preventDefault();
  runCommandIntent(intent);
});

render();
