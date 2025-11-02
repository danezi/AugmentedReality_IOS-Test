import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'https://unpkg.com/three@0.158.0/examples/jsm/webxr/ARButton.js';

// Globale Variablen für Three.js und Interaktion
let camera, scene, renderer;
let model; 
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let infoBox = null; 
let infoContent = null;

init(); 

function init() {
    // === 1. BASIS-SZENE EINRICHTEN ===
    scene = new THREE.Scene();
    
    // Hintergrundfarbe für den Desktop-Modus
    scene.background = new THREE.Color(0x87ceeb); 

    // --- BELEUCHTUNG ---
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 10);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 5); 
    dirLight.position.set(50, 50, 50); 
    scene.add(dirLight);


    // === 2. KAMERA & RENDERER EINRICHTEN ===
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace; 


    // === 3. WEBXR FÜR AR AKTIVIEREN (Wichtigste Korrektur für Android/WebXR) ===
    renderer.xr.enabled = true; 
    
    // Die Features 'local' und 'hit-test' sind weniger restriktiv als 'local-floor' 
    // und erhöhen die Stabilität der AR-Sitzung, besonders auf Android.
    document.body.appendChild( ARButton.createButton( renderer, { 
        requiredFeatures: [ 'local' ],
        optionalFeatures: [ 'dom-overlay', 'hit-test' ] // Hit-Test für die spätere Platzierung
    } ) );


    // === 4. GLB-MODELL LADEN & DYNAMISCH ANPASSEN ===
    const loader = new GLTFLoader(); 
    
    // Wichtig: Der korrekte Pfad zu Ihrem Model 'neuerHafen.glb'
    loader.load( 
        './3DModel/neuerHafen.glb', 
        function ( gltf ) {
            model = gltf.scene;
            
            // --- DYNAMISCHE KAMERA-ANPASSUNG (Desktop-Ansicht) ---
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());   
            const center = box.getCenter(new THREE.Vector3()); 
            
            // 1. Skalierung (Skaliert das Modell auf ca. 0.5 Meter in der größten Dimension)
            const targetSize = 0.5; 
            const maxDim = Math.max(size.x, size.y, size.z);
            const scaleFactor = targetSize / maxDim;
            model.scale.set(scaleFactor, scaleFactor, scaleFactor);

            // Nach Skalierung Box neu berechnen
            box.setFromObject(model);
            size.copy(box.getSize(new THREE.Vector3()));
            center.copy(box.getCenter(new THREE.Vector3()));
            
            // 2. Kamera-Abstand und Position (Desktop-Ansicht):
            const camDistance = Math.max(size.x, size.y, size.z) * 1.5; 
            camera.position.set(center.x, center.y + camDistance * 0.5, center.z + camDistance);
            camera.lookAt(center);
            
            // 3. AR-Positionierung: Verschiebt den Ankerpunkt des Modells zur Mitte des Bodens.
            // Sobald AR gestartet wird, wird der Anker bei (0,0,0) in der AR-Umgebung platziert.
            model.position.set(-center.x, -center.y + (size.y / 2) * scaleFactor, -center.z); 

            scene.add( model );

        }, 
        undefined, 
        function ( error ) {
            console.error( 'Fehler beim Laden der GLB:', error );
        } 
    );
    
    document.body.appendChild(renderer.domElement);
    window.addEventListener( 'resize', onWindowResize, false );
    
    // --- INTERAKTION EINRICHTEN ---
    infoBox = document.getElementById('info-box');
    infoContent = document.getElementById('info-content');
    window.addEventListener('click', onPointerClick);
    
    // Startet den Animations-Loop
    renderer.setAnimationLoop( render ); 
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onPointerClick(event) {
    // Klick-Interaktion nur im Desktop-Modus aktiv
    if (renderer.xr.isPresenting) {
        return; 
    }
    
    // Normalisierung der Mauskoordinaten für Raycasting
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);

    if (!model) return;
    
    // Suche nach Treffern im geladenen Modell (rekursiv)
    const intersects = raycaster.intersectObjects(model.children, true);

    if (intersects.length > 0) {
        // Ein Objekt wurde getroffen.
        const hitPoint = intersects[0].point; 

        // --- 1. 3D-POSITION IN 2D-BILDSCHIRMKOORDINATE UMWANDELN ---
        const tempVector = new THREE.Vector3().copy(hitPoint);
        tempVector.project(camera);

        let x = (tempVector.x * 0.5 + 0.5) * window.innerWidth;
        let y = (-tempVector.y * 0.5 + 0.5) * window.innerHeight;

        // Position der Info-Box anpassen
        x += 20; 
        y -= 20; 

        // 2. Info-Box befüllen
        const daten = {
            Name: "Neuer Hafen",
            Ort: "Bremen/Bremerhaven",
            "3D_Format": "GLB",
            Hinweis: "Interaktion nur Desktop-Ansicht."
        };

        let htmlContent = `<b>${daten.Name}</b><hr>`;
        for (const [key, value] of Object.entries(daten)) {
            htmlContent += `<b>${key}:</b> ${value}<br>`;
        }
        
        infoContent.innerHTML = htmlContent;
        
        // Positionierung der Info-Box
        infoBox.style.left = `${x}px`;
        infoBox.style.top = `${y}px`;
        infoBox.style.display = 'block';

    } else {
        // Nichts getroffen -> Info-Box ausblenden
        infoBox.style.display = 'none';
    }
}


function render() {
    // Lässt das Modell im Desktop-Modus rotieren, wenn keine AR-Sitzung aktiv ist.
    if (model && !renderer.xr.isPresenting) {
         model.rotation.y += 0.002; 
    }
    renderer.render( scene, camera );
}