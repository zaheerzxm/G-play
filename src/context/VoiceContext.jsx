import { createContext, useContext } from "react";

export const VoiceContext = createContext(null);

export function useVoice() {
  return useContext(VoiceContext);
}
