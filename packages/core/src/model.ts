export type CalcValue = number;

export type Stack = null | {
  readonly head: CalcValue;
  readonly tail: Stack;
};

export interface CalculatorState {
  readonly stack: Stack;
  readonly entry: string;
  readonly error: string | null;
}

export type Operator = (stack: Stack) => Stack | string;
export type OperatorKey = "drop" | "swap" | "+" | "-" | "*" | "/";

export const applyOperator = (state: CalculatorState, fn: Operator): CalculatorState => {
  const result = fn(state.stack);
  return typeof result === "string"
    ? { ...state, error: result }
    : { ...state, stack: result, error: null };
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
  | { readonly type: "backspace" };
