export type HomeSection =
  | "dashboard"
  | "tasks"
  | "subjects"
  | "notes"
  | "flashcards"
  | "reviews"
  | "stats"
  | "profile"
  | "settings";

export const navItems: Array<{
  label: string;
  icon: string;
  section: HomeSection;
}> = [
  { label: "Dashboard", icon: "dashboard", section: "dashboard" },
  { label: "MissÃµes", icon: "mission", section: "tasks" },
  { label: "Assuntos", icon: "book", section: "subjects" },
  { label: "AnotaÃ§Ãµes", icon: "note", section: "notes" },
  { label: "Flashcards", icon: "cards", section: "flashcards" },
  { label: "Revisoes", icon: "calendar", section: "reviews" },
  { label: "Estatisticas", icon: "chart", section: "stats" },
  { label: "Perfil", icon: "user", section: "profile" },
  { label: "Configuracoes", icon: "settings", section: "settings" }
];

const placeholderTitles: Record<HomeSection, string> = {
  dashboard: "Dashboard",
  tasks: "MissÃµes",
  subjects: "Assuntos",
  notes: "AnotaÃ§Ãµes",
  flashcards: "Flashcards",
  reviews: "Revisoes",
  stats: "Estatisticas",
  profile: "Perfil",
  settings: "Configuracoes"
};

const placeholderCopy: Record<HomeSection, string> = {
  dashboard: "",
  tasks: "",
  subjects: "",
  notes: "",
  flashcards: "Flashcards entram depois que suas anotacoes estiverem organizadas.",
  reviews: "Revisoes vao usar seu progresso e seus cards para montar a fila diaria.",
  stats: "Estatisticas vao consolidar tempo de estudo, revisoes e criacao de conteudo.",
  profile: "Perfil vai reunir dados da conta e preferencias de estudo.",
  settings: "Configuracoes vao concentrar ajustes do aplicativo."
};

export function getSectionLabel(section: HomeSection) {
  return placeholderTitles[section];
}

export function getSectionSubtitle(section: HomeSection) {
  if (section === "tasks") {
    return "Defina uma missao principal, acompanhe passos secundarios e avance por status.";
  }

  if (section === "subjects") {
    return "Crie e mantenha os assuntos que organizam suas anotacoes.";
  }

  if (section === "notes") {
    return "Crie, filtre e revise suas anotacoes por assunto.";
  }

  if (section === "flashcards") {
    return "Crie cards de pergunta e resposta por assunto.";
  }

  if (section === "reviews") {
    return "Revise os cards pendentes e mantenha a agenda em dia.";
  }

  return placeholderCopy[section] || "Pronto para mais uma sessao de estudos?";
}

export function getPlaceholderCopy(section: HomeSection) {
  return placeholderCopy[section];
}
