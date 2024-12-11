/*
  Warnings:

  - Added the required column `usuarioId` to the `Pais` table without a default value. This is not possible if the table is not empty.
  - Added the required column `viajeId` to the `Pais` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pais" ADD COLUMN     "usuarioId" INTEGER NOT NULL,
ADD COLUMN     "viajeId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Pais" ADD CONSTRAINT "Pais_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
