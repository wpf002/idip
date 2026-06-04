// Dual-mode Babel config:
//  - Under Jest (NODE_ENV=test) we compile TS for Node.
//  - For the React Native build, Metro uses the RN preset.
module.exports = (api) => {
  const isTest = api.env('test');
  api.cache(false);
  if (isTest) {
    return {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    };
  }
  return {
    presets: ['module:@react-native/babel-preset'],
  };
};
