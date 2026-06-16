import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-slate-950">
          <div className="max-w-xl rounded-3xl border border-red-200 bg-white/90 p-8 shadow-xl dark:border-red-900 dark:bg-slate-900">
            <h1 className="text-2xl font-semibold text-red-700 dark:text-red-300">Une erreur est survenue</h1>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              Le composant a rencontré un problème et a été arrêté. Rechargez la page ou contactez le support si le problème persiste.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-full bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Recharger
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
