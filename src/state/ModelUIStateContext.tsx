import { createContext, useContext } from "react"
import { ModelUIState } from "./ModelUIState"

export const MyModelContext = createContext<ModelUIState>(new ModelUIState('/builtin/gait10dof18musc.json'))
export const useModelContext = () => useContext(MyModelContext)