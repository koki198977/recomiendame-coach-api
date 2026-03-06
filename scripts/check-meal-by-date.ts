import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMealsByDate() {
  try {
    const userId = process.argv[2];
    const dateString = process.argv[3]; // Formato: YYYY-MM-DD

    if (!userId) {
      console.error('❌ Debes proporcionar un userId');
      console.log('Uso: npx ts-node scripts/check-meal-by-date.ts <userId> [date]');
      process.exit(1);
    }

    console.log(`\n🔍 Verificando comidas para usuario: ${userId}`);
    
    if (dateString) {
      console.log(`📅 Fecha específica: ${dateString}\n`);
      
      // Buscar comidas de una fecha específica
      const startOfDay = new Date(dateString);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(dateString);
      endOfDay.setHours(23, 59, 59, 999);
      
      const meals = await prisma.mealLog.findMany({
        where: {
          userId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });
      
      console.log(`📊 Comidas encontradas: ${meals.length}\n`);
      
      if (meals.length === 0) {
        console.log('❌ No se encontraron comidas para esta fecha');
      } else {
        meals.forEach((meal, index) => {
          console.log(`${index + 1}. ${meal.title} (${meal.slot})`);
          console.log(`   ID: ${meal.id}`);
          console.log(`   Fecha guardada: ${meal.date.toISOString()}`);
          console.log(`   Fecha local (Chile): ${meal.date.toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`);
          console.log(`   Calorías: ${meal.kcal} kcal`);
          console.log(`   Macros: P:${meal.protein_g}g | C:${meal.carbs_g}g | F:${meal.fat_g}g`);
          console.log('');
        });
        
        // Totales del día
        const totals = meals.reduce(
          (acc, meal) => ({
            kcal: acc.kcal + meal.kcal,
            protein_g: acc.protein_g + meal.protein_g,
            carbs_g: acc.carbs_g + meal.carbs_g,
            fat_g: acc.fat_g + meal.fat_g,
          }),
          { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
        );
        
        console.log('📊 TOTALES DEL DÍA:');
        console.log(`   Calorías: ${totals.kcal} kcal`);
        console.log(`   Proteína: ${totals.protein_g}g`);
        console.log(`   Carbohidratos: ${totals.carbs_g}g`);
        console.log(`   Grasas: ${totals.fat_g}g`);
      }
    } else {
      // Mostrar todas las comidas del usuario (últimos 30 días)
      console.log('📅 Mostrando comidas de los últimos 30 días\n');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const meals = await prisma.mealLog.findMany({
        where: {
          userId,
          date: {
            gte: thirtyDaysAgo,
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
      
      console.log(`📊 Total de comidas: ${meals.length}\n`);
      
      if (meals.length === 0) {
        console.log('❌ No se encontraron comidas en los últimos 30 días');
      } else {
        // Agrupar por fecha
        const mealsByDate = meals.reduce((acc, meal) => {
          const dateKey = meal.date.toISOString().split('T')[0];
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(meal);
          return acc;
        }, {} as Record<string, typeof meals>);
        
        Object.entries(mealsByDate).forEach(([date, dayMeals]) => {
          console.log(`📅 ${date} (${dayMeals.length} comidas)`);
          
          dayMeals.forEach((meal) => {
            console.log(`   • ${meal.slot}: ${meal.title} - ${meal.kcal} kcal`);
          });
          
          const dayTotals = dayMeals.reduce(
            (acc, meal) => ({
              kcal: acc.kcal + meal.kcal,
              protein_g: acc.protein_g + meal.protein_g,
              carbs_g: acc.carbs_g + meal.carbs_g,
              fat_g: acc.fat_g + meal.fat_g,
            }),
            { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
          );
          
          console.log(`   📊 Total: ${dayTotals.kcal} kcal | P:${dayTotals.protein_g}g C:${dayTotals.carbs_g}g F:${dayTotals.fat_g}g`);
          console.log('');
        });
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMealsByDate();
