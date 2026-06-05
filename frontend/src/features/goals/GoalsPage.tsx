import { FormEvent, MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../shared/api/client";
import { Goal, GoalPlan, GoalPriority, GoalStatus, StudyRecommendations } from "./types";

type Feedback = {
  type: "success" | "error";
  message: string;
};

type GoalFormValues = {
  title: string;
  description: string;
  currentLevel: string;
  priority: GoalPriority;
  status: GoalStatus;
  targetDate: string;
  weeklyStudyHours: string;
  estimatedStudyHours: string;
};

const emptyGoalForm: GoalFormValues = {
  title: "",
  description: "",
  currentLevel: "iniciante",
  priority: "HIGH",
  status: "ACTIVE",
  targetDate: "",
  weeklyStudyHours: "6",
  estimatedStudyHours: ""
};

function formatHoursFromSeconds(seconds: number) {
  const hours = seconds / 3600;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
}

function formatGoalPriority(priority: GoalPriority) {
  if (priority === "HIGH") {
    return "Alta";
  }

  if (priority === "LOW") {
    return "Baixa";
  }

  return "Media";
}

function formatGoalStatus(status: GoalStatus) {
  if (status === "ACTIVE") {
    return "Ativo";
  }

  if (status === "PAUSED") {
    return "Pausado";
  }

  return "Concluido";
}

function formatDifficultyLabel(difficulty: "EASY" | "MEDIUM" | "HARD") {
  if (difficulty === "EASY") {
    return "Facil";
  }

  if (difficulty === "HARD") {
    return "Dificil";
  }

  return "Media";
}

function formatReviewDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short"
  }).format(new Date(year, month - 1, day));
}

function formatRiskLabel(riskLevel: string) {
  if (riskLevel === "AT_RISK") {
    return "Em risco";
  }

  if (riskLevel === "ON_TRACK") {
    return "No ritmo";
  }

  if (riskLevel === "COMPLETED") {
    return "Concluido";
  }

  return "Sem prazo";
}

function buildGoalForm(goal: Goal | null): GoalFormValues {
  if (!goal) {
    return emptyGoalForm;
  }

  return {
    title: goal.title,
    description: goal.description ?? "",
    currentLevel: goal.currentLevel,
    priority: goal.priority,
    status: goal.status,
    targetDate: goal.targetDate ?? "",
    weeklyStudyHours: String(goal.weeklyStudyHours),
    estimatedStudyHours: String(goal.estimatedStudyHours)
  };
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<GoalFormValues>(emptyGoalForm);
  const [generatedPlan, setGeneratedPlan] = useState<GoalPlan | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [recommendationsTopic, setRecommendationsTopic] = useState("");
  const [recommendations, setRecommendations] = useState<StudyRecommendations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId) ?? null;
  const activeGoals = goals.filter((goal) => goal.status === "ACTIVE");
  const trackedHours = useMemo(
    () => goals.reduce((total, goal) => total + goal.trackedStudySeconds, 0),
    [goals]
  );

  const loadGoals = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await apiRequest<Goal[]>("/goals");
      setGoals(data);
      setSelectedGoalId((current) => current && data.some((goal) => goal.id === current) ? current : data[0]?.id ?? null);
      setFeedback(null);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel carregar seus objetivos."
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  useEffect(() => {
    if (!selectedGoalId) {
      return;
    }

    let isActive = true;

    async function loadGoalDetail() {
      try {
        const detail = await apiRequest<Goal>(`/goals/${selectedGoalId}`);
        if (!isActive) {
          return;
        }

        setGoals((current) => current.map((goal) => goal.id === detail.id ? detail : goal));
      } catch {
        // Keep list data as fallback when detail fetch fails.
      }
    }

    loadGoalDetail();

    return () => {
      isActive = false;
    };
  }, [selectedGoalId]);

  function updateField<K extends keyof GoalFormValues>(field: K, value: GoalFormValues[K]) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFeedback(null);
  }

  function startNewGoal() {
    setEditingGoalId(null);
    setGeneratedPlan(null);
    setRecommendations(null);
    setFormValues(emptyGoalForm);
    setFeedback(null);
  }

  function startEditingGoal(goal: Goal) {
    setEditingGoalId(goal.id);
    setGeneratedPlan(null);
    setRecommendationsTopic(goal.title);
    setFormValues(buildGoalForm(goal));
    setFeedback(null);
  }

  async function handleGeneratePlan(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    if (!formValues.title.trim() || !formValues.currentLevel.trim()) {
      setFeedback({
        type: "error",
        message: "Preencha pelo menos titulo, nivel atual e carga semanal antes de gerar o plano."
      });
      return;
    }

    setIsGeneratingPlan(true);
    setFeedback(null);

    try {
      const plan = await apiRequest<GoalPlan>("/mentor/goal-plan", {
        method: "POST",
        body: JSON.stringify({
          title: formValues.title.trim(),
          description: formValues.description.trim(),
          currentLevel: formValues.currentLevel.trim(),
          priority: formValues.priority,
          targetDate: formValues.targetDate || null,
          weeklyStudyHours: Number(formValues.weeklyStudyHours)
        })
      });

      setGeneratedPlan(plan);
      setFormValues((current) => ({
        ...current,
        estimatedStudyHours: String(plan.estimatedStudyHours)
      }));
      setFeedback({
        type: "success",
        message: "Plano gerado pelo Mentor. Revise o resultado e ajuste o que quiser antes de salvar."
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel gerar o plano inicial."
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const payload = {
      title: formValues.title.trim(),
      description: formValues.description.trim(),
      currentLevel: formValues.currentLevel.trim(),
      priority: formValues.priority,
      status: formValues.status,
      targetDate: formValues.targetDate || null,
      weeklyStudyHours: Number(formValues.weeklyStudyHours),
      estimatedStudyHours: formValues.estimatedStudyHours ? Number(formValues.estimatedStudyHours) : null,
      pillars: generatedPlan?.pillars ?? null,
      weeklyMissions: generatedPlan?.weeklyMissions ?? null,
      mentorSummary: generatedPlan?.mentorSummary ?? null
    };

    try {
      const savedGoal = await apiRequest<Goal>(editingGoalId ? `/goals/${editingGoalId}` : "/goals", {
        method: editingGoalId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });

      setGoals((current) => {
        if (editingGoalId) {
          return current.map((goal) => goal.id === savedGoal.id ? savedGoal : goal);
        }

        return [savedGoal, ...current];
      });
      setSelectedGoalId(savedGoal.id);
      setEditingGoalId(savedGoal.id);
      setFeedback({
        type: "success",
        message: editingGoalId ? "Objetivo atualizado." : "Objetivo criado."
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel salvar o objetivo."
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteGoal() {
    if (!selectedGoal) {
      return;
    }

    if (!window.confirm(`Deseja excluir o objetivo "${selectedGoal.title}"?`)) {
      return;
    }

    setIsDeleting(true);
    setFeedback(null);

    try {
      await apiRequest<null>(`/goals/${selectedGoal.id}`, { method: "DELETE" });
      const remainingGoals = goals.filter((goal) => goal.id !== selectedGoal.id);
      setGoals(remainingGoals);
      setSelectedGoalId(remainingGoals[0]?.id ?? null);
      if (editingGoalId === selectedGoal.id) {
        startNewGoal();
      }
      setFeedback({ type: "success", message: "Objetivo excluido." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel excluir o objetivo."
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleLoadRecommendations() {
    const topic = recommendationsTopic.trim() || selectedGoal?.title?.trim() || formValues.title.trim();

    if (!topic) {
      setFeedback({
        type: "error",
        message: "Informe um assunto ou aproveite o titulo do objetivo para gerar recomendacoes."
      });
      return;
    }

    setIsLoadingRecommendations(true);
    setFeedback(null);

    try {
      const response = await apiRequest<StudyRecommendations>("/mentor/recommendations", {
        method: "POST",
        body: JSON.stringify({
          topic,
          learningGoal: selectedGoal?.title || formValues.title || topic,
          currentLevel: selectedGoal?.currentLevel || formValues.currentLevel || "iniciante"
        })
      });

      setRecommendations(response);
      setFeedback({
        type: "success",
        message: "Curadoria estruturada carregada pelo Mentor."
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel gerar recomendacoes agora."
      });
    } finally {
      setIsLoadingRecommendations(false);
    }
  }

  return (
    <div className="goals-page">
      <section className="goals-hero">
        <div>
          <span>Objetivos ativos</span>
          <h2>Planeje a jornada com o Mentor</h2>
          <p>Crie mais de um objetivo, vincule horas reais de estudo e acompanhe o progresso sem depender de busca externa.</p>
        </div>

        <div className="goals-hero-stats">
          <article>
            <span>Total</span>
            <strong>{goals.length}</strong>
          </article>
          <article>
            <span>Ativos</span>
            <strong>{activeGoals.length}</strong>
          </article>
          <article>
            <span>Horas rastreadas</span>
            <strong>{formatHoursFromSeconds(trackedHours)}</strong>
          </article>
        </div>
      </section>

      {feedback ? (
        <div className={`feedback inline-feedback ${feedback.type}`} role="status">
          <p>{feedback.message}</p>
        </div>
      ) : null}

      <section className="goals-layout">
        <aside className="goals-list-panel" aria-label="Lista de objetivos">
          <div className="panel-heading compact">
            <h2>Seus objetivos</h2>
            <button type="button" onClick={startNewGoal}>Novo</button>
          </div>

          {isLoading ? (
            <div className="goals-empty-state">
              <strong>Carregando objetivos...</strong>
            </div>
          ) : goals.length === 0 ? (
            <div className="goals-empty-state">
              <strong>Nenhum objetivo criado</strong>
              <p>Use o painel ao lado para criar seu primeiro objetivo.</p>
            </div>
          ) : (
            <div className="goals-list">
              {goals.map((goal) => (
                <button
                  type="button"
                  key={goal.id}
                  className={selectedGoalId === goal.id ? "active" : ""}
                  onClick={() => setSelectedGoalId(goal.id)}
                >
                  <div className="goal-list-topline">
                    <span className={`goal-priority-pill tone-${goal.priority.toLowerCase()}`}>{formatGoalPriority(goal.priority)}</span>
                    <small>{formatGoalStatus(goal.status)}</small>
                  </div>
                  <strong>{goal.title}</strong>
                  <p>{goal.mentorSummary}</p>
                  <div className="goal-progress-line">
                    <span style={{ width: `${goal.progressPercentage}%` }} />
                  </div>
                  <small>{goal.progressPercentage}% concluido</small>
                </button>
              ))}
            </div>
          )}
        </aside>

        <article className="goal-detail-panel" aria-label="Detalhe do objetivo">
          {selectedGoal ? (
            <>
              <div className="goal-detail-header">
                <div>
                  <div className="goal-detail-meta">
                    <span className={`goal-risk-pill tone-${selectedGoal.riskLevel.toLowerCase().replace("_", "-")}`}>{formatRiskLabel(selectedGoal.riskLevel)}</span>
                    <small>{selectedGoal.targetDate ? `Prazo ate ${selectedGoal.targetDate}` : "Sem prazo fechado"}</small>
                  </div>
                  <h2>{selectedGoal.title}</h2>
                  <p>{selectedGoal.description || "Sem descricao detalhada ainda."}</p>
                </div>

                <div className="goal-detail-actions">
                  <button type="button" onClick={() => startEditingGoal(selectedGoal)}>Editar</button>
                  <button type="button" className="danger" onClick={handleDeleteGoal} disabled={isDeleting}>
                    {isDeleting ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
              </div>

              <div className="goal-detail-stats">
                <article>
                  <span>Progresso</span>
                  <strong>{selectedGoal.progressPercentage}%</strong>
                  <p>Calculado pelas horas vinculadas a este objetivo.</p>
                </article>
                <article>
                  <span>Horas estudadas</span>
                  <strong>{formatHoursFromSeconds(selectedGoal.trackedStudySeconds)}</strong>
                  <p>Meta total estimada: {selectedGoal.estimatedStudyHours}h.</p>
                </article>
                <article>
                  <span>Cadencia semanal</span>
                  <strong>{selectedGoal.weeklyStudyHours}h/semana</strong>
                  <p>Nivel atual: {selectedGoal.currentLevel}.</p>
                </article>
              </div>

              <section className="goal-detail-stats">
                <article>
                  <span>Tarefas concluidas</span>
                  <strong>{selectedGoal.progressSnapshot.completedTasks}/{selectedGoal.progressSnapshot.totalTasks}</strong>
                  <p>Missoes vinculadas e marcadas como feitas.</p>
                </article>
                <article>
                  <span>Assuntos ligados</span>
                  <strong>{selectedGoal.progressSnapshot.linkedSubjects}</strong>
                  <p>{selectedGoal.progressSnapshot.totalPillars} pilar(es) no plano atual.</p>
                </article>
                <article>
                  <span>Revisoes pendentes</span>
                  <strong>{selectedGoal.progressSnapshot.pendingReviews}</strong>
                  <p>{selectedGoal.progressSnapshot.totalFlashcards} flashcard(s) ligados ao objetivo.</p>
                </article>
              </section>

              <section className="goal-mentor-summary">
                <span>Resumo do Mentor</span>
                <p>{selectedGoal.mentorSummary}</p>
              </section>

              <section className="goal-pillars-section">
                <div className="panel-heading compact">
                  <h3>Pilares do objetivo</h3>
                  <small>{selectedGoal.pillars.length} pilar(es)</small>
                </div>

                <div className="goal-pillars-grid">
                  {selectedGoal.pillars.map((pillar) => (
                    <article key={pillar.id} className="goal-pillar-card">
                      <div className="goal-pillar-heading">
                        <strong>{pillar.title}</strong>
                        <span>{pillar.targetHours}h</span>
                      </div>
                      <p>{pillar.description || "Sem observacoes adicionais para este pilar."}</p>
                      <div className="goal-progress-line">
                        <span style={{ width: `${pillar.progressPercentage}%` }} />
                      </div>
                      <small>{pillar.progressPercentage}% concluido</small>
                    </article>
                  ))}
                </div>
              </section>

              <section className="goal-linked-tasks">
                <div className="panel-heading compact">
                  <h3>Missoes da fase inicial</h3>
                  <small>{selectedGoal.weeklyMissions.length} semana(s)</small>
                </div>

                {selectedGoal.weeklyMissions.length === 0 ? (
                  <p className="goal-linked-empty">As missoes estruturadas da fase inicial aparecem aqui quando o plano tiver sido salvo.</p>
                ) : (
                  <div className="goal-linked-list">
                    {selectedGoal.weeklyMissions.map((mission) => (
                      <div key={mission.id} className="goal-linked-task">
                        <div>
                          <strong>{mission.title}</strong>
                          <small>Semana {mission.weekOrder}</small>
                        </div>
                        <span>{mission.focus}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="goal-linked-tasks">
                <div className="panel-heading compact">
                  <h3>Missoes ligadas</h3>
                  <small>{selectedGoal.linkedTasks.length} tarefa(s)</small>
                </div>

                {selectedGoal.linkedTasks.length === 0 ? (
                  <p className="goal-linked-empty">As tarefas vinculadas vao aparecer aqui conforme voce relacionar missoes a este objetivo.</p>
                ) : (
                  <div className="goal-linked-list">
                    {selectedGoal.linkedTasks.map((task) => (
                      <div key={task.id} className="goal-linked-task">
                        <div>
                          <strong>{task.title}</strong>
                          <small>{task.primaryTask ? "Missao principal" : "Missao secundaria"}</small>
                        </div>
                        <span className={`task-status tone-${task.status.toLowerCase()}`}>{task.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="goal-linked-tasks">
                <div className="panel-heading compact">
                  <h3>Assuntos conectados</h3>
                  <small>{selectedGoal.linkedSubjects.length} assunto(s)</small>
                </div>

                {selectedGoal.linkedSubjects.length === 0 ? (
                  <p className="goal-linked-empty">Conecte assuntos a este objetivo para organizar melhor anotacoes, flashcards e revisoes.</p>
                ) : (
                  <div className="goal-linked-list">
                    {selectedGoal.linkedSubjects.map((subject) => (
                      <div key={subject.id} className="goal-linked-task">
                        <div>
                          <strong>{subject.name}</strong>
                          <small>Assunto vinculado ao objetivo</small>
                        </div>
                        <span>{formatDifficultyLabel(subject.difficulty)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="goal-linked-tasks">
                <div className="panel-heading compact">
                  <h3>Revisoes pendentes</h3>
                  <small>{selectedGoal.pendingReviews.length} card(s) em destaque</small>
                </div>

                {selectedGoal.pendingReviews.length === 0 ? (
                  <p className="goal-linked-empty">Quando houver flashcards vencidos dentro deste objetivo, eles aparecem aqui para priorizacao.</p>
                ) : (
                  <div className="goal-linked-list">
                    {selectedGoal.pendingReviews.map((review) => (
                      <div key={review.id} className="goal-linked-task">
                        <div>
                          <strong>{review.subjectName}</strong>
                          <small>Revisar ate {formatReviewDate(review.nextReviewDate)}</small>
                        </div>
                        <span>{review.question}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="goals-empty-state detail">
              <strong>Selecione um objetivo</strong>
              <p>O detalhe completo aparece aqui, com progresso, pilares e missoes vinculadas.</p>
            </div>
          )}
        </article>

        <form className="goal-editor-panel" onSubmit={handleSubmit}>
          <div className="panel-heading compact">
            <div>
              <h2>{editingGoalId ? "Editar objetivo" : "Criar objetivo"}</h2>
              <p>O nome oficial desta jornada no produto e Objetivos.</p>
            </div>
            <button type="button" onClick={startNewGoal}>Limpar</button>
          </div>

          <label>
            Nome do objetivo
            <input
              type="text"
              value={formValues.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Ex: Virar desenvolvedor Java pleno"
              maxLength={160}
              required
            />
          </label>

          <label>
            Contexto opcional
            <textarea
              value={formValues.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Explique o foco, a area e o resultado esperado..."
              maxLength={2000}
            />
          </label>

          <div className="goal-editor-grid">
            <label>
              Nivel atual
              <input
                type="text"
                value={formValues.currentLevel}
                onChange={(event) => updateField("currentLevel", event.target.value)}
                placeholder="iniciante, junior, intermediario..."
                maxLength={80}
                required
              />
            </label>

            <label>
              Prioridade
              <select
                value={formValues.priority}
                onChange={(event) => updateField("priority", event.target.value as GoalPriority)}
              >
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Media</option>
                <option value="LOW">Baixa</option>
              </select>
            </label>

            <label>
              Status
              <select
                value={formValues.status}
                onChange={(event) => updateField("status", event.target.value as GoalStatus)}
              >
                <option value="ACTIVE">Ativo</option>
                <option value="PAUSED">Pausado</option>
                <option value="COMPLETED">Concluido</option>
              </select>
            </label>

            <label>
              Horas por semana
              <input
                type="number"
                min={1}
                max={80}
                value={formValues.weeklyStudyHours}
                onChange={(event) => updateField("weeklyStudyHours", event.target.value)}
                required
              />
            </label>

            <label>
              Prazo de validade
              <input
                type="date"
                value={formValues.targetDate}
                onChange={(event) => updateField("targetDate", event.target.value)}
              />
            </label>

            <label>
              Horas totais estimadas
              <input
                type="number"
                min={1}
                max={2000}
                value={formValues.estimatedStudyHours}
                onChange={(event) => updateField("estimatedStudyHours", event.target.value)}
                placeholder="Opcional"
              />
            </label>
          </div>

          <div className="goal-editor-actions">
            <button type="button" onClick={handleGeneratePlan} disabled={isGeneratingPlan}>
              {isGeneratingPlan ? "Gerando plano..." : "Gerar plano com o Mentor"}
            </button>
            <button type="submit" className="primary" disabled={isSaving}>
              {isSaving ? "Salvando..." : editingGoalId ? "Salvar alteracoes" : "Criar objetivo"}
            </button>
          </div>

          <p className="goal-formula-note">
            Progresso do objetivo: calculado pelas horas registradas no timer quando voce vincula a sessao a este objetivo.
          </p>

          {generatedPlan ? (
            <section className="goal-plan-preview">
              <div className="panel-heading compact">
                <div>
                  <h3>Plano sugerido pelo Mentor</h3>
                  <small>{generatedPlan.notice}</small>
                </div>
                <strong>{generatedPlan.estimatedStudyHours}h</strong>
              </div>

              <p>{generatedPlan.mentorSummary}</p>

              <div className="goal-plan-columns">
                <div>
                  <h4>Pilares sugeridos</h4>
                  <ul>
                    {generatedPlan.pillars.map((pillar) => (
                      <li key={`${pillar.title}-${pillar.targetHours}`}>
                        <strong>{pillar.title}</strong>
                        <span>{pillar.targetHours}h</span>
                        <p>{pillar.description || "Sem descricao complementar."}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4>Missoes iniciais</h4>
                  <ul>
                    {generatedPlan.weeklyMissions.map((mission) => (
                      <li key={`${mission.weekOrder}-${mission.title}`}>
                        <strong>{mission.title}</strong>
                        <p>{mission.focus}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          <section className="goal-plan-preview">
            <div className="panel-heading compact">
              <div>
                <h3>Recomendacoes estruturadas</h3>
                <small>Gratuitas primeiro, depois algumas pagas de boa qualidade.</small>
              </div>
            </div>

            <label>
              Assunto para curadoria
              <input
                type="text"
                value={recommendationsTopic}
                onChange={(event) => setRecommendationsTopic(event.target.value)}
                placeholder="Ex: Spring Security para JWT"
                maxLength={160}
              />
            </label>

            <div className="goal-editor-actions">
              <button type="button" onClick={handleLoadRecommendations} disabled={isLoadingRecommendations}>
                {isLoadingRecommendations ? "Buscando curadoria..." : "Gerar recomendacoes do Mentor"}
              </button>
            </div>

            {recommendations ? (
              <div className="goal-recommendations-panel">
                <p>{recommendations.mentorNotice}</p>

                <div className="goal-plan-columns">
                  <div>
                    <h4>Ordem sugerida</h4>
                    <ul>
                      {recommendations.suggestedOrder.map((item, index) => (
                        <li key={`${item}-${index}`}>
                          <strong>Passo {index + 1}</strong>
                          <p>{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4>Cursos recomendados</h4>
                    <ul>
                      {recommendations.recommendations.map((recommendation, index) => (
                        <li key={`${recommendation.link}-${index}`}>
                          <strong>{recommendation.title}</strong>
                          <span>{recommendation.pricing === "FREE" ? "Gratuito" : "Pago"} • {recommendation.platform}</span>
                          <p>{recommendation.reason}</p>
                          <a href={recommendation.link} target="_blank" rel="noreferrer">
                            Abrir curso
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p>Pratica sugerida: {recommendations.practiceSuggestion}</p>
              </div>
            ) : null}
          </section>
        </form>
      </section>
    </div>
  );
}
