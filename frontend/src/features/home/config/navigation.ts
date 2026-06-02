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
  { label: "Missões", icon: "mission", section: "tasks" },
  { label: "Assuntos", icon: "book", section: "subjects" },
  { label: "Anotações", icon: "note", section: "notes" },
  { label: "Flashcards", icon: "cards", section: "flashcards" },
  { label: "Revisões", icon: "calendar", section: "reviews" },
  { label: "Estatísticas", icon: "chart", section: "stats" },
  { label: "Perfil", icon: "user", section: "profile" },
  { label: "Configurações", icon: "settings", section: "settings" }
];

const placeholderTitles: Record<HomeSection, string> = {
  dashboard: "Dashboard",
  tasks: "Missões",
  subjects: "Assuntos",
  notes: "Anotações",
  flashcards: "Flashcards",
  reviews: "Revisões",
  stats: "Estatísticas",
  profile: "Perfil",
  settings: "Configurações"
};

const placeholderCopy: Record<HomeSection, string> = {
  dashboard: "",
  tasks: "",
  subjects: "",
  notes: "",
  flashcards: "Flashcards entram depois que suas anotações estiverem organizadas.",
  reviews: "Revisões vão usar seu progresso e seus cards para montar a fila diária.",
  stats: "Estatísticas vão consolidar tempo de estudo, revisões e criação de conteúdo.",
  profile: "Perfil vai reunir dados da conta e preferências de estudo.",
  settings: "Configurações vão concentrar ajustes do aplicativo."
};

export function getSectionLabel(section: HomeSection) {
  return placeholderTitles[section];
}

export function getSectionSubtitle(section: HomeSection) {
  if (section === "tasks") {
    return "Defina uma missão principal, acompanhe passos secundários e avance por status.";
  }

  if (section === "subjects") {
    return "Crie e mantenha os assuntos que organizam suas anotações.";
  }

  if (section === "notes") {
    return "Crie, filtre e revise suas anotações por assunto.";
  }

  if (section === "flashcards") {
    return "Crie cards de pergunta e resposta por assunto.";
  }

  if (section === "reviews") {
    return "Revise os cards pendentes e mantenha a agenda em dia.";
  }

  return placeholderCopy[section] || "Pronto para mais uma sessão de estudos?";
}

export function getPlaceholderCopy(section: HomeSection) {
  return placeholderCopy[section];
}
