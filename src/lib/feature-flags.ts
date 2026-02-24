export type FeatureCategory = "emotional_safety" | "intelligence" | "habit_love" | "moat" | "africa_first";
export type UserState = "new" | "active" | "power_user";

export type FeatureKey =
  | "business_mood"
  | "stress_free_mode"
  | "one_good_thing"
  | "daily_sales_prompt"
  | "weekly_business_story"
  | "goal_progress_bars"
  | "explain_simply"
  | "manual_decision_tagging"
  | "decision_replay"
  | "if_you_do_nothing_forecast"
  | "regret_protection_alerts"
  | "whatsapp_sms_summaries"
  | "expense_categorization_insights"
  | "business_memory_vault"
  | "business_twin"
  | "personal_business_personality"
  | "founder_time_score"
  | "advisor_shared_access";

interface FeatureFlag {
  featureKey: FeatureKey;
  enabled: boolean;
  category: FeatureCategory;
  rollout: number;
  userStates?: UserState[];
}

const featureFlags: FeatureFlag[] = [
  { featureKey: "business_mood", enabled: true, category: "emotional_safety", rollout: 100 },
  { featureKey: "stress_free_mode", enabled: true, category: "emotional_safety", rollout: 100 },
  { featureKey: "one_good_thing", enabled: true, category: "habit_love", rollout: 100 },
  { featureKey: "daily_sales_prompt", enabled: true, category: "habit_love", rollout: 100 },
  { featureKey: "weekly_business_story", enabled: true, category: "habit_love", rollout: 100 },
  { featureKey: "goal_progress_bars", enabled: true, category: "habit_love", rollout: 100 },
  { featureKey: "explain_simply", enabled: true, category: "emotional_safety", rollout: 100 },
  { featureKey: "manual_decision_tagging", enabled: true, category: "habit_love", rollout: 100 },
  { featureKey: "decision_replay", enabled: true, category: "intelligence", rollout: 100 },
  { featureKey: "if_you_do_nothing_forecast", enabled: true, category: "intelligence", rollout: 100 },
  { featureKey: "regret_protection_alerts", enabled: true, category: "intelligence", rollout: 100 },
  { featureKey: "whatsapp_sms_summaries", enabled: true, category: "africa_first", rollout: 100 },
  { featureKey: "expense_categorization_insights", enabled: true, category: "intelligence", rollout: 100 },
  { featureKey: "business_memory_vault", enabled: true, category: "moat", rollout: 100 },
  { featureKey: "business_twin", enabled: true, category: "moat", rollout: 100 },
  { featureKey: "personal_business_personality", enabled: true, category: "moat", rollout: 100 },
  { featureKey: "founder_time_score", enabled: true, category: "moat", rollout: 100 },
  { featureKey: "advisor_shared_access", enabled: true, category: "africa_first", rollout: 100 },
];

export function getFeatureMap(userState: UserState): Record<FeatureKey, boolean> {
  return featureFlags.reduce((acc, flag) => {
    const validState = !flag.userStates || flag.userStates.includes(userState);
    acc[flag.featureKey] = flag.enabled && flag.rollout > 0 && validState;
    return acc;
  }, {} as Record<FeatureKey, boolean>);
}
