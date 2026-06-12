// Guidance System copy (German).
const guidance = {
  common: {
    next: 'Weiter',
    back: 'Zurück',
    skip: 'Überspringen',
    finish: 'Fertig',
    gotIt: 'Verstanden',
    notNow: 'Nicht jetzt',
    save: 'Speichern',
    dontSuggest: 'Nicht mehr vorschlagen',
    stepOf: 'Schritt {{current}} von {{total}}',
  },
  tours: {
    hero: {
      welcome: {
        title: 'Willkommen bei Guidera 👋',
        body: 'Diese kurze Tour zeigt dir das Wichtigste — etwa 30 Sekunden. Du kannst jederzeit überspringen.',
      },
      search: {
        title: 'Jede Reise sofort vorschauen',
        body: 'Suche eine beliebige Stadt für einen Trip Snapshot — geschätzte Kosten, Wetter, Visa-Infos und ein Gefühl für die Reise, bevor du dich festlegst.',
      },
      deals: {
        title: 'Angebote, ausgewählt für dich',
        body: 'Flug- und Erlebnisangebote werden den ganzen Tag aktualisiert. Tippe auf Alle ansehen, um nach Kategorie zu stöbern.',
      },
      journeys: {
        title: 'Reisen mit einem Ziel',
        body: 'Journeys sind fundierte Dossiers zum Grund deiner Reise — Umzug, Gesundheit, Studium, Remote-Arbeit und mehr.',
      },
      launcher: {
        title: 'Hier wohnen deine Tools',
        body: 'Erkunde Städte, scanne Speisekarten mit AI Vision, erhalte Sicherheitswarnungen, scanne Belege und Tickets, oder frage Guidera AI alles.',
      },
      launcherSheet: {
        title: 'Sechs Tools, nur einen Tipp entfernt',
        body: 'Probiere AI Vision an einer echten Speisekarte aus — es übersetzt und stellt sogar deine Bestellung zusammen.',
      },
      trips: {
        title: 'Alles beginnt mit einer Reise',
        body: 'Füge eine Reise hinzu oder importiere sie, um Smart Plan freizuschalten: Reiseplan, Packliste, Sicherheit, Sprache, Dokumente, Ausgaben, Tagebuch, Dos & Don’ts und Entschädigungs-Tracking.',
        cta: 'Mein Reiseprofil einrichten →',
      },
    },
    trips: {
      create: {
        title: 'Erstelle eine Reise in Sekunden',
        body: 'Erstelle sie manuell, oder lass die KI sie für dich planen.',
      },
      import: {
        title: 'Schon gebucht? Importiere sie',
        body: 'Scanne eine Bordkarte oder leite eine Buchungs-E-Mail weiter — Guidera erstellt die Reise automatisch.',
      },
      states: {
        title: 'Reisen organisieren sich selbst',
        body: 'Bevorstehend, laufend, vergangen, Entwürfe — alles an seinem Platz.',
        cta: 'Meine erste Reise erstellen',
      },
    },
    tripDetail: {
      smartPlan: {
        title: 'Ein Tipp, sechs Module',
        body: 'Smart Plan erstellt deinen Reiseplan, deine Packliste, dein Sicherheits-Briefing, dein Sprachpaket, deine Dokumenten-Checkliste und kulturelle Dos & Don’ts — auf dich zugeschnitten.',
      },
      modules: {
        title: 'Die Kommandozentrale deiner Reise',
        body: 'Verfolge Ausgaben, führe ein Tagebuch und behalte Flugentschädigungen im Blick — jede Karte ist ein vollständiges Tool.',
      },
      invite: {
        title: 'Gemeinsam reisen',
        body: 'Lade Begleiter ein, diese Reise mit dir anzusehen und zu bearbeiten.',
      },
      snapshot: {
        title: 'Wissen, bevor du losziehst',
        body: 'Der Snapshot hält Kosten, Wetter und Warnungen für dieses Reiseziel live bereit.',
        cta: 'Smart Plan erstellen',
      },
    },
    connect: {
      tabs: {
        title: 'Finde deine Leute',
        body: 'Entdecke Reisende, tritt Gruppen bei, triff lokale Guides und finde Events, wohin du auch reist.',
      },
      pulse: {
        title: 'Pulse: live um dich herum',
        body: 'Sieh dir die Aktivität von Reisenden und Treffen in Echtzeit auf der Karte an — wie der Herzschlag der Stadt.',
      },
      guides: {
        title: 'Kennst du dich aus? Werde Guide',
        body: 'Einheimische können sich bewerben, Reisende zu führen und dabei zu verdienen.',
      },
    },
    journeys: {
      categories: {
        title: 'Wähle deinen Grund',
        body: 'Jeder Journey-Typ erhält ein recherchefundiertes Dossier: Kosten, Anforderungen, Zeitpläne, Anbieter.',
      },
      briefing: {
        title: 'Briefings sind persönlich',
        body: 'Sag uns wohin, in welcher Phase du bist und wer mitkommt — wir erstellen ein Briefing nur für deinen Fall.',
      },
    },
    search: {
      input: {
        title: 'Suche, wie du denkst',
        body: 'Tippe eine Stadt, ein Land, oder sogar „warm im Dezember“.',
      },
      snapshotHint: {
        title: 'Hol dir das ganze Bild',
        body: 'Die Auswahl eines Reiseziels erstellt einen Trip Snapshot — Kosten, Flüge, Wetter, Sicherheit — bevor du irgendetwas planst.',
      },
    },
  },
  tips: {
    savedItems: {
      title: 'Gespeicherte Einträge',
      body: 'Deine gespeicherten Einträge sind hier — Reiseziele, Angebote, Guides.',
    },
    inbox: {
      title: 'Dein Posteingang',
      body: 'Reisewarnungen und Nachrichten landen in deinem Posteingang.',
    },
    tripReminder: {
      title: 'Deine nächste Reise',
      body: 'Deine nächste Reise begleitet dich hier — tippe für den Countdown und Schnellaktionen.',
    },
    categoryPills: {
      title: 'Schnellkategorien',
      body: 'Springe direkt zu Flügen, Hotels, Autos oder Erlebnissen.',
    },
    sos: {
      title: 'Notfall-SOS',
      body: 'Halte SOS im Notfall gedrückt — es alarmiert deinen Notfallkontakt mit deinem Standort.',
    },
    checkin: {
      title: 'Sicherheits-Check-ins',
      body: 'Geplante Check-ins lassen deine Liebsten wissen, dass du in Sicherheit bist.',
    },
    rewards: {
      title: 'Belohnungen verdienen',
      body: 'Du sammelst Punkte — wirb Freunde an, um schneller zu verdienen.',
    },
    aiVisionLive: {
      title: 'Live AI Vision',
      body: 'Probiere den Live-Modus — richte die Kamera aus und sprich in Echtzeit mit Guidera.',
    },
    dmGuides: {
      title: 'Guides anschreiben',
      body: 'Du kannst Guides vor der Buchung direkt anschreiben.',
    },
    expenseScan: {
      title: 'Belege scannen',
      body: 'Kein Tippen — scanne den Beleg und wir erfassen ihn.',
    },
  },
  prompts: {
    home_airport: {
      fact: '✈️ Du hast von {{value}} aus gesucht',
      benefit: 'Lege ihn als Heimatflughafen fest — künftige Suchen füllen ihn automatisch aus.',
    },
    origin_city: {
      fact: '📍 Du reist von {{value}} aus',
      benefit: 'Speichere sie als Heimatstadt für schnellere Snapshots.',
    },
    passport_country: {
      fact: '🛂 Reisepass aus {{value}}?',
      benefit: 'Wir passen Visa- und Einreisebestimmungen entsprechend an.',
    },
    defaultCompanionType: {
      fact: '👥 Unterwegs als {{value}}?',
      benefit: 'Mach es zu deiner Standardgruppe — Pläne passen sich automatisch an.',
    },
    spendingStyle: {
      fact: '💰 Dein Budget-Stil wirkt {{value}}',
      benefit: 'Speichere ihn, damit Empfehlungen zu deinen Ausgaben passen.',
    },
    flightClass: {
      fact: '💺 Du bevorzugst {{value}} Klasse',
      benefit: 'Lege sie als Standard für schnellere Flugsuchen fest.',
    },
    flightStops: {
      fact: '🔁 Du bevorzugst {{value}} Flüge',
      benefit: 'Speichere es, um Flüge automatisch zu filtern.',
    },
    defaultCurrency: {
      fact: '💱 Du nutzt meist {{value}}',
      benefit: 'Mach sie zu deiner Standardwährung in der ganzen App.',
    },
    preferredTripStyles: {
      fact: '🧭 Du tendierst zu {{value}} Reisen',
      benefit: 'Füge es deinem Reisestil hinzu für bessere Pläne.',
    },
    interests: {
      fact: '✨ Interesse an {{value}}?',
      benefit: 'Füge es deinen Interessen hinzu, um Empfehlungen zu personalisieren.',
    },
    accommodationType: {
      fact: '🏨 Du bevorzugst {{value}} Unterkünfte',
      benefit: 'Speichere es, damit Hotelergebnisse deinem Geschmack entsprechen.',
    },
    minStarRating: {
      fact: '⭐ Du filterst nach {{value}}★+ Unterkünften',
      benefit: 'Lege es als deinen Standard für Hotelqualität fest.',
    },
    dietaryRestrictions: {
      fact: '🥗 Ernährungsbedarf: {{value}}?',
      benefit: 'Füge es hinzu, damit wir sichere Speisen und Restaurants kennzeichnen.',
    },
    cuisinePreferences: {
      fact: '🍽️ Du magst {{value}} Küche',
      benefit: 'Speichere es für bessere Essensempfehlungen.',
    },
    spiceTolerance: {
      fact: '🌶️ Schärfegrad: {{value}}?',
      benefit: 'Speichere ihn, um Essensvorschläge anzupassen.',
    },
    medicalConditions: {
      fact: '🩺 Gesundheitshinweis: {{value}}?',
      benefit: 'Füge ihn hinzu, damit Sicherheits-Briefings ihn berücksichtigen.',
    },
    preferredAmenities: {
      fact: '🛎️ Du suchst nach {{value}}',
      benefit: 'Speichere deine unverzichtbaren Ausstattungen für Hotelsuchen.',
    },
    languages: {
      fact: '🗣️ Sprichst du {{value}}?',
      benefit: 'Füge sie deinen Sprachen hinzu für bessere lokale Tipps.',
    },
  },
  hub: {
    title: 'Reiseprofil',
    ringLabel: 'Profil',
    tierGettingStarted: 'Erste Schritte',
    tierLookingGood: 'Sieht gut aus',
    tierTravelReady: 'Reisebereit ✦',
    quickWins: 'Schnelle Erfolge',
    quickWinsSubtitle: 'Ein paar Tipps zu einem smarteren Profil',
    suggestions: 'Vorschläge zum Prüfen',
    suggestionsEmpty: 'Im Moment nichts zu prüfen.',
    editFull: 'Vollständiges Reiseprofil bearbeiten',
    why: 'Warum das wichtig ist',
    whyBody:
      'Deine Smart Plans, Packlisten und Sicherheits-Briefings werden aus diesem Profil personalisiert.',
    confirm: 'Bestätigen',
    deny: 'Verwerfen',
    privacyOff:
      'Profilvorschläge sind deaktiviert. Aktiviere sie in den Datenschutzeinstellungen, um dein Profil beim Erkunden aufzubauen.',
    homeNudgeTitle: 'Mach Guidera zu deinem',
    homeNudgeBody:
      'Deine Reisen werden smarter, wenn Guidera dich kennt — 2 Minuten für ein reicheres Profil.',
    homeNudgeCta: 'Profil verbessern',
  },
  settings: {
    profileSuggestions: 'Profilvorschläge',
    profileSuggestionsDesc: 'Lass Guidera beim Erkunden Profildetails vorschlagen.',
    walkthrough: 'App-Rundgang',
    walkthroughDesc: 'Die geführten Touren erneut abspielen.',
  },
  replay: {
    title: 'App-Rundgang',
    subtitle: 'Spiele jede geführte Tour erneut ab.',
    hero: 'App-Grundlagen',
    trips: 'Reisen',
    tripDetail: 'Reise-Tools',
    connect: 'Connect',
    journeys: 'Journeys',
    search: 'Suche',
    replay: 'Erneut abspielen',
  },
};

export default guidance;
