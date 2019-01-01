window.MagicCanvas = {
  reqId: 0,
  draw : function (opt) {
    var width
    var height
    var canvas
    var ctx
    var points
    var target
    var draw          = true
    var intersections = []
    var raf           = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.setImmediate ||
                        window.setTimeout.bind(window, 16)
    var caf           = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.clearImmediate ||
                        window.clearTimeout
    var NOOP          = function () {}
    var defaults      = {
      lineLen       : 30,
      heartBeatCD   : 3000,
      heartBeatRange: 300,
      rgb           : {r: 156, g: 217, b: 249},
      type          : 'heart-beat',
      zIndex        : -99999
    }
    var options       = extend(defaults, opt)

    if (typeof options.rgb !== 'function') {
      var rgb     = options.rgb
      options.rgb = function () { return rgb }
    }

    var animateType = options.type === 'random-move' ? animateRandomMove : animateHeartBeat

    // Main
    initMap()
    initAnimation()
    addListeners()

    function initMap () {
      canvas = document.getElementById('reactive-bg-canvas')

      width                 = document.documentElement.clientWidth
      height                = document.documentElement.clientHeight
      canvas.style.position = 'fixed'
      canvas.style.zIndex   = options.zIndex
      canvas.style.top      = '0px'
      canvas.style.left     = '0px'

      canvas.width  = width
      canvas.height = height

      target = {x: width / 2, y: height / 2, rx: width / 2, ry: height / 2}

      ctx = canvas.getContext('2d')

      createMap()
    }

    // Event handling
    function addListeners () {
      if (!('ontouchstart' in window)) {
        document.addEventListener('mousemove', mouseMove, {passive: true})
      }
      document.addEventListener('mouseenter', function (e) {
        draw = true
        mouseMove(e)
      }, {passive: true})

      document.addEventListener('mouseleave', function () {
        draw = false
      }, {passive: true})
      window.addEventListener('scroll', scroll, {passive: true})
      window.addEventListener('resize', resize, {passive: true})
    }

    function scroll () {
      target.x = target.rx + document.body.scrollLeft + document.documentElement.scrollLeft
      target.y = target.ry + document.body.scrollTop + document.documentElement.scrollTop
    }

    function mouseMove (e) {
      if (e.pageX || e.pageY) {
        target.x = e.pageX
        target.y = e.pageY
      } else if (e.clientX || e.clientY) {
        target.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft
        target.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop
      }

      target.rx = e.clientX
      target.ry = e.clientY
    }

    function resize () {
      if (this.reqId) {
        caf(this.reqId)
      }
      initMap()
      initAnimation()
    }

    // animation
    function initAnimation () {
      raf(NOOP)

      if (options.type === 'heart-beat') {
        setInterval(heartBeat, options.heartBeatCD)
      } else if (options.type === 'random-move') {
        animate()
        for (var i = 0; i < points.length; ++i) {
          shiftPoint(points[i])
        }
      }
    }

    function animate () {
      ctx.clearRect(0, 0, width, height)

      animateType()

      this.reqId = raf(animate)
    }

    function animateHeartBeat () {
      var count = 0

      for (var i = 0; i < intersections.length; ++i) {
        var intersection = intersections[i]
        if (intersection.circle.active > 0) {
          intersection.circle.active -= 0.012
          intersection.circle.draw()
        } else {
          ++count
        }
      }
      if (intersections.length > 0 && count === intersections.length) {
        intersections = []
      }
    }

    function animateRandomMove () {
      var rp           = getRelativeP()
      var pointsToDraw = {}

      for (var i = 0, len = points.length; i < len; ++i) {
        var point    = points[i]
        var distance = Math.abs(getDistance(rp, point))

        // detect points in range
        if (distance < 4000) {
          point.active        = 0.3
          point.circle.active = 0.6
        } else if (distance < 20000) {
          point.active        = 0.1
          point.circle.active = 0.3
        } else if (distance < 40000) {
          point.active        = 0.02
          point.circle.active = 0.1
        } else {
          continue
        }

        var closest = point.closest
        var pointId = point.id.toString()

        for (var j = 0; j < closest.length; ++j) {
          var closePoint = closest[j]
          var hash       = point.id < closePoint.id ? pointId + ' ' + closePoint.id : closePoint.id + ' ' + pointId

          if (pointsToDraw[hash] === void 0) {
            pointsToDraw[hash] = 0
          }

          pointsToDraw[hash] += point.active
        }

        point.circle.draw()
      }

      drawPoints(pointsToDraw)
    }

    function heartBeat () {
      animate()

      var clsP          = findClosest()
      var srcCircle     = new Circle(clsP, 0)
      var activeTime    = 3000 * 0.8
      var _frames       = activeTime * 60 / 1000
      var step          = options.heartBeatRange / _frames
      var sleep         = activeTime / _frames
      var originOpacity = 0.8
      var centerP       = getRelativeP()
      intersections     = []

      var f = function () {
        if (srcCircle.radius < options.heartBeatRange) {
          var srcRadiusSquared = srcCircle.radius * srcCircle.radius

          for (var i = 0; i < points.length; ++i) {
            var curP = points[i]
            if (getDistance(curP, srcCircle.pos) < srcRadiusSquared) {
              for (var j = 0; j < curP.closest.length; ++j) {
                var clsP         = curP.closest[j]
                var intersection = getIntersection(curP, clsP, srcCircle)

                if (intersection !== undefined) {
                  intersection.circle        = new Circle(intersection, 1.2, centerP)
                  intersection.circle.active = originOpacity
                  originOpacity *= 0.999
                  intersections.push(intersection)
                }
              }
            }
          }

          setTimeout(f, sleep)
          srcCircle.radius += step
        }
      }

      if (draw) {
        f()
      }
    }

    function shiftPoint (p) {
      var random = Math.random()

      translate(p, (1 + random) * 1000, {
        x: p.originX - 50 + random * 100,
        y: p.originY - 50 + Math.random() * 100
      }, shiftPoint)
    }

    function translate (target, duration, stopCoords, callback) {
      var startX     = target.x
      var startY     = target.y
      var diffX      = stopCoords.x - startX
      var diffY      = stopCoords.y - startY
      var lastUpdate = Date.now()
      var startDate  = lastUpdate

      translateAnimate()

      function getEaseRatio (timeDDuration) {
        var r = 1 - timeDDuration
        return 1 - r * r
      }

      function translateAnimate () {
        var now               = Date.now()
        var lastUpdateTimeout = now - lastUpdate

        if (lastUpdateTimeout > 20) {
          var progressRatio = (now - startDate) / duration

          if (progressRatio >= 1) {
            finishTranslation()
            return
          }

          var easeRatio = getEaseRatio(progressRatio)

          target.x = startX + diffX * easeRatio
          target.y = startY + diffY * easeRatio

          lastUpdate = now
        }

        raf(translateAnimate)
      }

      function finishTranslation () {
        target.x = stopCoords.x
        target.y = stopCoords.y
        callback(target)
      }
    }

    function findClosest () {
      var closestP         = {x: -100, y: -100}
      var rp               = getRelativeP()
      var closestPDistance = getDistance(rp, closestP)

      for (var i = 0; i < points.length; ++i) {
        var curP     = points[i]
        var distance = getDistance(rp, curP)

        if (distance < closestPDistance) {
          closestPDistance = distance
          closestP         = curP
        }
      }

      return closestP
    }

    function getNeighborPoint (p, type) {
      var deg           = 60 * Math.PI / 180
      var deltaY        = options.lineLen * Math.sin(deg)
      var deltaX        = options.lineLen * Math.cos(deg)
      var res           = {closest: []}
      var typeModulator = -1

      switch (type) {
        case 'right':
          typeModulator = 1
        case 'left': // eslint-disable-line
          res.x = p.x + options.lineLen * typeModulator
          res.y = p.y
          break
        case 'rightBottom':
          typeModulator = 1
        case 'rightTop': // eslint-disable-line
          res.x = p.x + deltaX
          res.y = p.y + deltaY * typeModulator
          break
        case 'leftBottom':
          typeModulator = 1
        default: // eslint-disable-line
          res.x = p.x - deltaX
          res.y = p.y + deltaY * typeModulator
      }

      res.type = type
      p.closest.push(res)
      res.closest.push(p)

      return res
    }

    // equation
    function getIntersection (p1, p2, circle) {
      var d1     = getDistance(p1, circle.pos)
      var d2     = getDistance(p2, circle.pos)
      var maxDis = Math.sqrt(Math.max(d1, d2))
      var minDis = Math.sqrt(Math.min(d1, d2))

      if (minDis < circle.radius && maxDis > circle.radius) {
        var k     = (p1.y - p2.y) / (p1.x - p2.x)
        var b     = p1.y - k * p1.x
        var c     = -circle.pos.x
        var d     = -circle.pos.y
        var r     = circle.radius
        var kxdb  = k * (d + b)
        var kSqr1 = k * k + 1
        var cxk   = c * k

        var delta        = kSqr1 * r * r - cxk * cxk + 2 * kxdb * c -
                           Math.pow(d + b, 2)
        var preCandidate = Math.sqrt(delta) - kxdb - c
        var candidateX1  = (-1 * preCandidate) / kSqr1
        var candidateX2  = preCandidate / kSqr1

        var candidateX = (candidateX1 < Math.max(p1.x, p2.x) && candidateX1 > Math.min(p1.x, p2.x))
                         ? candidateX1 : candidateX2
        var candidateY = k * candidateX + b
        return {x: candidateX, y: candidateY}
      }

      return undefined
    }

    function Circle (pos, rad, centerP) {
      this.pos     = pos || null
      this.radius  = rad || null
      this.centerP = centerP

      this.draw = function () {
        if (this.active === 0) {
          return
        }
        ctx.beginPath()
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false)
        var rgbRes    = options.rgb(this.pos, this.centerP || this.pos)
        rgbRes        = rgbRes.r + ',' + rgbRes.g + ',' + rgbRes.b
        ctx.fillStyle = 'rgba(' + rgbRes + ',' + this.active + ')'
        ctx.fill()
      }
    }

    // Canvas manipulation
    function drawPoints (ps) {
      var rgbRes            = options.rgb(target)
      var strokeStylePrefix = 'rgba(' + rgbRes.r + ',' + rgbRes.g + ',' + rgbRes.b + ','
      var hash

      for (hash in ps) {
        var active = ps[hash]
        var p      = hash.split(' ')
        var p1     = points[parseInt(p[0])]
        var p2     = points[parseInt(p[1])]

        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = strokeStylePrefix + active + ')'
        ctx.stroke()
      }
    }

    // Util
    function extend (a, b) {
      for (var key in b) {
        if (b.hasOwnProperty(key)) {
          a[key] = b[key]
        }
      }
      return a
    }

    function getDistance (p1, p2) {
      return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
    }

    function createMap () {
      if (options.type === 'random-move') {
        points   = []
        var wD20 = width / 20
        var hD20 = height / 20

        for (var x = 0; x < width; x = x + wD20) {
          for (var y = 0; y < height; y = y + hD20) {
            var px = x + Math.random() * wD20
            var py = y + Math.random() * hD20
            points.push({x: px, originX: px, y: py, originY: py})
          }
        }

        // for each point find the 5 closest points
        for (var i = 0; i < points.length; ++i) {
          var closest = []
          var p1      = points[i]

          p1.id = i

          for (var j = 0; j < points.length; ++j) {
            var p2 = points[j]

            if (!(p1 === p2)) {
              var placed = false

              for (var k = 0; k < 5; ++k) {
                if (closest[k] === undefined) {
                  closest[k] = p2
                  placed     = true
                  break
                }
              }

              if (placed === false) {
                var p1p2Distance = getDistance(p1, p2)

                for (var k1 = 0; k1 < 5; ++k1) {
                  if (p1p2Distance < getDistance(p1, closest[k1])) {
                    closest[k1] = p2
                    break
                  }
                }
              }
            }
          }

          p1.closest = closest
        }

        // assign a circle to each point
        for (var i1 = 0; i1 < points.length; ++i1) {
          points[i1].circle = new Circle(points[i1], 2 + Math.random() * 2, undefined)
        }
      } else if (options.type === 'heart-beat') {
        var source      = {x: width / 2, y: height / 2, closest: []}
        var pointsQueue = [
          getNeighborPoint(source, 'left'),
          getNeighborPoint(source, 'rightTop'),
          getNeighborPoint(source, 'rightBottom')
        ]

        // create points
        points = [source]

        while (pointsQueue.length > 0) {
          var p = pointsQueue.pop()

          if (p.x > 0 && p.x < width && p.y > 0 && p.y < height) {
            var same     = false
            var minLimit = Math.pow(options.lineLen, 2) * 0.1

            for (var i2 = 0; i2 < points.length; ++i2) {
              var savedP = points[i2]

              if (getDistance(p, savedP) < minLimit) {
                same = true
                break
              }
            }

            if (same === false) {
              points.push(p)

              var type = p.type

              switch (type) {
                case 'leftTop':
                case 'leftBottom':
                  pointsQueue.unshift(getNeighborPoint(p, 'left'))
                  pointsQueue.unshift(getNeighborPoint(p, type === 'leftTop' ? 'rightTop' : 'rightBottom'))
                  break
                case 'rightTop':
                case 'rightBottom':
                  pointsQueue.unshift(getNeighborPoint(p, 'right'))
                  pointsQueue.unshift(getNeighborPoint(p, type === 'rightTop' ? 'leftTop' : 'leftBottom'))
                  break
                case 'left':
                  pointsQueue.unshift(getNeighborPoint(p, 'leftBottom'))
                  pointsQueue.unshift(getNeighborPoint(p, 'leftTop'))
                  break
                default:
                  pointsQueue.unshift(getNeighborPoint(p, 'rightBottom'))
                  pointsQueue.unshift(getNeighborPoint(p, 'rightTop'))
              }
            }
          }
        }

        // assign a circle to each point
        for (var i3 = 0; i3 < points.length; ++i3) {
          points[i3].circle = new Circle(points[i3], 2)
        }
      }
    }

    function getRelativeP () {
      var offset

      if (!canvas.getClientRects().length) {
        offset = {top: 0, left: 0}
      } else {
        var rect = canvas.getBoundingClientRect()
        var win  = canvas.ownerDocument.defaultView
        offset   = {
          top : rect.top + win.pageYOffset,
          left: rect.left + win.pageXOffset
        }
      }

      return {x: target.x - offset.left, y: target.y - offset.top}
    }
  }

}
