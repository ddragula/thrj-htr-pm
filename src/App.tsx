import { useId, useMemo, useState } from "react";
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
  XCircle,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildKtaChecks,
  CASE_PRESETS,
  DEFAULT_INPUTS,
  DEFAULT_LIMITS,
  evaluateSafety,
  type CoreSolution,
  type KtaCheck,
  type ModelInputs,
  type SafetyCheck,
  type SafetyLimits,
  solveCore1DCase,
} from "./model/htrPm";

type View = "charts" | "limits" | "kta";

type CalculationState =
  | { solution: CoreSolution; error?: undefined }
  | { solution?: undefined; error: string };

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

  const allSafetyOk = safetyChecks.every((check) => check.ok);
  const allKtaOk = ktaChecks.every((check) => check.ok);

  function updateInput(key: keyof ModelInputs, value: number) {
    setInputs((current) => ({ ...current, [key]: value }));
  }

  function updateLimit(key: keyof SafetyLimits, value: number) {
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
          <RangeField label="Liczba węzłów" min={10} max={200} step={1} unit="" value={inputs.nNodes} integer onChange={(value) => updateInput("nNodes", value)} />
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
            <TabButton active={activeView === "limits"} onClick={() => setActiveView("limits")}>Limity</TabButton>
            <TabButton active={activeView === "kta"} onClick={() => setActiveView("kta")}>KTA</TabButton>
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
              <MetricGrid solution={solution} allSafetyOk={allSafetyOk} allKtaOk={allKtaOk} />

              {activeView === "charts" && (
                <ChartsView solution={solution} limits={limits} comparisonRows={comparisonRows} />
              )}
              {activeView === "limits" && (
                <LimitsView checks={safetyChecks} />
              )}
              {activeView === "kta" && (
                <KtaView checks={ktaChecks} />
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
        <RangeField label="T paliwa max" min={700} max={1800} step={5} unit="°C" value={limits.maxFuelCenterC} onChange={(value) => updateLimit("maxFuelCenterC", value)} />
        <RangeField label="T helu na wylocie" min={500} max={1100} step={5} unit="°C" value={limits.maxHeliumOutletC} onChange={(value) => updateLimit("maxHeliumOutletC", value)} />
        <RangeField label="Spadek ciśnienia" min={20} max={1000} step={5} unit="kPa" value={limits.maxPressureDropKPa} onChange={(value) => updateLimit("maxPressureDropKPa", value)} />
        <RangeField label="Moc hydr. / cieplna" min={0.1} max={10} step={0.1} unit="%" value={limits.maxHydraulicPowerPercent} onChange={(value) => updateLimit("maxHydraulicPowerPercent", value)} />
        <RangeField label="T zewn. RPV" min={100} max={700} step={5} unit="°C" value={limits.maxRpvOuterC} onChange={(value) => updateLimit("maxRpvOuterC", value)} />
        <RangeField label="p wylotu minimum" min={0.2} max={9} step={0.1} unit="MPa" value={limits.minOutletPressureMPa} onChange={(value) => updateLimit("minOutletPressureMPa", value)} />
        <RangeField label="Straty RCCS / moc" min={0.01} max={1} step={0.01} unit="%" value={limits.maxHeatLossPercent} onChange={(value) => updateLimit("maxHeatLossPercent", value)} />

        {solution && (
          <div className={`overall-status ${allSafetyOk ? "ok" : "bad"}`}>
            {allSafetyOk ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <span>{allSafetyOk ? "Dane spełniają limity" : "Występują przekroczenia"}</span>
          </div>
        )}
      </aside>
    </div>
  );
}

function MetricGrid({
  solution,
  allSafetyOk,
  allKtaOk,
}: {
  solution: CoreSolution;
  allSafetyOk: boolean;
  allKtaOk: boolean;
}) {
  const summary = solution.summary;
  return (
    <section className="metric-grid" aria-label="Najważniejsze wyniki">
      <MetricCard icon={<Flame size={19} />} label="T paliwa max" value={`${fmt(summary.maxFuelCenterC, 1)} °C`} detail={`z = ${fmt(summary.zMaxFuelM, 2)} m`} status={allSafetyOk ? "ok" : "bad"} />
      <MetricCard icon={<Thermometer size={19} />} label="T helu out" value={`${fmt(summary.heliumOutletC, 1)} °C`} detail={`in = ${fmt(summary.heliumInletC, 0)} °C`} />
      <MetricCard icon={<Gauge size={19} />} label="Δp całkowite" value={`${fmt(summary.totalPressureDropKPa, 1)} kPa`} detail={`p out = ${fmt(summary.outletPressureMPa, 3)} MPa`} />
      <MetricCard icon={<Activity size={19} />} label="P hydrauliczna" value={`${fmt(summary.hydraulicPowerMW, 3)} MW`} detail={`${fmt(summary.hydraulicPowerPercent, 3)}% mocy cieplnej`} />
      <MetricCard icon={<ShieldCheck size={19} />} label="Zakresy KTA" value={allKtaOk ? "OK" : "Poza"} detail={`Re ${compact(summary.reynoldsMin)}-${compact(summary.reynoldsMax)}`} status={allKtaOk ? "ok" : "bad"} />
    </section>
  );
}

function ChartsView({
  solution,
  limits,
  comparisonRows,
}: {
  solution: CoreSolution;
  limits: SafetyLimits;
  comparisonRows: Array<{
    label: string;
    maxFuelCenterC: number;
    heliumOutletC: number;
    totalPressureDropKPa: number;
    hydraulicPowerMW: number;
    hydraulicPowerPercent: number;
    nPebblesTotal: number;
    ok: boolean;
  }>;
}) {
  const rows = solution.rows;
  return (
    <div className="content-stack">
      <section className="chart-grid">
        <ChartPanel title="Profil temperatur">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 14, right: 20, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="z_mid_m" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(value) => fmt(Number(value), 1)} label={{ value: "z [m]", position: "insideBottomRight", offset: -2 }} />
              <YAxis tickFormatter={(value) => fmt(Number(value), 0)} label={{ value: "°C", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={(value) => `${fmt(Number(value), 2)} °C`} labelFormatter={(value) => `z = ${fmt(Number(value), 2)} m`} />
              <Legend />
              <ReferenceLine y={limits.maxFuelCenterC} stroke={chartColors.limit} strokeDasharray="5 5" label="limit paliwa" />
              <Line type="monotone" dataKey="t_he_mean_C" name="Hel średni" dot={false} stroke={chartColors.helium} strokeWidth={2} />
              <Line type="monotone" dataKey="t_pebble_surface_C" name="Pow. kuli" dot={false} stroke={chartColors.pebble} strokeWidth={2} />
              <Line type="monotone" dataKey="t_fuel_surface_C" name="Pow. paliwa" dot={false} stroke={chartColors.fuelSurface} strokeWidth={2} />
              <Line type="monotone" dataKey="t_fuel_center_C" name="Centrum paliwa" dot={false} stroke={chartColors.fuelCenter} strokeWidth={2.3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Spadek ciśnienia i moc hydrauliczna">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 14, right: 22, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="z_mid_m" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(value) => fmt(Number(value), 1)} />
              <YAxis yAxisId="left" tickFormatter={(value) => fmt(Number(value), 0)} label={{ value: "kPa", angle: -90, position: "insideLeft" }} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => fmt(Number(value), 2)} label={{ value: "MW", angle: 90, position: "insideRight" }} />
              <Tooltip formatter={(value, name) => `${fmt(Number(value), name === "P hyd skum." ? 3 : 2)}`} labelFormatter={(value) => `z = ${fmt(Number(value), 2)} m`} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="delta_p_cumulative_kPa" name="Δp skum." dot={false} stroke={chartColors.pressure} strokeWidth={2.2} />
              <Line yAxisId="right" type="monotone" dataKey="hydraulic_power_cumulative_MW" name="P hyd skum." dot={false} stroke={chartColors.hydraulic} strokeWidth={2.2} strokeDasharray="6 4" />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Wnikanie ciepła i Reynolds">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 14, right: 22, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="z_mid_m" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(value) => fmt(Number(value), 1)} />
              <YAxis yAxisId="left" tickFormatter={(value) => fmt(Number(value), 0)} label={{ value: "h", angle: -90, position: "insideLeft" }} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => compact(Number(value))} label={{ value: "Re", angle: 90, position: "insideRight" }} />
              <Tooltip formatter={(value) => fmt(Number(value), 2)} labelFormatter={(value) => `z = ${fmt(Number(value), 2)} m`} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="h_pebble_he_W_m2K" name="h [W/(m²K)]" dot={false} stroke={chartColors.h} strokeWidth={2.2} />
              <Line yAxisId="right" type="monotone" dataKey="reynolds" name="Re" dot={false} stroke={chartColors.reynolds} strokeWidth={2.2} strokeDasharray="6 4" />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Składowe oporu cieplnego">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 14, right: 20, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="z_mid_m" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(value) => fmt(Number(value), 1)} />
              <YAxis tickFormatter={(value) => fmt(Number(value), 0)} label={{ value: "K", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={(value) => `${fmt(Number(value), 2)} K`} labelFormatter={(value) => `z = ${fmt(Number(value), 2)} m`} />
              <Legend />
              <Line type="monotone" dataKey="delta_t_conv_K" name="Konwekcja" dot={false} stroke={chartColors.helium} strokeWidth={2} />
              <Line type="monotone" dataKey="delta_t_shell_K" name="Otoczka" dot={false} stroke={chartColors.fuelSurface} strokeWidth={2} />
              <Line type="monotone" dataKey="delta_t_core_K" name="Paliwo" dot={false} stroke={chartColors.fuelCenter} strokeWidth={2} />
              <Line type="monotone" dataKey="delta_t_total_K" name="Suma" dot={false} stroke={chartColors.total} strokeWidth={2.2} strokeDasharray="6 4" />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Straty ciepła do RCCS">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 14, right: 20, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="z_mid_m" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(value) => fmt(Number(value), 1)} />
              <YAxis tickFormatter={(value) => fmt(Number(value), 2)} label={{ value: "kW", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={(value) => `${fmt(Number(value), 4)} kW`} labelFormatter={(value) => `z = ${fmt(Number(value), 2)} m`} />
              <Legend />
              <Line type="monotone" dataKey="q_convection_kW" name="Konwekcja" dot={false} stroke={chartColors.convection} strokeWidth={2} />
              <Line type="monotone" dataKey="q_radiation_kW" name="Radiacja" dot={false} stroke={chartColors.radiation} strokeWidth={2} />
              <Line type="monotone" dataKey="q_loss_kW" name="Suma" dot={false} stroke={chartColors.total} strokeWidth={2.2} strokeDasharray="6 4" />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

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
                  <td>{compact(row.nPebblesTotal)}</td>
                  <td><StatusPill ok={row.ok} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function LimitsView({ checks }: { checks: SafetyCheck[] }) {
  return (
    <section className="table-panel">
      <div className="table-header">
        <h2>Ocena według limitów akceptacji</h2>
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
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className={active ? "tab-button active" : "tab-button"} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function fmt(value: number, digits = 2): string {
  return numberFormat.format(Number(value.toFixed(digits)));
}

function compact(value: number): string {
  return compactFormat.format(value);
}
