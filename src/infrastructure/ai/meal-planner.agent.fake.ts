// import { Injectable } from '@nestjs/common';
// import { MealPlannerAgentPort } from '../../core/application/plans/ports/out.meal-planner-agent.port';
// import { PlanDay } from '../../core/domain/plans/entities';

// @Injectable()
// export class FakeMealPlannerAgent implements MealPlannerAgentPort {
//   async draftWeekPlan({
//     weekStart,
//     macros,
//   }): Promise<{ days: PlanDay[]; notes?: string }> {
//     const days: PlanDay[] = Array.from({ length: 7 }).map((_, i) => ({
//       dayIndex: i + 1,
//       meals: [
//         {
//           slot: 'BREAKFAST',
//           title: 'Avena con fruta',
//           kcal: Math.round(macros.kcalTarget * 0.25),
//           protein_g: 25,
//           carbs_g: 60,
//           fat_g: 10,
//           tags: ['quick'],
//         },
//         {
//           slot: 'LUNCH',
//           title: 'Pollo + quinoa + ensalada',
//           kcal: Math.round(macros.kcalTarget * 0.35),
//           protein_g: 40,
//           carbs_g: 60,
//           fat_g: 15,
//         },
//         {
//           slot: 'DINNER',
//           title: 'Omelette + verduras',
//           kcal: Math.round(macros.kcalTarget * 0.3),
//           protein_g: 35,
//           carbs_g: 20,
//           fat_g: 20,
//         },
//       ],
//     }));
//     return {
//       days,
//       notes: 'Generado con agente fake. Ajusta con preferencias reales.',
//     };
//   }
// }
