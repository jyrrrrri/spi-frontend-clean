import Head from "next/head";
import { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const countryPresets = {
  Finland: { food: 320, rent: 850, energy: 160, transport: 140, debt: 200, income: 3400 },
  Germany: { food: 310, rent: 750, energy: 150, transport: 130, debt: 180, income: 3300 },
  USA: { food: 360, rent: 950, energy: 200, transport: 170, debt: 250, income: 5000 },
  Romania: { food: 260, rent: 450, energy: 120, transport: 100, debt: 90, income: 2000 },
  UK: { food: 330, rent: 800, energy: 170, transport: 150, debt: 220, income: 3600 },
  France: { food: 320, rent: 780, energy: 160, transport: 140, debt: 210, income: 3400 },
  Spain: { food: 290, rent: 650, energy: 140, transport: 110, debt: 130, income: 2800 },
  Italy: { food: 300, rent: 670, energy: 150, transport: 120, debt: 140, income: 2900 },
  Canada: { food: 350, rent: 820, energy: 165, transport: 160, debt: 230, income: 3700 },
  Australia: { food: 340, rent: 870, energy: 175, transport: 165, debt: 240, income: 3800 },
  Japan: { food: 310, rent: 720, energy: 160, transport: 130, debt: 180, income: 3400 },
  Brazil: { food: 220, rent: 500, energy: 110, transport: 100, debt: 80, income: 1600 },
  India: { food: 180, rent: 300, energy: 100, transport: 80, debt: 60, income: 1200 },
  China: { food: 250, rent: 600, energy: 130, transport: 110, debt: 100, income: 2500 }
};

const yearOptions = [2020, 2021, 2022, 2023, 2024, 2025];

export default function Home() {
  const [country, setCountry] = useState("Finland");
  const [year, setYear] = useState(2025);
  const [forecastData, setForecastData] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSnapshots = () => {
    const base = countryPresets[country];
    return Array.from({ length: 6 }).map((_, i) => ({
      food: base.food + i * 10,
      rent: base.rent + i * 10,
      energy: base.energy + i * 5,
      transport: base.transport + i * 5,
      debt: base.debt - i * 10,
      income: base.income + i * 50
    }));
  };

  const fetchForecast = async () => {
    if (year !== 2025) return;
    setLoading(true);
    setError(null);
    setForecastData(null);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_ML_API + "/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshots: generateSnapshots() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Unknown error");
      setForecastData(data.predicted_spi);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const labels = ["1", "2", "3", "4", "5", "6"];
  const forecastLabels = ["7", "8", "9", "10", "11", "12"];
  const chartData = {
    labels: [...labels, ...(forecastData ? forecastLabels : [])],
    datasets: [
      {
        label: "Actual SPI",
        data: [45, 46, 47, 48, 49, 50],
        borderColor: "#2563EB",
        backgroundColor: "rgba(37, 99, 235, 0.2)",
        tension: 0.3,
        fill: true,
        pointRadius: 3
      },
      year === 2025 && forecastData && {
        label: "Forecast SPI (ML)",
        data: forecastData,
        borderColor: "#A855F7",
        backgroundColor: "rgba(168, 85, 247, 0.2)",
        borderDash: [6, 6],
        tension: 0.3,
        fill: true,
        pointRadius: 3
      },
    ].filter(Boolean),
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: {
        display: true,
        text: "Societal Pressure Index Over Time"
      }
    },
    scales: {
      x: {
        title: { display: true, text: "Time Step (Month)" }
      },
      y: {
        title: { display: true, text: "SPI Score" },
        suggestedMin: 0,
        suggestedMax: 100
      }
    }
  };

  return (
    <>
      <Head>
        <title>SPI Dashboard 2.0</title>
      </Head>
      <main style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "2rem",
        fontFamily: "'Segoe UI', sans-serif",
        color: "#1F2937"
      }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>SPI Dashboard 2.0</h1>
        <p style={{ marginBottom: "1rem", lineHeight: "1.6" }}>
          The Societal Pressure Index (SPI) is a metric designed to quantify stress or pressure on individuals caused by the cost
          of essential living factors like food, rent, energy, transportation, debt, and income. Lower SPI values represent
          more favorable socio-economic conditions. This dashboard displays real SPI trends and forecasts SPI scores using
          machine learning (only for 2025).
        </p>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
          <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ padding: "0.5rem" }}>
            {Object.keys(countryPresets).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ padding: "0.5rem" }}>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {year === 2025 && forecastData && (
          <p>Forecasting SPI for <strong>{country}</strong> in <strong>{year}</strong></p>
        )}
        <Line data={chartData} options={chartOptions} />
        <div style={{ marginTop: "2rem" }}>
          <button
            onClick={fetchForecast}
            disabled={loading || year !== 2025}
            style={{
              padding: "12px 24px",
              backgroundColor: year === 2025 ? "#4F46E5" : "#A1A1AA",
              color: "white",
              fontSize: "1rem",
              fontWeight: 500,
              border: "none",
              borderRadius: "8px",
              cursor: year === 2025 ? "pointer" : "not-allowed"
            }}
          >
            {loading ? "Forecasting..." : "Run ML Forecast (2025 only)"}
          </button>
          {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
        </div>
      </main>
    </>
  );
}
