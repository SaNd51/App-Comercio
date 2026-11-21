ALTER TABLE "User" ADD COLUMN "telefone" TEXT;

ALTER TABLE "Category" ADD COLUMN "descricao" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Category" ADD COLUMN "icone" TEXT NOT NULL DEFAULT 'pricetag-outline';
ALTER TABLE "Category" ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Product" ADD COLUMN "unidade" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN "precoPromocional" INTEGER;
ALTER TABLE "Product" ADD COLUMN "promocaoAte" DATETIME;
ALTER TABLE "Product" ADD COLUMN "destaqueSemana" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "Address" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "apelido" TEXT NOT NULL,
  "cep" TEXT NOT NULL,
  "logradouro" TEXT NOT NULL,
  "numero" TEXT NOT NULL,
  "complemento" TEXT NOT NULL DEFAULT '',
  "bairro" TEXT NOT NULL,
  "cidade" TEXT NOT NULL,
  "uf" TEXT NOT NULL,
  "referencia" TEXT NOT NULL DEFAULT '',
  "principal" BOOLEAN NOT NULL DEFAULT false,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

CREATE TABLE "Favorite" (
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  PRIMARY KEY ("userId", "productId"),
  CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Favorite_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Favorite_productId_idx" ON "Favorite"("productId");

CREATE TABLE "Banner" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "titulo" TEXT NOT NULL,
  "subtitulo" TEXT NOT NULL DEFAULT '',
  "imagemUrl" TEXT,
  "cor" TEXT NOT NULL DEFAULT '#D21F32',
  "destino" TEXT NOT NULL DEFAULT 'promocoes',
  "ordem" INTEGER NOT NULL DEFAULT 0,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Loja" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'loja',
  "nome" TEXT NOT NULL DEFAULT 'Mercadinho Ximenes',
  "slogan" TEXT NOT NULL DEFAULT 'Preços baixos!',
  "telefone" TEXT NOT NULL DEFAULT '',
  "whatsapp" TEXT NOT NULL DEFAULT '',
  "email" TEXT NOT NULL DEFAULT '',
  "endereco" TEXT NOT NULL DEFAULT '',
  "horarios" TEXT NOT NULL DEFAULT '',
  "quemSomos" TEXT NOT NULL DEFAULT '',
  "termosPedido" TEXT NOT NULL DEFAULT '',
  "avisoLegal" TEXT NOT NULL DEFAULT '',
  "taxaEntrega" INTEGER NOT NULL DEFAULT 0,
  "freteGratisAcima" INTEGER NOT NULL DEFAULT 0,
  "pedidoMinimo" INTEGER NOT NULL DEFAULT 0
);
