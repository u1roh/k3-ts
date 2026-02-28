import {
  CalculatorState,
  Command,
  initialState,
  reduce,
  stackToArray
} from "@rpn/core";

export interface DisplayModel {
  readonly stackLines: ReadonlyArray<string>;
  readonly error: string | null;
}

export interface CalculatorFacade {
  getState(): CalculatorState;
  dispatch(command: Command): CalculatorState;
  toDisplayModel(state?: CalculatorState): DisplayModel;
}

export const createCalculatorFacade = (): CalculatorFacade => {
  let state = initialState();

  return {
    getState: () => state,
    dispatch: (command: Command) => {
      state = reduce(state, command);
      return state;
    },
    toDisplayModel: (current = state) => ({
      stackLines: stackToArray(current.snapshot.stack).map((v) => `${v}`),
      error: current.snapshot.error
    })
  };
};

export type KeyIntent =
  | "+"
  | "-"
  | "*"
  | "/"
  | "SQR"
  | "SQRT"
  | "SIN"
  | "COS"
  | "TAN"
  | "EXP"
  | "LN"
  | "LOG"
  | "SWAP"
  | "DROP"
  | "CLR"
  | "UNDO"
  | "REDO";

export const keyIntentToCommand = (intent: KeyIntent): Command => {
  switch (intent) {
    case "+":
    case "-":
    case "*":
    case "/":
      return { type: "operator", operator: intent };
    case "SQR":
      return { type: "operator", operator: "square" };
    case "SQRT":
      return { type: "operator", operator: "sqrt" };
    case "SIN":
      return { type: "operator", operator: "sin" };
    case "COS":
      return { type: "operator", operator: "cos" };
    case "TAN":
      return { type: "operator", operator: "tan" };
    case "EXP":
      return { type: "operator", operator: "exp" };
    case "LN":
      return { type: "operator", operator: "ln" };
    case "LOG":
      return { type: "operator", operator: "log10" };
    case "SWAP":
      return { type: "operator", operator: "swap" };
    case "DROP":
      return { type: "operator", operator: "drop" };
    case "CLR":
      return { type: "clear" };
    case "UNDO":
      return { type: "undo" };
    case "REDO":
      return { type: "redo" };
    default:
      return { type: "clear" };
  }
};
