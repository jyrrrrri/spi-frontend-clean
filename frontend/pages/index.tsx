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

const countryPresets: { [key: string]: any } = {
  Finland: { food: 320, rent: 850, energy: 160, transport: 140, debt: 200, income: 3400 },
  Germany: { food: 310, rent: 750, energy: 150, transport: 130, debt: 180, income: 3300 },
  USA: { food: 360, rent: 950, energy: 200, transport: 170, debt: 250, income: 5000 },
  Romania: { food: 260, rent: 450, energy: 120, transport: 100, debt: 90, income: 2000 }
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
        borderColor: "blue",
        tension: 0.3,
      },
      forecastData && {
        label: "Forecast SPI",
        data: forecastData,
        borderColor: "purple",
        borderDash: [5, 5],
        tension: 0.3,
      },
    ].filter(Boolean),
  };

  return (
    <>
      <Head>
        <title>SPI Dashboard 2.0</title>
      </Head>
      <main style={{ maxWidth: "850px", margin: "0 auto", padding: "2rem", fontFamily: "Arial" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
          SPI Dashboard 2.0
        </h1>
        <p style={{ marginBottom: "1rem" }}>
          The Societal Pressure Index (SPI) estimates pressure on individuals based on living costs, debt, and income.
          This dashboard visualizes current vs predicted SPI using machine learning.
        </p>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            {Object.keys(countryPresets).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {forecastData && (
          <p style={{ margin: "1rem 0", fontWeight: 500 }}>
            Forecasting SPI for <strong>{country}</strong> in <strong>{year}</strong>...
          </p>
        )}

        <Line data={chartData} />

        <div style={{ marginTop: "2rem" }}>
          <button
            onClick={fetchForecast}
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4F46E5",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {loading ? "Forecasting..." : "ML Forecast"}
          </button>
          {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
        </div>
      </main>
    </>
  );
}
