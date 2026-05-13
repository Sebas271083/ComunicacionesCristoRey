export const PRIVILEGIADOS = ['admin', 'director', 'secretaria'];
export const PUBLICADORES  = ['admin', 'director', 'secretaria', 'docente'];

export const isPrivilegiado = (rol) => PRIVILEGIADOS.includes(rol);
export const puedePublicar  = (rol) => PUBLICADORES.includes(rol);
