import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const CURRENCIES = [
  { code: "EUR", name: "Euro (€)" },
  { code: "USD", name: "Dólar estadounidense ($)" },
  { code: "GBP", name: "Libra esterlina (£)" },
  { code: "JPY", name: "Yen japonés (¥)" },
  { code: "CHF", name: "Franco suizo (CHF)" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2024)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2024)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2024-12-31)" },
];

export default function Settings() {
  const [formData, setFormData] = useState({
    currency: "EUR",
    dateFormat: "DD/MM/YYYY",
  });

  const { data: preferences, isLoading } = trpc.preferences.get.useQuery();
  const utils = trpc.useUtils();

  const updateMutation = trpc.preferences.update.useMutation({
    onSuccess: () => {
      utils.preferences.get.invalidate();
      toast.success("Preferencias actualizadas exitosamente");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        currency: preferences.currency,
        dateFormat: preferences.dateFormat,
      });
    }
  }, [preferences]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const hasChanges = preferences && (
    formData.currency !== preferences.currency ||
    formData.dateFormat !== preferences.dateFormat
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">Personaliza tu experiencia</p>
      </div>

      {isLoading ? (
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-48"></div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Preferencias Generales</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Selecciona la moneda que se utilizará para mostrar los importes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFormat">Formato de Fecha</Label>
                <Select
                  value={formData.dateFormat}
                  onValueChange={(value) => setFormData({ ...formData, dateFormat: value })}
                >
                  <SelectTrigger id="dateFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FORMATS.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Selecciona cómo se mostrarán las fechas en la aplicación
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={!hasChanges || updateMutation.isPending}
                >
                  Guardar Cambios
                </Button>
                {hasChanges && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (preferences) {
                        setFormData({
                          currency: preferences.currency,
                          dateFormat: preferences.dateFormat,
                        });
                      }
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Acerca de esta aplicación</h3>
            <p className="text-sm text-muted-foreground">
              Gestor de Finanzas Personales te ayuda a controlar tus ingresos y gastos de manera
              sencilla y eficiente. Registra tus transacciones, organízalas por categorías y
              visualiza tus datos financieros con gráficos interactivos.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Características principales</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Dashboard con resumen financiero en tiempo real</li>
              <li>Registro y gestión de transacciones</li>
              <li>Categorías personalizables</li>
              <li>Gráficos interactivos y análisis de datos</li>
              <li>Filtros por fecha, categoría y tipo</li>
              <li>Interfaz responsive y moderna</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
