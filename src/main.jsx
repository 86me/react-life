import * as React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    console.log(
      error,
      info.componentStack,
      React.captureOwnerStack(),
    );
  }

  render() {
    if(this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
const root = createRoot(document.getElementById('root'));
root.render(<ErrorBoundary fallback={<p>Something went wrong</p>}><App /></ErrorBoundary>);
