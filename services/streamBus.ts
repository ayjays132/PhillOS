// Simple message structure for inter-app streaming
export interface StreamMessage<T = unknown> {
  /** sender identifier */
  from: string;
  /** target application */
  to: string;
  /** raw payload */
  payload: T;
}

class StreamBus extends EventTarget {
  /** deliver a message to listeners */
  publish(msg: StreamMessage) {
    this.dispatchEvent(new CustomEvent(msg.to, { detail: msg }));
  }

  /** subscribe to messages for a given target */
  subscribe(target: string, handler: (msg: StreamMessage) => void) {
    const listener = (e: Event) => {
      handler((e as CustomEvent<StreamMessage>).detail);
    };
    this.addEventListener(target, listener);
    return () => this.removeEventListener(target, listener);
  }
}

export const streamBus = new StreamBus();
