import { createContext, useContext } from "react"
import { ModelUIState } from "./ModelUIState"

export const MyModelContext = createContext<ModelUIState>(new ModelUIState('/assets/gait10.json'))
export const useModelContext = () => useContext(MyModelContext)