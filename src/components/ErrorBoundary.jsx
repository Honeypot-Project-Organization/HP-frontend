import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="m-6 border border-threat/60 p-4 font-mono text-sm">
          <div className="text-threat">UI crashed: {String(this.state.error.message || this.state.error)}</div>
          <button className="btn mt-3" onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
