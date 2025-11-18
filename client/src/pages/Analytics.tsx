import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Input } from "@/components/ui/input";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];

export default function Analytics() {
  const [filters, setFilters] = useState({
    type: "expense" as "income" | "expense",
    startDate: "",
    endDate: "",
  });

  const dateRange = useMemo(() => {
    const result: { startDate?: Date; endDate?: Date } = {};
    if (filters.startDate) result.startDate = new Date(filters.startDate);
    if (filters.endDate) result.endDate = new Date(filters.endDate);
    return result;
  }, [filters.startDate, filters.endDate]);

  const { data: categoryStats, isLoading: statsLoading } = trpc.stats.byCategory.useQuery({
    type: filters.type,
    ...dateRange,
  });

  const { data: summary } = trpc.stats.summary.useQuery(dateRange);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const chartData = useMemo(() => {
    if (!categoryStats) return [];
    return categoryStats.map((stat) => ({
      name: stat.categoryName,
      value: stat.total,
      count: stat.count,
    }));
  }, [categoryStats]);

  const totalAmount = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  const pieData = useMemo(() => {
    return chartData.map((item) => ({
      ...item,
      percentage: totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(1) : "0",
    }));
  }, [chartData, totalAmount]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Gráficos e Informes</h1>
        <p className="text-muted-foreground mt-1">Visualiza tus datos financieros</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={filters.type}
                onValueChange={(value: "income" | "expense") =>
                  setFilters({ ...filters, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ingresos</SelectItem>
                  <SelectItem value="expense">Gastos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {statsLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-48"></div>
              </CardHeader>
              <CardContent>
                <div className="h-80 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : chartData.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {filters.type === "income" ? "Ingresos" : "Gastos"} por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: "#000" }}
                    />
                    <Legend />
                    <Bar
                      dataKey="value"
                      fill={filters.type === "income" ? "#10b981" : "#ef4444"}
                      name="Importe"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución Porcentual</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de Categorías</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.count} transacciones</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{formatCurrency(item.value)}</p>
                      <p className="text-sm text-muted-foreground">
                        {totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(1) : "0"}% del total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {summary && (
            <Card>
              <CardHeader>
                <CardTitle>Resumen General</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Ingresos</p>
                    <p className="text-2xl font-semibold text-emerald-600">
                      {formatCurrency(summary.totalIncome)}
                    </p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Gastos</p>
                    <p className="text-2xl font-semibold text-rose-600">
                      {formatCurrency(summary.totalExpense)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${summary.balance >= 0 ? "bg-emerald-50" : "bg-rose-50"}`}>
                    <p className="text-sm text-muted-foreground mb-1">Balance</p>
                    <p className={`text-2xl font-semibold ${summary.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {formatCurrency(summary.balance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No hay datos disponibles para el período seleccionado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
