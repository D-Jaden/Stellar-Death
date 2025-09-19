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
        this.nebulaRings = [];
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
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
        
        // Create nebula rings
        this.createNebulaRings();
        
        // Create shock wave
        this.createShockWave();
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createDyingStar() {
        // Core of the dying star
        const coreGeometry = new THREE.SphereGeometry(1, 32, 32);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(this.config.coreColor),
            transparent: true,
            opacity: 0.9
        });
        
        this.dyingStar = new THREE.Mesh(coreGeometry, coreMaterial);
        this.scene.add(this.dyingStar);
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(this.config.coreColor),
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        this.starGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.scene.add(this.starGlow);
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
            size: 0.3, // Much smaller particles
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
    
    createNebulaRings() {
        // Create multiple concentric rings at different distances
        const ringConfigs = [
            { innerRadius: 3, outerRadius: 4, opacity: 0.4, speed: 1 },
            { innerRadius: 6, outerRadius: 8, opacity: 0.3, speed: 0.8 },
            { innerRadius: 10, outerRadius: 13, opacity: 0.2, speed: 0.6 },
            { innerRadius: 15, outerRadius: 18, opacity: 0.15, speed: 0.4 }
        ];
        
        ringConfigs.forEach((config, index) => {
            // Main ring
            const geometry = new THREE.RingGeometry(config.innerRadius, config.outerRadius, 64, 1);
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color(this.config.nebulaColor),
                transparent: true,
                opacity: config.opacity,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const ring = new THREE.Mesh(geometry, material);
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;
            ring.rotation.z = Math.random() * Math.PI;
            ring.userData = { 
                originalOpacity: config.opacity,
                rotationSpeed: config.speed * 0.01,
                pulsationPhase: index * Math.PI / 2
            };
            
            this.nebulaRings.push(ring);
            this.scene.add(ring);
            
            // Add a second ring with different orientation for more complexity
            const ring2 = ring.clone();
            ring2.rotation.x += Math.PI / 3;
            ring2.rotation.y += Math.PI / 4;
            ring2.material = material.clone();
            ring2.material.opacity = config.opacity * 0.7;
            ring2.userData = {
                originalOpacity: config.opacity * 0.7,
                rotationSpeed: -config.speed * 0.008,
                pulsationPhase: (index + 2) * Math.PI / 3
            };
            
            this.nebulaRings.push(ring2);
            this.scene.add(ring2);
        });
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
            this.starGlow.material.color.setHex(e.target.value.replace('#', '0x'));
            this.shockWave.material.color.setHex(e.target.value.replace('#', '0x'));
            this.updateNebulaColors();
        });
        
        // Nebula color
        controls.nebulaColor.addEventListener('input', (e) => {
            this.config.nebulaColor = e.target.value;
            this.updateNebulaColors();
            // Update ring colors
            this.nebulaRings.forEach(ring => {
                ring.material.color.setHex(e.target.value.replace('#', '0x'));
            });
        });
        
        // Core size
        controls.coreSize.addEventListener('input', (e) => {
            this.config.coreSize = parseFloat(e.target.value);
            displays.coreSize.textContent = this.config.coreSize;
            this.dyingStar.scale.setScalar(this.config.coreSize);
            this.starGlow.scale.setScalar(this.config.coreSize * 1.5);
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
        
        // Reset rings
        this.nebulaRings.forEach(ring => {
            ring.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            ring.scale.setScalar(1);
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
            
            // Animate star pulsation
            const pulsation = 1 + Math.sin(this.time * 3) * 0.1;
            this.dyingStar.scale.setScalar(this.config.coreSize * pulsation);
            
            // Animate glow
            this.starGlow.scale.setScalar(this.config.coreSize * pulsation * 1.5);
            this.starGlow.material.opacity = 0.3 + Math.sin(this.time * 2) * 0.1;
            
            // Animate nebula rings
            this.nebulaRings.forEach(ring => {
                // Rotation
                ring.rotation.z += ring.userData.rotationSpeed;
                ring.rotation.x += ring.userData.rotationSpeed * 0.5;
                
                // Pulsation effect
                const pulsation = Math.sin(this.time * 2 + ring.userData.pulsationPhase);
                ring.material.opacity = ring.userData.originalOpacity * this.config.brightness * (0.7 + pulsation * 0.3);
                
                // Slight scale variation
                const scale = 1 + pulsation * 0.05;
                ring.scale.setScalar(scale);
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
