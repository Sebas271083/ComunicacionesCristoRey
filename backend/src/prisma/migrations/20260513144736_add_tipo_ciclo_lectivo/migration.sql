/*
  Warnings:

  - A unique constraint covering the columns `[cursoId,docenteId,materiaId,cicloLectivo]` on the table `curso_docentes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "curso_docentes_cursoId_docenteId_materiaId_key";

-- AlterTable
ALTER TABLE "curso_docentes" ADD COLUMN     "cicloLectivo" INTEGER NOT NULL DEFAULT 2025,
ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'especial';

-- CreateIndex
CREATE INDEX "curso_docentes_docenteId_cicloLectivo_idx" ON "curso_docentes"("docenteId", "cicloLectivo");

-- CreateIndex
CREATE UNIQUE INDEX "curso_docentes_cursoId_docenteId_materiaId_cicloLectivo_key" ON "curso_docentes"("cursoId", "docenteId", "materiaId", "cicloLectivo");
