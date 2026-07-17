import type { Language } from "@/lib/translations"

interface QA {
  q: string
  a: string
}
interface Term {
  term: string
  def: string
}

interface ResourcesContent {
  faq: QA[]
  rop: string[]
  glossary: Term[]
  positionPaper: string
}

export const RESOURCES: Record<Language, ResourcesContent> = {
  ru: {
    faq: [
      { q: "Что такое Model UN?", a: "Model UN (Модель ООН) — это симуляция работы органов ООН, где школьники и студенты выступают в роли делегатов стран, обсуждают мировые проблемы и вырабатывают резолюции." },
      { q: "Нужен ли опыт, чтобы участвовать?", a: "Нет. Многие конференции принимают новичков. Достаточно интереса к международным отношениям и готовности готовиться к теме комитета." },
      { q: "Что такое position paper?", a: "Это краткий документ (обычно 1 страница), где вы излагаете позицию своей страны по теме комитета: предыстория, позиция и предлагаемые решения." },
      { q: "Как проходит регистрация?", a: "Выберите конференцию на сайте, подайте заявку, укажите предпочтения по комитетам и дождитесь одобрения организатора. Регистрационный взнос оплачивается по реквизитам организатора, чек загружается на странице конференции." },
      { q: "Что надеть на конференцию?", a: "Деловой стиль (Western Business Attire): костюм, рубашка, для девушек — деловое платье или костюм." },
    ],
    rop: [
      "Roll Call — перекличка: делегаты отмечают присутствие («present» или «present and voting»).",
      "Setting the Agenda — установление повестки, если тем несколько.",
      "Motion to open debate — открытие общих дебатов, формируется список выступающих (Speakers' List).",
      "Moderated Caucus — модерируемые прения по конкретному под-вопросу с ограничением времени на выступление.",
      "Unmoderated Caucus — свободные прения: делегаты общаются напрямую и пишут проекты резолюций.",
      "Working Paper / Draft Resolution — рабочий документ и проект резолюции с оперативными пунктами.",
      "Amendments — поправки к проекту резолюции (дружественные и недружественные).",
      "Voting Procedure — голосование по проекту резолюции; для принятия обычно нужно большинство.",
    ],
    glossary: [
      { term: "Delegate", def: "Делегат — участник, представляющий страну в комитете." },
      { term: "Dais / Chair", def: "Президиум / председатель — ведут заседание и следят за правилами." },
      { term: "Placard", def: "Табличка с названием страны, поднимается для голосования и запроса слова." },
      { term: "Motion", def: "Процедурное предложение делегата (например, начать модерируемые прения)." },
      { term: "Caucus", def: "Прения: модерируемые (по очереди) или немодерируемые (свободные)." },
      { term: "Resolution", def: "Итоговый документ комитета с предлагаемыми решениями." },
      { term: "Quorum", def: "Кворум — минимум делегатов для начала заседания." },
      { term: "Veto", def: "Право вето постоянных членов Совета Безопасности ООН." },
    ],
    positionPaper:
      "POSITION PAPER\n\nКомитет: [название]\nСтрана: [страна]\nДелегат: [ФИО, школа]\nТема: [тема комитета]\n\n1. Предыстория вопроса\n[Кратко опишите суть проблемы и её значимость для мира.]\n\n2. Позиция страны\n[Что ваша страна думает по этому вопросу? Какие действия уже предпринимала?]\n\n3. Предлагаемые решения\n[2-3 конкретных предложения, которые ваша страна хотела бы включить в резолюцию.]\n\nИсточники:\n[1] ...\n[2] ...\n",
  },
  kk: {
    faq: [
      { q: "Model UN дегеніміз не?", a: "Model UN (БҰҰ моделі) — оқушылар мен студенттер елдердің делегаттары ретінде әлемдік мәселелерді талқылап, резолюциялар әзірлейтін БҰҰ жұмысының симуляциясы." },
      { q: "Қатысу үшін тәжірибе қажет пе?", a: "Жоқ. Көптеген конференциялар жаңадан бастаушыларды қабылдайды. Халықаралық қатынастарға қызығушылық пен дайындалуға дайындық жеткілікті." },
      { q: "Position paper дегеніміз не?", a: "Бұл — еліңіздің комитет тақырыбы бойынша ұстанымын баяндайтын қысқа құжат (әдетте 1 бет): тарихы, ұстанымы және ұсынылатын шешімдер." },
      { q: "Тіркелу қалай өтеді?", a: "Сайттан конференцияны таңдап, өтінім беріңіз, комитет таңдауларын көрсетіп, ұйымдастырушының мақұлдауын күтіңіз. Тіркелу жарнасы ұйымдастырушының деректемелері бойынша төленеді, чек конференция бетіне жүктеледі." },
      { q: "Конференцияға не кию керек?", a: "Іскерлік стиль (Western Business Attire): костюм, көйлек." },
    ],
    rop: [
      "Roll Call — түгендеу: делегаттар қатысуын белгілейді.",
      "Setting the Agenda — тақырып бірнешеу болса, күн тәртібін белгілеу.",
      "Motion to open debate — жалпы пікірталасты ашу, сөйлеушілер тізімі құрылады.",
      "Moderated Caucus — уақыт шектеулі модерацияланған пікірталас.",
      "Unmoderated Caucus — еркін пікірталас: делегаттар тікелей сөйлесіп, жоба жазады.",
      "Working Paper / Draft Resolution — жұмыс құжаты мен резолюция жобасы.",
      "Amendments — резолюция жобасына түзетулер.",
      "Voting Procedure — резолюция жобасы бойынша дауыс беру.",
    ],
    glossary: [
      { term: "Delegate", def: "Делегат — комитетте елді ұсынатын қатысушы." },
      { term: "Dais / Chair", def: "Президиум / төраға — отырысты жүргізеді." },
      { term: "Placard", def: "Ел атауы жазылған тақташа, дауыс беру мен сөз сұрауға көтеріледі." },
      { term: "Motion", def: "Делегаттың процедуралық ұсынысы." },
      { term: "Caucus", def: "Пікірталас: модерацияланған немесе еркін." },
      { term: "Resolution", def: "Комитеттің қорытынды құжаты." },
      { term: "Quorum", def: "Кворум — отырысты бастауға қажет ең аз делегат саны." },
      { term: "Veto", def: "БҰҰ Қауіпсіздік Кеңесінің тұрақты мүшелерінің вето құқығы." },
    ],
    positionPaper:
      "POSITION PAPER\n\nКомитет: [атауы]\nЕл: [ел]\nДелегат: [аты-жөні, мектеп]\nТақырып: [комитет тақырыбы]\n\n1. Мәселенің тарихы\n[Мәселенің мәні мен маңызын қысқаша сипаттаңыз.]\n\n2. Елдің ұстанымы\n[Еліңіз бұл мәселе бойынша не ойлайды?]\n\n3. Ұсынылатын шешімдер\n[Резолюцияға енгізгіңіз келетін 2-3 нақты ұсыныс.]\n\nДереккөздер:\n[1] ...\n[2] ...\n",
  },
  en: {
    faq: [
      { q: "What is Model UN?", a: "Model UN is a simulation of United Nations bodies where students act as country delegates, debate global issues, and draft resolutions." },
      { q: "Do I need experience to take part?", a: "No. Many conferences welcome beginners. All you need is an interest in international affairs and a willingness to prepare for your committee topic." },
      { q: "What is a position paper?", a: "A short document (usually 1 page) stating your country's stance on the committee topic: background, position, and proposed solutions." },
      { q: "How does registration work?", a: "Pick a conference on the site, apply, choose your committee preferences, and wait for the organizer's approval. The registration fee is paid to the organizer's details, and the receipt is uploaded on the conference page." },
      { q: "What should I wear?", a: "Western Business Attire: a suit and shirt; a business dress or suit works too." },
    ],
    rop: [
      "Roll Call — delegates mark attendance ('present' or 'present and voting').",
      "Setting the Agenda — choosing the topic order if there are several.",
      "Motion to open debate — opens general debate and forms the Speakers' List.",
      "Moderated Caucus — structured debate on a sub-topic with a per-speaker time limit.",
      "Unmoderated Caucus — free debate: delegates talk directly and draft resolutions.",
      "Working Paper / Draft Resolution — a working document and draft with operative clauses.",
      "Amendments — friendly and unfriendly changes to a draft resolution.",
      "Voting Procedure — voting on the draft resolution; a majority is usually required to pass.",
    ],
    glossary: [
      { term: "Delegate", def: "A participant representing a country in a committee." },
      { term: "Dais / Chair", def: "The chairs who run the session and enforce the rules." },
      { term: "Placard", def: "A country name card raised to vote or request the floor." },
      { term: "Motion", def: "A procedural proposal by a delegate (e.g. to start a moderated caucus)." },
      { term: "Caucus", def: "Debate: moderated (turn-based) or unmoderated (free)." },
      { term: "Resolution", def: "The committee's final document with proposed solutions." },
      { term: "Quorum", def: "The minimum number of delegates required to begin a session." },
      { term: "Veto", def: "The veto power of the permanent members of the UN Security Council." },
    ],
    positionPaper:
      "POSITION PAPER\n\nCommittee: [name]\nCountry: [country]\nDelegate: [full name, school]\nTopic: [committee topic]\n\n1. Background of the issue\n[Briefly describe the problem and why it matters to the world.]\n\n2. Country's position\n[What does your country think? What actions has it already taken?]\n\n3. Proposed solutions\n[2-3 concrete proposals your country would like to see in the resolution.]\n\nSources:\n[1] ...\n[2] ...\n",
  },
}
