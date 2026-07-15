// ============================================
// NEWLOOK SECURITY SYSTEM
// Face Engine
// ============================================

const MODEL_PATH = "models";

let modelsLoaded = false;
let currentStream = null;

// ============================================
// Load Models
// ============================================

export async function loadFaceModels() {

    if (modelsLoaded) return;

    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_PATH);

    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH);

    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH);

    modelsLoaded = true;

    console.log("Face models loaded.");

}

// ============================================
// Open Camera
// ============================================

export async function openCamera(videoElement) {

    if (currentStream) {

        stopCamera();

    }

    currentStream = await navigator.mediaDevices.getUserMedia({

        video: {

            facingMode: "user",

            width: { ideal: 640 },

            height: { ideal: 480 }

        },

        audio: false

    });

    videoElement.srcObject = currentStream;

    await videoElement.play();

}

// ============================================
// Stop Camera
// ============================================

export function stopCamera() {

    if (!currentStream) return;

    currentStream.getTracks().forEach(track => {

        track.stop();

    });

    currentStream = null;

}

// ============================================
// Capture Photo
// ============================================

export function capturePhoto(videoElement, canvasElement) {

    const context = canvasElement.getContext("2d");

    canvasElement.width = videoElement.videoWidth;

    canvasElement.height = videoElement.videoHeight;

    context.drawImage(

        videoElement,

        0,

        0,

        canvasElement.width,

        canvasElement.height

    );

    return canvasElement.toDataURL("image/jpeg", 0.9);

}

// ============================================
// Base64 To Image
// ============================================

export function previewPhoto(imageElement, base64) {

    imageElement.src = base64;

}

// ============================================
// Generate Face Descriptor
// ============================================

export async function generateFaceDescriptor(imageSource) {

    const detections = await faceapi
        .detectAllFaces(imageSource)
        .withFaceLandmarks()
        .withFaceDescriptors();

    if (detections.length === 0) {

        throw new Error("No face detected.");

    }

    if (detections.length > 1) {

        throw new Error("Multiple faces detected. Only one face is allowed.");

    }

    return Array.from(detections[0].descriptor);

}

// ============================================
// Resize Image
// ============================================

export async function resizeImage(base64, maxSize = 300) {

    return new Promise((resolve) => {

        const image = new Image();

        image.onload = () => {

            const canvas = document.createElement("canvas");

            let width = image.width;
            let height = image.height;

            if (width > height) {

                if (width > maxSize) {

                    height *= maxSize / width;

                    width = maxSize;

                }

            } else {

                if (height > maxSize) {

                    width *= maxSize / height;

                    height = maxSize;

                }

            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");

            ctx.drawImage(image, 0, 0, width, height);

            resolve(canvas.toDataURL("image/jpeg", 0.85));

        };

        image.src = base64;

    });

}