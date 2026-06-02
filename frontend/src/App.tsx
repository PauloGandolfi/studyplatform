import { CSSProperties, ChangeEvent, FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import spaceImage from "./assets/space-login.png";
import studyPlatformLogo from "./assets/study-platform-logo.png";
import { apiRequest, getErrorMessage, readResponse, unauthorizedEventName } from "./shared/api/client";
import { clearAuthStorage, getStoredUserName, persistAuthSession } from "./shared/lib/auth-storage";
import { getPlaceholderCopy, getSectionLabel, getSectionSubtitle, HomeSection, navItems } from "./features/home/config/navigation";

type AuthMode = "login" | "register" | "forgot" | "reset";
type AppView = "auth" | "home";

type Feedback = {
  type: "success" | "error";
  message: string;
};

type LoginResponse = {
  id: string;
  name: string;
  username: string;
  email: string;
  accessToken: string;
  tokenType: string;
};

type Subject = {
  id: string;
  name: string;
  difficulty: Difficulty;
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
type TaskStatus = "TODO" | "DOING" | "DONE";

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

type AiFlashcardSuggestion = {
  question: string;
  answer: string;
  difficulty: Difficulty;
};

type ProfessorMessage = {
  id: number;
  role: "user" | "professor";
  text: string;
};

type StudyTask = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  primaryTask: boolean;
  createdAt: string;
  updatedAt: string;
};

type WeeklyReview = {
  date: string;
  label: string;
  reviews: number;
};

type RecentActivity = {
  title: string;
  subject: string;
  type: string;
  sessionDate: string;
  createdAt: string;
};

type DashboardMetrics = {
  subjects: number;
  notes: number;
  flashcards: number;
  reviewsToday: number;
  totalStudySeconds: number;
  accuracyRate: number;
  streak: number;
  dailyGoal: number;
  dailyProgress: number;
  weeklyReviews: WeeklyReview[];
  recentActivities: RecentActivity[];
};

type StudyTimeResponse = {
  totalStudySeconds: number;
};

type NoteFormValues = {
  subjectId: string;
  title: string;
  content: string;
};

type TaskFormValues = {
  title: string;
  description: string;
  status: TaskStatus;
  primaryTask: boolean;
};

type FlashcardFormValues = {
  subjectId: string;
  question: string;
  answer: string;
  difficulty: Difficulty;
};

type SubjectFormValues = {
  name: string;
  difficulty: Difficulty;
};

const initialValues = {
  name: "",
  username: "",
  email: "",
  password: ""
};

const initialResetToken = new URLSearchParams(window.location.search).get("resetToken") ?? "";

const emptyNoteForm: NoteFormValues = {
  subjectId: "",
  title: "",
  content: ""
};

const emptyTaskForm: TaskFormValues = {
  title: "",
  description: "",
  status: "TODO",
  primaryTask: false
};

const emptyFlashcardForm: FlashcardFormValues = {
  subjectId: "",
  question: "",
  answer: "",
  difficulty: "MEDIUM"
};

const emptySubjectForm: SubjectFormValues = {
  name: "",
  difficulty: "MEDIUM"
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

const notePreviewLimit = 128;
const inactivityLimitMs = 15 * 60 * 1000;
const pauseLimitSeconds = 15 * 60;

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

function buildTaskForm(task: StudyTask | null, primaryTask = false): TaskFormValues {
  if (!task) {
    return {
      ...emptyTaskForm,
      primaryTask
    };
  }

  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    primaryTask: task.primaryTask
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

function formatActivityTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));

  if (diffMinutes < 1) {
    return "agora";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}min atras`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h atras`;
  }

  const diffDays = Math.round(diffHours / 24);
  return diffDays === 1 ? "1 dia atras" : `${diffDays} dias atras`;
}

function formatTimer(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatStudyDuration(seconds: number) {
  return formatTimer(seconds);
}

function formatPauseTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return [minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function buildOverviewCards(metrics: DashboardMetrics) {
  return [
    { label: "Assuntos", value: String(metrics.subjects), detail: "assuntos criados", icon: "book" },
    { label: "Anotacoes", value: String(metrics.notes), detail: "anotacoes no total", icon: "note" },
    { label: "Flashcards", value: String(metrics.flashcards), detail: "cartoes criados", icon: "cards" },
    { label: "Revisoes", value: String(metrics.reviewsToday), detail: "revisados hoje", icon: "calendar" },
    { label: "Horas", value: formatStudyDuration(metrics.totalStudySeconds), detail: "tempo total estudado", icon: "clock" }
  ];
}

function buildWeeklyChart(weeklyReviews: WeeklyReview[]) {
  const values = weeklyReviews.length > 0 ? weeklyReviews : buildEmptyWeek();
  const maxReviews = Math.max(1, ...values.map((item) => item.reviews));
  const xPositions = [42, 138, 236, 342, 458, 552, 610];
  const points = values.map((item, index) => ({
    ...item,
    x: xPositions[index] ?? 42 + index * 92,
    y: 226 - Math.round((item.reviews / maxReviews) * 188)
  }));
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x} 226 L${points[0].x} 226Z`;

  return { points, linePath, areaPath };
}

function buildEmptyWeek(): WeeklyReview[] {
  return ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map((label, index) => ({
    date: String(index),
    label,
    reviews: 0
  }));
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

function getTaskStatusLabel(status: TaskStatus | string | null | undefined) {
  if (status === "TODO") {
    return "TODO";
  }

  if (status === "DOING") {
    return "DOING";
  }

  if (status === "DONE") {
    return "DONE";
  }

  return "TODO";
}

function getTaskStatusTone(status: TaskStatus | string | null | undefined) {
  if (status === "TODO" || status === "DOING" || status === "DONE") {
    return status.toLowerCase();
  }

  return "todo";
}

function getTaskProgress(tasks: StudyTask[]) {
  if (tasks.length === 0) {
    return 0;
  }

  return Math.round((tasks.filter((task) => task.status === "DONE").length / tasks.length) * 100);
}

function getSubjectName(subjects: Subject[], subjectId: string) {
  return subjects.find((subject) => subject.id === subjectId)?.name ?? "Assunto removido";
}

function confirmDelete(itemLabel: string) {
  return window.confirm(`Tem certeza que deseja excluir ${itemLabel}? Esta acao nao pode ser desfeita.`);
}

function parseCreateSubjectCommand(command: string) {
  const normalized = command.trim();
  const match = normalized.match(/^(crie|criar|cria|adicione|adicionar)\s+(um\s+|uma\s+)?(assuntos?|materias?)\s+(referentes?\s+a\s+|de\s+)?(.+)$/i);

  if (!match) {
    return null;
  }

  return match[5].replace(/[.!?]+$/g, "").trim();
}

function getProfessorPromptText(prompt: string, content: string) {
  const compactPrompt = prompt.trim();
  const compactContent = content.trim();

  if (compactPrompt && compactContent) {
    return `${compactPrompt}\n\n${compactContent}`;
  }

  return compactContent || compactPrompt;
}

function clampMaxCards(value: number) {
  if (!Number.isFinite(value)) {
    return 8;
  }

  return Math.min(20, Math.max(1, Math.round(value)));
}

function renderInlineFormattedText(text: string) {
  const segments = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);

  return segments.map((segment, index) => {
    if (segment.startsWith("`") && segment.endsWith("`")) {
      return <code key={`${segment}-${index}`}>{segment.slice(1, -1)}</code>;
    }

    if (segment.startsWith("**") && segment.endsWith("**")) {
      return <strong key={`${segment}-${index}`}>{segment.slice(2, -2)}</strong>;
    }

    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
}

function renderMestreMessage(text: string) {
  const blocks = text
    .trim()
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, blockIndex) => {
    if (block.startsWith("```") && block.endsWith("```")) {
      const lines = block.split("\n");
      const code = lines.slice(1, -1).join("\n");

      return (
        <pre className="mestre-code-block" key={`code-${blockIndex}`}>
          <code>{code}</code>
        </pre>
      );
    }

    const lines = block.split("\n").map((line) => line.trimEnd());
    const headingMatch = block.match(/^(#{1,3})\s+(.+)$/);

    if (headingMatch) {
      return (
        <h4 className="mestre-heading" key={`heading-${blockIndex}`}>
          {renderInlineFormattedText(headingMatch[2])}
        </h4>
      );
    }

    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      return (
        <ul className="mestre-list" key={`list-${blockIndex}`}>
          {lines.map((line, lineIndex) => (
            <li key={`item-${blockIndex}-${lineIndex}`}>
              {renderInlineFormattedText(line.replace(/^[-*]\s+/, ""))}
            </li>
          ))}
        </ul>
      );
    }

    if (lines.every((line) => /^\d+\.\s+/.test(line))) {
      return (
        <ol className="mestre-list mestre-list-numbered" key={`olist-${blockIndex}`}>
          {lines.map((line, lineIndex) => (
            <li key={`item-${blockIndex}-${lineIndex}`}>
              {renderInlineFormattedText(line.replace(/^\d+\.\s+/, ""))}
            </li>
          ))}
        </ol>
      );
    }

    return (
      <p key={`paragraph-${blockIndex}`}>
        {lines.map((line, lineIndex) => (
          <span className="mestre-line" key={`line-${blockIndex}-${lineIndex}`}>
            {renderInlineFormattedText(line)}
          </span>
        ))}
      </p>
    );
  });
}

function getMestreRevealStep(remainingLength: number) {
  if (remainingLength > 420) {
    return 12;
  }

  if (remainingLength > 180) {
    return 8;
  }

  if (remainingLength > 80) {
    return 5;
  }

  return 3;
}

function MestreMessageText({
  messageId,
  role,
  text,
  shouldAnimate,
  onAnimated,
  onProgress
}: {
  messageId: number;
  role: "user" | "mestre";
  text: string;
  shouldAnimate: boolean;
  onAnimated: (messageId: number) => void;
  onProgress: () => void;
}) {
  const [visibleText, setVisibleText] = useState(() => (role === "mestre" && shouldAnimate ? "" : text));

  useEffect(() => {
    if (role !== "mestre" || !shouldAnimate) {
      setVisibleText(text);
      return;
    }

    setVisibleText("");
    let currentLength = 0;

    const interval = window.setInterval(() => {
      const remainingLength = text.length - currentLength;
      const nextLength = Math.min(text.length, currentLength + getMestreRevealStep(remainingLength));

      currentLength = nextLength;
      setVisibleText(text.slice(0, nextLength));
      onProgress();

      if (nextLength >= text.length) {
        window.clearInterval(interval);
        onAnimated(messageId);
      }
    }, 28);

    return () => window.clearInterval(interval);
  }, [messageId, onAnimated, onProgress, role, shouldAnimate, text]);

  return (
    <div className={`mestre-rendered-text ${role === "mestre" && shouldAnimate ? "is-streaming" : ""}`}>
      {renderMestreMessage(visibleText)}
      {role === "mestre" && shouldAnimate ? <span className="mestre-caret" aria-hidden="true" /> : null}
    </div>
  );
}

function ToastFeedback({
  feedback,
  onClose,
  children
}: {
  feedback: Feedback | null;
  onClose?: () => void;
  children?: ReactNode;
}) {
  useEffect(() => {
    if (!feedback || !onClose) {
      return;
    }

    const timeout = window.setTimeout(onClose, feedback.type === "success" ? 4200 : 6200);
    return () => window.clearTimeout(timeout);
  }, [feedback, onClose]);

  if (!feedback) {
    return null;
  }

  return (
    <div className={`feedback toast-feedback ${feedback.type}`} role="status">
      <span className="toast-icon">
        <DashboardIcon name={feedback.type === "success" ? "check" : "alert"} />
      </span>
      <p>{feedback.message}</p>
      {children}
      {onClose ? (
        <button className="toast-close" type="button" onClick={onClose} aria-label="Fechar mensagem">
          <DashboardIcon name="close" />
        </button>
      ) : null}
    </div>
  );
}

function LoadingSkeleton({ variant = "cards", count = 3 }: { variant?: "cards" | "list" | "detail"; count?: number }) {
  return (
    <div className={`skeleton-group skeleton-${variant}`} aria-label="Carregando">
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card" key={index}>
          <span className="skeleton-icon" />
          <span className="skeleton-line strong" />
          <span className="skeleton-line" />
          <span className="skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

function App() {
  const [mode, setMode] = useState<AuthMode>(() => (initialResetToken ? "reset" : "login"));
  const [currentView, setCurrentView] = useState<AppView>(() =>
    localStorage.getItem("studyplatform_token") ? "home" : "auth"
  );
  const [values, setValues] = useState(initialValues);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userName, setUserName] = useState<string | null>(() => getStoredUserName());
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [currentSection, setCurrentSection] = useState<HomeSection>("dashboard");

  const isRegister = mode === "register";
  const isForgotPassword = mode === "forgot";
  const isResetPassword = mode === "reset";
  const showPassword = !isForgotPassword;
  const showEmail = isRegister || isForgotPassword;
  const showUsername = mode === "login" || isRegister;
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
        throw new Error(getErrorMessage(response.status, data, mode === "login" ? "login" : "auth"));
      }

      if (isRegister) {
        setMode("login");
        setValues({ ...initialValues, username: values.username.trim().toLowerCase() });
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
    clearAuthStorage();
    setCurrentView("auth");
    setUserName(null);
    setFeedback(null);
    setMode("login");
    setCurrentSection("dashboard");
  }

  function completeLogin(loginData: LoginResponse) {
    persistAuthSession(loginData.accessToken, loginData);
    setUserName(loginData.name);
    setCurrentView("home");
    setValues(initialValues);
  }

  useEffect(() => {
    function handleUnauthorized() {
      clearAuthStorage();
      setCurrentView("auth");
      setUserName(null);
      setMode("login");
      setCurrentSection("dashboard");
      setFeedback({
        type: "error",
        message: "Sua sessao expirou. Entre novamente para salvar suas alteracoes."
      });
    }

    window.addEventListener(unauthorizedEventName, handleUnauthorized);

    return () => window.removeEventListener(unauthorizedEventName, handleUnauthorized);
  }, []);

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

              {showUsername ? (
                <label>
                  Usuario
                  <span className="input-wrap">
                    <UserIcon />
                    <input
                      type="text"
                      autoComplete="username"
                      value={values.username}
                      onChange={(event) => updateField("username", event.target.value)}
                      placeholder="seu.usuario"
                      minLength={3}
                      maxLength={60}
                      pattern="[a-zA-Z0-9._-]+"
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

              <ToastFeedback feedback={feedback} onClose={() => setFeedback(null)} />

              <button className="submit-button" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Enviando..."
                  : getSubmitLabel(mode)}
              </button>
            </form>

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
  const [isMestreOpen, setIsMestreOpen] = useState(false);

  return (
    <main className={`home-page ${isMestreOpen ? "mestre-open" : ""}`}>
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
            <button
              className={`mestre-toggle-button ${isMestreOpen ? "active" : ""}`}
              type="button"
              onClick={() => setIsMestreOpen(!isMestreOpen)}
              title="Conversar com o Mestre"
              aria-label="Abrir assistente Mestre"
            >
              <DashboardIcon name="spark" />
              <span>Mestre</span>
            </button>
            <button className="profile-button" type="button" aria-label="Perfil">
              {initials}
            </button>
            <button className="logout-button" type="button" onClick={onLogout}>
              Sair
            </button>
          </div>
        </header>

        {currentSection === "tasks" ? (
          <TasksPage />
        ) : currentSection === "subjects" ? (
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

      <MestreSidebar
        isOpen={isMestreOpen}
        onClose={() => setIsMestreOpen(false)}
        userName={userName}
      />
    </main>
  );
}

function DashboardHome() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStudying, setIsStudying] = useState(false);
  const [isStudyPaused, setIsStudyPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSavingStudyTime, setIsSavingStudyTime] = useState(false);
  const [pauseSecondsRemaining, setPauseSecondsRemaining] = useState(pauseLimitSeconds);
  const lastActivityAtRef = useRef(Date.now());

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const dashboardMetrics = await apiRequest<DashboardMetrics>("/metrics/dashboard");
      setMetrics(dashboardMetrics);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel carregar o dashboard."
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const activityEvents: Array<keyof WindowEventMap> = ["click", "keydown", "mousemove", "scroll", "touchstart"];

    function markActivity() {
      lastActivityAtRef.current = Date.now();
    }

    activityEvents.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActivity));
    };
  }, []);

  useEffect(() => {
    if (!isStudying) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const inactiveFor = Date.now() - lastActivityAtRef.current;

      if (inactiveFor > inactivityLimitMs) {
        setIsStudying(false);
        setElapsedSeconds(0);
        setFeedback({
          type: "error",
          message: "Sessao resetada por inatividade. Clique em Comecar a estudar para iniciar de novo."
        });
        return;
      }

      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isStudying]);

  useEffect(() => {
    if (!isStudyPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setPauseSecondsRemaining((current) => {
        if (current <= 1) {
          setIsStudyPaused(false);
          setElapsedSeconds(0);
          setFeedback({
            type: "error",
            message: "Pausa encerrada apos 15 minutos. O tempo da sessao foi resetado."
          });
          return pauseLimitSeconds;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isStudyPaused]);

  const overviewCards = metrics ? buildOverviewCards(metrics) : [];
  const weeklyChart = buildWeeklyChart(metrics?.weeklyReviews ?? []);
  const dailyProgress = metrics?.dailyProgress ?? 0;
  const totalStudySeconds = metrics?.totalStudySeconds ?? 0;
  const hasOpenStudySession = isStudying || isStudyPaused || isSavingStudyTime;
  const displayTotalStudySeconds = totalStudySeconds + (hasOpenStudySession ? elapsedSeconds : 0);

  function handleStartStudying() {
    lastActivityAtRef.current = Date.now();
    setElapsedSeconds((current) => (isStudyPaused ? current : 0));
    setPauseSecondsRemaining(pauseLimitSeconds);
    setIsStudyPaused(false);
    setIsStudying(true);
    setFeedback(null);
  }

  function handlePauseStudying() {
    setIsStudying(false);
    setIsStudyPaused(true);
    setPauseSecondsRemaining(pauseLimitSeconds);
    setFeedback(null);
  }

  async function handleFinishStudying() {
    if (elapsedSeconds < 1) {
      setIsStudying(false);
      setIsStudyPaused(false);
      setElapsedSeconds(0);
      setPauseSecondsRemaining(pauseLimitSeconds);
      return;
    }

    const wasStudying = isStudying;
    const wasPaused = isStudyPaused;

    setIsSavingStudyTime(true);
    setIsStudying(false);
    setIsStudyPaused(false);
    setFeedback(null);

    try {
      const response = await apiRequest<StudyTimeResponse>("/study-time", {
        method: "POST",
        body: JSON.stringify({ durationSeconds: elapsedSeconds })
      });

      setMetrics((current) => current ? { ...current, totalStudySeconds: response.totalStudySeconds } : current);
      setElapsedSeconds(0);
      setPauseSecondsRemaining(pauseLimitSeconds);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel registrar o tempo de estudo."
      });
      setIsStudying(wasStudying);
      setIsStudyPaused(wasPaused);
    } finally {
      setIsSavingStudyTime(false);
    }
  }

  const studyButtonLabel = isStudying ? "Pausa" : isStudyPaused ? "Continuar" : "Comecar a estudar";
  const studyButtonIcon = isStudying ? "pause" : isStudyPaused ? "play" : "spark";
  const timerStatus = isStudying ? "Sessao ativa" : isStudyPaused ? "Sessao pausada" : "Tempo de estudo";
  const timerDescription = isStudying
    ? "Contando enquanto voce interage com o site."
    : isStudyPaused
      ? "A sessao fica guardada enquanto voce retorna dentro do limite."
      : "Clique em Comecar a estudar para abrir uma nova sessao.";

  return (
    <>
      <section className="hero-dashboard">
        <img src={spaceImage} alt="" />
        <div className="hero-shade" />
        <div className="hero-layout">
          <div className="hero-content">
            <p>Foco do dia</p>
            <h2>
              Pequenos passos,
              <span> grandes conquistas.</span>
            </h2>
            <p>
              {metrics
                ? `${metrics.streak} dia(s) de sequencia e ${metrics.reviewsToday} revisao(oes) hoje.`
                : "Mantenha o foco e veja os resultados acontecerem."}
            </p>
            <div className="study-actions">
              <button type="button" onClick={isStudying ? handlePauseStudying : handleStartStudying} disabled={isSavingStudyTime}>
                <DashboardIcon name={studyButtonIcon} />
                {studyButtonLabel}
              </button>
              {hasOpenStudySession ? (
                <button className="study-finish-button" type="button" onClick={handleFinishStudying} disabled={isSavingStudyTime}>
                  <DashboardIcon name="check" />
                  {isSavingStudyTime ? "Salvando..." : "Finalizar"}
                </button>
              ) : null}
            </div>
          </div>

          <aside className={`study-timer-panel ${isStudying ? "active" : ""} ${isStudyPaused ? "paused" : ""}`} aria-label="Contador de horas de estudo">
            <div className="timer-heading">
              <span>{timerStatus}</span>
              <DashboardIcon name="clock" />
            </div>
            <strong>{formatTimer(elapsedSeconds)}</strong>
            <p>{timerDescription}</p>
            {isStudyPaused ? (
              <div className="study-pause-alert" role="alert">
                <span>Tempo para continuar</span>
                <b>{formatPauseTimer(pauseSecondsRemaining)}</b>
              </div>
            ) : null}
            <div className="timer-total">
              <span>Horas totais</span>
              <b>{formatStudyDuration(displayTotalStudySeconds)}</b>
            </div>
          </aside>
        </div>
      </section>

      <ToastFeedback feedback={feedback} onClose={() => setFeedback(null)}>
        <button type="button" onClick={loadDashboard}>
          Tentar novamente
        </button>
      </ToastFeedback>

      <section className="overview-grid" aria-label="Resumo dos estudos">
        {isLoading ? <LoadingSkeleton variant="cards" count={4} /> : null}

        {!isLoading && overviewCards.map((card) => (
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

      {metrics ? (
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
              {metrics.recentActivities.length === 0 ? (
                <div className="activity-empty">Suas revisoes vao aparecer aqui depois da primeira sessao.</div>
              ) : null}

              {metrics.recentActivities.map((activity, index) => (
                <div className="activity-item" key={`${activity.createdAt}-${index}`}>
                  <div className={`activity-icon tone-${index % 3}`}>
                    <DashboardIcon name={activity.type === "study" ? "clock" : activity.type === "review" ? "calendar" : "cards"} />
                  </div>
                  <div>
                    <strong>{activity.title}</strong>
                    <span>{activity.subject}</span>
                  </div>
                  <time>{formatActivityTime(activity.createdAt)}</time>
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
                <path className="area-path" d={weeklyChart.areaPath} />
                <path className="line-path" d={weeklyChart.linePath} />
                {weeklyChart.points.map((point) => (
                  <circle
                    className="chart-dot"
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    key={point.date}
                  />
                ))}
              </svg>
              <div className="chart-labels">
                {weeklyChart.points.map((day) => (
                  <span key={day.date}>{day.label}</span>
                ))}
              </div>
            </div>

            <div className="progress-summary">
              <DashboardIcon name="spark" />
              <div>
                <strong>{metrics.reviewsToday} de {metrics.dailyGoal} revisoes hoje</strong>
                <p>{metrics.accuracyRate}% de acerto e {metrics.streak} dia(s) de streak.</p>
              </div>
              <span
                className="progress-ring"
                style={{ "--progress": `${dailyProgress}%` } as CSSProperties}
              >
                {dailyProgress}%
              </span>
            </div>
          </article>
        </section>
      ) : null}
    </>
  );
}

function TasksPage() {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [formValues, setFormValues] = useState<TaskFormValues>(emptyTaskForm);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [markingDoneTaskId, setMarkingDoneTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const primaryTask = tasks.find((task) => task.primaryTask) ?? null;
  const secondaryTasks = tasks.filter((task) => !task.primaryTask);
  const progress = getTaskProgress(tasks);
  const todoCount = tasks.filter((task) => task.status === "TODO").length;
  const doingCount = tasks.filter((task) => task.status === "DOING").length;
  const doneCount = tasks.filter((task) => task.status === "DONE").length;

  const loadTasks = useCallback(async () => {
    setIsLoading(true);

    try {
      const tasksData = await apiRequest<StudyTask[]>("/tasks");
      if (!Array.isArray(tasksData)) {
        throw new Error("Resposta invalida ao carregar suas missoes.");
      }

      setTasks(tasksData);
      setFeedback(null);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel carregar suas missoes."
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  function openCreateModal(primaryTask = false) {
    setEditingTask(null);
    setFormValues(buildTaskForm(null, primaryTask));
    setFeedback(null);
    setIsModalOpen(true);
  }

  function openEditModal(task: StudyTask) {
    setEditingTask(task);
    setFormValues(buildTaskForm(task));
    setFeedback(null);
    setIsModalOpen(true);
  }

  function closeTaskModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingTask(null);
    setFormValues(emptyTaskForm);
  }

  function updateTaskField<K extends keyof TaskFormValues>(field: K, value: TaskFormValues[K]) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFeedback(null);
  }

  async function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const payload = {
      title: formValues.title.trim(),
      description: formValues.description.trim(),
      status: formValues.status,
      primaryTask: formValues.primaryTask
    };

    try {
      const savedTask = await apiRequest<StudyTask>(editingTask ? `/tasks/${editingTask.id}` : "/tasks", {
        method: editingTask ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });

      setTasks((current) => {
        const withoutReplacedPrimary =
          savedTask.primaryTask && !editingTask?.primaryTask
            ? current.map((task) => ({ ...task, primaryTask: false }))
            : current;

        if (editingTask) {
          return withoutReplacedPrimary.map((task) => (task.id === savedTask.id ? savedTask : task));
        }

        return [savedTask, ...withoutReplacedPrimary];
      });
      setFeedback({ type: "success", message: editingTask ? "Missao atualizada." : "Missao criada." });
      setIsModalOpen(false);
      setEditingTask(null);
      setFormValues(emptyTaskForm);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel salvar a missao."
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMarkDone(task: StudyTask) {
    setMarkingDoneTaskId(task.id);
    setFeedback(null);

    try {
      const savedTask = await apiRequest<StudyTask>(`/tasks/${task.id}/done`, { method: "PATCH" });
      setTasks((current) => current.map((item) => (item.id === savedTask.id ? savedTask : item)));
      setFeedback({ type: "success", message: "Missao concluida." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel concluir a missao."
      });
    } finally {
      setMarkingDoneTaskId(null);
    }
  }

  async function handleDeleteTask(task: StudyTask) {
    if (!confirmDelete(`a missao "${task.title}"`)) {
      return;
    }

    setDeletingTaskId(task.id);
    setFeedback(null);

    try {
      await apiRequest<null>(`/tasks/${task.id}`, { method: "DELETE" });
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setFeedback({ type: "success", message: "Missao excluida." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel excluir a missao."
      });
    } finally {
      setDeletingTaskId(null);
    }
  }

  function renderTaskCard(task: StudyTask, variant: "primary" | "secondary") {
    return (
      <article className={`task-card ${variant}`} key={task.id}>
        <div className="task-card-heading">
          <span className={`task-status tone-${getTaskStatusTone(task.status)}`}>{getTaskStatusLabel(task.status)}</span>
          <time>{formatDate(task.updatedAt)}</time>
        </div>

        <h3>{task.title}</h3>
        {task.description ? <p>{task.description}</p> : <p>Sem descricao adicionada.</p>}

        <div className="task-card-actions">
          {task.status !== "DONE" ? (
            <button type="button" onClick={() => handleMarkDone(task)} disabled={markingDoneTaskId === task.id}>
              <DashboardIcon name="check" />
              Concluir
            </button>
          ) : null}
          <button type="button" onClick={() => openEditModal(task)} aria-label="Editar missao">
            <DashboardIcon name="edit" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteTask(task)}
            disabled={deletingTaskId === task.id}
            aria-label="Excluir missao"
          >
            <DashboardIcon name="trash" />
          </button>
        </div>
      </article>
    );
  }

  return (
    <div className="tasks-page">
      <section className="tasks-toolbar" aria-label="Resumo das missoes">
        <div>
          <span>{isLoading ? "Carregando" : `${tasks.length} missoes`}</span>
          <strong>{progress}% concluido</strong>
        </div>

        <div className="tasks-progress" aria-label="Progresso visual de missoes">
          <span style={{ width: `${progress}%` }} />
        </div>

        <button type="button" onClick={() => openCreateModal(false)}>
          <DashboardIcon name="plus" />
          Nova missao
        </button>
      </section>

      <section className="task-status-grid" aria-label="Status das missoes">
        <div>
          <span>TODO</span>
          <strong>{todoCount}</strong>
        </div>
        <div>
          <span>DOING</span>
          <strong>{doingCount}</strong>
        </div>
        <div>
          <span>DONE</span>
          <strong>{doneCount}</strong>
        </div>
      </section>

      <ToastFeedback feedback={feedback} onClose={() => setFeedback(null)} />

      <section className="primary-mission" aria-label="Missao principal">
        <div className="mission-section-heading">
          <div>
            <span>Missao principal</span>
            <h2>Foco agora</h2>
          </div>
          <button type="button" onClick={() => openCreateModal(true)}>
            <DashboardIcon name="mission" />
            Definir principal
          </button>
        </div>

        {isLoading ? (
          <LoadingSkeleton variant="detail" count={1} />
        ) : primaryTask ? (
          renderTaskCard(primaryTask, "primary")
        ) : (
          <div className="empty-state mission-empty">
            <DashboardIcon name="mission" />
            <strong>Nenhuma missao principal</strong>
            <p>Escolha uma tarefa central para guiar sua proxima sessao.</p>
          </div>
        )}
      </section>

      <section className="secondary-missions" aria-label="Missoes secundarias">
        <div className="mission-section-heading">
          <div>
            <span>Missoes secundarias</span>
            <h2>Proximos passos</h2>
          </div>
        </div>

        <div className="secondary-missions-grid">
          {isLoading ? (
            <LoadingSkeleton variant="cards" count={3} />
          ) : secondaryTasks.length === 0 ? (
            <div className="empty-state mission-empty">
              <DashboardIcon name="check" />
              <strong>Nenhuma missao secundaria</strong>
              <p>Adicione passos menores para destravar a missao principal.</p>
            </div>
          ) : (
            secondaryTasks.map((task) => renderTaskCard(task, "secondary"))
          )}
        </div>
      </section>

      {isModalOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeTaskModal}>
          <form
            className="subject-modal task-modal"
            onSubmit={handleTaskSubmit}
            onMouseDown={(event) => event.stopPropagation()}
            aria-label={editingTask ? "Editar missao" : "Nova missao"}
          >
            <div className="modal-heading">
              <div>
                <span>{editingTask ? "Editar" : "Nova"}</span>
                <h2>{editingTask ? "Editar missao" : "Nova missao"}</h2>
              </div>
              <button type="button" onClick={closeTaskModal} aria-label="Fechar modal">
                <DashboardIcon name="close" />
              </button>
            </div>

            <label>
              Titulo
              <input
                type="text"
                value={formValues.title}
                onChange={(event) => updateTaskField("title", event.target.value)}
                placeholder="Ex: Revisar funcoes quadraticas"
                maxLength={160}
                required
                autoFocus
              />
            </label>

            <label>
              Descricao
              <textarea
                value={formValues.description}
                onChange={(event) => updateTaskField("description", event.target.value)}
                placeholder="Detalhe o objetivo da missao..."
                maxLength={1000}
              />
            </label>

            <label>
              Status
              <select
                value={formValues.status}
                onChange={(event) => updateTaskField("status", event.target.value as TaskStatus)}
                required
              >
                <option value="TODO">TODO</option>
                <option value="DOING">DOING</option>
                <option value="DONE">DONE</option>
              </select>
            </label>

            <label className="task-primary-toggle">
              <input
                type="checkbox"
                checked={formValues.primaryTask}
                onChange={(event) => updateTaskField("primaryTask", event.target.checked)}
              />
              Missao principal
            </label>

            <div className="editor-actions">
              <button type="button" className="ghost-button" onClick={closeTaskModal}>
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
      if (!Array.isArray(subjectsData)) {
        throw new Error("Resposta invalida ao carregar seus assuntos.");
      }

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
    setFormValues({ name: subject.name, difficulty: subject.difficulty ?? "MEDIUM" });
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
      name: formValues.name.trim(),
      difficulty: formValues.difficulty
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
    if (!confirmDelete(`o assunto "${subject.name}"`)) {
      return;
    }

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

      <ToastFeedback feedback={feedback} onClose={() => setFeedback(null)} />

      <section className="subjects-grid" aria-label="Lista de assuntos">
        {isLoading ? (
          <LoadingSkeleton variant="cards" count={3} />
        ) : subjects.length === 0 ? (
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
                <b className={`subject-difficulty tone-${(subject.difficulty ?? "MEDIUM").toLowerCase()}`}>
                  Dificuldade {getDifficultyLabel(subject.difficulty ?? "MEDIUM")}
                </b>
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
                onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex: Seguranca da informacao"
                maxLength={120}
                required
                autoFocus
              />
            </label>

            <label>
              Dificuldade
              <select
                value={formValues.difficulty}
                onChange={(event) => setFormValues((current) => ({ ...current, difficulty: event.target.value as Difficulty }))}
                required
              >
                <option value="EASY">Facil</option>
                <option value="MEDIUM">Medio</option>
                <option value="HARD">Dificil</option>
              </select>
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
    if (!confirmDelete("este flashcard")) {
      return;
    }

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

      <ToastFeedback feedback={feedback} onClose={() => setFeedback(null)} />

      <section className="flashcards-grid" aria-label="Lista de flashcards">
        {isLoading ? (
          <LoadingSkeleton variant="cards" count={3} />
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

type MestreMessage = {
  id: number;
  role: "user" | "mestre";
  text: string;
  suggestions?: AiFlashcardSuggestion[];
  saved?: boolean;
};

function MestreSidebar({
  isOpen,
  onClose,
  userName
}: {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  
  // Context attachment settings
  const [maxCards, setMaxCards] = useState(8);
  const [content, setContent] = useState("");
  const [showContextPanel, setShowContextPanel] = useState(false);

  // Chat states
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<MestreMessage[]>([
    {
      id: 1,
      role: "mestre",
      text: `Ola, ${userName}! Sou o Mestre, seu assistente pessoal de estudos. Posso tirar suas duvidas, criar assuntos ou gerar flashcards para voce revisar. Como posso te ajudar hoje?`
    }
  ]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [isSavingCards, setIsSavingCards] = useState<Record<number, boolean>>({});
  const [selectedIndexesByMsg, setSelectedIndexesByMsg] = useState<Record<number, number[]>>({});
  const [animatedMessageIds, setAnimatedMessageIds] = useState<Record<number, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollMessagesToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load subjects for the context attachment selection
  const loadSubjects = useCallback(async () => {
    setIsLoadingSubjects(true);
    try {
      const data = await apiRequest<Subject[]>("/subjects");
      setSubjects(data);
      if (data.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(data[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar assuntos:", error);
    } finally {
      setIsLoadingSubjects(false);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    if (isOpen) {
      loadSubjects();
    }
  }, [isOpen, loadSubjects]);

  // Scroll to bottom of chat
  useEffect(() => {
    scrollMessagesToBottom();
  }, [messages, scrollMessagesToBottom]);

  useEffect(() => {
    setAnimatedMessageIds((current) => {
      const nextState = { ...current };

      messages.forEach((message) => {
        if (message.role === "user" && !nextState[message.id]) {
          nextState[message.id] = true;
        }
      });

      return nextState;
    });
  }, [messages]);

  const markMessageAsAnimated = useCallback((messageId: number) => {
    setAnimatedMessageIds((current) => {
      if (current[messageId]) {
        return current;
      }

      return {
        ...current,
        [messageId]: true
      };
    });
  }, []);

  const addMessage = (role: "user" | "mestre", text: string, suggestions?: AiFlashcardSuggestion[]) => {
    setMessages((current) => [
      ...current,
      {
        id: Date.now() + current.length,
        role,
        text,
        suggestions
      }
    ]);
  };

  const handleSuggestionClick = (text: string) => {
    setPrompt(text);
  };

  const createSubject = async (name: string) => {
    const savedSubject = await apiRequest<Subject>("/subjects", {
      method: "POST",
      body: JSON.stringify({
        name,
        difficulty: "MEDIUM"
      })
    });
    setSubjects((current) => [savedSubject, ...current]);
    setSelectedSubjectId(savedSubject.id);
    return savedSubject;
  };

  const handleCreateSubject = async () => {
    const name = newSubjectName.trim();
    if (!name) return;
    setIsWorking(true);
    try {
      const savedSubject = await createSubject(name);
      setNewSubjectName("");
      addMessage("mestre", `Assunto "${savedSubject.name}" criado com sucesso! Agora voce ja pode gerar flashcards ou associar anotacoes a ele.`);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel criar o assunto."
      });
    } finally {
      setIsWorking(false);
    }
  };

  const handleSendMessage = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();

    const trimmedPrompt = prompt.trim();
    const hasContent = content.trim().length > 0;

    if (!trimmedPrompt && !hasContent) {
      return;
    }

    // Determine if it's a create subject command
    const subjectNameFromCommand = parseCreateSubjectCommand(trimmedPrompt);

    setIsWorking(true);
    setFeedback(null);
    setPrompt("");

    const displayUserPrompt = trimmedPrompt || "Gere flashcards a partir do conteudo anexado.";
    addMessage("user", displayUserPrompt);

    try {
      if (subjectNameFromCommand) {
        const savedSubject = await createSubject(subjectNameFromCommand);
        addMessage("mestre", `Assunto "${savedSubject.name}" criado com sucesso! Agora voce pode comecar a estudar.`);
        return;
      }

      // If they click generate cards or there is content, trigger flashcard generation
      if (hasContent || trimmedPrompt.toLowerCase().includes("flashcard") || trimmedPrompt.toLowerCase().includes("card")) {
        const activeSubject = selectedSubjectId
          ? subjects.find((s) => s.id === selectedSubjectId)
          : subjects[0] || null;

        if (!activeSubject) {
          addMessage("mestre", "Por favor, crie um assunto primeiro para que eu possa organizar seus flashcards.");
          return;
        }

        const sourceContent = getProfessorPromptText(trimmedPrompt, content);

        const response = await apiRequest<{ flashcards: AiFlashcardSuggestion[] }>("/ai/flashcards/generate", {
          method: "POST",
          body: JSON.stringify({
            subjectId: activeSubject.id,
            content: sourceContent,
            maxCards
          })
        });

        const generated = response.flashcards ?? [];
        if (generated.length > 0) {
          const msgId = Date.now();
          setMessages((current) => [
            ...current,
            {
              id: msgId,
              role: "mestre",
              text: `Gerei ${generated.length} sugestoes de flashcards para o assunto "${activeSubject.name}". Revise-as abaixo:`,
              suggestions: generated
            }
          ]);
          setSelectedIndexesByMsg((prev) => ({
            ...prev,
            [msgId]: generated.map((_, i) => i)
          }));
          // Clear context after successful generation
          setContent("");
          setShowContextPanel(false);
        } else {
          addMessage("mestre", "Nao consegui extrair conteudo suficiente para gerar bons flashcards. Pode fornecer mais texto?");
        }
        return;
      }

      // Generic Chat Endpoint call
      const chatResponse = await apiRequest<{ response: string }>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: trimmedPrompt
        })
      });

      addMessage("mestre", chatResponse.response);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Nao foi possivel conectar ao Mestre.";
      addMessage("mestre", `Erro: ${errorMsg}`);
    } finally {
      setIsWorking(false);
    }
  };

  const toggleSuggestionCheck = (msgId: number, index: number) => {
    setSelectedIndexesByMsg((prev) => {
      const current = prev[msgId] ?? [];
      const updated = current.includes(index)
        ? current.filter((i) => i !== index)
        : [...current, index];
      return { ...prev, [msgId]: updated };
    });
  };

  const handleSaveFlashcards = async (msgId: number, suggestions: AiFlashcardSuggestion[]) => {
    const selectedIndexes = selectedIndexesByMsg[msgId] ?? [];
    const selectedSuggestions = selectedIndexes
      .sort((a, b) => a - b)
      .map((idx) => suggestions[idx])
      .filter(Boolean);

    if (selectedSuggestions.length === 0) {
      setFeedback({ type: "error", message: "Selecione ao menos um flashcard para salvar." });
      return;
    }

    const activeSubjectId = selectedSubjectId || (subjects[0]?.id ?? "");
    if (!activeSubjectId) {
      setFeedback({ type: "error", message: "Selecione um assunto para salvar os flashcards." });
      return;
    }

    setIsSavingCards((prev) => ({ ...prev, [msgId]: true }));
    setFeedback(null);

    try {
      await Promise.all(
        selectedSuggestions.map((suggestion) =>
          apiRequest<Flashcard>("/flashcards", {
            method: "POST",
            body: JSON.stringify({
              subjectId: activeSubjectId,
              question: suggestion.question,
              answer: suggestion.answer,
              difficulty: suggestion.difficulty
            })
          })
        )
      );

      // Update message status to saved
      setMessages((current) =>
        current.map((msg) => (msg.id === msgId ? { ...msg, saved: true } : msg))
      );
      setFeedback({ type: "success", message: `${selectedSuggestions.length} flashcard(s) salvo(s)!` });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Erro ao salvar flashcards."
      });
    } finally {
      setIsSavingCards((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="mestre-sidebar" aria-label="Mestre AI Chat Sidebar">
      <ToastFeedback feedback={feedback} onClose={() => setFeedback(null)} />
      <header className="mestre-header">
        <div className="mestre-title-block">
          <div className="mestre-avatar">
            <DashboardIcon name="spark" />
          </div>
          <div>
            <h3>Mestre</h3>
            <span className="mestre-subtitle">Assistente de Estudos</span>
          </div>
        </div>
        <button className="mestre-close-button" type="button" onClick={onClose} aria-label="Fechar chat">
          <DashboardIcon name="close" />
        </button>
      </header>

      {/* Attachment Context Panel */}
      {showContextPanel && (
        <div className="mestre-context-panel">
          <div className="context-panel-header">
            <h4>Anexar Conteudo para Estudar</h4>
            <button className="context-close" onClick={() => setShowContextPanel(false)}>
              <DashboardIcon name="close" />
            </button>
          </div>
          <div className="context-panel-body">
            <div className="context-row">
              <label>
                Assunto
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  disabled={isLoadingSubjects || subjects.length === 0}
                >
                  <option value="">Escolha um assunto</option>
                  {subjects.map((subject) => (
                    <option value={subject.id} key={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cards-count-label">
                Cards
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxCards}
                  onChange={(e) => setMaxCards(clampMaxCards(Number(e.target.value)))}
                />
              </label>
            </div>
            
            <div className="quick-subject-row">
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Criar novo assunto..."
              />
              <button onClick={handleCreateSubject} disabled={isWorking || !newSubjectName.trim()}>
                Criar
              </button>
            </div>

            <label className="content-textarea-label">
              Conteudo para extracao
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Cole um resumo, trecho de aula, anotacao ou texto aqui para o Mestre gerar flashcards."
                maxLength={20000}
              />
            </label>
          </div>
        </div>
      )}

      {/* Message Feed */}
      <div className="mestre-feed">
        {messages.map((message) => (
          <div className={`mestre-chat-bubble-container ${message.role}`} key={message.id}>
            <div className="mestre-sender-label">
              {message.role === "mestre" ? "Mestre" : "Voce"}
            </div>
            <div className="mestre-chat-bubble">
              <MestreMessageText
                messageId={message.id}
                role={message.role}
                text={message.text}
                shouldAnimate={message.role === "mestre" && !animatedMessageIds[message.id]}
                onAnimated={markMessageAsAnimated}
                onProgress={scrollMessagesToBottom}
              />
            </div>

            {/* Render flashcards inline within the chat if any */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="mestre-inline-suggestions">
                {message.saved ? (
                  <div className="mestre-saved-status">
                    <DashboardIcon name="check" />
                    <span>Flashcards salvos na sua biblioteca!</span>
                  </div>
                ) : (
                  <>
                    <div className="suggestions-cards-list">
                      {message.suggestions.map((suggestion, idx) => {
                        const isChecked = (selectedIndexesByMsg[message.id] ?? []).includes(idx);
                        return (
                          <label className="mestre-suggestion-card" key={idx}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSuggestionCheck(message.id, idx)}
                            />
                            <div className="card-suggestion-body">
                              <span className={`difficulty-pill tone-${suggestion.difficulty.toLowerCase()}`}>
                                {getDifficultyLabel(suggestion.difficulty)}
                              </span>
                              <h5>{suggestion.question}</h5>
                              <p>{suggestion.answer}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <button
                      className="mestre-save-cards-button"
                      onClick={() => handleSaveFlashcards(message.id, message.suggestions!)}
                      disabled={isSavingCards[message.id]}
                    >
                      <DashboardIcon name="check" />
                      {isSavingCards[message.id] ? "Salvando..." : "Salvar Flashcards Selecionados"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
        {isWorking && (
          <div className="mestre-chat-bubble-container mestre thinking">
            <div className="mestre-sender-label">Mestre</div>
            <div className="mestre-chat-bubble">
              <div className="mestre-loader">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && !isWorking && (
        <div className="mestre-chips">
          <button onClick={() => handleSuggestionClick("Crie assunto Seguranca da informacao")}>
            <DashboardIcon name="plus" />
            <span>Cria assunto Seguranca da informacao</span>
          </button>
          <button onClick={() => handleSuggestionClick("Explique o que e criptografia simetrica")}>
            <DashboardIcon name="spark" />
            <span>O que e criptografia simetrica?</span>
          </button>
          <button onClick={() => handleSuggestionClick("Gere flashcards sobre o conteudo anexado")}>
            <DashboardIcon name="cards" />
            <span>Gere flashcards sobre o conteudo</span>
          </button>
        </div>
      )}

      {/* Footer Chat Input */}
      <form className="mestre-footer" onSubmit={handleSendMessage}>
        <button
          className={`mestre-paperclip ${showContextPanel || content.trim() ? "active" : ""}`}
          type="button"
          onClick={() => setShowContextPanel(!showContextPanel)}
          title="Anexar conteudo ou escolher assunto"
        >
          <DashboardIcon name="professor" />
          {content.trim() && <span className="attachment-indicator" />}
        </button>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={showContextPanel ? "Gere cards ou faca uma pergunta..." : "Pergunte ao Mestre..."}
          maxLength={1000}
        />
        <button className="mestre-submit-button" type="submit" disabled={isWorking || (!prompt.trim() && !content.trim())}>
          <DashboardIcon name="rocket" />
        </button>
      </form>
    </aside>
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
        <LoadingSkeleton variant="detail" count={1} />
      </section>
    );
  }

  if (feedback) {
    return (
      <section className="review-session-page">
        <ToastFeedback feedback={feedback} onClose={() => setFeedback(null)} />
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

  async function handleImportNoteFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.type !== "text/plain" && !file.name.toLowerCase().endsWith(".txt")) {
      setFeedback({ type: "error", message: "Importe apenas arquivos .txt." });
      return;
    }

    try {
      const content = await file.text();
      setFormValues((current) => ({ ...current, content }));
      setFeedback({ type: "success", message: "Conteudo importado para a anotacao." });
    } catch {
      setFeedback({ type: "error", message: "Nao foi possivel importar o arquivo txt." });
    }
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

    if (!confirmDelete(`a anotacao "${selectedNote.title}"`)) {
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
          Nova anotacao
        </button>
      </section>

      <ToastFeedback feedback={feedback} onClose={() => setFeedback(null)} />

      <section className="notes-grid">
        <aside className="notes-list-panel" aria-label="Lista de anotacoes">
          {isLoading ? (
            <LoadingSkeleton variant="list" count={3} />
          ) : notes.length === 0 ? (
            <div className="empty-state">
              <DashboardIcon name="note" />
              <strong>Nenhuma anotacao ainda</strong>
              <p>Escolha um assunto e crie sua primeira anotacao.</p>
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
          {isLoading ? (
            <LoadingSkeleton variant="detail" count={1} />
          ) : selectedNote ? (
            <>
              <div className="note-detail-heading">
                <div>
                  <span>{getSubjectName(subjects, selectedNote.subjectId)}</span>
                  <h2>{selectedNote.title}</h2>
                  <time>Atualizada em {formatDate(selectedNote.updatedAt)}</time>
                </div>
                <div className="note-actions">
                  <button type="button" onClick={() => startEditing(selectedNote)} aria-label="Editar anotacao">
                    <DashboardIcon name="edit" />
                  </button>
                  <button type="button" onClick={handleDeleteNote} disabled={isDeleting} aria-label="Excluir anotacao">
                    <DashboardIcon name="trash" />
                  </button>
                </div>
              </div>

              <div className="note-content">{selectedNote.content}</div>
            </>
          ) : (
            <div className="empty-state detail-empty">
              <DashboardIcon name="note" />
              <strong>Selecione uma anotacao</strong>
              <p>O detalhe da anotacao aparece aqui.</p>
            </div>
          )}
        </article>

        <form className="note-editor-panel" onSubmit={handleNoteSubmit}>
          <div className="panel-heading compact">
            <h2>
              <DashboardIcon name={editingNoteId ? "edit" : "plus"} />
              {editingNoteId ? "Editar anotacao" : "Nova anotacao"}
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
            Conteudo da anotacao
            <textarea
              value={formValues.content}
              onChange={(event) => updateNoteField("content", event.target.value)}
              maxLength={10000}
              placeholder="Escreva sua anotacao..."
              required
            />
          </label>

          <label className="txt-import-control">
            Importar arquivo .txt
            <input type="file" accept=".txt,text/plain" onChange={handleImportNoteFile} />
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
      <h2>{getSectionLabel(section)}</h2>
      <p>{getPlaceholderCopy(section)}</p>
    </section>
  );
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
        username: values.username.trim(),
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
      username: values.username.trim(),
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
    clock: (
      <>
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    pause: (
      <>
        <path d="M8 5v14" />
        <path d="M16 5v14" />
      </>
    ),
    play: (
      <>
        <path d="m8 5 11 7-11 7Z" />
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
    mission: (
      <>
        <path d="M4 5h11l5 5-5 5H4z" />
        <path d="M4 15v6" />
        <path d="M8 9h6" />
        <path d="M8 12h4" />
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
    professor: (
      <>
        <path d="M4 7h16" />
        <path d="M7 7V5h10v2" />
        <path d="M8 10h8v9H8z" />
        <path d="M10 13h4" />
        <path d="M10 16h3" />
        <path d="M6 19h12" />
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
    ),
    alert: (
      <>
        <path d="M12 8v5" />
        <path d="M12 17h.01" />
        <path d="M10.3 3.8 2.6 18a2 2 0 0 0 1.8 3h15.2a2 2 0 0 0 1.8-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
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
