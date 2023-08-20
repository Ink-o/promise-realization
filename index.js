const PENDING = 'PENDING'
const FULFILLED = 'FULLFILED'
const REJECTED = 'REJECTED'

class MyPromise {
  constructor(executor) {
    this.status = PENDING
    this.value = undefined
    this.reason = undefined
    this.onFulFilledCallbacks = []
    this.onRejectedCallbacks = []

    // 每个实例出来的promise都应该有属于自己的resolve和reject
    // 所以这里不能把resolve和reject提取到公共方法
    const resolve = (value) => {
      if (this.status === PENDING) {
        // 这里的resolve可能接收的方法是promise/thenable类型的值，所以需要递归进行处理
        if (value instanceof MyPromise) {
          // 这里传入的resolve,reject直接使用类中声明的resolve,reject
          // 做的也只是将成功/失败的值传入进去而已
          // TODO:这里不知道为啥不是function的值都会跑进来
          value.then(resolve, reject)
          return
        }

        this.status = FULFILLED
        this.value = value

        // 发布成功回调
        this.onFulFilledCallbacks.forEach(fn => fn())
      }
    }
    const reject = (reason) => {
      if (this.status === PENDING) {
        // ⭐️这里的reject状态不处理promise/thenable，直接进行返回
        // if (typeof reason.then === 'function') {
        //   // 这里传入的reject直接使用类中声明的reject
        //   reason.then(resolve, reject)
        //   return
        // }
        this.status = REJECTED
        this.reason = reason

        // 发布失败回调
        this.onRejectedCallbacks.forEach(fn => fn())
      }
    }

    // 这里对传入进来的回调的异常进行捕获。如有异常，则直接调用rejecte
    try {
      executor(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }
  then(onFulFilled, onRejected) {
    // 对传入的回调做赋值
    onFulFilled = typeof onFulFilled === 'function' ? onFulFilled : val => val
    onRejected = typeof onRejected === 'function' ? onRejected : err => {
      throw err
    }
    // then必须返回1个promise
    // 且这个 promise 是要根据返回值来改变状态的，这样下一次调用 then 的时候，就知道要调用哪个回调
    const p2 = new MyPromise((resolve, reject) => {
      if (this.status === FULFILLED) {
        // 这里的onFulFilled/onRejected 的执行要以宏任务/微任务的方式执行
        setTimeout(() => {
          try {
            let x = onFulFilled(this.value)
            // 根据不同情况处理x的值
            resolvePromise(p2, x, resolve, reject)
          } catch (error) {
            // 一旦遇到错误，则直接执行reject返回错误状态
            reject(error)
          }
        });
      }
      if (this.status === REJECTED) {
        // 这里的onFulFilled/onRejected 的执行要以宏任务/微任务的方式执行
        setTimeout(() => {
          try {
            let x = onRejected(this.reason)
            // 根据不同情况处理x的值
            resolvePromise(p2, x, resolve, reject)
          } catch (error) {
            // 一旦遇到错误，则直接执行reject返回错误状态
            reject(error)
          }
        });
      }
      if (this.status === PENDING) {
        // 针对于异步改变promise的状态来对依赖进行收集
        // 订阅的过程
        this.onFulFilledCallbacks.push(() => {
          // 这里的onFulFilled/onRejected 的执行要以宏任务/微任务的方式执行
          setTimeout(() => {
            try {
              let x = onFulFilled(this.value)
              // 根据不同情况处理x的值
              resolvePromise(p2, x, resolve, reject)
            } catch (error) {
              // 一旦遇到错误，则直接执行reject返回错误状态
              reject(error)
            }
          });
        })
        this.onRejectedCallbacks.push(() => {
          // 这里的onFulFilled/onRejected 的执行要以宏任务/微任务的方式执行
          setTimeout(() => {
            try {
              let x = onRejected(this.reason)
              // 根据不同情况处理x的值
              resolvePromise(p2, x, resolve, reject)
            } catch (error) {
              // 一旦遇到错误，则直接执行reject返回错误状态
              reject(error)
            }
          });
        })
      }
    })
    return p2
  }
  catch(errorCb) {
    return this.then(null, errorCb)
  }
  static resolve(val) {
    // 这里直接返回一个新的promise，并且默认是成功状态的promise
    return new MyPromise((resolve) => {
      resolve(val)
    })
  }
  static reject(val) {
    return new MyPromise((resolve, reject) => {
      reject(val)
    })
  }
  static all(promiseArr) {
    const resArr = []
    let idex = 0

    return new MyPromise((resolve, reject) => {
      if (!isIterable(promiseArr)) {
        const err = `${(typeof promiseArr)} ${promiseArr} is not iterable (cannot read property Symbol(Symbol.iterator))`
        reject(new TypeError(err))
        return
      }
      promiseArr.map((promise, index) => {
        if (isPromise(promise)) {
          // TODO：这个应该是调用了直接将status转成rejected？
          // 这里的reject直接传入进去即可，有报错直接进行使用。
          // 与 () => resolve('错误原因') 的效果一致
          promise.then(res => {
            formatResArr(res, index, resolve)
          }, reject)
        } else {
          formatResArr(res, index, resolve)
        }
      })
    })

    function formatResArr(value, index, resolve) {
      resArr[index] = value
      if (++idex === promiseArr.length) {
        resolve(resArr)
      }
    }
  }
  // 成功或失败的对象都会收集到数组中，后面再进行返回
  // 并且只能传入可迭代的对象
  static allSettled(promiseArr) {
    const resArr = []
    let idx = 0

    return new MyPromise((resolve, reject) => {
      if (!isIterable(promiseArr)) {
        const err = `${(typeof promiseArr)} ${promiseArr} is not iterable (cannot read property Symbol(Symbol.iterator))`
        reject(new TypeError(err))
        return
      }
      // 空数组直接返回
      if (promiseArr.length === 0) {
        resolve([])
      }
      promiseArr.forEach((promise, index) => {
        if (isPromise(promise)) {
          promise.then(value => {
            formatResArr('fulFilled', value, index, resolve)
          }, reason => {
            formatResArr('rejected', reason, index, resolve)
          })
        } else {
          // 普通值直接进行收集即可
          formatResArr('fulFilled', promise, index, resolve)
        }
      })
      function formatResArr(status, value, index, resolve) {
        switch (status) {
          case 'fulFilled':
            resArr[index] = {
              status,
              value
            }
            break
          case 'rejected':
            resArr[index] = {
              status,
              reason: value
            }
            break
        }
        if (++idx === promiseArr.length) {
          resolve(resArr)
        }
      }
    })

  }
  // 数组中谁先有结果，就拿谁的结果
  static race(promiseArr) {
    return new MyPromise((resolve, reject) => {
      if (!isIterable(promiseArr)) {
        const err = `${(typeof promiseArr)} ${promiseArr} is not iterable (cannot read property Symbol(Symbol.iterator))`
        reject(new TypeError(err))
        return
      }
      promiseArr.forEach(item => {
        console.log('item: ', item);
        if (isPromise(item)) {
          // 这里直接用类传入进来的resolve和reject方法就可以了
          // 里面是默认接收一个value/reason的
          item.then(resolve, reject)
        } else {
          resolve(item)
        }
      })
    })
  }
  // 相当于是一个中介，传递的回调必须执行，执行完毕后再将原本的结果传递回去
  finally(finallyCallback) {
    return this.then((value) => {
      // 等待回调执行完毕后，再调用then方法，最后将上次then的返回值给传回去
      return MyPromise.resolve(finallyCallback())
        .then(() => value)
    }, (reason) => {
      // 这里依然是resolve返回
      return MyPromise.resolve(finallyCallback())
        // 等待回调执行完毕后，再调用then方法，将一开始拒绝的错误直接抛出去
        .then(() => {
          throw reason
        })
    })
  }
}

// 处理promise的resolve/reject的返回结果
function resolvePromise(p2, x, resolve, reject) {
  if (x === p2) {
    // 这里直接返回拒绝状态，并且不让下面的代码再执行
    return reject(new TypeError('Chaining cycle detected for promise #<MyPromise>'))
  }
  // 解决2.3.3.3.3情况
  // TODO：这个锁应该是处理thenable多次调用resolve和reject的？
  let called = false

  // 文档2.3.3逻辑实现
  if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
    // 这个 try catch 需要放在这里，放在外面的话会报错
    try {
      const then = x.then
      // 2.3.3.3实现
      if (typeof then === 'function') { // 这代表x是一个thenable或者是一个promise
        // 2.3.3.1/2.3.3.2。这里执行then方法，拿到结果后，onFulFilled调用resolve，onRejected调用reject
        then.call(x, (y) => {
          if (called) return
          called = true
          // 这里直接进行递归，处理后面返回值还是promise的情况
          resolvePromise(p2, y, resolve, reject)
        }, (r) => {
          if (called) return
          called = true
          reject(r)
        })
      } else { // 否则直接进行返回
        // thenable可能会重复执行resolve，此时会重复执行，所以得限制
        if (called) return
        called = true
        resolve(x)
      }
    } catch (error) {
      // thenable可能在执行完resolve/reject后，再抛出一个错误，此时会重复执行，所以得限制
      if (called) return;
      called = true;
      reject(error)
    }
  } else {
    resolve(x)
  }
}
// 判断是否为promise/thenable对象
function isPromise(x) {
  if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
    const then = x.then
    return typeof then === 'function'
  }
  return false
}
// 判断对象是否可迭代
function isIterable(value) {
  const valueType = typeof value
  const iteratorType = typeof value[Symbol.iterator]
  return valueType !== 'undefined' && valueType !== null && iteratorType === 'function'
}

module.exports = MyPromise