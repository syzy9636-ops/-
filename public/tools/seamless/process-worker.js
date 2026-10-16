'use strict';
importScripts('./core.js');
self.onmessage = ({ data: { op, image, options, mask } }) => {
  try {
    const report = (progress, text) => self.postMessage({ progress, text });
    const result = op === 'seam' ? TextureCore.seamless(image, options, report)
      : op === 'heal' ? TextureCore.heal(image, mask, options, report)
        : TextureCore.resample(image, options.width, options.height, options.method, report);
    self.postMessage({ result }, [result.data.buffer]);
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
