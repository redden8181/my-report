import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  handleReset = () => {
    localStorage.removeItem('otchet_app_data');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: '-apple-system, sans-serif',
          background: '#f2f2f7',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '360px',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1c1c1e', marginBottom: '8px' }}>
              Произошла ошибка
            </h2>
            <p style={{ fontSize: '14px', color: '#8e8e93', marginBottom: '20px', lineHeight: 1.5 }}>
              {this.state.error || 'Неизвестная ошибка'}
            </p>
            <button
              onClick={this.handleReset}
              style={{
                background: '#ff2d55',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 28px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Сбросить и перезагрузить
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
