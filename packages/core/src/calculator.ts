import { applyOperator, CalculatorState, Command, operators, Stack } from "./model";

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
    stack: { head: parsed, tail: state.stack },
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
    case "operator": {
      const committed = commitEntry(state);
      return applyOperator({ ...committed, error: null }, operators[command.operator]);
    }
    case "clear":
      return initialState();
    default:
      return state;
  }
};
