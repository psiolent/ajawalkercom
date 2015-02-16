/// <reference path="fullcanvas.ts" />

module Grow {

	/**
	 * A factor to multiply by interval before using in calculations.
	 * @type {number}
	 */
	var intervalFactor:number = 1 / 30;

	/**
	 * Controls the rate at which sticks and fruit wither away.
	 * @type {number}
	 */
	var witherRate:number = 0.00001;

	/**
	 * The final length of a withered stick.
	 * @type {number}
	 */
	var witherLength:number = 4;

	/**
	 * The final angle (positive or negative) of a withered stick.
	 * @type {number}
	 */
	var stickWitherAngle:number = Math.PI / 3;

	/**
	 * The probability of multiple branches occurring at a branch point. This
	 * probability will decrease to zero a the maximum stick depth is approached.
	 * @type {number}
	 */
	var branchProbability:number = 0.07;

	/**
	 * The maximum depth of sticks on a branch before fruiting.
	 * @type {number}
	 */
	var maxStickDepth:number = 100;

	/**
	 * The amount of randomization to do in the randomize() function.
	 * @type {number}
	 */
	var randomizeFactor:number = 0.05;

	/**
	 * Randomize a number by scaling up or down by randomize factor.
	 * @param n the number to randomize
	 * @returns {number} the randomized number
	 */
	function r(n:number):number {
		return n * (Math.random() * 2 * randomizeFactor + 1 - randomizeFactor);
	}

	/**
	 * Normalize an angle (in radians) to between 0 and 2 Pi.
	 * @param angle the angle to normalize
	 * @returns {number} the normalized angle
	 */
	function normalizeAngle(angle:number):number {
		while (angle < 0) {
			angle += 2 * Math.PI;
		}
		while (angle >= 2 * Math.PI) {
			angle -= 2 * Math.PI;
		}
		return angle;
	}

	interface Branch {
		grow(interval:number, stack:Array<Branch>):void;
		draw(ctx:CanvasRenderingContext2D, width:number, height:number, startx:number, starty:number, refAngle:number, stack:Array<Branch>);
	}

	class Stick implements Branch {
		private _branches:Array<Branch> = [];
		private _length:number = 0;
		private _angle:number = 0;
		private _leafiness:number = 1;
		private _targetLength:number;
		private _targetAngle:number;
		private _growthRate: number;
		private _depth:number;
		private _witherAngle:number;

		constructor(targetLength:number, targetAngle: number, growthRate: number, depth: number) {
			this._targetLength = r(targetLength);
			this._targetAngle = r(targetAngle);
			this._growthRate = r(growthRate);
			this._depth = depth;
			this._witherAngle = targetAngle > 0 ? stickWitherAngle : -stickWitherAngle;
		}

		grow(interval:number, stack:Array<Branch>) {
			interval *= intervalFactor;
			if (this._branches.length === 0) {
				this._length += (this._targetLength - this._length) * this._growthRate * interval;
				this._angle += (this._targetAngle - this._angle) * this._growthRate * interval;
			} else {
				this._length += (witherLength - this._length) * witherRate * interval;
				this._angle += (this._witherAngle - this._angle) * witherRate * interval;
			}
			if (this._branches.length === 0 && Math.pow((this._length / this._targetLength), 2) > Math.random()) {
				if (this._depth < maxStickDepth) {
					while ((this._branches.length === 0 || Math.random() > (1 - branchProbability) + (branchProbability * (this._depth / maxStickDepth)))) {
						this._branches.push(new Stick(
							this._targetLength,
							this._targetAngle,
							this._growthRate,
							this._depth + 1));
					}
				} else {
					this._branches.push(new Fruit(this._growthRate));
				}
			}
			if (this._branches.length > 0) {
				this._leafiness *= (1 - 0.01 * interval);
			}
			this._branches.forEach(function(branch) {
				stack.push(branch);
			});
		}

		this.draw = function(ctx, width, height, startx, starty, refAngle, stack) {
			var drawAngle = normalizeAngle(refAngle + angle);
			var endx = startx + Math.cos(drawAngle) * length;
			var endy = starty + Math.sin(drawAngle) * length;
			ctx.beginPath();
			ctx.moveTo(startx, height - starty);
			ctx.lineTo(endx, height - endy);
			ctx.strokeStyle = "rgb(0," + parseInt(leafiness * 200) + ",0)";
			ctx.stroke();
			branches.forEach(function(branch) {
				stack.push({
					branch: branch,
					x: endx,
					y: endy,
					angle: drawAngle
				});
			});
		};
	};

	export class Client implements FullCanvas.Client {
		init(width:number, height:number) {
			// TODO
		}

		update(interval:number, width:number, height:number, mouse:FullCanvas.MouseState) {
			// TODO
		}

		draw(ctx:CanvasRenderingContext2D, width:number, height:number, mouse:FullCanvas.MouseState) {
			// TODO
		}
	}

}


var Stick = function(targetLength, targetAngle, growthRate, depth) {
    var branches = [];
    var length = 0;
    var angle = 0;
    var leafiness = 1;

    targetLength = r(targetLength);
    targetAngle = r(targetAngle);
    growthRate = r(growthRate);

    var witherLength = 4;
    var witherAngle = targetAngle > 0 ? Math.PI / 3 : -Math.PI / 3;

    this.grow = function(interval, stack) {
        interval = interval / 30;
        if (branches.length === 0) {
            length += (targetLength - length) * growthRate * interval;
            angle += (targetAngle - angle) * growthRate * interval;
        } else {
            length += (witherLength - length) * witherRate * interval;
            angle += (witherAngle - angle) * witherRate * interval;
        }
        if (branches.length === 0 && Math.pow((length / targetLength), 2) > Math.random()) {
            if (depth < 100) {
                while ((branches.length === 0 || Math.random() > 0.93 + 0.07 * (depth / 100))) {
                    branches.push(new Stick(
                        targetLength,
                        Math.random() * 0.2 - 0.1,
                        growthRate,
                        depth + 1));
                }
            } else {
                branches.push(new Fruit(growthRate));
            }
        }
        if (branches.length > 0) {
            leafiness *= (1 - 0.01 * interval);
        }
        branches.forEach(function(branch) {
            stack.push(branch);
        });
    };

    this.draw = function(ctx, width, height, startx, starty, refAngle, stack) {
        var drawAngle = normalizeAngle(refAngle + angle);
        var endx = startx + Math.cos(drawAngle) * length;
        var endy = starty + Math.sin(drawAngle) * length;
        ctx.beginPath();
        ctx.moveTo(startx, height - starty);
        ctx.lineTo(endx, height - endy);
        ctx.strokeStyle = "rgb(0," + parseInt(leafiness * 200) + ",0)";
        ctx.stroke();
        branches.forEach(function(branch) {
            stack.push({
                branch: branch,
                x: endx,
                y: endy,
                angle: drawAngle
            });
        });
    };
};

var Fruit = function(growthRate) {
    var targetRadius = 4;
    var radius = 0;
    var ripeness = 1;
    var dying = false;

    targetRadius = r(targetRadius);
    growthRate = r(growthRate);

    var witherRadius = 2;

    this.grow = function(interval) {
        interval = interval / 30;
        if (dying) {
            radius += (witherRadius - radius) * witherRate * interval;
            ripeness *= (1 - 0.01 * interval);
        } else {
            radius += (targetRadius - radius) * growthRate * interval;
            ripeness *= (1 - 0.01 * interval);
            if (ripeness < 0.01) {
                dying = true;
                ripeness = 1;
            }
        }
    };

    this.draw = function(ctx, width, height, x, y) {
        ctx.beginPath();
        ctx.arc(x, height - y, radius, 2 * Math.PI, false);
        if (dying) {
            ctx.fillStyle = "rgb(" +
            parseInt(ripeness * 200) + "," +
            "0," +
            parseInt(ripeness * 50) + ")";
        } else {
            ctx.fillStyle = "rgb(" +
            parseInt((1 - ripeness) * 200) + "," +
            parseInt(ripeness * 150) + "," +
            parseInt((1 - ripeness) * 50) + ")";
        }
        ctx.fill();
    };
};

var trunks;

function init(width, height) {
    trunks = [
        {
            branch: new Stick(6, 0, 0.1, 0),
            x: width / 2,
            y: height / 2,
            angle: Math.PI / 2
        },
        {
            branch: new Stick(6, 0, 0.1, 0),
            x: width / 2,
            y: height / 2,
            angle: Math.PI / 2 - 2 * Math.PI / 3
        },
        {
            branch: new Stick(6, 0, 0.1, 0),
            x: width / 2,
            y: height / 2,
            angle: Math.PI / 2 + 2 * Math.PI / 3
        }
    ];
}

function drawFrame(ctx, width, height, interval, mouse) {
    var stack = trunks.map(function(trunk) { return trunk.branch; });
    while (stack.length > 0) {
        stack.shift().grow(interval, stack);
    }
    stack = trunks.map(function(trunk) {
        trunk.x = width / 2;
        trunk.y = height / 2;
        return trunk;
    });
    while (stack.length > 0) {
        var d = stack.shift();
        d.branch.draw(ctx, width, height, d.x, d.y, d.angle, stack);
    }
    if (witherRate < 0.5) {
        witherRate *= 1.005;
    }
}

(function() {
    var canvas = document.getElementById("canvas-full");
    var ctx = null;

    var mouse = {
        x: 0,
        y: 0,
        down: false
    }
    canvas.addEventListener("mousemove", function(event) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
        run();
    }, false);

    canvas.addEventListener("mousedown", function(event) {
        mouse.down = true;
        run();
    }, false);

    canvas.addEventListener("mouseup", function(event) {
        mouse.down = false;
        run();
    }, false);

    var resizeCanvas = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx = canvas.getContext("2d");
    };

    var stamp = Date.now() - 30;
    var run = function() {
        var now = Date.now();
        var interval = now - stamp;
        stamp = now;
        if (interval < 0) interval = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawFrame(ctx, canvas.width, canvas.height, interval, mouse);
    };

    init(canvas.width, canvas.height);

    window.onresize = resizeCanvas;

    window.onload = function() {
        resizeCanvas();
        setInterval(run, 30);
    };
})();
