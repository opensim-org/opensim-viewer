import { createContext, useContext } from "react"
import { ModelUIState } from "./ModelUIState"
// /builtin/gait10dof18musc.json
export const MyModelContext = createContext<ModelUIState>(new ModelUIState('/builtin/mt.json'))
export const useModelContext = () => useContext(MyModelContext)