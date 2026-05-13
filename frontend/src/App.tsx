import { FormEvent, ReactNode, useMemo, useState } from "react";
import spaceImage from "./assets/space-login.png";

type AuthMode = "login" | "register";
type AppView = "auth" | "home";

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

const initialValues = {
  name: "",
  email: "",
  password: ""
};

const overviewCards = [
  { label: "Subjects", value: "12", detail: "assuntos criados", icon: "book" },
  { label: "Notes", value: "84", detail: "anotacoes no total", icon: "note" },
  { label: "Flashcards", value: "256", detail: "cartoes criados", icon: "cards" },
  { label: "Revisoes", value: "18", detail: "para hoje", icon: "calendar" }
];

const recentActivities = [
  { title: "Note: Ciclo de Vida das Estrelas", subject: "Astronomia", time: "2h atras" },
  { title: "Flashcard: Java - Collections", subject: "Java", time: "4h atras" },
  { title: "Note: Regras de Derivacao", subject: "Calculo", time: "1 dia atras" },
  { title: "Flashcard: SQL - JOINs", subject: "Banco de Dados", time: "1 dia atras" }
];

const navItems = [
  { label: "Dashboard", icon: "dashboard" },
  { label: "Subjects", icon: "book" },
  { label: "Notes", icon: "note" },
  { label: "Flashcards", icon: "cards" },
  { label: "Revisoes", icon: "calendar" },
  { label: "Estatisticas", icon: "chart" },
  { label: "Perfil", icon: "user" },
  { label: "Configuracoes", icon: "settings" }
];

function App() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [currentView, setCurrentView] = useState<AppView>(() =>
    localStorage.getItem("studyplatform_token") ? "home" : "auth"
  );
  const [values, setValues] = useState(initialValues);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userName, setUserName] = useState<string | null>(() => getStoredUserName());

  const isRegister = mode === "register";
  const title = isRegister ? "Criar conta" : "Entrar";
  const subtitle = isRegister
    ? "Comece sua jornada de estudos em poucos segundos."
    : "Acesse seu painel e continue de onde parou.";

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
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const endpoint = isRegister ? "/auth/register" : "/auth/login";
    const payload = isRegister
      ? {
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password
        }
      : {
          email: values.email.trim(),
          password: values.password
        };

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

      const loginData = data as LoginResponse;
      localStorage.setItem("studyplatform_token", loginData.accessToken);
      localStorage.setItem("studyplatform_user", JSON.stringify(loginData));
      setUserName(loginData.name);
      setCurrentView("home");
      setValues(initialValues);
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
  }

  if (currentView === "home") {
    return <HomePage userName={userName ?? "Paulo"} onLogout={handleLogout} />;
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

              <label>
                Senha
                <span className="input-wrap">
                  <LockIcon />
                  <input
                    type="password"
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    value={values.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    placeholder="No minimo 8 caracteres"
                    minLength={8}
                    maxLength={72}
                    required
                  />
                </span>
              </label>

              <p className="password-hint">{passwordHint}</p>

              {feedback ? (
                <div className={`feedback ${feedback.type}`} role="status">
                  {feedback.message}
                </div>
              ) : null}

              <button className="submit-button" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Enviando..."
                  : isRegister
                    ? "Criar minha conta"
                    : "Fazer login"}
              </button>
            </form>

            <p className="switch-copy">
              {isRegister ? "Ja tem uma conta?" : "Ainda nao tem conta?"}
              <button
                type="button"
                onClick={() => changeMode(isRegister ? "login" : "register")}
              >
                {isRegister ? "Entrar" : "Criar conta"}
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function HomePage({ userName, onLogout }: { userName: string; onLogout: () => void }) {
  const initials = getInitials(userName);

  return (
    <main className="home-page">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-orb" />
          <strong>
            Study
            <br />
            Platform
          </strong>
        </div>

        <nav className="side-nav" aria-label="Navegacao principal">
          {navItems.map((item, index) => (
            <button className={index === 0 ? "active" : ""} type="button" key={item.label}>
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
            <h1>Bem-vindo(a) de volta!</h1>
            <p>Pronto para mais uma sessao de estudos?</p>
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
      </section>
    </main>
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
