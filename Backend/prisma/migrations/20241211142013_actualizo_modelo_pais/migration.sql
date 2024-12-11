/*
  Warnings:

  - You are about to drop the column `usuarioId` on the `Pais` table. All the data in the column will be lost.
  - You are about to drop the column `viajeId` on the `Pais` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Pais" DROP CONSTRAINT "Pais_usuarioId_fkey";

-- AlterTable
ALTER TABLE "Pais" DROP COLUMN "usuarioId",
DROP COLUMN "viajeId";
