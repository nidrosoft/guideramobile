// Guidance System copy (French).
const guidance = {
  common: {
    next: 'Suivant',
    back: 'Retour',
    skip: 'Passer',
    finish: 'Terminer',
    gotIt: 'Compris',
    notNow: 'Pas maintenant',
    save: 'Enregistrer',
    dontSuggest: 'Ne plus suggérer',
    stepOf: 'Étape {{current}} sur {{total}}',
  },
  tours: {
    hero: {
      welcome: {
        title: 'Bienvenue sur Guidera 👋',
        body: 'Cette visite rapide vous montre l’essentiel — environ 30 secondes. Vous pouvez passer à tout moment.',
      },
      search: {
        title: 'Prévisualisez n’importe quel voyage instantanément',
        body: 'Recherchez une ville pour obtenir un Trip Snapshot — coûts estimés, météo, infos visa et un aperçu du voyage avant de vous engager.',
      },
      deals: {
        title: 'Des offres choisies pour vous',
        body: 'Les offres de vols et d’expériences se renouvellent toute la journée. Touchez Voir tout pour parcourir par catégorie.',
      },
      journeys: {
        title: 'Voyager pour une raison',
        body: 'Les Journeys sont des dossiers documentés sur la raison de votre voyage — déménagement, santé, études, travail à distance et plus encore.',
      },
      launcher: {
        title: 'Votre boîte à outils est ici',
        body: 'Naviguez dans les villes, scannez des menus avec AI Vision, recevez des alertes de sécurité, scannez reçus et billets, ou demandez n’importe quoi à Guidera AI.',
      },
      launcherSheet: {
        title: 'Six outils, à portée de doigt',
        body: 'Essayez AI Vision sur un vrai menu — il traduit et compose même votre commande.',
      },
      trips: {
        title: 'Tout commence par un voyage',
        body: 'Ajoutez ou importez un voyage pour débloquer Smart Plan : itinéraire, bagages, sécurité, langue, documents, dépenses, journal, à faire et à éviter, et suivi des indemnisations.',
        cta: 'Configurer mon profil de voyage →',
      },
    },
    trips: {
      create: {
        title: 'Créez un voyage en quelques secondes',
        body: 'Construisez-le manuellement, ou laissez l’IA le planifier pour vous.',
      },
      import: {
        title: 'Déjà réservé ? Importez-le',
        body: 'Scannez une carte d’embarquement ou transférez un e-mail de réservation — Guidera crée le voyage automatiquement.',
      },
      states: {
        title: 'Les voyages s’organisent tout seuls',
        body: 'À venir, en cours, passés, brouillons — chaque chose à sa place.',
        cta: 'Créer mon premier voyage',
      },
    },
    tripDetail: {
      smartPlan: {
        title: 'Un geste, six modules',
        body: 'Smart Plan génère votre itinéraire, votre liste de bagages, votre brief sécurité, votre kit linguistique, votre liste de documents et vos usages culturels — personnalisés pour vous.',
      },
      modules: {
        title: 'Le centre de commande de votre voyage',
        body: 'Suivez les dépenses, tenez un journal et surveillez les indemnisations de vol — chaque carte est un outil complet.',
      },
      invite: {
        title: 'Voyagez ensemble',
        body: 'Invitez des compagnons à consulter et modifier ce voyage avec vous.',
      },
      snapshot: {
        title: 'Sachez avant de partir',
        body: 'Le snapshot tient à jour les coûts, la météo et les alertes en direct pour cette destination.',
        cta: 'Générer un Smart Plan',
      },
    },
    connect: {
      tabs: {
        title: 'Trouvez vos compagnons',
        body: 'Découvrez des voyageurs, rejoignez des groupes, rencontrez des guides locaux et trouvez des événements partout où vous allez.',
      },
      pulse: {
        title: 'Pulse : la vie autour de vous',
        body: 'Voyez l’activité des voyageurs et les rencontres en temps réel sur la carte — comme le battement de cœur de la ville.',
      },
      guides: {
        title: 'Vous connaissez le coin ? Devenez guide',
        body: 'Les locaux peuvent postuler pour guider des voyageurs et gagner de l’argent.',
      },
    },
    journeys: {
      categories: {
        title: 'Choisissez votre raison',
        body: 'Chaque type de journey reçoit un dossier de qualité recherche : coûts, exigences, délais, prestataires.',
      },
      briefing: {
        title: 'Les briefings sont personnels',
        body: 'Dites-nous où, à quelle étape vous en êtes et qui vous accompagne — nous générons un brief rien que pour votre cas.',
      },
    },
    search: {
      input: {
        title: 'Cherchez comme vous pensez',
        body: 'Tapez une ville, un pays, ou même « au chaud en décembre ».',
      },
      snapshotHint: {
        title: 'Ayez une vue d’ensemble',
        body: 'Sélectionner une destination crée un Trip Snapshot — coûts, vols, météo, sécurité — avant même de planifier quoi que ce soit.',
      },
    },
  },
  tips: {
    savedItems: {
      title: 'Éléments enregistrés',
      body: 'Vos éléments enregistrés sont ici — destinations, offres, guides.',
    },
    inbox: {
      title: 'Votre boîte de réception',
      body: 'Les alertes de voyage et les messages arrivent dans votre boîte de réception.',
    },
    tripReminder: {
      title: 'Votre prochain voyage',
      body: 'Votre prochain voyage vous suit ici — touchez pour le compte à rebours et les actions rapides.',
    },
    categoryPills: {
      title: 'Catégories rapides',
      body: 'Accédez directement aux vols, hôtels, voitures ou expériences.',
    },
    sos: {
      title: 'SOS d’urgence',
      body: 'Maintenez SOS en cas d’urgence — il alerte votre contact d’urgence avec votre position.',
    },
    checkin: {
      title: 'Points de sécurité',
      body: 'Les points de contrôle programmés permettent à vos proches de savoir que vous êtes en sécurité.',
    },
    rewards: {
      title: 'Gagnez des récompenses',
      body: 'Vous accumulez des points — parrainez des amis pour gagner plus vite.',
    },
    aiVisionLive: {
      title: 'AI Vision en direct',
      body: 'Essayez le mode Live — pointez la caméra et parlez à Guidera en temps réel.',
    },
    dmGuides: {
      title: 'Contactez les guides',
      body: 'Vous pouvez contacter les guides directement avant de réserver.',
    },
    expenseScan: {
      title: 'Scannez les reçus',
      body: 'Ne tapez plus — scannez le reçu et nous l’enregistrons.',
    },
  },
  prompts: {
    home_airport: {
      fact: '✈️ Vous avez cherché depuis {{value}}',
      benefit:
        'Définissez-le comme aéroport de référence — les recherches futures le rempliront automatiquement.',
    },
    origin_city: {
      fact: '📍 Vous voyagez depuis {{value}}',
      benefit: 'Enregistrez-le comme ville de référence pour des snapshots plus rapides.',
    },
    passport_country: {
      fact: '🛂 Passeport de {{value}} ?',
      benefit: 'Nous adapterons les exigences de visa et d’entrée en conséquence.',
    },
    defaultCompanionType: {
      fact: '👥 Vous voyagez en tant que {{value}} ?',
      benefit: 'Faites-en votre équipe par défaut — les plans s’y adaptent automatiquement.',
    },
    spendingStyle: {
      fact: '💰 Votre style de budget semble {{value}}',
      benefit: 'Enregistrez-le pour que les recommandations correspondent à vos dépenses.',
    },
    flightClass: {
      fact: '💺 Vous préférez la classe {{value}}',
      benefit: 'Définissez-la par défaut pour des recherches de vols plus rapides.',
    },
    flightStops: {
      fact: '🔁 Vous préférez les vols {{value}}',
      benefit: 'Enregistrez-le pour filtrer les vols automatiquement.',
    },
    defaultCurrency: {
      fact: '💱 Vous utilisez surtout {{value}}',
      benefit: 'Faites-en votre devise par défaut dans toute l’app.',
    },
    preferredTripStyles: {
      fact: '🧭 Vous penchez vers les voyages {{value}}',
      benefit: 'Ajoutez-le à votre style de voyage pour de meilleurs plans.',
    },
    interests: {
      fact: '✨ Intéressé par {{value}} ?',
      benefit: 'Ajoutez-le à vos centres d’intérêt pour personnaliser les recommandations.',
    },
    accommodationType: {
      fact: '🏨 Vous préférez les séjours {{value}}',
      benefit: 'Enregistrez-le pour que les résultats d’hôtels correspondent à vos goûts.',
    },
    minStarRating: {
      fact: '⭐ Vous filtrez les séjours {{value}}★+',
      benefit: 'Définissez-le comme votre niveau de qualité hôtelière standard.',
    },
    dietaryRestrictions: {
      fact: '🥗 Besoin alimentaire : {{value}} ?',
      benefit: 'Ajoutez-le pour que nous signalions les aliments et restaurants adaptés.',
    },
    cuisinePreferences: {
      fact: '🍽️ Vous aimez la cuisine {{value}}',
      benefit: 'Enregistrez-le pour de meilleures recommandations culinaires.',
    },
    spiceTolerance: {
      fact: '🌶️ Niveau d’épices : {{value}} ?',
      benefit: 'Enregistrez-le pour adapter les suggestions culinaires.',
    },
    medicalConditions: {
      fact: '🩺 Note de santé : {{value}} ?',
      benefit: 'Ajoutez-le pour que les briefs de sécurité en tiennent compte.',
    },
    preferredAmenities: {
      fact: '🛎️ Vous recherchez {{value}}',
      benefit: 'Enregistrez vos équipements indispensables pour les recherches d’hôtels.',
    },
    languages: {
      fact: '🗣️ Vous parlez {{value}} ?',
      benefit: 'Ajoutez-le à vos langues pour de meilleurs conseils locaux.',
    },
  },
  hub: {
    title: 'Profil de voyage',
    ringLabel: 'Profil',
    tierGettingStarted: 'Pour commencer',
    tierLookingGood: 'Ça prend forme',
    tierTravelReady: 'Prêt à voyager ✦',
    quickWins: 'Gains rapides',
    quickWinsSubtitle: 'Quelques gestes pour un profil plus malin',
    suggestions: 'Suggestions à examiner',
    suggestionsEmpty: 'Rien à examiner pour le moment.',
    editFull: 'Modifier le profil de voyage complet',
    why: 'Pourquoi c’est important',
    whyBody:
      'Vos Smart Plans, listes de bagages et briefs de sécurité sont personnalisés à partir de ce profil.',
    confirm: 'Confirmer',
    deny: 'Ignorer',
    privacyOff:
      'Les suggestions de profil sont désactivées. Activez-les dans les paramètres de confidentialité pour enrichir votre profil au fil de vos explorations.',
    homeNudgeTitle: 'Faites de Guidera le vôtre',
    homeNudgeBody:
      'Vos voyages deviennent plus intelligents quand Guidera vous connaît — 2 minutes pour un profil plus riche.',
    homeNudgeCta: 'Améliorer le profil',
  },
  settings: {
    profileSuggestions: 'Suggestions de profil',
    profileSuggestionsDesc:
      'Laissez Guidera suggérer des détails de profil au fil de vos explorations.',
    walkthrough: 'Visite guidée de l’app',
    walkthroughDesc: 'Revoir les visites guidées.',
  },
  replay: {
    title: 'Visite guidée de l’app',
    subtitle: 'Revoir n’importe quelle visite guidée.',
    hero: 'Les bases de l’app',
    trips: 'Voyages',
    tripDetail: 'Outils de voyage',
    connect: 'Connect',
    journeys: 'Journeys',
    search: 'Recherche',
    replay: 'Revoir',
  },
};

export default guidance;
