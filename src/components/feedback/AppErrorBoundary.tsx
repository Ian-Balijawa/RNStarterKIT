import React from 'react';
import { AppErrorState } from './AppStates';
type Props = { children: React.ReactNode };
type State = { failed: boolean };
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State {
    return { failed: true };
  }
  reset = () => this.setState({ failed: false });
  render() {
    return this.state.failed ? (
      <AppErrorState
        title="The app hit an error"
        message="Please try again."
        onRetry={this.reset}
      />
    ) : (
      this.props.children
    );
  }
}
