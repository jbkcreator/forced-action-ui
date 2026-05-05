import { Component } from 'react';
import ErrorState from './ErrorState';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error, info);
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      const message = this.state.error?.message || 'Something went wrong rendering this view.';
      return (
        <div role="alert" className="min-h-[60vh] flex flex-col items-center justify-center px-6">
          <ErrorState message={message} />
          <button
            type="button"
            onClick={this.reset}
            className="mt-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-900"
            style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
