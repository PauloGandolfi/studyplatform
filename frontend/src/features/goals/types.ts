export type GoalPriority = "LOW" | "MEDIUM" | "HIGH";
export type GoalStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

export type GoalPillar = {
  id: string;
  title: string;
  description: string | null;
  targetHours: number;
  progressPercentage: number;
  displayOrder: number;
};

export type GoalTaskSummary = {
  id: string;
  title: string;
  status: "TODO" | "DOING" | "DONE";
  primaryTask: boolean;
};

export type GoalSubjectSummary = {
  id: string;
  name: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
};

export type GoalPendingReview = {
  id: string;
  subjectId: string;
  subjectName: string;
  question: string;
  nextReviewDate: string;
  reviewInterval: number;
};

export type GoalProgressSnapshot = {
  trackedStudySeconds: number;
  hoursProgressPercentage: number;
  completedTasks: number;
  totalTasks: number;
  linkedSubjects: number;
  totalPillars: number;
  pendingReviews: number;
  totalFlashcards: number;
};

export type GoalWeeklyMission = {
  id: string;
  weekOrder: number;
  title: string;
  focus: string;
};

export type Goal = {
  id: string;
  title: string;
  description: string | null;
  currentLevel: string;
  priority: GoalPriority;
  status: GoalStatus;
  targetDate: string | null;
  weeklyStudyHours: number;
  estimatedStudyHours: number;
  trackedStudySeconds: number;
  progressPercentage: number;
  riskLevel: string;
  mentorSummary: string;
  progressSnapshot: GoalProgressSnapshot;
  pillars: GoalPillar[];
  weeklyMissions: GoalWeeklyMission[];
  linkedTasks: GoalTaskSummary[];
  linkedSubjects: GoalSubjectSummary[];
  pendingReviews: GoalPendingReview[];
  createdAt: string;
  updatedAt: string;
};

export type GoalPlanPillar = {
  title: string;
  description: string | null;
  targetHours: number;
};

export type WeeklyMission = {
  weekOrder: number;
  title: string;
  focus: string;
};

export type GoalPlan = {
  title: string;
  description: string | null;
  currentLevel: string;
  targetDate: string | null;
  weeklyStudyHours: number;
  estimatedStudyHours: number;
  mentorSummary: string;
  pillars: GoalPlanPillar[];
  weeklyMissions: WeeklyMission[];
  notice: string;
};

export type MentorCourseRecommendation = {
  title: string;
  platform: string;
  link: string;
  pricing: "FREE" | "PAID" | string;
  reason: string;
};

export type StudyRecommendations = {
  subject: string;
  level: string;
  learningGoal: string;
  suggestedOrder: string[];
  recommendations: MentorCourseRecommendation[];
  practiceSuggestion: string;
  mentorNotice: string;
};
