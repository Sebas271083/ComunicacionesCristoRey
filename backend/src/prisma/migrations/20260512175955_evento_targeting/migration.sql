-- AlterTable
ALTER TABLE "eventos" ADD COLUMN     "alumnoId" TEXT,
ADD COLUMN     "cursoId" TEXT,
ADD COLUMN     "destinatario" TEXT NOT NULL DEFAULT 'todos';

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
