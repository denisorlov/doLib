$do = window.$do?$do:{};
$do.elementUtils = {};

$do.elementUtils.getCoords = function(element) {
    var box = element.getBoundingClientRect(),
        body = document.body,
        docElem = document.documentElement,

        scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop,
        scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft,

        clientTop = docElem.clientTop || body.clientTop || 0,
        clientLeft = docElem.clientLeft || body.clientLeft || 0,


        left =  box.left + scrollLeft - clientLeft,
        right = box.right + scrollLeft - clientLeft,
        top  =  box.top +  scrollTop - clientTop,
        bottom = box.bottom +  scrollTop - clientTop;

    return { top: Math.round(top), left: Math.round(left), right: Math.round(right), bottom: Math.round(bottom) };
};

$do.elementUtils.getScrollBarWHObj = function () {
    var outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    outer.style.height = "100px";
    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

    document.body.appendChild(outer);

    var widthNoScroll = outer.offsetWidth;
    var heightNoScroll = outer.offsetHeight;
    // force scrollbars
    outer.style.overflow = "scroll";

    // add innerdiv
    var inner = document.createElement("div");
    inner.style.width = "100%";
    inner.style.height = "100%";
    outer.appendChild(inner);

    var widthWithScroll = inner.offsetWidth;
    var heightWithScroll = inner.offsetHeight;

    // remove divs
    outer.parentNode.removeChild(outer);

    return {w: widthNoScroll - widthWithScroll, h: heightNoScroll - heightWithScroll};
};

$do.elementUtils.getStyle = function(elem){
	return window.getComputedStyle ? getComputedStyle(elem, "") : elem.currentStyle;
}

$do.elementUtils.headAppendStyle = function(cssText){
    var head = document.getElementsByTagName('head')[0];
    var style = document.createElement('style');
    style.type = 'text/css';
    if (style.styleSheet) {// для IE
        style.styleSheet.cssText = cssText;
    } else {
        style.appendChild(document.createTextNode(cssText));
    }
    head.appendChild(style);
}

$do.elementUtils.cloneNode = function(elem, deep){
    var clone = elem.cloneNode(deep),
        style = $do.elementUtils.getStyle(elem);
    for(var k in style)
        clone.style[k] = style[k];
    return clone;
}

{/* CLASSNAME */
	$do.elementUtils.addClass = function(el, cls) { 
	  var c = el.className.split(' ');
	  for (var i=0; i<c.length; i++) {
		if (c[i] == cls) return;
	  }
	  c.push(cls);
	  el.className = c.join(' ');
	}

	$do.elementUtils.removeClass = function(el, cls) {
	  var c = el.className.split(' ');
	  for (var i=0; i<c.length; i++) {
		if (c[i] == cls) c.splice(i--, 1);
	  }

	  el.className = c.join(' ');
	}

	$do.elementUtils.hasClass = function(el, cls) {
	  for (var c = el.className.split(' '),i=c.length-1; i>=0; i--) {
		if (c[i] == cls) return true;
	  }
	  return false;
	}
}
