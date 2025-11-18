import { drizzle } from "drizzle-orm/mysql2";
import { categories } from "./drizzle/schema.ts";

const DEFAULT_CATEGORIES = [
  // Gastos
  { name: "Alimentación", type: "expense", color: "#10b981", isDefault: true },
  { name: "Transporte", type: "expense", color: "#3b82f6", isDefault: true },
  { name: "Vivienda", type: "expense", color: "#f59e0b", isDefault: true },
  { name: "Entretenimiento", type: "expense", color: "#8b5cf6", isDefault: true },
  { name: "Salud", type: "expense", color: "#ef4444", isDefault: true },
  { name: "Educación", type: "expense", color: "#06b6d4", isDefault: true },
  { name: "Compras", type: "expense", color: "#ec4899", isDefault: true },
  // Ingresos
  { name: "Salario", type: "income", color: "#10b981", isDefault: true },
  { name: "Freelance", type: "income", color: "#3b82f6", isDefault: true },
  { name: "Inversiones", type: "income", color: "#f59e0b", isDefault: true },
  { name: "Otros Ingresos", type: "income", color: "#8b5cf6", isDefault: true },
];

async function seedCategories(userId) {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL no está configurada");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log(`Creando categorías predeterminadas para usuario ${userId}...`);

  for (const category of DEFAULT_CATEGORIES) {
    await db.insert(categories).values({
      userId,
      ...category,
    });
    console.log(`✓ Categoría creada: ${category.name} (${category.type})`);
  }

  console.log("\n✅ Categorías predeterminadas creadas exitosamente");
  process.exit(0);
}

const userId = parseInt(process.argv[2]);
if (!userId || isNaN(userId)) {
  console.error("Uso: node seed-categories.mjs <userId>");
  process.exit(1);
}

seedCategories(userId);
