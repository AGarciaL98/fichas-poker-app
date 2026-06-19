import { useNavigate } from 'react-router-dom'

export default function TermsOfUse() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 py-4 bg-felt-900 border-b border-felt-600">
        <button onClick={() => navigate(-1)} className="text-gray-400 text-sm mb-1 block">
          ← Volver
        </button>
        <h1 className="text-lg font-bold text-gold-400">Términos de uso</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 scroll-y space-y-5 text-sm text-gray-300 leading-relaxed">

        <Section title="1. Descripción del servicio">
          <p>
            <strong className="text-white">MaletínPoker</strong> (maletindepoker.com) es una
            aplicación web gratuita que permite gestionar partidas de póker entre amigos usando
            fichas virtuales. El servicio no implica dinero real, apuestas económicas ni ningún
            tipo de juego de azar con valor monetario.
          </p>
        </Section>

        <Section title="2. Uso aceptable">
          <p>Al usar MaletínPoker, te comprometes a:</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Usar el servicio únicamente con fines lúdicos y de entretenimiento entre amigos.</li>
            <li>No utilizar la plataforma para organizar juegos de azar con dinero real.</li>
            <li>No intentar acceder a salas ajenas ni interferir en partidas de terceros.</li>
            <li>No realizar acciones que puedan dañar, sobrecargar o comprometer la disponibilidad del servicio.</li>
          </ul>
        </Section>

        <Section title="3. Sin juego de azar real">
          <p>
            MaletínPoker es una herramienta de gestión de fichas virtuales. Las fichas no tienen
            valor económico, no son canjeables por dinero o premios, y no constituyen un servicio
            de juego regulado. El titular del servicio no es un operador de juego y no está sujeto
            a la Ley 13/2011 de regulación del juego.
          </p>
        </Section>

        <Section title="4. Disponibilidad del servicio">
          <p>
            El servicio se proporciona <strong className="text-white">"tal cual"</strong>, sin
            garantías de disponibilidad continua. Las partidas en curso se conservan durante un
            máximo de 12 horas; transcurrido ese tiempo, los datos de la sesión pueden eliminarse.
            No nos hacemos responsables de interrupciones del servicio ni de la pérdida de datos
            de sesión.
          </p>
        </Section>

        <Section title="5. Limitación de responsabilidad">
          <p>
            En la máxima medida permitida por la ley aplicable, el titular de MaletínPoker no será
            responsable de ningún daño directo, indirecto, incidental o consecuente derivado del
            uso o la imposibilidad de uso del servicio.
          </p>
        </Section>

        <Section title="6. Propiedad intelectual">
          <p>
            El código, el diseño y los contenidos originales de MaletínPoker son propiedad de sus
            creadores. Queda prohibida su reproducción, distribución o modificación sin
            autorización expresa. Los símbolos de palos de cartas y demás elementos estándar del
            póker son de dominio público.
          </p>
        </Section>

        <Section title="7. Publicidad">
          <p>
            MaletínPoker muestra anuncios de terceros a través de Google AdSense para financiar el
            mantenimiento del servicio gratuito. Los anunciantes son responsables del contenido de
            sus propios anuncios.
          </p>
        </Section>

        <Section title="8. Modificaciones">
          <p>
            Nos reservamos el derecho a modificar estos términos en cualquier momento. El uso
            continuado del servicio tras la publicación de cambios implica la aceptación de los
            nuevos términos.
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
