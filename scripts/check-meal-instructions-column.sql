-- Verificar si la columna instructions existe en la tabla Meal
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Meal' AND column_name = 'instructions';

-- Si no retorna nada, la columna no existe
-- Si retorna una fila, la columna existe
