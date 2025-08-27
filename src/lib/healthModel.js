/**
 * EduBoost Health Model - JavaScript Implementation
 * Provides health recommendations based on student inputs
 */

class EduBoostHealthModel {
  constructor() {
    this.targetColumns = [
      'study_hours',
      'exercise_minutes', 
      'sleep_hours',
      'water_liters',
      'meditation_minutes',
      'screen_limit'
    ];
  }

  /**
   * Validate input parameters
   */
  _validateInputs(mood, stressLevel, procrastinationLevel, sleepHours) {
    const validMoods = ['happy', 'neutral', 'stressed', 'sad'];
    
    if (!validMoods.includes(mood.toLowerCase())) {
      throw new Error(`Invalid mood. Must be one of: ${validMoods.join(', ')}`);
    }
    
    if (stressLevel < 1 || stressLevel > 5) {
      throw new Error('Stress level must be between 1 and 5');
    }
    
    if (procrastinationLevel < 1 || procrastinationLevel > 5) {
      throw new Error('Procrastination level must be between 1 and 5');
    }
    
    if (sleepHours < 0 || sleepHours > 24) {
      throw new Error('Sleep hours must be between 0 and 24');
    }
  }

  /**
   * Generate heuristic predictions based on inputs
   */
  _heuristicPredictions(stressLevel, procrastinationLevel, sleepHours) {
    // Simple heuristic based on stress and procrastination
    const baseStudy = Math.max(1, 20 - (stressLevel * 1.5) - (procrastinationLevel * 1.0));
    const baseExercise = Math.min(120, 30 + (stressLevel * 5));
    const baseSleep = Math.max(6, Math.min(10, 8.0 - (stressLevel * 0.3)));
    const baseWater = Math.max(1.5, Math.min(4, 2.5 + (stressLevel * 0.2)));
    const baseMeditation = Math.min(60, 10 + (stressLevel * 3));
    const baseScreen = Math.max(2, Math.min(8, 6 - (stressLevel * 0.5)));
    
    return {
      study_hours: baseStudy,
      exercise_minutes: baseExercise,
      sleep_hours: baseSleep,
      water_liters: baseWater,
      meditation_minutes: baseMeditation,
      screen_limit: baseScreen
    };
  }

  /**
   * Generate personalized plans based on inputs and predictions
   */
  _generatePersonalizedPlans(mood, stressLevel, procrastinationLevel, sleepHours, predictions) {
    const plans = {
      study_plan: [],
      physical_plan: [],
      emotional_plan: []
    };

    // Study plan based on procrastination and stress
    if (procrastinationLevel >= 4) {
      plans.study_plan.push('Break study sessions into 25-minute focused blocks (Pomodoro Technique)');
      plans.study_plan.push('Use a timer and reward yourself after each session');
      plans.study_plan.push('Start with the easiest task to build momentum');
    } else if (procrastinationLevel >= 3) {
      plans.study_plan.push('Schedule specific study times and stick to them');
      plans.study_plan.push('Remove distractions from your study environment');
    } else {
      plans.study_plan.push('Maintain your current good study habits');
      plans.study_plan.push('Consider teaching others to reinforce your learning');
    }

    // Physical plan based on stress and exercise needs
    if (stressLevel >= 4) {
      plans.physical_plan.push('Try high-intensity interval training (HIIT) for quick stress relief');
      plans.physical_plan.push('Take regular walking breaks during study sessions');
      plans.physical_plan.push('Practice deep breathing exercises');
    } else if (stressLevel >= 3) {
      plans.physical_plan.push('Incorporate moderate cardio like jogging or cycling');
      plans.physical_plan.push('Try yoga or stretching routines');
    } else {
      plans.physical_plan.push('Maintain regular physical activity');
      plans.physical_plan.push('Try new sports or activities for variety');
    }

    // Emotional plan based on mood and stress
    if (mood === 'stressed' || stressLevel >= 4) {
      plans.emotional_plan.push('Practice mindfulness meditation daily');
      plans.emotional_plan.push('Connect with friends or family for support');
      plans.emotional_plan.push('Consider journaling to process your thoughts');
    } else if (mood === 'sad') {
      plans.emotional_plan.push('Engage in activities you enjoy');
      plans.emotional_plan.push('Spend time in nature or sunlight');
      plans.emotional_plan.push('Reach out to someone you trust');
    } else {
      plans.emotional_plan.push('Continue positive habits that support your well-being');
      plans.emotional_plan.push('Practice gratitude daily');
    }

    return plans;
  }

  /**
   * Categorize stress level
   */
  _categorizeStress(stressLevel) {
    if (stressLevel <= 2) return 'Low stress - well managed';
    if (stressLevel <= 3) return 'Moderate stress - manageable';
    if (stressLevel <= 4) return 'High stress - needs attention';
    return 'Very high stress - seek support';
  }

  /**
   * Assess sleep quality
   */
  _assessSleepQuality(sleepHours) {
    if (sleepHours < 6) return 'Insufficient sleep';
    if (sleepHours < 7) return 'Below recommended';
    if (sleepHours <= 9) return 'Good sleep duration';
    return 'Excessive sleep';
  }

  /**
   * Calculate confidence score
   */
  _calculateConfidence(stressLevel, procrastinationLevel) {
    // Simple confidence calculation based on input consistency
    const baseConfidence = 0.85;
    const stressPenalty = (stressLevel - 3) * 0.05;
    const procrastinationPenalty = (procrastinationLevel - 3) * 0.03;
    
    return Math.max(0.5, Math.min(1.0, baseConfidence - stressPenalty - procrastinationPenalty));
  }

  /**
   * Main prediction method
   */
  predict(mood, stressLevel, procrastinationLevel, sleepHours) {
    try {
      // Validate inputs
      this._validateInputs(mood, stressLevel, procrastinationLevel, sleepHours);
      
      // Generate predictions using heuristics
      const predictions = this._heuristicPredictions(stressLevel, procrastinationLevel, sleepHours);
      
      // Generate personalized plans
      const personalizedPlans = this._generatePersonalizedPlans(
        mood, stressLevel, procrastinationLevel, sleepHours, predictions
      );
      
      // Calculate confidence
      const confidence = this._calculateConfidence(stressLevel, procrastinationLevel);
      
      // Prepare comprehensive result
      const result = {
        input_analysis: {
          mood: mood,
          stress_level: stressLevel,
          procrastination_level: procrastinationLevel,
          sleep_hours: sleepHours,
          stress_category: this._categorizeStress(stressLevel),
          sleep_quality: this._assessSleepQuality(sleepHours)
        },
        recommendations: personalizedPlans,
        detailed_metrics: {
          study_hours: Math.round(predictions.study_hours * 10) / 10,
          exercise_minutes: Math.round(predictions.exercise_minutes),
          sleep_hours: Math.round(predictions.sleep_hours * 10) / 10,
          water_liters: Math.round(predictions.water_liters * 10) / 10,
          meditation_minutes: Math.round(predictions.meditation_minutes),
          screen_limit: Math.round(predictions.screen_limit * 10) / 10
        },
        model_confidence: Math.round(confidence * 1000) / 1000
      };
      
      return result;
      
    } catch (error) {
      throw new Error(`Prediction failed: ${error.message}`);
    }
  }
}

export default EduBoostHealthModel;