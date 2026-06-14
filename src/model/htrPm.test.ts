import { describe, expect, it } from "vitest";
import { DEFAULT_INPUTS, solveCore1DCase } from "./htrPm";

describe("HTR-PM 1D model", () => {
  it("matches the nominal notebook result for 250 MW, 6 cm, 96 kg/s", () => {
    const solution = solveCore1DCase({ ...DEFAULT_INPUTS, nNodes: 100 });

    expect(solution.summary.heliumOutletC).toBeCloseTo(751.240234, 6);
    expect(solution.summary.maxFuelCenterC).toBeCloseTo(813.610501, 6);
    expect(solution.summary.totalPressureDropKPa).toBeCloseTo(86.905258, 6);
    expect(solution.summary.hydraulicPowerMW).toBeCloseTo(2.021687, 6);
    expect(solution.summary.totalHeatLossKW).toBeCloseTo(21.470461, 6);
    expect(solution.summary.porosity).toBeCloseTo(0.38909091, 8);
  });

  it("uses 15 nodes as the interactive default", () => {
    const solution = solveCore1DCase(DEFAULT_INPUTS);

    expect(solution.rows).toHaveLength(15);
  });
});
