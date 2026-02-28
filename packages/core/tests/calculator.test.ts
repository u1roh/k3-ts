import { describe, expect, it } from "vitest";
import { initialState, reduce } from "../src";

const run = (sequence: Parameters<typeof reduce>[1][]) =>
  sequence.reduce(reduce, initialState());

describe("RPN reducer", () => {
  it("calculates 3 4 +", () => {
    const state = run([
      { type: "digit", value: "3" },
      { type: "enter" },
      { type: "digit", value: "4" },
      { type: "enter" },
      { type: "binary", operator: "+" }
    ]);

    expect(state.stack).toEqual([7]);
    expect(state.error).toBeNull();
  });

  it("returns stack underflow", () => {
    const state = run([{ type: "binary", operator: "+" }]);
    expect(state.error).toMatch(/Need 2/);
  });
});
