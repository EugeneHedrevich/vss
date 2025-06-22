export const applyBlueField = (ctx, numSquigglies, updateSpeed, trailLength, maxAngle, opacity) => {
    const canvas = ctx.canvas;
    let squiggles = Array.from({ length: numSquigglies }, () => createSquiggle(canvas));

    let lastTime = 0;
    const frameDelay = 1000 / updateSpeed; // Control frame rate based on updateSpeed

    const drawFrame = (timestamp) => {
        // Control frame rate to reduce lag
        if (timestamp - lastTime >= frameDelay) {
            lastTime = timestamp;

            // Draw the squiggles on top of the existing canvas content
            drawSquiggles(ctx, squiggles, opacity);
            updateSquiggles(squiggles, canvas, maxAngle, trailLength);
        }

        // Request the next frame
        requestAnimationFrame(drawFrame);
    };

    drawFrame();
};

const createSquiggle = (canvas) => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    angle: Math.random() * 360,
    trail: []
});

const updateSquiggles = (squiggles, canvas, maxAngle, trailLength) => {
    squiggles.forEach((squiggle) => {
        // Update the angle and position of the squiggle
        squiggle.angle += (Math.random() - 0.5) * maxAngle;
        squiggle.x += Math.cos((squiggle.angle * Math.PI) / 180) * 2;
        squiggle.y += Math.sin((squiggle.angle * Math.PI) / 180) * 2;

        // Add the current position to the trail
        squiggle.trail.push({ x: squiggle.x, y: squiggle.y });

        // Remove the oldest point if the trail exceeds the specified length
        if (squiggle.trail.length > trailLength) {
            squiggle.trail.shift();
        }

        // Reset the squiggle if it goes out of bounds
        if (squiggle.x < 0 || squiggle.x > canvas.width || squiggle.y < 0 || squiggle.y > canvas.height) {
            Object.assign(squiggle, createSquiggle(canvas));
        }
    });
};

const drawSquiggles = (ctx, squiggles, opacity) => {
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity / 100})`;
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