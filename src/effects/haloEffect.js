export const applyHalo = (ctx, img, haloIntensity, haloOpacity, haloDiameter) => {
    const positions = [
        { x: 147, y: 75.5 },
        { x: 97, y: 132.5 },
        { x: 76, y: 154.5 }
    ];
    ctx.globalCompositeOperation = "lighter"; // Makes bright areas glow

    positions.forEach(({ x, y }) => {
        const adjustedOpacity = haloOpacity * haloIntensity; // Adjust the opacity based on intensity
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, haloDiameter);

        gradient.addColorStop(0, `rgba(255, 255, 255, ${adjustedOpacity})`); // Center of the halo
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`); // Fading outwards

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, haloDiameter, 0, 2 * Math.PI);
        ctx.fill();
    });

    ctx.globalCompositeOperation = "source-over";
};