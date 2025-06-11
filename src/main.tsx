import React from 'react'
import ReactDOM from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import { Authenticator } from '@aws-amplify/ui-react'
import outputs from '../amplify_outputs.json'
import BasketballReviewApp from './BasketballReviewApp.tsx'
import './index.css'
import '@aws-amplify/ui-react/styles.css'

// Configure Amplify
Amplify.configure(outputs)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Authenticator>
      <BasketballReviewApp />
    </Authenticator>
  </React.StrictMode>,
) 