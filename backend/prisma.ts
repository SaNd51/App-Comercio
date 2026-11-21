// Instância única do Prisma Client (evita abrir várias conexões).
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
