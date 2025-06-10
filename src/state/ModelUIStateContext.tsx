import { createContext, useContext } from "react"
import { ModelUIState } from "./ModelUIState"

export const MyModelContext = createContext<ModelUIState>(new ModelUIState('/builtin/leg39.json', false))
export const useModelContext = () => useContext(MyModelContext)