import React, { useState, useEffect } from 'react';
import { JournalEntry, JournalStatistics, Emotion } from '@/types/journal';
import { Phase } from '@/types/phase';
import { format, subMonths, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';

interface JournalVisualizationProps {
  entries: JournalEntry[];
  phases: Phase[];
}

const JournalVisualization: React.FC<JournalVisualizationProps> = ({ entries, phases }) => {
  const [statistics, setStatistics] = useState<JournalStatistics | null>(null);
  const [selectedVisualization, setSelectedVisualization] = useState<'emotions' | 'frequency' | 'phases'>('emotions');
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  // Calculate statistics whenever entries or timeRange changes
  useEffect(() => {
    if (!entries.length) {
      setStatistics(null);
      return;
    }

    // Get date range based on selected timeRange
    const endDate = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'quarter':
        startDate = subMonths(endDate, 3);
        break;
      case 'year':
        startDate = subMonths(endDate, 12);
        break;
      case 'month':
      default:
        startDate = subMonths(endDate, 1);
        break;
    }

    // Filter entries by date range
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });

    // Calculate emotion distribution
    const emotionCounts: Record<Emotion, number> = {
      'joyful': 0,
      'optimistic': 0,
      'content': 0,
      'neutral': 0,
      'fatigued': 0,
      'anxious': 0,
      'frustrated': 0,
      'discouraged': 0
    };

    filteredEntries.forEach(entry => {
      emotionCounts[entry.emotion as Emotion] = (emotionCounts[entry.emotion as Emotion] || 0) + 1;
    });

    // Get entry counts by phase
    const entriesByPhase = phases.map(phase => {
      const count = filteredEntries.filter(entry => entry.phaseId === phase._id).length;
      return {
        phaseId: phase._id,
        phaseName: phase.name,
        count
      };
    });

    // Calculate tag frequency
    const tagCounts: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Sort tags by frequency and get top 5
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    // Calculate streak data
    const sortedDates = filteredEntries
      .map(entry => new Date(entry.date))
      .sort((a, b) => b.getTime() - a.getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let lastEntryDate = sortedDates.length ? sortedDates[0].toISOString() : '';

    if (sortedDates.length) {
      // Check if there's an entry for today
      const today = new Date();
      const hasEntryToday = sortedDates.some(date => isSameDay(date, today));

      // Start counting the current streak
      if (hasEntryToday) {
        currentStreak = 1;
        let previousDate = today;

        // Go through sorted dates (newest to oldest)
        for (let i = 0; i < sortedDates.length; i++) {
          const date = sortedDates[i];
          
          // Skip if this is today's date (already counted)
          if (i === 0 && hasEntryToday) continue;

          // If the date is the day before the previous date, increase streak
          const dateDiff = Math.floor((previousDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          if (dateDiff === 1) {
            currentStreak++;
            previousDate = date;
          } else {
            break;
          }
        }
      }

      // Calculate longest streak
      longestStreak = currentStreak;

      // Look for longer streaks in history
      let tempStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const dateDiff = Math.floor(
          (sortedDates[i - 1].getTime() - sortedDates[i].getTime()) / (1000 * 60 * 60 * 24)
        );

        if (dateDiff === 1) {
          tempStreak++;
        } else {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 1;
        }
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    // Set the calculated statistics
    setStatistics({
      totalEntries: filteredEntries.length,
      entriesThisWeek: filteredEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return entryDate >= weekAgo;
      }).length,
      entriesThisMonth: filteredEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return isSameMonth(entryDate, endDate);
      }).length,
      emotionDistribution: emotionCounts,
      entriesByPhase,
      mostUsedTags: sortedTags,
      streakData: {
        currentStreak,
        longestStreak,
        lastEntryDate
      }
    });
  }, [entries, timeRange, phases]);

  // Generate visualization for emotion distribution
  const renderEmotionVisualization = () => {
    if (!statistics) return null;

    const emotions = Object.entries(statistics.emotionDistribution)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    const totalEntries = emotions.reduce((sum, [_, count]) => sum + count, 0);

    return (
      <div className="emotion-visualization">
        <h3>Emotion Distribution</h3>
        <div className="emotion-bars">
          {emotions.map(([emotion, count]) => (
            <div key={emotion} className="emotion-bar-container">
              <div className="emotion-label">
                <span 
                  className={`emotion-dot emotion-${(emotion as Emotion).toLowerCase()}`}
                />
                <span>{emotion}</span>
              </div>
              <div className="emotion-bar-wrapper">
                <div 
                  className={`emotion-bar emotion-${(emotion as Emotion).toLowerCase()} emotion-bar-${Math.min(Math.floor((count / totalEntries) * 100), 100)}`}
                />
                <span className="emotion-count">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Generate visualization for entry frequency
  const renderFrequencyVisualization = () => {
    if (!statistics) return null;

    // Create a date range for the selected time period
    const endDate = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'quarter':
        startDate = subMonths(endDate, 3);
        break;
      case 'year':
        startDate = subMonths(endDate, 12);
        break;
      case 'month':
      default:
        startDate = subMonths(endDate, 1);
        break;
    }

    // Generate all days in the interval
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Create a map of dates to entry counts
    const entryCounts = days.map(day => {
      const count = entries.filter(entry => isSameDay(new Date(entry.date), day)).length;
      return {
        date: day,
        count
      };
    });

    // Determine the maximum count for scaling
    const maxCount = Math.max(...entryCounts.map(d => d.count), 1);

    return (
      <div className="frequency-visualization">
        <h3>Entry Frequency</h3>
        <div className="calendar-heatmap">
          {entryCounts.map((day, index) => (
            <div 
              key={index}
              className={`day-cell ${day.count > 0 ? `frequency-level-${Math.ceil(Math.min(day.count / maxCount, 1) * 5)}` : 'frequency-level-0'}`}
              title={`${format(day.date, 'MMM d, yyyy')}: ${day.count} entries`}
            />
          ))}
        </div>
        <div className="frequency-legend">
          <span>Less</span>
          <div className="legend-cells">
            <div className="legend-cell frequency-level-0" />
            <div className="legend-cell frequency-level-1" />
            <div className="legend-cell frequency-level-2" />
            <div className="legend-cell frequency-level-3" />
            <div className="legend-cell frequency-level-4" />
            <div className="legend-cell frequency-level-5" />
          </div>
          <span>More</span>
        </div>
      </div>
    );
  };

  // Generate visualization for entries by phase
  const renderPhaseVisualization = () => {
    if (!statistics) return null;

    return (
      <div className="phase-visualization">
        <h3>Entries by Phase</h3>
        <div className="phase-bars">
          {statistics.entriesByPhase.map(phase => (
            <div key={phase.phaseId} className="phase-bar-container">
              <div className="phase-label">
                <span>{phase.phaseName}</span>
              </div>
              <div className="phase-bar-wrapper">
                <div 
                  className={`phase-bar phase-bar-${Math.min((phase.count / Math.max(...statistics.entriesByPhase.map(p => p.count), 1)) * 100, 100)}`}
                />
                <span className="phase-count">{phase.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render streak information
  const renderStreakInfo = () => {
    if (!statistics) return null;

    return (
      <div className="streak-info">
        <div className="streak-card">
          <h4>Current Streak</h4>
          <div className="streak-value">{statistics.streakData.currentStreak}</div>
          <p className="streak-label">days</p>
        </div>
        <div className="streak-card">
          <h4>Longest Streak</h4>
          <div className="streak-value">{statistics.streakData.longestStreak}</div>
          <p className="streak-label">days</p>
        </div>
        <div className="streak-card">
          <h4>Total Entries</h4>
          <div className="streak-value">{statistics.totalEntries}</div>
        </div>
      </div>
    );
  };

  // Render popular tags
  const renderPopularTags = () => {
    if (!statistics || !statistics.mostUsedTags.length) return null;

    return (
      <div className="popular-tags">
        <h3>Most Used Tags</h3>
        <div className="tag-cloud">
          {statistics.mostUsedTags.map(tag => (
            <div 
              key={tag.tag} 
              className="tag-item"
              style={{ 
                fontSize: `${Math.min(1 + (tag.count / Math.max(...statistics.mostUsedTags.map(t => t.count))) * 0.5, 1.5)}rem` 
              }}
            >
              {tag.tag}
              <span className="tag-count">({tag.count})</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="journal-visualization" data-testid="journal-visualization">
      <div className="visualization-header">
        <h2>Journal Insights</h2>
        <div className="visualization-controls">
          <div className="visualization-selector">
            <button
              className={`visualization-btn ${selectedVisualization === 'emotions' ? 'active' : ''}`}
              onClick={() => setSelectedVisualization('emotions')}
            >
              Emotions
            </button>
            <button
              className={`visualization-btn ${selectedVisualization === 'frequency' ? 'active' : ''}`}
              onClick={() => setSelectedVisualization('frequency')}
            >
              Frequency
            </button>
            <button
              className={`visualization-btn ${selectedVisualization === 'phases' ? 'active' : ''}`}
              onClick={() => setSelectedVisualization('phases')}
            >
              Phases
            </button>
          </div>
          <div className="time-range-selector">
            <button
              className={`time-range-btn ${timeRange === 'month' ? 'active' : ''}`}
              onClick={() => setTimeRange('month')}
            >
              Month
            </button>
            <button
              className={`time-range-btn ${timeRange === 'quarter' ? 'active' : ''}`}
              onClick={() => setTimeRange('quarter')}
            >
              Quarter
            </button>
            <button
              className={`time-range-btn ${timeRange === 'year' ? 'active' : ''}`}
              onClick={() => setTimeRange('year')}
            >
              Year
            </button>
          </div>
        </div>
      </div>

      {!entries.length ? (
        <div className="no-data">
          <p>No journal entries found for the selected time period.</p>
          <p>Start journaling to see insights and visualizations.</p>
        </div>
      ) : (
        <div className="visualization-content">
          {renderStreakInfo()}
          
          <div className="main-visualization">
            {selectedVisualization === 'emotions' && renderEmotionVisualization()}
            {selectedVisualization === 'frequency' && renderFrequencyVisualization()}
            {selectedVisualization === 'phases' && renderPhaseVisualization()}
          </div>
          
          {renderPopularTags()}
        </div>
      )}

      <style jsx>{`
        .journal-visualization {
          width: 100%;
          padding: 1.5rem;
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .visualization-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .visualization-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .visualization-selector, .time-range-selector {
          display: flex;
          border-radius: 0.375rem;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .visualization-btn, .time-range-btn {
          padding: 0.5rem 1rem;
          background-color: white;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          color: #4b5563;
        }

        .visualization-btn:not(:last-child), .time-range-btn:not(:last-child) {
          border-right: 1px solid #e5e7eb;
        }

        .visualization-btn.active, .time-range-btn.active {
          background-color: #4f46e5;
          color: white;
        }

        .visualization-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .streak-info {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .streak-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
          background-color: #f9fafb;
          border-radius: 0.5rem;
          text-align: center;
        }

        .streak-value {
          font-size: 2rem;
          font-weight: 600;
          color: #4f46e5;
          margin: 0.5rem 0;
        }

        .streak-label {
          color: #6b7280;
          margin: 0;
          font-size: 0.875rem;
        }

        .main-visualization {
          padding: 1.5rem;
          background-color: #f9fafb;
          border-radius: 0.5rem;
        }

        .emotion-visualization, .phase-visualization {
          width: 100%;
        }

        .emotion-bars, .phase-bars {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .emotion-bar-container, .phase-bar-container {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .emotion-label, .phase-label {
          width: 100px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #4b5563;
        }

        .emotion-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .emotion-joyful {
          background-color: #fbbf24;
        }

        .emotion-optimistic {
          background-color: #a3e635;
        }

        .emotion-content {
          background-color: #34d399;
        }

        .emotion-neutral {
          background-color: #60a5fa;
        }

        .emotion-fatigued {
          background-color: #818cf8;
        }

        .emotion-anxious {
          background-color: #a78bfa;
        }

        .emotion-frustrated {
          background-color: #f472b6;
        }

        .emotion-discouraged {
          background-color: #fb7185;
        }

        .emotion-bar-wrapper, .phase-bar-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .emotion-bar {
          height: 1.5rem;
          min-width: 2px;
          border-radius: 0.25rem;
          transition: width 0.3s ease;
        }

        .emotion-joyful.emotion-bar {
          background-color: #fbbf24;
        }

        .emotion-optimistic.emotion-bar {
          background-color: #a3e635;
        }

        .emotion-content.emotion-bar {
          background-color: #34d399;
        }

        .emotion-neutral.emotion-bar {
          background-color: #60a5fa;
        }

        .emotion-fatigued.emotion-bar {
          background-color: #818cf8;
        }

        .emotion-anxious.emotion-bar {
          background-color: #a78bfa;
        }

        .emotion-frustrated.emotion-bar {
          background-color: #f472b6;
        }

        .emotion-discouraged.emotion-bar {
          background-color: #fb7185;
        }

        .emotion-bar-0 {
          width: 0%;
        }

        .emotion-bar-1 {
          width: 1%;
        }

        .emotion-bar-2 {
          width: 2%;
        }

        .emotion-bar-3 {
          width: 3%;
        }

        .emotion-bar-4 {
          width: 4%;
        }

        .emotion-bar-5 {
          width: 5%;
        }

        .emotion-bar-6 {
          width: 6%;
        }

        .emotion-bar-7 {
          width: 7%;
        }

        .emotion-bar-8 {
          width: 8%;
        }

        .emotion-bar-9 {
          width: 9%;
        }

        .emotion-bar-10 {
          width: 10%;
        }

        .emotion-bar-11 {
          width: 11%;
        }

        .emotion-bar-12 {
          width: 12%;
        }

        .emotion-bar-13 {
          width: 13%;
        }

        .emotion-bar-14 {
          width: 14%;
        }

        .emotion-bar-15 {
          width: 15%;
        }

        .emotion-bar-16 {
          width: 16%;
        }

        .emotion-bar-17 {
          width: 17%;
        }

        .emotion-bar-18 {
          width: 18%;
        }

        .emotion-bar-19 {
          width: 19%;
        }

        .emotion-bar-20 {
          width: 20%;
        }

        .emotion-bar-21 {
          width: 21%;
        }

        .emotion-bar-22 {
          width: 22%;
        }

        .emotion-bar-23 {
          width: 23%;
        }

        .emotion-bar-24 {
          width: 24%;
        }

        .emotion-bar-25 {
          width: 25%;
        }

        .emotion-bar-26 {
          width: 26%;
        }

        .emotion-bar-27 {
          width: 27%;
        }

        .emotion-bar-28 {
          width: 28%;
        }

        .emotion-bar-29 {
          width: 29%;
        }

        .emotion-bar-30 {
          width: 30%;
        }

        .emotion-bar-31 {
          width: 31%;
        }

        .emotion-bar-32 {
          width: 32%;
        }

        .emotion-bar-33 {
          width: 33%;
        }

        .emotion-bar-34 {
          width: 34%;
        }

        .emotion-bar-35 {
          width: 35%;
        }

        .emotion-bar-36 {
          width: 36%;
        }

        .emotion-bar-37 {
          width: 37%;
        }

        .emotion-bar-38 {
          width: 38%;
        }

        .emotion-bar-39 {
          width: 39%;
        }

        .emotion-bar-40 {
          width: 40%;
        }

        .emotion-bar-41 {
          width: 41%;
        }

        .emotion-bar-42 {
          width: 42%;
        }

        .emotion-bar-43 {
          width: 43%;
        }

        .emotion-bar-44 {
          width: 44%;
        }

        .emotion-bar-45 {
          width: 45%;
        }

        .emotion-bar-46 {
          width: 46%;
        }

        .emotion-bar-47 {
          width: 47%;
        }

        .emotion-bar-48 {
          width: 48%;
        }

        .emotion-bar-49 {
          width: 49%;
        }

        .emotion-bar-50 {
          width: 50%;
        }

        .emotion-bar-51 {
          width: 51%;
        }

        .emotion-bar-52 {
          width: 52%;
        }

        .emotion-bar-53 {
          width: 53%;
        }

        .emotion-bar-54 {
          width: 54%;
        }

        .emotion-bar-55 {
          width: 55%;
        }

        .emotion-bar-56 {
          width: 56%;
        }

        .emotion-bar-57 {
          width: 57%;
        }

        .emotion-bar-58 {
          width: 58%;
        }

        .emotion-bar-59 {
          width: 59%;
        }

        .emotion-bar-60 {
          width: 60%;
        }

        .emotion-bar-61 {
          width: 61%;
        }

        .emotion-bar-62 {
          width: 62%;
        }

        .emotion-bar-63 {
          width: 63%;
        }

        .emotion-bar-64 {
          width: 64%;
        }

        .emotion-bar-65 {
          width: 65%;
        }

        .emotion-bar-66 {
          width: 66%;
        }

        .emotion-bar-67 {
          width: 67%;
        }

        .emotion-bar-68 {
          width: 68%;
        }

        .emotion-bar-69 {
          width: 69%;
        }

        .emotion-bar-70 {
          width: 70%;
        }

        .emotion-bar-71 {
          width: 71%;
        }

        .emotion-bar-72 {
          width: 72%;
        }

        .emotion-bar-73 {
          width: 73%;
        }

        .emotion-bar-74 {
          width: 74%;
        }

        .emotion-bar-75 {
          width: 75%;
        }

        .emotion-bar-76 {
          width: 76%;
        }

        .emotion-bar-77 {
          width: 77%;
        }

        .emotion-bar-78 {
          width: 78%;
        }

        .emotion-bar-79 {
          width: 79%;
        }

        .emotion-bar-80 {
          width: 80%;
        }

        .emotion-bar-81 {
          width: 81%;
        }

        .emotion-bar-82 {
          width: 82%;
        }

        .emotion-bar-83 {
          width: 83%;
        }

        .emotion-bar-84 {
          width: 84%;
        }

        .emotion-bar-85 {
          width: 85%;
        }

        .emotion-bar-86 {
          width: 86%;
        }

        .emotion-bar-87 {
          width: 87%;
        }

        .emotion-bar-88 {
          width: 88%;
        }

        .emotion-bar-89 {
          width: 89%;
        }

        .emotion-bar-90 {
          width: 90%;
        }

        .emotion-bar-91 {
          width: 91%;
        }

        .emotion-bar-92 {
          width: 92%;
        }

        .emotion-bar-93 {
          width: 93%;
        }

        .emotion-bar-94 {
          width: 94%;
        }

        .emotion-bar-95 {
          width: 95%;
        }

        .emotion-bar-96 {
          width: 96%;
        }

        .emotion-bar-97 {
          width: 97%;
        }

        .emotion-bar-98 {
          width: 98%;
        }

        .emotion-bar-99 {
          width: 99%;
        }

        .emotion-bar-100 {
          width: 100%;
        }

        .emotion-count, .phase-count {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .frequency-visualization {
          width: 100%;
        }

        .calendar-heatmap {
          display: grid;
          grid-template-columns: repeat(auto-fill, 16px);
          gap: 2px;
          margin-top: 1rem;
        }

        .day-cell {
          width: 16px;
          height: 16px;
          border-radius: 2px;
        }

        .frequency-level-0 {
          background-color: #f3f4f6;
        }

        .frequency-level-1 {
          background-color: rgba(79, 70, 229, 0.2);
        }

        .frequency-level-2 {
          background-color: rgba(79, 70, 229, 0.4);
        }

        .frequency-level-3 {
          background-color: rgba(79, 70, 229, 0.6);
        }

        .frequency-level-4 {
          background-color: rgba(79, 70, 229, 0.8);
        }

        .frequency-level-5 {
          background-color: rgba(79, 70, 229, 1);
        }

        .frequency-legend {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .legend-cells {
          display: flex;
          gap: 2px;
        }

        .legend-cell {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .popular-tags {
          margin-top: 1.5rem;
        }

        .tag-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .tag-item {
          padding: 0.5rem 0.75rem;
          background-color: #f3f4f6;
          border-radius: 9999px;
          color: #4b5563;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .tag-count {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .no-data {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .visualization-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .streak-info {
            flex-direction: column;
          }

          .emotion-label, .phase-label {
            width: 80px;
          }
        }
      `}</style>
    </div>
  );
};

// Helper to map emotions to colors
const getEmotionColor = (emotion: Emotion): string => {
  const emotionColors: Record<Emotion, string> = {
    'joyful': '#fbbf24',
    'optimistic': '#a3e635',
    'content': '#34d399',
    'neutral': '#60a5fa',
    'fatigued': '#818cf8',
    'anxious': '#a78bfa',
    'frustrated': '#f472b6',
    'discouraged': '#fb7185'
  };
  
  return emotionColors[emotion] || '#9ca3af';
};

export default JournalVisualization;
