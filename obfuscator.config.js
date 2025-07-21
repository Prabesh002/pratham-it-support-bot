module.exports = {
  compact: true,

  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  rotateStringArray: true,
  
  renameGlobals: false,
  renameProperties: false,
  
  transformObjectKeys: false,

  // selfDefending: true,
  // debugProtection: true,
  // disableConsoleOutput: true,

  sourceMap: false,
  target: 'node',
};