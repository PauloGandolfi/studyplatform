import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import spaceImage from "./assets/space-login.png";
import studyPlatformLogo from "./assets/study-platform-logo.png";

type AuthMode = "login" | "register" | "forgot" | "reset";
type AppView = "auth" | "home";
type HomeSection = "dashboard" | "subjects" | "notes" | "flashcards" | "reviews" | "stats" | "profile" | "settings";

type Feedback = {
  type: "success" | "error";
  message: string;
};

type LoginResponse = {
  id: string;
  name: string;
  email: string;
  accessToken: string;
  tokenType: string;
};

type GoogleCredentialResponse = {
  credential?: string;
};

type Subject = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type Note = {
  id: string;
  subjectId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type Difficulty = "EASY" | "MEDIUM" | "HARD";

type Flashcard = {
  id: string;
  subjectId: string;
  question: string;
  answer: string;
  difficulty: Difficulty;
  reviewInterval: number;
  nextReviewDate: string;
  createdAt: string;
  updatedAt: string;
};

type NoteFormValues = {
  subjectId: string;
  title: string;
  content: string;
};

type FlashcardFormValues = {
  subjectId: string;
  question: string;
  answer: string;
  difficulty: Difficulty;
};

type SubjectFormValues = {
  name: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const initialValues = {
  name: "",
  email: "",
  password: ""
};

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const initialResetToken = new URLSearchParams(window.location.search).get("resetToken") ?? "";

const overviewCards = [
  { label: "Assuntos", value: "12", detail: "assuntos criados", icon: "book" },
  { label: "Anotações", value: "84", detail: "anotacoes no total", icon: "note" },
  { label: "Flashcards", value: "256", detail: "cartoes criados", icon: "cards" },
  { label: "Revisoes", value: "18", detail: "para hoje", icon: "calendar" }
];

const recentActivities = [
  { title: "Anotacao: Ciclo de Vida das Estrelas", subject: "Astronomia", time: "2h atras" },
  { title: "Flashcard: Java - Collections", subject: "Java", time: "4h atras" },
  { title: "Anotacao: Regras de Derivacao", subject: "Calculo", time: "1 dia atras" },
  { title: "Flashcard: SQL - JOINs", subject: "Banco de Dados", time: "1 dia atras" }
];

const navItems: Array<{
  label: string;
  icon: string;
  section: HomeSection;
}> = [
  { label: "Dashboard", icon: "dashboard", section: "dashboard" },
  { label: "Assuntos", icon: "book", section: "subjects" },
  { label: "Anotações", icon: "note", section: "notes" },
  { label: "Flashcards", icon: "cards", section: "flashcards" },
  { label: "Revisoes", icon: "calendar", section: "reviews" },
  { label: "Estatisticas", icon: "chart", section: "stats" },
  { label: "Perfil", icon: "user", section: "profile" },
  { label: "Configuracoes", icon: "settings", section: "settings" }
];

const emptyNoteForm: NoteFormValues = {
  subjectId: "",
  title: "",
  content: ""
};

const emptyFlashcardForm: FlashcardFormValues = {
  subjectId: "",
  question: "",
  answer: "",
  difficulty: "MEDIUM"
};

const emptySubjectForm: SubjectFormValues = {
  name: ""
};

const placeholderTitles: Record<HomeSection, string> = {
  dashboard: "Dashboard",
  subjects: "Assuntos",
  notes: "Anotações",
  flashcards: "Flashcards",
  reviews: "Revisoes",
  stats: "Estatisticas",
  profile: "Perfil",
  settings: "Configuracoes"
};

const placeholderCopy: Record<HomeSection, string> = {
  dashboard: "",
  subjects: "",
  notes: "",
  flashcards: "Flashcards entram depois que suas anotacoes estiverem organizadas.",
  reviews: "Revisoes vao usar seu progresso e seus cards para montar a fila diaria.",
  stats: "Estatisticas vao consolidar tempo de estudo, revisoes e criacao de conteudo.",
  profile: "Perfil vai reunir dados da conta e preferencias de estudo.",
  settings: "Configuracoes vao concentrar ajustes do aplicativo."
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

const notePreviewLimit = 128;

function authorizationHeaders() {
  const token = localStorage.getItem("studyplatform_token");

  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const authHeaders = authorizationHeaders();

  Object.entries(authHeaders).forEach(([key, value]) => headers.set(key, value));

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });
  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(response.status, data));
  }

  return data as T;
}

function buildNoteForm(note: Note | null, fallbackSubjectId: string): NoteFormValues {
  if (!note) {
    return {
      subjectId: fallbackSubjectId,
      title: "",
      content: ""
    };
  }

  return {
    subjectId: note.subjectId,
    title: note.title,
    content: note.content
  };
}

function buildFlashcardForm(flashcard: Flashcard | null, fallbackSubjectId: string): FlashcardFormValues {
  if (!flashcard) {
    return {
      subjectId: fallbackSubjectId,
      question: "",
      answer: "",
      difficulty: "MEDIUM"
    };
  }

  return {
    subjectId: flashcard.subjectId,
    question: flashcard.question,
    answer: flashcard.answer,
    difficulty: flashcard.difficulty
  };
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return dateFormatter.format(date);
}

function formatReviewDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function getNotePreview(content: string) {
  const compact = content.replace(/\s+/g, " ").trim();

  if (compact.length <= notePreviewLimit) {
    return compact;
  }

  return `${compact.slice(0, notePreviewLimit).trim()}...`;
}

function getFlashcardPreview(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();

  if (compact.length <= 96) {
    return compact;
  }

  return `${compact.slice(0, 96).trim()}...`;
}

function getDifficultyLabel(difficulty: Difficulty) {
  if (difficulty === "EASY") {
    return "Facil";
  }

  if (difficulty === "HARD") {
    return "Dificil";
  }

  return "Media";
}

function getSubjectName(subjects: Subject[], subjectId: string) {
  return subjects.find((subject) => subject.id === subjectId)?.name ?? "Assunto removido";
}

function getSectionLabel(section: HomeSection) {
  return placeholderTitles[section];
}

function App() {
  const [mode, setMode] = useState<AuthMode>(() => (initialResetToken ? "reset" : "login"));
  const [currentView, setCurrentView] = useState<AppView>(() =>
    localStorage.getItem("studyplatform_token") ? "home" : "auth"
  );
  const [values, setValues] = useState(initialValues);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [userName, setUserName] = useState<string | null>(() => getStoredUserName());
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [currentSection, setCurrentSection] = useState<HomeSection>("dashboard");
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const isRegister = mode === "register";
  const isForgotPassword = mode === "forgot";
  const isResetPassword = mode === "reset";
  const showPassword = !isForgotPassword;
  const showEmail = !isResetPassword;
  const title = getAuthTitle(mode);
  const subtitle = getAuthSubtitle(mode);

  const passwordHint = useMemo(() => {
    if (values.password.length === 0) {
      return "Use no minimo 8 caracteres.";
    }

    if (values.password.length < 8) {
      return `${8 - values.password.length} caracteres restantes.`;
    }

    return "Senha pronta para envio.";
  }, [values.password]);

  function updateField(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFeedback(null);
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setValues(initialValues);
    setFeedback(null);
    setUserName(null);
    if (nextMode !== "reset") {
      setResetToken("");
      clearResetTokenFromUrl();
    }
  }

  const handleGoogleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    if (!response.credential) {
      setFeedback({ type: "error", message: "Nao foi possivel entrar com Google." });
      return;
    }

    setIsGoogleSubmitting(true);
    setFeedback(null);

    try {
      const result = await fetch("/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ idToken: response.credential })
      });

      const data = await readResponse(result);

      if (!result.ok) {
        throw new Error(getErrorMessage(result.status, data));
      }

      completeLogin(data as LoginResponse);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel entrar com Google."
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  }, []);

  useEffect(() => {
    if (mode !== "login" || !googleClientId || !googleButtonRef.current) {
      return;
    }

    let cancelled = false;
    const clientId = googleClientId;

    function renderGoogleButton() {
      if (cancelled || !window.google || !googleButtonRef.current) {
        return;
      }

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 360
      });
    }

    if (window.google) {
      renderGoogleButton();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleButton;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      window.google?.accounts.id.cancel();
    };
  }, [handleGoogleCredential, mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const { endpoint, payload } = getAuthRequest(mode, values, resetToken);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(response.status, data));
      }

      if (isRegister) {
        setMode("login");
        setValues({ ...initialValues, email: values.email.trim() });
        setFeedback({
          type: "success",
          message: "Conta criada com sucesso. Agora entre com sua senha."
        });
        return;
      }

      if (isForgotPassword) {
        setFeedback({
          type: "success",
          message: getResponseMessage(data, "Se o email existir, enviaremos um link de recuperacao.")
        });
        return;
      }

      if (isResetPassword) {
        setMode("login");
        setResetToken("");
        setValues(initialValues);
        clearResetTokenFromUrl();
        setFeedback({
          type: "success",
          message: getResponseMessage(data, "Senha atualizada com sucesso. Entre com a nova senha.")
        });
        return;
      }

      const loginData = data as LoginResponse;
      completeLogin(loginData);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel concluir a solicitacao."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("studyplatform_token");
    localStorage.removeItem("studyplatform_user");
    setCurrentView("auth");
    setUserName(null);
    setFeedback(null);
    setMode("login");
    setCurrentSection("dashboard");
  }

  function completeLogin(loginData: LoginResponse) {
    localStorage.setItem("studyplatform_token", loginData.accessToken);
    localStorage.setItem("studyplatform_user", JSON.stringify(loginData));
    setUserName(loginData.name);
    setCurrentView("home");
    setValues(initialValues);
  }

  if (currentView === "home") {
    return (
      <HomePage
        currentSection={currentSection}
        userName={userName ?? "Paulo"}
        onLogout={handleLogout}
        onSectionChange={setCurrentSection}
      />
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-label="Tela de autenticacao">
        <div className="visual-panel">
          <img src={spaceImage} alt="" className="space-art" />
          <div className="visual-overlay" />
          <div className="brand-mark">Study Platform</div>
          <div className="adventure-copy">
            <span>Organize sua</span>
            <strong>aventura.</strong>
          </div>
        </div>

        <div className="form-panel">
          <div className="form-card">
            {mode === "login" || mode === "register" ? (
              <div className="mode-toggle" aria-label="Escolher fluxo">
                <button
                  type="button"
                  className={mode === "login" ? "active" : ""}
                  onClick={() => changeMode("login")}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  className={mode === "register" ? "active" : ""}
                  onClick={() => changeMode("register")}
                >
                  Criar conta
                </button>
              </div>
            ) : (
              <button className="back-button" type="button" onClick={() => changeMode("login")}>
                Voltar ao login
              </button>
            )}

            <div className="heading-group">
              <p className="eyebrow">Study dashboard</p>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>

            {userName ? (
              <div className="welcome-panel">
                <span>Conectado como</span>
                <strong>{userName}</strong>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="auth-form">
              {isRegister ? (
                <label>
                  Nome
                  <span className="input-wrap">
                    <UserIcon />
                    <input
                      type="text"
                      autoComplete="name"
                      value={values.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      placeholder="Seu nome"
                      maxLength={120}
                      required
                    />
                  </span>
                </label>
              ) : null}

              {showEmail ? (
                <label>
                  Email
                  <span className="input-wrap">
                    <MailIcon />
                    <input
                      type="email"
                      autoComplete="email"
                      value={values.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="voce@email.com"
                      maxLength={180}
                      required
                    />
                  </span>
                </label>
              ) : null}

              {showPassword ? (
                <label>
                  {isResetPassword ? "Nova senha" : "Senha"}
                  <span className="input-wrap">
                    <LockIcon />
                    <input
                      type="password"
                      autoComplete={isRegister || isResetPassword ? "new-password" : "current-password"}
                      value={values.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      placeholder="No minimo 8 caracteres"
                      minLength={8}
                      maxLength={72}
                      required
                    />
                  </span>
                </label>
              ) : null}

              {showPassword ? <p className="password-hint">{passwordHint}</p> : null}

              {mode === "login" ? (
                <div className="forgot-row">
                  <button type="button" onClick={() => changeMode("forgot")}>
                    Esqueci minha senha
                  </button>
                </div>
              ) : null}

              {feedback ? (
                <div className={`feedback ${feedback.type}`} role="status">
                  {feedback.message}
                </div>
              ) : null}

              <button className="submit-button" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Enviando..."
                  : getSubmitLabel(mode)}
              </button>
            </form>

            {mode === "login" ? (
              <div className="google-section">
                <div className="auth-divider">
                  <span>ou</span>
                </div>
                {googleClientId ? (
                  <>
                    <div ref={googleButtonRef} className="google-button-slot" />
                    {isGoogleSubmitting ? <p className="google-status">Entrando com Google...</p> : null}
                  </>
                ) : (
                  <p className="google-status">Configure VITE_GOOGLE_CLIENT_ID para habilitar Google.</p>
                )}
              </div>
            ) : null}

            {mode === "login" || mode === "register" ? (
              <p className="switch-copy">
                {isRegister ? "Ja tem uma conta?" : "Ainda nao tem conta?"}
                <button
                  type="button"
                  onClick={() => changeMode(isRegister ? "login" : "register")}
                >
                  {isRegister ? "Entrar" : "Criar conta"}
                </button>
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function HomePage({
  currentSection,
  userName,
  onLogout,
  onSectionChange
}: {
  currentSection: HomeSection;
  userName: string;
  onLogout: () => void;
  onSectionChange: (section: HomeSection) => void;
}) {
  const initials = getInitials(userName);

  return (
    <main className="home-page">
      <aside className="sidebar">
        <button
          className="sidebar-brand"
          type="button"
          onClick={() => onSectionChange("dashboard")}
          aria-label="Ir para a pagina principal"
        >
          <img src={studyPlatformLogo} alt="Study Platform" />
        </button>

        <nav className="side-nav" aria-label="Navegacao principal">
          {navItems.map((item) => (
            <button
              className={currentSection === item.section ? "active" : ""}
              type="button"
              key={item.label}
              onClick={() => onSectionChange(item.section)}
            >
              <DashboardIcon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="journey-card">
          <div className="rocket-mark">
            <DashboardIcon name="rocket" />
          </div>
          <strong>Continue sua jornada</strong>
          <p>A consistencia e o que transforma aprendizado em conquista.</p>
          <div className="journey-progress">
            <span />
          </div>
          <small>75%</small>
        </div>
      </aside>

      <section className="dashboard">
        <header className="dashboard-header">
          <div>
            <h1>{currentSection === "dashboard" ? "Bem-vindo(a) de volta!" : getSectionLabel(currentSection)}</h1>
            <p>
              {currentSection === "dashboard"
                ? "Pronto para mais uma sessao de estudos?"
                : getSectionSubtitle(currentSection)}
            </p>
          </div>

          <div className="header-actions">
            <label className="search-box">
              <span className="sr-only">Buscar</span>
              <input type="search" placeholder="Buscar..." />
              <SearchIcon />
            </label>
            <button className="profile-button" type="button" aria-label="Perfil">
              {initials}
            </button>
            <button className="logout-button" type="button" onClick={onLogout}>
              Sair
            </button>
          </div>
        </header>

        {currentSection === "subjects" ? (
          <SubjectsPage />
        ) : currentSection === "notes" ? (
          <NotesPage />
        ) : currentSection === "flashcards" ? (
          <FlashcardsPage />
        ) : currentSection === "reviews" ? (
          <ReviewSessionPage />
        ) : currentSection === "dashboard" ? (
          <DashboardHome />
        ) : (
          <PlaceholderSection section={currentSection} />
        )}
      </section>
    </main>
  );
}

function DashboardHome() {
  return (
    <>
        <section className="hero-dashboard">
          <img src={spaceImage} alt="" />
          <div className="hero-shade" />
          <div className="hero-content">
            <p>Foco do dia</p>
            <h2>
              Pequenos passos,
              <span> grandes conquistas.</span>
            </h2>
            <p>Mantenha o foco e veja os resultados acontecerem.</p>
            <button type="button">
              <DashboardIcon name="spark" />
              Comecar a estudar
            </button>
          </div>
        </section>

        <section className="overview-grid" aria-label="Resumo dos estudos">
          {overviewCards.map((card) => (
            <article className="metric-card" key={card.label}>
              <div className="metric-icon">
                <DashboardIcon name={card.icon} />
              </div>
              <div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <p>{card.detail}</p>
              </div>
              <button type="button" aria-label={`Abrir ${card.label}`}>
                <ArrowIcon />
              </button>
            </article>
          ))}
        </section>

        <section className="dashboard-panels">
          <article className="activity-panel">
            <div className="panel-heading">
              <h2>
                <DashboardIcon name="calendar" />
                Atividades recentes
              </h2>
              <button type="button">Ver tudo</button>
            </div>

            <div className="activity-list">
              {recentActivities.map((activity, index) => (
                <div className="activity-item" key={activity.title}>
                  <div className={`activity-icon tone-${index % 3}`}>
                    <DashboardIcon name={index % 2 === 0 ? "note" : "cards"} />
                  </div>
                  <div>
                    <strong>{activity.title}</strong>
                    <span>{activity.subject}</span>
                  </div>
                  <time>{activity.time}</time>
                </div>
              ))}
            </div>

            <button className="wide-button" type="button">
              Ver todas as atividades
            </button>
          </article>

          <article className="progress-panel">
            <div className="panel-heading">
              <h2>
                <DashboardIcon name="chart" />
                Progresso semanal
              </h2>
              <button type="button">Esta semana</button>
            </div>

            <div className="chart-area" aria-label="Grafico de progresso semanal">
              <svg viewBox="0 0 640 260" role="img" aria-label="Progresso da semana">
                <defs>
                  <linearGradient id="progressFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#8f52ff" stopOpacity="0.78" />
                    <stop offset="100%" stopColor="#8f52ff" stopOpacity="0.04" />
                  </linearGradient>
                </defs>
                <path className="grid-line" d="M42 34H610" />
                <path className="grid-line" d="M42 88H610" />
                <path className="grid-line" d="M42 142H610" />
                <path className="grid-line" d="M42 196H610" />
                <path className="area-path" d="M42 150 C82 118 112 140 138 128 C180 108 194 62 236 80 C284 98 304 88 342 96 C394 108 416 146 458 132 C500 116 508 80 552 62 C578 50 592 44 610 38 L610 226 L42 226Z" />
                <path className="line-path" d="M42 150 C82 118 112 140 138 128 C180 108 194 62 236 80 C284 98 304 88 342 96 C394 108 416 146 458 132 C500 116 508 80 552 62 C578 50 592 44 610 38" />
                {[42, 138, 236, 342, 458, 552, 610].map((x, index) => (
                  <circle
                    className="chart-dot"
                    cx={x}
                    cy={[150, 128, 80, 96, 132, 62, 38][index]}
                    r="5"
                    key={x}
                  />
                ))}
              </svg>
              <div className="chart-labels">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </div>

            <div className="progress-summary">
              <DashboardIcon name="spark" />
              <div>
                <strong>Otimo progresso!</strong>
                <p>Voce esta acima da media semanal.</p>
              </div>
              <span className="progress-ring">75%</span>
            </div>
          </article>
        </section>
    </>
  );
}

function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formValues, setFormValues] = useState<SubjectFormValues>(emptySubjectForm);

  const loadSubjects = useCallback(async () => {
    setIsLoading(true);

    try {
      const subjectsData = await apiRequest<Subject[]>("/subjects");
      setSubjects(subjectsData);
      setFeedback(null);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel carregar seus assuntos."
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  function openCreateModal() {
    setEditingSubject(null);
    setFormValues(emptySubjectForm);
    setFeedback(null);
    setIsModalOpen(true);
  }

  function openEditModal(subject: Subject) {
    setEditingSubject(subject);
    setFormValues({ name: subject.name });
    setFeedback(null);
    setIsModalOpen(true);
  }

  function closeSubjectModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingSubject(null);
    setFormValues(emptySubjectForm);
  }

  async function handleSubjectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const payload = {
      name: formValues.name.trim()
    };

    try {
      const savedSubject = await apiRequest<Subject>(editingSubject ? `/subjects/${editingSubject.id}` : "/subjects", {
        method: editingSubject ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });

      setSubjects((current) => {
        if (editingSubject) {
          return current.map((subject) => (subject.id === savedSubject.id ? savedSubject : subject));
        }

        return [savedSubject, ...current];
      });
      setFeedback({
        type: "success",
        message: editingSubject ? "Assunto atualizado." : "Assunto criado."
      });
      setIsModalOpen(false);
      setEditingSubject(null);
      setFormValues(emptySubjectForm);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel salvar o assunto."
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSubject(subject: Subject) {
    setDeletingSubjectId(subject.id);
    setFeedback(null);

    try {
      await apiRequest<null>(`/subjects/${subject.id}`, { method: "DELETE" });
      setSubjects((current) => current.filter((item) => item.id !== subject.id));
      setFeedback({ type: "success", message: "Assunto excluido." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel excluir o assunto."
      });
    } finally {
      setDeletingSubjectId(null);
    }
  }

  return (
    <div className="subjects-page">
      <section className="subjects-toolbar" aria-label="Controles de assuntos">
        <div>
          <span>{isLoading ? "Carregando" : `${subjects.length} assuntos`}</span>
          <strong>Organize suas materias</strong>
        </div>

        <button type="button" onClick={openCreateModal}>
          <DashboardIcon name="plus" />
          Novo assunto
        </button>
      </section>

      {feedback ? (
        <div className={`feedback ${feedback.type}`} role="status">
          {feedback.message}
        </div>
      ) : null}

      <section className="subjects-grid" aria-label="Lista de assuntos">
        {!isLoading && subjects.length === 0 ? (
          <div className="empty-state subjects-empty">
            <DashboardIcon name="book" />
            <strong>Nenhum assunto ainda</strong>
            <p>Crie seu primeiro assunto para conectar anotacoes, flashcards e revisoes.</p>
          </div>
        ) : (
          subjects.map((subject, index) => (
            <article className="subject-card" key={subject.id}>
              <div className={`subject-card-icon tone-${index % 4}`}>
                <DashboardIcon name="book" />
              </div>

              <div className="subject-card-content">
                <span>Assunto</span>
                <h2>{subject.name}</h2>
                <time>Atualizado em {formatDate(subject.updatedAt)}</time>
              </div>

              <div className="subject-card-actions">
                <button
                  type="button"
                  onClick={() => openEditModal(subject)}
                  disabled={false}
                  aria-label={`Editar ${subject.name}`}
                >
                  <DashboardIcon name="edit" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSubject(subject)}
                  disabled={deletingSubjectId === subject.id}
                  aria-label={`Excluir ${subject.name}`}
                >
                  <DashboardIcon name="trash" />
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      {isModalOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeSubjectModal}>
          <form
            className="subject-modal"
            onSubmit={handleSubjectSubmit}
            onMouseDown={(event) => event.stopPropagation()}
            aria-label={editingSubject ? "Editar assunto" : "Novo assunto"}
          >
            <div className="modal-heading">
              <div>
                <span>{editingSubject ? "Editar" : "Novo"}</span>
                <h2>{editingSubject ? "Editar assunto" : "Novo assunto"}</h2>
              </div>
              <button type="button" onClick={closeSubjectModal} aria-label="Fechar modal">
                <DashboardIcon name="close" />
              </button>
            </div>

            <label>
              Nome do assunto
              <input
                type="text"
                value={formValues.name}
                onChange={(event) => setFormValues({ name: event.target.value })}
                placeholder="Ex: Matematica"
                maxLength={120}
                required
                autoFocus
              />
            </label>

            <div className="editor-actions">
              <button type="button" className="ghost-button" onClick={closeSubjectModal}>
                Cancelar
              </button>
              <button type="submit" className="save-note-button" disabled={isSaving}>
                <DashboardIcon name="check" />
                {isSaving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function FlashcardsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [formValues, setFormValues] = useState<FlashcardFormValues>(emptyFlashcardForm);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingFlashcardId, setDeletingFlashcardId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fallbackSubjectId = selectedSubjectId === "all" ? subjects[0]?.id ?? "" : selectedSubjectId;
  const filteredSubjectName = selectedSubjectId === "all" ? "Todos os assuntos" : getSubjectName(subjects, selectedSubjectId);

  const loadFlashcards = useCallback(async () => {
    setIsLoading(true);

    try {
      const [subjectsData, flashcardsData] = await Promise.all([
        apiRequest<Subject[]>("/subjects"),
        apiRequest<Flashcard[]>(selectedSubjectId === "all" ? "/flashcards" : `/subjects/${selectedSubjectId}/flashcards`)
      ]);

      setSubjects(subjectsData);
      setFlashcards(flashcardsData);
      setFeedback(null);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel carregar seus flashcards."
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    loadFlashcards();
  }, [loadFlashcards]);

  function openCreateModal() {
    setEditingFlashcard(null);
    setFormValues(buildFlashcardForm(null, fallbackSubjectId));
    setFeedback(null);
    setIsModalOpen(true);
  }

  function openEditModal(flashcard: Flashcard) {
    setEditingFlashcard(flashcard);
    setFormValues(buildFlashcardForm(flashcard, fallbackSubjectId));
    setFeedback(null);
    setIsModalOpen(true);
  }

  function closeFlashcardModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingFlashcard(null);
    setFormValues(emptyFlashcardForm);
  }

  function updateFlashcardField<K extends keyof FlashcardFormValues>(field: K, value: FlashcardFormValues[K]) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFeedback(null);
  }

  async function handleFlashcardSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formValues.subjectId) {
      setFeedback({ type: "error", message: "Escolha um assunto antes de salvar o flashcard." });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const payload = {
      subjectId: formValues.subjectId,
      question: formValues.question.trim(),
      answer: formValues.answer.trim(),
      difficulty: formValues.difficulty
    };

    try {
      const savedFlashcard = await apiRequest<Flashcard>(
        editingFlashcard ? `/flashcards/${editingFlashcard.id}` : "/flashcards",
        {
          method: editingFlashcard ? "PUT" : "POST",
          body: JSON.stringify(payload)
        }
      );

      setFlashcards((current) => {
        if (editingFlashcard) {
          return current.map((flashcard) => (flashcard.id === savedFlashcard.id ? savedFlashcard : flashcard));
        }

        if (selectedSubjectId !== "all" && savedFlashcard.subjectId !== selectedSubjectId) {
          return current;
        }

        return [savedFlashcard, ...current];
      });
      setFeedback({
        type: "success",
        message: editingFlashcard ? "Flashcard atualizado." : "Flashcard criado."
      });
      setIsModalOpen(false);
      setEditingFlashcard(null);
      setFormValues(buildFlashcardForm(null, savedFlashcard.subjectId));
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel salvar o flashcard."
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteFlashcard(flashcard: Flashcard) {
    setDeletingFlashcardId(flashcard.id);
    setFeedback(null);

    try {
      await apiRequest<null>(`/flashcards/${flashcard.id}`, { method: "DELETE" });
      setFlashcards((current) => current.filter((item) => item.id !== flashcard.id));
      setFeedback({ type: "success", message: "Flashcard excluido." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel excluir o flashcard."
      });
    } finally {
      setDeletingFlashcardId(null);
    }
  }

  return (
    <div className="flashcards-page">
      <section className="flashcards-toolbar" aria-label="Controles de flashcards">
        <div>
          <span>{isLoading ? "Carregando" : `${flashcards.length} flashcards`}</span>
          <strong>{filteredSubjectName}</strong>
        </div>

        <label>
          <span className="sr-only">Filtrar por assunto</span>
          <select
            value={selectedSubjectId}
            onChange={(event) => {
              setSelectedSubjectId(event.target.value);
              setEditingFlashcard(null);
              setFormValues(emptyFlashcardForm);
            }}
          >
            <option value="all">Todos os assuntos</option>
            {subjects.map((subject) => (
              <option value={subject.id} key={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={openCreateModal} disabled={subjects.length === 0}>
          <DashboardIcon name="plus" />
          Novo flashcard
        </button>
      </section>

      {feedback ? (
        <div className={`feedback ${feedback.type}`} role="status">
          {feedback.message}
        </div>
      ) : null}

      <section className="flashcards-grid" aria-label="Lista de flashcards">
        {isLoading ? (
          <div className="empty-state flashcards-empty">Carregando flashcards...</div>
        ) : flashcards.length === 0 ? (
          <div className="empty-state flashcards-empty">
            <DashboardIcon name="cards" />
            <strong>Nenhum flashcard ainda</strong>
            <p>Crie cards com pergunta e resposta para revisar seus assuntos.</p>
          </div>
        ) : (
          flashcards.map((flashcard, index) => (
            <article className="flashcard-card" key={flashcard.id}>
              <div className="flashcard-card-top">
                <span>{getSubjectName(subjects, flashcard.subjectId)}</span>
                <strong className={`difficulty-pill tone-${flashcard.difficulty.toLowerCase()}`}>
                  {getDifficultyLabel(flashcard.difficulty)}
                </strong>
              </div>

              <div className={`flashcard-visual tone-${index % 3}`}>
                <p>{getFlashcardPreview(flashcard.question)}</p>
              </div>

              <div className="flashcard-answer">
                <span>Resposta</span>
                <p>{getFlashcardPreview(flashcard.answer)}</p>
              </div>

              <div className="subject-card-actions">
                <button
                  type="button"
                  onClick={() => openEditModal(flashcard)}
                  aria-label="Editar flashcard"
                >
                  <DashboardIcon name="edit" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFlashcard(flashcard)}
                  disabled={deletingFlashcardId === flashcard.id}
                  aria-label="Excluir flashcard"
                >
                  <DashboardIcon name="trash" />
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      {isModalOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeFlashcardModal}>
          <form
            className="subject-modal flashcard-modal"
            onSubmit={handleFlashcardSubmit}
            onMouseDown={(event) => event.stopPropagation()}
            aria-label={editingFlashcard ? "Editar flashcard" : "Novo flashcard"}
          >
            <div className="modal-heading">
              <div>
                <span>{editingFlashcard ? "Editar" : "Novo"}</span>
                <h2>{editingFlashcard ? "Editar flashcard" : "Novo flashcard"}</h2>
              </div>
              <button type="button" onClick={closeFlashcardModal} aria-label="Fechar modal">
                <DashboardIcon name="close" />
              </button>
            </div>

            <label>
              Assunto
              <select
                value={formValues.subjectId}
                onChange={(event) => updateFlashcardField("subjectId", event.target.value)}
                required
              >
                <option value="">Escolha um assunto</option>
                {subjects.map((subject) => (
                  <option value={subject.id} key={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Dificuldade
              <select
                value={formValues.difficulty}
                onChange={(event) => updateFlashcardField("difficulty", event.target.value as Difficulty)}
                required
              >
                <option value="EASY">Facil</option>
                <option value="MEDIUM">Media</option>
                <option value="HARD">Dificil</option>
              </select>
            </label>

            <label>
              Pergunta
              <textarea
                value={formValues.question}
                onChange={(event) => updateFlashcardField("question", event.target.value)}
                placeholder="Ex: O que e polimorfismo?"
                maxLength={1000}
                required
                autoFocus
              />
            </label>

            <label>
              Resposta
              <textarea
                value={formValues.answer}
                onChange={(event) => updateFlashcardField("answer", event.target.value)}
                placeholder="Explique a resposta com clareza..."
                maxLength={5000}
                required
              />
            </label>

            <div className="editor-actions">
              <button type="button" className="ghost-button" onClick={closeFlashcardModal}>
                Cancelar
              </button>
              <button type="submit" className="save-note-button" disabled={isSaving}>
                <DashboardIcon name="check" />
                {isSaving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function ReviewSessionPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCard = reviewCards[currentIndex] ?? null;
  const totalCards = reviewCards.length;
  const progress = totalCards === 0 ? 0 : Math.round((reviewedCount / totalCards) * 100);

  const loadReviewSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const [subjectsData, reviewCardsData] = await Promise.all([
        apiRequest<Subject[]>("/subjects"),
        apiRequest<Flashcard[]>("/flashcards/review")
      ]);

      setSubjects(subjectsData);
      setReviewCards(reviewCardsData);
      setCurrentIndex(0);
      setReviewedCount(0);
      setIsAnswerVisible(false);
      setIsFinished(false);
      setFeedback(null);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel carregar suas revisoes."
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviewSession();
  }, [loadReviewSession]);

  async function handleReviewAnswer(difficulty: Difficulty) {
    if (!currentCard) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await apiRequest<Flashcard>(`/flashcards/${currentCard.id}/review`, {
        method: "POST",
        body: JSON.stringify({
          correct: difficulty !== "HARD",
          difficulty
        })
      });

      const nextReviewedCount = reviewedCount + 1;
      setReviewedCount(nextReviewedCount);
      setIsAnswerVisible(false);

      if (currentIndex + 1 >= totalCards) {
        setIsFinished(true);
        return;
      }

      setCurrentIndex((index) => index + 1);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel registrar a revisao."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="review-session-page">
        <div className="empty-state review-empty">Carregando revisoes...</div>
      </section>
    );
  }

  if (feedback) {
    return (
      <section className="review-session-page">
        <div className={`feedback ${feedback.type}`} role="status">
          {feedback.message}
        </div>
        <button className="review-secondary-button" type="button" onClick={loadReviewSession}>
          Tentar novamente
        </button>
      </section>
    );
  }

  if (totalCards === 0) {
    return (
      <section className="review-session-page">
        <div className="empty-state review-empty">
          <DashboardIcon name="calendar" />
          <strong>Nada pendente por agora</strong>
          <p>Quando seus flashcards chegarem na data de revisao, eles aparecem aqui.</p>
        </div>
      </section>
    );
  }

  if (isFinished) {
    return (
      <section className="review-session-page">
        <div className="review-finished">
          <DashboardIcon name="check" />
          <span>Sessao concluida</span>
          <h2>{reviewedCount} revisoes finalizadas</h2>
          <p>Os intervalos dos cards foram atualizados e a proxima revisao ja ficou agendada.</p>
          <button type="button" onClick={loadReviewSession}>
            Revisar novamente
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="review-session-page">
      <div className="review-progress-panel" aria-label="Progresso da sessao">
        <div>
          <span>Card {currentIndex + 1} de {totalCards}</span>
          <strong>{progress}% concluido</strong>
        </div>
        <div className="review-progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      {currentCard ? (
        <article className="review-card">
          <div className="review-card-meta">
            <span>{getSubjectName(subjects, currentCard.subjectId)}</span>
            <strong className={`difficulty-pill tone-${currentCard.difficulty.toLowerCase()}`}>
              {getDifficultyLabel(currentCard.difficulty)}
            </strong>
          </div>

          <div className="review-question">
            <span>Pergunta</span>
            <h2>{currentCard.question}</h2>
          </div>

          <div className={`review-answer ${isAnswerVisible ? "visible" : ""}`}>
            <span>Resposta</span>
            {isAnswerVisible ? <p>{currentCard.answer}</p> : <p>Revele a resposta quando estiver pronto.</p>}
          </div>

          <div className="review-card-footer">
            <span>Proxima atualizacao usa intervalo atual de {currentCard.reviewInterval} dia(s).</span>
            <time>Agendado para {formatReviewDate(currentCard.nextReviewDate)}</time>
          </div>

          {!isAnswerVisible ? (
            <button className="review-reveal-button" type="button" onClick={() => setIsAnswerVisible(true)}>
              Revelar resposta
            </button>
          ) : (
            <div className="review-rating-actions">
              <button type="button" onClick={() => handleReviewAnswer("EASY")} disabled={isSubmitting}>
                Facil
              </button>
              <button type="button" onClick={() => handleReviewAnswer("MEDIUM")} disabled={isSubmitting}>
                Medio
              </button>
              <button type="button" onClick={() => handleReviewAnswer("HARD")} disabled={isSubmitting}>
                Dificil
              </button>
            </div>
          )}
        </article>
      ) : null}
    </section>
  );
}

function NotesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<NoteFormValues>(emptyNoteForm);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedNote = notes.find((note) => note.id === selectedNoteId) ?? null;
  const fallbackSubjectId = selectedSubjectId === "all" ? subjects[0]?.id ?? "" : selectedSubjectId;
  const filteredSubjectName = selectedSubjectId === "all" ? "Todos os assuntos" : getSubjectName(subjects, selectedSubjectId);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);

    try {
      const [subjectsData, notesData] = await Promise.all([
        apiRequest<Subject[]>("/subjects"),
        apiRequest<Note[]>(selectedSubjectId === "all" ? "/notes" : `/subjects/${selectedSubjectId}/notes`)
      ]);

      setSubjects(subjectsData);
      setNotes(notesData);
      setSelectedNoteId((current) =>
        current && notesData.some((note) => note.id === current) ? current : notesData[0]?.id ?? null
      );

      setFormValues((current) => {
        if (current.subjectId || editingNoteId) {
          return current;
        }

        return buildNoteForm(null, selectedSubjectId === "all" ? subjectsData[0]?.id ?? "" : selectedSubjectId);
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel carregar suas anotacoes."
      });
    } finally {
      setIsLoading(false);
    }
  }, [editingNoteId, selectedSubjectId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  function updateNoteField(field: keyof NoteFormValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFeedback(null);
  }

  function startNewNote() {
    setEditingNoteId(null);
    setFormValues(buildNoteForm(null, fallbackSubjectId));
    setFeedback(null);
  }

  function startEditing(note: Note) {
    setEditingNoteId(note.id);
    setSelectedNoteId(note.id);
    setFormValues(buildNoteForm(note, fallbackSubjectId));
    setFeedback(null);
  }

  async function handleNoteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formValues.subjectId) {
      setFeedback({ type: "error", message: "Escolha um assunto antes de salvar a anotacao." });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const payload = {
      subjectId: formValues.subjectId,
      title: formValues.title.trim(),
      content: formValues.content.trim()
    };

    try {
      const savedNote = await apiRequest<Note>(editingNoteId ? `/notes/${editingNoteId}` : "/notes", {
        method: editingNoteId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });

      setSelectedNoteId(savedNote.id);
      setEditingNoteId(null);
      setFormValues(buildNoteForm(null, savedNote.subjectId));
      setFeedback({
        type: "success",
        message: editingNoteId ? "Anotacao atualizada." : "Anotacao criada."
      });

      if (selectedSubjectId !== "all" && selectedSubjectId !== savedNote.subjectId) {
        setSelectedSubjectId(savedNote.subjectId);
      } else {
        await loadNotes();
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel salvar a anotacao."
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteNote() {
    if (!selectedNote) {
      return;
    }

    setIsDeleting(true);
    setFeedback(null);

    try {
      await apiRequest<null>(`/notes/${selectedNote.id}`, { method: "DELETE" });
      const remainingNotes = notes.filter((note) => note.id !== selectedNote.id);

      setNotes(remainingNotes);
      setSelectedNoteId(remainingNotes[0]?.id ?? null);
      if (editingNoteId === selectedNote.id) {
        setEditingNoteId(null);
        setFormValues(buildNoteForm(null, fallbackSubjectId));
      }
      setFeedback({ type: "success", message: "Anotacao excluida." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel excluir a anotacao."
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="notes-page">
      <section className="notes-toolbar" aria-label="Controles de anotacoes">
        <div>
          <span>{notes.length} anotacoes</span>
          <strong>{filteredSubjectName}</strong>
        </div>

        <label>
          <span className="sr-only">Filtrar por assunto</span>
          <select
            value={selectedSubjectId}
            onChange={(event) => {
              setSelectedSubjectId(event.target.value);
              setEditingNoteId(null);
              setFormValues(emptyNoteForm);
            }}
          >
            <option value="all">Todos os assuntos</option>
            {subjects.map((subject) => (
              <option value={subject.id} key={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={startNewNote} disabled={subjects.length === 0}>
          <DashboardIcon name="plus" />
          Nova note
        </button>
      </section>

      {feedback ? (
        <div className={`feedback ${feedback.type}`} role="status">
          {feedback.message}
        </div>
      ) : null}

      <section className="notes-grid">
        <aside className="notes-list-panel" aria-label="Lista de anotacoes">
          {isLoading ? (
            <div className="empty-state">Carregando anotacoes...</div>
          ) : notes.length === 0 ? (
            <div className="empty-state">
              <DashboardIcon name="note" />
              <strong>Nenhuma anotacao ainda</strong>
              <p>Escolha um assunto e crie sua primeira note.</p>
            </div>
          ) : (
            <div className="notes-list">
              {notes.map((note) => (
                <button
                  className={selectedNoteId === note.id ? "active" : ""}
                  type="button"
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                >
                  <span>{getSubjectName(subjects, note.subjectId)}</span>
                  <strong>{note.title}</strong>
                  <p>{getNotePreview(note.content)}</p>
                  <time>{formatDate(note.updatedAt)}</time>
                </button>
              ))}
            </div>
          )}
        </aside>

        <article className="note-detail-panel">
          {selectedNote ? (
            <>
              <div className="note-detail-heading">
                <div>
                  <span>{getSubjectName(subjects, selectedNote.subjectId)}</span>
                  <h2>{selectedNote.title}</h2>
                  <time>Atualizada em {formatDate(selectedNote.updatedAt)}</time>
                </div>
                <div className="note-actions">
                  <button type="button" onClick={() => startEditing(selectedNote)} aria-label="Editar note">
                    <DashboardIcon name="edit" />
                  </button>
                  <button type="button" onClick={handleDeleteNote} disabled={isDeleting} aria-label="Excluir note">
                    <DashboardIcon name="trash" />
                  </button>
                </div>
              </div>

              <div className="note-content">{selectedNote.content}</div>
            </>
          ) : (
            <div className="empty-state detail-empty">
              <DashboardIcon name="note" />
              <strong>Selecione uma note</strong>
              <p>O detalhe da anotacao aparece aqui.</p>
            </div>
          )}
        </article>

        <form className="note-editor-panel" onSubmit={handleNoteSubmit}>
          <div className="panel-heading compact">
            <h2>
              <DashboardIcon name={editingNoteId ? "edit" : "plus"} />
              {editingNoteId ? "Editar note" : "Nova note"}
            </h2>
          </div>

          <label>
            Assunto
            <select
              value={formValues.subjectId}
              onChange={(event) => updateNoteField("subjectId", event.target.value)}
              disabled={subjects.length === 0}
              required
            >
              <option value="">Escolha um assunto</option>
              {subjects.map((subject) => (
                <option value={subject.id} key={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Titulo
            <input
              type="text"
              value={formValues.title}
              onChange={(event) => updateNoteField("title", event.target.value)}
              maxLength={160}
              placeholder="Ex: Ciclo de vida das estrelas"
              required
            />
          </label>

          <label>
            Conteudo
            <textarea
              value={formValues.content}
              onChange={(event) => updateNoteField("content", event.target.value)}
              maxLength={10000}
              placeholder="Escreva sua anotacao..."
              required
            />
          </label>

          <div className="editor-actions">
            {editingNoteId ? (
              <button type="button" className="ghost-button" onClick={startNewNote}>
                Cancelar
              </button>
            ) : null}
            <button type="submit" className="save-note-button" disabled={isSaving || subjects.length === 0}>
              <DashboardIcon name="check" />
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function PlaceholderSection({ section }: { section: HomeSection }) {
  return (
    <section className="placeholder-section">
      <DashboardIcon name={navItems.find((item) => item.section === section)?.icon ?? "dashboard"} />
      <h2>{placeholderTitles[section]}</h2>
      <p>{placeholderCopy[section]}</p>
    </section>
  );
}

async function readResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getAuthTitle(mode: AuthMode) {
  if (mode === "register") {
    return "Criar conta";
  }

  if (mode === "forgot") {
    return "Recuperar senha";
  }

  if (mode === "reset") {
    return "Nova senha";
  }

  return "Entrar";
}

function getAuthSubtitle(mode: AuthMode) {
  if (mode === "register") {
    return "Comece sua jornada de estudos em poucos segundos.";
  }

  if (mode === "forgot") {
    return "Informe seu email para receber um link de recuperacao.";
  }

  if (mode === "reset") {
    return "Crie uma senha nova para voltar ao seu painel.";
  }

  return "Acesse seu painel e continue de onde parou.";
}

function getAuthRequest(mode: AuthMode, values: typeof initialValues, resetToken: string) {
  if (mode === "register") {
    return {
      endpoint: "/auth/register",
      payload: {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password
      }
    };
  }

  if (mode === "forgot") {
    return {
      endpoint: "/auth/forgot-password",
      payload: {
        email: values.email.trim()
      }
    };
  }

  if (mode === "reset") {
    return {
      endpoint: "/auth/reset-password",
      payload: {
        token: resetToken,
        password: values.password
      }
    };
  }

  return {
    endpoint: "/auth/login",
    payload: {
      email: values.email.trim(),
      password: values.password
    }
  };
}

function getSubmitLabel(mode: AuthMode) {
  if (mode === "register") {
    return "Criar minha conta";
  }

  if (mode === "forgot") {
    return "Enviar email";
  }

  if (mode === "reset") {
    return "Atualizar senha";
  }

  return "Fazer login";
}

function getSectionSubtitle(section: HomeSection) {
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

function getResponseMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data !== null && "message" in data) {
    return String((data as { message: unknown }).message);
  }

  return fallback;
}

function clearResetTokenFromUrl() {
  if (!window.location.search.includes("resetToken=")) {
    return;
  }

  window.history.replaceState({}, document.title, window.location.pathname);
}

function getErrorMessage(status: number, data: unknown) {
  if (typeof data === "object" && data !== null && "message" in data) {
    return String((data as { message: unknown }).message);
  }

  if (typeof data === "object" && data !== null && "detail" in data) {
    return String((data as { detail: unknown }).detail);
  }

  if (status === 401) {
    return "Email ou senha invalidos.";
  }

  if (status === 409) {
    return "Este email ja esta cadastrado.";
  }

  return "Nao foi possivel conectar. Verifique se o backend esta rodando.";
}

function getStoredUserName() {
  const storedUser = localStorage.getItem("studyplatform_user");

  if (!storedUser) {
    return null;
  }

  try {
    return (JSON.parse(storedUser) as Partial<LoginResponse>).name ?? null;
  } catch {
    return null;
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function DashboardIcon({ name }: { name: string }) {
  const icons: Record<string, ReactNode> = {
    dashboard: (
      <>
        <path d="M4 10.5 12 4l8 6.5" />
        <path d="M6 9.5V20h12V9.5" />
        <path d="M10 20v-6h4v6" />
      </>
    ),
    book: (
      <>
        <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H20v17H8.5A3.5 3.5 0 0 0 5 22Z" />
        <path d="M5 5.5A3.5 3.5 0 0 0 1.5 2H4v17h1" />
        <path d="M8 5h8" />
      </>
    ),
    note: (
      <>
        <path d="M6 3h12v18H6z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </>
    ),
    cards: (
      <>
        <path d="M8 7h11v11H8z" />
        <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
        <path d="M11 11h5" />
      </>
    ),
    calendar: (
      <>
        <path d="M5 4h14v16H5z" />
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M5 9h14" />
        <path d="M9 13h2" />
        <path d="M13 13h2" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V5" />
        <path d="M4 20h16" />
        <path d="M8 16v-4" />
        <path d="M12 16V8" />
        <path d="M16 16v-7" />
      </>
    ),
    user: (
      <>
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19 12a7.8 7.8 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7.4 7.4 0 0 0-1.7-1L14.5 3h-5l-.4 3a7.4 7.4 0 0 0-1.7 1L5 6 3 9.5 5 11a7.8 7.8 0 0 0 0 2l-2 1.5L5 18l2.4-1a7.4 7.4 0 0 0 1.7 1l.4 3h5l.4-3a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1Z" />
      </>
    ),
    rocket: (
      <>
        <path d="M14 4c3.5 0 6 1.2 6 1.2S18.8 12 15 15.8c-2.4 2.4-5.5 3-5.5 3l-4.3-4.3s.6-3.1 3-5.5C10.2 7 12.1 5.3 14 4Z" />
        <path d="M9 15 4 20" />
        <path d="M15 9h.01" />
      </>
    ),
    spark: (
      <>
        <path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7Z" />
        <path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    edit: (
      <>
        <path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z" />
        <path d="m13.5 6.5 4 4" />
      </>
    ),
    trash: (
      <>
        <path d="M5 7h14" />
        <path d="M9 7V4h6v3" />
        <path d="M8 10v9" />
        <path d="M16 10v9" />
        <path d="M6 7l1 14h10l1-14" />
      </>
    ),
    check: (
      <>
        <path d="m5 12 4 4L19 6" />
      </>
    ),
    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    )
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {icons[name] ?? icons.dashboard}
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 11h10v9H7z" />
      <path d="M9 11V8a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export default App;
