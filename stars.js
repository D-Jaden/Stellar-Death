export function createStarField(options = {}) {
    // Merge options with defaults
    const config = {
        count: options.count || 1000,
        size: options.size || 0.1,
        color: options.color || 0xFFFFFF,
        radius: options.radius || 100,
        sizeAttenuation: options.sizeAttenuation !== undefined ? options.sizeAttenuation : true
    };

    // Create geometry (using BufferGeometry instead of CircleGeometry for points)
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(config.count * 3);
    const colors = new Float32Array(config.count * 3);
    const sizes = new Float32Array(config.count);

    // Generate random star positions and colors
    for(let i = 0; i < config.count; i++) {
        // Spherical distribution
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = config.radius * (0.5 + Math.random() * 0.5); // More even distribution

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        // Random color variations with some realism
        const baseColor = new THREE.Color(config.color);
        const hue = Math.random() * 0.1 - 0.05; // Slight hue variation
        const saturation = 0.3 + Math.random() * 0.4; // Varied saturation
        const lightness = 0.6 + Math.random() * 0.4; // Varied brightness
        
        baseColor.offsetHSL(hue, saturation, lightness);
        
        colors[i * 3] = baseColor.r;
        colors[i * 3 + 1] = baseColor.g;
        colors[i * 3 + 2] = baseColor.b;
        
        // Variable star sizes
        sizes[i] = config.size * (0.5 + Math.random() * 1.5);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Create material
    const material = new THREE.PointsMaterial({
        size: config.size,
        vertexColors: true,
        transparent: true,
        sizeAttenuation: config.sizeAttenuation,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.8
    });

    // Create points system
    const stars = new THREE.Points(geometry, material);

    return {
        object: stars,
        update: (newOptions) => {
            Object.assign(config, newOptions);
            material.size = config.size;
            material.needsUpdate = true;
            
            // Update colors if color changed
            if (newOptions.color !== undefined) {
                const colors = geometry.attributes.color.array;
                const baseColor = new THREE.Color(config.color);
                
                for(let i = 0; i < config.count; i++) {
                    const hue = Math.random() * 0.1 - 0.05;
                    const saturation = 0.3 + Math.random() * 0.4;
                    const lightness = 0.6 + Math.random() * 0.4;
                    
                    baseColor.offsetHSL(hue, saturation, lightness);
                    
                    colors[i * 3] = baseColor.r;
                    colors[i * 3 + 1] = baseColor.g;
                    colors[i * 3 + 2] = baseColor.b;
                }
                
                geometry.attributes.color.needsUpdate = true;
            }
        },
        animate: (time) => {
            // Optional: Add subtle twinkling effect
            const colors = geometry.attributes.color.array;
            for(let i = 0; i < config.count; i++) {
                const twinkle = 0.8 + Math.sin(time * 2 + i * 0.1) * 0.2;
                colors[i * 3] *= twinkle;
                colors[i * 3 + 1] *= twinkle;
                colors[i * 3 + 2] *= twinkle;
            }
            geometry.attributes.color.needsUpdate = true;
        }
    };
}