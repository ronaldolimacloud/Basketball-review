import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import BasketballReviewApp from './BasketballReviewApp';
import { PublicPlayerPortal } from './components/PlayerPortal/PublicPlayerPortal';

/**
 * Main App component that handles routing between:
 * - Public Player Portal (no authentication required)
 * - Coach Dashboard (authentication required)
 */
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Player Portal Route - No authentication required */}
        <Route path="/player-portal" element={<PublicPlayerPortal />} />
        
        {/* Coach Dashboard Route - Authentication required */}
        <Route 
          path="/*" 
          element={
            <Authenticator>
              <BasketballReviewApp />
            </Authenticator>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;