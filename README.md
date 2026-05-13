# EduChat - App Mensajería Escolar

PWA de mensajería entre padres y docentes, con tareas y calendario.

## Stack

- **Backend:** Node.js + Express.js (ES Modules) + Prisma + PostgreSQL
- **Frontend:** React 18 + Vite + JSX + Tailwind CSS + daisyUI
- **Arquitectura:** MVC por módulos

## Estructura

```
backend/src/
├── modules/
│   ├── auth/          (controller, routes, service)
│   ├── usuarios/      (controller, routes, service)
│   ├── mensajes/      (controller, routes, service)
│   ├── tareas/        (controller, routes, service)
│   ├── calendario/    (controller, routes, service)
│   └── notificaciones/(controller, routes, service)
├── config/            (database, env, jwt)
├── middleware/        (auth, errorHandler, validateInput)
└── app.js

frontend/src/
├── modules/
│   ├── auth/          (LoginPage, RegisterPage)
│   ├── chat/          (ChatPage + components)
│   ├── tareas/        (TasksPage + components)
│   ├── calendario/    (CalendarPage + components)
│   └── perfil/        (ProfilePage)
├── components/Layout/ (Header, BottomNav, Layout)
├── context/           (AuthContext)
├── services/          (api, authService, etc.)
└── utils/             (formatDate)
```

## Setup Backend

```bash
cd backend
cp .env.example .env
# Editar .env con tu DATABASE_URL y JWT_SECRET

npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed          # Carga usuarios de prueba
npm run dev
```

## Setup Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Usuarios de prueba (seed)

| Rol      | Email                   | Password |
|----------|-------------------------|----------|
| Docente  | docente1@escuela.com    | 123456   |
| Docente  | docente2@escuela.com    | 123456   |
| Papá     | papa1@gmail.com         | 123456   |
| Papá     | papa2@gmail.com         | 123456   |
| Admin    | admin@escuela.com       | admin123 |

## APIs

```
POST  /api/auth/register
POST  /api/auth/login
GET   /api/auth/me

GET   /api/usuarios/docentes
GET   /api/mensajes/conversaciones
GET   /api/mensajes/:userId
POST  /api/mensajes

GET   /api/tareas
POST  /api/tareas          (docente/admin)
PUT   /api/tareas/:id/complete

GET   /api/eventos
POST  /api/eventos         (docente/admin)

POST  /api/notificaciones/subscribe
```

## Generar claves VAPID (push notifications)

```bash
cd backend
node -e "const wp = require('web-push'); const k = wp.generateVAPIDKeys(); console.log(k);"
```

## Producción (Oracle Cloud)

```bash
# Backend
npm run build   # No aplica, corre directo con node
NODE_ENV=production npm start

# Frontend
npm run build   # Genera /dist
# Servir /dist con nginx
```
