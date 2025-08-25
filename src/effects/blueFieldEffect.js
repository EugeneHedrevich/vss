let squiggles = null;

export const applyBlueField = (ctx, numSquigglies, speed, trailLength) => {
    const canvas = ctx.canvas;

    if (!squiggles || squiggles.length !== numSquigglies) {
        squiggles = Array.from({ length: numSquigglies }, () => createSquiggle(canvas));
    }

    const maxAngle = 10;
    const opacity = 0.7;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawSquiggles(ctx, squiggles, opacity);
    updateSquiggles(squiggles, canvas, maxAngle, trailLength);
};

export const resetBlueField = () => {
    squiggles = null;
};

const createSquiggle = (canvas) => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    angle: Math.random() * 360,
    trail: [],
});

const updateSquiggles = (squiggles, canvas, maxAngle, trailLength) => {
    squiggles.forEach((squiggle) => {
        squiggle.angle += (Math.random() - 0.5) * maxAngle;
        squiggle.x += Math.cos((squiggle.angle * Math.PI) / 180) * 2;
        squiggle.y += Math.sin((squiggle.angle * Math.PI) / 180) * 2;

        squiggle.trail.push({ x: squiggle.x, y: squiggle.y });

        if (squiggle.trail.length > trailLength) {
            squiggle.trail.shift();
        }

        if (
            squiggle.x < 0 ||
            squiggle.x > canvas.width ||
            squiggle.y < 0 ||
            squiggle.y > canvas.height
        ) {
            Object.assign(squiggle, createSquiggle(canvas));
        }
    });
};

const drawSquiggles = (ctx, squiggles, opacity) => {
    ctx.strokeStyle = `rgba(0, 136, 255, ${opacity})`;
    ctx.lineWidth = 1.5;

    squiggles.forEach((squiggle) => {
        ctx.beginPath();
        squiggle.trail.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
    });
};
