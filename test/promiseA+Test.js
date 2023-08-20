// 执行 Promise A+ 规范检测
const MyPromise = require('..')

// promiseA+规范测试
// 执行脚本测试：promises-aplus-tests MyPtomise-official
MyPromise.defer = MyPromise.deferred = function () {
  let dfd = {};
  dfd.promise = new MyPromise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  })
  return dfd;
}

module.exports = MyPromise