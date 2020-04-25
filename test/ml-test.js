const assert = require('assert');
const fs = require('fs');
const math = require('mathjs');
const NeuralNetwork = require('../neural-network');

const fixturePath = `${__dirname}/fixtures`;
const digitFixturePath = `${fixturePath}/digits`;

const loadDigitFixtures = () => {
  const dirs = fs.readdirSync(digitFixturePath);
  let fixtures = [];
  for (const dir of dirs) {
    const stat = fs.lstatSync(`${digitFixturePath}/${dir}`);
    if (stat.isDirectory()) {
      const files = fs.readdirSync(`${digitFixturePath}/${dir}`);
      for (const file of files) {
        const content = fs.readFileSync(`${digitFixturePath}/${dir}/${file}`, 'utf8');
        fixtures.push({ digit: dir, data: JSON.parse(content) });
      }
    }
  }
  return fixtures;
};

const loadThetaFixtures = () => {
  const theta1Content = fs.readFileSync(`${fixturePath}/theta/random_1.json`);
  const theta2Content = fs.readFileSync(`${fixturePath}/theta/random_2.json`);
  return {
    theta1: math.matrix(JSON.parse(theta1Content)),
    theta2: math.matrix(JSON.parse(theta2Content)),
  };
};

const saveToFixtures = (path, content) => {
  fs.writeFileSync(`${fixturePath}/${path}`, content);
};

describe('ML', () => {
  describe('#sigmoid', () => {
    it('computes sigmoid function', () => {
      const sigm = NeuralNetwork.sigmoid(0);
      assert.strictEqual(sigm, 0.5);
    });
  });

  describe('#sigmoidGradient', () => {
    it('computes gradient of sigmoid function', () => {
      assert.strictEqual(NeuralNetwork.sigmoidGradient(0), 0.25);
      assert.equal(NeuralNetwork.sigmoidGradient(1000), 0);
      const mat = math.matrix([[0, 1000], [1000, 0]]);
      assert.deepStrictEqual(NeuralNetwork.sigmoidGradient(mat).valueOf(), [[0.25, 0], [0, 0.25]]);
    });
  });

  describe('computePredictions', () => {
    it('gives array of predictions by digit', () => {
      const theta1 = NeuralNetwork.randomMatrix(50 * 50 + 1, 25, 0.12);
      const theta2 = NeuralNetwork.randomMatrix(26, 10, 0.12);
      const nn = new NeuralNetwork(theta1, theta2);
      const imgData = math.random([1, 50 * 50], 0, 255);
      const { h } = nn.computePredictions(imgData[0]);
      assert.strictEqual(h.length, 10);
    });
  });

  describe('predict', () => {
    it('predicts from data', () => {
      const theta1 = NeuralNetwork.randomMatrix(50 * 50 + 1, 25, 0.12);
      const theta2 = NeuralNetwork.randomMatrix(26, 10, 0.12);
      const nn = new NeuralNetwork(theta1, theta2);
      const imgData = math.random([1, 50 * 50], 0, 255);
      const p = nn.predict(imgData[0]);
      assert(p < 10);
    });
  });

  describe('computeCost', () => {
    it('gives cost', () => {
      const fixtures = loadDigitFixtures();
      // for (let i = 0; i < 3; i += 1) {
      //   fixtures.push(...fixtures);
      // }
      let theta1;
      let theta2;
      if (process.env.GENERATE_FIXTURES) {
        theta1 = NeuralNetwork.randomMatrix(50 * 50 + 1, 25, 0.12);
        theta2 = NeuralNetwork.randomMatrix(26, 10, 0.12);
        saveToFixtures('theta/random_1.json', JSON.stringify(theta1.valueOf()));
        saveToFixtures('theta/random_2.json', JSON.stringify(theta2.valueOf()));
      } else {
        ({ theta1, theta2 } = loadThetaFixtures());
      }
      const nn = new NeuralNetwork(theta1, theta2);
      const inputs = fixtures.map(f => f.data);
      const expectations = fixtures.map(f => f.digit);
      const { cost } = nn.computeCost(inputs, expectations, 10);
      assert.strictEqual(cost, 174.05956935774898);
    });
  });

  describe('Check NN gradient', () => {
    it('should be close to definition of derivation', () => {
      const diff = NeuralNetwork.checkNNGradient();
      assert(diff < 1.e-9);
      const diff2 = NeuralNetwork.checkNNGradient(3);
      assert(diff2 < 1.e-9);
      const diff3 = NeuralNetwork.checkNNGradient(10);
      assert(diff3 < 1.e-9);
    });
  });

  describe('#debugMatrix', () => {
    it ('created a sin matrix', () => {
      const a = NeuralNetwork.debugMatrix(2, 2);
      assert.deepStrictEqual(a.valueOf(), [
        [ Math.sin(1) / 10, Math.sin(2) / 10 ],
        [ Math.sin(3) / 10, Math.sin(4) / 10],
      ]);
    });
  });
});
