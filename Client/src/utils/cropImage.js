// src/utils/cropImage.js

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

/**
 * This function returns a Promise that resolves with a Blob object representing the cropped image.
 * @param {string} imageSrc - The base64 or URL of the image to crop.
 * @param {Object} pixelCrop - The pixel dimensions and position of the crop.
 */
async function getCroppedImg(imageSrc, pixelCrop) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // set canvas size to match the crop box
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // draw the cropped image onto the canvas
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((file) => {
            resolve(file);
        }, 'image/jpeg'); // Change to 'image/png' if needed
    });
}

export default getCroppedImg;