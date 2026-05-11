import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from './useSocket';
import { useNotificationStore } from '../stores/notification.store';

const MENSAJES = {
  'solicitud:nueva': (d) => `Nueva solicitud: ${d.nExpediente} — ${d.cliente}`,
  'solicitud:estado_cambiado': (d) => `${d.nExpediente}: cambió a ${d.estadoNuevo}`,
  'solicitud:observada': (d) => `Solicitud ${d.nExpediente} requiere correcciones`,
  'certificado:emitido': (d) => `¡Certificado emitido! ${d.nExpediente}`,
  'certificado:vencimiento': (d) => `${d.nExpediente} vence en ${d.diasRestantes} días`,
  'pdf:borrador_listo': (d) => `Borrador listo para revisión: ${d.nExpediente}`,
  'firma:validacion_exitosa': (d) => `Firma válida — ${d.nExpediente} → FINALIZADO`,
  'firma:validacion_fallida': (d) => `Error de firma en ${d.nExpediente}: ${d.error}`,
  'solicitud:pendiente_firma': (d) => `PDF listo para firmar: ${d.nExpediente}`,
  'solicitud:reenviada': (d) => `Solicitud corregida: ${d.nExpediente}`,
};

const TIPOS_TOAST = {
  'certificado:emitido': 'success',
  'firma:validacion_exitosa': 'success',
  'solicitud:observada': 'error',
  'firma:validacion_fallida': 'error',
  'certificado:vencimiento': 'error',
};

export function useNotifications() {
  const { agregar } = useNotificationStore();
  const handlers = {};

  for (const evento of Object.keys(MENSAJES)) {
    handlers[evento] = (data) => {
      const msg = MENSAJES[evento](data);
      const tipo = TIPOS_TOAST[evento] || 'custom';
      if (tipo === 'success') toast.success(msg, { duration: 5000 });
      else if (tipo === 'error') toast.error(msg, { duration: 6000 });
      else toast(msg, { duration: 4000, icon: '🔔' });
      agregar({ evento, mensaje: msg, datos: data });
    };
  }

  useSocket(handlers);

  return useNotificationStore();
}
