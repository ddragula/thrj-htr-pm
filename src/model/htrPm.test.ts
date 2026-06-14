import { describe, expect, it } from "vitest";
import { DEFAULT_INPUTS, DEFAULT_LIMITS, DLOFC_FUEL_PEAK_LIMIT_C, evaluateSafety, solveCore1DCase } from "./htrPm";

describe("HTR-PM 1D model", () => {
  it("matches the nominal notebook result for 250 MW, 6 cm, 96 kg/s", () => {
    const solution = solveCore1DCase({ ...DEFAULT_INPUTS, nNodes: 100 });

    expect(solution.summary.heliumOutletC).toBeCloseTo(751.240234, 6);
    expect(solution.summary.maxFuelCenterC).toBeCloseTo(813.610501, 6);
    expect(solution.summary.totalPressureDropKPa).toBeCloseTo(86.905258, 6);
    expect(solution.summary.hydraulicPowerMW).toBeCloseTo(2.021687, 6);
    expect(solution.summary.totalHeatLossKW).toBeCloseTo(21.470461, 6);
    expect(solution.summary.porosity).toBeCloseTo(0.38909091, 8);

    const coreVolumeM3 = Math.PI * (DEFAULT_INPUTS.coreDiameterM / 2) ** 2 * DEFAULT_INPUTS.coreHeightM;
    expect(solution.summary.thermalPowerDensityMWM3).toBeCloseTo(250 / coreVolumeM3, 8);
  });

  it("uses 80 nodes as the interactive default", () => {
    const solution = solveCore1DCase(DEFAULT_INPUTS);

    expect(solution.rows).toHaveLength(80);
  });

  it("evaluates the revised steady-state and inherent-safety limits", () => {
    const solution = solveCore1DCase(DEFAULT_INPUTS);
    const checks = evaluateSafety(solution, DEFAULT_LIMITS);
    const labels = checks.map((check) => check.label);

    expect(DEFAULT_LIMITS.maxHeliumOutletC).toBe(765);
    expect(DEFAULT_LIMITS.maxHydraulicPowerMW).toBe(4.5);
    expect(DEFAULT_LIMITS.inherentSafetyEnabled).toBe(false);
    expect(DEFAULT_LIMITS.maxThermalPowerDensityMWM3).toBe(3.3);
    expect(DLOFC_FUEL_PEAK_LIMIT_C).toBe(1620);
    expect(labels).toContain("Moc dmuchawy helu");
    expect(labels).not.toContain("Gęstość mocy cieplnej");
    expect(labels).not.toContain("Całkowity spadek ciśnienia");
    expect(labels).not.toContain("Ciśnienie helu na wylocie");
    expect(labels).not.toContain("Straty ciepła do RCCS / moc cieplna");

    const enabledChecks = evaluateSafety(solution, { ...DEFAULT_LIMITS, inherentSafetyEnabled: true });
    expect(enabledChecks.map((check) => check.label)).toContain("Gęstość mocy cieplnej");
  });
});
