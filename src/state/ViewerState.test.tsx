import viewerState from './ViewerState'
it('check default ViewerState', () => {
  const state = viewerState // Import state instance

  expect(state.rotating).toBe(true)
  state.setRotating(false)
  expect(state.rotating).toBe(false)
})
