import { Influence } from './Influence';

export interface ActionResult {
  success: boolean;
  message: string;
  stateChanged: boolean;
  peekedInfluence?: Influence;
}
