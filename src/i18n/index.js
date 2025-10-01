import { createI18n } from "vue-i18n";

// Supported locales
export const LANGUAGE_OPTIONS = [
  { code: "en", flag: "🇺🇸", name: "English", shortName: "EN" },
  { code: "fr", flag: "🇫🇷", name: "Français", shortName: "FR" },
  { code: "de", flag: "🇩🇪", name: "Deutsch", shortName: "DE" },
];

// Translation messages
const messages = {
  en: {
    nav: {
      title: "Defile Bird Forecasts",

      settings: "Settings",
    },
    intro: {
      title: "Welcome to Defile Bird Forecasts",
      description:
        "This website provides daily migration forecasts for the count of raptor species at the Défilé de l'Ecluse, based on a",
      neuralNetwork: "neural network model",
      checkActualCount: "Check out the actual count on",
      readMore: "and read more about this history of this project (in French) on the website of",
    },
    table: {
      title: "Today's Predictions by Species",
      species: "Species",
      observed: "Observed",
      counted: "Counted",
      predicted: "Predicted",
      historical: "Historical Median",
      quantile: "Quantile",
      explanation: {
        title: "Table columns explained",
        species: "Bird species name",
        observed: "Observed total so far species (live data if available)",
        predicted: "Predicted total number of individuals expected species (from 6am to 7pm)",
        quantile:
          "How species's prediction compares to past years (e.g., 90th means higher than 90% of previous years for this date)",
        historicalMedian: "Typical (median) count for this date in past years",
      },
    },
    plots: {
      hourlyPrediction: "Hourly Prediction",
      expandAll: "Expand All",
      collapseAll: "Collapse All",
      today: "Today",
      nextDays: "Next Days",
      season: "This season...",
      species: "Species",
      noForecastData: "No forecast data available",
      predictedTotal: "Predicted Total",
      observedTotal: "Observed Total",
      quantileRange: "20-80% Quantile",
      median: "Median",
      dailyCount: "Daily Count",
      date: "Date",
      hour: "Hour",
      forecast: "Forecast",
      trektellenObservations: "Trektellen Observations",
      forecastedCounts: "Forecasted individual counts (#)",
      historicalCounts: "Historical counts (#)",
      birds: "birds",
      futureDays: "Future Days (hourly sequence)",
      hourlyForecastCount: "Hourly forecast count",
    },
    settings: {
      title: "Settings",
      plotsToDisplay: "Plots to display",
      today: "Today",
      nextDays: "Next Days",
      season: "Season",
      threshold: "Historical median count threshold",
      thresholdHelp:
        "Only species with a higher historical median daily count for the day will be displayed",
      nextDaysCount: "Number of next days to display",
      nextDaysHelp: 'Number of days after today to show in the "Next Days" forecast',
      sortBy: "Sort species by",
      taxonomy: "Taxonomy",
      median: "Median count",
      predicted: "Predicted count",
      quantile: "Quantile predicted",
    },
    weather: {
      title: "Weather Forecast",
      variable: "Variable:",
      days: "Days:",
    },
    common: {
      loading: "Loading",
      previousDay: "Previous day",
      nextDay: "Next day",
      today: "Today",
      close: "Close",
    },
    species: {
      "Common Buzzard": "Common Buzzard",
      "Red Kite": "Red Kite",
      "Black Kite": "Black Kite",
      "European Honey-buzzard": "European Honey-buzzard",
      "Western Marsh Harrier": "Western Marsh Harrier",
      "Eurasian Sparrowhawk": "Eurasian Sparrowhawk",
      "Eurasian Kestrel": "Eurasian Kestrel",
      "Osprey": "Osprey",
      "Hen Harrier": "Hen Harrier",
      "Merlin": "Merlin",
      "Eurasian Hobby": "Eurasian Hobby",
    },
  },
  fr: {
    nav: {
      title: "Prévisions d'Oiseaux du Défilé",
      settings: "Paramètres",
    },
    intro: {
      title: "Bienvenue aux Prévisions d'Oiseaux du Défilé",
      description:
        "Ce site web fournit des prévisions quotidiennes de migration pour le comptage des espèces de rapaces au Défilé de l'Ecluse, basées sur un",
      neuralNetwork: "modèle de réseau neuronal",
      checkActualCount: "Consultez le comptage réel sur",
      readMore: "et lisez-en plus sur l'histoire de ce projet sur le site web de",
    },
    table: {
      title: "Prévisions d'Aujourd'hui par Espèce",
      species: "Espèces",
      observed: "Observé",
      counted: "Comptées",
      predicted: "Prédites",
      historical: "Médiane Historique",
      quantile: "Quantile",
      explanation: {
        title: "Explication des colonnes du tableau",
        species: "Nom de l'espèce d'oiseau",
        observed: "Total observé jusqu'à présent pour l'espèce (données en direct si disponibles)",
        predicted: "Nombre total prédit d'individus attendus pour l'espèce (de 6h à 19h)",
        quantile:
          "Comment la prédiction de l'espèce se compare aux années passées (ex: 90e signifie plus élevé que 90% des années précédentes pour cette date)",
        historicalMedian: "Comptage typique (médian) pour cette date dans les années passées",
      },
    },
    plots: {
      hourlyPrediction: "Prévision Horaire",
      expandAll: "Tout Développer",
      collapseAll: "Tout Réduire",
      today: "Aujourd'hui",
      nextDays: "Prochains Jours",
      season: "Cette saison...",
      species: "Espèces",
      noForecastData: "Aucune donnée de prévision disponible",
      predictedTotal: "Total Prédit",
      observedTotal: "Total Observé",
      quantileRange: "Quantile 20-80%",
      median: "Médiane",
      dailyCount: "Comptage Quotidien",
      date: "Date",
      hour: "Heure",
      forecast: "Prévision",
      trektellenObservations: "Observations Trektellen",
      forecastedCounts: "Comptes individuels prédits (#)",
      historicalCounts: "Comptes historiques (#)",
      birds: "oiseaux",
      futureDays: "Jours futurs (séquence horaire)",
      hourlyForecastCount: "Comptage prévisionnel horaire",
    },
    settings: {
      title: "Paramètres",
      plotsToDisplay: "Graphiques à afficher",
      today: "Aujourd'hui",
      nextDays: "Prochains Jours",
      season: "Saison",
      threshold: "Seuil de comptage médian historique",
      thresholdHelp:
        "Seules les espèces avec un comptage quotidien médian historique plus élevé pour le jour seront affichées",
      nextDaysCount: "Nombre de prochains jours à afficher",
      nextDaysHelp:
        'Nombre de jours après aujourd\'hui à montrer dans la prévision "Prochains Jours"',
      sortBy: "Trier les espèces par",
      taxonomy: "Taxonomie",
      median: "Comptage médian",
      predicted: "Comptage prédit",
      quantile: "Quantile prédit",
    },
    weather: {
      title: "Prévisions Météorologiques",
      variable: "Variable:",
      days: "Jours:",
    },
    common: {
      loading: "Chargement",
      previousDay: "Jour précédent",
      nextDay: "Jour suivant",
      today: "Aujourd'hui",
      close: "Fermer",
    },
    species: {
      "Common Buzzard": "Buse variable",
      "Red Kite": "Milan royal",
      "Black Kite": "Milan noir",
      "European Honey-buzzard": "Bondrée apivore",
      "Western Marsh Harrier": "Busard des roseaux",
      "Eurasian Sparrowhawk": "Épervier d'Europe",
      "Eurasian Kestrel": "Faucon crécerelle",
      "Osprey": "Balbuzard pêcheur",
      "Hen Harrier": "Busard Saint-Martin",
      "Merlin": "Faucon émerillon",
      "Eurasian Hobby": "Faucon hobereau",
    },
  },
  de: {
    nav: {
      title: "Defile Vogelprognosen",
      settings: "Einstellungen",
    },
    intro: {
      title: "Willkommen bei Defile Vogelprognosen",
      description:
        "Diese Website bietet tägliche Migrationsprognosen für die Zählung von Greifvogelarten am Défilé de l'Ecluse, basierend auf einem",
      neuralNetwork: "neuronalen Netzwerkmodell",
      checkActualCount: "Schauen Sie sich die tatsächliche Zählung an auf",
      readMore:
        "und lesen Sie mehr über die Geschichte dieses Projekts (auf Französisch) auf der Website von",
    },
    table: {
      title: "Heutige Vorhersagen nach Art",
      species: "Arten",
      observed: "Beobachtet",
      counted: "Gezählt",
      predicted: "Vorhergesagt",
      historical: "Historischer Median",
      quantile: "Quantil",
      explanation: {
        title: "Tabellenspalten erklärt",
        species: "Vogelartname",
        observed: "Bisher beobachtete Gesamtzahl der Art (Live-Daten falls verfügbar)",
        predicted: "Vorhergesagte Gesamtzahl der erwarteten Individuen der Art (von 6 bis 19 Uhr)",
        quantile:
          "Wie sich die Vorhersage der Art im Vergleich zu vergangenen Jahren verhält (z.B. 90. bedeutet höher als 90% der Vorjahre für dieses Datum)",
        historicalMedian: "Typische (mediane) Zählung für dieses Datum in vergangenen Jahren",
      },
    },
    plots: {
      hourlyPrediction: "Stündliche Vorhersage",
      expandAll: "Alle Erweitern",
      collapseAll: "Alle Einklappen",
      today: "Heute",
      nextDays: "Nächste Tage",
      season: "Diese Saison...",
      species: "Arten",
      noForecastData: "Keine Prognosedaten verfügbar",
      predictedTotal: "Vorhergesagt Gesamt",
      observedTotal: "Beobachtet Gesamt",
      quantileRange: "Quantil 20-80%",
      median: "Median",
      dailyCount: "Tägliche Anzahl",
      date: "Datum",
      hour: "Stunde",
      forecast: "Vorhersage",
      trektellenObservations: "Trektellen Beobachtungen",
      forecastedCounts: "Vorhergesagte Einzelzahlen (#)",
      historicalCounts: "Historische Zahlen (#)",
      birds: "Vögel",
      futureDays: "Zukünftige Tage (stündliche Abfolge)",
      hourlyForecastCount: "Stündliche Vorhersagezahl",
    },
    settings: {
      title: "Einstellungen",
      plotsToDisplay: "Anzuzeigende Diagramme",
      today: "Heute",
      nextDays: "Nächste Tage",
      season: "Saison",
      threshold: "Historischer Median-Zählschwellwert",
      thresholdHelp:
        "Nur Arten mit einer höheren historischen medianen Tageszählung für den Tag werden angezeigt",
      nextDaysCount: "Anzahl der nächsten anzuzeigenden Tage",
      nextDaysHelp:
        'Anzahl der Tage nach heute, die in der "Nächste Tage"-Prognose angezeigt werden sollen',
      sortBy: "Arten sortieren nach",
      taxonomy: "Taxonomie",
      median: "Medianzählung",
      predicted: "Vorhergesagte Zählung",
      quantile: "Vorhergesagtes Quantil",
    },
    weather: {
      title: "Wettervorhersage",
      variable: "Variable:",
      days: "Tage:",
    },
    common: {
      loading: "Laden",
      previousDay: "Vorheriger Tag",
      nextDay: "Nächster Tag",
      today: "Heute",
      close: "Schließen",
    },
    species: {
      "Common Buzzard": "Mäusebussard",
      "Red Kite": "Rotmilan",
      "Black Kite": "Schwarzmilan",
      "European Honey-buzzard": "Wespenbussard",
      "Western Marsh Harrier": "Rohrweihe",
      "Eurasian Sparrowhawk": "Sperber",
      "Eurasian Kestrel": "Turmfalke",
      "Osprey": "Fischadler",
      "Hen Harrier": "Kornweihe",
      "Merlin": "Merlin",
      "Eurasian Hobby": "Baumfalke",
    },
  },
};

/**
 * Initialize locale using URL parameters, localStorage, and browser APIs
 * @returns {string} - The initialized locale (en, fr, de)
 */
const initializeLocale = () => {
  const supportedLocales = LANGUAGE_OPTIONS.map((lang) => lang.code);
  let initialLocale = "en";

  // Check if running in browser environment
  if (typeof window !== "undefined") {
    // 1. Try URL parameter first (highest priority)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLocale = urlParams.get("lang");
      if (urlLocale && supportedLocales.includes(urlLocale)) {
        console.log("Using URL parameter locale:", urlLocale);
        initialLocale = urlLocale;
        // Save to localStorage for future visits
        localStorage.setItem("defile-locale", urlLocale);
        return initialLocale;
      }
    } catch (error) {
      console.warn("Error reading URL parameters:", error);
    }

    // 2. Try localStorage next
    try {
      const savedLocale = localStorage.getItem("defile-locale");
      if (savedLocale && supportedLocales.includes(savedLocale)) {
        console.log("Using saved locale:", savedLocale);
        initialLocale = savedLocale;
      } else {
        // 3. Use modern Intl API for better browser language detection
        const browserLocale = Intl.DateTimeFormat().resolvedOptions().locale.split("-")[0];
        if (supportedLocales.includes(browserLocale)) {
          console.log("Using Intl detected locale:", browserLocale);
          initialLocale = browserLocale;
        } else {
          // 4. Fallback to navigator.language
          const navLang = navigator.language?.split("-")[0];
          if (navLang && supportedLocales.includes(navLang)) {
            console.log("Using navigator language:", navLang);
            initialLocale = navLang;
          } else {
            console.log("No supported language found, using English fallback");
          }
        }
      }
    } catch (error) {
      console.warn("Error during locale detection:", error);
      // Even simpler fallback - just use English
      initialLocale = "en";
    }
  } else {
    console.log("SSR environment, using English fallback");
  }

  console.log("Initializing locale to:", initialLocale);
  return initialLocale;
};

// Initialize the locale immediately
const initialLocale = initializeLocale();

// Create i18n instance with the detected locale
const i18n = createI18n({
  locale: initialLocale,
  fallbackLocale: "en",
  messages,
  legacy: false, // Use Composition API mode
});

/**
 * Update locale and save to localStorage
 * @param {string} newLocale - The new locale to set
 */
export const updateLocale = (newLocale) => {
  const supportedLocales = LANGUAGE_OPTIONS.map((lang) => lang.code);
  if (supportedLocales.includes(newLocale)) {
    i18n.global.locale.value = newLocale;
    if (typeof window !== "undefined") {
      localStorage.setItem("defile-locale", newLocale);
    }
    console.log("Updated locale to:", newLocale);
  } else {
    console.warn("Unsupported locale:", newLocale);
  }
};

export default i18n;
