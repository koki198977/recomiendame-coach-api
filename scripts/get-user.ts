import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (user) {
    console.log('\n✅ Usuario encontrado:');
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log('\nUsa este ID en tu curl.');
  } else {
    console.log('\n❌ No hay usuarios en la base de datos.');
    console.log('Debes registrar uno primero o crear uno manualmente.');
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
