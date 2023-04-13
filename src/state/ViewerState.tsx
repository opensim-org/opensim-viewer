import { makeObservable, observable, action } from 'mobx';

class ViewerState {
   rotating: boolean;
   zooming: boolean;
   zoomFactor: number;
   constructor(rotatingState: boolean) {
      this.rotating = rotatingState;
      this.zooming =  false;
      this.zoomFactor = 1.1;

      makeObservable(this, {
        rotating: observable,
        zooming: observable,
        setRotating: action,
        setZooming: action
      });
   }

   setRotating(newState: boolean){
    this.rotating =  newState;
   }

   setZooming(newFactor: number){
      this.zoomFactor = newFactor;
      this.zooming = true;
   }
}

const viewerState = new ViewerState(true);

export default viewerState;