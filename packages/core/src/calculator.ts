import { CalculatorState, Command, Stack } from "./model";

export const initialState = (): CalculatorState => ({
  stack: [],
  entry: "",
  error: null
});

const setError = (state: CalculatorState, error: string): CalculatorState => ({
  ...state,
  error
});

const parseEntry = (entry: string): number | null => {
  if (entry === "" || entry === "-" || entry === "." || entry === "-.") {
    return null;
  }
  const value = Number(entry);
  return Number.isFinite(value) ? value : null;
};

const push = (stack: Stack, value: number): Stack => [...stack, value];

const commitEntry = (state: CalculatorState): CalculatorState => {
  if (state.entry === "") {
    return state;
  }
  const parsed = parseEntry(state.entry);
  if (parsed === null) {
    return setError(state, "Invalid number entry");
  }
  return {
    stack: push(state.stack, parsed),
    entry: "",
    error: null
  };
};

const requireStack = (state: CalculatorState, required: number): CalculatorState | null => {
  if (state.stack.length < required) {
    return setError(state, `Need ${required} values on stack`);
  }
  return null;
};

const applyBinary = (state: CalculatorState, op: (a: number, b: number) => number): CalculatorState => {
  const committed = commitEntry(state);
  const stackError = requireStack(committed, 2);
  if (stackError) {
    return stackError;
  }

  const a = committed.stack[committed.stack.length - 2] as number;
  const b = committed.stack[committed.stack.length - 1] as number;
  const result = op(a, b);

  if (!Number.isFinite(result)) {
    return setError(committed, "Calculation error");
  }

  const nextStack = committed.stack.slice(0, -2);
  return {
    stack: [...nextStack, result],
    entry: "",
    error: null
  };
};

export const reduce = (state: CalculatorState, command: Command): CalculatorState => {
  switch (command.type) {
    case "digit": {
      if (!/^\d$/.test(command.value)) {
        return setError(state, "Invalid digit");
      }
      return { ...state, entry: state.entry + command.value, error: null };
    }
    case "dot": {
      if (state.entry.includes(".")) {
        return state;
      }
      const next = state.entry === "" ? "0." : `${state.entry}.`;
      return { ...state, entry: next, error: null };
    }
    case "backspace": {
      if (state.entry.length === 0) {
        return state;
      }
      return { ...state, entry: state.entry.slice(0, -1), error: null };
    }
    case "enter":
      return commitEntry(state);
    case "binary": {
      if (command.operator === "/") {
        return applyBinary(state, (a, b) => a / b);
      }
      if (command.operator === "*") {
        return applyBinary(state, (a, b) => a * b);
      }
      if (command.operator === "-") {
        return applyBinary(state, (a, b) => a - b);
      }
      return applyBinary(state, (a, b) => a + b);
    }
    case "swap": {
      const committed = commitEntry(state);
      const stackError = requireStack(committed, 2);
      if (stackError) {
        return stackError;
      }
      const second = committed.stack[committed.stack.length - 2] as number;
      const top = committed.stack[committed.stack.length - 1] as number;
      const rest = committed.stack.slice(0, -2);
      return { ...committed, stack: [...rest, top, second], error: null };
    }
    case "drop": {
      if (state.entry !== "") {
        return { ...state, entry: "", error: null };
      }
      const stackError = requireStack(state, 1);
      if (stackError) {
        return stackError;
      }
      return { ...state, stack: state.stack.slice(0, -1), error: null };
    }
    case "clear":
      return initialState();
    default:
      return state;
  }
};
