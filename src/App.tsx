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
  XCircle,
} from "lucide-react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
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

type View = "charts" | "limits" | "kta" | "cases";

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
            <TabButton active={activeView === "limits"} onClick={() => setActiveView("limits")}>Limity</TabButton>
            <TabButton active={activeView === "kta"} onClick={() => setActiveView("kta")}>KTA</TabButton>
            <TabButton active={activeView === "cases"} onClick={() => setActiveView("cases")}>Warianty</TabButton>
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
                <ChartsView solution={solution} />
              )}
              {activeView === "limits" && (
                <LimitsView checks={safetyChecks} />
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
}: {
  solution: CoreSolution;
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
          yLabel="Lokalne straty ciepła [kW]"
          series={[
            { label: "Konwekcja", values: rows.map((row) => row.q_convection_kW), color: chartColors.convection, unit: "kW", digits: 4 },
            { label: "Radiacja", values: rows.map((row) => row.q_radiation_kW), color: chartColors.radiation, unit: "kW", digits: 4 },
            { label: "Suma strat", values: rows.map((row) => row.q_loss_kW), color: chartColors.total, unit: "kW", dash: [7, 5], digits: 4 },
          ]}
        />
      </ChartPanel>
    </section>
  );
}

function CasesView({
  comparisonRows,
}: {
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

function UPlotChart({
  xValues,
  xLabel,
  yLabel,
  y2Label,
  series,
}: {
  xValues: number[];
  xLabel: string;
  yLabel: string;
  y2Label?: string;
  series: PlotSeries[];
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
  }, [series, xLabel, xValues, y2Label, yLabel]);

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
      </div>
      <div className="uplot-host" ref={hostRef} />
      <div className="plot-tooltip" ref={tooltipRef} hidden />
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

function compact(value: number): string {
  return compactFormat.format(value);
}
