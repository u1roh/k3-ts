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
  a.stack === b.stack && a.error === b.error;

const applyEnter = (snapshot: CalculatorSnapshot, input: string): CalculatorSnapshot => {
  if (input.trim() === "") {
    return snapshot;
  }
  const parsed = parseEntry(input);
  if (parsed === null) {
    return setError(snapshot, "Invalid number entry");
  }
  return {
    ...snapshot,
    stack: { head: parsed, tail: snapshot.stack },
    error: null
  };
};

export const reduceSnapshot = (
  snapshot: CalculatorSnapshot,
  command: Exclude<Command, { readonly type: "undo" } | { readonly type: "redo" }>
): CalculatorSnapshot => {
  switch (command.type) {
    case "enter":
      return applyEnter(snapshot, command.value);
    case "operator": {
      return applyOperator({ ...snapshot, error: null }, operators[command.operator]);
    }
    case "clear":
      return { ...snapshot, stack: null, error: null };
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
