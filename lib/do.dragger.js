!window.$do?alert("Требуется do.common.js")/* or $do:{}*/:$do.dragger = {_name:'do.dragger'};
/** dependences */
$do.dragger.dependences = ['$do.elementUtils', '$do.eventUtils'];
$do.common.checkDependences($do.dragger);

$do.dragger.Options = function(obj){
    this.onMouseDown= function(event, element){};
    this.onStart= function(event, element){};
    this.onDrag= function(event, element){};
    this.onEnd= function(event, element){};

    this.dragX=true;
    this.dragY=true;

    this.leftNoHandleW=5;// размеры НЕ РУЧКИ для переноса,чтобы не пересекаться с do.resizer
    this.bottomNoHandleH=5;//

    this.zIndex = 1000;

    this.cursorChange=true;

    if(obj){
        for(var k in obj)
            if (this[k]!=undefined)
                this[k] = obj[k];
    }
}
$do.dragger.Object = function(_options){
    this.options = new $do.dragger.Options();
    for(var option in this.options)
        this.options[option] = _options && _options[option] !==undefined  ? _options[option] : this.options[option];

    this.apply = function(elem, handle, toClone/** клонировать элемент */){
        var dragger = this;
        elem._draggerData = {};
        elem._draggerData.dragger = this;// link for document event
        elem._draggerData.cursor = $do.elementUtils.getStyle(elem).cursor;
        // отменить перенос и выделение браузера
        elem.onselectstart = elem.ondragstart = function() {return false;}

        elem._draggerData.handle = handle || elem;

        if(dragger.options.cursorChange){
            $do.eventUtils.addEvent(elem, 'mousemove', function(e){
                if(inHandle(this, e)){
                    this._draggerData.handle.style.cursor = 'move';
                }
            });
            $do.eventUtils.addEvent(elem, 'mouseout', function(e){this._draggerData.handle.style.cursor = this._draggerData.cursor});
        }

        $do.eventUtils.addEvent(elem, 'mousedown', function(e){
            if(inHandle(this, e)){//
                var _elem = this, coords = $do.elementUtils.getCoords(this);
                if(toClone){
                    var _elem = $do.elementUtils.cloneNode(this, true);
                    _elem._draggerData = this._draggerData;
                    _elem.style.position = 'absolute';
                    _elem.style.top= coords.top+'px'; _elem.style.left= coords.left+'px';
                    document.body.appendChild(_elem);
                }

                document._dragging = _elem;

                var data = _elem._draggerData,
                    options = data.dragger.options,
                    e = fixEvent(e);
                data._shiftX = e.pageX - coords.left;
                data._shiftY = e.pageY - coords.top;
                data._startPageX = e.pageX;
                data._startPageY = e.pageY;
                data._startLeft = coords.left;
                data._startTop = coords.top;

                if(typeof options.onMouseDown == 'function'){
                    options.onMouseDown(e, elem);
                }

                e.preventDefault ? e.preventDefault() : e.returnValue = false;// отменить действие по умолчанию
            }
        });

        if(!document._draggerApplied){//достаточно одного слушателя для всех
            document._draggerApplied = true;

            $do.eventUtils.addEvent(document, 'mousemove', function(e){//
                if(!this._dragging) return;

                var elem = this._dragging,
                    data = elem._draggerData,
                    options = elem._draggerData.dragger.options,
                    e = $do.eventUtils.fixEvent(e),
                    diffY = e.pageY - data._startPageY,
                    diffX = e.pageX - data._startPageX;
                if( (options.dragY && diffY!=0) || (options.dragX && diffX!=0) ){

                    if(!data.onStartComplit){
                        //var style = $do.elementUtils.getStyle(elem);
                        document.body.appendChild(elem);
                        //for(var i in style) elem.style[i] = style[i];
                        elem.style.position = 'absolute';
                        elem.style.zIndex = options.zIndex; // над другими элементами
                    }

                    elem.style.top = (options.dragY ? e.pageY - data._shiftY : data._startTop)+ 'px';
                    elem.style.left = (options.dragX ? e.pageX - data._shiftX : data._startLeft)+ 'px';

                    if(!data.onStartComplit && typeof options.onStart == 'function'){
                        data.onStartComplit = true;
                        options.onStart(e, elem);
                    }
                    if(typeof options.onDrag == 'function'){
                        options.onDrag(e, elem);
                    }
                }
            });

            $do.eventUtils.addEvent(document, 'mouseup', function(e){
                if(this._dragging instanceof Element){
                    var elem = this._dragging,
                        data = elem._draggerData,
                        e = $do.eventUtils.fixEvent(e),
                        dragger = elem._draggerData.dragger;
                    data.onStartComplit = false;
                    this._dragging = null;
                    if(toClone){
                        elem.remove();
                    }

                    if(typeof dragger.options.onEnd == 'function'){
                        dragger.options.onEnd(e, elem);
                    }
                }
            });
        }
    }

    function inHandle(elem, event){
        var dragger = elem._draggerData.dragger,
            rOpt = dragger.options,
            e = $do.eventUtils.fixEvent(event),
            coord = $do.elementUtils.getCoords(elem);
        return e.target==elem._draggerData.handle &&
            // чтобы не пересекаться с do.resizer
            coord.bottom-e.pageY>parseInt(rOpt.bottomNoHandleH) && coord.right -e.pageX>parseInt(rOpt.leftNoHandleW)
    }
}