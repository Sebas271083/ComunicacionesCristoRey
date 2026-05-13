import webpush from 'web-push';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(env.VAPID_EMAIL, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

export async function suscribir({ usuarioId, endpoint, p256dh, auth }) {
  return prisma.pushSubscription.upsert({
    where: { usuarioId },
    update: { endpoint, p256dh, auth },
    create: { usuarioId, endpoint, p256dh, auth },
  });
}

export async function desuscribir(usuarioId) {
  return prisma.pushSubscription.deleteMany({ where: { usuarioId } });
}

export async function enviarNotificacion(usuarioId, payload) {
  const sub = await prisma.pushSubscription.findUnique({ where: { usuarioId } });
  if (!sub) return null;

  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    return true;
  } catch (err) {
    if (err.statusCode === 410) {
      await prisma.pushSubscription.delete({ where: { usuarioId } });
    }
    return false;
  }
}

export async function enviarATodos(payload) {
  const subs = await prisma.pushSubscription.findMany({ include: { usuario: true } });
  const resultados = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  );
  return resultados;
}
