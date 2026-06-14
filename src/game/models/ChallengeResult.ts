export interface ChallengeResult {
  success: boolean;            // Whether the challenge itself was "resolved"
  challengedPlayerWon: boolean; // True if player HAD the card, False if they were bluffing
  lostInfluencePlayerId: string;
}
