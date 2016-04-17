$do = window.$do?$do:{};
$do.eventUtils = {};

$do.eventUtils.fixEvent = fixEvent;
function fixEvent(e){
    e = e || window.event;

    if (!e.target) e.target = e.srcElement;

    if (e.pageX == null && e.clientX != null ) { // если нет pageX..
        var html = document.documentElement;
        var body = document.body;

        e.pageX = e.clientX + (html.scrollLeft || body && body.scrollLeft || 0);
        e.pageX -= html.clientLeft || 0;

        e.pageY = e.clientY + (html.scrollTop || body && body.scrollTop || 0);
        e.pageY -= html.clientTop || 0;
    }

    if (!e.which && e.button) {
        e.which = e.button & 1 ? 1 : ( e.button & 2 ? 3 : ( e.button & 4 ? 2 : 0 ) )
    }

    return e;
}

$do.eventUtils.getWheelDelta = getWheelDelta;
function getWheelDelta(e){
    var delta = 0,
        event = this.fixEvent(e);

    if (event.wheelDelta) {
        delta = event.wheelDelta/120;
        if (window.opera) delta = -delta;
    } else if (event.detail) {
        delta = -event.detail/3;
    }
    // в опере наоборот
    return navigator.userAgent.search(/Opera/) > -1 ? delta : -delta;
}

$do.eventUtils.addEvent = function(){};
$do.eventUtils.removeEvent = function(){};
(function(){
    if (document.addEventListener) { // проверка существования метода
        $do.eventUtils.addEvent = function(elem, type, handler, capture) {
            elem.addEventListener(type, handler, capture ? true : false);

            $do.eventUtils.addToReestr(elem, type, handler, capture ? true : false);
        }
        $do.eventUtils.removeEvent = function(elem, type, handler, capture) {
            elem.removeEventListener(type, handler, capture ? true : false);

            $do.eventUtils.removeFromReestr(elem, type, handler, capture ? true : false);
        }
    } else {
        $do.eventUtils.addEvent = function(elem, type, handler) {

            var scope = elem._listeners || {},
                listeners = scope[ type ] = scope[ type ] || [],
                proxy = function() {
                    handler.call( elem, window.event );
                }

            listeners[ listeners.length ] = {
                original: handler,
                proxy: proxy
            }
            elem._listeners = scope;

            elem.attachEvent("on" + type, proxy);

            $do.eventUtils.addToReestr(elem, type, handler, false);
        }
        $do.eventUtils.removeEvent = function(elem, type, handler) {

            var scope = elem._listeners || {},
                listeners = scope[ type ] || [];

            for( var i = listeners.length - 1; i >= 0; i-- ) {
                if ( listeners[ i ].original === handler ) {
                    elem.detachEvent( "on" + type, listeners[ i ].proxy );
                    listeners.splice( i, 1 );
                    break;
                }
            }

            $do.eventUtils.removeFromReestr(elem, type, handler, false);
        }
    }
}());

/** реестр добавленных событий */
$do.eventUtils.reestr = {};
$do.eventUtils.addToReestr = function(elem, type, handler, capture){
    $do.eventUtils.reestr[elem] = $do.eventUtils.reestr[elem]?$do.eventUtils.reestr[elem]:{};
    $do.eventUtils.reestr[elem][type] = $do.eventUtils.reestr[elem][type]?$do.eventUtils.reestr[elem][type]:[];
    $do.eventUtils.reestr[elem][type].push({handler:handler, capture:capture, elem: elem});
};
$do.eventUtils.removeFromReestr = function(elem, type, handler, capture){
    var i,
        arr = $do.eventUtils.reestr[elem] && $do.eventUtils.reestr[elem][type]?$do.eventUtils.reestr[elem][type]:[];
    for(i=arr.length-1;i>-1;i--){
        if(arr[i].handler==handler){
            arr.splice(i, 1);
        }
    }
};

$do.eventUtils.DocumentListener = function(){
    var _this = this,

        events = {
            'event_name':[ {func:0, context:0} ]// example
        };
    this.events = events;
    this.add = function(eventName, func, context){
        if(!events[eventName]){
            $do.eventUtils.addEvent(document, eventName,
                (function(eventName){// closure
                    return function(){
                        //console.info('documentListener of '+eventName); console.dir(_this);
                        _this.callFunc(eventName);
                    }
                }(eventName))
            );
            events[eventName] = [];
        }
        events[eventName].push({func: func, context:context});
    }

    this.callFunc= function(eventName){
        if(!events[eventName]) return;
        for(var i in events[eventName]){
            var obj = events[eventName][i];
            // отложенный запуск
            setTimeout((function(obj){// closure
                return function(){
                    obj.func.call((obj.context?obj.context:window));
                }
            }(obj)), 0);
        }
    }
}
