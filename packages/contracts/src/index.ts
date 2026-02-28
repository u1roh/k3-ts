import {
  CalculatorState,
  Command,
  initialState,
  reduce,
  stackToArray
} from "@rpn/core";

export interface DisplayModel {
  readonly stackLines: ReadonlyArray<string>;
  readonly entryLine: string;
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
      entryLine: current.snapshot.entry === "" ? "_" : current.snapshot.entry,
      error: current.snapshot.error
    })
  };
};

export type KeyIntent =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "."
  | "ENTER"
  | "+"
  | "-"
  | "*"
  | "/"
  | "SWAP"
  | "DROP"
  | "CLR"
  | "BACK"
  | "UNDO"
  | "REDO";

export const keyIntentToCommand = (intent: KeyIntent): Command => {
  if (/^\d$/.test(intent)) {
    return { type: "digit", value: intent };
  }

  switch (intent) {
    case ".":
      return { type: "dot" };
    case "ENTER":
      return { type: "enter" };
    case "+":
    case "-":
    case "*":
    case "/":
      return { type: "operator", operator: intent };
    case "SWAP":
      return { type: "operator", operator: "swap" };
    case "DROP":
      return { type: "operator", operator: "drop" };
    case "CLR":
      return { type: "clear" };
    case "BACK":
      return { type: "backspace" };
    case "UNDO":
      return { type: "undo" };
    case "REDO":
      return { type: "redo" };
    default:
      return { type: "clear" };
  }
};
