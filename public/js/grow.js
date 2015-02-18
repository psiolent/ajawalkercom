define(["require", "exports"], function (require, exports) {
    var Grow;
    (function (Grow) {
        /**
         * The amount of randomization to do in the randomize() function.
         * @type {number}
         */
        var RANDOMIZE_FACTOR = 0.05;
        /**
         * Randomize a number by scaling up or down by randomize factor.
         * @param n the number to randomize
         * @returns {number} the randomized number
         */
        function randomize(n) {
            return n * (Math.random() * 2 * RANDOMIZE_FACTOR + 1 - RANDOMIZE_FACTOR);
        }
        /**
         * Normalize an angle (in radians) to between 0 and 2 Pi.
         * @param angle the angle to normalize
         * @returns {number} the normalized angle
         */
        function normalizeAngle(angle) {
            while (angle < 0) {
                angle += 2 * Math.PI;
            }
            while (angle >= 2 * Math.PI) {
                angle -= 2 * Math.PI;
            }
            return angle;
        }
        /**
         * The environment in which growth occurs.
         */
        var Environment = (function () {
            function Environment() {
                /**
                 * A factor to multiply by interval before using in calculations.  Determines how
                 * quickly the growth takes place.
                 * @type {number}
                 */
                this.INTERVAL_FACTOR = 1 / 50;
                /**
                 * Controls the rate at which sticks and fruit wither away.  This value increases
                 * as the growth progresses.
                 * @type {number}
                 */
                this.WITHER_RATE = 0.00001;
                /**
                 * Determines the maximum wither rate before the wither rate stops increasing.
                 * @type {number}
                 */
                this.MAX_WITHER_RATE = 0.1;
                /**
                 * Determines how quickly the wither rate increases to its maximum.
                 * @type {number}
                 */
                this.WITHER_RATE_MULTIPLIER = 1.004;
                /**
                 * The final length of a withered stick.
                 * @type {number}
                 */
                this.WITHER_LENGTH = 4;
                /**
                 * The final angle (positive or negative) of a withered stick.
                 * @type {number}
                 */
                this.STICK_WITHER_ANGLE = Math.PI / 3;
                /**
                 * The target radius of a ripe fruit.
                 * @type {number}
                 */
                this.TARGET_FRUIT_RADIUS = 4;
                /**
                 * The final radius of a withered fruit.
                 * @type {number}
                 */
                this.WITHER_FRUIT_RADIUS = 0;
                /**
                 * The probability of multiple branches occurring at a branch point. This
                 * probability will decrease to zero a the maximum stick depth is approached.
                 * @type {number}
                 */
                this.BRANCH_PROBABILITY = 0.08;
                /**
                 * The amount that branches curve.
                 * @type {number}
                 */
                this.BRANCH_CURVE = 1.0;
                /**
                 * The maximum depth of sticks on a branch before fruiting.
                 * @type {number}
                 */
                this.MAX_STICK_DEPTH = 80;
            }
            return Environment;
        })();
        /**
         * A branch and its drawing context.
         */
        var BranchDrawContext = (function () {
            function BranchDrawContext(branch, x, y, angle) {
                this.branch = branch;
                this.x = x;
                this.y = y;
                this.angle = angle;
            }
            return BranchDrawContext;
        })();
        /**
         * A stick, which is a kind of branch.
         */
        var Stick = (function () {
            function Stick(env, targetLength, targetAngle, growthRate, depth) {
                // child branches
                this._branches = [];
                // current length of the branch
                this._length = 0;
                // current angle of the branch
                this._angle = 0;
                // how leafy (green) the branch is
                this._leafiness = 1;
                this._env = env;
                this._targetLength = randomize(targetLength);
                this._targetAngle = randomize(targetAngle);
                this._growthRate = randomize(growthRate);
                this._depth = depth;
                this._witherAngle = this._targetAngle > 0 ? this._env.STICK_WITHER_ANGLE : -this._env.STICK_WITHER_ANGLE;
            }
            Stick.prototype.grow = function (interval, stack) {
                // scale the interval
                interval *= this._env.INTERVAL_FACTOR;
                if (this._branches.length === 0) {
                    // now child branches, so keep growing
                    this._length += (this._targetLength - this._length) * this._growthRate * interval;
                    this._angle += (this._targetAngle - this._angle) * this._growthRate * interval;
                }
                else {
                    // we have child branches, so wither now
                    this._length += (this._env.WITHER_LENGTH - this._length) * this._env.WITHER_RATE * interval;
                    this._angle += (this._witherAngle - this._angle) * this._env.WITHER_RATE * interval;
                }
                if (this._branches.length === 0 && Math.pow((this._length / this._targetLength), 2) > Math.random()) {
                    // looks like its time to spawn a child branch
                    if (this._depth < this._env.MAX_STICK_DEPTH) {
                        while ((this._branches.length === 0 || Math.random() > (1 - this._env.BRANCH_PROBABILITY) + (this._env.BRANCH_PROBABILITY * (this._depth / this._env.MAX_STICK_DEPTH)))) {
                            this._branches.push(new Stick(this._env, this._targetLength, Math.random() * 2 * this._env.BRANCH_CURVE - this._env.BRANCH_CURVE, this._growthRate, this._depth + 1));
                        }
                    }
                    else {
                        // child branch is a fruit
                        this._branches.push(new Fruit(this._env, this._growthRate));
                    }
                }
                if (this._branches.length > 0) {
                    // decrease leafiness once we've got a child
                    this._leafiness *= (1 - 0.01 * interval);
                }
                this._branches.forEach(function (branch) {
                    // grow child branches
                    stack.push(branch);
                });
            };
            Stick.prototype.draw = function (ctx, width, height, startx, starty, refAngle, stack) {
                // draw x, y, and angle relative to reference coordinates and angle
                var drawAngle = normalizeAngle(refAngle + this._angle);
                var endx = startx + Math.cos(drawAngle) * this._length;
                var endy = starty + Math.sin(drawAngle) * this._length;
                // draw
                ctx.beginPath();
                ctx.moveTo(startx, height - starty);
                ctx.lineTo(endx, height - endy);
                // green-ness depends on leafiness
                ctx.strokeStyle = "rgb(0," + Math.floor(this._leafiness * 200) + ",0)";
                ctx.stroke();
                // draw children
                this._branches.forEach(function (branch) {
                    stack.push(new BranchDrawContext(branch, endx, endy, drawAngle));
                });
            };
            return Stick;
        })();
        /**
         * A fruit is at the very end of a branch sequence.
         */
        var Fruit = (function () {
            function Fruit(env, growthRate) {
                // current radius of the fruit
                this._radius = 0;
                // how ripe the fruit is (determines its color)
                this._ripeness = 1;
                // whether the fruit is dying
                this._dying = false;
                this._env = env;
                this._growthRate = randomize(growthRate);
                this._targetRadius = randomize(this._env.TARGET_FRUIT_RADIUS);
            }
            Fruit.prototype.grow = function (interval) {
                // scale the interval
                interval *= this._env.INTERVAL_FACTOR;
                if (this._dying) {
                    // if dying, then we are withering and over-ripening
                    this._radius += (this._env.WITHER_FRUIT_RADIUS - this._radius) * this._env.WITHER_RATE * interval;
                    this._ripeness *= (1 - 0.01 * interval);
                }
                else {
                    // if not dying then we are growing and ripening
                    this._radius += (this._env.TARGET_FRUIT_RADIUS - this._radius) * this._growthRate * interval;
                    this._ripeness *= (1 - 0.01 * interval);
                    if (this._ripeness < 0.01) {
                        // we've reached full ripeness, so start dying
                        this._dying = true;
                        this._ripeness = 1;
                    }
                }
            };
            Fruit.prototype.draw = function (ctx, width, height, x, y) {
                // draw the fruit
                ctx.beginPath();
                ctx.arc(x, height - y, this._radius, 2 * Math.PI, false);
                if (this._dying) {
                    // if dying, then become blacker as we over ripen
                    ctx.fillStyle = "rgb(" + Math.floor(this._ripeness * 200) + "," + "0," + Math.floor(this._ripeness * 50) + ")";
                }
                else {
                    // if not dying, then turn from green to red as ripening
                    ctx.fillStyle = "rgb(" + Math.floor((1 - this._ripeness) * 200) + "," + Math.floor(this._ripeness * 150) + "," + Math.floor((1 - this._ripeness) * 50) + ")";
                }
                ctx.fill();
            };
            return Fruit;
        })();
        /**
         * Implements the FullCanvas.Client interfaces for a Grow animation.
         */
        var Client = (function () {
            function Client() {
                // root trunk sticks drawing contexts
                this._trunks = [];
                // growth environment
                this._env = new Environment();
            }
            Client.prototype.init = function (width, height) {
                // init trunks
                this._trunks.push(new BranchDrawContext(new Stick(this._env, 6, 0, 0.1, 0), width / 2, height / 2, Math.PI / 2));
                this._trunks.push(new BranchDrawContext(new Stick(this._env, 6, 0, 0.1, 0), width / 2, height / 2, Math.PI / 2 - 2 * Math.PI / 3));
                this._trunks.push(new BranchDrawContext(new Stick(this._env, 6, 0, 0.1, 0), width / 2, height / 2, Math.PI / 2 + 2 * Math.PI / 3));
            };
            Client.prototype.update = function (interval, width, height, mouse) {
                // create our stack of branches to grow from our trunks
                var stack = this._trunks.map(function (bc) { return bc.branch; });
                while (stack.length > 0) {
                    stack.shift().grow(interval, stack);
                }
                // increase wither rate as growth proceeds
                if (this._env.WITHER_RATE < this._env.MAX_WITHER_RATE) {
                    this._env.WITHER_RATE *= this._env.WITHER_RATE_MULTIPLIER;
                }
            };
            Client.prototype.draw = function (ctx, width, height, mouse) {
                // update x and y for trunks to be in the center of the canvas
                this._trunks.forEach(function (bc) {
                    bc.x = width / 2;
                    bc.y = height / 2;
                });
                // create our stack of branches to draw from our trunks
                var stack = this._trunks.slice(0);
                while (stack.length > 0) {
                    var d = stack.shift();
                    d.branch.draw(ctx, width, height, d.x, d.y, d.angle, stack);
                }
            };
            return Client;
        })();
        Grow.Client = Client;
        /**
         * A factory for our grow clients.
         */
        var ClientFactory = (function () {
            function ClientFactory() {
            }
            ClientFactory.prototype.create = function () {
                return new Client();
            };
            return ClientFactory;
        })();
        Grow.ClientFactory = ClientFactory;
        function createClientFactory() {
            return new ClientFactory();
        }
        Grow.createClientFactory = createClientFactory;
    })(Grow || (Grow = {}));
    return Grow;
});
//# sourceMappingURL=grow.js.map