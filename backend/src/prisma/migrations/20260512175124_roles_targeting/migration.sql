-- AlterTable
ALTER TABLE "anuncios" ADD COLUMN     "destinatario" TEXT NOT NULL DEFAULT 'todos';

-- AlterTable
ALTER TABLE "tareas" ADD COLUMN     "cursoId" TEXT,
ADD COLUMN     "destinatario" TEXT NOT NULL DEFAULT 'todos';

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
