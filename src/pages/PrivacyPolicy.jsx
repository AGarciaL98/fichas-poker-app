import { useNavigate } from 'react-router-dom'

export default function PrivacyPolicy() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 py-4 bg-felt-900 border-b border-felt-600">
        <button onClick={() => navigate(-1)} className="text-gray-400 text-sm mb-1 block">
          ← Volver
        </button>
        <h1 className="text-lg font-bold text-gold-400">Política de privacidad</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 scroll-y space-y-5 text-sm text-gray-300 leading-relaxed">

        <Section title="1. Responsable del tratamiento">
          <p>
            El responsable del tratamiento de los datos personales recogidos a través de{' '}
            <strong className="text-white">maletindepoker.com</strong> es el titular del sitio web.
            Puedes contactar con nosotros en{' '}
            <a href="mailto:info@maletindepoker.com" className="text-gold-400 underline">
              info@maletindepoker.com
            </a>
            .
          </p>
        </Section>

        <Section title="2. Datos que recogemos">
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-white">Nombre de jugador:</strong> introducido voluntariamente para unirte a una partida. No se vincula a ninguna cuenta ni identidad real.</li>
            <li><strong className="text-white">Código de sala:</strong> generado de forma aleatoria para identificar la sesión de juego.</li>
            <li><strong className="text-white">Datos de sesión:</strong> fichas, acciones de juego y estado de la partida, almacenados temporalmente en memoria del servidor (máximo 12 horas).</li>
            <li><strong className="text-white">Datos de navegación:</strong> dirección IP y datos técnicos recogidos automáticamente por Google AdSense para la personalización de anuncios.</li>
          </ul>
        </Section>

        <Section title="3. Finalidad del tratamiento">
          <ul className="list-disc list-inside space-y-1">
            <li>Prestar el servicio de gestión de partidas de póker virtual entre amigos.</li>
            <li>Mostrar publicidad relevante mediante Google AdSense para financiar el servicio.</li>
            <li>Mejorar la experiencia de usuario y el funcionamiento de la plataforma.</li>
          </ul>
        </Section>

        <Section title="4. Base legal">
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-white">Consentimiento</strong> (Art. 6.1.a RGPD): para el uso de cookies publicitarias de terceros.</li>
            <li><strong className="text-white">Interés legítimo</strong> (Art. 6.1.f RGPD): para el correcto funcionamiento del servicio de juego.</li>
          </ul>
        </Section>

        <Section title="5. Cookies de terceros — Google AdSense">
          <p>
            Este sitio utiliza Google AdSense, un servicio de publicidad de Google LLC. Google puede
            utilizar cookies y tecnologías similares para mostrar anuncios personalizados basados en
            tus visitas previas a este y otros sitios web.
          </p>
          <p className="mt-2">
            Puedes consultar la política de privacidad de Google en{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-400 underline"
            >
              policies.google.com/privacy
            </a>{' '}
            y desactivar la personalización de anuncios en{' '}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-400 underline"
            >
              adssettings.google.com
            </a>
            .
          </p>
        </Section>

        <Section title="6. Conservación de los datos">
          <p>
            Los datos de nombre de jugador y sesión de juego se eliminan automáticamente del servidor
            transcurridas <strong className="text-white">12 horas</strong> desde la última actividad.
            No se almacenan en bases de datos permanentes asociadas a identidades reales.
          </p>
        </Section>

        <Section title="7. Derechos del usuario">
          <p>De acuerdo con el RGPD y la LOPDGDD, puedes ejercer los siguientes derechos:</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Acceso, rectificación y supresión de tus datos.</li>
            <li>Oposición y limitación del tratamiento.</li>
            <li>Portabilidad de los datos.</li>
            <li>Retirar el consentimiento en cualquier momento.</li>
          </ul>
          <p className="mt-2">
            Para ejercer estos derechos, escríbenos a{' '}
            <a href="mailto:info@maletindepoker.com" className="text-gold-400 underline">
              info@maletindepoker.com
            </a>
            . También puedes presentar una reclamación ante la{' '}
            <strong className="text-white">Agencia Española de Protección de Datos (AEPD)</strong> en{' '}
            <a
              href="https://www.aepd.es"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-400 underline"
            >
              www.aepd.es
            </a>
            .
          </p>
        </Section>

        <Section title="8. Transferencias internacionales">
          <p>
            Google LLC, proveedor de AdSense, está certificado bajo el marco EU-EE.UU. de privacidad
            de datos, lo que garantiza un nivel de protección adecuado para las transferencias de
            datos a Estados Unidos.
          </p>
        </Section>

        <Section title="9. Cambios en esta política">
          <p>
            Podemos actualizar esta política de privacidad periódicamente. La fecha de la última
            actualización aparecerá indicada al pie de esta página.
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
