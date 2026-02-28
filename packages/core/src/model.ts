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

export type BinaryOperator = "+" | "-" | "*" | "/";

export type Command =
  | { readonly type: "digit"; readonly value: string }
  | { readonly type: "dot" }
  | { readonly type: "enter" }
  | { readonly type: "binary"; readonly operator: BinaryOperator }
  | { readonly type: "swap" }
  | { readonly type: "drop" }
  | { readonly type: "clear" }
  | { readonly type: "backspace" };
