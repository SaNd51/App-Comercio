import { prisma } from './prisma';
import { env } from './env';

export async function cancelarPedidosExpirados() {
  const limite = new Date(Date.now() - env.PEDIDO_EXPIRA_MINUTOS * 60 * 1000);
  const pedidos = await prisma.order.findMany({
    where: { status: 'aguardando_pagamento', criadoEm: { lt: limite } },
    include: { itens: true },
  });

  for (const pedido of pedidos) {
    await prisma.$transaction(async (tx) => {
      const atualizado = await tx.order.updateMany({
        where: { id: pedido.id, status: 'aguardando_pagamento' },
        data: { status: 'cancelado' },
      });
      if (atualizado.count === 0) return;
      for (const item of pedido.itens) {
        await tx.product.update({ where: { id: item.productId }, data: { estoque: { increment: item.quantidade } } });
      }
    });
  }
  return pedidos.length;
}

export function iniciarJobExpiracao() {
  setInterval(() => {
    cancelarPedidosExpirados().catch((erro) => console.error('Falha ao expirar pedidos:', erro));
  }, 60 * 1000);
}
