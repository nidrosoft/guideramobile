// Guidance System copy (Italian).
const guidance = {
  common: {
    next: 'Avanti',
    back: 'Indietro',
    skip: 'Salta',
    finish: 'Fine',
    gotIt: 'Capito',
    notNow: 'Non ora',
    save: 'Salva',
    dontSuggest: 'Non suggerire più',
    stepOf: 'Passo {{current}} di {{total}}',
  },
  tours: {
    hero: {
      welcome: {
        title: 'Ti diamo il benvenuto su Guidera 👋',
        body: 'Questo tour rapido ti mostra l’essenziale — circa 30 secondi. Puoi saltarlo quando vuoi.',
      },
      search: {
        title: 'Anteprima di qualsiasi viaggio in un attimo',
        body: 'Cerca una città per ottenere un Trip Snapshot — costi stimati, meteo, info sui visti e un assaggio del viaggio prima di decidere.',
      },
      deals: {
        title: 'Offerte scelte per te',
        body: 'Le offerte di voli ed esperienze si aggiornano tutto il giorno. Tocca Vedi tutto per sfogliare per categoria.',
      },
      journeys: {
        title: 'Viaggia con uno scopo',
        body: 'I Journeys sono dossier documentati sul motivo del tuo viaggio — trasferimento, salute, studio, lavoro da remoto e altro.',
      },
      launcher: {
        title: 'I tuoi strumenti vivono qui',
        body: 'Esplora le città, scansiona i menu con AI Vision, ricevi avvisi di sicurezza, scansiona ricevute e biglietti, o chiedi qualsiasi cosa a Guidera AI.',
      },
      launcherSheet: {
        title: 'Sei strumenti, a un tocco',
        body: 'Prova AI Vision su un menu vero — lo traduce e compone persino il tuo ordine.',
      },
      trips: {
        title: 'Tutto inizia con un viaggio',
        body: 'Aggiungi o importa un viaggio per sbloccare Smart Plan: itinerario, bagagli, sicurezza, lingua, documenti, spese, diario, cosa fare e non fare e monitoraggio dei rimborsi.',
        cta: 'Configura il mio profilo di viaggio →',
      },
    },
    trips: {
      create: {
        title: 'Crea un viaggio in pochi secondi',
        body: 'Costruiscilo manualmente, oppure lascia che l’IA lo pianifichi per te.',
      },
      import: {
        title: 'Già prenotato? Importalo',
        body: 'Scansiona una carta d’imbarco o inoltra un’email di prenotazione — Guidera crea il viaggio automaticamente.',
      },
      states: {
        title: 'I viaggi si organizzano da soli',
        body: 'In arrivo, in corso, passati, bozze — ogni cosa al suo posto.',
        cta: 'Crea il mio primo viaggio',
      },
    },
    tripDetail: {
      smartPlan: {
        title: 'Un tocco, sei moduli',
        body: 'Smart Plan genera il tuo itinerario, la lista bagagli, il brief sulla sicurezza, il kit linguistico, la checklist dei documenti e le norme culturali — personalizzati per te.',
      },
      modules: {
        title: 'Il centro di controllo del tuo viaggio',
        body: 'Tieni traccia delle spese, scrivi un diario e monitora i rimborsi dei voli — ogni scheda è uno strumento completo.',
      },
      invite: {
        title: 'Viaggiate insieme',
        body: 'Invita i compagni a visualizzare e modificare questo viaggio con te.',
      },
      snapshot: {
        title: 'Sai prima di partire',
        body: 'Lo snapshot mantiene costi, meteo e avvisi in tempo reale per questa destinazione.',
        cta: 'Genera Smart Plan',
      },
    },
    connect: {
      tabs: {
        title: 'Trova la tua gente',
        body: 'Scopri viaggiatori, unisciti a gruppi, incontra guide locali e trova eventi ovunque tu vada.',
      },
      pulse: {
        title: 'Pulse: la vita intorno a te',
        body: 'Guarda l’attività dei viaggiatori e gli incontri in tempo reale sulla mappa — come il battito della città.',
      },
      guides: {
        title: 'Conosci la zona? Diventa guida',
        body: 'Le persone del posto possono candidarsi per guidare i viaggiatori e guadagnare.',
      },
    },
    journeys: {
      categories: {
        title: 'Scegli il tuo motivo',
        body: 'Ogni tipo di journey riceve un dossier di livello professionale: costi, requisiti, tempistiche, fornitori.',
      },
      briefing: {
        title: 'I briefing sono personali',
        body: 'Dicci dove, a che punto sei e chi viene con te — generiamo un brief solo per il tuo caso.',
      },
    },
    search: {
      input: {
        title: 'Cerca come pensi',
        body: 'Digita una città, un paese, o anche «caldo a dicembre».',
      },
      snapshotHint: {
        title: 'Ottieni il quadro completo',
        body: 'Selezionare una destinazione crea un Trip Snapshot — costi, voli, meteo, sicurezza — prima ancora di pianificare qualcosa.',
      },
    },
  },
  tips: {
    savedItems: {
      title: 'Elementi salvati',
      body: 'I tuoi elementi salvati sono qui — destinazioni, offerte, guide.',
    },
    inbox: {
      title: 'La tua posta in arrivo',
      body: 'Gli avvisi di viaggio e i messaggi arrivano nella tua posta in arrivo.',
    },
    tripReminder: {
      title: 'Il tuo prossimo viaggio',
      body: 'Il tuo prossimo viaggio ti segue qui — tocca per il conto alla rovescia e le azioni rapide.',
    },
    categoryPills: {
      title: 'Categorie rapide',
      body: 'Vai dritto a voli, hotel, auto o esperienze.',
    },
    sos: {
      title: 'SOS di emergenza',
      body: 'Tieni premuto SOS in caso di emergenza — avvisa il tuo contatto di emergenza con la tua posizione.',
    },
    checkin: {
      title: 'Check-in di sicurezza',
      body: 'I check-in programmati fanno sapere ai tuoi cari che sei al sicuro.',
    },
    rewards: {
      title: 'Guadagna premi',
      body: 'Stai accumulando punti — invita gli amici per guadagnare più in fretta.',
    },
    aiVisionLive: {
      title: 'AI Vision in diretta',
      body: 'Prova la modalità Live — punta la fotocamera e parla con Guidera in tempo reale.',
    },
    dmGuides: {
      title: 'Scrivi alle guide',
      body: 'Puoi scrivere alle guide direttamente prima di prenotare.',
    },
    expenseScan: {
      title: 'Scansiona le ricevute',
      body: 'Niente da digitare — scansiona la ricevuta e la registriamo noi.',
    },
  },
  prompts: {
    home_airport: {
      fact: '✈️ Hai cercato da {{value}}',
      benefit:
        'Impostalo come aeroporto di riferimento — le ricerche future lo compileranno da sole.',
    },
    origin_city: {
      fact: '📍 Stai viaggiando da {{value}}',
      benefit: 'Salvala come città di riferimento per snapshot più rapidi.',
    },
    passport_country: {
      fact: '🛂 Passaporto da {{value}}?',
      benefit: 'Adatteremo i requisiti di visto e ingresso di conseguenza.',
    },
    defaultCompanionType: {
      fact: '👥 Viaggi come {{value}}?',
      benefit: 'Rendilo il tuo gruppo predefinito — i piani si adattano in automatico.',
    },
    spendingStyle: {
      fact: '💰 Il tuo stile di budget sembra {{value}}',
      benefit: 'Salvalo così i suggerimenti corrispondono alle tue spese.',
    },
    flightClass: {
      fact: '💺 Preferisci la classe {{value}}',
      benefit: 'Impostala come predefinita per ricerche di voli più veloci.',
    },
    flightStops: {
      fact: '🔁 Preferisci voli {{value}}',
      benefit: 'Salvalo per filtrare i voli automaticamente.',
    },
    defaultCurrency: {
      fact: '💱 Usi soprattutto {{value}}',
      benefit: 'Rendila la tua valuta predefinita in tutta l’app.',
    },
    preferredTripStyles: {
      fact: '🧭 Tendi verso viaggi {{value}}',
      benefit: 'Aggiungilo al tuo stile di viaggio per piani migliori.',
    },
    interests: {
      fact: '✨ Ti interessa {{value}}?',
      benefit: 'Aggiungilo ai tuoi interessi per personalizzare i suggerimenti.',
    },
    accommodationType: {
      fact: '🏨 Preferisci soggiorni {{value}}',
      benefit: 'Salvalo così i risultati degli hotel corrispondono ai tuoi gusti.',
    },
    minStarRating: {
      fact: '⭐ Filtri soggiorni da {{value}}★+',
      benefit: 'Impostalo come tuo standard di qualità alberghiera.',
    },
    dietaryRestrictions: {
      fact: '🥗 Esigenza alimentare: {{value}}?',
      benefit: 'Aggiungila così segnaliamo cibi e ristoranti adatti.',
    },
    cuisinePreferences: {
      fact: '🍽️ Ti piace la cucina {{value}}',
      benefit: 'Salvalo per ottenere suggerimenti gastronomici migliori.',
    },
    spiceTolerance: {
      fact: '🌶️ Livello di piccante: {{value}}?',
      benefit: 'Salvalo per adattare i suggerimenti sul cibo.',
    },
    medicalConditions: {
      fact: '🩺 Nota di salute: {{value}}?',
      benefit: 'Aggiungila così i brief sulla sicurezza ne tengono conto.',
    },
    preferredAmenities: {
      fact: '🛎️ Cerchi {{value}}',
      benefit: 'Salva i servizi indispensabili per le tue ricerche di hotel.',
    },
    languages: {
      fact: '🗣️ Parli {{value}}?',
      benefit: 'Aggiungile alle tue lingue per consigli locali migliori.',
    },
  },
  hub: {
    title: 'Profilo di viaggio',
    ringLabel: 'Profilo',
    tierGettingStarted: 'Per iniziare',
    tierLookingGood: 'Sta prendendo forma',
    tierTravelReady: 'Pronto a viaggiare ✦',
    quickWins: 'Risultati rapidi',
    quickWinsSubtitle: 'Pochi tocchi per un profilo più intelligente',
    suggestions: 'Suggerimenti da rivedere',
    suggestionsEmpty: 'Niente da rivedere al momento.',
    editFull: 'Modifica il profilo di viaggio completo',
    why: 'Perché è importante',
    whyBody:
      'I tuoi Smart Plan, le liste bagagli e i brief sulla sicurezza sono personalizzati a partire da questo profilo.',
    confirm: 'Conferma',
    deny: 'Ignora',
    privacyOff:
      'I suggerimenti del profilo sono disattivati. Attivali nelle impostazioni sulla privacy per costruire il tuo profilo mentre esplori.',
    homeNudgeTitle: 'Rendi Guidera tuo',
    homeNudgeBody:
      'I tuoi viaggi diventano più intelligenti quando Guidera ti conosce — 2 minuti per un profilo più ricco.',
    homeNudgeCta: 'Migliora il profilo',
  },
  settings: {
    profileSuggestions: 'Suggerimenti del profilo',
    profileSuggestionsDesc: 'Lascia che Guidera suggerisca dettagli del profilo mentre esplori.',
    walkthrough: 'Tour dell’app',
    walkthroughDesc: 'Riproduci di nuovo i tour guidati.',
  },
  replay: {
    title: 'Tour dell’app',
    subtitle: 'Riproduci di nuovo qualsiasi tour guidato.',
    hero: 'Nozioni di base dell’app',
    trips: 'Viaggi',
    tripDetail: 'Strumenti di viaggio',
    connect: 'Connect',
    journeys: 'Journeys',
    search: 'Ricerca',
    replay: 'Riproduci',
  },
};

export default guidance;
