import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { connectDB } from '../../../../lib/db';
import { User, ProgressNote } from '../../../../models/schema';

/**
 * Production-grade biomarker trend analysis endpoint
 * Analyzes user's biomarker patterns with statistical insights and anomaly detection
 */
export async function GET() {
  let dbConnection = null;

  try {
    // 1. Authentication - Validate user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(`Analyzing biomarker trends for user: ${userId}`);

    // 2. Database Connection
    dbConnection = await connectDB();

    // 3. Get user email for progress note queries
    const user = await User.findById(userId).select('email');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 4. Build date range for last 30 days
    const today = new Date();
    today.setUTCHours(23, 59, 59, 999);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setUTCDate(today.getUTCDate() - 29); // Include today
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

    // 5. Query progress notes with biomarker data
    const progressNotes = await ProgressNote.find({
      userEmail: user.email,
      date: { $gte: thirtyDaysAgo, $lte: today },
      biomarkers: { $exists: true, $ne: {} }
    }).select('date biomarkers').sort({ date: 1 }).lean();

    console.log(`Found ${progressNotes.length} progress notes with biomarker data`);

    if (progressNotes.length === 0) {
      return NextResponse.json([]);
    }

    // 6. Normalize biomarker data into standardized entries
    const normalizedEntries = normalizeBiomarkerData(progressNotes);

    // 7. Group by biomarker type and perform trend analysis
    const biomarkerGroups = groupBiomarkersByType(normalizedEntries);
    const trendAnalysis = Object.entries(biomarkerGroups).map(([biomarker, entries]) => {
      return analyzeBiomarkerTrend(biomarker, entries);
    });

    console.log(`Completed trend analysis for ${trendAnalysis.length} biomarkers`);

    return NextResponse.json(trendAnalysis);

  } catch (error) {
    console.error('Error in biomarkers/trends API:', {
      error: error.message,
      stack: error.stack,
      userId: session?.user?.id
    });

    return NextResponse.json(
      { error: 'Failed to analyze biomarker trends. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * Normalizes biomarker data from different storage formats into standardized entries
 * @param {Array} progressNotes - Array of progress note documents
 * @returns {Array} Array of normalized biomarker entries
 */
function normalizeBiomarkerData(progressNotes) {
  const normalizedEntries = [];

  progressNotes.forEach(note => {
    const noteDate = new Date(note.date).toISOString().split('T')[0]; // YYYY-MM-DD format
    let biomarkers = {};

    // Handle different biomarker storage formats
    if (note.biomarkers instanceof Map) {
      // MongoDB Map format
      biomarkers = Object.fromEntries(note.biomarkers);
    } else if (Array.isArray(note.biomarkers)) {
      // Array format: [{ type: 'Energy', value: 7 }, ...]
      note.biomarkers.forEach(item => {
        if (item.type && typeof item.value === 'number') {
          biomarkers[item.type] = item.value;
        }
      });
    } else if (typeof note.biomarkers === 'object') {
      // Object format: { Energy: 7, Sleep: 8, ... }
      biomarkers = note.biomarkers;
    }

    // Convert to normalized entries
    Object.entries(biomarkers).forEach(([biomarker, value]) => {
      if (typeof value === 'number' && !isNaN(value)) {
        // Clamp values between 1-10 range if applicable
        const clampedValue = Math.max(1, Math.min(10, value));

        normalizedEntries.push({
          date: noteDate,
          biomarker: biomarker,
          value: clampedValue
        });
      }
    });
  });

  return normalizedEntries;
}

/**
 * Groups normalized biomarker entries by biomarker type
 * @param {Array} normalizedEntries - Array of normalized entries
 * @returns {Object} Object with biomarker types as keys and entry arrays as values
 */
function groupBiomarkersByType(normalizedEntries) {
  const groups = {};

  normalizedEntries.forEach(entry => {
    if (!groups[entry.biomarker]) {
      groups[entry.biomarker] = [];
    }
    groups[entry.biomarker].push(entry);
  });

  // Sort entries by date within each group
  Object.values(groups).forEach(entries => {
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  });

  return groups;
}

/**
 * Performs comprehensive trend analysis for a specific biomarker
 * @param {string} biomarkerName - Name of the biomarker
 * @param {Array} entries - Array of biomarker entries sorted by date
 * @returns {Object} Complete trend analysis result
 */
function analyzeBiomarkerTrend(biomarkerName, entries) {
  if (entries.length === 0) {
    return {
      biomarker: biomarkerName,
      "7DayAvg": 0,
      "14DayAvg": 0,
      trend: "→ stable",
      anomalies: [],
      insight: "No data available for analysis."
    };
  }

  // Get date boundaries for moving averages
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(today.getUTCDate() - 6);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setUTCDate(today.getUTCDate() - 13);

  // Filter entries for different time windows
  const last7DaysEntries = entries.filter(entry =>
    new Date(entry.date) >= sevenDaysAgo
  );
  const last14DaysEntries = entries.filter(entry =>
    new Date(entry.date) >= fourteenDaysAgo
  );

  // Calculate moving averages
  const avg7Day = calculateMovingAverage(last7DaysEntries);
  const avg14Day = calculateMovingAverage(last14DaysEntries);

  // Determine trend direction using slope analysis
  const trend = calculateTrendDirection(last7DaysEntries, last14DaysEntries);

  // Detect anomalies using z-score analysis
  const anomalies = detectAnomalies(entries);

  // Generate intelligent insight summary
  const insight = generateInsightSummary(biomarkerName, {
    avg7Day,
    avg14Day,
    trend,
    anomalies,
    totalEntries: entries.length,
    recentEntries: last7DaysEntries.length
  });

  return {
    biomarker: biomarkerName,
    "7DayAvg": avg7Day,
    "14DayAvg": avg14Day,
    trend,
    anomalies,
    insight
  };
}

/**
 * Calculates moving average for a set of biomarker entries
 * @param {Array} entries - Array of biomarker entries
 * @returns {number} Moving average rounded to 1 decimal place
 */
function calculateMovingAverage(entries) {
  if (entries.length === 0) return 0;

  const sum = entries.reduce((total, entry) => total + entry.value, 0);
  return Math.round((sum / entries.length) * 10) / 10;
}

/**
 * Calculates trend direction using slope analysis between time windows
 * @param {Array} recent7Days - Recent 7-day entries
 * @param {Array} recent14Days - Recent 14-day entries
 * @returns {string} Trend direction with emoji
 */
function calculateTrendDirection(recent7Days, recent14Days) {
  if (recent7Days.length === 0 && recent14Days.length === 0) {
    return "→ stable";
  }

  // Use different approaches based on available data
  let slope = 0;

  if (recent7Days.length >= 2) {
    // Calculate slope within 7-day window
    slope = calculateLinearSlope(recent7Days);
  } else if (recent14Days.length >= 2) {
    // Fallback to 14-day window
    slope = calculateLinearSlope(recent14Days);
  } else {
    return "→ stable";
  }

  // Classify trend based on slope with epsilon threshold
  const epsilon = 0.1; // Small threshold for stability

  if (slope > epsilon) {
    return "↑ improving";
  } else if (slope < -epsilon) {
    return "↓ declining";
  } else {
    return "→ stable";
  }
}

/**
 * Calculates linear slope for a series of biomarker entries
 * @param {Array} entries - Array of biomarker entries
 * @returns {number} Linear slope value
 */
function calculateLinearSlope(entries) {
  if (entries.length < 2) return 0;

  // Convert dates to numeric values (days since first entry)
  const firstDate = new Date(entries[0].date);
  const dataPoints = entries.map((entry, index) => {
    const daysDiff = Math.floor((new Date(entry.date) - firstDate) / (1000 * 60 * 60 * 24));
    return { x: daysDiff, y: entry.value };
  });

  // Calculate linear regression slope using least squares method
  const n = dataPoints.length;
  const sumX = dataPoints.reduce((sum, point) => sum + point.x, 0);
  const sumY = dataPoints.reduce((sum, point) => sum + point.y, 0);
  const sumXY = dataPoints.reduce((sum, point) => sum + (point.x * point.y), 0);
  const sumXX = dataPoints.reduce((sum, point) => sum + (point.x * point.x), 0);

  const denominator = (n * sumXX) - (sumX * sumX);
  if (denominator === 0) return 0;

  const slope = ((n * sumXY) - (sumX * sumY)) / denominator;
  return slope;
}

/**
 * Detects anomalies using z-score analysis (±2σ threshold)
 * @param {Array} entries - Array of biomarker entries
 * @returns {Array} Array of anomaly objects with date and value
 */
function detectAnomalies(entries) {
  if (entries.length < 3) return []; // Need minimum data for meaningful analysis

  // Calculate mean and standard deviation
  const values = entries.map(entry => entry.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Detect outliers using ±2σ threshold
  const anomalies = [];
  const threshold = 2;

  entries.forEach(entry => {
    const zScore = Math.abs((entry.value - mean) / stdDev);
    if (zScore > threshold) {
      anomalies.push({
        date: entry.date,
        value: entry.value
      });
    }
  });

  return anomalies;
}

/**
 * Generates intelligent insight summary for a biomarker
 * @param {string} biomarkerName - Name of the biomarker
 * @param {Object} analysisData - Analysis results and statistics
 * @returns {string} Human-readable insight summary
 */
function generateInsightSummary(biomarkerName, analysisData) {
  const { avg7Day, avg14Day, trend, anomalies, totalEntries, recentEntries } = analysisData;

  // Build insight based on trend and data quality
  let insight = "";

  // Data availability context
  if (recentEntries === 0) {
    return `No recent ${biomarkerName.toLowerCase()} data recorded in the past week.`;
  }

  if (totalEntries < 3) {
    return `Limited ${biomarkerName.toLowerCase()} data available. More entries needed for reliable trends.`;
  }

  // Trend-based insights
  if (trend.includes("improving")) {
    insight = `${biomarkerName} is trending upward`;
    if (avg7Day > avg14Day) {
      insight += " with improved consistency";
    }
  } else if (trend.includes("declining")) {
    insight = `${biomarkerName} is showing a downward trend`;
    if (anomalies.length > 0) {
      insight += " with some fluctuations";
    }
  } else {
    insight = `${biomarkerName} has remained stable`;
    if (Math.abs(avg7Day - avg14Day) < 0.3) {
      insight += " with good consistency";
    }
  }

  // Add anomaly context
  if (anomalies.length > 0) {
    if (anomalies.length === 1) {
      insight += ". One unusual reading was recorded";
    } else {
      insight += `. ${anomalies.length} unusual readings were recorded`;
    }
  }

  // Add period context
  if (recentEntries >= 5) {
    insight += " this week";
  } else {
    insight += " in recent entries";
  }

  return insight + ".";
}