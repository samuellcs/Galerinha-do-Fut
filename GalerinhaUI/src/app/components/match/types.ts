export type MatchStatus = 'open' | 'active' | 'finished';

export type PlayerPosition = 'GK' | 'ZG' | 'LD' | 'LE' | 'VOL' | 'MC' | 'ME' | 'MD' | 'AT';

export type PlayerConfirmation = 'confirmed' | 'pending';

export interface MatchPlayer {
  id: number;
  name: string;
  nickname: string;
  displayName: string;
  skillLevel: number;
  skillDisplay: string;
  avatar: string;
  position?: PlayerPosition;
  status: PlayerConfirmation;
}

export interface MatchInfo {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  status: MatchStatus;
}

export interface DrawnTeam {
  name: string;
  players: MatchPlayer[];
}
