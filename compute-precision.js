const fminunc = require('optimization-js');
const math = require('mathjs');
const fs = require('fs');
const _ = require('lodash');

const NeuralNetwork = require('./neural-network');
const knex = require('./knex');

const THETA_SIZES = [[50 * 50 + 1, 25], [26, 10]];

const inputLayerSize = THETA_SIZES[0][0] - 1;
const hiddenLayerSize = THETA_SIZES[0][1];
const numLabels = THETA_SIZES[1][1];

const formatData = (data) => data.reduce((reduce, row) => {
  reduce.inputs.push(row.image);
  reduce.y.push(row.digit);
  return reduce;
}, { inputs: [], y: [] });

const computePrecision = async (data, expect) => {
  const files = ['min-0.1', 'min-0.2', 'min-0.3', 'min-0.4', 'min-1', 'min-2', 'min-3', 'min-4', 'min-5', 'min-6', 'min-7'];
  for (const file of files) {
    const nn = await NeuralNetwork.loadFromMinFile(`./theta/${file}`, inputLayerSize, hiddenLayerSize, numLabels);
    let cost = 0;
    for (let i = 0; i < data.length; i += 1) {
      const dataInput = data[i].flat();
      const p = nn.predict(dataInput);
      if (p === expect[i]) {
        cost += 1;
      }
    }
    console.log(`Pure cost with ${file} = ${cost / data.length * 100}`);
  }
};

(async () => {
  const data = await knex('digits');
  const { inputs, y } = formatData(data);
  await computePrecision(inputs, y);
})().then(() => {
  console.log('Done');
}).catch((e) => {
  console.error(`Error ${e.message}`);
});
