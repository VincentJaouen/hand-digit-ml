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

const maxOfArray = (arr) => {
  let max = Math.abs(arr[0]);
  for (let i = 0; i < arr.length; i += 1) {
    if (Math.abs(arr[i]) > max) {
      max = Math.abs(arr[i]);
    }
  }
  return max;
};

const computePrecision = async (cvData, cvExpect) => {
  const files = ['min-0.1', 'min-0.2', 'min-0.3', 'min-0.4', 'min-1', 'min-2', 'min-3', 'min-4', 'min-5', 'min-6', 'min-7'];
  for (const file of files) {
    const nn = await NeuralNetwork.loadFromMinFile(`./theta/${file}`, inputLayerSize, hiddenLayerSize, numLabels);
    let cost = 0;
    for (let i = 0; i < cvData.length; i += 1) {
      const data = cvData[i].flat();
      const p = nn.predict(data);
      // console.log(`p = ${p} should have ${cvExpect[i]}`);
      if (p !== cvExpect[i]) {
        cost += 1;
      }
    }
    console.log(`Pure cost with ${file} = ${cost / cvData.length * 100}`);
  }
};

const learn = async () => {
  const initialTheta1 = NeuralNetwork.randomMatrix(...THETA_SIZES[0], 0.12);
  const initialTheta2 = NeuralNetwork.randomMatrix(...THETA_SIZES[1], 0.12);
  const thetaInit = math.flatten(initialTheta1).valueOf()
    .concat(math.flatten(initialTheta2).valueOf());
  const data = await knex('digits');

  const { inputs: inp, y: exp } = formatData(data);
  return computePrecision(inp, exp);

  const dataByDigit = _.groupBy(data, 'digit');
  // Separate data into learning data (80%) and cross validation data (20%)
  const { learnData, cvData } = Object.keys(dataByDigit).reduce((reduce, digit) => {
    const rows = dataByDigit[digit];
    const [learn, cv] = _.chunk(rows, Math.round(rows.length * 80 / 100));
    reduce.learnData.push(...learn);
    reduce.cvData.push(...cv);
    return reduce;
  }, { learnData: [], cvData: [] });

  const { inputs, y } = formatData(learnData);
  console.log(`Will train with ${inputs.length} rows`);

  const hasConverged = (thet, gradient, iteration) => {
    const max = maxOfArray(gradient);
    console.log(`Iteration ${iteration}, max gradient ${max}`);
    return iteration >= 100;
  };

  const { inputs: cvInputs, y: cvExpectations } = formatData(cvData);

  for (let lambda = 1; lambda <= 10; lambda += 1) {
    console.log(`Learning with lambda = ${lambda}`);
    const costFunc = (costTheta) => {
      const nn = NeuralNetwork.fromVector(costTheta, inputLayerSize, hiddenLayerSize, numLabels);
      const { cost } = nn.computeCost(inputs, y, lambda);
      return cost;
    };

    const gradFunc = (gradTheta) => {
      const nn = NeuralNetwork.fromVector(gradTheta, inputLayerSize, hiddenLayerSize, numLabels);
      const { thetaGrad1, thetaGrad2 } = nn.computeCost(inputs, y, lambda);
      return math.flatten(thetaGrad1).valueOf().concat(math.flatten(thetaGrad2).valueOf());
    };

    const min = fminunc.minimize_GradientDescent(costFunc, gradFunc, thetaInit, hasConverged);
    console.log(`Done for lambda ${lambda} with cost ${min.fncvalue}`);
    fs.writeFileSync(`/tmp/min-${lambda}`, JSON.stringify(min), {flag: 'w+'});
    const nn = NeuralNetwork.fromVector(min.argument, inputLayerSize, hiddenLayerSize, numLabels);
    const { cost } = nn.computeCost(cvInputs, cvExpectations, lambda);
    console.log(`Cost for lambda ${lambda}: ${cost}`);
  }
};

learn().then(() => {
  console.log('Done learning');
}).catch((e) => {
  console.error(`Error ${e.message}`);
});
