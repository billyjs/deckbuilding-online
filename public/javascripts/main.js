let camera, scene, renderer;
let meshes;

const BOARD_HEIGHT = 55;
const BOARD_WIDTH = 88; // aspect ration 16:10

const SECTION_HEIGHT = BOARD_HEIGHT / 5; // 20% of height of board for each section

const CARD_HEIGHT = 10;
const CARD_WIDTH = CARD_HEIGHT * 5 / 7; // keep 5:7 ratio normal cards have

let textures = {};

/* =============== LOADING SCREEN AND MANAGER ================================================== */


let loadingScreen = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 100),
    box: new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: 0x4444ff })
    )
};

let loadingManager = null;
let RESOURCES_LOADED = false;


/* ============================================================================================= */

function init() {

    // loading screen init

    loadingScreen.box.position.set(0, 0, 5);
    loadingScreen.camera.lookAt(loadingScreen.box.position);
    loadingScreen.scene.add(loadingScreen.box);

    // loading manager init

    loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (item, loaded, total) => {
        console.log(item, loaded, total);
    };
    loadingManager.onLoad = () => {
        console.log("Loaded all resources.");
        socket.emit("loaded");
        RESOURCES_LOADED = true;
    };

    // load images

    let textureLoader = new THREE.TextureLoader(loadingManager);

    // TODO: load textures from a file
    textures.back = textureLoader.load("../images/back.png");
    textures.viper = textureLoader.load("../images/viper.png");
    textures.scout = textureLoader.load("../images/scout.png");
    textures.undef = textureLoader.load("../images/undef.png");
    textures.empty = textureLoader.load("../images/empty.png");

    // game scene init

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 100);
    camera.position.z = 40;

    scene = new THREE.Scene();

    // playing board
    let geometry = new THREE.PlaneGeometry(BOARD_WIDTH, BOARD_HEIGHT);
    let material = new THREE.MeshBasicMaterial({ color: 0xfefefe, side: THREE.DoubleSide });

    let board = new THREE.Mesh(geometry, material);
    scene.add(board);

    // board sections
    geometry = new THREE.PlaneGeometry(BOARD_WIDTH, SECTION_HEIGHT);
    material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });

    let section = new THREE.Mesh(geometry, material);
    section.position.y = -2 * SECTION_HEIGHT;
    scene.add(section);

    material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });

    section = new THREE.Mesh(geometry, material);
    section.position.y = 2 * SECTION_HEIGHT;
    scene.add(section);

    material = new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide });

    section = new THREE.Mesh(geometry, material);
    scene.add(section);

    meshes = {
        player: {
            hand: null,
            deck: null,
            discard: null,
            inplay: null,
        },
        opponent: {
            hand: null,
            deck: null,
            discard: null,
            inplay: null
        }
    };

    // testing code

    // displayDeck(10);
    // displayHand([null,null,null, null], 0, -2 * SECTION_HEIGHT);

    //

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    animate();

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('click', onMouseDownEvent, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {

    if (RESOURCES_LOADED === false) {
        requestAnimationFrame(animate);
        renderer.render(loadingScreen.scene, loadingScreen.camera);
        return;
    }

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function displayInplay(cards, self) {

    let player = self ? "player" : "opponent";

    if (meshes[player].inplay) {
        meshes[player].inplay.forEach((mesh) => {
            scene.remove(mesh);
        });
    }

    meshes[player].inplay = displayRow(cards, 0, (self ? -1 : 1) * SECTION_HEIGHT);

}

function displayHand(cards, self) {

    let player = self ? "player" : "opponent";

    if (meshes[player].hand) {
        meshes[player].hand.forEach((mesh) => {
            scene.remove(mesh);
        });
    }
    meshes[player].hand = displayRow(cards, 0, (self ? -2 : 2) * SECTION_HEIGHT);
}

function displayDeck(card, self) {

    let player = self ? "player" : "opponent";

    if (meshes[player].deck) {
        scene.remove(meshes[player].deck);
    }
    meshes[player].deck = displayCard(card, self ? 39 - CARD_WIDTH : -39 + CARD_WIDTH, (self ? -2 : 2) * SECTION_HEIGHT);
}

function displayDiscard(card, self) {

    let player = self ? "player" : "opponent";

    if (meshes[player].discard) {
        scene.remove(meshes[player].discard);
    }
    meshes[player].discard = displayCard(card, self ? 40 : -40, (self ? -2 : 2) * SECTION_HEIGHT);
}

function displayRow(cards, x, y) {

    let meshes = [];

    if (!Array.isArray(cards)) {
        cards = Array(cards).fill({ back: true });
    }

    let spacing = 1;
    let length = cards.length || 1;
    let width = length * CARD_WIDTH + (length - 1) * spacing;
    let x1 = x - (width - CARD_WIDTH) / 2;
    let y1 = y;


    cards.forEach((card) => {
        meshes.push(displayCard(card, x1, y1));

        // spread cards horizontally
        x1 += CARD_WIDTH + spacing;
        y1 += 0;
    });

    return meshes;
}

function displayPile(card, x, y) {

    let mesh = displayCard(card, x, y);
    // display pile count text

    return mesh;
}

function displayCard(card, x, y) {
    const cardHeight = 10;
    const cardWidth = cardHeight * 5 / 7;
    const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight);
    let texture, color, callback;


    if (card.count === 0) {
        texture = textures.empty;
        color = null;
        callback = function() {};
    } else if (card.back) {
        texture = textures.back;
        color = null;
        callback = function() {};
    } else if (card.name) {
        texture = textures[card.name.toLowerCase()];
        texture = texture ? texture : textures.undef;
        color = 0xffff00;
        callback = function() {
            let reset = this.position.z !== 0;
            meshes.player.hand.forEach(m => {
                m.material.color.setHex(0xffff00);
                m.position.z = 0;
                m.position.y = y;
            });
            if (!reset) {
                this.material.color.setHex(0xff0000);
                this.position.z = 5;
                this.position.y += 3;
            }
        };
    } else {
        return;
    }
    const material = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.FrontSide,
        map: texture,
        transparent: true
    });

    let mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    mesh.position.x = x;
    mesh.position.y = y;
    mesh.callback = callback.bind(mesh);

    return mesh;
}

function onMouseDownEvent(event) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    event.preventDefault();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableMeshes());
    if (intersects.length > 0) {
        intersects[0].object.callback();
    }

}

function clickableMeshes() {
    if (meshes.player.hand) {
        return meshes.player.hand;
    }

    return null;
}

window.onload = init;

