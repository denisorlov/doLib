!window.$do?alert("Требуется do.common.js")/* or $do:{}*/:$do.resizer = {_name:'do.resizer'};
/** dependences */
$do.resizer.dependences = ['$do.elementUtils', '$do.eventUtils'];
$do.common.checkDependences($do.resizer);

$do.resizer.Options = function(obj){
    this.minWidth= 20;
    this.minHeight= 20;
    this.maxWidth= screen.width;
    this.maxHeight= screen.height;

    this.onMouseDown= function(event, element){};
    this.onStart= function(event, element){};
    this.onResize= function(event, element){};
    this.onEnd= function(event, element){};

    this.resizeX=true;
    this.resizeY=true;
    this.leftHandleW=5;
    this.bottomHandleH=5;
    this.cursorChange=true;

    if(obj){
        for(var k in obj)
            if (this[k]!=undefined)
                this[k] = obj[k];
    }
}
$do.resizer.Object = function(_options){
    this.options = new $do.resizer.Options();
    for(var option in this.options)
        this.options[option] = _options && _options[option] !==undefined  ? _options[option] : this.options[option];

    this.apply = function(elem){
        var resizer = this;
        elem._resizerData = {};
        elem._resizerData.resizer = this;// link for document event
        elem._resizerData.cursor = $do.elementUtils.getStyle(someTable).cursor;
        // отменить перенос и выделение браузера
        elem.onselectstart = elem.ondragstart = function() {return false;}

        if(resizer.options.cursorChange){
            $do.eventUtils.addEvent(elem, 'mousemove', function(e){
                var curs = '';
                inMarginY(this, e)?curs+='s':0;
                inMarginX(this, e)?curs+='e':0;
                if(inMarginY(this, e) || inMarginX(this, e)){
                    this.style.cursor = curs+'-resize';
                }
            });
            $do.eventUtils.addEvent(elem, 'mouseout', function(e){this.style.cursor = this._resizerData.cursor});
        }

        $do.eventUtils.addEvent(elem, 'mousedown', function(e){
            if(inMarginY(this, e) || inMarginX(this, e)){//
                document._resizing = this;

                var data = this._resizerData,
                    options = data.resizer.options,
                    e = fixEvent(e);
                data._startPageX = e.pageX;
                data._startPageY = e.pageY;
                data._startWidth = parseInt($do.elementUtils.getStyle(this).width);
                data._startHeight = parseInt($do.elementUtils.getStyle(this).height);

                if(typeof options.onMouseDown == 'function'){
                    options.onMouseDown(e, elem);
                }

                e.preventDefault ? e.preventDefault() : e.returnValue = false;// отменить действие по умолчанию
            }
        });

        if(!document._resizerApplied){// достаточно одного слушателя для всех
            document._resizerApplied = true;

            $do.eventUtils.addEvent(document, 'mousemove', function(e){//
                if(!this._resizing) return;

                var elem = this._resizing,
                    data = elem._resizerData,
                    options = elem._resizerData.resizer.options,
                    e = $do.eventUtils.fixEvent(e),
                    diffY = e.pageY - data._startPageY,
                    diffX = e.pageX - data._startPageX;
                if( (options.resizeY && diffY!=0) || (options.resizeX && diffX!=0) ){
                    var _newHeight = data._startHeight+diffY,
                        _newWidth  = data._startWidth +diffX,
                        newHeight = Math.min( options.maxHeight, Math.max( options.minHeight, _newHeight )),
                        newWidth  = Math.min( options.maxWidth, Math.max( options.minWidth, _newWidth ))
                        ;

                    if(options.resizeY){
                        elem.style.height = newHeight+'px';
                    }
                    if(options.resizeX){
                        elem.style.width = newWidth+'px';
                    }

                    if(!data.onStartComplit && typeof options.onStart == 'function'){
                        data.onStartComplit = true;
                        options.onStart(e, elem);
                    }
                    if(typeof options.onResize == 'function'){
                        options.onResize(e, elem);
                    }
                }
            });

            $do.eventUtils.addEvent(document, 'mouseup', function(e){
                if(this._resizing instanceof Element){
                    var elem = this._resizing,
                        data = elem._resizerData,
                        e = $do.eventUtils.fixEvent(e),
                        resizer = elem._resizerData.resizer;
                    if(typeof resizer.options.onEnd == 'function'){
                        resizer.options.onEnd(e, elem);
                    }
                    data.onStartComplit = false;
                    this._resizing = null;
                }
            });
        }
    }

    function inMarginY(elem, event){
        var resizer = elem._resizerData.resizer,
            rOpt = resizer.options,
            e = $do.eventUtils.fixEvent(event),
            coord = $do.elementUtils.getCoords(elem);
        return rOpt.resizeY && coord.bottom-e.pageY<=parseInt(rOpt.bottomHandleH);
    }
    function inMarginX(elem, event){
        var resizer = elem._resizerData.resizer,
            rOpt = resizer.options,
            e = $do.eventUtils.fixEvent(event),
            coord = $do.elementUtils.getCoords(elem);
        return rOpt.resizeX && coord.right -e.pageX<=parseInt(rOpt.leftHandleW);
    }
}