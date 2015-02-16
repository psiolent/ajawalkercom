/// <reference path="fullcanvas.ts" />
var Grow;
(function (Grow) {
    /**
     * Controls the rate at which sticks and fruit wither away.
     * @type {number}
     */
    var witherRate = 0.00001;
    var randomizeFactor = 0.05;
    /**
     * Randomize a number by scaling up or down by randomize factor.
     * @param n the number to randomize
     * @returns {number} the randomized number
     */
    function r(n) {
        return n * (Math.random() * 2 * randomizeFactor + 1 - randomizeFactor);
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
    var Stick = function (targetLength, targetAngle, growthRate, depth) {
        var branches = [];
        var length = 0;
        var angle = 0;
        var leafiness = 1;
        targetLength = r(targetLength);
        targetAngle = r(targetAngle);
        growthRate = r(growthRate);
        var witherLength = 4;
        var witherAngle = targetAngle > 0 ? Math.PI / 3 : -Math.PI / 3;
        this.grow = function (interval, stack) {
            interval = interval / 30;
            if (branches.length === 0) {
                length += (targetLength - length) * growthRate * interval;
                angle += (targetAngle - angle) * growthRate * interval;
            }
            else {
                length += (witherLength - length) * witherRate * interval;
                angle += (witherAngle - angle) * witherRate * interval;
            }
            if (branches.length === 0 && Math.pow((length / targetLength), 2) > Math.random()) {
                if (depth < 100) {
                    while ((branches.length === 0 || Math.random() > 0.93 + 0.07 * (depth / 100))) {
                        branches.push(new Stick(targetLength, Math.random() * 0.2 - 0.1, growthRate, depth + 1));
                    }
                }
                else {
                    branches.push(new Fruit(growthRate));
                }
            }
            if (branches.length > 0) {
                leafiness *= (1 - 0.01 * interval);
            }
            branches.forEach(function (branch) {
                stack.push(branch);
            });
        };
        this.draw = function (ctx, width, height, startx, starty, refAngle, stack) {
            var drawAngle = normalizeAngle(refAngle + angle);
            var endx = startx + Math.cos(drawAngle) * length;
            var endy = starty + Math.sin(drawAngle) * length;
            ctx.beginPath();
            ctx.moveTo(startx, height - starty);
            ctx.lineTo(endx, height - endy);
            ctx.strokeStyle = "rgb(0," + parseInt(leafiness * 200) + ",0)";
            ctx.stroke();
            branches.forEach(function (branch) {
                stack.push({
                    branch: branch,
                    x: endx,
                    y: endy,
                    angle: drawAngle
                });
            });
        };
    };
    var Client = (function () {
        function Client() {
        }
        Client.prototype.init = function (width, height) {
            // TODO
        };
        Client.prototype.update = function (interval, width, height, mouse) {
            // TODO
        };
        Client.prototype.draw = function (ctx, width, height, mouse) {
            // TODO
        };
        return Client;
    })();
    Grow.Client = Client;
})(Grow || (Grow = {}));
var Stick = function (targetLength, targetAngle, growthRate, depth) {
    var branches = [];
    var length = 0;
    var angle = 0;
    var leafiness = 1;
    targetLength = r(targetLength);
    targetAngle = r(targetAngle);
    growthRate = r(growthRate);
    var witherLength = 4;
    var witherAngle = targetAngle > 0 ? Math.PI / 3 : -Math.PI / 3;
    this.grow = function (interval, stack) {
        interval = interval / 30;
        if (branches.length === 0) {
            length += (targetLength - length) * growthRate * interval;
            angle += (targetAngle - angle) * growthRate * interval;
        }
        else {
            length += (witherLength - length) * witherRate * interval;
            angle += (witherAngle - angle) * witherRate * interval;
        }
        if (branches.length === 0 && Math.pow((length / targetLength), 2) > Math.random()) {
            if (depth < 100) {
                while ((branches.length === 0 || Math.random() > 0.93 + 0.07 * (depth / 100))) {
                    branches.push(new Stick(targetLength, Math.random() * 0.2 - 0.1, growthRate, depth + 1));
                }
            }
            else {
                branches.push(new Fruit(growthRate));
            }
        }
        if (branches.length > 0) {
            leafiness *= (1 - 0.01 * interval);
        }
        branches.forEach(function (branch) {
            stack.push(branch);
        });
    };
    this.draw = function (ctx, width, height, startx, starty, refAngle, stack) {
        var drawAngle = normalizeAngle(refAngle + angle);
        var endx = startx + Math.cos(drawAngle) * length;
        var endy = starty + Math.sin(drawAngle) * length;
        ctx.beginPath();
        ctx.moveTo(startx, height - starty);
        ctx.lineTo(endx, height - endy);
        ctx.strokeStyle = "rgb(0," + parseInt(leafiness * 200) + ",0)";
        ctx.stroke();
        branches.forEach(function (branch) {
            stack.push({
                branch: branch,
                x: endx,
                y: endy,
                angle: drawAngle
            });
        });
    };
};
var Fruit = function (growthRate) {
    var targetRadius = 4;
    var radius = 0;
    var ripeness = 1;
    var dying = false;
    targetRadius = r(targetRadius);
    growthRate = r(growthRate);
    var witherRadius = 2;
    this.grow = function (interval) {
        interval = interval / 30;
        if (dying) {
            radius += (witherRadius - radius) * witherRate * interval;
            ripeness *= (1 - 0.01 * interval);
        }
        else {
            radius += (targetRadius - radius) * growthRate * interval;
            ripeness *= (1 - 0.01 * interval);
            if (ripeness < 0.01) {
                dying = true;
                ripeness = 1;
            }
        }
    };
    this.draw = function (ctx, width, height, x, y) {
        ctx.beginPath();
        ctx.arc(x, height - y, radius, 2 * Math.PI, false);
        if (dying) {
            ctx.fillStyle = "rgb(" + parseInt(ripeness * 200) + "," + "0," + parseInt(ripeness * 50) + ")";
        }
        else {
            ctx.fillStyle = "rgb(" + parseInt((1 - ripeness) * 200) + "," + parseInt(ripeness * 150) + "," + parseInt((1 - ripeness) * 50) + ")";
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
    var stack = trunks.map(function (trunk) {
        return trunk.branch;
    });
    while (stack.length > 0) {
        stack.shift().grow(interval, stack);
    }
    stack = trunks.map(function (trunk) {
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
(function () {
    var canvas = document.getElementById("canvas-full");
    var ctx = null;
    var mouse = {
        x: 0,
        y: 0,
        down: false
    };
    canvas.addEventListener("mousemove", function (event) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
        run();
    }, false);
    canvas.addEventListener("mousedown", function (event) {
        mouse.down = true;
        run();
    }, false);
    canvas.addEventListener("mouseup", function (event) {
        mouse.down = false;
        run();
    }, false);
    var resizeCanvas = function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx = canvas.getContext("2d");
    };
    var stamp = Date.now() - 30;
    var run = function () {
        var now = Date.now();
        var interval = now - stamp;
        stamp = now;
        if (interval < 0)
            interval = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawFrame(ctx, canvas.width, canvas.height, interval, mouse);
    };
    init(canvas.width, canvas.height);
    window.onresize = resizeCanvas;
    window.onload = function () {
        resizeCanvas();
        setInterval(run, 30);
    };
})();
//# sourceMappingURL=grow.js.map