import { createContext, useContext } from "react"
import { ModelUIState } from "./ModelUIState"

export const MyModelContext = createContext<ModelUIState>(new ModelUIState(''))
export const useModelContext = () => useContext(MyModelContext)