const MyPromise = require('..')

const errTest = () => {
  const e = new MyPromise((resolve, reject) => {
    reject('hjhh')
  }).finally(() => {
    console.log('finally123');
  })
  console.log('err: ', e);

  const err = new Promise((resolve, reject) => {
    reject('hjhh')
  }).finally(() => {
    console.log('finally');
  })
  console.log('err: ', err);

}
errTest()