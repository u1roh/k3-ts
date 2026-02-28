export type CalcValue = number;

export type Stack<T> = null | {
  readonly head: T;
  readonly tail: Stack<T>;
};

export type CalculatorSnapshot = {
  readonly stack: Stack<CalcValue>;
  readonly entry: string;
  readonly error: string | null;
};

export interface CalculatorState {
  readonly snapshot: CalculatorSnapshot;
  readonly undoBuffer: Stack<CalculatorSnapshot>;
  readonly redoBuffer: Stack<CalculatorSnapshot>;
}

export type Operator = (stack: Stack<CalcValue>) => Stack<CalcValue> | string;
export type OperatorKey = "drop" | "swap" | "+" | "-" | "*" | "/";

export const applyOperator = (snapshot: CalculatorSnapshot, fn: Operator): CalculatorSnapshot => {
  const result = fn(snapshot.stack);
  return typeof result === "string"
    ? { ...snapshot, error: result }
    : { ...snapshot, stack: result, error: null };
};

type BinaryOp = (a: number, b: number) => number;

const fromBinaryOp = (op: BinaryOp): Operator => {
  return (stack) => {
    if (stack === null || stack.tail === null) {
      return "Need 2 values on stack";
    }
    const result = op(stack.tail.head, stack.head);
    if (!Number.isFinite(result)) {
      return "Calculation error";
    }
    return { head: result, tail: stack.tail.tail };
  }
}

export const operators: Record<OperatorKey, Operator> = {
  "drop": (stack) => stack?.tail ?? null,
  "swap": (stack) => {
    if (stack === null || stack.tail === null) {
      return "Need 2 values on stack";
    }
    return {
      head: stack.tail.head,
      tail: {
        head: stack.head,
        tail: stack.tail.tail
      }
    };
  },
  "+": fromBinaryOp((a, b) => a + b),
  "-": fromBinaryOp((a, b) => a - b),
  "*": fromBinaryOp((a, b) => a * b),
  "/": fromBinaryOp((a, b) => a / b)
};

export type Command =
  | { readonly type: "digit"; readonly value: string }
  | { readonly type: "dot" }
  | { readonly type: "enter" }
  | { readonly type: "operator"; readonly operator: OperatorKey }
  | { readonly type: "clear" }
  | { readonly type: "backspace" }
  | { readonly type: "undo" }
  | { readonly type: "redo" };
