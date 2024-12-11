/*
  Warnings:

  - You are about to drop the column `paises_visitados` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_fin` on the `Viaje` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_inicio` on the `Viaje` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `Viaje` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nombre]` on the table `Pais` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fechaFin` to the `Viaje` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fechaInicio` to the `Viaje` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombreUsuario` to the `Viaje` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Viaje" DROP CONSTRAINT "Viaje_usuarioId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "paises_visitados",
ADD COLUMN     "paisesVisitados" TEXT[];

-- AlterTable
ALTER TABLE "Viaje" DROP COLUMN "fecha_fin",
DROP COLUMN "fecha_inicio",
DROP COLUMN "usuarioId",
ADD COLUMN     "fechaFin" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fechaInicio" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "nombreUsuario" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Pais_nombre_key" ON "Pais"("nombre");

-- AddForeignKey
ALTER TABLE "Viaje" ADD CONSTRAINT "Viaje_nombreUsuario_fkey" FOREIGN KEY ("nombreUsuario") REFERENCES "User"("usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
