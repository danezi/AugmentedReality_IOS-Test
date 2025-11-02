import * as THREE from 'three';
// WICHTIG: Diese Imports funktionieren nur, wenn die 'importmap' in index.html korrekt definiert ist!
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

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
    scene.background = new THREE.Color(0x87ceeb); 

    // --- BELEUCHTUNG (Hohe Intensität für Sichtbarkeit) ---
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 15);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 10);
    dirLight.position.set(50, 50, 50); 
    scene.add(dirLight);


    // === 2. KAMERA & RENDERER EINRICHTEN ===
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
    // Standard-Kameraposition setzen, damit Desktop-Ansicht etwas sieht
    camera.position.set(0, 1.6, 3);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Kompatible Behandlung von Color/Encoding für verschiedene Three.js-Versionen
    if ('outputColorSpace' in renderer && typeof THREE.SRGBColorSpace !== 'undefined') {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else {
        renderer.outputEncoding = THREE.sRGBEncoding;
    }


    // === 3. WEBXR FÜR AR AKTIVIEREN (Stabile Initialisierung) ===
    renderer.xr.enabled = true; 
    
    // Die Features 'local' und 'hit-test' sind notwendig für die Platzierung in AR
    document.body.appendChild( ARButton.createButton( renderer, { 
        requiredFeatures: [ 'local', 'hit-test' ], 
        optionalFeatures: [ 'dom-overlay' ]
    } ) );


    // === 4. GLB-MODELL LADEN & DYNAMISCH ANPASSEN (Optimierte Skalierung) ===
    const loader = new GLTFLoader(); 
    
    loader.load( 
        './3DModel/neuerHafen.glb', 
        function ( gltf ) {
            model = gltf.scene;
            
            // --- DYNAMISCHE SKALIERUNG & ZENTRIERUNG ---
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());   
            const center = box.getCenter(new THREE.Vector3()); 
            
            // 1. Skalierung: Setzt die größte Dimension auf 1.0 Meter (kann angepasst werden)
            const targetSize = 1.0; 
            const maxDim = Math.max(size.x, size.y, size.z);
            const scaleFactor = targetSize / maxDim;
            model.scale.set(scaleFactor, scaleFactor, scaleFactor);

            // Nach Skalierung Box neu berechnen
            box.setFromObject(model);
            const scaledSize = box.getSize(new THREE.Vector3());
            
            // 2. AR-Positionierung: Verschiebt den Ankerpunkt des Modells so, 
            // dass die Unterkante des Modells auf y=0 (virtueller Boden) liegt.
            // Das Modell wird ZENTRIERT und auf dem Boden platziert.
            model.position.set(
                -center.x * scaleFactor, 
                -center.y * scaleFactor + (scaledSize.y / 2), 
                -center.z * scaleFactor
            ); 

            scene.add( model );

            // Das Modell ist anfangs unsichtbar, bis es in der AR-Sitzung platziert wird.
            model.visible = false; 

        }, 
        undefined, 
        function ( error ) {
            console.error( 'Fehler beim Laden der GLB:', error );
        } 
    );
    
    document.body.appendChild(renderer.domElement);
    window.addEventListener( 'resize', onWindowResize, false );
    
    // --- AR-Platzierungslogik hinzufügen ---
    renderer.xr.addEventListener('sessionstart', onSessionStart);
    renderer.xr.addEventListener('sessionend', onSessionEnd);
    
    // --- INTERAKTION EINRICHTEN ---
    infoBox = document.getElementById('info-box');
    infoContent = document.getElementById('info-content');
    // Falls die Info-Box im HTML fehlt, sicherheitshalber erzeugen
    if (!infoBox) {
        infoBox = document.createElement('div');
        infoBox.id = 'info-box';
        infoBox.style.position = 'absolute';
        infoBox.style.background = 'rgba(255,255,255,0.9)';
        infoBox.style.padding = '8px';
        infoBox.style.borderRadius = '4px';
        infoBox.style.display = 'none';
        document.body.appendChild(infoBox);
    }
    if (!infoContent) {
        infoContent = document.createElement('div');
        infoContent.id = 'info-content';
        infoBox.appendChild(infoContent);
    }
    window.addEventListener('click', onPointerClick);
    
    renderer.setAnimationLoop( render ); 
}


// Neue Funktion: Wird ausgeführt, wenn die AR-Sitzung startet
function onSessionStart() {
    // Da wir 'hit-test' verwenden, muss das Modell beim Start unsichtbar bleiben,
    // bis wir eine Oberfläche erkannt haben.
    if (model) {
        model.visible = false; 
    }
}

// Neue Funktion: Wird ausgeführt, wenn die AR-Sitzung endet
function onSessionEnd() {
    // Macht das Modell wieder sichtbar, wenn wir in den Desktop-Modus zurückkehren.
    if (model) {
        model.visible = true;
    }
}

// ... (Restliche Funktionen) ...

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onPointerClick(event) {
    // Wenn in AR, soll der Klick das Modell platzieren
    if (renderer.xr.isPresenting) {
        // HIER MÜSSTE DIE LOGIK ZUR PLATZIERUNG DES MODELLS AUF EINER ERKANNTEN OBERFLÄCHE HIN
        // Da diese Logik fehlt, bleibt das Modell unsichtbar!
        
        if (model && !model.visible) {
            // EINE EINFACHE LÖSUNG OHNE KOMPLEXEN HIT-TEST: Modell vor die Kamera setzen
            const position = new THREE.Vector3();
            camera.getWorldPosition(position);
            
            // Setze das Modell 5 Meter VOR die Kamera und auf den Boden (y=0)
            model.position.set(position.x, 0, position.z - 5); 
            model.visible = true;
        }
        return;
    }
    
    // [Die gesamte Desktop-Klick-Interaktionslogik bleibt hier]
    // ...
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    if (!model) return;
    const intersects = raycaster.intersectObjects(model.children, true);

    if (intersects.length > 0) {
        const hitPoint = intersects[0].point; 
        const tempVector = new THREE.Vector3().copy(hitPoint);
        tempVector.project(camera);

        let x = (tempVector.x * 0.5 + 0.5) * window.innerWidth;
        let y = (-tempVector.y * 0.5 + 0.5) * window.innerHeight;
        x += 20; 
        y -= 20; 

        const daten = {
            Name: "Neuer Hafen",
            Ort: "Bremen/Bremerhaven",
            "3D_Format": "GLB",
            Hinweis: "Interaktion nur Desktop-Ansicht."
        };
        // ... (Füllen der Info-Box) ...
        let htmlContent = `<b>${daten.Name}</b><hr>`;
        for (const [key, value] of Object.entries(daten)) {
            htmlContent += `<b>${key}:</b> ${value}<br>`;
        }
        infoContent.innerHTML = htmlContent;
        infoBox.style.left = `${x}px`;
        infoBox.style.top = `${y}px`;
        infoBox.style.display = 'block';

    } else {
        infoBox.style.display = 'none';
    }
}


function render() {
    if (model && !renderer.xr.isPresenting) {
         model.rotation.y += 0.002; 
    }
    renderer.render( scene, camera );
}