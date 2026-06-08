export default function EstadoBadge({ estado, className = '' }) {
  const labels = {
    PENDIENTE: 'Pendiente',
    EN_REVISION: 'En Revisión',
    OBSERVADO: 'Observado',
    PAGO_VALIDADO: 'Pago Validado',
    EN_ELABORACION: 'En Elaboración',
    REVISION_PDF: 'Revisión PDF',
    PENDIENTE_FIRMA: 'Pdte. Firma',
    FINALIZADO: 'Finalizado',
    RECHAZADO: 'Rechazado',
    VENCIDO: 'Vencido',
  };
  return (
    <span className={`c-badge c-badge--${estado} ${className}`}>
      {labels[estado] || estado}
    </span>
  );
}
