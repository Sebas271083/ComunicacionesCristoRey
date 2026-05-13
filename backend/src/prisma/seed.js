import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  await prisma.pushSubscription.deleteMany();
  await prisma.mensaje.deleteMany();
  await prisma.anuncio.deleteMany();
  await prisma.tarea.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.papaAlumno.deleteMany();
  await prisma.alumno.deleteMany();
  await prisma.cursoDocente.deleteMany();
  await prisma.curso.deleteMany();
  await prisma.materia.deleteMany();
  await prisma.usuario.deleteMany();

  const hash = (p) => bcrypt.hash(p, 12);

  // --- Usuarios ---
  const [docente1, docente2, docente3, papa1, papa2, papa3, admin, director, secretaria] = await Promise.all([
    prisma.usuario.create({ data: { email: 'ana@escuela.com',       password: await hash('123456'),   nombre: 'Prof. Ana García',      rol: 'docente'    } }),
    prisma.usuario.create({ data: { email: 'carlos@escuela.com',    password: await hash('123456'),   nombre: 'Prof. Carlos López',    rol: 'docente'    } }),
    prisma.usuario.create({ data: { email: 'maria@escuela.com',     password: await hash('123456'),   nombre: 'Prof. María Fernández', rol: 'docente'    } }),
    prisma.usuario.create({ data: { email: 'juan@gmail.com',        password: await hash('123456'),   nombre: 'Juan Martínez',         rol: 'papa'       } }),
    prisma.usuario.create({ data: { email: 'laura@gmail.com',       password: await hash('123456'),   nombre: 'Laura Rodríguez',       rol: 'papa'       } }),
    prisma.usuario.create({ data: { email: 'pedro@gmail.com',       password: await hash('123456'),   nombre: 'Pedro Sánchez',         rol: 'papa'       } }),
    prisma.usuario.create({ data: { email: 'admin@escuela.com',     password: await hash('admin123'), nombre: 'Administrador',         rol: 'admin'      } }),
    prisma.usuario.create({ data: { email: 'director@escuela.com',  password: await hash('director123'), nombre: 'Director General',   rol: 'director'   } }),
    prisma.usuario.create({ data: { email: 'secretaria@escuela.com',password: await hash('secretaria123'), nombre: 'Secretaría',       rol: 'secretaria' } }),
  ]);

  // --- Cursos ---
  const [curso1A, curso2B, curso5A] = await Promise.all([
    prisma.curso.create({ data: { nombre: '1° A', nivel: 'primaria' } }),
    prisma.curso.create({ data: { nombre: '2° B', nivel: 'primaria' } }),
    prisma.curso.create({ data: { nombre: '5° A', nivel: 'primaria' } }),
  ]);

  // --- Materias ---
  const [matematica, lengua, ciencias, historia] = await Promise.all([
    prisma.materia.create({ data: { nombre: 'Matemática' } }),
    prisma.materia.create({ data: { nombre: 'Lengua' } }),
    prisma.materia.create({ data: { nombre: 'Ciencias Naturales' } }),
    prisma.materia.create({ data: { nombre: 'Ciencias Sociales' } }),
  ]);

  // --- Asignaciones docente → curso + materia ---
  // 1° A: Ana enseña todo (maestra de grado)
  await prisma.cursoDocente.createMany({
    data: [
      { cursoId: curso1A.id, docenteId: docente1.id, materiaId: matematica.id },
      { cursoId: curso1A.id, docenteId: docente1.id, materiaId: lengua.id },
      // 2° B: Carlos (maestro de grado)
      { cursoId: curso2B.id, docenteId: docente2.id, materiaId: matematica.id },
      { cursoId: curso2B.id, docenteId: docente2.id, materiaId: lengua.id },
      // 5° A: docentes por materia
      { cursoId: curso5A.id, docenteId: docente1.id, materiaId: matematica.id },
      { cursoId: curso5A.id, docenteId: docente2.id, materiaId: ciencias.id },
      { cursoId: curso5A.id, docenteId: docente3.id, materiaId: historia.id },
    ],
  });

  // --- Alumnos ---
  const [alumno1, alumno2, alumno3, alumno4] = await Promise.all([
    prisma.alumno.create({ data: { nombre: 'Sofía Martínez', cursoId: curso1A.id } }),
    prisma.alumno.create({ data: { nombre: 'Lucas Martínez', cursoId: curso5A.id } }),   // 2 hijos de Juan
    prisma.alumno.create({ data: { nombre: 'Emma Rodríguez', cursoId: curso2B.id } }),
    prisma.alumno.create({ data: { nombre: 'Tomás Sánchez', cursoId: curso5A.id } }),
  ]);

  // --- Vincular papás ↔ alumnos ---
  await prisma.papaAlumno.createMany({
    data: [
      { papaId: papa1.id, alumnoId: alumno1.id },  // Juan → Sofía (1°A)
      { papaId: papa1.id, alumnoId: alumno2.id },  // Juan → Lucas (5°A) — dos hijos
      { papaId: papa2.id, alumnoId: alumno3.id },  // Laura → Emma (2°B)
      { papaId: papa3.id, alumnoId: alumno4.id },  // Pedro → Tomás (5°A)
    ],
  });

  // --- Tareas ---
  await prisma.tarea.createMany({
    data: [
      { titulo: 'Ejercicios de suma', descripcion: 'Página 45-47 del libro', fechaVencimiento: new Date(Date.now() + 3 * 86400000), creadorId: docente1.id },
      { titulo: 'Redacción: Mi familia', descripcion: 'Una página sobre tu familia', fechaVencimiento: new Date(Date.now() + 7 * 86400000), creadorId: docente1.id },
      { titulo: 'Proyecto sistema solar', descripcion: 'Presentación en grupo', fechaVencimiento: new Date(Date.now() + 14 * 86400000), creadorId: docente2.id },
    ],
  });

  // --- Eventos ---
  await prisma.evento.createMany({
    data: [
      { titulo: 'Reunión de padres', descripcion: 'Reunión general primer trimestre', fecha: new Date(Date.now() + 5 * 86400000), tipo: 'reunion', creadorId: admin.id },
      { titulo: 'Examen de Matemática 5°A', fecha: new Date(Date.now() + 10 * 86400000), tipo: 'examen', creadorId: docente1.id },
    ],
  });

  // --- Anuncios ---
  await prisma.anuncio.createMany({
    data: [
      { titulo: 'Bienvenidos al nuevo ciclo lectivo', contenido: 'Les damos la bienvenida a todos los alumnos y familias. El calendario escolar ya está disponible.', creadorId: admin.id, cursoId: null },
      { titulo: 'Materiales para 1° A', contenido: 'Recordamos traer el libro de matemáticas esta semana.', creadorId: docente1.id, cursoId: curso1A.id },
    ],
  });

  // --- Mensajes ---
  await prisma.mensaje.createMany({
    data: [
      { contenido: 'Buenas Prof. Ana, tenía una consulta sobre la tarea de suma', enviadorId: papa1.id, receptorId: docente1.id },
      { contenido: 'Hola Juan! Claro, ¿en qué puedo ayudarte?', enviadorId: docente1.id, receptorId: papa1.id },
      { contenido: 'Sofía no entiende el ejercicio 3 de la página 46', enviadorId: papa1.id, receptorId: docente1.id },
    ],
  });

  console.log('\n✅ Seed completado!\n');
  console.log('📋 Usuarios:');
  console.log('  Docentes:   ana@escuela.com / carlos@escuela.com / maria@escuela.com  (pass: 123456)');
  console.log('  Papás:      juan@gmail.com (2 hijos) / laura@gmail.com / pedro@gmail.com  (pass: 123456)');
  console.log('  Admin:      admin@escuela.com  (pass: admin123)');
  console.log('  Director:   director@escuela.com  (pass: director123)');
  console.log('  Secretaria: secretaria@escuela.com  (pass: secretaria123)');
  console.log('\n📚 Cursos: 1° A · 2° B · 5° A');
  console.log('  Juan tiene hijos en 1°A (Sofía) y 5°A (Lucas) → ve docentes de ambos cursos');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
