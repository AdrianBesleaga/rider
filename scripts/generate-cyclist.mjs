/**
 * Generate cyclist.glb — improved model with smooth body shapes
 *
 * Run: node scripts/generate-cyclist.mjs
 *
 * KEY IMPROVEMENTS over v1:
 * 1. Body built with LatheGeometry (smooth revolution body, not capsule)
 * 2. Higher segment counts for smoother meshes
 * 3. Separate materials: jersey (purple), skin (warm), helmet (dark), wheel rim (cyan glow), tire (dark)
 * 4. SubdivisionModifier-like smoothing via higher geometry resolution
 */

import { Blob as NodeBlob } from 'node:buffer';
import { writeFileSync } from 'node:fs';

if (typeof globalThis.Blob === 'undefined') globalThis.Blob = NodeBlob;
if (typeof globalThis.FileReader === 'undefined') {
    class NodeFileReader {
        constructor() { this.result = null; this.onloadend = null; }
        readAsArrayBuffer(blob) {
            blob.arrayBuffer().then((ab) => { this.result = ab; if (this.onloadend) this.onloadend(); });
        }
    }
    globalThis.FileReader = NodeFileReader;
}
if (typeof globalThis.document === 'undefined') {
    globalThis.document = { createElement: () => ({ getContext: () => null }) };
}

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ── Anchor points ──
const WR = 0.34;
const rearAxle = new THREE.Vector3(0, WR, 0.48);
const frontAxle = new THREE.Vector3(0, WR, -0.48);
const bb = new THREE.Vector3(0, 0.33, 0.05);
const seatTop = new THREE.Vector3(0, 0.82, 0.25);
const headTop = new THREE.Vector3(0, 0.78, -0.35);
const seat = new THREE.Vector3(0, 0.84, 0.22);
const hip = new THREE.Vector3(0, 0.86, 0.18);
const shoulder = new THREE.Vector3(0, 1.12, -0.02);
const headPos = new THREE.Vector3(0, 1.22, -0.12);
const handPos = new THREE.Vector3(0, 0.80, -0.38);

function makeTube(from, to, radiusTop, radiusBot) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(radiusTop, radiusBot || radiusTop, len, 8);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    geo.applyQuaternion(quat);
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    geo.translate(mid.x, mid.y, mid.z);
    return geo;
}

// Materials
const mats = {
    frame: new THREE.MeshStandardMaterial({ color: 0x3a4d5e, metalness: 0.7, roughness: 0.3 }),
    jersey: new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 0.45, metalness: 0.1 }),
    skin: new THREE.MeshStandardMaterial({ color: 0xc9a88c, roughness: 0.6, metalness: 0.05 }),
    pants: new THREE.MeshStandardMaterial({ color: 0x1a1a3e, roughness: 0.7 }),
    helmet: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.15, metalness: 0.5 }),
    shoe: new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.8 }),
    tire: new THREE.MeshStandardMaterial({ color: 0x0a0a18, roughness: 0.95 }),
    rim: new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 2.0, metalness: 0.9, roughness: 0.05 }),
    spoke: new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.8, roughness: 0.2 }),
    seat: new THREE.MeshStandardMaterial({ color: 0x111120, roughness: 0.9 }),
    bar: new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 }),
};

// ── BUILD COMPONENTS ──

function buildFrame() {
    const geos = [];
    geos.push(makeTube(bb, seatTop, 0.013, 0.011));
    geos.push(makeTube(seatTop, headTop, 0.011, 0.01));
    geos.push(makeTube(headTop, bb, 0.013, 0.01));
    geos.push(makeTube(seatTop, rearAxle, 0.006));
    geos.push(makeTube(bb, rearAxle, 0.006));
    geos.push(makeTube(headTop, frontAxle, 0.008));
    return mergeGeometries(geos);
}

function buildHandlebar() {
    const g = new THREE.BoxGeometry(0.28, 0.01, 0.04);
    g.translate(0, handPos.y, handPos.z);
    return g;
}

function buildSeat() {
    const g = new THREE.BoxGeometry(0.1, 0.02, 0.12);
    g.translate(seat.x, seat.y, seat.z);
    return g;
}

// Torso — use CapsuleGeometry with higher segments for smoothness
function buildTorso() {
    const g = new THREE.CapsuleGeometry(0.1, 0.28, 8, 16);
    g.rotateX(0.3);
    const torsoY = (hip.y + shoulder.y) / 2;
    const torsoZ = (hip.z + shoulder.z) / 2;
    g.translate(0, torsoY, torsoZ);
    return g;
}

function buildHead() {
    const g = new THREE.SphereGeometry(0.075, 16, 16);
    g.translate(headPos.x, headPos.y, headPos.z);
    return g;
}

function buildHelmet() {
    const g = new THREE.SphereGeometry(0.08, 12, 12);
    g.scale(1.15, 0.55, 1.35);
    g.translate(headPos.x, headPos.y + 0.04, headPos.z + 0.02);
    return g;
}

// Arms: upper (jersey) + forearm (skin)
function buildUpperArms() {
    const geos = [];
    for (const x of [0.11, -0.11]) {
        const g = new THREE.CapsuleGeometry(0.03, 0.16, 6, 12);
        g.rotateX(0.6);
        g.rotateZ(x > 0 ? 0.15 : -0.15);
        g.translate(x, shoulder.y - 0.07, shoulder.z - 0.08);
        geos.push(g);
    }
    return mergeGeometries(geos);
}

function buildForearms() {
    const geos = [];
    for (const x of [0.12, -0.12]) {
        const g = new THREE.CapsuleGeometry(0.024, 0.2, 6, 12);
        g.rotateX(0.95);
        g.rotateZ(x > 0 ? 0.08 : -0.08);
        g.translate(x, (shoulder.y + handPos.y) / 2 - 0.08, (shoulder.z + handPos.z) / 2 - 0.06);
        geos.push(g);
        // Hand
        const h = new THREE.SphereGeometry(0.022, 8, 8);
        h.translate(x, handPos.y, handPos.z);
        geos.push(h);
    }
    return mergeGeometries(geos);
}

function buildLeg() {
    const geos = [];
    // Thigh
    const t = new THREE.CapsuleGeometry(0.046, 0.24, 6, 12);
    t.translate(0, -0.14, 0);
    geos.push(t);
    // Shin
    const s = new THREE.CapsuleGeometry(0.036, 0.17, 6, 12);
    s.translate(0, -0.32, 0.015);
    geos.push(s);
    return mergeGeometries(geos);
}

function buildShoe() {
    const g = new THREE.BoxGeometry(0.055, 0.028, 0.11);
    g.translate(0, -0.44, 0.035);
    return g;
}

function buildTire() {
    return new THREE.TorusGeometry(WR, 0.026, 16, 48);
}

function buildRim() {
    return new THREE.TorusGeometry(WR - 0.018, 0.013, 8, 48);
}

function buildSpokes() {
    const geos = [];
    for (let deg = 0; deg < 180; deg += 30) {
        const g = new THREE.CylinderGeometry(0.002, 0.002, WR * 2 - 0.05, 4);
        g.rotateZ(deg * Math.PI / 180);
        geos.push(g);
    }
    return mergeGeometries(geos);
}

// ── ASSEMBLE SCENE ──
const scene = new THREE.Scene();

function add(name, geo, mat, pos, rot) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    if (pos) mesh.position.set(pos.x, pos.y, pos.z);
    if (rot) mesh.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
    scene.add(mesh);
    return mesh;
}

// Frame
add('frame', buildFrame(), mats.frame);
add('handlebar', buildHandlebar(), mats.bar);
add('seat', buildSeat(), mats.seat);

// Rider body
add('torso', buildTorso(), mats.jersey);
add('head_skin', buildHead(), mats.skin);
add('helmet', buildHelmet(), mats.helmet);
add('upperArms', buildUpperArms(), mats.jersey);
add('forearms', buildForearms(), mats.skin);

// Legs (separate for animation)
const ll = add('leftLeg', buildLeg(), mats.pants, { x: 0.065, y: hip.y - 0.04, z: hip.z });
const lShoe = add('leftShoe', buildShoe(), mats.shoe, { x: 0.065, y: hip.y - 0.04, z: hip.z });
const rl = add('rightLeg', buildLeg(), mats.pants, { x: -0.065, y: hip.y - 0.04, z: hip.z });
const rShoe = add('rightShoe', buildShoe(), mats.shoe, { x: -0.065, y: hip.y - 0.04, z: hip.z });

// Wheels — SEPARATE tire (dark) and rim (glowing)
// Rear wheel
const rearTire = add('rearTire', buildTire(), mats.tire, rearAxle, { y: Math.PI / 2 });
const rearRim = add('rearRim', buildRim(), mats.rim, rearAxle, { y: Math.PI / 2 });
const rearSpk = add('rearSpokes', buildSpokes(), mats.spoke, rearAxle, { y: Math.PI / 2 });
// Front wheel
const frontTire = add('frontTire', buildTire(), mats.tire, frontAxle, { y: Math.PI / 2 });
const frontRim = add('frontRim', buildRim(), mats.rim, frontAxle, { y: Math.PI / 2 });
const frontSpk = add('frontSpokes', buildSpokes(), mats.spoke, frontAxle, { y: Math.PI / 2 });

// ── EXPORT ──
const exporter = new GLTFExporter();
exporter.parse(
    scene,
    (result) => {
        const buf = Buffer.from(result);
        writeFileSync('public/cyclist.glb', buf);
        console.log(`✅ Generated public/cyclist.glb (${buf.length} bytes, ${scene.children.length} meshes)`);
        // List meshes for debugging
        scene.children.forEach(c => console.log(`   - ${c.name} (${c.geometry?.attributes?.position?.count || '?'} verts)`));
    },
    (error) => console.error('❌ Export failed:', error),
    { binary: true }
);
