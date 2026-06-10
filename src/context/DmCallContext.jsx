import { createContext, useContext } from "react";

export const DmCallContext = createContext(null);

export function useDmCall() {
  return useContext(DmCallContext);
}
