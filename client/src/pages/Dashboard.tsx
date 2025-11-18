import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, WalletIcon } from "lucide-react";
import { useMemo, useState } from "react";

export default function Dashboard() {
  const [dateRange] = useState<{ startDate?: Date; endDate?: Date }>({});
  
  const { data: summary, isLoading: summaryLoading } = trpc.stats.summary.useQuery(dateRange);
  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const stats = useMemo(() => {
    if (!summary) return null;
    
    return [
      {
        title: "Total Ingresos",
        value: formatCurrency(summary.totalIncome),
        icon: ArrowUpIcon,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
      },
      {
        title: "Total Gastos",
        value: formatCurrency(summary.totalExpense),
        icon: ArrowDownIcon,
        color: "text-rose-600",
        bgColor: "bg-rose-50",
      },
      {
        title: "Balance Neto",
        value: formatCurrency(summary.balance),
        icon: WalletIcon,
        color: summary.balance >= 0 ? "text-emerald-600" : "text-rose-600",
        bgColor: summary.balance >= 0 ? "bg-emerald-50" : "bg-rose-50",
      },
    ];
  }, [summary]);

  if (summaryLoading || categoriesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Resumen de tus finanzas personales</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Resumen de tus finanzas personales</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats?.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-semibold">{stat.value}</div>
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {categories && categories.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No tienes categorías configuradas aún. Crea categorías para empezar a registrar transacciones.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
