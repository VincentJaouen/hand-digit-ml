const math = require('mathjs');

/**
 * Works with only 2 layers for now
 */
class NeuralNetwork {
  constructor(theta1, theta2) {
    this.theta1 = theta1;
    this.theta2 = theta2;
  }

  static fromVector(theta, inputLayerSize, hiddenLayerSize, numLabels) {
    const thet1 = math.matrix(math.reshape(theta.slice(0, (inputLayerSize + 1) * hiddenLayerSize), [inputLayerSize + 1, hiddenLayerSize]));
    const thet2 = math.matrix(math.reshape(theta.slice((inputLayerSize + 1) * hiddenLayerSize), [hiddenLayerSize + 1, numLabels]));
    return new NeuralNetwork(thet1, thet2);
  }

  predictMatrix(matrixData) {
    const data = math.flatten(matrixData);
    return this.predict(data);
  }

  /**
   * Predict digit from image data
   */
  predict(data) {
    const predictions = this.computePredictions(data);
    return predictions.indexOf(math.max(predictions));
  }

  computePredictions(data) {
    const input = math.matrix([1, ...data]);
    const h1 =  NeuralNetwork.sigmoid(math.multiply(input, this.theta1));
    const secondInput = math.matrix([1, ...h1.valueOf()]);
    const h2 = NeuralNetwork.sigmoid(math.multiply(secondInput, this.theta2));
    return h2.valueOf();
  }

  static vectorizeLabel(label, numLabel) {
    const vector = [];
    for (let i = 0; i < numLabel; i += 1) {
      vector[i] = i === parseInt(label) ? 1 : 0;
    }
    return vector;
  }

  computeCost(inputs, expectations, lambda = 0) {
    if (inputs.length !== expectations.length) {
      throw new Error('Inputs and expectations have different sizes');
    }

    const m = inputs.length;
    const theta1Size = math.size(this.theta1).valueOf();
    const theta2Size = math.size(this.theta2).valueOf();

    // theta1(:, 2:end)
    const pureTheta1 = math.subset(this.theta1, math.index(math.range(1, theta1Size[0]), math.range(0, theta1Size[1])));
    // theta2(:, 2:end)
    const pureTheta2 = math.subset(this.theta2, math.index(math.range(1, theta2Size[0]), math.range(0, theta2Size[1])));

    let thetaGrad1 = math.zeros(...theta1Size);
    let thetaGrad2 = math.zeros(...theta2Size);
    let cost = 0;
    for (let i = 0; i < m; i += 1) {
      const data = inputs[i].flat();
      const expected = NeuralNetwork.vectorizeLabel(expectations[i], theta2Size[1]);
      // const a1 = math.matrix([[1, ...ML.normalizeImageData(data)]]);
      const a1 = math.matrix([[1, ...data]]);
      const z2 = math.multiply(a1, this.theta1);
      const a2 = math.concat([[1]], NeuralNetwork.sigmoid(z2), 0);
      const Hi = this.computePredictions(data);
      // math.multiply(a2, this.theta2);
      const delta3 = math.matrix([math.subtract(Hi, expected)]);
      const delta2 = math.dotMultiply(math.multiply(pureTheta2, math.transpose(delta3)), NeuralNetwork.sigmoidGradient(z2));
      thetaGrad1 = math.add(thetaGrad1, math.transpose(math.multiply(delta2, a1)));
      thetaGrad2 = math.add(thetaGrad2, math.multiply(a2, delta3));

      for (let k = 0; k < Hi.length; k += 1) {
        const y = expected[k];
        const h = Hi[k];
        cost += -y * Math.log(h) - (1 - y) * Math.log(1 - h);
      }
    }

    // Regularization
    cost = cost / m + (lambda / (2 * m)) * (math.sum(math.square(pureTheta1)) + math.sum(math.square(pureTheta2)));

    const theta1Reg = math.subset(this.theta1, math.index(0, math.range(0, theta1Size[1])), math.zeros(1, theta1Size[1]));
    const theta2Reg = math.subset(this.theta2, math.index(0, math.range(0, theta2Size[1])), math.zeros(1, theta2Size[1]));

    thetaGrad1 = math.add(math.divide(thetaGrad1, m), math.multiply(lambda / m, theta1Reg));
    thetaGrad2 = math.add(math.divide(thetaGrad2, m), math.multiply(lambda / m, theta2Reg));

    return {
      cost,
      thetaGrad1,
      thetaGrad2,
    };
  }

  static checkNNGradient(lambda = 0) {
    const inputLayerSize = 3;
    const hiddenLayerSize = 5;
    const numLabels = 3;
    const m = 5;

    const theta1 = this.debugMatrix(inputLayerSize + 1, hiddenLayerSize);
    const theta2 = this.debugMatrix(hiddenLayerSize + 1, numLabels);
    const theta = math.flatten(theta1).valueOf().concat(math.flatten(theta2).valueOf());

    const inputs = this.debugMatrix(m, inputLayerSize).valueOf();
    const y = [[1], [2], [0], [1], [2]];

    const costFunc = (costTheta) => {
      const thet1 = math.matrix(math.reshape(costTheta.slice(0, (inputLayerSize + 1) * hiddenLayerSize), [inputLayerSize + 1, hiddenLayerSize]));
      const thet2 = math.matrix(math.reshape(costTheta.slice((inputLayerSize + 1) * hiddenLayerSize), [hiddenLayerSize + 1, numLabels]));
      const nn = new NeuralNetwork(thet1, thet2);
      const { cost } = nn.computeCost(inputs, y, lambda);
      return cost;
    };

    const nn = new NeuralNetwork(theta1, theta2);
    const { cost, thetaGrad1, thetaGrad2 } = nn.computeCost(inputs, y, lambda);
    const grad = math.flatten(thetaGrad1).valueOf().concat(math.flatten(thetaGrad2).valueOf());
    const numgrad = this.computeNumericalGradient(costFunc, theta);

    return math.norm(math.subtract(numgrad, grad)) / math.norm(math.add(numgrad, grad));
  }

  static computeNumericalGradient(costFunc, theta) {
    const e = 1e-4;
    const numgrad = new Array(theta.length);
    const perturb = new Array(theta.length);
    numgrad.fill(0);
    perturb.fill(0);
    for (let i = 0; i < theta.length; i += 1) {
      console.log(`Theta ${i}/${theta.length}`);
      perturb[i] = e;
      const lossNeg = costFunc(math.subtract(theta, perturb));
      const lossPos = costFunc(math.add(theta, perturb));
      numgrad[i] = (lossPos - lossNeg) / (2 * e);
      perturb[i] = 0;
    }
    return numgrad;
  }

  static normalizeImageData(data) {
    return data.map(d => (d - (256/2)) / 255);
  }

  static sigmoid(z) {
    const sigmoidFunction = (a) => 1 / (1 + Math.pow(Math.E, -a));
    return this.apply(z, sigmoidFunction);
  }

  static sigmoidGradient(z) {
    const sigm = this.sigmoid(z);
    return math.dotMultiply(sigm, math.subtract(1, sigm));
  }

  static apply(a, callback) {
    const type = math.typeOf(a);
    if (type === 'Matrix') {
      return math.apply(a, 0, row => row.map(callback));
    }
    return callback(a);
  }

  static randomMatrix(m, n, epsilon) {
    return math.random([m, n], -epsilon, epsilon);
  }

  static debugMatrix(m, n) {
    const range = math.range(1, m * n + 1);
    return math.divide(math.reshape(math.sin(range), [m, n]), 10);
  }
}

module.exports = NeuralNetwork;
