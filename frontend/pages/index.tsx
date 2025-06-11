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

export default function Home() {
  const [forecastData, setForecastData] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mockData = [
    { food: 300, rent: 700, energy: 150, transport: 100, debt: 200, income: 3000 },
    { food: 310, rent: 710, energy: 160, transport: 110, debt: 190, income: 3050 },
    { food: 320, rent: 720, energy: 170, transport: 120, debt: 180, income: 3100 },
    { food: 330, rent: 730, energy: 180, transport: 130, debt: 170, income: 3150 },
    { food: 340, rent: 740, energy: 190, transport: 140, debt: 160, income: 3200 },
    { food: 350, rent: 750, energy: 200, transport: 150, debt: 150, income: 3250 },
  ];

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_ML_API + "/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshots: mockData }),
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
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem", fontFamily: "Arial" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
          SPI Dashboard 2.0
        </h1>
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