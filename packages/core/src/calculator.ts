import { CalculatorState, Command, Stack } from "./model";

export const initialState = (): CalculatorState => ({
  stack: null,
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

export const stackPush = (stack: Stack, value: number): Stack => ({
  head: value,
  tail: stack
});

export const stackPop = (
  stack: Stack
): { readonly value: number; readonly rest: Stack } | null => {
  if (stack === null) {
    return null;
  }
  return { value: stack.head, rest: stack.tail };
};

export const stackSize = (stack: Stack): number => {
  let count = 0;
  let current = stack;
  while (current !== null) {
    count += 1;
    current = current.tail;
  }
  return count;
};

export const stackToArray = (stack: Stack): ReadonlyArray<number> => {
  const values: number[] = [];
  let current = stack;
  while (current !== null) {
    values.push(current.head);
    current = current.tail;
  }
  values.reverse();
  return values;
};

const commitEntry = (state: CalculatorState): CalculatorState => {
  if (state.entry === "") {
    return state;
  }
  const parsed = parseEntry(state.entry);
  if (parsed === null) {
    return setError(state, "Invalid number entry");
  }
  return {
    stack: stackPush(state.stack, parsed),
    entry: "",
    error: null
  };
};

const requireStack = (state: CalculatorState, required: number): CalculatorState | null => {
  if (stackSize(state.stack) < required) {
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

  const top = stackPop(committed.stack);
  if (top === null) {
    return setError(committed, "Need 2 values on stack");
  }
  const next = stackPop(top.rest);
  if (next === null) {
    return setError(committed, "Need 2 values on stack");
  }

  const a = next.value;
  const b = top.value;
  const result = op(a, b);

  if (!Number.isFinite(result)) {
    return setError(committed, "Calculation error");
  }

  return {
    stack: stackPush(next.rest, result),
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
      const top = stackPop(committed.stack);
      if (top === null) {
        return setError(committed, "Need 2 values on stack");
      }
      const second = stackPop(top.rest);
      if (second === null) {
        return setError(committed, "Need 2 values on stack");
      }

      return {
        ...committed,
        stack: stackPush(stackPush(second.rest, top.value), second.value),
        error: null
      };
    }
    case "drop": {
      if (state.entry !== "") {
        return { ...state, entry: "", error: null };
      }
      const stackError = requireStack(state, 1);
      if (stackError) {
        return stackError;
      }
      const popped = stackPop(state.stack);
      return { ...state, stack: popped?.rest ?? null, error: null };
    }
    case "clear":
      return initialState();
    default:
      return state;
  }
};
