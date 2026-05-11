import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

function formatFecha(d) {
  return d ? new Date(d).toLocaleDateString('es-UY', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
}

export default function Verify() {
  const { token } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['verify', token],
    queryFn: () => api.get(`/verify/${token}`).then(r => r.data),
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-certia-green mb-3">
            <span className="text-3xl">🌙</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">CERTIA</h1>
          <p className="text-sm text-gray-500">Centro Islámico del Uruguay</p>
        </div>

        {isLoading && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-certia-green border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Verificando certificado...</p>
          </div>
        )}

        {isError && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✗</span>
            </div>
            <h2 className="text-lg font-semibold text-red-700 mb-2">Certificado no válido</h2>
            <p className="text-sm text-gray-500">
              No se encontró ningún certificado activo con este código QR. Puede haber expirado o el código es incorrecto.
            </p>
          </div>
        )}

        {data && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header de estado */}
            <div className={`px-6 py-4 text-center ${data.valido ? 'bg-certia-green' : 'bg-orange-500'}`}>
              <p className="text-white text-2xl mb-1">{data.valido ? '✓' : '⚠'}</p>
              <p className="text-white font-semibold text-lg">
                {data.valido ? 'Certificado Halal Válido' : 'Certificado Vencido'}
              </p>
              {!data.valido && (
                <p className="text-white/80 text-sm mt-1">Este certificado ha expirado</p>
              )}
            </div>

            {/* Detalles */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">N° de expediente</p>
                <p className="font-bold text-gray-900 text-lg mt-0.5">{data.nExpediente}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa titular</p>
                <p className="font-medium text-gray-800 mt-0.5">{data.empresa}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo de certificado</p>
                <p className="text-gray-800 mt-0.5">{data.tipoCertificado}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha de emisión</p>
                  <p className="text-gray-800 mt-0.5">{formatFecha(data.fechaEmision)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha de vencimiento</p>
                  <p className={`mt-0.5 font-medium ${data.valido ? 'text-gray-800' : 'text-orange-600'}`}>
                    {formatFecha(data.fechaVencimiento)}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                  Verificado mediante el sistema CERTIA del Centro Islámico del Uruguay.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Verificación realizada el {new Date().toLocaleDateString('es-UY', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
