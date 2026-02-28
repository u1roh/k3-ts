export type CalcValue = number;

export type Stack = ReadonlyArray<CalcValue>;

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
