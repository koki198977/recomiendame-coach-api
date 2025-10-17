import { Injectable } from '@nestjs/common';

type Activity = 'SEDENTARY'|'LIGHT'|'MODERATE'|'ACTIVE'|'VERY_ACTIVE'|undefined;
type Sex = 'MALE'|'FEMALE'|'OTHER'|'UNSPECIFIED'|undefined;

export interface ProfileBasics {
  sex?: Sex;
  birthDate?: Date | string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  activityLevel?: Activity;
}

export interface GoalBasics {
  goalType?: 'LOSS'|'GAIN'|'MAINTAIN'|null;
}

@Injectable()
export class MacrosService {
  private activityFactor(a?: Activity) {
    switch (a) {
      case 'SEDENTARY': return 1.2;
      case 'LIGHT': return 1.375;
      case 'MODERATE': return 1.55;
      case 'ACTIVE': return 1.725;
      case 'VERY_ACTIVE': return 1.9;
      default: return 1.4;
    }
  }

  private ageFrom(b?: Date | string | null) {
    if (!b) return 30;
    const d = new Date(b);
    const diff = Date.now() - d.getTime();
    return Math.max(18, Math.floor(diff / (365.25*24*3600*1000)));
    }

  compute(profile: ProfileBasics, goal?: GoalBasics) {
    const sex = profile.sex ?? 'OTHER';
    const age = this.ageFrom(profile.birthDate);
    const h = profile.heightCm ?? 170;
    const w = profile.weightKg ?? 70;

    // Mifflin–St Jeor
    const sexAdj = sex === 'MALE' ? 5 : sex === 'FEMALE' ? -161 : -78;
    const bmr = 10*w + 6.25*h - 5*age + sexAdj;
    const tdee = Math.round(bmr * this.activityFactor(profile.activityLevel));

    let kcalTarget = tdee;
    if (goal?.goalType === 'LOSS') kcalTarget = tdee - 300;
    if (goal?.goalType === 'GAIN') kcalTarget = tdee + 250;

    // 1.8 g/kg proteína, 25% grasas, resto carbohidratos
    const protein_g = Math.round(1.8 * w);
    const fat_kcal = Math.round(kcalTarget * 0.25);
    const fat_g = Math.round(fat_kcal / 9);
    const protein_kcal = protein_g * 4;
    const carbs_kcal = Math.max(0, kcalTarget - fat_kcal - protein_kcal);
    const carbs_g = Math.round(carbs_kcal / 4);

    return {
      source: {
        profile: true,
        goal: goal?.goalType ?? null,
        formula: 'mifflin-st-jeor',
        tdee,
        deficit_or_surplus: kcalTarget - tdee,
      },
      macros: { kcalTarget, protein_g, carbs_g, fat_g },
    };
  }
}
