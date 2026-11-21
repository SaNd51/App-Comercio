ALTER TABLE "Order" ADD COLUMN "tipoEntrega" TEXT NOT NULL DEFAULT 'retirada';
ALTER TABLE "Order" ADD COLUMN "subtotal" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "taxaEntrega" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "enderecoEntrega" TEXT;
ALTER TABLE "Order" ADD COLUMN "statusEntrega" TEXT;
ALTER TABLE "Order" ADD COLUMN "previsaoEntrega" DATETIME;
ALTER TABLE "Order" ADD COLUMN "entregadorNome" TEXT;
ALTER TABLE "Order" ADD COLUMN "entregadorTelefone" TEXT;

CREATE TABLE "OrderEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "observacao" TEXT NOT NULL DEFAULT '',
  "criadoPor" TEXT NOT NULL,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "OrderEvent_orderId_criadoEm_idx" ON "OrderEvent"("orderId", "criadoEm");
