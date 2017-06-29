/* eslint-env mocha */

var fs = require('fs')
var path = require('path')
var async = require('async')
var bytes = require('../utils/bytes.js')
require.main.filename = path.resolve(__filename, '..')
var log = require('../app')

describe('Proceed function', function () {
  var matchFile = /test-log-out-0__[a-zA-Z0-9]{5}__[0-9\-_]*.log/
  var matchFileCompress = /test-log-out-0__[a-zA-Z0-9]{5}__[0-9\-_]*.log.gz/

  after(function () {
    fs.unlinkSync('/tmp/test-log-out-0.log')
  })

  it('Proceed with wrong file', function (done) {
    var file = '/dev/null'
    var config = {
      maxSize: '100B',
      retain: undefined,
      compress: false,
      dateFormat: 'YYYY-MM-DD_HH-mm-ss',
      workerInterval: '30',
      rotateInterval: '0 0 * * *',
      rotateModule: true
    }

    log.proceed(config, file, false, function (err) {
      if (err) return done()

      return done('File mustn\'t exist')
    })
  })

  it('Proceed with default conf', function (done) {
    var file = '/tmp/test-log-out-0.log'
    var config = {
      maxSize: '100B',
      retain: undefined,
      compress: false,
      dateFormat: 'YYYY-MM-DD_HH-mm-ss',
      workerInterval: 30,
      rotateInterval: '0 0 * * *',
      rotateModule: true
    }

    fs.writeFileSync(file, Buffer.alloc(bytes(config.maxSize)))
    log.proceed(config, file, false, function () {
      var files = fs.readdirSync('/tmp')
      var test = files.filter(function (file) {
        return matchFile.test(file)
      })
      if (fs.statSync(file).size === 0 && test[0]) {
        test.forEach(function (file) {
          fs.unlinkSync('/tmp/' + file)
        })
        return done()
      }
      return done('No file create by proceed function')
    })
  })

  it('Proceed with compress = true', function (done) {
    var file = '/tmp/test-log-out-0.log'
    var config = {
      maxSize: '100B',
      retain: undefined,
      compress: true,
      dateFormat: 'YYYY-MM-DD_HH-mm-ss',
      workerInterval: '30',
      rotateInterval: '0 0 * * *',
      rotateModule: true
    }

    fs.writeFileSync(file, Buffer.alloc(bytes(config.maxSize)))
    log.proceed(config, file, false, function () {
      var files = fs.readdirSync('/tmp')
      var test = files.filter(function (file) {
        return matchFileCompress.test(file)
      })
      if (fs.statSync(file).size === 0 && test[0]) {
        test.forEach(function (file) {
          fs.unlinkSync('/tmp/' + file)
        })
        return done()
      }
      return done('No file create by proceed function')
    })
  })

  it('Proceed with retain = 5', function (done) {
    var file = '/tmp/test-log-out-0.log'
    var config = {
      maxSize: '100B',
      retain: 5,
      compress: false,
      dateFormat: 'YYYY-MM-DD_HH-mm-ss',
      workerInterval: '30',
      rotateInterval: '0 0 * * *',
      rotateModule: true
    }

    async.times(10, function (n, next) {
      fs.writeFileSync(file, Buffer.alloc(100))
      log.proceed(config, file, false, function (err, file) {
        next(err, file)
      })
    }, function (err, files) {
      if (err) return done(err)

      var dir = fs.readdirSync('/tmp')
      var test = dir.filter(function (file) {
        return matchFile.test(file)
      })
      test.forEach(function (file) {
        fs.unlinkSync('/tmp/' + file)
      })
      if (test.length !== 5) return done('Wrong number of files')
      return done()
    })
  })
})
