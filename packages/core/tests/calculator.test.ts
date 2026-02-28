import { describe, expect, it } from "vitest";
import { initialState, reduce, stackToArray } from "../src";

const run = (sequence: Parameters<typeof reduce>[1][]) =>
  sequence.reduce(reduce, initialState());

describe("RPN reducer", () => {
  it("calculates 3 4 +", () => {
    const state = run([
      { type: "digit", value: "3" },
      { type: "enter" },
      { type: "digit", value: "4" },
      { type: "enter" },
      { type: "operator", operator: "+" }
    ]);

    expect(stackToArray(state.snapshot.stack)).toEqual([7]);
    expect(state.snapshot.error).toBeNull();
  });

  it("returns stack underflow", () => {
    const state = run([{ type: "operator", operator: "+" }]);
    expect(state.snapshot.error).toMatch(/Need 2/);
  });

  it("supports undo and redo", () => {
    const state = run([
      { type: "digit", value: "2" },
      { type: "enter" },
      { type: "digit", value: "3" },
      { type: "enter" },
      { type: "operator", operator: "+" },
      { type: "undo" }
    ]);
    expect(stackToArray(state.snapshot.stack)).toEqual([2, 3]);

    const redone = reduce(state, { type: "redo" });
    expect(stackToArray(redone.snapshot.stack)).toEqual([5]);
  });
});
