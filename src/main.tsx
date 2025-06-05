import React from 'react'
import ReactDOM from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import outputs from '../amplify_outputs.json'
import BasketballReviewApp from './BasketballReviewApp.tsx'
import './index.css'

// Configure Amplify
Amplify.configure(outputs)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BasketballReviewApp />
  </React.StrictMode>,
) 