-- Migración para Chapi 2.0 - Asistente Inteligente
-- Agregar nueva tabla para mensajes de conversación

-- 1. Agregar campo chapiV2Context al modelo User
ALTER TABLE "User" ADD COLUMN "chapiV2Context" JSONB;

-- 2. Crear tabla ConversationMessage
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageType" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- 3. Crear índices para optimizar consultas
CREATE INDEX "ConversationMessage_userId_timestamp_idx" ON "ConversationMessage"("userId", "timestamp");
CREATE INDEX "ConversationMessage_userId_messageType_idx" ON "ConversationMessage"("userId", "messageType");

-- 4. Agregar foreign key constraint
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comentarios sobre la migración:
-- - chapiV2Context almacenará el contexto conversacional completo del usuario
-- - ConversationMessage almacenará todos los mensajes de la conversación
-- - Los índices optimizan las consultas por usuario y tipo de mensaje
-- - La relación con User tiene CASCADE para eliminar mensajes si se elimina el usuario