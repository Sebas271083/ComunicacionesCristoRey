-- AlterTable
ALTER TABLE "alumnos" ADD COLUMN     "dni" TEXT,
ADD COLUMN     "dniResponsable" TEXT,
ADD COLUMN     "domicilio" TEXT,
ADD COLUMN     "fechaNacimiento" TIMESTAMP(3),
ADD COLUMN     "nacionalidad" TEXT,
ADD COLUMN     "nombreResponsable" TEXT,
ADD COLUMN     "sexo" TEXT,
ADD COLUMN     "telefonoResponsable" TEXT;
