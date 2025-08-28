
export interface FeedbackData {
  strengths_highlight: string[];
  technical_delivery: TechnicalDelivery;
  content_analysis: ContentAnalysis;
  overall_scores: OverallScores;
  adaptive_scoring: AdaptiveScoring;
  encouragement_message: string;
  linguistic_performance: LinguisticPerformance;
  improvement_strategy: ImprovementStrategy;
}

interface TechnicalDelivery {
  clarity_coherence: string;
  comprehensibility_score: string;
  emotion_appropriateness: string;
}

interface ContentAnalysis {
  coverage_metrics: CoverageMetrics;
  understanding_depth: UnderstandingDepth;
  detail_retention: DetailRetention;
}

interface CoverageMetrics {
  major_omissions: string[];
  response_word_count: number;
  coverage_percentage: string;
  original_word_count: number;
  main_themes_captured: string[];
}

interface UnderstandingDepth {
  conceptual_gaps: string;
  explanation: string;
  semantic_accuracy: string;
  score: string;
}

interface DetailRetention {
  explanation: string;
  important_details_missed: string[];
  key_details_captured: string[];
  score: string;
}

interface OverallScores {
  pronunciation: number;
  grammar: number;
  fluency: number;
  emotion: string;
}

interface AdaptiveScoring {
  scoring_rationale: string;
  content_adjusted_scores: ContentAdjustedScores;
}

interface ContentAdjustedScores {
  overall_comprehension: string;
  retention_score: string;
  understanding_score: string;
}

interface LinguisticPerformance {
  fluency_assessment: FluencyAssessment;
  vocabulary_usage: VocabularyUsage;
  pronunciation_assessment: PronunciationAssessment;
  grammar_assessment: GrammarAssessment;
}

interface FluencyAssessment {
  detailed_analysis: string;
  score: number;
  pace_appropriateness: string;
}

interface VocabularyUsage {
  precision: string;
  appropriateness: string;
  synonym_usage: string;
}

interface PronunciationAssessment {
  impact_on_clarity: string;
  improvement_areas: string[];
  score: number;
  strengths: string[];
}

interface GrammarAssessment {
  complexity_level: string;
  error_patterns: string[];
  score: number;
  accuracy_analysis: string[];
}

interface ImprovementStrategy {
  practice_recommendations: string[];
  content_handling_tips: string[];
  immediate_priority: string;
}