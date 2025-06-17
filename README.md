# Basketball Review Application

A comprehensive basketball game review and statistics tracking application built with React, TypeScript, and Tailwind CSS.

![Basketball Review App](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=flat-square&logo=tailwind-css)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite)

## 🏀 Features

### 📹 Video Analysis
- **Video Upload & Playback**: Upload game footage and control playback with custom video player
- **Seek Controls**: Skip forward/backward 10 seconds, play/pause functionality
- **Timeline Scrubbing**: Click anywhere on the timeline to jump to specific moments

### 📊 Game Management
- **Game Clock**: Start/stop game timer with automatic player time tracking
- **Period Management**: Support for both quarters (NBA/High School) and halves (College) formats
- **Score Tracking**: Real-time score updates for both teams
- **Timeout Tracking**: Record timeouts used by each team

### 👥 Player Statistics
- **Comprehensive Stats**: Track points, rebounds, assists, steals, blocks, turnovers, fouls
- **Shooting Statistics**: Field goal and free throw percentages
- **Plus/Minus Tracking**: Automatic calculation based on scoring while player is on court
- **Playing Time**: Accurate minute tracking for each player
- **Player Substitutions**: Easy substitution system with time tracking

### 📈 Advanced Features
- **Box Score**: Complete statistical breakdown in traditional basketball format
- **Period Breakdown**: Quarter-by-quarter or half-by-half scoring summary
- **Editable Player Names**: Click to edit player names during the game
- **Team Foul Tracking**: Monitor team fouls for bonus situations

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ronaldolimacloud/Basketball-review.git
   cd Basketball-review
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

## 🎮 How to Use

### Initial Setup
1. **Team Names**: Enter your team name and opponent team name
2. **Game Format**: Choose between 4 quarters or 2 halves
3. **Start Review**: Click "Start Game Review" to begin

### During Game Review
1. **Upload Video**: Click "Upload Video" to add game footage
2. **Select Players**: Click on players in the "On Court" section to select them for stat recording
3. **Record Stats**: Use the stat buttons to record player actions (points, rebounds, etc.)
4. **Manage Game Clock**: Start/stop the game clock as needed
5. **Track Score**: Use opponent scoring buttons or record player points
6. **Make Substitutions**: Click "Sub In" for bench players to initiate substitutions

### Video Controls
- **Play/Pause**: Control video playback
- **Skip**: Jump forward or backward 10 seconds
- **Seek**: Click on timeline to jump to specific time
- **Sync**: Use video controls while recording stats for precise game review

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite 6
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useRef, useEffect)

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## 🎯 Use Cases

- **Coach Analysis**: Review game footage with detailed statistics
- **Player Development**: Track individual player performance
- **Team Strategy**: Analyze team performance by periods
- **Statistical Analysis**: Generate comprehensive box scores
- **Game Recording**: Live game stat tracking during actual games

## 🔧 Project Structure

```
src/
├── BasketballReviewApp.tsx    # Main application component
├── main.tsx                   # React entry point
├── index.css                  # Tailwind CSS imports
└── vite-env.d.ts             # TypeScript environment definitions
```

## 📊 Statistics Tracked

### Player Statistics
- **Points**: 1-point (FT), 2-point, and 3-point scoring
- **Field Goals**: Made/Attempted with percentage calculation
- **Free Throws**: Made/Attempted with percentage calculation
- **Rebounds**: Offensive and Defensive rebounds
- **Assists**: Assist tracking
- **Steals**: Steal tracking
- **Blocks**: Block tracking
- **Turnovers**: Turnover tracking
- **Fouls**: Personal foul tracking
- **Plus/Minus**: Point differential while player is on court
- **Minutes**: Playing time tracking

### Team Statistics
- **Score**: Real-time score tracking
- **Team Fouls**: Cumulative team foul tracking
- **Timeouts**: Timeout usage tracking
- **Period Scores**: Quarter/Half breakdown

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👏 Acknowledgments

- Built with modern React and TypeScript best practices
- Styled with Tailwind CSS for rapid UI development
- Icons provided by Lucide React
- Video playback capabilities using HTML5 video APIs

## 🚀 Future Enhancements

- [ ] Data export functionality (CSV, JSON)
- [ ] Game save/load functionality
- [ ] Advanced analytics and charts
- [ ] Team comparison features
- [ ] Player performance trends
- [ ] Shot chart integration
- [ ] Multiple game session tracking

---

**Built with ❤️ for basketball enthusiasts and coaches** 