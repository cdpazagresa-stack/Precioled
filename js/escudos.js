/* ============================================================
   ESCUDOS — Team Badge Search & Database
   ============================================================
   Pre-loaded database of Navarra football teams with badge URLs.
   Includes search functionality with autocomplete.
   ============================================================ */

const NAVARRA_TEAMS = [
    {
        "name": "A.D. CABANILLAS",
        "short": "A.D. CABANILLAS",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_A.D. CABANILLAS.png"
    },
    {
        "name": "A.D. MENDILLORRI",
        "short": "A.D. MENDILLORRI",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_A.D. MENDILLORRI.png"
    },
    {
        "name": "A.D. SAN JUAN",
        "short": "A.D. SAN JUAN",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_A.D. SAN JUAN.png"
    },
    {
        "name": "ARGA IBAI K.E.",
        "short": "ARGA IBAI K.E.",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_ARGA IBAIA K.E..png"
    },
    {
        "name": "BERRIOZAR C.F.",
        "short": "BERRIOZAR C.F.",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_BERRIOZAR C.F..png"
    },
    {
        "name": "BETI GASTE KULTU",
        "short": "BETI GASTE KULTU",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_BETI GASTE KULTUR JOLAS K.E..png"
    },
    {
        "name": "BETI GAZTE K.J.K.",
        "short": "BETI GAZTE K.J.K.",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_BETI GAZTE K.J.K.E..png"
    },
    {
        "name": "BETI KOZKOR K.E.",
        "short": "BETI KOZKOR K.E.",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_BETI KOZKOR K.E..png"
    },
    {
        "name": "BETI ONAL C.D.",
        "short": "BETI ONAL C.D.",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_BETI ONAK C.D..png"
    },
    {
        "name": "C. AMIGO",
        "short": "C. AMIGO",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C. AMIGO.png"
    },
    {
        "name": "C.A. AURORA MARCILLA",
        "short": "C.A. AURORA MARCILLA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C. ATL%c9TICO AURORA.png"
    },
    {
        "name": "C. A. HURACAN",
        "short": "C. A. HURACAN",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C. ATL%c9TICO HURAC%c1N.png"
    },
    {
        "name": "C.A. MARCILLA AURORA",
        "short": "C.A. MARCILLA AURORA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C. ATL%c9TICO MARCILLA AURORA.png"
    },
    {
        "name": "C.A. MONTEAGUDO",
        "short": "C.A. MONTEAGUDO",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C. ATL%c9TICO MONTEAGUDO.png"
    },
    {
        "name": "C.A. ARTAJONES",
        "short": "C.A. ARTAJONES",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C. ATLETICO ARTAJONES.png"
    },
    {
        "name": "C.A. CIRBONERO",
        "short": "C.A. CIRBONERO",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.ATLETICO CIRBONERO .png"
    },
    {
        "name": "C.A. CIRBONERO",
        "short": "C.A. CIRBONERO",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.ATLETICO CIRBONERO.png"
    },
    {
        "name": "C.A. OSASUNA",
        "short": "C.A. OSASUNA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.ATLETICO OSASUNA.png"
    },
    {
        "name": "C.A. VALTIERRANO",
        "short": "C.A. VALTIERRANO",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.ATLETICO VALTIERRANO.png"
    },
    {
        "name": "C.D. ABLITENSE",
        "short": "C.D. ABLITENSE",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. ABLITENSE.png"
    },
    {
        "name": "C.D. AIBARES",
        "short": "C.D. AIBARES",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. AIBAR%c9S-1.png"
    },
    {
        "name": "C.D. ALESVES",
        "short": "C.D. ALESVES",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. ALESVES.png"
    },
    {
        "name": "C.D. ALUVION",
        "short": "C.D. ALUVION",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. ALUVION .png"
    },
    {
        "name": "C.D. AMAYA",
        "short": "C.D. AMAYA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. AMAYA .png"
    },
    {
        "name": "C.D. AMIGÓ",
        "short": "C.D. AMIGÓ",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. AMIG%d3.png"
    },
    {
        "name": "C.D. AOIZ",
        "short": "C.D. AOIZ",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. AOIZ.png"
    },
    {
        "name": "C.D. ARDOI",
        "short": "C.D. ARDOI",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. ARDOI  .png"
    },
    {
        "name": "C.D. ARENAS",
        "short": "C.D. ARENAS",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. ARENAS.png"
    },
    {
        "name": "C.D. ASDEFOR",
        "short": "C.D. ASDEFOR",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. ASDEFOR.png"
    },
    {
        "name": "C.D. AURRERÁ DE LIEDENA",
        "short": "C.D. AURRERÁ DE LIEDENA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. AURRER%c1 DE LI%c9DENA.png"
    },
    {
        "name": "C.D. AURRERÁ K.E.",
        "short": "C.D. AURRERÁ K.E.",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. AURRERA K.E..png"
    },
    {
        "name": "C.D. AVANCE EZKABARTE",
        "short": "C.D. AVANCE EZKABARTE",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. AVANCE E..png"
    },
    {
        "name": "C.D. AZKARRENA",
        "short": "C.D. AZKARRENA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. AZKARRENA.png"
    },
    {
        "name": "C.D. AZKOYEN",
        "short": "C.D. AZKOYEN",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. AZKOYEN.png"
    },
    {
        "name": "C.D. BAZTÁN",
        "short": "C.D. BAZTÁN",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. BAZTAN.png"
    },
    {
        "name": "C.D. BETI ONAK",
        "short": "C.D. BETI ONAK",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. BETI-ONAK.png"
    },
    {
        "name": "C.D. BUÑUEL",
        "short": "C.D. BUÑUEL",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. BU%d1UEL.png"
    },
    {
        "name": "C.D. CARCAR",
        "short": "C.D. CARCAR",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. C%c1RCAR.png"
    },
    {
        "name": "C.D. CADREITA",
        "short": "C.D. CADREITA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. CADREITA.png"
    },
    {
        "name": "C.D. CALATRAVA",
        "short": "C.D. CALATRAVA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. CALATRAVA.png"
    },
    {
        "name": "C.D. CANTOLAGUA",
        "short": "C.D. CANTOLAGUA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. CANTOLAGUA .png"
    },
    {
        "name": "C.D. CASTEJÓN",
        "short": "C.D. CASTEJÓN",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. CASTEJ%d3N-1.png"
    },
    {
        "name": "C.D. CASTILLO DE TIEBAS",
        "short": "C.D. CASTILLO DE TIEBAS",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. CASTILLO DE TIEBAS.png"
    },
    {
        "name": "C.D. CORELLANO",
        "short": "C.D. CORELLANO",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. CORELLANO.png"
    },
    {
        "name": "C.D. CORTES",
        "short": "C.D. CORTES",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. CORTES.png"
    },
    {
        "name": "C.D. ERRIBERRI",
        "short": "C.D. ERRIBERRI",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. ERRI-BERRI.png"
    },
    {
        "name": "C.D. ETXARRI ARANAZ",
        "short": "C.D. ETXARRI ARANAZ",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. ETXARRI ARANATZ K.E..png"
    },
    {
        "name": "C.A. MILAGRES",
        "short": "C.A. MILAGRES",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D.F. MILAGR%c9S.png"
    },
    {
        "name": "C.D. FALCESINO",
        "short": "C.D. FALCESINO",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. FALCESINO.png"
    },
    {
        "name": "C.D. FONTELLAS",
        "short": "C.D. FONTELLAS",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. FONTELLAS.png"
    },
    {
        "name": "C.D. FUNES",
        "short": "C.D. FUNES",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. FUNES.png"
    },
    {
        "name": "C.D. GARES",
        "short": "C.D. GARES",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. GARES.png"
    },
    {
        "name": "C.D. GAZTE BERRIAK",
        "short": "C.D. GAZTE BERRIAK",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. GAZTE BERRIAK.png"
    },
    {
        "name": "C.D. HUARTE",
        "short": "C.D. HUARTE",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. HUARTE .png"
    },
    {
        "name": "C.D. IDOYA",
        "short": "C.D. IDOYA",
        "badgeUrl": "https://www.google.com/url?sa=i&url=https%3A%2F%2Fclubshop.macron.com%2Fnavarra_nafarroa%2Fcd-idoya%2Fother&psig=AOvVaw2iMSignTfQ3MXVZrBP-2uO&ust=1771525740398000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCKCH0OXV45IDFQAAAAAdAAAAABAE"
    },
    {
        "name": "C.D. ILUMBERRI",
        "short": "C.D. ILUMBERRI",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. ILUMBERRI.png"
    },
    {
        "name": "C.D. INFANZONES",
        "short": "C.D. INFANZONES",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. INFANTONES.png"
    },
    {
        "name": "C.D. INJERTO",
        "short": "C.D. INJERTO",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. INJERTO.png"
    },
    {
        "name": "C.D. IRUÑA",
        "short": "C.D. IRUÑA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. IRU%d1A .png"
    },
    {
        "name": "C.D. IRUNTXIKI",
        "short": "C.D. IRUNTXIKI",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. IRUNTXIKI.png"
    },
    {
        "name": "C.D. IZARRA",
        "short": "C.D. IZARRA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. IZARRA .png"
    },
    {
        "name": "C.D. KIROL SPORT",
        "short": "C.D. KIROL SPORT",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. KIROL SPORT.png"
    },
    {
        "name": "C.D. LAGUNAK",
        "short": "C.D. LAGUNAK",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. LAGUNAK .png"
    },
    {
        "name": "C.D. LA PEÑA FUSTIÑANA",
        "short": "C.D. LA PEÑA FUSTIÑANA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. LA PE%d1A.png"
    },
    {
        "name": "C.D. LARRATE",
        "short": "C.D. LARRATE",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. LARRATE.png"
    },
    {
        "name": "C.D. LERINES",
        "short": "C.D. LERINES",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. LERIN%c9S.png"
    },
    {
        "name": "C.D. LEZKAIRU",
        "short": "C.D. LEZKAIRU",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. LEZKAIRU.png"
    },
    {
        "name": "C.D. LICEO MONJARDIN",
        "short": "C.D. LICEO MONJARDIN",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. LICEO MONJARD%cdN.png"
    },
    {
        "name": "C.D. LODOSA",
        "short": "C.D. LODOSA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. LODOSA.png"
    },
    {
        "name": "C.D. LOURDES",
        "short": "C.D. LOURDES",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. LOURDES.png"
    },
    {
        "name": "C.D. MENDAVIES",
        "short": "C.D. MENDAVIES",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. MENDAVI%c9S.png"
    },
    {
        "name": "C.D. MENDI",
        "short": "C.D. MENDI",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. MENDI .png"
    },
    {
        "name": "C.D. MURCHANTE",
        "short": "C.D. MURCHANTE",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. MURCHANTE.png"
    },
    {
        "name": "C.D. MURILLO",
        "short": "C.D. MURILLO",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. MURILLO.png"
    },
    {
        "name": "C.D. MUSKARIA",
        "short": "C.D. MUSKARIA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. MUSKARIA.png"
    },
    {
        "name": "C.D. OBERENA",
        "short": "C.D. OBERENA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. OBERENA .png"
    },
    {
        "name": "C.D. ONDALAN",
        "short": "C.D. ONDALAN",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. ONDALAN.png"
    },
    {
        "name": "C.D. PAMPLONA",
        "short": "C.D. PAMPLONA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. PAMPLONA.png"
    },
    {
        "name": "C.D. PEÑA AZAGRESA",
        "short": "C.D. PEÑA AZAGRESA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. PE%d1A AZAGRESA.png"
    },
    {
        "name": "C.D. RADA",
        "short": "C.D. RADA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. RADA.png"
    },
    {
        "name": "C.D. RIBOFARADA",
        "short": "C.D. RIBOFARADA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. RIBAFORADA.png"
    },
    {
        "name": "C.D. RIVER EGA",
        "short": "C.D. RIVER EGA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. RIVER EGA .png"
    },
    {
        "name": "C.D. ROCHAPEANO",
        "short": "C.D. ROCHAPEANO",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. ROCHAPEANO.png"
    },
    {
        "name": "C.D. SALESIANOS",
        "short": "C.D. SALESIANOS",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. SALESIANOS (NA).png"
    },
    {
        "name": "C.D. SAN ADRIAN",
        "short": "C.D. SAN ADRIAN",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. SAN ADRIAN.png"
    },
    {
        "name": "C.D. SAN CERNIN",
        "short": "C.D. SAN CERNIN",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. SAN FERM%cdN IKASTOLA.png"
    },
    {
        "name": "C.D. SAN IGNACIO",
        "short": "C.D. SAN IGNACIO",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. SAN IGNACIO.png"
    },
    {
        "name": "C.D. SAN JAVIER",
        "short": "C.D. SAN JAVIER",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. SAN JAVIER.png"
    },
    {
        "name": "C.D. SAN JORGE",
        "short": "C.D. SAN JORGE",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. SAN JORGE.png"
    },
    {
        "name": "C.D. SAN MIGUEL",
        "short": "C.D. SAN MIGUEL",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. SAN MIGUEL (NAV).png"
    },
    {
        "name": "C.D. SANTACARA",
        "short": "C.D. SANTACARA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. SANTACARA.png"
    },
    {
        "name": "C.D. SESMA",
        "short": "C.D. SESMA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. SESMA.png"
    },
    {
        "name": "C.D. SOTO IBARBASO",
        "short": "C.D. SOTO IBARBASO",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. SOTO-IBARBASO.png"
    },
    {
        "name": "C.D. SPORTING MELIDES",
        "short": "C.D. SPORTING MELIDES",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. SPORTING MELID%c9S.png"
    },
    {
        "name": "C.D. SUBIZA",
        "short": "C.D. SUBIZA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. SUBIZA.png"
    },
    {
        "name": "C.D. TUDELANO",
        "short": "C.D. TUDELANO",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. TUDELANO .png"
    },
    {
        "name": "C.D. UNIVERSIDAD DE NAVARRA",
        "short": "C.D. UNIVERSIDAD DE NAVARRA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. UNIVERSIDAD DE NAVARRA.png"
    },
    {
        "name": "C.D. URANTZIA",
        "short": "C.D. URANTZIA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. URANTZIA.png"
    },
    {
        "name": "C.D. URBASA",
        "short": "C.D. URBASA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. URBASA.png"
    },
    {
        "name": "C.D. URROZTARRA",
        "short": "C.D. URROZTARRA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. URROZTARRA.png"
    },
    {
        "name": "C.D. VALLE DE EGUES",
        "short": "C.D. VALLE DE EGUES",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. VALLE DE EG%dc%c9S.png"
    },
    {
        "name": "C.D. VIANES",
        "short": "C.D. VIANES",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. VIANES.png"
    },
    {
        "name": "C.D. ZARRAMONZA",
        "short": "C.D. ZARRAMONZA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. ZARRAMONZA.png"
    },
    {
        "name": "C.D. ZIRAUKI",
        "short": "C.D. ZIRAUKI",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. ZIRAUKI.png"
    },
    {
        "name": "C.D. ZIZUR",
        "short": "C.D. ZIZUR",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D. ZIZUR.png"
    },
    {
        "name": "C.F. BERIÁIN",
        "short": "C.F. BERIÁIN",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.F. BERIAIN.png"
    },
    {
        "name": "C.F. BETI CASEDANO",
        "short": "C.F. BETI CASEDANO",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.F. BETI CASEDANO.png"
    },
    {
        "name": "C.F. GAZTE BERRIAK",
        "short": "C.F. GAZTE BERRIAK",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.F. GAZTE BERRIAK.png"
    },
    {
        "name": "U.C.D. BURLADES",
        "short": "U.C.D. BURLADES",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.U.D. BURLADES.png"
    },
    {
        "name": "CASTILLO F.C.",
        "short": "CASTILLO F.C.",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_CASTILLO F.C..png"
    },
    {
        "name": "DONEZTEBE F.T.",
        "short": "DONEZTEBE F.T.",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_DONEZTEBE F.T..png"
    },
    {
        "name": "F.C. BIDEZARRA",
        "short": "F.C. BIDEZARRA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_F.C. BIDEZARRA.png"
    },
    {
        "name": "F.C. TUDELA 1999",
        "short": "F.C. TUDELA 1999",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_F.C. TUDELA  1999.png"
    },
    {
        "name": "J.D. SAN JORGE",
        "short": "J.D. SAN JORGE",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_J.D. SAN JORGE.png"
    },
    {
        "name": "C.D. LAGUN ARTEA K.E.",
        "short": "C.D. LAGUN ARTEA K.E.",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_LAGUN ARTEA K..E.png"
    },
    {
        "name": "MULIER FCN",
        "short": "MULIER FCN",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_MULIER FCN.png"
    },
    {
        "name": "PEÑA SPORT F.C.",
        "short": "PEÑA SPORT F.C.",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_PE%d1A SPORT  F.C..png"
    },
    {
        "name": "ROTXAPEA C.D.",
        "short": "ROTXAPEA C.D.",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_ROTXAPEA C.D..png"
    },
    {
        "name": "S.D. ALSASUA",
        "short": "S.D. ALSASUA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_S.D. ALSASUA.png"
    },
    {
        "name": "S.D.C. SAN CRISTOBAL",
        "short": "S.D.C. SAN CRISTOBAL",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_S.D.C. SAN CRISTOBAL.png"
    },
    {
        "name": "C.D. SAN ANDRÉS K.T.",
        "short": "C.D. SAN ANDRÉS K.T.",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_SAN ANDRES K.T..png"
    },
    {
        "name": "U.D.C. CHANTREA",
        "short": "U.D.C. CHANTREA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_U.D.C. CHANTREA .png"
    },
    {
        "name": "U.D. MUTILVERA",
        "short": "U.D. MUTILVERA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_U.D. MUTILVERA .png"
    },
    {
        "name": "U.D. VALLE DE ARANGUREN",
        "short": "U.D. VALLE DE ARANGUREN",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_U.D. VALLE DE ARANGUREN.png"
    },
    {
        "name": "UNION TUTERA",
        "short": "UNION TUTERA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_UNI%d3N TUTERA.png"
    },
    {
        "name": "C.D. UNIVERSIDAD DE NAVARRA",
        "short": "C.D. UNIVERSIDAD DE NAVARRA",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_UNIVERSIDAD DE NAVARRA.png"
    },
    {
        "name": "VALDORBA F.C.",
        "short": "VALDORBA F.C.",
        "badgeUrl": "https://www.footballlogosandkits.com/images_esc3/ESPA/NAVARRA/escudos/ESC_VALDORBA F.C..png"
    }
];

/**
 * Get badge URL for a team.
 * Uses the pre-defined URL from the database.
 */
function getBadgeUrl(teamName) {
    const team = NAVARRA_TEAMS.find(t => t.name === teamName);
    return team ? team.badgeUrl : getDefaultBadgeSVG(teamName);
}

/**
 * Generate a simple SVG shield as fallback badge
 */
function getDefaultBadgeSVG(teamName = '?') {
    const initial = teamName.charAt(0).toUpperCase();
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
            <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#222"/>
                    <stop offset="100%" style="stop-color:#111"/>
                </linearGradient>
            </defs>
            <path d="M50 5 L95 25 L95 65 Q95 100 50 115 Q5 100 5 65 L5 25 Z" 
                  fill="url(#g)" stroke="#f6ee36" stroke-width="2"/>
            <text x="50" y="70" text-anchor="middle" font-family="Arial" font-size="36" 
                  font-weight="bold" fill="#f6ee36">${initial}</text>
        </svg>
    `)}`;
}

/**
 * Search teams by name (Navarra database)
 * Returns top 10 matches
 */
function searchTeams(query) {
    if (!query || query.length < 2) return [];
    
    const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    return NAVARRA_TEAMS.filter(team => {
        const name = team.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const short = team.short.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return name.includes(q) || short.includes(q);
    }).slice(0, 10).map(team => ({
        ...team
    }));
}

/**
 * Create a custom team (for teams not in the database)
 */
function createCustomTeam(name, badgeUrl = '') {
    return {
        id: null,
        name: name.toUpperCase(),
        short: name.toUpperCase(),
        badgeUrl: badgeUrl || getDefaultBadgeSVG(name)
    };
}
