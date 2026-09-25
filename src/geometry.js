export function containedImageRect(containerWidth, containerHeight, imageWidth, imageHeight) {
  if (![containerWidth, containerHeight, imageWidth, imageHeight].every(Number.isFinite)) {
    throw new TypeError("Dimensions must be finite numbers");
  }
  if (containerWidth <= 0 || containerHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    throw new RangeError("Dimensions must be greater than zero");
  }

  const scale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    x: (containerWidth - width) / 2,
    y: (containerHeight - height) / 2,
    width,
    height,
    scale,
  };
}

export function mapPointerToDevice(pointerX, pointerY, rect, deviceWidth, deviceHeight) {
  const inside = pointerX >= rect.x && pointerX <= rect.x + rect.width
    && pointerY >= rect.y && pointerY <= rect.y + rect.height;

  if (!inside) return null;

  const x = Math.max(0, Math.min(deviceWidth - 1, ((pointerX - rect.x) / rect.width) * deviceWidth));
  const y = Math.max(0, Math.min(deviceHeight - 1, ((pointerY - rect.y) / rect.height) * deviceHeight));
  return { x: Math.round(x), y: Math.round(y) };
}
