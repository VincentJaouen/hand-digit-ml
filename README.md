# Hand Digit Neural Network ML

The goal of this small project is to implement a simple neural network learning algorithm to be able to recognize digits drawn by a user on a 50x50 canvas.

Temporarily hosted on: http://ml.vjaouen.com/

## How to launch locally

Prerequirements:
- Nodejs (https://nodejs.org/en/)
- Yarn (https://yarnpkg.com/)
- PostgreSQL

### Install and run
- Clone repository locally
- Run `yarn install`
- Create `digitml` database and run migrations with `yarn knex migrate:latest --knexfile ./knexfile.js` 
- Run `yarn start`
- Open http://localhost

## Learn

Just run `yarn learn`.

It will iterate on lambdas from 1 to 10. Change the parameter `LEARN_CHUNK` to the ratio of learning data/cross-validation data as desired.

## Precision

Run `yarn compute-precision`
