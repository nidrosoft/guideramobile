// Guidance System copy (Brazilian Portuguese).
const guidance = {
  common: {
    next: 'Avançar',
    back: 'Voltar',
    skip: 'Pular',
    finish: 'Concluir',
    gotIt: 'Entendi',
    notNow: 'Agora não',
    save: 'Salvar',
    dontSuggest: 'Não sugerir de novo',
    stepOf: 'Etapa {{current}} de {{total}}',
  },
  tours: {
    hero: {
      welcome: {
        title: 'Boas-vindas ao Guidera 👋',
        body: 'Este tour rápido mostra o essencial — cerca de 30 segundos. Você pode pular quando quiser.',
      },
      search: {
        title: 'Veja a prévia de qualquer viagem na hora',
        body: 'Pesquise qualquer cidade para obter um Trip Snapshot — custos estimados, clima, informações de visto e uma ideia da viagem antes de decidir.',
      },
      deals: {
        title: 'Ofertas escolhidas para você',
        body: 'As ofertas de voos e experiências são atualizadas o dia todo. Toque em Ver tudo para navegar por categoria.',
      },
      journeys: {
        title: 'Viaje com um propósito',
        body: 'Os Journeys são dossiês fundamentados sobre o motivo da sua viagem — mudança, saúde, estudos, trabalho remoto e muito mais.',
      },
      launcher: {
        title: 'Suas ferramentas ficam aqui',
        body: 'Explore cidades, escaneie cardápios com a AI Vision, receba alertas de segurança, escaneie recibos e ingressos, ou pergunte qualquer coisa ao Guidera AI.',
      },
      launcherSheet: {
        title: 'Seis ferramentas, a um toque',
        body: 'Experimente a AI Vision em um cardápio de verdade — ela traduz e até monta o seu pedido.',
      },
      trips: {
        title: 'Tudo começa com uma viagem',
        body: 'Adicione ou importe uma viagem para desbloquear o Smart Plan: roteiro, bagagem, segurança, idioma, documentos, gastos, diário, o que fazer e não fazer e acompanhamento de indenizações.',
        cta: 'Configurar meu perfil de viagem →',
      },
    },
    trips: {
      create: {
        title: 'Crie uma viagem em segundos',
        body: 'Monte manualmente, ou deixe a IA planejar para você.',
      },
      import: {
        title: 'Já reservou? Importe',
        body: 'Escaneie um cartão de embarque ou encaminhe um e-mail de reserva — o Guidera cria a viagem automaticamente.',
      },
      states: {
        title: 'As viagens se organizam sozinhas',
        body: 'Próximas, em andamento, passadas, rascunhos — cada coisa em seu lugar.',
        cta: 'Criar minha primeira viagem',
      },
    },
    tripDetail: {
      smartPlan: {
        title: 'Um toque, seis módulos',
        body: 'O Smart Plan gera seu roteiro, lista de bagagem, briefing de segurança, kit de idioma, checklist de documentos e dicas culturais — personalizados para você.',
      },
      modules: {
        title: 'A central de comando da sua viagem',
        body: 'Acompanhe gastos, mantenha um diário e monitore indenizações de voo — cada cartão é uma ferramenta completa.',
      },
      invite: {
        title: 'Viajem juntos',
        body: 'Convide companheiros para ver e editar esta viagem com você.',
      },
      snapshot: {
        title: 'Saiba antes de ir',
        body: 'O snapshot mantém custos, clima e alertas ao vivo para este destino.',
        cta: 'Gerar Smart Plan',
      },
    },
    connect: {
      tabs: {
        title: 'Encontre a sua turma',
        body: 'Descubra viajantes, entre em grupos, conheça guias locais e encontre eventos por onde você for.',
      },
      pulse: {
        title: 'Pulse: a vida ao seu redor',
        body: 'Veja a atividade dos viajantes e os encontros em tempo real no mapa — como o pulsar da cidade.',
      },
      guides: {
        title: 'Conhece o caminho? Seja um guia',
        body: 'Moradores locais podem se candidatar para guiar viajantes e ganhar dinheiro.',
      },
    },
    journeys: {
      categories: {
        title: 'Escolha o seu motivo',
        body: 'Cada tipo de journey recebe um dossiê de nível profissional: custos, requisitos, prazos, prestadores.',
      },
      briefing: {
        title: 'Os briefings são pessoais',
        body: 'Diga-nos para onde, em que etapa você está e quem vai com você — geramos um briefing só para o seu caso.',
      },
    },
    search: {
      input: {
        title: 'Pesquise como você pensa',
        body: 'Digite uma cidade, um país, ou até «calor em dezembro».',
      },
      snapshotHint: {
        title: 'Tenha o panorama completo',
        body: 'Selecionar um destino cria um Trip Snapshot — custos, voos, clima, segurança — antes de planejar qualquer coisa.',
      },
    },
  },
  tips: {
    savedItems: {
      title: 'Itens salvos',
      body: 'Seus itens salvos ficam aqui — destinos, ofertas, guias.',
    },
    inbox: {
      title: 'Sua caixa de entrada',
      body: 'Alertas de viagem e mensagens chegam na sua caixa de entrada.',
    },
    tripReminder: {
      title: 'Sua próxima viagem',
      body: 'Sua próxima viagem acompanha você aqui — toque para a contagem regressiva e as ações rápidas.',
    },
    categoryPills: {
      title: 'Categorias rápidas',
      body: 'Vá direto para voos, hotéis, carros ou experiências.',
    },
    sos: {
      title: 'SOS de emergência',
      body: 'Mantenha o SOS pressionado em uma emergência — ele avisa seu contato de emergência com a sua localização.',
    },
    checkin: {
      title: 'Check-ins de segurança',
      body: 'Check-ins agendados deixam quem você ama saber que você está em segurança.',
    },
    rewards: {
      title: 'Ganhe recompensas',
      body: 'Você está acumulando pontos — indique amigos para ganhar mais rápido.',
    },
    aiVisionLive: {
      title: 'AI Vision ao vivo',
      body: 'Experimente o modo Live — aponte a câmera e fale com o Guidera em tempo real.',
    },
    dmGuides: {
      title: 'Converse com guias',
      body: 'Você pode falar com os guias diretamente antes de reservar.',
    },
    expenseScan: {
      title: 'Escaneie recibos',
      body: 'Sem digitar — escaneie o recibo e nós registramos.',
    },
  },
  prompts: {
    home_airport: {
      fact: '✈️ Você pesquisou a partir de {{value}}',
      benefit: 'Defina como seu aeroporto base — buscas futuras o preenchem automaticamente.',
    },
    origin_city: {
      fact: '📍 Você está viajando de {{value}}',
      benefit: 'Salve como sua cidade base para snapshots mais rápidos.',
    },
    passport_country: {
      fact: '🛂 Passaporte de {{value}}?',
      benefit: 'Vamos adaptar os requisitos de visto e entrada de acordo.',
    },
    defaultCompanionType: {
      fact: '👥 Viajando como {{value}}?',
      benefit: 'Torne-o seu grupo padrão — os planos se ajustam automaticamente.',
    },
    spendingStyle: {
      fact: '💰 Seu estilo de orçamento parece {{value}}',
      benefit: 'Salve para que as recomendações combinem com seus gastos.',
    },
    flightClass: {
      fact: '💺 Você prefere a classe {{value}}',
      benefit: 'Defina como padrão para buscas de voos mais rápidas.',
    },
    flightStops: {
      fact: '🔁 Você prefere voos {{value}}',
      benefit: 'Salve para filtrar voos automaticamente.',
    },
    defaultCurrency: {
      fact: '💱 Usa principalmente {{value}}',
      benefit: 'Torne-a sua moeda padrão em todo o app.',
    },
    preferredTripStyles: {
      fact: '🧭 Você tende a viagens {{value}}',
      benefit: 'Adicione ao seu estilo de viagem para planos melhores.',
    },
    interests: {
      fact: '✨ Interesse em {{value}}?',
      benefit: 'Adicione aos seus interesses para personalizar as recomendações.',
    },
    accommodationType: {
      fact: '🏨 Você prefere estadias {{value}}',
      benefit: 'Salve para que os resultados de hotéis combinem com o seu gosto.',
    },
    minStarRating: {
      fact: '⭐ Você filtra estadias {{value}}★+',
      benefit: 'Defina como seu padrão de qualidade de hotel.',
    },
    dietaryRestrictions: {
      fact: '🥗 Necessidade alimentar: {{value}}?',
      benefit: 'Adicione para sinalizarmos comidas e restaurantes seguros.',
    },
    cuisinePreferences: {
      fact: '🍽️ Você curte a culinária {{value}}',
      benefit: 'Salve para receber recomendações gastronômicas melhores.',
    },
    spiceTolerance: {
      fact: '🌶️ Nível de pimenta: {{value}}?',
      benefit: 'Salve para ajustar as sugestões de comida.',
    },
    medicalConditions: {
      fact: '🩺 Nota de saúde: {{value}}?',
      benefit: 'Adicione para que os briefings de segurança considerem isso.',
    },
    preferredAmenities: {
      fact: '🛎️ Você procura {{value}}',
      benefit: 'Salve as comodidades indispensáveis para suas buscas de hotéis.',
    },
    languages: {
      fact: '🗣️ Você fala {{value}}?',
      benefit: 'Adicione aos seus idiomas para dicas locais melhores.',
    },
  },
  hub: {
    title: 'Perfil de viagem',
    ringLabel: 'Perfil',
    tierGettingStarted: 'Começando',
    tierLookingGood: 'Indo bem',
    tierTravelReady: 'Pronto para viajar ✦',
    quickWins: 'Conquistas rápidas',
    quickWinsSubtitle: 'Alguns toques para um perfil mais inteligente',
    suggestions: 'Sugestões para revisar',
    suggestionsEmpty: 'Nada para revisar no momento.',
    editFull: 'Editar o perfil de viagem completo',
    why: 'Por que isso importa',
    whyBody:
      'Seus Smart Plans, listas de bagagem e briefings de segurança são personalizados a partir deste perfil.',
    confirm: 'Confirmar',
    deny: 'Dispensar',
    privacyOff:
      'As sugestões de perfil estão desativadas. Ative-as nas configurações de privacidade para construir seu perfil enquanto explora.',
    homeNudgeTitle: 'Deixe o Guidera com a sua cara',
    homeNudgeBody:
      'Suas viagens ficam mais inteligentes quando o Guidera conhece você — 2 minutos para um perfil mais completo.',
    homeNudgeCta: 'Melhorar perfil',
  },
  settings: {
    profileSuggestions: 'Sugestões de perfil',
    profileSuggestionsDesc: 'Deixe o Guidera sugerir detalhes do perfil enquanto você explora.',
    walkthrough: 'Tour do app',
    walkthroughDesc: 'Reveja os tours guiados.',
  },
  replay: {
    title: 'Tour do app',
    subtitle: 'Reveja qualquer tour guiado.',
    hero: 'Noções básicas do app',
    trips: 'Viagens',
    tripDetail: 'Ferramentas de viagem',
    connect: 'Connect',
    journeys: 'Journeys',
    search: 'Pesquisa',
    replay: 'Rever',
  },
};

export default guidance;
