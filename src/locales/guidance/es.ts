// Guidance System copy (Spanish).
const guidance = {
  common: {
    next: 'Siguiente',
    back: 'Atrás',
    skip: 'Omitir',
    finish: 'Finalizar',
    gotIt: 'Entendido',
    notNow: 'Ahora no',
    save: 'Guardar',
    dontSuggest: 'No volver a sugerir',
    stepOf: 'Paso {{current}} de {{total}}',
  },
  tours: {
    hero: {
      welcome: {
        title: 'Te damos la bienvenida a Guidera 👋',
        body: 'Este recorrido rápido te muestra lo esencial — unos 30 segundos. Puedes omitirlo cuando quieras.',
      },
      search: {
        title: 'Previsualiza cualquier viaje al instante',
        body: 'Busca cualquier ciudad para obtener un Trip Snapshot — costos estimados, clima, info de visado y una idea del viaje antes de decidir.',
      },
      deals: {
        title: 'Ofertas elegidas para ti',
        body: 'Las ofertas de vuelos y experiencias se actualizan durante todo el día. Toca Ver todo para explorar por categoría.',
      },
      journeys: {
        title: 'Viaja con un propósito',
        body: 'Los Journeys son informes documentados sobre el motivo de tu viaje — mudanza, salud, estudios, trabajo remoto y mucho más.',
      },
      launcher: {
        title: 'Tus herramientas viven aquí',
        body: 'Recorre ciudades, escanea menús con AI Vision, recibe alertas de seguridad, escanea recibos y boletos, o pregúntale lo que sea a Guidera AI.',
      },
      launcherSheet: {
        title: 'Seis herramientas, a un toque',
        body: 'Prueba AI Vision con un menú real — lo traduce e incluso arma tu pedido.',
      },
      trips: {
        title: 'Todo empieza con un viaje',
        body: 'Agrega o importa un viaje para desbloquear Smart Plan: itinerario, equipaje, seguridad, idioma, documentos, gastos, diario, recomendaciones culturales y seguimiento de compensaciones.',
        cta: 'Configurar mi perfil de viaje →',
      },
    },
    trips: {
      create: {
        title: 'Crea un viaje en segundos',
        body: 'Créalo manualmente, o deja que la IA lo planifique por ti.',
      },
      import: {
        title: '¿Ya reservaste? Impórtalo',
        body: 'Escanea una tarjeta de embarque o reenvía un correo de reserva — Guidera crea el viaje automáticamente.',
      },
      states: {
        title: 'Los viajes se organizan solos',
        body: 'Próximos, en curso, pasados, borradores — todo en su lugar.',
        cta: 'Crear mi primer viaje',
      },
    },
    tripDetail: {
      smartPlan: {
        title: 'Un toque, seis módulos',
        body: 'Smart Plan genera tu itinerario, lista de equipaje, informe de seguridad, kit de idioma, lista de documentos y recomendaciones culturales — personalizados para ti.',
      },
      modules: {
        title: 'El centro de control de tu viaje',
        body: 'Controla gastos, lleva un diario y monitorea la compensación de vuelos — cada tarjeta es una herramienta completa.',
      },
      invite: {
        title: 'Viajen juntos',
        body: 'Invita a tus compañeros a ver y editar este viaje contigo.',
      },
      snapshot: {
        title: 'Conoce antes de partir',
        body: 'El snapshot mantiene costos, clima y alertas en vivo para este destino.',
        cta: 'Generar Smart Plan',
      },
    },
    connect: {
      tabs: {
        title: 'Encuentra a tu gente',
        body: 'Descubre viajeros, únete a grupos, conoce guías locales y encuentra eventos dondequiera que vayas.',
      },
      pulse: {
        title: 'Pulse: la vida a tu alrededor',
        body: 'Ve la actividad de viajeros y los encuentros en tiempo real en el mapa — como el latido de la ciudad.',
      },
      guides: {
        title: '¿Conoces el camino? Hazte guía',
        body: 'Los locales pueden postularse para guiar viajeros y ganar dinero.',
      },
    },
    journeys: {
      categories: {
        title: 'Elige tu motivo',
        body: 'Cada tipo de journey recibe un informe de nivel investigación: costos, requisitos, plazos, proveedores.',
      },
      briefing: {
        title: 'Los briefings son personales',
        body: 'Dinos dónde, en qué etapa estás y quién te acompaña — generamos un informe solo para tu caso.',
      },
    },
    search: {
      input: {
        title: 'Busca como piensas',
        body: 'Escribe una ciudad, un país, o incluso «cálido en diciembre».',
      },
      snapshotHint: {
        title: 'Ten el panorama completo',
        body: 'Seleccionar un destino crea un Trip Snapshot — costos, vuelos, clima, seguridad — antes de planificar nada.',
      },
    },
  },
  tips: {
    savedItems: {
      title: 'Elementos guardados',
      body: 'Tus elementos guardados están aquí — destinos, ofertas, guías.',
    },
    inbox: {
      title: 'Tu bandeja de entrada',
      body: 'Las alertas de viaje y los mensajes llegan a tu bandeja de entrada.',
    },
    tripReminder: {
      title: 'Tu próximo viaje',
      body: 'Tu próximo viaje te acompaña aquí — toca para ver la cuenta regresiva y las acciones rápidas.',
    },
    categoryPills: {
      title: 'Categorías rápidas',
      body: 'Salta directo a vuelos, hoteles, autos o experiencias.',
    },
    sos: {
      title: 'SOS de emergencia',
      body: 'Mantén pulsado SOS en una emergencia — avisa a tu contacto de emergencia con tu ubicación.',
    },
    checkin: {
      title: 'Avisos de seguridad',
      body: 'Los avisos programados permiten a tus seres queridos saber que estás a salvo.',
    },
    rewards: {
      title: 'Gana recompensas',
      body: 'Estás ganando puntos — invita a amigos para ganar más rápido.',
    },
    aiVisionLive: {
      title: 'AI Vision en vivo',
      body: 'Prueba el modo Live — apunta la cámara y habla con Guidera en tiempo real.',
    },
    dmGuides: {
      title: 'Escribe a los guías',
      body: 'Puedes escribir a los guías directamente antes de reservar.',
    },
    expenseScan: {
      title: 'Escanea recibos',
      body: 'Sin escribir — escanea el recibo y lo registramos.',
    },
  },
  prompts: {
    home_airport: {
      fact: '✈️ Buscaste desde {{value}}',
      benefit: 'Defínelo como tu aeropuerto base — las búsquedas futuras lo completarán solas.',
    },
    origin_city: {
      fact: '📍 Viajas desde {{value}}',
      benefit: 'Guárdalo como tu ciudad base para snapshots más rápidos.',
    },
    passport_country: {
      fact: '🛂 ¿Pasaporte de {{value}}?',
      benefit: 'Adaptaremos los requisitos de visado y entrada en consecuencia.',
    },
    defaultCompanionType: {
      fact: '👥 ¿Viajas como {{value}}?',
      benefit: 'Hazlo tu grupo predeterminado — los planes se ajustan solos.',
    },
    spendingStyle: {
      fact: '💰 Tu estilo de presupuesto parece {{value}}',
      benefit: 'Guárdalo para que las recomendaciones se ajusten a tus gastos.',
    },
    flightClass: {
      fact: '💺 Prefieres clase {{value}}',
      benefit: 'Defínela por defecto para búsquedas de vuelos más rápidas.',
    },
    flightStops: {
      fact: '🔁 Prefieres vuelos {{value}}',
      benefit: 'Guárdalo para filtrar vuelos automáticamente.',
    },
    defaultCurrency: {
      fact: '💱 Usas sobre todo {{value}}',
      benefit: 'Hazla tu moneda predeterminada en toda la app.',
    },
    preferredTripStyles: {
      fact: '🧭 Te inclinas por viajes {{value}}',
      benefit: 'Añádelo a tu estilo de viaje para mejores planes.',
    },
    interests: {
      fact: '✨ ¿Te interesa {{value}}?',
      benefit: 'Añádelo a tus intereses para personalizar las recomendaciones.',
    },
    accommodationType: {
      fact: '🏨 Prefieres estancias {{value}}',
      benefit: 'Guárdalo para que los resultados de hoteles se ajusten a tu gusto.',
    },
    minStarRating: {
      fact: '⭐ Filtras estancias de {{value}}★+',
      benefit: 'Defínelo como tu estándar de calidad hotelera.',
    },
    dietaryRestrictions: {
      fact: '🥗 ¿Necesidad alimentaria: {{value}}?',
      benefit: 'Añádelo para que marquemos comidas y restaurantes seguros.',
    },
    cuisinePreferences: {
      fact: '🍽️ Disfrutas la cocina {{value}}',
      benefit: 'Guárdalo para obtener mejores recomendaciones gastronómicas.',
    },
    spiceTolerance: {
      fact: '🌶️ ¿Nivel de picante: {{value}}?',
      benefit: 'Guárdalo para ajustar las sugerencias de comida.',
    },
    medicalConditions: {
      fact: '🩺 ¿Nota de salud: {{value}}?',
      benefit: 'Añádelo para que los informes de seguridad lo tengan en cuenta.',
    },
    preferredAmenities: {
      fact: '🛎️ Buscas {{value}}',
      benefit: 'Guarda los servicios imprescindibles para tus búsquedas de hoteles.',
    },
    languages: {
      fact: '🗣️ ¿Hablas {{value}}?',
      benefit: 'Añádelo a tus idiomas para mejores consejos locales.',
    },
  },
  hub: {
    title: 'Perfil de viaje',
    ringLabel: 'Perfil',
    tierGettingStarted: 'Para empezar',
    tierLookingGood: 'Va tomando forma',
    tierTravelReady: 'Listo para viajar ✦',
    quickWins: 'Logros rápidos',
    quickWinsSubtitle: 'Unos toques para un perfil más inteligente',
    suggestions: 'Sugerencias para revisar',
    suggestionsEmpty: 'Nada que revisar por ahora.',
    editFull: 'Editar el perfil de viaje completo',
    why: 'Por qué importa',
    whyBody:
      'Tus Smart Plans, listas de equipaje e informes de seguridad se personalizan a partir de este perfil.',
    confirm: 'Confirmar',
    deny: 'Descartar',
    privacyOff:
      'Las sugerencias de perfil están desactivadas. Actívalas en los ajustes de privacidad para enriquecer tu perfil mientras exploras.',
    homeNudgeTitle: 'Haz tuyo Guidera',
    homeNudgeBody:
      'Tus viajes se vuelven más inteligentes cuando Guidera te conoce — 2 minutos para un perfil más completo.',
    homeNudgeCta: 'Mejorar perfil',
  },
  settings: {
    profileSuggestions: 'Sugerencias de perfil',
    profileSuggestionsDesc: 'Deja que Guidera sugiera detalles de perfil mientras exploras.',
    walkthrough: 'Tutorial de la app',
    walkthroughDesc: 'Volver a ver los recorridos guiados.',
  },
  replay: {
    title: 'Tutorial de la app',
    subtitle: 'Vuelve a ver cualquier recorrido guiado.',
    hero: 'Conceptos básicos de la app',
    trips: 'Viajes',
    tripDetail: 'Herramientas de viaje',
    connect: 'Connect',
    journeys: 'Journeys',
    search: 'Búsqueda',
    replay: 'Volver a ver',
  },
};

export default guidance;
