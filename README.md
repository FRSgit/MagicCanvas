[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Cool canvas effect right for your website!
    
## Dependencies

Magic canvas **doesn't** have any dependencies, it's vanilla-js only!

```html
<script src="magic-canvas.js" type="text/javascript"></script>
```

## Important info

This effect needs considerable performance to work smoothly and shows best results when used in [browsers which support](https://caniuse.com/#feat=requestanimationframe) [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)


## Examples

##### Demo1: heart-beat effect ([see live](https://FRSgit.github.io/MagicCanvas/hearbeat))

```javascript
MagicCanvas.draw({
    lineLen : 30, // length of hive's side
    heartBeatCD : 3000, // boom period
    heartBeatRange : 300, // boom range
    rgb : function (circlePos, heartBeatCenter) {
        var px = circlePos.x; // a point on boom circle
        var py = circlePos.y;
        var hbcx = heartBeatCenter.x;
        var hbcy = heartBeatCenter.y;

        var dis = Math.pow(px - hbcx, 2) + Math.pow(py - hbcy, 2);
        var maxDis = 300 * 300;

        var r = parseInt(255 * dis / maxDis);
        
        // your custom computation here...
        
        return { r:r, g:217, b:203 };
    },
    // rgb property can be object as well:
    //  rgb: {r:156,g:217,b:249};
    zIndex: -9999 // stack order
})
```

##### Demo2: random-move effect ([see live](https://FRSgit.github.io/MagicCanvas/randomMove))

```javascript
MagicCanvas.draw({
    type:"random-move",
    rgb : function (circlePos) {
        var px = circlePos.x; // point position
        var py = circlePos.y;
        // do some computation....
        return { r:parseInt(px % 255), g:parseInt(py % 255), b:203 };
    },
     // rgb property can be object as well:
     //  rgb: {r:156,g:217,b:249};
    zIndex : -9999 // stack order
})
```
