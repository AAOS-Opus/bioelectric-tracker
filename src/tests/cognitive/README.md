# MaestroDeck Chaos Testing Framework

This framework provides tools for testing the resilience of the MaestroDeck system under various failure conditions. It allows for controlled injection of failures, monitoring of system behavior, and analysis of recovery mechanisms.

## Overview

The chaos testing framework consists of several components:

- **Chaos Test Harness**: Injects controlled failures into the system
- **UX Impact Tracking**: Monitors and analyzes the impact of failures on user experience
- **Telemetry Collection**: Collects and analyzes system metrics during chaos testing
- **Load Scenario Simulation**: Simulates resource constraints and load conditions
- **Real-time Dashboard**: Provides a visual interface for monitoring chaos tests

## Directory Structure

```
src/tests/cognitive/
├── debug/
│   ├── dashboard.ts         # Real-time dashboard for monitoring chaos tests
│   ├── analyze-performance.ts # Analyzes performance and generates resilience score
│   ├── visualize-recovery-paths.ts # Generates graph visualizations
│   └── run-debug-mode.ts    # Runs all debug tools and generates reports
├── helpers/
│   ├── chaos-telemetry-integration.ts  # Telemetry collection and analysis
│   ├── load-scenario.ts     # Resource constraint simulation
│   └── ux-impact-tracking.ts # UX impact monitoring and analysis
├── integration/
│   └── load-and-chaos.ts    # Combined load and chaos testing
├── mocks/
│   └── mock-services.ts     # Mock services for testing (auto-generated)
├── resilience/
│   └── ChaosTestHarness.ts  # Core chaos testing framework
├── scripts/
│   ├── prepare-chaos-environment.ts  # Environment setup script
│   ├── run-chaos-testing.ts # Main chaos testing script
│   └── validate-chaos-suite.ts # Validates the chaos testing suite
└── types/
    └── chaos.ts             # Type definitions for chaos testing
```

## Getting Started

### Prerequisites

- Node.js 14+
- TypeScript 4.5+
- Required dependencies (installed automatically by the setup script)

### Setup

1. Run the environment preparation script:

```bash
npx ts-node src/tests/cognitive/scripts/prepare-chaos-environment.ts
```

This script will:
- Create necessary directories
- Install required dependencies
- Set up logging
- Initialize mock services

### Running Chaos Tests

Run the chaos testing script:

```bash
npx ts-node src/tests/cognitive/scripts/run-chaos-testing.ts
```

This will:
1. Start the telemetry collection
2. Run through various chaos testing phases:
   - Individual failure mode testing
   - Concurrent failure testing
   - Resource constraint testing
   - Recovery path validation
3. Generate reports in the `logs/chaos` directory

### Monitoring Tests

Start the real-time dashboard:

```bash
npx ts-node src/tests/cognitive/debug/dashboard.ts
```

Then open a browser and navigate to:
```
http://localhost:3030
```

## Chaos Testing Phases

### Phase 1: Individual Failure Modes

Tests each failure mode individually to establish baseline recovery behavior.

### Phase 2: Concurrent Failures

Tests combinations of failures to identify potential cascading failures and recovery conflicts.

### Phase 3: Resource Constraints

Tests system behavior under resource constraints (CPU, memory, network, disk).

### Phase 4: Recovery Path Validation

Validates the effectiveness of defined recovery paths.

## Reports

After running chaos tests, several reports are generated in the `logs/chaos` directory:

- `summary-report.json`: Overall summary of the chaos testing results
- `ux-impact-report.json`: Detailed analysis of UX impacts
- `telemetry-report.json`: Analysis of system metrics during testing
- `timeline-visualization.json`: Timeline of events for visualization
- `anomalies.json`: Detected anomalies in system metrics
- `recommendations.json`: Recommendations for improving system resilience
- `resilience-report.md`: Comprehensive markdown report with resilience score
- `cascade-map.json`: Map of failure cascades and dependencies

## Customizing Tests

### Adding New Failure Types

Add new failure types to the `FAILURE_TYPES` object in `types/chaos.ts`.

### Defining Recovery Paths

Recovery paths are defined in `docs/recovery-paths.json`. The format is:

```json
[
  {
    "component": "Database",
    "primary": "Connection Pool Reset",
    "secondary": "Replica Failover",
    "fallback": "Read-Only Mode",
    "recoveryTime": 5000
  },
  ...
]
```

### Customizing Resource Constraints

Modify the resource constraint configurations in `run-chaos-testing.ts` to test different scenarios.

## Architecture

### Chaos Test Harness

The core component that injects failures into the system. It supports:

- Automatic failure injection based on configured failure rate
- Manual failure injection for specific testing
- Controlled recovery from failures
- Event emission for monitoring

### UX Impact Tracking

Monitors the impact of failures on user experience:

- Records UX impacts with severity levels
- Calculates recovery times
- Generates recommendations for improving resilience

### Telemetry Collection

Collects and analyzes system metrics during chaos testing:

- Supports multiple metric sources
- Detects anomalies in metrics
- Correlates metrics with chaos events
- Generates visualizations and reports

### Load Scenario Simulation

Simulates resource constraints:

- CPU load simulation
- Memory pressure simulation
- Network constraint simulation
- Disk constraint simulation

### Real-time Dashboard

Provides a visual interface for monitoring chaos tests:

- Real-time updates via WebSockets
- Visualization of active chaos events
- Monitoring of system metrics
- Timeline of events and impacts

## Best Practices

1. **Start Small**: Begin with individual failure modes before testing concurrent failures
2. **Monitor Closely**: Use the real-time dashboard to monitor system behavior
3. **Analyze Reports**: Review the generated reports to identify areas for improvement
4. **Iterate**: Use the recommendations to improve system resilience and run tests again
5. **Document Findings**: Document unexpected behaviors and recovery mechanisms

## Troubleshooting

### Dashboard Not Connecting

- Ensure the dashboard server is running
- Check for console errors in the browser
- Verify that WebSocket connections are allowed by your network

### Tests Not Running

- Check for errors in the console output
- Verify that all dependencies are installed
- Ensure the environment preparation script has been run

### Mock Services Not Working

- Check the mock services file in `mocks/mock-services.ts`
- Verify that the global event emitter is initialized
- Check for errors in the console output

## Snapshot and Checkpoint

After completing the chaos testing framework implementation, it's important to create a snapshot to mark this milestone. This ensures you can always return to a known good state if needed.

```bash
# Commit the chaos testing framework
git add .
git commit -m "✅ Complete Chaos Testing Framework (Prompt 11.2B)"
```

## Running Tests

To validate the chaos testing framework:

```bash
# Run all cognitive tests
npm test -- --testPathPattern=cognitive

# Run specific chaos tests
npm test -- --testPathPattern=cognitive/resilience
```

## CI/CD Integration

The chaos testing framework is integrated into the CI/CD pipeline. Tests are automatically run on pushes to the main branch or any branch matching the pattern `resilience/*`.

### Status Badge

![Chaos Testing Status](https://img.shields.io/github/workflow/status/maestrodeck/resilience/chaos-testing?label=Chaos%20Testing&style=for-the-badge)

## Resilience Score

The framework calculates a composite resilience score based on:
- Recovery success rate (40%)
- UX impact severity (30%)
- Performance benchmark pass rate (30%)

The score is categorized as:
- 💎 Platinum (Score ≥ 90)
- 🟩 Strong (80–89)
- 🟨 Stable (70–79)
- 🟥 Needs Work (< 70)

## Historical Benchmarking

The framework maintains historical benchmarking data in `logs/chaos/chaos-history.json`, allowing you to track resilience improvements over time.

## Command Reference

```bash
# Run chaos tests
npx ts-node src/tests/cognitive/scripts/run-chaos-testing.ts

# Analyze performance
npx ts-node src/tests/cognitive/debug/analyze-performance.ts

# Generate final report
npx ts-node src/tests/cognitive/debug/run-debug-mode.ts

# Combined load + chaos testing
npx ts-node src/tests/cognitive/integration/load-and-chaos.ts

# Validate chaos testing suite
npx ts-node src/tests/cognitive/scripts/validate-chaos-suite.ts

# Generate visualization of recovery paths
npx ts-node src/tests/cognitive/debug/visualize-recovery-paths.ts

# Update architecture documentation
npx ts-node src/tests/cognitive/docs/update-architecture-docs.ts
```

## Combined Load + Chaos Testing

For the ultimate test of system resilience, run combined load and chaos testing:

```bash
npx ts-node src/tests/cognitive/integration/load-and-chaos.ts
```

This will simulate high traffic conditions while injecting random failures, providing the most realistic test of system resilience.