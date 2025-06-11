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
  Netherlands: { food: 310, rent: 790, energy: 155, transport: 145, debt: 210, income: 3500 },
  Japan: { food: 300, rent: 720, energy: 160, transport: 130, debt: 180, income: 3400 },
  Sweden: { food: 310, rent: 780, energy: 150, transport: 140, debt: 170, income: 3450 },
  Canada: { food: 340, rent: 820, energy: 165, transport: 160, debt: 230, income: 3700 },
  Spain: { food: 280, rent: 640, energy: 130, transport: 110, debt: 130, income: 2700 }
};

const yearOptions = [2020, 2021, 2022, 2023, 2024, 2025];

export default function Home() {
  const [country, setCountry] = useState("Finland");
  const [year, setYear] = useState(2024);
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
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.3,
        fill: true,
      },
      forecastData && {
        label: "Forecast SPI",
        data: forecastData,
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139, 92, 246, 0.2)",
        borderDash: [6, 6],
        tension: 0.3,
        fill: true,
      },
    ].filter(Boolean),
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Societal Pressure Index Over Time" },
      tooltip: {
        callbacks: {
          label: (context: any) => `SPI: ${context.parsed.y}`
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: "Month / Model Step" }
      },
      y: {
        title: { display: true, text: "SPI Score (0–100)" },
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
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem", fontFamily: "'Segoe UI', sans-serif" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem", color: "#111827" }}>
          SPI Dashboard 2.0
        </h1>
        <p style={{ marginBottom: "1.25rem", fontSize: "1rem", color: "#374151" }}>
          The <strong>Societal Pressure Index (SPI)</strong> estimates individual pressure based on essential living costs, debt, and income. Lower SPI = more affordability, higher SPI = more stress.
        </p>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
          <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ padding: "0.5rem", borderRadius: "8px" }}>
            {Object.keys(countryPresets).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ padding: "0.5rem", borderRadius: "8px" }}>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {forecastData && (
          <p style={{ marginBottom: "1.25rem", fontWeight: 500 }}>
            Forecasting SPI for <strong>{country}</strong> in <strong>{year}</strong>...
          </p>
        )}

        <div style={{ background: "#fff", padding: "1rem", borderRadius: "1rem", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
          <Line data={chartData} options={chartOptions} />
        </div>

        <div style={{ marginTop: "2rem" }}>
          <button
            onClick={fetchForecast}
            disabled={loading}
            style={{
              padding: "12px 24px",
              backgroundColor: "#4F46E5",
              color: "white",
              fontSize: "1rem",
              fontWeight: 500,
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
          >
            {loading ? "Forecasting..." : "Run ML Forecast"}
          </button>
          {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
        </div>
      </main>
    </>
  );
}
