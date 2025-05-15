import { makeObservable, observable, action } from 'mobx'

class TextureState {
  skyTexturePath: string = ''
  floorTexturePath: string = ''

  constructor() {
    makeObservable(this, {
      skyTexturePath: observable,
      floorTexturePath: observable,
      setSkyTexturePath: action,
      setFloorTexturePath: action,
    })
  }

  setSkyTexturePath(path: string) {
    this.skyTexturePath = path
  }

  setFloorTexturePath(path: string) {
    this.floorTexturePath = path
  }

  async loadFromJson(jsonPath: string) {
    try {
      const response = await fetch(jsonPath)
      if (!response.ok) throw new Error('Failed to load texture config JSON')
      const data = await response.json()
      this.setSkyTexturePath(data['sky-texture-path'])
      this.setFloorTexturePath(data['floor-texture-path'])
    } catch (error) {
      console.error('Error loading textures from JSON:', error)
    }
  }
}

export default TextureState
