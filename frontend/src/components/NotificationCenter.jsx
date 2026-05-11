import { useState } from 'react';
import { useNotificationStore } from '../stores/notification.store';

function formatFecha(d) {
  return new Date(d).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
}

export default function NotificationCenter() {
  const [abierto, setAbierto] = useState(false);
  const { notificaciones, noLeidas, marcarTodasLeidas } = useNotificationStore();

  return (
    <div className="relative">
      <button
        onClick={() => { setAbierto(!abierto); if (!abierto) marcarTodasLeidas(); }}
        className="relative p-2 text-white hover:bg-certia-green-dark rounded-full transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 bg-certia-green text-white font-semibold text-sm flex justify-between items-center">
            <span>Notificaciones</span>
            <button onClick={() => setAbierto(false)} className="text-white/70 hover:text-white">✕</button>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notificaciones.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">Sin notificaciones</p>
            ) : (
              notificaciones.map((n) => (
                <div key={n.id} className={`px-4 py-3 text-sm ${n.leida ? 'bg-white' : 'bg-blue-50'}`}>
                  <p className="text-gray-800">{n.mensaje}</p>
                  <p className="text-gray-400 text-xs mt-1">{formatFecha(n.fecha)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
