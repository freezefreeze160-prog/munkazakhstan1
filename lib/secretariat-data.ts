export type City =
  | "astana"
  | "almaty"
  | "shymkent"
  | "aktau"
  | "aktobe"
  | "atyrau"
  | "karaganda"
  | "kokshetau"
  | "kostanay"
  | "kyzylorda"
  | "pavlodar"
  | "petropavlovsk"
  | "semey"
  | "taldykorgan"
  | "taraz"
  | "turkestan"
  | "uralsk"
  | "ust-kamenogorsk"

export interface SecretariatMember {
  name: string
  role: string
  initials: string
}

export const secretariatData: Record<City, SecretariatMember[]> = {
  astana: [
    { name: "Айдар Нурланов", role: "Secretary-General", initials: "АН" },
    { name: "Алина Смагулова", role: "Deputy Secretary-General", initials: "АС" },
    { name: "Данияр Жумабаев", role: "Director of Conferences", initials: "ДЖ" },
    { name: "Камила Ержанова", role: "Head of Logistics", initials: "КЕ" },
  ],
  almaty: [
    { name: "Ерлан Касымов", role: "Secretary-General", initials: "ЕК" },
    { name: "Дина Абдуллаева", role: "Deputy Secretary-General", initials: "ДА" },
    { name: "Тимур Сейтов", role: "Director of Conferences", initials: "ТС" },
    { name: "Асель Нурмуханова", role: "Head of Logistics", initials: "АН" },
  ],
  shymkent: [
    { name: "Нурлан Бекжанов", role: "Secretary-General", initials: "НБ" },
    { name: "Жанар Токтарова", role: "Deputy Secretary-General", initials: "ЖТ" },
    { name: "Арман Сулейменов", role: "Director of Conferences", initials: "АС" },
    { name: "Мадина Ахметова", role: "Head of Logistics", initials: "МА" },
  ],
  aktau: [
    { name: "Ерболат Мусаев", role: "Secretary-General", initials: "ЕМ" },
    { name: "Айгерим Жанабаева", role: "Deputy Secretary-General", initials: "АЖ" },
    { name: "Бауыржан Омаров", role: "Director of Conferences", initials: "БО" },
    { name: "Сауле Кенжебаева", role: "Head of Logistics", initials: "СК" },
  ],
  aktobe: [
    { name: "Серик Байжанов", role: "Secretary-General", initials: "СБ" },
    { name: "Гульнара Есимова", role: "Deputy Secretary-General", initials: "ГЕ" },
    { name: "Максат Турсунов", role: "Director of Conferences", initials: "МТ" },
    { name: "Айнур Калиева", role: "Head of Logistics", initials: "АК" },
  ],
  atyrau: [
    { name: "Азамат Досмухамбетов", role: "Secretary-General", initials: "АД" },
    { name: "Меруерт Сагындыкова", role: "Deputy Secretary-General", initials: "МС" },
    { name: "Ержан Кабдуллин", role: "Director of Conferences", initials: "ЕК" },
    { name: "Алия Жумагалиева", role: "Head of Logistics", initials: "АЖ" },
  ],
  karaganda: [
    { name: "Даулет Ибраев", role: "Secretary-General", initials: "ДИ" },
    { name: "Карина Мухамедова", role: "Deputy Secretary-General", initials: "КМ" },
    { name: "Нуржан Абилов", role: "Director of Conferences", initials: "НА" },
    { name: "Динара Сарсенова", role: "Head of Logistics", initials: "ДС" },
  ],
  kokshetau: [
    { name: "Ильяс Жакупов", role: "Secretary-General", initials: "ИЖ" },
    { name: "Айжан Кусаинова", role: "Deputy Secretary-General", initials: "АК" },
    { name: "Ерлан Темиров", role: "Director of Conferences", initials: "ЕТ" },
    { name: "Гульмира Нурланова", role: "Head of Logistics", initials: "ГН" },
  ],
  kostanay: [
    { name: "Бекзат Алимов", role: "Secretary-General", initials: "БА" },
    { name: "Жанна Сейдахметова", role: "Deputy Secretary-General", initials: "ЖС" },
    { name: "Асхат Кенжебеков", role: "Director of Conferences", initials: "АК" },
    { name: "Айгуль Байтурсынова", role: "Head of Logistics", initials: "АБ" },
  ],
  kyzylorda: [
    { name: "Ануар Жумабеков", role: "Secretary-General", initials: "АЖ" },
    { name: "Салтанат Ахметжанова", role: "Deputy Secretary-General", initials: "СА" },
    { name: "Ерболат Сыздыков", role: "Director of Conferences", initials: "ЕС" },
    { name: "Назгуль Омарова", role: "Head of Logistics", initials: "НО" },
  ],
  pavlodar: [
    { name: "Марат Кадыров", role: "Secretary-General", initials: "МК" },
    { name: "Айсулу Бекмуратова", role: "Deputy Secretary-General", initials: "АБ" },
    { name: "Ерлан Жумагулов", role: "Director of Conferences", initials: "ЕЖ" },
    { name: "Гульжан Сарсенбаева", role: "Head of Logistics", initials: "ГС" },
  ],
  petropavlovsk: [
    { name: "Руслан Ахметов", role: "Secretary-General", initials: "РА" },
    { name: "Айгерим Токтарбаева", role: "Deputy Secretary-General", initials: "АТ" },
    { name: "Ерлан Мухамедов", role: "Director of Conferences", initials: "ЕМ" },
    { name: "Жанар Кусаинова", role: "Head of Logistics", initials: "ЖК" },
  ],
  semey: [
    { name: "Рахан Айзере", role: "Secretary-General", initials: "РА" },
    { name: "Маметаев Ерзат", role: "Deputy Secretary-General", initials: "МЕ" },
    { name: "Нурай Бакытжанова", role: "Deputy Secretary-General", initials: "НБ" },
    { name: "Барлыкбаева Айлун", role: "Deputy Secretary-General", initials: "БА" },
  ],
  taldykorgan: [
    { name: "Азамат Нурланов", role: "Secretary-General", initials: "АН" },
    { name: "Гульнара Абдуллаева", role: "Deputy Secretary-General", initials: "ГА" },
    { name: "Ерлан Байжанов", role: "Director of Conferences", initials: "ЕБ" },
    { name: "Айжан Есимова", role: "Head of Logistics", initials: "АЕ" },
  ],
  taraz: [
    { name: "Серикбол Турсунов", role: "Secretary-General", initials: "СТ" },
    { name: "Айгуль Калиева", role: "Deputy Secretary-General", initials: "АК" },
    { name: "Ерлан Досмухамбетов", role: "Director of Conferences", initials: "ЕД" },
    { name: "Жанар Сагындыкова", role: "Head of Logistics", initials: "ЖС" },
  ],
  turkestan: [
    { name: "Нурболат Жумагалиев", role: "Secretary-General", initials: "НЖ" },
    { name: "Айнур Мухамедова", role: "Deputy Secretary-General", initials: "АМ" },
    { name: "Ерлан Абилов", role: "Director of Conferences", initials: "ЕА" },
    { name: "Динара Сарсенова", role: "Head of Logistics", initials: "ДС" },
  ],
  uralsk: [
    { name: "Ерлан Жакупов", role: "Secretary-General", initials: "ЕЖ" },
    { name: "Айжан Кусаинова", role: "Deputy Secretary-General", initials: "АК" },
    { name: "Нурлан Темиров", role: "Director of Conferences", initials: "НТ" },
    { name: "Гульмира Нурланова", role: "Head of Logistics", initials: "ГН" },
  ],
  "ust-kamenogorsk": [
    { name: "Бекзат Алимов", role: "Secretary-General", initials: "БА" },
    { name: "Жанна Сейдахметова", role: "Deputy Secretary-General", initials: "ЖС" },
    { name: "Асхат Кенжебеков", role: "Director of Conferences", initials: "АК" },
    { name: "Айгуль Байтурсынова", role: "Head of Logistics", initials: "АБ" },
  ],
}
