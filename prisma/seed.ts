import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Allergies
  const allergies = [
    'Peanuts','Tree nuts','Milk','Eggs','Wheat','Soy','Fish','Shellfish',
    'Sesame','Gluten','Mustard','Lupin'
  ];
  await prisma.allergy.createMany({
    data: allergies.map((name) => ({ name })),
    skipDuplicates: true,
  });

  // Conditions
  const conditions = [
    { code: 'T2D', label: 'Diabetes tipo 2' },
    { code: 'HTN', label: 'Hipertensión' },
    { code: 'CKD', label: 'Enfermedad renal crónica' },
    { code: 'CEL', label: 'Celiaquía' },
    { code: 'LIP', label: 'Dislipidemia' },
  ];
  await prisma.healthCondition.createMany({
    data: conditions,
    skipDuplicates: true,
  });

  // Cuisines
  const cuisines = [
    'Mediterránea','Italiana','Mexicana','India','China','Japonesa',
    'Tailandesa','Chilena','Peruana','Vegetariana','Vegana'
  ];
  await prisma.cuisine.createMany({
    data: cuisines.map((name) => ({ name })),
    skipDuplicates: true,
  });

  console.log('✅ Seed de catálogos listo');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
