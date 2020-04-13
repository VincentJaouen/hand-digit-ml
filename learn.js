const fminunc = require('optimization-js');
const math = require('mathjs');
const fs = require('fs');

const NeuralNetwork = require('./neural-network');
const knex = require('./knex');

const THETA_SIZES = [[50 * 50 + 1, 25], [26, 10]];

const inputLayerSize = THETA_SIZES[0][0] - 1;
const hiddenLayerSize = THETA_SIZES[0][1];
const numLabels = THETA_SIZES[1][1];

const learn = async () => {
  const initialTheta1 = NeuralNetwork.randomMatrix(...THETA_SIZES[0], 0.12);
  const initialTheta2 = NeuralNetwork.randomMatrix(...THETA_SIZES[1], 0.12);
  const thetaInit = math.flatten(initialTheta1).valueOf()
    .concat(math.flatten(initialTheta2).valueOf());
  const data = await knex('digits');
  const lambda = 10;
  const { inputs, y } = data.reduce((reduce, row) => {
    reduce.inputs.push(row.image);
    reduce.y.push(row.digit);
    return reduce;
  }, { inputs: [], y: [] });
  console.log(`Will train with ${inputs.length} rows`);

  let i = 0;

  const costFunc = (costTheta) => {
    const nn = NeuralNetwork.fromVector(costTheta, inputLayerSize, hiddenLayerSize, numLabels);
    const { cost } = nn.computeCost(inputs, y, lambda);
    i += 1;
    console.log(`Iteration ${i}, cost = ${cost}`);
    return cost;
  };

  const gradFunc = (gradTheta) => {
    const nn = NeuralNetwork.fromVector(gradTheta, inputLayerSize, hiddenLayerSize, numLabels);
    const { thetaGrad1, thetaGrad2 } = nn.computeCost(inputs, y, lambda);
    return math.flatten(thetaGrad1).valueOf().concat(math.flatten(thetaGrad2).valueOf());
  };

  const maxOfArray = (arr) => {
    let max = Math.abs(arr[0]);
    for (let i = 0; i < arr.length; i += 1) {
      if (Math.abs(arr[i]) > max) {
        max = Math.abs(arr[i]);
      }
    }
    return max;
  };

  const hasConverged = (thet, gradient, iteration) => {
    const max = maxOfArray(gradient);
    console.log(`Iteration ${iteration}, max gradient ${max}`);
    return iteration >= 300;
  };

  const min = fminunc.minimize_GradientDescent(costFunc, gradFunc, thetaInit, hasConverged);
  console.log(`FOUND MIN ${JSON.stringify(min)}`);
  fs.writeFileSync('/tmp/min', JSON.stringify(min), { flag: 'w+' });
};

learn().then(() => {
  console.log('Done learning');
}).catch((e) => {
  console.error(`Error ${e.message}`);
});
