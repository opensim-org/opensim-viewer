import { createContext, useContext } from "react"
import { ModelUIState } from "./ModelUIState"
// /builtin/rajagopal.json
export const MyModelContext = createContext<ModelUIState>(new ModelUIState('mt.json'))
export const useModelContext = () => useContext(MyModelContext)