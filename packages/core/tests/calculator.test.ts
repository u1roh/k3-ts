import { describe, expect, it } from "vitest";
import { initialState, reduce, stackToArray } from "../src";

const run = (sequence: Parameters<typeof reduce>[1][]) =>
  sequence.reduce(reduce, initialState());

describe("RPN reducer", () => {
  it("calculates 3 4 +", () => {
    const state = run([
      { type: "enter", value: "3" },
      { type: "enter", value: "4" },
      { type: "operator", operator: "+" }
    ]);

    expect(stackToArray(state.snapshot.stack)).toEqual([7]);
    expect(state.snapshot.error).toBeNull();
  });

  it("returns stack underflow", () => {
    const state = run([{ type: "operator", operator: "+" }]);
    expect(state.snapshot.error).toMatch(/Need 2/);
  });

  it("applies unary functions", () => {
    const state = run([
      { type: "enter", value: "9" },
      { type: "operator", operator: "sqrt" },
      { type: "operator", operator: "square" }
    ]);
    expect(stackToArray(state.snapshot.stack)).toEqual([9]);
  });

  it("returns unary underflow for empty stack", () => {
    const state = run([{ type: "operator", operator: "sin" }]);
    expect(state.snapshot.error).toMatch(/Need 1/);
  });

  it("supports undo and redo", () => {
    const state = run([
      { type: "enter", value: "2" },
      { type: "enter", value: "3" },
      { type: "operator", operator: "+" },
      { type: "undo" }
    ]);
    expect(stackToArray(state.snapshot.stack)).toEqual([2, 3]);

    const redone = reduce(state, { type: "redo" });
    expect(stackToArray(redone.snapshot.stack)).toEqual([5]);
  });

  it("undoes two entered values in two steps", () => {
    const state = run([
      { type: "enter", value: "1" },
      { type: "enter", value: "2" },
      { type: "undo" },
      { type: "undo" }
    ]);

    expect(stackToArray(state.snapshot.stack)).toEqual([]);
  });
});
