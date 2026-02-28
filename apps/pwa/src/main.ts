import { createCalculatorFacade, keyIntentToCommand, KeyIntent } from "@rpn/contracts";
import "./style.css";

const keypadIntents: ReadonlyArray<KeyIntent> = [
  "7", "8", "9",
  "4", "5", "6",
  "1", "2", "3",
  "0", ".", "BACK"
];

const operatorIntents: ReadonlyArray<KeyIntent> = [
  "+", "-", "*", "/"
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
    <section class="input-area">
      <input id="entry" class="entry-input" type="text" readonly />
      <button id="enter-key" class="enter-key" type="button">Enter</button>
    </section>
    <section class="keypad-area">
      <div id="keypad" class="keypad"></div>
      <div id="ops" class="ops"></div>
    </section>
  </main>
`;

const facade = createCalculatorFacade();
const errorEl = document.querySelector<HTMLDivElement>("#error");
const stackEl = document.querySelector<HTMLDivElement>("#stack");
const entryEl = document.querySelector<HTMLInputElement>("#entry");
const keypadEl = document.querySelector<HTMLDivElement>("#keypad");
const opsEl = document.querySelector<HTMLDivElement>("#ops");
const enterKeyEl = document.querySelector<HTMLButtonElement>("#enter-key");

if (!errorEl || !stackEl || !entryEl || !keypadEl || !opsEl || !enterKeyEl) {
  throw new Error("Missing UI elements");
}

const runIntent = (intent: KeyIntent) => {
  facade.dispatch(keyIntentToCommand(intent));
  render();
};

const createKey = (intent: KeyIntent, className: string): HTMLButtonElement => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.intent = intent;
  button.textContent = intent;
  button.addEventListener("click", () => runIntent(intent));
  return button;
};

keypadIntents.forEach((intent) => {
  keypadEl.append(createKey(intent, "key"));
});

operatorIntents.forEach((intent) => {
  opsEl.append(createKey(intent, "op-key"));
});

enterKeyEl.addEventListener("click", () => runIntent("ENTER"));

const renderStackLines = (lines: ReadonlyArray<string>): string =>
  lines.length === 0 ? "(empty)" : lines.join("<br />");

const render = () => {
  const display = facade.toDisplayModel();
  stackEl.innerHTML = renderStackLines(display.stackLines);
  entryEl.value = display.entryLine === "_" ? "" : display.entryLine;
  entryEl.placeholder = "_";
  errorEl.textContent = display.error ?? "";
};

window.addEventListener("keydown", (event) => {
  const map: Record<string, KeyIntent | undefined> = {
    Enter: "ENTER",
    Backspace: "BACK",
    ".": ".",
    "+": "+",
    "-": "-",
    "*": "*",
    "/": "/"
  };
  const digit = /^\d$/.test(event.key) ? (event.key as KeyIntent) : undefined;
  const intent = digit ?? map[event.key];
  if (!intent) {
    return;
  }
  event.preventDefault();
  runIntent(intent);
});

render();
