const MyPromise = require('..')

const asyncTest = () => {
  const p1 = new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve('p1 100ms')
    }, 100);
  })
  const p2 = new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve('p2 200ms')
    }, 200);
  })
  const p3 = new MyPromise((resolve, reject) => {
    setTimeout(() => {
      reject('p3 50ms')
    }, 50);
  })
  MyPromise.race([p3, p1, p2]).then(res => {
    console.log('res', res);
  }, err => {
    console.log('err', err);
  })
}
asyncTest()