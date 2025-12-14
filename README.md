# LifeChecker — Health Insights App

A native mobile app (iOS/Android) that uses daily signal reports to give risk insights across different health domains.

## Features

### 🏠 Dashboard
- Overall wellbeing score with animated progress
- Health domain cards with scores and trends
- Quick check-in button with streak tracking
- Recent insights preview

### ✅ Daily Check-In
- **Adaptive Question Selection**: Prioritizes high-variance or recently changed signals
- **Smart Confirmations**: Stable signals get "same as usual" prompts to reduce friction
- **Domain Diversity**: Ensures coverage across all health areas
- **Haptic Feedback**: Native feel with tactile responses

### 💡 Insights
- Template-based insight generation
- Decline alerts (sleep, mental, movement, nutrition)
- Progress celebrations
- Consistency milestones (7-day, 14-day streaks)
- Mark as read / dismiss functionality

### 📊 Weekly Summary
- Check-in streak statistics
- Overall change percentage
- Domain trend mini-charts
- Per-domain signal breakdown

## Health Domains

| Domain | Signals | Weight |
|--------|---------|--------|
| 🌙 **Sleep** | Quality, Duration, Falling Asleep | 1.2x |
| 🧠 **Mental** | Mood, Stress, Clarity | 1.3x |
| ⚡ **Energy** | Morning, Afternoon levels | 1.1x |
| 🥗 **Nutrition** | Meal Quality, Hydration | 1.0x |
| 🏃 **Movement** | Activity, Movement Breaks | 1.0x |
| 💬 **Social** | Connection, Quality Time | 0.8x |

## Getting Started

### Prerequisites
- Node.js 18+
- Expo Go app on your phone (iOS/Android)
- OR Xcode (for iOS simulator) / Android Studio (for Android emulator)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running the App

1. **On your phone**: Scan the QR code with Expo Go (Android) or Camera app (iOS)
2. **iOS Simulator**: Press `i` in the terminal
3. **Android Emulator**: Press `a` in the terminal
4. **Web**: Press `w` in the terminal

## Architecture

```
/app
  _layout.tsx       # Root layout
  checkin.tsx       # Check-in flow (fullscreen modal)
  /(tabs)
    _layout.tsx     # Tab navigation
    index.tsx       # Dashboard/Home
    insights.tsx    # Insights list
    summary.tsx     # Weekly summary

/src
  /components       # Reusable UI components (future)
  /store
    data.ts         # Static domains, signals, questions, templates
    storage.ts      # AsyncStorage persistence layer
    questionSelector.ts  # Adaptive question selection
  /types
    index.ts        # TypeScript interfaces
  /utils
    theme.ts        # Colors, typography, spacing
```

## How It Works

### Adaptive Question Selection
1. Gets all primary questions not asked today
2. Calculates priority based on:
   - Signal variance (higher = more priority)
   - Days since last asked
   - Deviation from baseline
   - Domain weight
3. Reduces priority for stable signals (uses confirmations)
4. Ensures domain diversity in selection

### Signal Aggregation
- 7-day rolling averages
- Variance and consistency scores
- 30-day baseline comparison
- Domain-level weighted summaries

### Insight Generation
Checks templates against patterns:
- **Decline**: Score dropped > threshold over N days
- **Improvement**: Score rose > threshold over N days
- **Consistency**: Check-in streak milestones
- **Milestone**: Total tracking duration

## Design

- **Dark theme** with deep indigo/purple background
- **Domain-specific colors** for visual organization
- **Smooth animations** via Reanimated
- **Haptic feedback** for native feel
- **Tab navigation** with custom icons

## Tech Stack

- **Framework**: React Native + Expo (SDK 52)
- **Navigation**: Expo Router
- **Storage**: AsyncStorage
- **Animations**: React Native Reanimated
- **Styling**: StyleSheet (native)
- **Haptics**: expo-haptics
- **Date handling**: date-fns

## Design Principles

1. **Personal Baseline**: Compares to your own history, not population norms
2. **No Diagnostic Claims**: Describes patterns without medical interpretation
3. **Low Friction**: Adaptive questions + confirmations reduce daily burden
4. **Neutral Language**: Non-alarmist insight messaging
5. **Progress-Positive**: Celebrates stability and improvement

## License

MIT
