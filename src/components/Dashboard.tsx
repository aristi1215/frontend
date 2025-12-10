import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Transaction {
  transaction_id: string;
  date: string;
  merchant_name?: string;
  name: string;
  amount: number;
  logo_url?: string;
  personal_finance_category?: {
    primary?: string;
  };
}

interface ChartData {
  name: string;
  value: number;
}

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("")

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const email = localStorage.getItem("userEmail");
        setUserEmail(email||"")
        const accessToken = localStorage.getItem("access_token");

        if (!email || !accessToken) {
          throw new Error("No email or access token found in localStorage");
        }

        // Call Lambda to save transactions in S3
        setSaving(true);
        await axios.post(
          "https://mr7vttk4oqw3ia6eia7a4xwgym0hciav.lambda-url.us-east-1.on.aws/",
          { email, access_token: accessToken }
        );
        setSaving(false);

        // Fetch transactions JSON from S3
        const s3Key = `${email}-transactions.json`;
        const s3Url = `https://user-transactiones-9122025.s3.us-east-1.amazonaws.com/${s3Key}`;

        const response = await axios.get<Transaction[]>(s3Url);
        setTransactions(response.data);
      } catch (err: any) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    if (!categoryFilter) return true;
    return t.personal_finance_category?.primary === categoryFilter;
  });

  const chartData: ChartData[] = filteredTransactions.reduce<ChartData[]>((acc, t) => {
    const category = t.personal_finance_category?.primary || "Other";
    const existing = acc.find((c) => c.name === category);
    if (existing) {
      existing.value += t.amount;
    } else {
      acc.push({ name: category, value: t.amount });
    }
    return acc;
  }, []);

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#6B7280",
  ];

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        {saving ? "Saving data..." : "Loading transactions..."}
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Welcome {userEmail}</h1>

      {/* Filter */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:gap-4">
        <label className="text-gray-700 font-medium mb-2 sm:mb-0">
          Filter by Category:
        </label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All</option>
          {[...new Set(transactions.map((t) => t.personal_finance_category?.primary).filter(Boolean))].map(
            (cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            )
          )}
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Transactions Table */}
        <div className="flex-1 bg-white rounded-lg shadow p-4 overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Transactions</h2>
          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-gray-600">Date</th>
                <th className="px-4 py-2 text-left text-gray-600">Merchant</th>
                <th className="px-4 py-2 text-left text-gray-600">Category</th>
                <th className="px-4 py-2 text-left text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <tr
                  key={t.transaction_id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-2">{t.date}</td>
                  <td className="px-4 py-2 flex items-center gap-2">
                    {t.logo_url && (
                      <img
                        src={t.logo_url}
                        alt={t.merchant_name || t.name}
                        className="w-6 h-6 object-contain rounded"
                      />
                    )}
                    {t.merchant_name || t.name}
                  </td>
                  <td className="px-4 py-2">{t.personal_finance_category?.primary || "Other"}</td>
                  <td className="px-4 py-2 font-medium text-gray-700">
                    ${t.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Chart */}
        <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Spending by Category</h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={150} fill="#8884d8" label>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `$${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: "#F9FAFB", borderRadius: "8px" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
