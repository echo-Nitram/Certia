const COLORES = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  EN_REVISION: 'bg-blue-100 text-blue-800',
  OBSERVADO: 'bg-orange-100 text-orange-800',
  PAGO_VALIDADO: 'bg-cyan-100 text-cyan-800',
  EN_ELABORACION: 'bg-purple-100 text-purple-800',
  REVISION_PDF: 'bg-indigo-100 text-indigo-800',
  PENDIENTE_FIRMA: 'bg-amber-100 text-amber-800',
  FINALIZADO: 'bg-green-100 text-green-800',
  RECHAZADO: 'bg-red-100 text-red-800',
  VENCIDO: 'bg-gray-100 text-gray-800',
};

const ETIQUETAS = {
  PENDIENTE: 'Pendiente',
  EN_REVISION: 'En Revisión',
  OBSERVADO: 'Observado',
  PAGO_VALIDADO: 'Pago Validado',
  EN_ELABORACION: 'En Elaboración',
  REVISION_PDF: 'Revisión PDF',
  PENDIENTE_FIRMA: 'Pendiente Firma',
  FINALIZADO: 'Finalizado',
  RECHAZADO: 'Rechazado',
  VENCIDO: 'Vencido',
};

export default function EstadoBadge({ estado, className = '' }) {
  const color = COLORES[estado] || 'bg-gray-100 text-gray-800';
  const label = ETIQUETAS[estado] || estado;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color} ${className}`}>
      {label}
    </span>
  );
}
