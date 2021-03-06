/* global THREE, socket, layout, labels */

let camera, scene, renderer;
let meshes, outlines;

const BOARD_HEIGHT = 55;
const BOARD_WIDTH = 88; // aspect ration 16:10

const SECTION_HEIGHT = BOARD_HEIGHT / 5; // 20% of height of board for each section

const CARD_HEIGHT = 10;
const CARD_WIDTH = (CARD_HEIGHT * 5) / 7; // keep 5:7 ratio normal cards have

let textures = {
	cards: {
		small: {},
		large: {}
	},
	actions: {},
	displays: {}
};

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
	loadingManager.onLoad = () => {
		socket.emit("loaded");
		RESOURCES_LOADED = true;
	};

	// load images

	let textureLoader = new THREE.TextureLoader(loadingManager);

	Object.keys(layout.textures.cards.small).forEach(key => {
		let value = layout.textures.cards.small[key];
		textures.cards.small[key] = textureLoader.load(value);
	});

	Object.keys(layout.textures.actions).forEach(key => {
		let value = layout.textures.actions[key];
		textures.actions[key] = textureLoader.load(value);
	});

	Object.keys(layout.textures.displays).forEach(key => {
		let value = layout.textures.displays[key];
		textures.displays[key] = textureLoader.load(value);
	});

	// game scene init

	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 100);
	camera.position.z = 40;

	scene = new THREE.Scene();

	// playing board
	let geometry = new THREE.PlaneGeometry(BOARD_WIDTH, BOARD_HEIGHT);
	let material = new THREE.MeshBasicMaterial({
		color: 0xfefefe,
		side: THREE.DoubleSide
	});

	let board = new THREE.Mesh(geometry, material);
	// scene.add(board);
	board.position.z = -1;

	// board sections
	geometry = new THREE.PlaneGeometry(BOARD_WIDTH, SECTION_HEIGHT);
	material = new THREE.MeshBasicMaterial({
		color: 0x00ff00,
		side: THREE.DoubleSide
	});

	let section = new THREE.Mesh(geometry, material);
	section.position.y = -2 * SECTION_HEIGHT;
	// scene.add(section);

	material = new THREE.MeshBasicMaterial({
		color: 0xff0000,
		side: THREE.DoubleSide
	});

	section = new THREE.Mesh(geometry, material);
	section.position.y = 2 * SECTION_HEIGHT;
	// scene.add(section);

	material = new THREE.MeshBasicMaterial({
		color: 0x0000ff,
		side: THREE.DoubleSide
	});

	section = new THREE.Mesh(geometry, material);
	// scene.add(section);

	meshes = {
		areas: {},
		player: {
			hand: null,
			deck: null,
			discard: null,
			inplay: null
		},
		opponent: {
			hand: null,
			deck: null,
			discard: null,
			inplay: null
		},
		piles: {},
		rows: {}
	};

	outlines = [];

	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	animate();

	window.addEventListener("resize", onWindowResize, false);
	window.addEventListener("click", onMouseDownEvent, false);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	if (labels) {
		let children = labels.children;
		for (let i = 0; i < children.length; i++) {
			let child = children[i];
			let height = child.getAttribute("data-height");
			let width = child.getAttribute("data-width");
			let p1 = pointToScreen(
				child.getAttribute("data-x") - width / 2,
				child.getAttribute("data-y") - height / 2,
				child.getAttribute("data-z")
			);
			let p2 = pointToScreen(
				parseFloat(child.getAttribute("data-x")) + width / 2,
				parseFloat(child.getAttribute("data-y")) + height / 2,
				child.getAttribute("data-z")
			);
			child.style.bottom = p1.y + "px";
			child.style.left = p1.x + "px";
			child.style.width = p2.x - p1.x + "px";
			child.style.height = p2.y - p1.y + "px";
		}
	}
	if (opponentLabels) {
		let children = opponentLabels.children;
		for (let i = 0; i < children.length; i++) {
			let child = children[i];
			let height = child.getAttribute("data-height");
			let width = child.getAttribute("data-width");
			let p1 = pointToScreen(
				child.getAttribute("data-x") - width / 2,
				child.getAttribute("data-y") - height / 2,
				child.getAttribute("data-z")
			);
			let p2 = pointToScreen(
				parseFloat(child.getAttribute("data-x")) + width / 2,
				parseFloat(child.getAttribute("data-y")) + height / 2,
				child.getAttribute("data-z")
			);
			child.style.bottom = p1.y + "px";
			child.style.left = p1.x + "px";
			child.style.width = p2.x - p1.x + "px";
			child.style.height = p2.y - p1.y + "px";
		}
	}
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

// eslint-disable-next-line no-unused-vars
function displayInplay(cards, self) {
	let player = self ? "player" : "opponent";

	if (meshes[player].inplay) {
		meshes[player].inplay.forEach(mesh => {
			scene.remove(mesh);
		});
	}

	meshes[player].inplay = displayRow(cards, 0, (self ? -1 : 1) * SECTION_HEIGHT);
}

// eslint-disable-next-line no-unused-vars
function displayHand(cards, self) {
	let player = self ? "player" : "opponent";

	if (meshes[player].hand) {
		meshes[player].hand.forEach(mesh => {
			scene.remove(mesh);
		});
	}
	meshes[player].hand = displayRow(cards, 0, (self ? -2 : 2) * SECTION_HEIGHT);
}

// eslint-disable-next-line no-unused-vars
function displayDeck(card, self) {
	let player = self ? "player" : "opponent";

	if (meshes[player].deck) {
		scene.remove(meshes[player].deck);
	}
	// meshes[player].deck = displayCard(card, self ? 39 - CARD_WIDTH : -39 + CARD_WIDTH, (self ? -2 : 2) * SECTION_HEIGHT);
	meshes[player].deck = displayPile(
		card,
		self ? 39 - CARD_WIDTH : -39 + CARD_WIDTH,
		(self ? -2 : 2) * SECTION_HEIGHT,
		null,
		self ? labels : opponentLabels
	);
}

// eslint-disable-next-line no-unused-vars
function displayDiscard(card, self) {
	let player = self ? "player" : "opponent";

	if (meshes[player].discard) {
		scene.remove(meshes[player].discard);
	}
	// meshes[player].discard = displayCard(card, self ? 40 : -40, (self ? -2 : 2) * SECTION_HEIGHT);
	meshes[player].discard = displayPile(
		card,
		self ? 40 : -40,
		(self ? -2 : 2) * SECTION_HEIGHT,
		null,
		self ? labels : opponentLabels
	);
}

function displayRow(cards, x, y, target) {
	if (target && meshes.rows[target]) {
		meshes.rows[target].forEach(mesh => {
			scene.remove(mesh);
		});
	}

	let _meshes = [];

	if (!Array.isArray(cards)) {
		cards = Array(cards).fill({ back: true });
	}

	let spacing = 1;
	let length = cards.length || 1;
	let width = length * CARD_WIDTH + (length - 1) * spacing;
	let x1 = x - (width - CARD_WIDTH) / 2;
	let y1 = y;

	cards.forEach(card => {
		_meshes.push(displayCard(card, x1, y1));

		// spread cards horizontally
		x1 += CARD_WIDTH + spacing;
		y1 += 0;
	});

	meshes.rows[target] = _meshes;
	return _meshes;
}

function displayPile(card, x, y, target, element) {
	if (target && meshes.piles[target]) {
		scene.remove(meshes.piles[target]);
	}
	let mesh = displayCard(card, x, y);
	// display pile count text
	// const labels = document.getElementById("labels");
	if (element && card.count !== undefined) {
		let elem = document.createElement("span");
		elem.innerHTML = "<p class='large'>" + card.count + "</p>";
		elem.style.position = "fixed";
		let p1 = pointToScreen(
			mesh.position.x - CARD_WIDTH / 2,
			mesh.position.y - CARD_HEIGHT / 2,
			mesh.position.z
		);
		let p2 = pointToScreen(
			mesh.position.x + CARD_WIDTH / 2,
			mesh.position.y + CARD_HEIGHT / 2,
			mesh.position.z
		);
		elem.style.bottom = p1.y + "px";
		elem.style.left = p1.x + "px";
		elem.style.width = p2.x - p1.x + "px";
		elem.style.height = p2.y - p1.y + "px";
		elem.setAttribute("data-x", mesh.position.x);
		elem.setAttribute("data-y", mesh.position.y);
		elem.setAttribute("data-z", mesh.position.z);
		elem.setAttribute("data-height", CARD_HEIGHT.toString());
		elem.setAttribute("data-width", CARD_WIDTH.toString());
		element.appendChild(elem);
	}

	if (target) {
		meshes.piles[target] = mesh;
	}
	return mesh;
}

function displayCard(card, x, y) {
	const cardHeight = 10;
	const cardWidth = (cardHeight * 5) / 7;
	const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight);
	let texture, color, callback, reset;

	color = null;
	callback = function() {
		if (this.position.z !== 0) {
			// if (this.actions.length > 0) {
			//     this.actions[0].callback();
			// }
		} else {
			clickableMeshes().forEach(m => {
				m.reset();
			});

			this.position.z = 2;
			this.position.y *= 0.9;
			this.position.x *= 0.95;

			// show menu
			let menuGeometry = new THREE.PlaneGeometry(cardWidth, 2);
			let menuMaterial = null;

			this.menu = [];

			this.actions.forEach(action => {
				if (!this.menu) {
					this.menu = [];
				}

				let texture = null;

				switch (action.action) {
					case "ability":
						texture = textures.actions[action.ability] || textures.actions.undef;
						break;
					default:
						texture = textures.actions[action.action] || textures.actions.undef;
						break;
				}
				menuMaterial = new THREE.MeshBasicMaterial({ map: texture });
				let menuItem = new THREE.Mesh(menuGeometry, menuMaterial);
				menuItem.reset = function() {};
				menuItem.callback = function() {
					clickableMeshes().forEach(m => {
						m.reset();
					});
					action.callback();
				};
				this.menu.push(menuItem);
				this.add(menuItem);
				menuItem.position.y = CARD_HEIGHT / 2 + 1 + 2 * (this.menu.length - 1);
			});

			// let menuGeometry = new THREE.PlaneGeometry(cardWidth, 2 * this.actions.length);
			// let menuMaterial = new THREE.MeshBasicMaterial({ color: 0x11ff11, map: textures.play });
			// let menu = new THREE.Mesh(menuGeometry, menuMaterial);
			// menu.reset = function() {};
			// menu.callback = function() {
			//     clickableMeshes().forEach(m => {
			//         m.reset();
			//     });
			//     console.log("CLICKED");
			// };
			// this.menu = menu;
			// this.add(menu);
			// menu.position.y = CARD_HEIGHT / 2 + this.actions.length;
		}
	};
	reset = function() {
		this.material.color.setHex(0xffffff);
		this.position.z = 0;
		this.position.y = y;
		this.position.x = x;
		if (this.menu) {
			this.menu.forEach(menuItem => {
				this.remove(menuItem);
			});
			delete this.menu;
		}
	};

	if (card.count === 0) {
		texture = textures.cards.small.empty;
	} else if (card.back) {
		texture = textures.cards.small.back;
	} else if (card.name) {
		texture = textures.cards.small[card.name.toLowerCase()];
		texture = texture ? texture : textures.cards.small.undef;

		reset = function() {
			this.position.z = 0;
			this.position.y = y;
			this.position.x = x;
			if (this.menu) {
				this.menu.forEach(menuItem => {
					this.remove(menuItem);
				});
				delete this.menu;
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
	mesh.reset = reset.bind(mesh);

	return mesh;
}

// eslint-disable-next-line no-unused-vars
function displayLabel(x, y, z, width, height, content, element) {
	if (!element) {
		return;
	} // if there is no labels variable it is not loaded yet so don't make labels
	let elem = document.createElement("span");
	elem.innerHTML = content;
	elem.style.position = "fixed";
	let p1 = pointToScreen(x - width / 2, y - height / 2, z);
	let p2 = pointToScreen(x + width / 2, y + height / 2, z);
	elem.style.bottom = p1.y + "px";
	elem.style.left = p1.x + "px";
	elem.style.width = p2.x - p1.x + "px";
	elem.style.height = p2.y - p1.y + "px";
	elem.setAttribute("data-x", x);
	elem.setAttribute("data-y", y);
	elem.setAttribute("data-z", z);
	elem.setAttribute("data-height", height);
	elem.setAttribute("data-width", width);
	element.appendChild(elem);
}

// eslint-disable-next-line no-unused-vars
function createPlane(x, y, z, width, height, color, texture) {
	const geometry = new THREE.PlaneGeometry(width, height);
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
	mesh.position.z = z;

	return mesh;
}

// eslint-disable-next-line no-unused-vars
function removeMesh(mesh) {
	scene.remove(mesh);
}

function onMouseDownEvent(event) {
	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();

	event.preventDefault();
	mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
	mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);
	let clickable = clickableMeshes();
	let intersects = raycaster.intersectObjects(clickable);
	if (intersects.length > 0) {
		intersects[0].object.callback();
	} else {
		clickable.forEach(mesh => {
			mesh.reset();
		});
	}
}

function clickableMeshes() {
	let clickable = [];

	Object.keys(meshes).forEach(key => {
		Object.keys(meshes[key]).forEach(key2 => {
			if (!Array.isArray(meshes[key][key2])) {
				if (
					meshes[key][key2] &&
					meshes[key][key2].actions &&
					meshes[key][key2].actions.length !== 0
				) {
					clickable.push(meshes[key][key2]);
					if (meshes[key][key2].menu) {
						meshes[key][key2].menu.forEach(menuItem => {
							clickable.push(menuItem);
						});
					}
				}
			} else if (meshes[key][key2]) {
				meshes[key][key2].forEach(mesh => {
					if (mesh.actions && mesh.actions.length !== 0) {
						clickable.push(mesh);
						if (mesh.menu) {
							mesh.menu.forEach(menuItem => {
								clickable.push(menuItem);
							});
						}
					}
				});
			}
		});
	});

	return clickable;
}

// eslint-disable-next-line no-unused-vars
function resetClickableMeshes() {
	Object.keys(meshes).forEach(key => {
		Object.keys(meshes[key]).forEach(key2 => {
			if (meshes[key][key2] && !Array.isArray(meshes[key][key2])) {
				meshes[key][key2].actions = [];
			} else if (meshes[key][key2]) {
				meshes[key][key2].forEach(mesh => {
					mesh.actions = [];
				});
			}
		});
	});
}

function highlightMeshes() {
	outlines.forEach(outline => {
		scene.remove(outline);
	});
	outlines = [];
	Object.keys(meshes).forEach(key => {
		Object.keys(meshes[key]).forEach(key2 => {
			if (meshes[key][key2] && !Array.isArray(meshes[key][key2])) {
				if (meshes[key][key2].actions && meshes[key][key2].actions.length > 0) {
					// make highlights
					let material = new THREE.MeshBasicMaterial({
						color: 0xff7700,
						transparent: true,
						opacity: 0.7
					});
					let mesh = new THREE.Mesh(meshes[key][key2].geometry, material);
					scene.add(mesh);
					mesh.position.copy(meshes[key][key2].position);
					mesh.position.z -= 0.01;
					mesh.scale.multiplyScalar(1.05);
					console.log(mesh.position, meshes[key][key2].position);
					outlines.push(mesh);
				}
			} else if (meshes[key][key2]) {
				meshes[key][key2].forEach(mesh => {
					if (mesh.actions && mesh.actions.length > 0) {
						// make highlights
						let material = new THREE.MeshBasicMaterial({
							color: 0xff7700,
							transparent: true,
							opacity: 0.7
						});
						let outline = new THREE.Mesh(mesh.geometry, material);
						scene.add(outline);
						outline.position.copy(mesh.position);
						outline.position.z -= 0.01;
						outline.scale.multiplyScalar(1.05);
						outlines.push(outline);
					}
				});
			}
		});
	});
}

function pointToScreen(x, y, z) {
	let p3D, p2D;
	p3D = new THREE.Vector3(parseFloat(x), parseFloat(y), parseFloat(z));
	p2D = p3D.project(camera);
	p2D.x = ((p2D.x + 1) / 2) * window.innerWidth;
	p2D.y = ((p2D.y + 1) / 2) * window.innerHeight;
	return {
		x: p2D.x,
		y: p2D.y
	};
}
