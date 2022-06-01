var resizeReset = function () {
    w = canvasBody.width = 700;
    h = canvasBody.height = 250;
};

var opts = {
    particleColor: "rgba(255,255,255,0.35)",
    lineColor: "rgb(200,200,200, .1)",
    particleAmount: 50,
    defaultSpeed: .15,
    variantSpeed: .15,
    defaultRadius: 2,
    variantRadius: 2,
    linkRadius: 80,
};

let deBouncer = function () {
    clearTimeout(tid);
    tid = setTimeout(function () {
        resizeReset();
    }, delay);
};``

let checkDistance = function (x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

let linkPoints = function (point1, hubs) {
    for (let i = 0; i < hubs.length; i++) {
        let distance = checkDistance(point1.x, point1.y, hubs[i].x, hubs[i].y);
        let opacity = 1 - distance / opts.linkRadius;
        if (opacity > 0) {
            drawArea.lineWidth = 0.5;
            drawArea.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
            drawArea.beginPath();
            drawArea.moveTo(point1.x, point1.y);
            drawArea.lineTo(hubs[i].x, hubs[i].y);
            drawArea.closePath();
            drawArea.stroke();
        }
    }
};

Particle = function (xPos, yPos) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.speed = opts.defaultSpeed + Math.random() * opts.variantSpeed;
    this.directionAngle = Math.floor(Math.random() * 360);
    this.color = opts.particleColor;
    this.radius = opts.defaultRadius + Math.random() * opts.variantRadius;
    this.vector = {
        x: Math.cos(this.directionAngle) * this.speed,
        y: Math.sin(this.directionAngle) * this.speed
    };
    this.update = function () {
        this.border();
        this.x += this.vector.x;
        this.y += this.vector.y;
    };
    this.border = function () {
        if (this.x >= w || this.x <= 0) {
            this.vector.x *= -1;
        }
        if (this.y >= h || this.y <= 0) {
            this.vector.y *= -1;
        }
        if (this.x > w) this.x = w;
        if (this.y > h) this.y = h;
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
    };
    this.draw = function () {
        drawArea.beginPath();
        drawArea.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        drawArea.closePath();
        drawArea.fillStyle = this.color;
        drawArea.fill();
    };
};

function setup() {
    particles = [];
    resizeReset();
    for (let i = 0; i < opts.particleAmount; i++) {
        particles.push(new Particle());
    }
    window.requestAnimationFrame(loop);
}

function loop() {
    window.requestAnimationFrame(loop);
    drawArea.clearRect(0, 0, w, h);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    for (let i = 0; i < particles.length; i++) {
        linkPoints(particles[i], particles);
    }
}

const canvasBody = document.getElementById("canvas"),
    drawArea = canvasBody.getContext("2d");
let delay = 40, tid,
    rgb = opts.lineColor.match(/\d+/g);

resizeReset();
setup();

var aside = document.getElementById('aside');
var burger = document.getElementById('burger');

burger.addEventListener('click', function () {
    this.classList.toggle('open');

    if (window.navigator.vibrate) {
        window.navigator.vibrate(30);
    }

    if (this.classList.contains('open')) {
        aside.classList.add('active');
    } else {
        aside.classList.remove('active');
    }
});

var trs = document.getElementsByClassName('trs');
window.onload = function () {
    let lines = document.getElementsByClassName('line');
    if (window.innerWidth > 768) {
        for (let i = 0; i < lines.length; i++) {
            let lineWidth = lines[i].getAttribute('data-prc') + 'px';
            let verticalLine = lines[i].querySelector('span');
            verticalLine.style.transform = `translateX(${lineWidth})`
        }
    } else {
        for (let i = 0; i < lines.length; i++) {
            let lineWidth = lines[i].getAttribute('data-p') + '%';
            let verticalLine = lines[i].querySelector('span');
            verticalLine.style.left = `${lineWidth}`
        }
    }

    for (var k = 0; k < trs.length; k++) {
        trs[k].classList.add('active')
    }

};


var avatar = document.getElementById('avatar');
avatar.addEventListener('click', function () {
    if (!this.classList.contains("active")) {
        this.classList.add('active');
        burger.style.opacity = '0';
        burger.style.zIndex = '-1';
    } else {
        this.classList.remove('active');
        burger.style.opacity = '1';
        burger.style.zIndex = '9999';
    }
});


document.onkeypress = function (event) {
    event = (event || window.event);
    if (event.keyCode == 123) {
        return false;
    } else if (event.ctrlKey && event.shiftKey && event.keyCode == 73) {
        return false;
    }
};
document.onmousedown = function (event) {
    event = (event || window.event);
    if (event.keyCode == 123) {
        return false;
    }
};
document.onkeydown = function (event) {
    event = (event || window.event);
    if (event.keyCode == 123) {
        return false;
    } else if (event.ctrlKey && event.shiftKey && event.keyCode == 73) {
        return false;
    }
};

window.oncontextmenu = function () {
    return false;
};

console.log('%cWelcome!', 'color: red; background-color: white; font-size: 25px; text-transform: uppercase; padding: 50px 10px; font-family: Arial; sans-serif')