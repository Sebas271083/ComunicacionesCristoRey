import api from './api.js';

export const cursosService = {
  listar:           ()                     => api.get('/cursos').then((r) => r.data.data),
  crear:            (data)                 => api.post('/cursos', data).then((r) => r.data.data),
  eliminar:         (id)                   => api.delete(`/cursos/${id}`).then((r) => r.data.data),
  misCursos:        ()                     => api.get('/cursos/mis-cursos').then((r) => r.data.data),
  misAsignaciones:  ()                     => api.get('/cursos/mis-asignaciones').then((r) => r.data.data),
  listarMaterias:   ()                     => api.get('/cursos/materias').then((r) => r.data.data),
  crearMateria:     (data)                 => api.post('/cursos/materias', data).then((r) => r.data.data),
  asignarDocente:   (data)                 => api.post('/cursos/asignar', data).then((r) => r.data.data),
  quitarDocente:    (asignacionId)         => api.delete(`/cursos/asignar/${asignacionId}`).then((r) => r.data.data),
  resumenCiclo:     (anio)                 => api.get(`/cursos/ciclo/${anio}`).then((r) => r.data.data),
  // Para formularios: docente ve solo sus cursos; resto ve todos
  listarParaForm:   (rol) => {
    if (rol === 'docente') {
      return api.get('/cursos/mis-asignaciones').then((r) => {
        const seen = new Set();
        return r.data.data
          .filter((a) => !seen.has(a.curso.id) && seen.add(a.curso.id))
          .map((a) => a.curso);
      });
    }
    return api.get('/cursos').then((r) => r.data.data);
  },
};
