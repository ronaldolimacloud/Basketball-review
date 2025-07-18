import React, { useState } from 'react';
import BasketballReviewApp from './BasketballReviewApp';
import LandingPage from './components/LandingPage';

/**
 * Main App component - Basketball Review Dashboard
 * Shows landing page first, then navigates to the main app
 */
const App: React.FC = () => {
  const [showLandingPage, setShowLandingPage] = useState(true);

  const handleEnterApp = () => {
    setShowLandingPage(false);
  };

  const handleBackToLanding = () => {
    setShowLandingPage(true);
  };

  if (showLandingPage) {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  return (
    <div className="relative">
      <BasketballReviewApp />
      {/* Back to Landing Button - optional */}
      <button
        onClick={handleBackToLanding}
        className="fixed bottom-6 left-6 p-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full shadow-lg transition-all duration-200 z-50 opacity-60 hover:opacity-100"
        title="Back to Landing"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
    </div>
  );
};

export default App;