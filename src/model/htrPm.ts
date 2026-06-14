export const KELVIN_OFFSET = 273.15;
export const SIGMA_STEFAN_BOLTZMANN = 5.670374419e-8;

const NOMINAL_PEBBLES = 420_000;
const NOMINAL_PEBBLE_DIAMETER_M = 0.06;

export type ModelInputs = {
  powerMW: number;
  tHeInC: number;
  pHeInMPa: number;
  mDotKgS: number;
  nNodes: number;
  coreHeightM: number;
  coreDiameterM: number;
  dPebbleCm: number;
  graphiteShellThicknessMm: number;
  neutronFluence1e25: number;
  lambdaGraphiteWMK: number;
  lambdaCarbonBrickWMK: number;
  lambdaRpvWMK: number;
  tRccsC: number;
  reflectorThicknessM: number;
  carbonBrickThicknessM: number;
  rpvThicknessM: number;
  airGapThicknessM: number;
  hAirWM2K: number;
  epsilonRpv: number;
  epsilonRccs: number;
};

export type SafetyLimits = {
  maxFuelCenterC: number;
  maxHeliumOutletC: number;
  maxPressureDropKPa: number;
  maxHydraulicPowerPercent: number;
  maxRpvOuterC: number;
  minOutletPressureMPa: number;
  maxHeatLossPercent: number;
};

export type NodeResult = {
  node_index: number;
  z_mid_m: number;
  z_norm: number;
  t_he_in_K: number;
  t_he_out_K: number;
  t_he_mean_K: number;
  p_he_in_Pa: number;
  p_he_out_Pa: number;
  node_power_W: number;
  q_loss_W: number;
  q_convection_W: number;
  q_radiation_W: number;
  q_to_helium_W: number;
  q_loss_fraction: number;
  n_pebbles_node: number;
  heat_flow_per_pebble_W: number;
  epsilon: number;
  rho_he_kg_m3: number;
  mu_he_Pa_s: number;
  lambda_he_W_mK: number;
  pr_he: number;
  mass_flux_kg_m2s: number;
  reynolds: number;
  modified_reynolds: number;
  nusselt: number;
  h_pebble_he_W_m2K: number;
  r_conv_K_W: number;
  r_shell_K_W: number;
  r_core_K_W: number;
  t_pebble_surface_K: number;
  t_fuel_surface_K: number;
  t_fuel_center_K: number;
  delta_t_conv_K: number;
  delta_t_shell_K: number;
  delta_t_core_K: number;
  delta_t_total_K: number;
  t_rpv_outer_K: number;
  epsilon_effective: number;
  delta_p_node_Pa: number;
  pressure_drop_gradient_Pa_m: number;
  volume_flow_m3_s: number;
  hydraulic_power_W: number;
  lambda_fuel_core_W_mK: number;
  lambda_fuel_shell_W_mK: number;
  case_name: string;
  power_total_W: number;
  d_pebble_m: number;
  m_dot_kg_s: number;
  n_pebbles_total: number;
  neutron_fluence_n_m2: number;
  t_he_in_C: number;
  t_he_out_C: number;
  t_he_mean_C: number;
  t_pebble_surface_C: number;
  t_fuel_surface_C: number;
  t_fuel_center_C: number;
  t_rpv_outer_C: number;
  p_he_in_MPa: number;
  p_he_out_MPa: number;
  node_power_MW: number;
  delta_p_node_kPa: number;
  delta_p_cumulative_kPa: number;
  pressure_drop_gradient_kPa_m: number;
  q_loss_kW: number;
  q_convection_kW: number;
  q_radiation_kW: number;
  q_loss_cumulative_kW: number;
  q_loss_fraction_percent: number;
  hydraulic_power_kW: number;
  hydraulic_power_cumulative_kW: number;
  hydraulic_power_cumulative_MW: number;
};

export type CoreSummary = {
  totalPowerMW: number;
  heliumInletC: number;
  heliumOutletC: number;
  maxFuelCenterC: number;
  zMaxFuelM: number;
  totalPressureDropKPa: number;
  hydraulicPowerMW: number;
  hydraulicPowerPercent: number;
  totalHeatLossKW: number;
  heatLossPercent: number;
  hMinWM2K: number;
  hMaxWM2K: number;
  reynoldsMin: number;
  reynoldsMax: number;
  modifiedReynoldsMin: number;
  modifiedReynoldsMax: number;
  nPebblesTotal: number;
  porosity: number;
  outletPressureMPa: number;
  maxRpvOuterC: number;
};

export type CoreSolution = {
  rows: NodeResult[];
  summary: CoreSummary;
};

export type SafetyCheck = {
  label: string;
  value: number;
  unit: string;
  condition: string;
  ok: boolean;
  margin: number;
};

export type KtaCheck = {
  standard: string;
  variable: string;
  value: string;
  condition: string;
  ok: boolean;
  exceededBy: string[];
};

export const DEFAULT_INPUTS: ModelInputs = {
  powerMW: 250,
  tHeInC: 250,
  pHeInMPa: 7,
  mDotKgS: 96,
  nNodes: 15,
  coreHeightM: 11,
  coreDiameterM: 3,
  dPebbleCm: 6,
  graphiteShellThicknessMm: 5,
  neutronFluence1e25: 0,
  lambdaGraphiteWMK: 40,
  lambdaCarbonBrickWMK: 0.07,
  lambdaRpvWMK: 18.3,
  tRccsC: 100,
  reflectorThicknessM: 1.25,
  carbonBrickThicknessM: 0.25,
  rpvThicknessM: 0.15,
  airGapThicknessM: 3,
  hAirWM2K: 5,
  epsilonRpv: 0.55,
  epsilonRccs: 0.7,
};

export const DEFAULT_LIMITS: SafetyLimits = {
  maxFuelCenterC: 1600,
  maxHeliumOutletC: 800,
  maxPressureDropKPa: 150,
  maxHydraulicPowerPercent: 2,
  maxRpvOuterC: 400,
  minOutletPressureMPa: 5,
  maxHeatLossPercent: 0.1,
};

export const CASE_PRESETS = [
  { label: "250 MW, 6 cm", powerMW: 250, dPebbleCm: 6, mDotKgS: 96 },
  { label: "350 MW, 6 cm", powerMW: 350, dPebbleCm: 6, mDotKgS: 96 },
  { label: "250 MW, 4 cm", powerMW: 250, dPebbleCm: 4, mDotKgS: 96 },
  { label: "350 MW, 4 cm", powerMW: 350, dPebbleCm: 4, mDotKgS: 96 },
] as const;

export function celsiusToKelvin(tC: number): number {
  return tC + KELVIN_OFFSET;
}

export function kelvinToCelsius(tK: number): number {
  return tK - KELVIN_OFFSET;
}

function assertPositive(value: number, label: string): void {
  if (!(value > 0)) {
    throw new Error(`${label} musi być większe od 0.`);
  }
}

export function computeCircleArea(diameterM: number): number {
  return Math.PI * diameterM ** 2 / 4;
}

export function computeCylinderVolume(diameterM: number, heightM: number): number {
  return computeCircleArea(diameterM) * heightM;
}

export function computeSphereVolume(diameterM: number): number {
  return Math.PI * diameterM ** 3 / 6;
}

export function computeSphereArea(diameterM: number): number {
  return Math.PI * diameterM ** 2;
}

export function computeFuelDiameter(dPebbleM: number, graphiteShellThicknessM: number): number {
  const dFuelM = dPebbleM - 2 * graphiteShellThicknessM;
  if (dFuelM <= 0) {
    throw new Error("Średnica obszaru paliwowego musi być większa od 0.");
  }
  return dFuelM;
}

export function computePorosity(volumeM3: number, nSpheres: number, sphereDiameterM: number): number {
  const solidVolumeM3 = nSpheres * computeSphereVolume(sphereDiameterM);
  const epsilon = 1 - solidVolumeM3 / volumeM3;
  if (!(epsilon > 0 && epsilon < 1)) {
    throw new Error(`Porowatość poza zakresem fizycznym (0, 1): ${epsilon.toPrecision(6)}`);
  }
  return epsilon;
}

export function computeNumberOfSpheres(volumeM3: number, epsilon: number, sphereDiameterM: number): number {
  if (!(epsilon > 0 && epsilon < 1)) {
    throw new Error(`Porowatość poza zakresem fizycznym (0, 1): ${epsilon.toPrecision(6)}`);
  }
  return (1 - epsilon) * volumeM3 / computeSphereVolume(sphereDiameterM);
}

function computeCylindricalLateralArea(radiusM: number, heightM: number): number {
  return 2 * Math.PI * radiusM * heightM;
}

function computePressureBar(pPa: number): number {
  return pPa / 1e5;
}

function computeHeliumDensity(tK: number, pPa: number): number {
  const pBar = computePressureBar(pPa);
  return 48.14 * (pBar / tK) / (1 + 0.4446 * pBar / tK ** 1.2);
}

function computeHeliumCp(): number {
  return 5195;
}

function computeHeliumDynamicViscosity(tK: number): number {
  return 3.674e-7 * tK ** 0.7;
}

function computeHeliumThermalConductivity(tK: number, pPa: number): number {
  const pBar = computePressureBar(pPa);
  return 2.682e-3 * (1 + 1.123e-3 * pBar) * tK ** (0.71 * (1 - 2e-4 * pBar));
}

function computePrandtlNumber(cpJKgK: number, muPaS: number, lambdaWMK: number): number {
  return cpJKgK * muPaS / lambdaWMK;
}

function computeMassFlux(mDotKgS: number, areaM2: number): number {
  return mDotKgS / areaM2;
}

function computeReynoldsNumber(massFluxKgM2S: number, dPebbleM: number, muPaS: number): number {
  return massFluxKgM2S * dPebbleM / muPaS;
}

function computeKtaNusseltNumber(reynolds: number, prandtl: number, epsilon: number): number {
  const firstTerm = 1.27 * prandtl ** (1 / 3) * reynolds ** 0.36 / epsilon ** 1.18;
  const secondTerm = 0.033 * prandtl ** 0.5 * reynolds ** 0.86 / epsilon ** 1.07;
  return firstTerm + secondTerm;
}

function computeHeatTransferCoefficient(nusselt: number, lambdaHeWMK: number, dPebbleM: number): number {
  return nusselt * lambdaHeWMK / dPebbleM;
}

function computeModifiedReynoldsNumber(reynolds: number, epsilon: number): number {
  return reynolds / (1 - epsilon);
}

function computeKtaPressureLossCoefficient(reynolds: number, epsilon: number): number {
  const modifiedReynolds = computeModifiedReynoldsNumber(reynolds, epsilon);
  return 320 / modifiedReynolds + 6 / modifiedReynolds ** 0.1;
}

function computePressureDropGradient(
  psi: number,
  epsilon: number,
  dPebbleM: number,
  massFluxKgM2S: number,
  rhoKgM3: number,
): number {
  return psi * (1 - epsilon) / epsilon ** 3 * (1 / dPebbleM) * massFluxKgM2S ** 2 / (2 * rhoKgM3);
}

function computeVolumeFlowRate(mDotKgS: number, rhoKgM3: number): number {
  return mDotKgS / rhoKgM3;
}

function a3MatrixThermalConductivity(tK: number, neutronFluence: number, packingFraction: number): number {
  const k100 = 50.8;
  const alpha = 1.1810e-3;
  const delta = -7.8453e-4;
  const trisoParticleLambda = 4.13;
  const fluenceNorm = 1.52e25;
  const rhoReference = 1.7;
  const rhoNominal = 1.73;
  const tC = tK - 273.15;
  const kT = k100 * (1 - alpha * (tC - 100) * Math.exp(delta * tC));
  const phi = neutronFluence / fluenceNorm;
  const t = tC / 1000;
  const kPhi = (
    1
    - (0.940 - 0.604 * t) * (1 - Math.exp(-(2.960 - 1.955 * t) * phi))
    - (0.043 * t - 0.008 * t ** 2) * phi
  );
  const beta = (trisoParticleLambda - kT) / (trisoParticleLambda + 2 * kT);
  const pf = packingFraction;
  const kPF = (
    1
    + 2 * beta * pf
    + (2 * beta ** 3 - 0.1 * beta) * pf ** 2
    + 0.05 * pf ** 3 * Math.exp(4.5 * pf)
  ) / (1 - beta * pf);
  const kRho = rhoNominal / rhoReference;
  return kT * kPhi * kPF * kRho;
}

function computeFuelCoreThermalConductivity(tK: number, neutronFluence: number): number {
  return a3MatrixThermalConductivity(tK, neutronFluence, 0.07);
}

function computeFuelShellThermalConductivity(tK: number, neutronFluence: number): number {
  return a3MatrixThermalConductivity(tK, neutronFluence, 0);
}

function computeConvectiveThermalResistance(hWM2K: number, areaM2: number): number {
  return 1 / (hWM2K * areaM2);
}

function computeSphericalShellConductionResistance(rInnerM: number, rOuterM: number, lambdaWMK: number): number {
  if (rInnerM <= 0 || rOuterM <= 0 || rInnerM >= rOuterM) {
    throw new Error("Niepoprawne promienie sferycznej warstwy przewodzenia.");
  }
  return (1 / (4 * Math.PI * lambdaWMK)) * (1 / rInnerM - 1 / rOuterM);
}

function computeUniformSphereGenerationResistance(radiusM: number, lambdaWMK: number): number {
  assertPositive(radiusM, "Promień paliwa");
  return 1 / (8 * Math.PI * lambdaWMK * radiusM);
}

function computeTemperatureDifference(heatFlowW: number, thermalResistanceKW: number): number {
  return heatFlowW * thermalResistanceKW;
}

function computeTemperatureAfterResistance(tColdSideK: number, heatFlowW: number, thermalResistanceKW: number): number {
  return tColdSideK + computeTemperatureDifference(heatFlowW, thermalResistanceKW);
}

function computeCylindricalConductionResistance(
  rInnerM: number,
  rOuterM: number,
  heightM: number,
  lambdaWMK: number,
): number {
  if (rInnerM <= 0 || rOuterM <= 0 || rInnerM >= rOuterM) {
    throw new Error("Niepoprawne promienie cylindrycznej warstwy przewodzenia.");
  }
  assertPositive(heightM, "Wysokość węzła");
  assertPositive(lambdaWMK, "Przewodność cieplna");
  return Math.log(rOuterM / rInnerM) / (2 * Math.PI * lambdaWMK * heightM);
}

function computeSeriesThermalResistance(...resistancesKW: number[]): number {
  return resistancesKW.reduce((sum, value) => sum + value, 0);
}

function computeEffectiveRadiationEmissivity(
  epsilonHot: number,
  epsilonCold: number,
  areaHotM2: number,
  areaColdM2: number,
): number {
  if (!(epsilonHot > 0 && epsilonHot <= 1) || !(epsilonCold > 0 && epsilonCold <= 1)) {
    throw new Error("Emisyjność musi być w zakresie (0, 1].");
  }
  const denominator = 1 / epsilonHot + (areaHotM2 / areaColdM2) * (1 / epsilonCold - 1);
  return 1 / denominator;
}

function computeConvectionHeatFlow(hWM2K: number, areaM2: number, tHotK: number, tColdK: number): number {
  return hWM2K * areaM2 * (tHotK - tColdK);
}

function computeRadiationHeatFlow(areaHotM2: number, epsilonEffective: number, tHotK: number, tColdK: number): number {
  return SIGMA_STEFAN_BOLTZMANN * epsilonEffective * areaHotM2 * (tHotK ** 4 - tColdK ** 4);
}

function computeRpvToRccsHeatFlow(
  tRpvOuterK: number,
  tRccsK: number,
  hAirWM2K: number,
  areaRpvOuterM2: number,
  epsilonEffective: number,
): number {
  const qConvW = computeConvectionHeatFlow(hAirWM2K, areaRpvOuterM2, tRpvOuterK, tRccsK);
  const qRadW = computeRadiationHeatFlow(areaRpvOuterM2, epsilonEffective, tRpvOuterK, tRccsK);
  return qConvW + qRadW;
}

function computeRccsHeatBalanceResidual(
  tRpvOuterK: number,
  tSourceK: number,
  tRccsK: number,
  conductionResistanceKW: number,
  hAirWM2K: number,
  areaRpvOuterM2: number,
  epsilonEffective: number,
): number {
  const qConductionW = (tSourceK - tRpvOuterK) / conductionResistanceKW;
  const qExternalW = computeRpvToRccsHeatFlow(
    tRpvOuterK,
    tRccsK,
    hAirWM2K,
    areaRpvOuterM2,
    epsilonEffective,
  );
  return qConductionW - qExternalW;
}

function solveRpvOuterTemperature(
  tSourceK: number,
  tRccsK: number,
  conductionResistanceKW: number,
  hAirWM2K: number,
  areaRpvOuterM2: number,
  epsilonEffective: number,
  toleranceK = 1e-6,
  maxIterations = 100,
): number {
  if (tSourceK <= tRccsK) {
    return tRccsK;
  }
  let tLowK = tRccsK;
  let tHighK = tSourceK;
  for (let i = 0; i < maxIterations; i += 1) {
    const tMidK = (tLowK + tHighK) / 2;
    const residualW = computeRccsHeatBalanceResidual(
      tMidK,
      tSourceK,
      tRccsK,
      conductionResistanceKW,
      hAirWM2K,
      areaRpvOuterM2,
      epsilonEffective,
    );
    if (Math.abs(tHighK - tLowK) < toleranceK) {
      return tMidK;
    }
    if (residualW > 0) {
      tLowK = tMidK;
    } else {
      tHighK = tMidK;
    }
  }
  return 0.5 * (tLowK + tHighK);
}

function computeNominalPorosity(inputs: ModelInputs): number {
  const coreVolumeM3 = computeCylinderVolume(inputs.coreDiameterM, inputs.coreHeightM);
  return computePorosity(coreVolumeM3, NOMINAL_PEBBLES, NOMINAL_PEBBLE_DIAMETER_M);
}

function computeNumberOfPebblesForDiameter(dPebbleM: number, inputs: ModelInputs): number {
  const epsilon = computeNominalPorosity(inputs);
  const coreVolumeM3 = computeCylinderVolume(inputs.coreDiameterM, inputs.coreHeightM);
  return computeNumberOfSpheres(coreVolumeM3, epsilon, dPebbleM);
}

type SolveNodeArgs = {
  nodePowerW: number;
  nPebblesNode: number;
  nodeHeightM: number;
  tHeInK: number;
  pHeInPa: number;
  inputs: ModelInputs;
};

function solveNode(args: SolveNodeArgs) {
  const { nodePowerW, nPebblesNode, nodeHeightM, tHeInK, pHeInPa, inputs } = args;
  const mDotKgS = inputs.mDotKgS;
  const coreDiameterM = inputs.coreDiameterM;
  const dPebbleM = inputs.dPebbleCm / 100;
  const shellThicknessM = inputs.graphiteShellThicknessMm / 1000;
  const neutronFluence = inputs.neutronFluence1e25 * 1e25;
  const tRccsK = celsiusToKelvin(inputs.tRccsC);

  const coreAreaM2 = computeCircleArea(coreDiameterM);
  const nodeVolumeM3 = computeCylinderVolume(coreDiameterM, nodeHeightM);
  const epsilon = computePorosity(nodeVolumeM3, nPebblesNode, dPebbleM);
  const dFuelM = computeFuelDiameter(dPebbleM, shellThicknessM);
  const rPebbleM = dPebbleM / 2;
  const rFuelM = dFuelM / 2;
  const pebbleAreaM2 = computeSphereArea(dPebbleM);
  const rCoreOutM = coreDiameterM / 2;
  const rReflectorInM = rCoreOutM;
  const rReflectorOutM = rReflectorInM + inputs.reflectorThicknessM;
  const rCarbonBrickInM = rReflectorOutM;
  const rCarbonBrickOutM = rCarbonBrickInM + inputs.carbonBrickThicknessM;
  const rRpvInM = rCarbonBrickOutM;
  const rRpvOutM = rRpvInM + inputs.rpvThicknessM;
  const rRccsM = rRpvOutM + inputs.airGapThicknessM;
  const areaRpvOuterM2 = computeCylindricalLateralArea(rRpvOutM, nodeHeightM);
  const areaRccsInnerM2 = computeCylindricalLateralArea(rRccsM, nodeHeightM);
  const rReflectorKW = computeCylindricalConductionResistance(
    rReflectorInM,
    rReflectorOutM,
    nodeHeightM,
    inputs.lambdaGraphiteWMK,
  );
  const rCarbonBrickKW = computeCylindricalConductionResistance(
    rCarbonBrickInM,
    rCarbonBrickOutM,
    nodeHeightM,
    inputs.lambdaCarbonBrickWMK,
  );
  const rRpvKW = computeCylindricalConductionResistance(
    rRpvInM,
    rRpvOutM,
    nodeHeightM,
    inputs.lambdaRpvWMK,
  );
  const rConductionTotalKW = computeSeriesThermalResistance(rReflectorKW, rCarbonBrickKW, rRpvKW);
  const epsilonEffective = computeEffectiveRadiationEmissivity(
    inputs.epsilonRpv,
    inputs.epsilonRccs,
    areaRpvOuterM2,
    areaRccsInnerM2,
  );

  const cpHeJKgK = computeHeliumCp();
  let tHeOutK = tHeInK + nodePowerW / (mDotKgS * cpHeJKgK);
  let rhoHeKgM3 = 0;
  let muHePaS = 0;
  let lambdaHeWMK = 0;
  let prHe = 0;
  let massFluxKgM2S = 0;
  let reynolds = 0;
  let nusselt = 0;
  let hPebbleHeWM2K = 0;
  let tRpvOuterK = 0;
  let qConvectionW = 0;
  let qRadiationW = 0;
  let qLossW = 0;
  let qToHeliumW = nodePowerW;

  for (let i = 0; i < 50; i += 1) {
    const tHeOutPreviousK = tHeOutK;
    const tHeMeanK = 0.5 * (tHeInK + tHeOutK);
    const pHeMeanPa = pHeInPa;
    rhoHeKgM3 = computeHeliumDensity(tHeMeanK, pHeMeanPa);
    muHePaS = computeHeliumDynamicViscosity(tHeMeanK);
    lambdaHeWMK = computeHeliumThermalConductivity(tHeMeanK, pHeMeanPa);
    prHe = computePrandtlNumber(cpHeJKgK, muHePaS, lambdaHeWMK);
    massFluxKgM2S = computeMassFlux(mDotKgS, coreAreaM2);
    reynolds = computeReynoldsNumber(massFluxKgM2S, dPebbleM, muHePaS);
    nusselt = computeKtaNusseltNumber(reynolds, prHe, epsilon);
    hPebbleHeWM2K = computeHeatTransferCoefficient(nusselt, lambdaHeWMK, dPebbleM);
    tRpvOuterK = solveRpvOuterTemperature(
      tHeMeanK,
      tRccsK,
      rConductionTotalKW,
      inputs.hAirWM2K,
      areaRpvOuterM2,
      epsilonEffective,
    );
    qConvectionW = computeConvectionHeatFlow(inputs.hAirWM2K, areaRpvOuterM2, tRpvOuterK, tRccsK);
    qRadiationW = computeRadiationHeatFlow(areaRpvOuterM2, epsilonEffective, tRpvOuterK, tRccsK);
    qLossW = qConvectionW + qRadiationW;
    qToHeliumW = nodePowerW - qLossW;
    if (qToHeliumW < 0) {
      throw new Error("Straty do RCCS są większe niż moc węzła.");
    }
    tHeOutK = tHeInK + qToHeliumW / (mDotKgS * cpHeJKgK);
    if (Math.abs(tHeOutK - tHeOutPreviousK) < 1e-6) {
      break;
    }
  }

  const tHeMeanK = 0.5 * (tHeInK + tHeOutK);
  const lambdaFuelCoreWMK = computeFuelCoreThermalConductivity(tHeMeanK, neutronFluence);
  const lambdaFuelShellWMK = computeFuelShellThermalConductivity(tHeMeanK, neutronFluence);
  const rConvKW = computeConvectiveThermalResistance(hPebbleHeWM2K, pebbleAreaM2);
  const rShellKW = computeSphericalShellConductionResistance(rFuelM, rPebbleM, lambdaFuelShellWMK);
  const rCoreKW = computeUniformSphereGenerationResistance(rFuelM, lambdaFuelCoreWMK);
  const heatFlowPerPebbleW = nodePowerW / nPebblesNode;
  const deltaTConvK = computeTemperatureDifference(heatFlowPerPebbleW, rConvKW);
  const tPebbleSurfaceK = computeTemperatureAfterResistance(tHeMeanK, heatFlowPerPebbleW, rConvKW);
  const deltaTShellK = computeTemperatureDifference(heatFlowPerPebbleW, rShellKW);
  const tFuelSurfaceK = computeTemperatureAfterResistance(tPebbleSurfaceK, heatFlowPerPebbleW, rShellKW);
  const deltaTCoreK = computeTemperatureDifference(heatFlowPerPebbleW, rCoreKW);
  const tFuelCenterK = computeTemperatureAfterResistance(tFuelSurfaceK, heatFlowPerPebbleW, rCoreKW);
  const modifiedReynolds = computeModifiedReynoldsNumber(reynolds, epsilon);
  const psi = computeKtaPressureLossCoefficient(reynolds, epsilon);
  const pressureDropGradientPaM = computePressureDropGradient(
    psi,
    epsilon,
    dPebbleM,
    massFluxKgM2S,
    rhoHeKgM3,
  );
  const deltaPNodePa = pressureDropGradientPaM * nodeHeightM;
  const pHeOutPa = pHeInPa - deltaPNodePa;
  const volumeFlowM3S = computeVolumeFlowRate(mDotKgS, rhoHeKgM3);
  const hydraulicPowerW = deltaPNodePa * volumeFlowM3S;

  if (!Number.isFinite(pHeOutPa) || pHeOutPa <= 0) {
    throw new Error("Ciśnienie helu spadło poniżej zakresu fizycznego.");
  }

  return {
    t_he_in_K: tHeInK,
    t_he_out_K: tHeOutK,
    t_he_mean_K: tHeMeanK,
    p_he_in_Pa: pHeInPa,
    p_he_out_Pa: pHeOutPa,
    node_power_W: nodePowerW,
    q_loss_W: qLossW,
    q_convection_W: qConvectionW,
    q_radiation_W: qRadiationW,
    q_to_helium_W: qToHeliumW,
    q_loss_fraction: qLossW / nodePowerW,
    n_pebbles_node: nPebblesNode,
    heat_flow_per_pebble_W: heatFlowPerPebbleW,
    epsilon,
    rho_he_kg_m3: rhoHeKgM3,
    mu_he_Pa_s: muHePaS,
    lambda_he_W_mK: lambdaHeWMK,
    pr_he: prHe,
    mass_flux_kg_m2s: massFluxKgM2S,
    reynolds,
    modified_reynolds: modifiedReynolds,
    nusselt,
    h_pebble_he_W_m2K: hPebbleHeWM2K,
    r_conv_K_W: rConvKW,
    r_shell_K_W: rShellKW,
    r_core_K_W: rCoreKW,
    t_pebble_surface_K: tPebbleSurfaceK,
    t_fuel_surface_K: tFuelSurfaceK,
    t_fuel_center_K: tFuelCenterK,
    delta_t_conv_K: deltaTConvK,
    delta_t_shell_K: deltaTShellK,
    delta_t_core_K: deltaTCoreK,
    delta_t_total_K: tFuelCenterK - tHeMeanK,
    t_rpv_outer_K: tRpvOuterK,
    epsilon_effective: epsilonEffective,
    delta_p_node_Pa: deltaPNodePa,
    pressure_drop_gradient_Pa_m: pressureDropGradientPaM,
    volume_flow_m3_s: volumeFlowM3S,
    hydraulic_power_W: hydraulicPowerW,
    lambda_fuel_core_W_mK: lambdaFuelCoreWMK,
    lambda_fuel_shell_W_mK: lambdaFuelShellWMK,
  };
}

export function solveCore1DCase(inputs: ModelInputs): CoreSolution {
  assertPositive(inputs.nNodes, "Liczba węzłów");
  assertPositive(inputs.powerMW, "Moc rdzenia");
  assertPositive(inputs.mDotKgS, "Strumień masy helu");
  assertPositive(inputs.coreHeightM, "Wysokość rdzenia");
  assertPositive(inputs.coreDiameterM, "Średnica rdzenia");

  const nNodes = Math.max(1, Math.round(inputs.nNodes));
  const powerW = inputs.powerMW * 1e6;
  const dPebbleM = inputs.dPebbleCm / 100;
  const qNodeW = powerW / nNodes;
  const nPebblesTotal = computeNumberOfPebblesForDiameter(dPebbleM, inputs);
  const nPebblesNode = nPebblesTotal / nNodes;
  const hNodeM = inputs.coreHeightM / nNodes;
  const caseName = `${inputs.powerMW.toFixed(0)} MW, ${inputs.dPebbleCm.toFixed(1)} cm, ${inputs.mDotKgS.toFixed(1)} kg/s`;
  const neutronFluence = inputs.neutronFluence1e25 * 1e25;
  let tHeInK = celsiusToKelvin(inputs.tHeInC);
  let pHeInPa = inputs.pHeInMPa * 1e6;
  let deltaPCumulativeKPa = 0;
  let qLossCumulativeKW = 0;
  let hydraulicPowerCumulativeKW = 0;
  const rows: NodeResult[] = [];

  for (let nodeIndex = 0; nodeIndex < nNodes; nodeIndex += 1) {
    const node = solveNode({
      nodePowerW: qNodeW,
      nPebblesNode,
      nodeHeightM: hNodeM,
      tHeInK,
      pHeInPa,
      inputs,
    });

    deltaPCumulativeKPa += node.delta_p_node_Pa / 1000;
    qLossCumulativeKW += node.q_loss_W / 1000;
    hydraulicPowerCumulativeKW += node.hydraulic_power_W / 1000;

    rows.push({
      ...node,
      case_name: caseName,
      node_index: nodeIndex,
      z_mid_m: (nodeIndex + 0.5) * hNodeM,
      z_norm: ((nodeIndex + 0.5) * hNodeM) / inputs.coreHeightM,
      power_total_W: powerW,
      d_pebble_m: dPebbleM,
      m_dot_kg_s: inputs.mDotKgS,
      n_pebbles_total: nPebblesTotal,
      neutron_fluence_n_m2: neutronFluence,
      t_he_in_C: kelvinToCelsius(node.t_he_in_K),
      t_he_out_C: kelvinToCelsius(node.t_he_out_K),
      t_he_mean_C: kelvinToCelsius(node.t_he_mean_K),
      t_pebble_surface_C: kelvinToCelsius(node.t_pebble_surface_K),
      t_fuel_surface_C: kelvinToCelsius(node.t_fuel_surface_K),
      t_fuel_center_C: kelvinToCelsius(node.t_fuel_center_K),
      t_rpv_outer_C: kelvinToCelsius(node.t_rpv_outer_K),
      p_he_in_MPa: node.p_he_in_Pa / 1e6,
      p_he_out_MPa: node.p_he_out_Pa / 1e6,
      node_power_MW: node.node_power_W / 1e6,
      delta_p_node_kPa: node.delta_p_node_Pa / 1000,
      delta_p_cumulative_kPa: deltaPCumulativeKPa,
      pressure_drop_gradient_kPa_m: node.pressure_drop_gradient_Pa_m / 1000,
      q_loss_kW: node.q_loss_W / 1000,
      q_convection_kW: node.q_convection_W / 1000,
      q_radiation_kW: node.q_radiation_W / 1000,
      q_loss_cumulative_kW: qLossCumulativeKW,
      q_loss_fraction_percent: 100 * node.q_loss_fraction,
      hydraulic_power_kW: node.hydraulic_power_W / 1000,
      hydraulic_power_cumulative_kW: hydraulicPowerCumulativeKW,
      hydraulic_power_cumulative_MW: hydraulicPowerCumulativeKW / 1000,
    });

    tHeInK = node.t_he_out_K;
    pHeInPa = node.p_he_out_Pa;
  }

  return {
    rows,
    summary: summarizeCore1DResults(rows),
  };
}

export function summarizeCore1DResults(rows: NodeResult[]): CoreSummary {
  if (rows.length === 0) {
    throw new Error("Brak wyników modelu 1D.");
  }
  const totalPowerMW = sum(rows.map((row) => row.node_power_MW));
  const totalHeatLossKW = sum(rows.map((row) => row.q_loss_kW));
  const hydraulicPowerMW = sum(rows.map((row) => row.hydraulic_power_kW)) / 1000;
  const totalPressureDropKPa = sum(rows.map((row) => row.delta_p_node_kPa));
  const maxFuelRow = maxBy(rows, (row) => row.t_fuel_center_C);
  return {
    totalPowerMW,
    heliumInletC: rows[0].t_he_in_C,
    heliumOutletC: rows[rows.length - 1].t_he_out_C,
    maxFuelCenterC: maxFuelRow.t_fuel_center_C,
    zMaxFuelM: maxFuelRow.z_mid_m,
    totalPressureDropKPa,
    hydraulicPowerMW,
    hydraulicPowerPercent: 100 * hydraulicPowerMW / totalPowerMW,
    totalHeatLossKW,
    heatLossPercent: 100 * totalHeatLossKW / (totalPowerMW * 1000),
    hMinWM2K: min(rows.map((row) => row.h_pebble_he_W_m2K)),
    hMaxWM2K: max(rows.map((row) => row.h_pebble_he_W_m2K)),
    reynoldsMin: min(rows.map((row) => row.reynolds)),
    reynoldsMax: max(rows.map((row) => row.reynolds)),
    modifiedReynoldsMin: min(rows.map((row) => row.modified_reynolds)),
    modifiedReynoldsMax: max(rows.map((row) => row.modified_reynolds)),
    nPebblesTotal: rows[0].n_pebbles_total,
    porosity: rows[0].epsilon,
    outletPressureMPa: rows[rows.length - 1].p_he_out_MPa,
    maxRpvOuterC: max(rows.map((row) => row.t_rpv_outer_C)),
  };
}

export function evaluateSafety(solution: CoreSolution, limits: SafetyLimits): SafetyCheck[] {
  const summary = solution.summary;
  return [
    upperCheck("Temperatura centrum paliwa", summary.maxFuelCenterC, "°C", limits.maxFuelCenterC),
    upperCheck("Temperatura helu na wylocie", summary.heliumOutletC, "°C", limits.maxHeliumOutletC),
    upperCheck("Całkowity spadek ciśnienia", summary.totalPressureDropKPa, "kPa", limits.maxPressureDropKPa),
    upperCheck("Moc hydrauliczna / moc cieplna", summary.hydraulicPowerPercent, "%", limits.maxHydraulicPowerPercent),
    upperCheck("Temperatura zewnętrznej powierzchni RPV", summary.maxRpvOuterC, "°C", limits.maxRpvOuterC),
    lowerCheck("Ciśnienie helu na wylocie", summary.outletPressureMPa, "MPa", limits.minOutletPressureMPa),
    upperCheck("Straty ciepła do RCCS / moc cieplna", summary.heatLossPercent, "%", limits.maxHeatLossPercent),
  ];
}

export function buildKtaChecks(solution: CoreSolution, inputs: ModelInputs): KtaCheck[] {
  const rows = solution.rows;
  const tMeanK = rows.map((row) => row.t_he_mean_K);
  const pHeBar = rows.flatMap((row) => [row.p_he_in_Pa / 1e5, row.p_he_out_Pa / 1e5]);
  const reynolds = rows.map((row) => row.reynolds);
  const epsilons = rows.map((row) => row.epsilon);
  const modifiedReynolds = rows.map((row) => row.modified_reynolds);
  const dPebbleM = inputs.dPebbleCm / 100;
  const diameterRatio = inputs.coreDiameterM / dPebbleM;
  const heightRatio = inputs.coreHeightM / dPebbleM;

  return [
    rangeKtaCheck("KTA 3102.1", "temperatura helu", tMeanK, "K", 293, 1773, "293 K < T < 1773 K", rows, "t_he_mean_K"),
    rangeKtaCheck("KTA 3102.1", "ciśnienie helu", pHeBar, "bar", 1, 100, "1 bar < p < 100 bar", rows, "p_he_in/out"),
    rangeKtaCheck("KTA 3102.2", "liczba Reynoldsa", reynolds, "-", 100, 1e5, "100 < Re < 1e5", rows, "reynolds"),
    rangeKtaCheck("KTA 3102.2 / 3102.3", "porowatość", epsilons, "-", 0.36, 0.42, "0.36 < epsilon < 0.42", rows, "epsilon"),
    lowerBoundKtaCheck("KTA 3102.2", "D/d", diameterRatio, "-", 20, "D/d > 20"),
    lowerBoundKtaCheck("KTA 3102.2", "H/d", heightRatio, "-", 4, "H/d > 4"),
    rangeKtaCheck("KTA 3102.3", "Re/(1-epsilon)", modifiedReynolds, "-", 100, 1e5, "100 < Re/(1-epsilon) < 1e5", rows, "modified_reynolds"),
    lowerBoundKtaCheck("KTA 3102.3", "H/d", heightRatio, "-", 5, "H/d > 5"),
  ];
}

function upperCheck(label: string, value: number, unit: string, limit: number): SafetyCheck {
  return {
    label,
    value,
    unit,
    condition: `<= ${formatCompact(limit)} ${unit}`,
    ok: value <= limit,
    margin: limit - value,
  };
}

function lowerCheck(label: string, value: number, unit: string, limit: number): SafetyCheck {
  return {
    label,
    value,
    unit,
    condition: `>= ${formatCompact(limit)} ${unit}`,
    ok: value >= limit,
    margin: value - limit,
  };
}

function rangeKtaCheck(
  standard: string,
  variable: string,
  values: number[],
  unit: string,
  lower: number,
  upper: number,
  condition: string,
  rows: NodeResult[],
  field: keyof NodeResult | "p_he_in/out",
): KtaCheck {
  const valueMin = min(values);
  const valueMax = max(values);
  const ok = valueMin > lower && valueMax < upper;
  return {
    standard,
    variable,
    value: `${formatCompact(valueMin)}-${formatCompact(valueMax)} ${unit}`,
    condition,
    ok,
    exceededBy: ok ? [] : collectExceededNodes(rows, field, lower, upper),
  };
}

function lowerBoundKtaCheck(
  standard: string,
  variable: string,
  value: number,
  unit: string,
  lower: number,
  condition: string,
): KtaCheck {
  const ok = value > lower;
  return {
    standard,
    variable,
    value: `${formatCompact(value)} ${unit}`,
    condition,
    ok,
    exceededBy: ok ? [] : [`${variable} = ${formatCompact(value)} ${unit}`],
  };
}

function collectExceededNodes(
  rows: NodeResult[],
  field: keyof NodeResult | "p_he_in/out",
  lower: number,
  upper: number,
): string[] {
  const exceeded = rows
    .filter((row) => {
      if (field === "p_he_in/out") {
        const pInBar = row.p_he_in_Pa / 1e5;
        const pOutBar = row.p_he_out_Pa / 1e5;
        return !(pInBar > lower && pInBar < upper && pOutBar > lower && pOutBar < upper);
      }
      const value = row[field];
      return typeof value === "number" && !(value > lower && value < upper);
    })
    .map((row) => `węzeł ${row.node_index + 1}`);
  const first = exceeded.slice(0, 8);
  if (exceeded.length > first.length) {
    first.push(`+${exceeded.length - first.length} kolejnych`);
  }
  return first;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function min(values: number[]): number {
  return Math.min(...values);
}

function max(values: number[]): number {
  return Math.max(...values);
}

function maxBy<T>(values: T[], selector: (value: T) => number): T {
  return values.reduce((best, value) => (selector(value) > selector(best) ? value : best), values[0]);
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1000) {
    return value.toPrecision(4);
  }
  if (Math.abs(value) >= 100) {
    return value.toFixed(1);
  }
  if (Math.abs(value) >= 10) {
    return value.toFixed(2);
  }
  if (Math.abs(value) >= 1) {
    return value.toFixed(3);
  }
  return value.toPrecision(3);
}
