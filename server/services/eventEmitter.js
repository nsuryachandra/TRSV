import { EventEmitter } from 'events';

class AutomationEventHub extends EventEmitter {
  constructor() {
    super();
    this.on('error', (err) => {
      console.error('🚨 [Automation Event Hub] Uncaught event error:', err);
    });
  }

  // Helper to publish with log audit
  publish(event, data) {
    console.log(`🤖 [Automation Engine] Publishing event: "${event}"`, data);
    this.emit(event, data);
  }
}

const eventHub = new AutomationEventHub();
export default eventHub;
