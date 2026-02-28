export type CalcValue = number;

export type Stack<T> = null | {
  readonly head: T;
  readonly tail: Stack<T>;
};

export type CalculatorSnapshot = {
  readonly stack: Stack<CalcValue>;
  readonly error: string | null;
};

export interface CalculatorState {
  readonly snapshot: CalculatorSnapshot;
  readonly undoBuffer: Stack<CalculatorSnapshot>;
  readonly redoBuffer: Stack<CalculatorSnapshot>;
}

export type Operator = (stack: Stack<CalcValue>) => Stack<CalcValue> | string;
export type OperatorKey =
  | "drop"
  | "swap"
  | "+"
  | "-"
  | "*"
  | "/"
  | "square"
  | "sqrt"
  | "sin"
  | "cos"
  | "tan"
  | "exp"
  | "ln"
  | "log10";

export const applyOperator = (snapshot: CalculatorSnapshot, fn: Operator): CalculatorSnapshot => {
  const result = fn(snapshot.stack);
  return typeof result === "string"
    ? { ...snapshot, error: result }
    : { ...snapshot, stack: result, error: null };
};

type BinaryOp = (a: number, b: number) => number;
type UnaryOp = (a: number) => number;

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

const fromUnaryOp = (op: UnaryOp): Operator => {
  return (stack) => {
    if (stack === null) {
      return "Need 1 value on stack";
    }
    const result = op(stack.head);
    if (!Number.isFinite(result)) {
      return "Calculation error";
    }
    return { head: result, tail: stack.tail };
  };
};

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
  "/": fromBinaryOp((a, b) => a / b),
  "square": fromUnaryOp((x) => x * x),
  "sqrt": fromUnaryOp((x) => Math.sqrt(x)),
  "sin": fromUnaryOp((x) => Math.sin(x)),
  "cos": fromUnaryOp((x) => Math.cos(x)),
  "tan": fromUnaryOp((x) => Math.tan(x)),
  "exp": fromUnaryOp((x) => Math.exp(x)),
  "ln": fromUnaryOp((x) => Math.log(x)),
  "log10": fromUnaryOp((x) => Math.log10(x))
};

export type Command =
  | { readonly type: "enter"; readonly value: string }
  | { readonly type: "operator"; readonly operator: OperatorKey }
  | { readonly type: "clear" }
  | { readonly type: "undo" }
  | { readonly type: "redo" };
