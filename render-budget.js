export function renderPixelRatio(width, height, deviceRatio, scale = 1) {
  const pixelLimit = Math.sqrt(2_200_000 / (width * height));
  return Math.min(deviceRatio, 1.45, pixelLimit) * scale;
}

export function createRenderBudget() {
  let scale = 1;
  let sampleTime = 0;
  let sampleCount = 0;

  function resetSamples() {
    sampleTime = 0;
    sampleCount = 0;
  }

  return {
    get scale() { return scale; },
    sample(seconds, active) {
      if (!active || seconds <= 0 || seconds >= .25) {
        resetSamples();
        return false;
      }
      sampleTime += seconds;
      sampleCount++;
      if (sampleTime < 1.2) return false;

      const overloaded = sampleTime / sampleCount > .023;
      resetSamples();
      if (!overloaded || scale <= .65) return false;
      scale = Math.max(.65, scale * .86);
      return true;
    }
  };
}

