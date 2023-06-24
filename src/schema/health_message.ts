/** @format */

export interface HealthMessage {
  type: 'health';
  health: number;
  tempHealth: number;
  characterId: string;
}
