import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all prediction outcomes
    const outcomes = await base44.asServiceRole.entities.PredictionOutcome.filter(
      { created_by: user.email },
      '-created_date',
      1000
    );

    if (!outcomes || outcomes.length === 0) {
      return Response.json({
        message: 'Not enough data for calibration',
        total_predictions: 0,
        calibration_bins: [],
        overall_accuracy: 0,
        by_sport: {},
        by_confidence: {}
      });
    }

    // Group by confidence bins
    const bins = {
      'Low (0-60%)': { predictions: [], correct: 0, total: 0 },
      'Medium (60-80%)': { predictions: [], correct: 0, total: 0 },
      'High (80-100%)': { predictions: [], correct: 0, total: 0 }
    };

    const bySport = {};
    const byConfidence = {
      'Low': { correct: 0, total: 0 },
      'Medium': { correct: 0, total: 0 },
      'High': { correct: 0, total: 0 }
    };

    let totalCorrect = 0;

    outcomes.forEach(outcome => {
      const confidence = outcome.predicted_confidence || 'Medium';
      const numeric = outcome.predicted_confidence_numeric || 50;
      
      // Bin by numeric confidence
      let bin;
      if (numeric < 60) bin = 'Low (0-60%)';
      else if (numeric < 80) bin = 'Medium (60-80%)';
      else bin = 'High (80-100%)';

      bins[bin].predictions.push(outcome);
      bins[bin].total++;
      if (outcome.was_correct) {
        bins[bin].correct++;
        totalCorrect++;
      }

      // Track by confidence label
      if (byConfidence[confidence]) {
        byConfidence[confidence].total++;
        if (outcome.was_correct) byConfidence[confidence].correct++;
      }

      // Track by sport
      const sport = outcome.sport || 'Unknown';
      if (!bySport[sport]) {
        bySport[sport] = { correct: 0, total: 0 };
      }
      bySport[sport].total++;
      if (outcome.was_correct) bySport[sport].correct++;
    });

    // Calculate calibration for each bin
    const calibrationBins = Object.entries(bins).map(([binName, data]) => {
      const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
      return {
        bin: binName,
        predicted_confidence_range: binName,
        actual_accuracy: Math.round(accuracy * 10) / 10,
        total_predictions: data.total,
        correct_predictions: data.correct
      };
    }).filter(b => b.total_predictions > 0);

    // Calculate by confidence label
    const byConfidenceStats = Object.entries(byConfidence).map(([conf, data]) => ({
      confidence: conf,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100 * 10) / 10 : 0,
      total: data.total,
      correct: data.correct
    })).filter(c => c.total > 0);

    // Calculate by sport
    const bySportStats = Object.entries(bySport).map(([sport, data]) => ({
      sport,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100 * 10) / 10 : 0,
      total: data.total,
      correct: data.correct
    })).sort((a, b) => b.total - a.total);

    const overallAccuracy = outcomes.length > 0 
      ? Math.round((totalCorrect / outcomes.length) * 100 * 10) / 10 
      : 0;

    return Response.json({
      total_predictions: outcomes.length,
      overall_accuracy: overallAccuracy,
      calibration_bins: calibrationBins,
      by_confidence: byConfidenceStats,
      by_sport: bySportStats,
      calibration_quality: calculateCalibrationQuality(calibrationBins),
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Calibration calculation error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});

function calculateCalibrationQuality(bins) {
  // Calculate Expected Calibration Error (ECE)
  let ece = 0;
  let totalPredictions = 0;

  bins.forEach(bin => {
    const binWeight = bin.total_predictions;
    totalPredictions += binWeight;
    
    // Extract midpoint of confidence range
    const rangeParts = bin.bin.match(/\d+/g);
    const midpoint = rangeParts ? (parseInt(rangeParts[0]) + parseInt(rangeParts[1])) / 2 : 50;
    
    const gap = Math.abs(midpoint - bin.actual_accuracy);
    ece += (binWeight * gap);
  });

  ece = totalPredictions > 0 ? ece / totalPredictions : 0;

  // Return quality assessment
  if (ece < 5) return 'Excellent';
  if (ece < 10) return 'Good';
  if (ece < 20) return 'Fair';
  return 'Needs Improvement';
}