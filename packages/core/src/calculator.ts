import {
  applyOperator,
  CalculatorSnapshot,
  CalculatorState,
  Command,
  operators,
  Stack
} from "./model";

export const initialState = (): CalculatorState => ({
  snapshot: {
    stack: null,
    entry: "",
    error: null
  },
  undoBuffer: null,
  redoBuffer: null
});

const setError = (snapshot: CalculatorSnapshot, error: string): CalculatorSnapshot => ({
  ...snapshot,
  error
});

const parseEntry = (entry: string): number | null => {
  if (entry === "" || entry === "-" || entry === "." || entry === "-.") {
    return null;
  }
  const value = Number(entry);
  return Number.isFinite(value) ? value : null;
};

export const stackToArray = <T>(stack: Stack<T>): ReadonlyArray<T> => {
  const values: T[] = [];
  let current = stack;
  while (current !== null) {
    values.push(current.head);
    current = current.tail;
  }
  values.reverse();
  return values;
};

const isSameSnapshot = (a: CalculatorSnapshot, b: CalculatorSnapshot): boolean =>
  a.stack === b.stack && a.entry === b.entry && a.error === b.error;

const commitEntry = (snapshot: CalculatorSnapshot): CalculatorSnapshot => {
  if (snapshot.entry === "") {
    return snapshot;
  }
  const parsed = parseEntry(snapshot.entry);
  if (parsed === null) {
    return setError(snapshot, "Invalid number entry");
  }
  return {
    ...snapshot,
    stack: { head: parsed, tail: snapshot.stack },
    entry: "",
    error: null
  };
};

export const reduceSnapshot = (
  snapshot: CalculatorSnapshot,
  command: Exclude<Command, { readonly type: "undo" } | { readonly type: "redo" }>
): CalculatorSnapshot => {
  switch (command.type) {
    case "digit": {
      if (!/^\d$/.test(command.value)) {
        return setError(snapshot, "Invalid digit");
      }
      return { ...snapshot, entry: snapshot.entry + command.value, error: null };
    }
    case "dot": {
      if (snapshot.entry.includes(".")) {
        return snapshot;
      }
      const next = snapshot.entry === "" ? "0." : `${snapshot.entry}.`;
      return { ...snapshot, entry: next, error: null };
    }
    case "backspace": {
      if (snapshot.entry.length === 0) {
        return snapshot;
      }
      return { ...snapshot, entry: snapshot.entry.slice(0, -1), error: null };
    }
    case "enter":
      return commitEntry(snapshot);
    case "operator": {
      const committed = commitEntry(snapshot);
      return applyOperator({ ...committed, error: null }, operators[command.operator]);
    }
    case "clear":
      return { ...snapshot, stack: null, entry: "", error: null };
    default:
      return snapshot;
  }
};

export const reduce = (state: CalculatorState, command: Command): CalculatorState => {
  if (command.type === "undo") {
    if (state.undoBuffer === null) {
      return state;
    }
    return {
      ...state,
      snapshot: state.undoBuffer.head,
      undoBuffer: state.undoBuffer.tail,
      redoBuffer: {
        head: state.snapshot,
        tail: state.redoBuffer
      }
    };
  }

  if (command.type === "redo") {
    if (state.redoBuffer === null) {
      return state;
    }
    return {
      ...state,
      snapshot: state.redoBuffer.head,
      undoBuffer: {
        head: state.snapshot,
        tail: state.undoBuffer
      },
      redoBuffer: state.redoBuffer.tail
    };
  }

  const before = state.snapshot;
  const after = reduceSnapshot(state.snapshot, command);
  if (isSameSnapshot(before, after)) {
    return { ...state, snapshot: after };
  }

  return {
    ...state,
    snapshot: after,
    undoBuffer: {
      head: before,
      tail: state.undoBuffer
    },
    redoBuffer: null
  };
};
