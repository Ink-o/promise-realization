const MyPromise = require('..')

new MyPromise((resolve, reject) => {
  throw new Error('p2出错了')
}).catch(err => {
  console.log('接收到错误：', err);
})