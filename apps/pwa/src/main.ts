import { createCalculatorFacade, keyIntentToCommand, KeyIntent } from "@rpn/contracts";
import "./style.css";

const keys: ReadonlyArray<KeyIntent> = [
  "7", "8", "9", "/", "ENTER",
  "4", "5", "6", "*", "SWAP",
  "1", "2", "3", "-", "DROP",
  "0", ".", "BACK", "+", "CLR"
];

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("App root not found");
}

app.innerHTML = `
  <main class="shell">
    <section class="display">
      <div id="error" class="error"></div>
      <pre id="stack" class="stack"></pre>
      <div id="entry" class="entry"></div>
    </section>
    <section id="keys" class="keys"></section>
  </main>
`;

const facade = createCalculatorFacade();
const errorEl = document.querySelector<HTMLDivElement>("#error");
const stackEl = document.querySelector<HTMLPreElement>("#stack");
const entryEl = document.querySelector<HTMLDivElement>("#entry");
const keysEl = document.querySelector<HTMLDivElement>("#keys");

if (!errorEl || !stackEl || !entryEl || !keysEl) {
  throw new Error("Missing UI elements");
}

const render = () => {
  const display = facade.toDisplayModel();
  stackEl.textContent = display.stackLines.join("\n");
  entryEl.textContent = display.entryLine;
  errorEl.textContent = display.error ?? "";
};

keys.forEach((intent) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "key";
  button.dataset.intent = intent;
  button.textContent = intent;
  button.addEventListener("click", () => {
    facade.dispatch(keyIntentToCommand(intent));
    render();
  });
  keysEl.append(button);
});

window.addEventListener("keydown", (event) => {
  const map: Record<string, KeyIntent | undefined> = {
    Enter: "ENTER",
    Backspace: "BACK",
    Escape: "CLR",
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
  facade.dispatch(keyIntentToCommand(intent));
  render();
});

render();
