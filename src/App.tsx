import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Gauge,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Thermometer,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import {
  buildKtaChecks,
  CASE_PRESETS,
  DEFAULT_INPUTS,
  DEFAULT_LIMITS,
  DLOFC_FUEL_PEAK_LIMIT_C,
  evaluateSafety,
  type CoreSolution,
  type KtaCheck,
  type ModelInputs,
  type SafetyCheck,
  type SafetyLimits,
  solveCore1DCase,
} from "./model/htrPm";

type View = "charts" | "limits" | "kta" | "cases" | "analysis";

type CalculationState =
  | { solution: CoreSolution; error?: undefined }
  | { solution?: undefined; error: string };

type ComparisonRow = CoreSolution["summary"] & {
  label: string;
  ok: boolean;
};

type MinimumFlowResult = {
  mDotKgS: number;
  solution: CoreSolution;
} | null;

type NumericSafetyLimitKey = {
  [Key in keyof SafetyLimits]: SafetyLimits[Key] extends number ? Key : never;
}[keyof SafetyLimits];

type ProjectAnalysis = {
  nominal: CoreSolution;
  investor: CoreSolution;
  minFlow: MinimumFlowResult;
  investorSafetyOk: boolean;
  investorKtaOk: boolean;
  tempOk: boolean;
  deltas: {
    powerGainMW: number;
    powerGainPercent: number;
    powerDensityDeltaMWM3: number;
    powerDensityPercent: number;
    maxFuelDeltaC: number;
    heliumOutletDeltaC: number;
    pressureDropDeltaKPa: number;
    pressureDropFactor: number;
    hydraulicPowerDeltaMW: number;
    hydraulicPowerFactor: number;
    hydraulicPowerShareDeltaPct: number;
    netThermalAfterHydraulicGainMW: number;
  };
  verdict: {
    status: "ok" | "warn" | "bad";
    title: string;
    text: string;
  };
};

const chartColors = {
  helium: "#247a8b",
  pebble: "#6d6f1f",
  fuelSurface: "#b05f00",
  fuelCenter: "#b92318",
  pressure: "#2f6f47",
  hydraulic: "#7047a3",
  h: "#1f6fb2",
  reynolds: "#a75524",
  convection: "#41815f",
  radiation: "#bf7f1f",
  total: "#a72936",
  limit: "#c43d35",
};

const numberFormat = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 2,
});

const compactFormat = new Intl.NumberFormat("pl-PL", {
  notation: "compact",
  maximumFractionDigits: 2,
});

export default function App() {
  const [inputs, setInputs] = useState<ModelInputs>(DEFAULT_INPUTS);
  const [limits, setLimits] = useState<SafetyLimits>(DEFAULT_LIMITS);
  const [activeView, setActiveView] = useState<View>("charts");

  const calculation = useMemo<CalculationState>(() => {
    try {
      return { solution: solveCore1DCase(inputs) };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Nieznany błąd obliczeń.",
      };
    }
  }, [inputs]);

  const solution = calculation.solution;
  const safetyChecks = useMemo(
    () => (solution ? evaluateSafety(solution, limits) : []),
    [solution, limits],
  );
  const ktaChecks = useMemo(
    () => (solution ? buildKtaChecks(solution, inputs) : []),
    [solution, inputs],
  );
  const comparisonRows = useMemo(() => {
    try {
      return CASE_PRESETS.map(({ label, ...preset }) => {
        const scenarioInputs = { ...inputs, ...preset };
        const scenarioSolution = solveCore1DCase(scenarioInputs);
        return {
          label,
          ...scenarioSolution.summary,
          ok: evaluateSafety(scenarioSolution, limits).every((check) => check.ok),
        };
      });
    } catch {
      return [];
    }
  }, [inputs, limits]);
  const projectAnalysis = useMemo(() => {
    try {
      return buildProjectAnalysis(inputs, limits);
    } catch {
      return null;
    }
  }, [inputs, limits]);

  const allSafetyOk = safetyChecks.every((check) => check.ok);
  const allKtaOk = ktaChecks.every((check) => check.ok);

  function updateInput(key: keyof ModelInputs, value: number) {
    setInputs((current) => ({ ...current, [key]: value }));
  }

  function updateLimit(key: NumericSafetyLimitKey, value: number) {
    setLimits((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="app-shell">
      <aside className="side-panel parameters-panel">
        <PanelTitle icon={<SlidersHorizontal size={18} />} title="Parametry" />
        <div className="preset-grid" aria-label="Warianty referencyjne">
          {CASE_PRESETS.map(({ label, ...preset }) => (
            <button
              className="preset-button"
              key={label}
              onClick={() => setInputs((current) => ({ ...current, ...preset }))}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <button className="utility-button" onClick={() => setInputs(DEFAULT_INPUTS)} type="button">
          <RotateCcw size={16} />
          Reset modelu
        </button>

        <ControlGroup title="Warunki pracy">
          <RangeField label="Moc rdzenia" min={100} max={450} step={1} unit="MW" value={inputs.powerMW} onChange={(value) => updateInput("powerMW", value)} />
          <RangeField label="Strumień helu" min={40} max={180} step={1} unit="kg/s" value={inputs.mDotKgS} onChange={(value) => updateInput("mDotKgS", value)} />
          <RangeField label="Temperatura wlotu" min={150} max={450} step={1} unit="°C" value={inputs.tHeInC} onChange={(value) => updateInput("tHeInC", value)} />
          <RangeField label="Ciśnienie wlotu" min={0.5} max={9.9} step={0.1} unit="MPa" value={inputs.pHeInMPa} onChange={(value) => updateInput("pHeInMPa", value)} />
          <RangeField label="Liczba węzłów" min={5} max={200} step={1} unit="" value={inputs.nNodes} integer onChange={(value) => updateInput("nNodes", value)} />
        </ControlGroup>

        <ControlGroup title="Kule i rdzeń">
          <RangeField label="Średnica kuli" min={3} max={8} step={0.1} unit="cm" value={inputs.dPebbleCm} onChange={(value) => updateInput("dPebbleCm", value)} />
          <RangeField label="Otoczka grafitowa" min={1} max={9} step={0.1} unit="mm" value={inputs.graphiteShellThicknessMm} onChange={(value) => updateInput("graphiteShellThicknessMm", value)} />
          <RangeField label="Wysokość rdzenia" min={6} max={16} step={0.1} unit="m" value={inputs.coreHeightM} onChange={(value) => updateInput("coreHeightM", value)} />
          <RangeField label="Średnica rdzenia" min={2} max={5} step={0.05} unit="m" value={inputs.coreDiameterM} onChange={(value) => updateInput("coreDiameterM", value)} />
          <RangeField label="Fluencja neutronów" min={0} max={3} step={0.05} unit="×10²⁵ n/m²" value={inputs.neutronFluence1e25} onChange={(value) => updateInput("neutronFluence1e25", value)} />
        </ControlGroup>

        <ControlGroup title="RCCS i materiały">
          <RangeField label="Temperatura RCCS" min={20} max={250} step={1} unit="°C" value={inputs.tRccsC} onChange={(value) => updateInput("tRccsC", value)} />
          <RangeField label="h powietrza" min={1} max={25} step={0.2} unit="W/(m²K)" value={inputs.hAirWM2K} onChange={(value) => updateInput("hAirWM2K", value)} />
          <RangeField label="Emisyjność RPV" min={0.1} max={1} step={0.01} unit="" value={inputs.epsilonRpv} onChange={(value) => updateInput("epsilonRpv", value)} />
          <RangeField label="Emisyjność RCCS" min={0.1} max={1} step={0.01} unit="" value={inputs.epsilonRccs} onChange={(value) => updateInput("epsilonRccs", value)} />
          <RangeField label="λ grafitu" min={5} max={80} step={1} unit="W/(mK)" value={inputs.lambdaGraphiteWMK} onChange={(value) => updateInput("lambdaGraphiteWMK", value)} />
          <RangeField label="λ cegieł węglowych" min={0.02} max={0.3} step={0.01} unit="W/(mK)" value={inputs.lambdaCarbonBrickWMK} onChange={(value) => updateInput("lambdaCarbonBrickWMK", value)} />
        </ControlGroup>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Model cieplno-przepływowy 1D</p>
            <h1>HTR-PM: średnica kul, moc i przepływ helu</h1>
          </div>
          <div className="tab-list" role="tablist" aria-label="Widoki wyników">
            <TabButton active={activeView === "charts"} onClick={() => setActiveView("charts")}>Wykresy</TabButton>
            <TabButton active={activeView === "limits"} attention={!allSafetyOk} onClick={() => setActiveView("limits")}>Limity</TabButton>
            <TabButton active={activeView === "kta"} attention={!allKtaOk} onClick={() => setActiveView("kta")}>KTA</TabButton>
            <TabButton active={activeView === "cases"} onClick={() => setActiveView("cases")}>Warianty</TabButton>
            <TabButton active={activeView === "analysis"} onClick={() => setActiveView("analysis")}>Analiza</TabButton>
          </div>
        </header>

        {calculation.error ? (
          <div className="error-panel">
            <AlertTriangle size={22} />
            <span>{calculation.error}</span>
          </div>
        ) : (
          solution && (
            <>
              <MetricGrid solution={solution} limits={limits} />

              {activeView === "analysis" && projectAnalysis && (
                <AnalysisView analysis={projectAnalysis} limits={limits} />
              )}
              {activeView === "charts" && (
                <ChartsView solution={solution} limits={limits} />
              )}
              {activeView === "limits" && (
                <LimitsView checks={safetyChecks} limits={limits} />
              )}
              {activeView === "kta" && (
                <KtaView checks={ktaChecks} />
              )}
              {activeView === "cases" && (
                <CasesView comparisonRows={comparisonRows} />
              )}
            </>
          )
        )}
      </main>

      <aside className="side-panel limits-panel">
        <PanelTitle icon={<ShieldCheck size={18} />} title="Limity akceptacji" />
        <button className="utility-button" onClick={() => setLimits(DEFAULT_LIMITS)} type="button">
          <RotateCcw size={16} />
          Reset limitów
        </button>

        <ControlGroup title="Normalna praca">
          <RangeField label="T paliwa max" min={700} max={1800} step={5} unit="°C" value={limits.maxFuelCenterC} onChange={(value) => updateLimit("maxFuelCenterC", value)} />
          <RangeField label="T helu na wylocie" min={500} max={1100} step={5} unit="°C" value={limits.maxHeliumOutletC} onChange={(value) => updateLimit("maxHeliumOutletC", value)} />
          <RangeField label="Moc dmuchawy helu" min={0.5} max={12} step={0.1} unit="MW" value={limits.maxHydraulicPowerMW} onChange={(value) => updateLimit("maxHydraulicPowerMW", value)} />
          <RangeField label="T zewn. RPV" min={100} max={700} step={5} unit="°C" value={limits.maxRpvOuterC} onChange={(value) => updateLimit("maxRpvOuterC", value)} />
        </ControlGroup>

        <ControlGroup title="Inherent safety">
          <CheckboxField
            checked={limits.inherentSafetyEnabled}
            label="Uwzględniaj gęstość mocy"
            onChange={(checked) => setLimits((current) => ({ ...current, inherentSafetyEnabled: checked }))}
          />
          {limits.inherentSafetyEnabled && (
            <RangeField label="Gęstość mocy" min={1} max={8} step={0.1} unit="MW/m³" value={limits.maxThermalPowerDensityMWM3} onChange={(value) => updateLimit("maxThermalPowerDensityMWM3", value)} />
          )}
          <p className="limit-note">
            Próg awaryjny DLOFC: {fmt(DLOFC_FUEL_PEAK_LIMIT_C, 0)} °C. {limits.inherentSafetyEnabled
              ? "Gęstość mocy wpływa teraz na ocenę limitów."
              : "Gęstość mocy jest teraz tylko wynikiem informacyjnym."}
          </p>
        </ControlGroup>

        {solution && (
          <div className={`overall-status ${allSafetyOk ? "ok" : "bad"}`}>
            {allSafetyOk ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <span>{allSafetyOk ? "Limity steady-state spełnione" : "Przekroczenia steady-state"}</span>
          </div>
        )}
      </aside>
    </div>
  );
}

function buildProjectAnalysis(inputs: ModelInputs, limits: SafetyLimits): ProjectAnalysis {
  const nominalInputs = {
    ...inputs,
    powerMW: 250,
    dPebbleCm: 6,
    mDotKgS: 96,
  };
  const investorInputs = {
    ...inputs,
    powerMW: 350,
    dPebbleCm: 4,
    mDotKgS: 96,
  };

  const nominal = solveCore1DCase(nominalInputs);
  const investor = solveCore1DCase(investorInputs);
  const investorSafetyChecks = evaluateSafety(investor, limits);
  const investorKtaChecks = buildKtaChecks(investor, investorInputs);
  const investorSafetyOk = investorSafetyChecks.every((check) => check.ok);
  const investorKtaOk = investorKtaChecks.every((check) => check.ok);
  const tempOk = investor.summary.maxFuelCenterC <= limits.maxFuelCenterC;
  const failedSafetyLabels = investorSafetyChecks
    .filter((check) => !check.ok)
    .map((check) => check.label);
  const minFlow = findMinimumMassFlowForFuelLimit(investorInputs, limits.maxFuelCenterC);

  const deltas = {
    powerGainMW: investor.summary.totalPowerMW - nominal.summary.totalPowerMW,
    powerGainPercent: percentChange(investor.summary.totalPowerMW, nominal.summary.totalPowerMW),
    powerDensityDeltaMWM3: investor.summary.thermalPowerDensityMWM3 - nominal.summary.thermalPowerDensityMWM3,
    powerDensityPercent: percentChange(investor.summary.thermalPowerDensityMWM3, nominal.summary.thermalPowerDensityMWM3),
    maxFuelDeltaC: investor.summary.maxFuelCenterC - nominal.summary.maxFuelCenterC,
    heliumOutletDeltaC: investor.summary.heliumOutletC - nominal.summary.heliumOutletC,
    pressureDropDeltaKPa: investor.summary.totalPressureDropKPa - nominal.summary.totalPressureDropKPa,
    pressureDropFactor: safeRatio(investor.summary.totalPressureDropKPa, nominal.summary.totalPressureDropKPa),
    hydraulicPowerDeltaMW: investor.summary.hydraulicPowerMW - nominal.summary.hydraulicPowerMW,
    hydraulicPowerFactor: safeRatio(investor.summary.hydraulicPowerMW, nominal.summary.hydraulicPowerMW),
    hydraulicPowerShareDeltaPct: investor.summary.hydraulicPowerPercent - nominal.summary.hydraulicPowerPercent,
    netThermalAfterHydraulicGainMW:
      (investor.summary.totalPowerMW - investor.summary.hydraulicPowerMW)
      - (nominal.summary.totalPowerMW - nominal.summary.hydraulicPowerMW),
  };

  return {
    nominal,
    investor,
    minFlow,
    investorSafetyOk,
    investorKtaOk,
    tempOk,
    deltas,
    verdict: buildProjectVerdict({
      investorSafetyOk,
      investorKtaOk,
      tempOk,
      minFlow,
      investor,
      limits,
      failedSafetyLabels,
    }),
  };
}

function findMinimumMassFlowForFuelLimit(
  baseInputs: ModelInputs,
  maxFuelCenterC: number,
): MinimumFlowResult {
  const solveAt = (mDotKgS: number) => solveCore1DCase({ ...baseInputs, mDotKgS });
  let lower = 20;
  let upper = Math.max(baseInputs.mDotKgS, 96);
  let upperSolution = solveAt(upper);

  if (solveAt(lower).summary.maxFuelCenterC <= maxFuelCenterC) {
    return {
      mDotKgS: lower,
      solution: solveAt(lower),
    };
  }

  while (upperSolution.summary.maxFuelCenterC > maxFuelCenterC && upper < 500) {
    upper *= 1.2;
    upperSolution = solveAt(upper);
  }

  if (upperSolution.summary.maxFuelCenterC > maxFuelCenterC) {
    return null;
  }

  for (let iteration = 0; iteration < 18; iteration += 1) {
    const middle = 0.5 * (lower + upper);
    const middleSolution = solveAt(middle);

    if (middleSolution.summary.maxFuelCenterC <= maxFuelCenterC) {
      upper = middle;
      upperSolution = middleSolution;
    } else {
      lower = middle;
    }
  }

  return {
    mDotKgS: upper,
    solution: upperSolution,
  };
}

function buildProjectVerdict({
  investorSafetyOk,
  investorKtaOk,
  tempOk,
  minFlow,
  investor,
  limits,
  failedSafetyLabels,
}: {
  investorSafetyOk: boolean;
  investorKtaOk: boolean;
  tempOk: boolean;
  minFlow: MinimumFlowResult;
  investor: CoreSolution;
  limits: SafetyLimits;
  failedSafetyLabels: string[];
}): ProjectAnalysis["verdict"] {
  if (!investorKtaOk) {
    return {
      status: "warn",
      title: "Uwaga: zakres KTA jest przekroczony",
      text: "Wynik liczbowy można oglądać, ale rekomendację trzeba opatrzyć zastrzeżeniem, bo co najmniej jedna korelacja pracuje poza zakresem stosowalności.",
    };
  }

  if (investorSafetyOk) {
    return {
      status: "ok",
      title: "Wariant 350 MW / 4 cm spełnia ustawione limity",
      text: limits.inherentSafetyEnabled
        ? "Według aktualnego modelu steady-state wariant mieści się w limitach normalnej pracy i w progu gęstości mocy. DLOFC nadal wymaga osobnego modelu transjentu."
        : "Według aktualnego modelu steady-state wariant mieści się w aktywnych limitach normalnej pracy. Gęstość mocy nie jest teraz włączona do oceny akceptacji.",
    };
  }

  if (tempOk) {
    return {
      status: "warn",
      title: "Temperatura paliwa ma zapas, ale wariant nie przechodzi pełnej oceny",
      text: `Wariant 350 MW / 4 cm mieści się w limicie temperatury paliwa normalnej pracy, ale przekracza: ${failedSafetyLabels.join(", ")}.`,
    };
  }

  if (!tempOk && minFlow) {
    return {
      status: "warn",
      title: "Wariant wymaga zwiększenia przepływu helu",
      text: `Przy 96 kg/s temperatura paliwa przekracza limit ${fmt(limits.maxFuelCenterC, 0)} °C. Model znajduje minimalny przepływ około ${fmt(minFlow.mDotKgS, 1)} kg/s dla wariantu 350 MW / 4 cm.`,
    };
  }

  return {
    status: "bad",
    title: "Wariant inwestora nie spełnia ustawionych limitów",
    text: `Największe ograniczenie w aktualnych nastawach to temperatura paliwa ${fmt(investor.summary.maxFuelCenterC, 1)} °C oraz limity przepływowe ustawione w panelu po prawej.`,
  };
}

function MetricGrid({
  solution,
  limits,
}: {
  solution: CoreSolution;
  limits: SafetyLimits;
}) {
  const summary = solution.summary;
  return (
    <section className="metric-grid" aria-label="Najważniejsze wyniki">
      <MetricCard
        icon={<Flame size={19} />}
        label="T paliwa max"
        value={`${fmt(summary.maxFuelCenterC, 1)} °C`}
        detail={`limit ${fmt(limits.maxFuelCenterC, 0)} °C, z = ${fmt(summary.zMaxFuelM, 2)} m`}
        status={summary.maxFuelCenterC <= limits.maxFuelCenterC ? "ok" : "bad"}
      />
      <MetricCard
        icon={<Thermometer size={19} />}
        label="T helu out"
        value={`${fmt(summary.heliumOutletC, 1)} °C`}
        detail={`limit ${fmt(limits.maxHeliumOutletC, 0)} °C, in = ${fmt(summary.heliumInletC, 0)} °C`}
        status={summary.heliumOutletC <= limits.maxHeliumOutletC ? "ok" : "bad"}
      />
      <MetricCard
        icon={<Activity size={19} />}
        label="P dmuchawy"
        value={`${fmt(summary.hydraulicPowerMW, 3)} MW`}
        detail={`limit ${fmt(limits.maxHydraulicPowerMW, 1)} MW, ${fmt(summary.hydraulicPowerPercent, 3)}% Pth`}
        status={summary.hydraulicPowerMW <= limits.maxHydraulicPowerMW ? "ok" : "bad"}
      />
      <MetricCard
        icon={<ShieldCheck size={19} />}
        label="T zewn. RPV"
        value={`${fmt(summary.maxRpvOuterC, 1)} °C`}
        detail={`limit ${fmt(limits.maxRpvOuterC, 0)} °C`}
        status={summary.maxRpvOuterC <= limits.maxRpvOuterC ? "ok" : "bad"}
      />
      {limits.inherentSafetyEnabled && (
        <MetricCard
          icon={<Zap size={19} />}
          label="Gęstość mocy"
          value={`${fmt(summary.thermalPowerDensityMWM3, 2)} MW/m³`}
          detail={`limit ${fmt(limits.maxThermalPowerDensityMWM3, 1)} MW/m³, V = ${fmt(summary.coreVolumeM3, 1)} m³`}
          status={summary.thermalPowerDensityMWM3 <= limits.maxThermalPowerDensityMWM3 ? "ok" : "bad"}
        />
      )}
    </section>
  );
}

function AnalysisView({
  analysis,
  limits,
}: {
  analysis: ProjectAnalysis;
  limits: SafetyLimits;
}) {
  const nominal = analysis.nominal.summary;
  const investor = analysis.investor.summary;
  const minFlow = analysis.minFlow;
  const minFlowSummary = minFlow?.solution.summary;
  const currentFlowTempMargin = limits.maxFuelCenterC - investor.maxFuelCenterC;
  const powerDensityMargin = limits.maxThermalPowerDensityMWM3 - investor.thermalPowerDensityMWM3;
  const minFlowDelta = minFlow ? minFlow.mDotKgS - 96 : null;

  return (
    <section className="analysis-view">
      <article className={`analysis-hero ${analysis.verdict.status}`}>
        <div>
          <span className="analysis-kicker">Wniosek projektowy</span>
          <h2>{analysis.verdict.title}</h2>
          <p>{analysis.verdict.text}</p>
        </div>
        <span className={`verdict-badge ${analysis.verdict.status}`}>
          {analysis.verdict.status === "ok" ? "OK" : analysis.verdict.status === "warn" ? "Uwaga" : "Poza"}
        </span>
      </article>

      <div className="analysis-grid">
        <AnalysisCard
          icon={<TrendingUp size={18} />}
          title="Cel 1: porównanie wariantów"
          value={`+${fmt(analysis.deltas.powerGainMW, 0)} MWth`}
          detail={`Moc rośnie o ${fmt(analysis.deltas.powerGainPercent, 1)}%, T paliwa zmienia się o ${signed(analysis.deltas.maxFuelDeltaC, 1)} °C.`}
          status={analysis.tempOk ? "ok" : "warn"}
        />
        {limits.inherentSafetyEnabled && (
          <AnalysisCard
            icon={<Zap size={18} />}
            title="Gęstość mocy cieplnej"
            value={`${fmt(investor.thermalPowerDensityMWM3, 2)} MW/m³`}
            detail={`Limit ${fmt(limits.maxThermalPowerDensityMWM3, 1)} MW/m³, margines ${signed(powerDensityMargin, 2)} MW/m³; zmiana ${fmt(analysis.deltas.powerDensityPercent, 1)}%.`}
            status={powerDensityMargin >= 0 ? "ok" : "bad"}
          />
        )}
        <AnalysisCard
          icon={<Flame size={18} />}
          title="Temperatura paliwa"
          value={`${fmt(investor.maxFuelCenterC, 1)} °C`}
          detail={`Limit ${fmt(limits.maxFuelCenterC, 0)} °C, margines ${signed(currentFlowTempMargin, 1)} °C przy 350 MW / 4 cm / 96 kg/s.`}
          status={currentFlowTempMargin >= 0 ? "ok" : "bad"}
        />
        <AnalysisCard
          icon={<Gauge size={18} />}
          title="Cel 2: koszt przepływu"
          value={`${fmt(analysis.deltas.pressureDropFactor, 2)}× Δp`}
          detail={`P dmuchawy: ${fmt(investor.hydraulicPowerMW, 3)} MW vs limit ${fmt(limits.maxHydraulicPowerMW, 1)} MW; udział ${fmt(investor.hydraulicPowerPercent, 2)}%.`}
          status={investor.hydraulicPowerMW <= limits.maxHydraulicPowerMW ? "ok" : "warn"}
        />
        <AnalysisCard
          icon={<Activity size={18} />}
          title="Cel 3: minimalny strumień helu"
          value={minFlow ? `${fmt(minFlow.mDotKgS, 1)} kg/s` : "brak <= 500"}
          detail={minFlow
            ? `To ${signed(minFlowDelta ?? 0, 1)} kg/s względem 96 kg/s; T paliwa wtedy ${fmt(minFlowSummary?.maxFuelCenterC, 1)} °C.`
            : "W zadanym zakresie szukania temperatura paliwa nie schodzi poniżej limitu."}
          status={minFlow ? "ok" : "bad"}
        />
      </div>

      <div className="analysis-table-panel">
        <table className="analysis-table">
          <thead>
            <tr>
              <th>Wielkość</th>
              <th>Nominalnie 250 MW / 6 cm</th>
              <th>Inwestor 350 MW / 4 cm</th>
              <th>Zmiana</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gęstość mocy cieplnej</td>
              <td>{fmt(nominal.thermalPowerDensityMWM3, 2)} MW/m³</td>
              <td>{fmt(investor.thermalPowerDensityMWM3, 2)} MW/m³</td>
              <td>{signed(analysis.deltas.powerDensityDeltaMWM3, 2)} MW/m³</td>
            </tr>
            <tr>
              <td>T paliwa max</td>
              <td>{fmt(nominal.maxFuelCenterC, 1)} °C</td>
              <td>{fmt(investor.maxFuelCenterC, 1)} °C</td>
              <td>{signed(analysis.deltas.maxFuelDeltaC, 1)} °C</td>
            </tr>
            <tr>
              <td>T helu na wylocie</td>
              <td>{fmt(nominal.heliumOutletC, 1)} °C</td>
              <td>{fmt(investor.heliumOutletC, 1)} °C</td>
              <td>{signed(analysis.deltas.heliumOutletDeltaC, 1)} °C</td>
            </tr>
            <tr>
              <td>Spadek ciśnienia</td>
              <td>{fmt(nominal.totalPressureDropKPa, 1)} kPa</td>
              <td>{fmt(investor.totalPressureDropKPa, 1)} kPa</td>
              <td>{fmt(analysis.deltas.pressureDropFactor, 2)}×</td>
            </tr>
            <tr>
              <td>Moc hydrauliczna</td>
              <td>{fmt(nominal.hydraulicPowerMW, 3)} MW</td>
              <td>{fmt(investor.hydraulicPowerMW, 3)} MW</td>
              <td>{fmt(analysis.deltas.hydraulicPowerFactor, 2)}×</td>
            </tr>
            <tr>
              <td>Liczba kul</td>
              <td>{compact(nominal.nPebblesTotal)}</td>
              <td>{compact(investor.nPebblesTotal)}</td>
              <td>{fmt(safeRatio(investor.nPebblesTotal, nominal.nPebblesTotal), 2)}×</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AnalysisCard({
  icon,
  title,
  value,
  detail,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
  status: "ok" | "warn" | "bad";
}) {
  return (
    <article className={`analysis-card ${status}`}>
      <div className="analysis-card-icon">{icon}</div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function ChartsView({
  solution,
  limits,
}: {
  solution: CoreSolution;
  limits: SafetyLimits;
}) {
  const rows = solution.rows;
  const z = rows.map((row) => row.z_mid_m);
  return (
    <section className="chart-grid">
      <ChartPanel title="Profil temperatur">
        <UPlotChart
          xValues={z}
          xLabel="Wysokość rdzenia z [m]"
          yLabel="Temperatura [°C]"
          series={[
            { label: "Hel średni", values: rows.map((row) => row.t_he_mean_C), color: chartColors.helium, unit: "°C" },
            { label: "Centrum kuli paliwowej", values: rows.map((row) => row.t_fuel_center_C), color: chartColors.fuelCenter, unit: "°C", width: 2.3 },
          ]}
          referenceLines={[
            { label: "Limit He out", value: limits.maxHeliumOutletC, color: chartColors.helium, unit: "°C" },
            { label: "Limit paliwa", value: limits.maxFuelCenterC, color: chartColors.fuelCenter, unit: "°C" },
          ]}
        />
      </ChartPanel>

      <ChartPanel title="Spadek ciśnienia i moc hydrauliczna">
        <UPlotChart
          xValues={z}
          xLabel="Wysokość rdzenia z [m]"
          yLabel="Skumulowany spadek ciśnienia [kPa]"
          y2Label="Skumulowana moc hydrauliczna [MW]"
          series={[
            { label: "Δp skum.", values: rows.map((row) => row.delta_p_cumulative_kPa), color: chartColors.pressure, unit: "kPa" },
            { label: "P hyd skum.", values: rows.map((row) => row.hydraulic_power_cumulative_MW), color: chartColors.hydraulic, unit: "MW", scale: "y2", dash: [7, 5], digits: 3 },
          ]}
          referenceLines={[
            { label: "Limit dmuchawy", value: limits.maxHydraulicPowerMW, color: chartColors.hydraulic, unit: "MW", scale: "y2", digits: 1 },
          ]}
        />
      </ChartPanel>

      <ChartPanel title="Wnikanie ciepła i Reynolds">
        <UPlotChart
          xValues={z}
          xLabel="Wysokość rdzenia z [m]"
          yLabel="Współczynnik wnikania h [W/(m²K)]"
          y2Label="Liczba Reynoldsa Re [-]"
          series={[
            { label: "h", values: rows.map((row) => row.h_pebble_he_W_m2K), color: chartColors.h, unit: "W/(m²K)" },
            { label: "Re", values: rows.map((row) => row.reynolds), color: chartColors.reynolds, unit: "-", scale: "y2", dash: [7, 5], digits: 0 },
          ]}
        />
      </ChartPanel>

      <ChartPanel title="Straty ciepła do RCCS">
        <UPlotChart
          xValues={z}
          xLabel="Wysokość rdzenia z [m]"
          yLabel="Strata ciepła do RCCS [kW/m]"
          series={[
            { label: "Konwekcja", values: rows.map((row) => row.q_convection_kW_per_m), color: chartColors.convection, unit: "kW/m", digits: 4 },
            { label: "Radiacja", values: rows.map((row) => row.q_radiation_kW_per_m), color: chartColors.radiation, unit: "kW/m", digits: 4 },
            { label: "Suma strat", values: rows.map((row) => row.q_loss_kW_per_m), color: chartColors.total, unit: "kW/m", dash: [7, 5], digits: 4 },
          ]}
        />
      </ChartPanel>
    </section>
  );
}

function CasesView({
  comparisonRows,
}: {
  comparisonRows: ComparisonRow[];
}) {
  return (
    <section className="table-panel">
      <div className="table-header">
        <h2>Warianty referencyjne</h2>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Przypadek</th>
              <th>T paliwa max</th>
              <th>T He out</th>
              <th>Δp</th>
              <th>P hyd</th>
              <th>q'''</th>
              <th>N kul</th>
              <th>Limity</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>{fmt(row.maxFuelCenterC, 1)} °C</td>
                <td>{fmt(row.heliumOutletC, 1)} °C</td>
                <td>{fmt(row.totalPressureDropKPa, 1)} kPa</td>
                <td>{fmt(row.hydraulicPowerMW, 3)} MW</td>
                <td>{fmt(row.thermalPowerDensityMWM3, 2)} MW/m³</td>
                <td>{compact(row.nPebblesTotal)}</td>
                <td><StatusPill ok={row.ok} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type PlotSeries = {
  label: string;
  values: number[];
  color: string;
  unit?: string;
  scale?: "y" | "y2";
  width?: number;
  dash?: number[];
  digits?: number;
};

type PlotReferenceLine = {
  label: string;
  value: number;
  color: string;
  unit?: string;
  scale?: "y" | "y2";
  digits?: number;
};

function UPlotChart({
  xValues,
  xLabel,
  yLabel,
  y2Label,
  series,
  referenceLines = [],
}: {
  xValues: number[];
  xLabel: string;
  yLabel: string;
  y2Label?: string;
  series: PlotSeries[];
  referenceLines?: PlotReferenceLine[];
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const data = useMemo<uPlot.AlignedData>(
    () => [xValues, ...series.map((item) => item.values)],
    [series, xValues],
  );
  const options = useMemo<uPlot.Options>(() => {
    const hasY2 = Boolean(y2Label || series.some((item) => item.scale === "y2"));
    const yAxisColor = hasY2
      ? series.find((item) => (item.scale ?? "y") === "y")?.color ?? "#52606b"
      : "#52606b";
    const y2AxisColor = series.find((item) => item.scale === "y2")?.color ?? "#52606b";
    const grid = { show: true, stroke: "#e4e9ed", width: 1 };
    const ticks = { show: true, stroke: "#c9d2d8", width: 1 };

    return {
      width: 640,
      height: 240,
      padding: [8, 8, 0, 0],
      legend: {
        show: false,
      },
      cursor: {
        show: true,
        x: true,
        y: false,
        drag: {
          setScale: false,
        },
      },
      scales: {
        x: { time: false },
        y: { auto: true },
        ...(hasY2 ? { y2: { auto: true } } : {}),
      },
      axes: [
        {
          scale: "x",
          side: 2,
          label: xLabel,
          size: 38,
          labelSize: 16,
          stroke: "#52606b",
          grid,
          ticks,
          values: (_self: uPlot, splits: number[]) => splits.map((value) => fmt(value, 1)),
        },
        {
          scale: "y",
          side: 3,
          label: yLabel,
          size: 62,
          labelSize: 18,
          stroke: yAxisColor,
          grid,
          ticks: hasY2 ? { ...ticks, stroke: yAxisColor } : ticks,
          values: (_self: uPlot, splits: number[]) => splits.map(formatAxisValue),
        },
        ...(hasY2
          ? [
              {
                scale: "y2",
                side: 1,
                label: y2Label ?? "",
                size: 64,
                labelSize: 18,
                stroke: y2AxisColor,
                grid: { show: false },
                ticks: { ...ticks, stroke: y2AxisColor },
                values: (_self: uPlot, splits: number[]) => splits.map(formatAxisValue),
              },
            ]
          : []),
      ],
      series: [
        {
          label: xLabel,
          value: (_self: uPlot, rawValue: number) => `${fmt(rawValue, 2)} m`,
        },
        ...series.map((item) => ({
          label: item.label,
          scale: item.scale ?? "y",
          stroke: item.color,
          width: item.width ?? 2,
          dash: item.dash,
          points: { show: false },
          value: (_self: uPlot, rawValue: number) => {
            const formatted = fmt(rawValue, item.digits ?? 2);
            return item.unit ? `${formatted} ${item.unit}` : formatted;
          },
        })),
      ],
      hooks: {
        draw: [
          (self: uPlot) => {
            drawReferenceLines(self, referenceLines);
          },
        ],
        setCursor: [
          (self: uPlot) => {
            const tooltip = tooltipRef.current;
            const host = hostRef.current;
            const idx = self.cursor.idx;

            if (!tooltip || !host || idx == null || idx < 0 || idx >= xValues.length) {
              if (tooltip) {
                tooltip.hidden = true;
              }
              return;
            }

            const rowsHtml = series
              .map((item) => {
                const value = item.values[idx];
                if (typeof value !== "number" || !Number.isFinite(value)) {
                  return "";
                }

                return `
                  <div class="plot-tooltip-row">
                    <span class="plot-tooltip-swatch" style="background:${item.color}"></span>
                    <span>${item.label}</span>
                    <strong>${fmt(value, item.digits ?? 2)} ${item.unit ?? ""}</strong>
                  </div>
                `;
              })
              .join("");

            tooltip.innerHTML = `
              <div class="plot-tooltip-title">z = ${fmt(xValues[idx], 2)} m</div>
              ${rowsHtml}
            `;
            tooltip.hidden = false;

            const cursorLeft = self.cursor.left ?? 0;
            const cursorTop = self.cursor.top ?? 0;
            const x = host.offsetLeft + self.bbox.left + cursorLeft;
            const y = host.offsetTop + self.bbox.top + cursorTop;
            const placeLeft = x > host.clientWidth / 2;
            const left = placeLeft ? x - tooltip.offsetWidth - 14 : x + 14;
            const top = Math.min(
              Math.max(8, y - tooltip.offsetHeight / 2),
              Math.max(8, host.offsetTop + host.clientHeight - tooltip.offsetHeight - 8),
            );

            tooltip.style.left = `${Math.max(8, left)}px`;
            tooltip.style.top = `${top}px`;
          },
        ],
      },
    };
  }, [referenceLines, series, xLabel, xValues, y2Label, yLabel]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const getSize = () => ({
      width: Math.max(280, host.clientWidth),
      height: Math.max(180, host.clientHeight),
    });

    const plot = new uPlot({ ...options, ...getSize() }, data, host);
    const hideTooltip = () => {
      if (tooltipRef.current) {
        tooltipRef.current.hidden = true;
      }
    };
    plot.over.addEventListener("mouseleave", hideTooltip);
    const resizeObserver = new ResizeObserver(() => {
      plot.setSize(getSize());
    });
    resizeObserver.observe(host);

    return () => {
      plot.over.removeEventListener("mouseleave", hideTooltip);
      resizeObserver.disconnect();
      plot.destroy();
    };
  }, [data, options]);

  return (
    <div className="plot-shell">
      <div className="plot-legend">
        {series.map((item) => (
          <span className="plot-legend-item" key={`${item.label}-${item.scale ?? "y"}`}>
            <span className="plot-legend-swatch" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
        {referenceLines.map((item) => (
          <span className="plot-legend-item muted" key={`${item.label}-${item.scale ?? "y"}-${item.value}`}>
            <span className="plot-legend-swatch dashed" style={{ borderColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
      <div className="uplot-host" ref={hostRef} />
      <div className="plot-tooltip" ref={tooltipRef} hidden />
    </div>
  );
}

function drawReferenceLines(self: uPlot, referenceLines: PlotReferenceLine[]) {
  if (referenceLines.length === 0) {
    return;
  }

  const ctx = self.ctx;
  const pxRatio = uPlot.pxRatio || 1;
  const plotLeft = self.bbox.left;
  const plotTop = self.bbox.top;
  const plotWidth = self.bbox.width;
  const plotHeight = self.bbox.height;
  const plotRight = plotLeft + plotWidth;
  const plotBottom = plotTop + plotHeight;

  ctx.save();
  ctx.beginPath();
  ctx.rect(plotLeft, plotTop, plotWidth, plotHeight);
  ctx.clip();

  referenceLines.forEach((line, index) => {
    const scaleKey = line.scale ?? "y";
    const scale = self.scales[scaleKey];
    if (!scale || !Number.isFinite(line.value)) {
      return;
    }

    const rawY = self.valToPos(line.value, scaleKey, true);
    if (!Number.isFinite(rawY)) {
      return;
    }

    const scaleMin = scale.min ?? Number.NEGATIVE_INFINITY;
    const scaleMax = scale.max ?? Number.POSITIVE_INFINITY;
    if (line.value < scaleMin || line.value > scaleMax || rawY < plotTop || rawY > plotBottom) {
      return;
    }

    const y = rawY;
    const yLine = Math.round(y) + 0.5;

    ctx.save();
    ctx.globalAlpha = 0.74;
    ctx.strokeStyle = line.color;
    ctx.lineWidth = Math.max(1, pxRatio);
    ctx.setLineDash([6 * pxRatio, 4 * pxRatio]);
    ctx.beginPath();
    ctx.moveTo(plotLeft, yLine);
    ctx.lineTo(plotRight, yLine);
    ctx.stroke();

    const value = `${fmt(line.value, line.digits ?? 0)}${line.unit ? ` ${line.unit}` : ""}`;
    const text = `${line.label}: ${value}`;
    const fontSize = 11 * pxRatio;
    const padX = 5 * pxRatio;
    const labelHeight = 16 * pxRatio;
    const labelY = Math.min(
      Math.max(y + (index % 2 === 0 ? -1 : 1) * 2 * pxRatio, plotTop + labelHeight / 2 + 2 * pxRatio),
      plotBottom - labelHeight / 2 - 2 * pxRatio,
    );

    ctx.font = `700 ${fontSize}px Inter, Arial, sans-serif`;
    const textWidth = ctx.measureText(text).width;
    const labelX = plotLeft + 6 * pxRatio;
    const bgX = labelX;
    const bgY = labelY - labelHeight / 2;

    ctx.globalAlpha = 0.84;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bgX, bgY, textWidth + 2 * padX, labelHeight);
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = line.color;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, labelX + padX, labelY);
    ctx.restore();
  });

  ctx.restore();
}

function LimitsView({ checks, limits }: { checks: SafetyCheck[]; limits: SafetyLimits }) {
  return (
    <section className="table-panel">
      <div className="table-header">
        <h2>Ocena według limitów steady-state</h2>
        <StatusPill ok={checks.every((check) => check.ok)} />
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Wielkość</th>
              <th>Wartość</th>
              <th>Warunek</th>
              <th>Margines</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((check) => (
              <tr key={check.label} className={check.ok ? "" : "failed-row"}>
                <td>{check.label}</td>
                <td>{fmt(check.value, 3)} {check.unit}</td>
                <td>{check.condition}</td>
                <td>{fmt(check.margin, 3)} {check.unit}</td>
                <td><StatusPill ok={check.ok} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="emergency-note">
        <h3>Oś awaryjna</h3>
        <p>
          Pik paliwa DLOFC ma próg {fmt(DLOFC_FUEL_PEAK_LIMIT_C, 0)} °C, ale wymaga modelu transjentu.
          {limits.inherentSafetyEnabled
            ? " Gęstość mocy cieplnej jest włączona jako najprostszy wskaźnik zapasu inherent safety."
            : " Gęstość mocy cieplnej jest wyłączona z oceny limitów."}
        </p>
      </div>
    </section>
  );
}

function KtaView({ checks }: { checks: KtaCheck[] }) {
  return (
    <section className="table-panel">
      <div className="table-header">
        <h2>Zakresy korelacji KTA</h2>
        <StatusPill ok={checks.every((check) => check.ok)} />
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Korelacja</th>
              <th>Zmienna</th>
              <th>Wartość</th>
              <th>Warunek</th>
              <th>Przekroczenie</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((check) => (
              <tr key={`${check.standard}-${check.variable}`} className={check.ok ? "" : "failed-row"}>
                <td>{check.standard}</td>
                <td>{check.variable}</td>
                <td>{check.value}</td>
                <td>{check.condition}</td>
                <td>{check.exceededBy.length > 0 ? check.exceededBy.join(", ") : "—"}</td>
                <td><StatusPill ok={check.ok} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  integer = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  integer?: boolean;
}) {
  const id = useId();

  function commit(nextValue: number) {
    if (!Number.isFinite(nextValue)) {
      return;
    }
    const normalized = integer ? Math.round(nextValue) : nextValue;
    onChange(normalized);
  }

  return (
    <label className="range-field" htmlFor={id}>
      <span className="range-top">
        <span>{label}</span>
        <span className="range-value">{fmt(value, step < 1 ? 2 : 0)} {unit}</span>
      </span>
      <span className="range-row">
        <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(event) => commit(Number(event.target.value))} />
        <input className="number-input" type="number" min={min} max={max} step={step} value={value} onChange={(event) => commit(Number(event.target.value))} />
      </span>
    </label>
  );
}

function CheckboxField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();

  return (
    <label className="checkbox-field" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function ControlGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="control-group">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="chart-panel">
      <h2>{title}</h2>
      <div className="chart-box">{children}</div>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  status?: "ok" | "bad";
}) {
  return (
    <article className={`metric-card ${status ?? ""}`}>
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="panel-title">
      {icon}
      <h2>{title}</h2>
    </div>
  );
}

function StatusPill({ ok }: { ok: boolean }) {
  return (
    <span className={`status-pill ${ok ? "ok" : "bad"}`}>
      {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {ok ? "OK" : "Poza"}
    </span>
  );
}

function TabButton({
  active,
  attention = false,
  onClick,
  children,
}: {
  active: boolean;
  attention?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const className = [
    "tab-button",
    active ? "active" : "",
    attention ? "attention" : "",
  ].filter(Boolean).join(" ");

  return (
    <button className={className} onClick={onClick} title={attention ? "Przekroczenie - zobacz szczegóły" : undefined} type="button">
      {children}
      {attention && <span className="tab-alert" aria-hidden="true">!</span>}
    </button>
  );
}

function fmt(value: number | null | undefined, digits = 2): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return numberFormat.format(Number(value.toFixed(digits)));
}

function formatAxisValue(value: number): string {
  if (Math.abs(value) >= 1000) {
    return compact(value);
  }
  if (Math.abs(value) >= 100) {
    return fmt(value, 0);
  }
  if (Math.abs(value) >= 10) {
    return fmt(value, 1);
  }
  return fmt(value, 2);
}

function safeRatio(value: number, reference: number): number {
  if (reference === 0) {
    return Number.NaN;
  }

  return value / reference;
}

function percentChange(value: number, reference: number): number {
  return 100 * (safeRatio(value, reference) - 1);
}

function signed(value: number, digits = 1): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return `${value >= 0 ? "+" : ""}${fmt(value, digits)}`;
}

function compact(value: number): string {
  return compactFormat.format(value);
}
