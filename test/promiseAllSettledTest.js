const MyPromise = require('..')

const syncTest = () => {
  const p1 = new MyPromise((resolve, reject) => {
    resolve('p1')
  })
  const p2 = new MyPromise((resolve, reject) => {
    resolve('p2')
  })
  const p3 = new MyPromise((resolve, reject) => {
    resolve('p3')
  })
  MyPromise.allSettled([p1, p2, p3]).then(res => {
    console.log(res);
  })
}
syncTest()

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
      resolve('p3 50ms')
    }, 50);
  })
  MyPromise.allSettled([p1, p2, p3]).then(res => {
    console.log(res);
  })
}
// asyncTest()

const rejectTest = () => {
  const p1 = new MyPromise((resolve, reject) => {
    resolve('p1')
  })
  const p2 = new MyPromise((resolve, reject) => {
    reject('p2 rejected')
  })
  const p3 = new MyPromise((resolve, reject) => {
    resolve('p3')
  })
  MyPromise.allSettled([p1, p2, p3]).then(res => {
    console.log(res);
  }, err => {
    console.log(err);
  })
}
// rejectTest()

const errTest = () => {
  const p1 = new MyPromise((resolve, reject) => {
    resolve('p1')
  })
  const p2 = new MyPromise((resolve, reject) => {
    throw new Error('p2出错了')
  })
  const p3 = new MyPromise((resolve, reject) => {
    resolve('p3')
  })
  MyPromise.allSettled([p1, p2, p3]).then(res => {
    console.log(res);
  }, err => {
    console.log(err);
  })
}
// errTest()

const originalValTest = () => {
  const p1 = 1
  const p2 = 'p2'
  const p3 = new MyPromise((resolve, reject) => {
    resolve('p3')
  })
  MyPromise.allSettled([p1, p2, p3]).then(res => {
    console.log(res);
  }, err => {
    console.log(err);
  })
}
// originalValTest()