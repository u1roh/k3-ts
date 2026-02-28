import {
  CalculatorState,
  Command,
  initialState,
  reduce
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
      stackLines: current.stack.map((v) => `${v}`),
      entryLine: current.entry === "" ? "_" : current.entry,
      error: current.error
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
  | "BACK";

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
      return { type: "binary", operator: intent };
    case "SWAP":
      return { type: "swap" };
    case "DROP":
      return { type: "drop" };
    case "CLR":
      return { type: "clear" };
    case "BACK":
      return { type: "backspace" };
    default:
      return { type: "clear" };
  }
};
