import { createStarField } from './stars.js';

class StellarDeathSimulation {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.starField = null;
        this.dyingStar = null;
        this.nebulaParticles = null;
        this.shockWave = null;
        this.solarFlares = [];
        this.starGlow1 = null;
        this.starGlow2 = null;
        this.time = 0;
        this.isPaused = false;
        
        this.config = {
            coreColor: '#ff4444',
            nebulaColor: '#4444ff',
            coreSize: 1.0,
            expansionRadius: 10,
            particleCount: 2000,
            animationSpeed: 1.0,
            turbulence: 0.5,
            brightness: 1.0
        };
        
        this.init();
        this.setupControls();
        this.animate();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.2, 1000);
        this.camera.position.set(0, 0, 30);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        document.getElementById('container').appendChild(this.renderer.domElement);
        
        // Add OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
        
        // Create star field background
        this.starField = createStarField({
            count: 1500,
            size: 0.5,
            radius: 200,
            sizeAttenuation: true
        });
        this.scene.add(this.starField.object);
        
        // Create the dying star
        this.createDyingStar();
        
        // Create nebula particles
        this.createNebulaParticles();
        
        // Create solar flares
        this.createSolarFlares();
        
        // Create shock wave
        this.createShockWave();
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
                // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createDyingStar() {
        // Core of the dying star with higher contrast
        const coreGeometry = new THREE.SphereGeometry(1, 32, 32);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(this.config.coreColor),
            transparent: false,
            emissive: new THREE.Color(this.config.coreColor),
            emissiveIntensity: 0.5
        });
        
        this.dyingStar = new THREE.Mesh(coreGeometry, coreMaterial);
        this.scene.add(this.dyingStar);
        
        // Add multiple glow layers for more contrast
        const glowGeometry1 = new THREE.SphereGeometry(1.3, 32, 32);
        const glowMaterial1 = new THREE.MeshBasicMaterial({
            color: new THREE.Color(this.config.coreColor),
            transparent: true,
            opacity: 0.6,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        
        this.starGlow1 = new THREE.Mesh(glowGeometry1, glowMaterial1);
        this.scene.add(this.starGlow1);
        
        // Second glow layer
        const glowGeometry2 = new THREE.SphereGeometry(1.8, 32, 32);
        const glowMaterial2 = new THREE.MeshBasicMaterial({
            color: new THREE.Color(this.config.coreColor),
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        
        this.starGlow2 = new THREE.Mesh(glowGeometry2, glowMaterial2);
        this.scene.add(this.starGlow2);
    }
    
    createNebulaParticles() {
        const particleCount = this.config.particleCount;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const velocities = new Float32Array(particleCount * 3);
        
        const coreColor = new THREE.Color(this.config.coreColor);
        const nebulaColor = new THREE.Color(this.config.nebulaColor);
        
        for (let i = 0; i < particleCount; i++) {
            // Initial positions near the star
            const radius = 1 + Math.random() * 2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Velocities for expansion
            const speed = 0.02 + Math.random() * 0.05;
            velocities[i * 3] = (positions[i * 3] / radius) * speed;
            velocities[i * 3 + 1] = (positions[i * 3 + 1] / radius) * speed;
            velocities[i * 3 + 2] = (positions[i * 3 + 2] / radius) * speed;
            
            // Color mixing
            const mixFactor = Math.random();
            const color = coreColor.clone().lerp(nebulaColor, mixFactor);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            sizes[i] = Math.random() * 2 + 0.5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.8, // Much smaller particles
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.nebulaParticles = new THREE.Points(geometry, material);
        this.nebulaParticles.userData = { velocities };
        this.scene.add(this.nebulaParticles);
    }
    
    createSolarFlares() {
        const flareCount = 6;
        
        for (let i = 0; i < flareCount; i++) {
            // Create flare geometry - elongated cylinder for flare shape
            const flareGeometry = new THREE.CylinderGeometry(0.1, 0.05, 8, 8, 1);
            const flareMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color(this.config.coreColor),
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });
            
            const flare = new THREE.Mesh(flareGeometry, flareMaterial);
            
            // Position flares randomly around the star
            const angle = (i / flareCount) * Math.PI * 2;
            const tilt = (Math.random() - 0.5) * Math.PI;
            
            flare.position.set(
                Math.cos(angle) * 2,
                Math.sin(angle) * 2,
                (Math.random() - 0.5) * 1
            );
            
            // Orient flares outward from star
            flare.lookAt(
                flare.position.x * 3,
                flare.position.y * 3,
                flare.position.z * 3
            );
            
            flare.userData = {
                baseAngle: angle,
                initialIntensity: 0.7,
                pulsationPhase: i * Math.PI / 3,
                rotationSpeed: (Math.random() - 0.5) * 0.02
            };
            
            this.solarFlares.push(flare);
            this.scene.add(flare);
            
            // Add flare particles for extra effect
            this.createFlareParticles(flare, i);
        }
    }
    
    createFlareParticles(parentFlare, flareIndex) {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        const flareColor = new THREE.Color(this.config.coreColor);
        
        for (let i = 0; i < particleCount; i++) {
            // Position particles along flare direction
            const t = Math.random();
            const flareDirection = parentFlare.position.clone().normalize();
            
            positions[i * 3] = parentFlare.position.x + flareDirection.x * t * 6;
            positions[i * 3 + 1] = parentFlare.position.y + flareDirection.y * t * 6;
            positions[i * 3 + 2] = parentFlare.position.z + flareDirection.z * t * 6;
            
            // Add some random spread
            positions[i * 3] += (Math.random() - 0.5) * 0.5;
            positions[i * 3 + 1] += (Math.random() - 0.5) * 0.5;
            positions[i * 3 + 2] += (Math.random() - 0.5) * 0.5;
            
            // Set velocities along flare direction
            const speed = 0.01 + Math.random() * 0.02;
            velocities[i * 3] = flareDirection.x * speed;
            velocities[i * 3 + 1] = flareDirection.y * speed;
            velocities[i * 3 + 2] = flareDirection.z * speed;
            
            // Bright orange/red colors for flare
            colors[i * 3] = flareColor.r;
            colors[i * 3 + 1] = flareColor.g * 0.6;
            colors[i * 3 + 2] = flareColor.b * 0.2;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.4,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const flareParticles = new THREE.Points(geometry, material);
        flareParticles.userData = { 
            velocities,
            parentFlare,
            flareIndex
        };
        
        this.solarFlares.push(flareParticles);
        this.scene.add(flareParticles);
    }
    createShockWave() {
        const geometry = new THREE.RingGeometry(0, 1, 32, 1);
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(this.config.coreColor),
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        this.shockWave = new THREE.Mesh(geometry, material);
        this.scene.add(this.shockWave);
    }
    
    updateParticles() {
        if (!this.nebulaParticles) return;
        
        const positions = this.nebulaParticles.geometry.attributes.position.array;
        const velocities = this.nebulaParticles.userData.velocities;
        const particleCount = positions.length / 3;
        
        for (let i = 0; i < particleCount; i++) {
            // Add turbulence
            const turbulence = this.config.turbulence;
            const noise = (Math.sin(this.time * 2 + i * 0.1) * 0.5 + 0.5) * turbulence;
            
            // Update positions
            positions[i * 3] += velocities[i * 3] * this.config.animationSpeed + noise * 0.01;
            positions[i * 3 + 1] += velocities[i * 3 + 1] * this.config.animationSpeed + noise * 0.01;
            positions[i * 3 + 2] += velocities[i * 3 + 2] * this.config.animationSpeed + noise * 0.01;
            
            // Reset particles that have moved too far
            const distance = Math.sqrt(
                positions[i * 3] ** 2 +
                positions[i * 3 + 1] ** 2 +
                positions[i * 3 + 2] ** 2
            );
            
            if (distance > this.config.expansionRadius) {
                const radius = 1 + Math.random() * 2;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                
                positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                positions[i * 3 + 2] = radius * Math.cos(phi);
                
                const speed = 0.02 + Math.random() * 0.05;
                velocities[i * 3] = (positions[i * 3] / radius) * speed;
                velocities[i * 3 + 1] = (positions[i * 3 + 1] / radius) * speed;
                velocities[i * 3 + 2] = (positions[i * 3 + 2] / radius) * speed;
            }
        }
        
        this.nebulaParticles.geometry.attributes.position.needsUpdate = true;
    }
    
    updateFlareParticles(flareParticles) {
        const positions = flareParticles.geometry.attributes.position.array;
        const velocities = flareParticles.userData.velocities;
        const particleCount = positions.length / 3;
        
        for (let i = 0; i < particleCount; i++) {
            // Update positions
            positions[i * 3] += velocities[i * 3] * this.config.animationSpeed;
            positions[i * 3 + 1] += velocities[i * 3 + 1] * this.config.animationSpeed;
            positions[i * 3 + 2] += velocities[i * 3 + 2] * this.config.animationSpeed;
            
            // Check if particle has moved too far from origin
            const distance = Math.sqrt(
                positions[i * 3] ** 2 +
                positions[i * 3 + 1] ** 2 +
                positions[i * 3 + 2] ** 2
            );
            
            if (distance > 15) {
                // Reset particle to flare origin
                const parentFlare = flareParticles.userData.parentFlare;
                const flareDirection = parentFlare.position.clone().normalize();
                
                positions[i * 3] = parentFlare.position.x;
                positions[i * 3 + 1] = parentFlare.position.y;
                positions[i * 3 + 2] = parentFlare.position.z;
                
                // Reset velocity
                const speed = 0.01 + Math.random() * 0.02;
                velocities[i * 3] = flareDirection.x * speed;
                velocities[i * 3 + 1] = flareDirection.y * speed;
                velocities[i * 3 + 2] = flareDirection.z * speed;
            }
        }
        
        flareParticles.geometry.attributes.position.needsUpdate = true;
    }
    
    setupControls() {
        // Get control elements
        const controls = {
            coreColor: document.getElementById('coreColor'),
            nebulaColor: document.getElementById('nebulaColor'),
            coreSize: document.getElementById('coreSize'),
            expansionRadius: document.getElementById('expansionRadius'),
            particleCount: document.getElementById('particleCount'),
            animationSpeed: document.getElementById('animationSpeed'),
            turbulence: document.getElementById('turbulence'),
            brightness: document.getElementById('brightness'),
            autoRotate: document.getElementById('autoRotate'),
            resetButton: document.getElementById('resetButton'),
            pauseButton: document.getElementById('pauseButton')
        };
        
        // Value displays
        const displays = {
            coreSize: document.getElementById('coreSizeValue'),
            expansionRadius: document.getElementById('expansionRadiusValue'),
            particleCount: document.getElementById('particleCountValue'),
            animationSpeed: document.getElementById('animationSpeedValue'),
            turbulence: document.getElementById('turbulenceValue'),
            brightness: document.getElementById('brightnessValue')
        };
        
        // Core color
        controls.coreColor.addEventListener('input', (e) => {
            this.config.coreColor = e.target.value;
            this.dyingStar.material.color.setHex(e.target.value.replace('#', '0x'));
            this.dyingStar.material.emissive.setHex(e.target.value.replace('#', '0x'));
            this.starGlow1.material.color.setHex(e.target.value.replace('#', '0x'));
            this.starGlow2.material.color.setHex(e.target.value.replace('#', '0x'));
            this.shockWave.material.color.setHex(e.target.value.replace('#', '0x'));
            
            // Update solar flare colors
            this.solarFlares.forEach((flare) => {
                if (flare.material) {
                    flare.material.color.setHex(e.target.value.replace('#', '0x'));
                }
            });
            
            this.updateNebulaColors();
        });
        
        // Nebula color
        controls.nebulaColor.addEventListener('input', (e) => {
            this.config.nebulaColor = e.target.value;
            this.updateNebulaColors();
        });
        
        // Core size
        controls.coreSize.addEventListener('input', (e) => {
            this.config.coreSize = parseFloat(e.target.value);
            displays.coreSize.textContent = this.config.coreSize;
            this.dyingStar.scale.setScalar(this.config.coreSize);
            this.starGlow1.scale.setScalar(this.config.coreSize * 1.3);
            this.starGlow2.scale.setScalar(this.config.coreSize * 1.8);
        });
        
        // Expansion radius
        controls.expansionRadius.addEventListener('input', (e) => {
            this.config.expansionRadius = parseInt(e.target.value);
            displays.expansionRadius.textContent = this.config.expansionRadius;
        });
        
        // Particle count
        controls.particleCount.addEventListener('input', (e) => {
            this.config.particleCount = parseInt(e.target.value);
            displays.particleCount.textContent = this.config.particleCount;
            this.recreateNebulaParticles();
        });
        
        // Animation speed
        controls.animationSpeed.addEventListener('input', (e) => {
            this.config.animationSpeed = parseFloat(e.target.value);
            displays.animationSpeed.textContent = this.config.animationSpeed;
        });
        
        // Turbulence
        controls.turbulence.addEventListener('input', (e) => {
            this.config.turbulence = parseFloat(e.target.value);
            displays.turbulence.textContent = this.config.turbulence;
        });
        
        // Brightness
        controls.brightness.addEventListener('input', (e) => {
            this.config.brightness = parseFloat(e.target.value);
            displays.brightness.textContent = this.config.brightness;
            this.nebulaParticles.material.opacity = 0.6 * this.config.brightness;
        });
        
        // Auto rotate
        controls.autoRotate.addEventListener('change', (e) => {
            this.controls.autoRotate = e.target.checked;
        });
        
        // Reset button
        controls.resetButton.addEventListener('click', () => {
            this.resetSimulation();
        });
        
        // Pause button
        controls.pauseButton.addEventListener('click', () => {
            this.isPaused = !this.isPaused;
            controls.pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
        });
    }
    
    updateNebulaColors() {
        if (!this.nebulaParticles) return;
        
        const colors = this.nebulaParticles.geometry.attributes.color.array;
        const particleCount = colors.length / 3;
        const coreColor = new THREE.Color(this.config.coreColor);
        const nebulaColor = new THREE.Color(this.config.nebulaColor);
        
        for (let i = 0; i < particleCount; i++) {
            const mixFactor = Math.random();
            const color = coreColor.clone().lerp(nebulaColor, mixFactor);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        this.nebulaParticles.geometry.attributes.color.needsUpdate = true;
    }
    
    recreateNebulaParticles() {
        if (this.nebulaParticles) {
            this.scene.remove(this.nebulaParticles);
        }
        this.createNebulaParticles();
    }
    
    resetSimulation() {
        this.time = 0;
        this.recreateNebulaParticles();
        
        // Reset shock wave
        this.shockWave.scale.setScalar(1);
        this.shockWave.material.opacity = 0.5;
        
        // Reset solar flares
        this.solarFlares.forEach((flare, index) => {
            if (flare.geometry && flare.geometry.type === 'CylinderGeometry') {
                // Reset flare mesh positions
                const angle = (index / 6) * Math.PI * 2;
                flare.position.set(
                    Math.cos(angle) * 2,
                    Math.sin(angle) * 2,
                    (Math.random() - 0.5) * 1
                );
                flare.scale.set(1, 1, 1);
            }
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        if (!this.isPaused) {
            this.time += 0.01 * this.config.animationSpeed;
            
            // Update particles
            this.updateParticles();
            
            // Animate star pulsation with more intensity
            const pulsation = 1 + Math.sin(this.time * 3) * 0.15;
            this.dyingStar.scale.setScalar(this.config.coreSize * pulsation);
            
            // Animate multiple glow layers
            this.starGlow1.scale.setScalar(this.config.coreSize * pulsation * 1.3);
            this.starGlow1.material.opacity = 0.6 + Math.sin(this.time * 2) * 0.2;
            
            this.starGlow2.scale.setScalar(this.config.coreSize * pulsation * 1.8);
            this.starGlow2.material.opacity = 0.3 + Math.sin(this.time * 1.5) * 0.15;
            
            // Animate solar flares
            this.solarFlares.forEach((flare, index) => {
                if (flare.geometry && flare.geometry.type === 'CylinderGeometry') {
                    // This is a flare mesh
                    const pulsation = Math.sin(this.time * 3 + flare.userData.pulsationPhase);
                    flare.material.opacity = flare.userData.initialIntensity * (0.5 + pulsation * 0.5);
                    
                    // Rotate flares slowly
                    flare.rotation.z += flare.userData.rotationSpeed;
                    
                    // Scale flares with pulsation
                    const scale = 1 + pulsation * 0.3;
                    flare.scale.y = scale;
                    
                    // Move flares slightly
                    const baseAngle = flare.userData.baseAngle + this.time * 0.1;
                    flare.position.x = Math.cos(baseAngle) * 2;
                    flare.position.y = Math.sin(baseAngle) * 2;
                    
                } else if (flare.userData && flare.userData.velocities) {
                    // This is flare particles
                    this.updateFlareParticles(flare);
                }
            });
            
            // Animate shock wave
            const waveScale = 1 + this.time * 2;
            this.shockWave.scale.setScalar(waveScale);
            this.shockWave.material.opacity = Math.max(0, 0.5 - this.time * 0.1);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize the simulation when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new StellarDeathSimulation();
});
