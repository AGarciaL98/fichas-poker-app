import { useNavigate } from 'react-router-dom'

export default function CookiesPolicy() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 py-4 bg-felt-900 border-b border-felt-600">
        <button onClick={() => navigate(-1)} className="text-gray-400 text-sm mb-1 block">
          ← Volver
        </button>
        <h1 className="text-lg font-bold text-gold-400">Política de cookies</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 scroll-y space-y-5 text-sm text-gray-300 leading-relaxed">

        <Section title="¿Qué son las cookies?">
          <p>
            Las cookies son pequeños archivos de texto que los sitios web almacenan en tu
            dispositivo al visitarlos. Permiten que el sitio recuerde tus preferencias o te
            identifique en visitas sucesivas.
          </p>
        </Section>

        <Section title="Cookies que usamos">
          <div className="space-y-3">
            <div className="bg-felt-800 border border-felt-600 rounded-xl p-3">
              <p className="text-white font-semibold mb-1">Cookies propias — funcionales</p>
              <table className="w-full text-xs text-gray-400">
                <tbody>
                  <tr>
                    <td className="py-0.5 pr-3 text-gray-300 font-medium">cookie_consent</td>
                    <td>Recuerda si aceptaste el aviso de cookies. Duración: permanente (localStorage).</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 pr-3 text-gray-300 font-medium">player_id</td>
                    <td>Identificador anónimo de sesión para mantenerte en tu partida. Duración: sesión (sessionStorage).</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-felt-800 border border-felt-600 rounded-xl p-3">
              <p className="text-white font-semibold mb-1">Cookies de terceros — publicidad</p>
              <p className="text-xs text-gray-400 mb-2">
                Google AdSense utiliza cookies para mostrar anuncios relevantes basados en tus
                intereses. Estas cookies son gestionadas por Google LLC y escapan al control
                directo de MaletínPoker.
              </p>
              <table className="w-full text-xs text-gray-400">
                <tbody>
                  <tr>
                    <td className="py-0.5 pr-3 text-gray-300 font-medium">__gads / __gpi</td>
                    <td>Registran la interacción con anuncios. Duración: hasta 13 meses.</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 pr-3 text-gray-300 font-medium">NID / ANID</td>
                    <td>Personalizan anuncios según preferencias. Duración: 6 meses.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <Section title="Cómo gestionar las cookies">
          <p className="mb-2">Tienes varias opciones para controlar las cookies:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong className="text-white">Configuración del navegador:</strong> puedes bloquear
              o eliminar cookies desde los ajustes de tu navegador (Safari, Chrome, Firefox…).
              Ten en cuenta que bloquear cookies funcionales puede afectar al funcionamiento
              de la app.
            </li>
            <li>
              <strong className="text-white">Anuncios de Google:</strong> desactiva la
              personalización en{' '}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-400 underline"
              >
                adssettings.google.com
              </a>
              .
            </li>
            <li>
              <strong className="text-white">Opt-out de Google Analytics/AdSense:</strong>{' '}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-400 underline"
              >
                tools.google.com/dlpage/gaoptout
              </a>
              .
            </li>
          </ul>
        </Section>

        <Section title="Retirar el consentimiento">
          <p>
            Puedes retirar tu consentimiento en cualquier momento eliminando el dato{' '}
            <code className="bg-felt-800 px-1 rounded text-gold-400">cookie_consent</code> del
            almacenamiento local de tu navegador (Herramientas de desarrollador → Aplicación →
            Local Storage). Al recargar la página, volverá a aparecer el aviso de cookies.
          </p>
        </Section>

        <Section title="Más información">
          <p>
            Para cualquier consulta sobre cookies, escríbenos a{' '}
            <a href="mailto:info@maletindepoker.com" className="text-gold-400 underline">
              info@maletindepoker.com
            </a>
            .
          </p>
          <p className="mt-2 text-gray-500 text-xs">Última actualización: junio de 2026</p>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-gold-400 font-semibold mb-2">{title}</h2>
      {children}
    </div>
  )
}
