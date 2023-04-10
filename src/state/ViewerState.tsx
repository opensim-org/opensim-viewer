import { makeObservable, observable, action } from 'mobx';

class ViewerState {
   rotating: boolean;

   constructor(rotatingState: boolean) {
      this.rotating = rotatingState;

      makeObservable(this, {
        rotating: observable,
        setRotating: action
      });
   }

   setRotating(newState: boolean){
    this.rotating =  newState;
   }
}

const viewerState = new ViewerState(true);

export default viewerState;