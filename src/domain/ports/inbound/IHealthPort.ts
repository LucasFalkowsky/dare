export interface IHealthPort {
  getSystemStatus(): { status: string; timestamp: string };
}
