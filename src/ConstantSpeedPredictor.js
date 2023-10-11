/**
 *
 * Author: Gery Casiez
 *
 */

export class ConstantSpeedPredictor {
  constructor() {
  	this.lag = 50.0/1000.0;
  	this.first = true;
  }

  reset() {
  	this.first = true;
  }

  setAmountOfCompensation(amount) {
    this.lag = amount/1000.0;
  }

  predict(p) {
  	if (this.first == false) {
  		var timeDiff = (p.t - this.pprev.t)/1E9;
	  	var pred = {x: p.x + this.lag * (p.x - this.pprev.x)/timeDiff,
	  				y: p.y + this.lag * (p.y - this.pprev.y)/timeDiff
	  			};
	  	this.pprev = p;
	  	return pred;  	
	}
	this.pprev = p;
  	this.first = false;
  	return p;
  } 

}