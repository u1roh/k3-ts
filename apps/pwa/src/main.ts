import { createCalculatorFacade, keyIntentToCommand, KeyIntent } from "@rpn/contracts";
import "./style.css";

type KeypadIntent = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "." | "BACK";

const keypadIntents: ReadonlyArray<KeypadIntent> = [
  "7", "8", "9",
  "4", "5", "6",
  "1", "2", "3",
  "0", ".", "BACK"
];

const operatorIntents: ReadonlyArray<KeyIntent> = [
  "+", "-", "*", "/"
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
      <div class="entry-row">
        <input id="entry" class="entry-input" type="text" readonly />
        <button id="enter-key" class="enter-key" type="button">ENTER</button>
      </div>
      <div id="keypad" class="keypad"></div>
    </section>
  </main>
`;

const facade = createCalculatorFacade();
let entryDraft = "";
const errorEl = document.querySelector<HTMLDivElement>("#error");
const stackEl = document.querySelector<HTMLDivElement>("#stack");
const entryEl = document.querySelector<HTMLInputElement>("#entry");
const commandsEl = document.querySelector<HTMLDivElement>("#commands");
const opsEl = document.querySelector<HTMLDivElement>("#ops");
const keypadEl = document.querySelector<HTMLDivElement>("#keypad");
const enterKeyEl = document.querySelector<HTMLButtonElement>("#enter-key");

if (!errorEl || !stackEl || !entryEl || !commandsEl || !opsEl || !keypadEl || !enterKeyEl) {
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
  if ((intent === "+" || intent === "-" || intent === "*" || intent === "/" || intent === "SWAP" || intent === "DROP") && entryDraft !== "") {
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
    if (/^\d$/.test(intent) || intent === ".") {
      appendEntry(intent);
      return;
    }
    runCommandIntent(intent as KeyIntent);
  });
  return button;
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

enterKeyEl.addEventListener("click", () => {
  commitEntry();
});

const renderStackLines = (lines: ReadonlyArray<string>): string =>
  lines.length === 0 ? "(empty)" : lines.join("<br />");

const render = () => {
  const display = facade.toDisplayModel();
  stackEl.innerHTML = renderStackLines(display.stackLines);
  entryEl.value = entryDraft;
  entryEl.placeholder = "_";
  errorEl.textContent = display.error ?? "";
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
