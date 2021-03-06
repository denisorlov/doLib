!window.$do?alert("Требуется do.common.js")/* or $do:{}*/:$do.dragger = {_name:'do.dragger'};
/** dependences */
$do.dragger.dependences = ['$do.elementUtils', '$do.eventUtils'];
$do.common.checkDependences($do.dragger);

$do.dragger.Options = function(obj){
    this.onMouseDown= function(event, element){};
    this.onStart= function(event, element){};
    this.onDrag= function(event, element){};
    this.onMouseUp= function(event, element){};

    this.dragX=true;
    this.dragY=true;

    this.leftNoHandleW=5;// размеры НЕ РУЧКИ для переноса,чтобы не пересекаться с do.resizer
    this.bottomNoHandleH=5;//

    this.zIndex = 1000;

    this.cursorChange=true;

    this.doDraggableClassName = 'doDraggable';
    this.cloneClassName = 'doDraggerClone';

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
        elem.classList.add(this.options.doDraggableClassName);
        elem._draggerData = {};
        elem._draggerData.handle = handle || elem;
        elem._draggerData.dragger = this;// link for document event
        elem._draggerData.cursor = $do.elementUtils.getStyle(elem._draggerData.handle).cursor;
        // отменить перенос и выделение браузера
        elem.onselectstart = elem.ondragstart = function() {return false;}

        $do.eventUtils.addEvent(elem, 'mousedown', function(e){
            if(inHandle(this, e)){//
                var _elem = this, coords = $do.elementUtils.getCoords(this);
                if(dragger.options.cursorChange){
                    _elem._draggerData.handle.style.cursor = 'move';
                }

                if(toClone){
                    var _elem = $do.elementUtils.cloneNode(this, true);
                    _elem._draggerData = this._draggerData;
                    _elem.style.position = 'absolute';
                    _elem.classList.add(this._draggerData.dragger.options.cloneClassName);
                    _elem.style.top= coords.top+'px'; _elem.style.left= coords.left+'px';
                    _elem.style.cursor = 'move';
                    document.body.appendChild(_elem);
                }

                document._dragging = _elem;

                var data = _elem._draggerData,
                    options = data.dragger.options,
                    e = $do.eventUtils.fixEvent(e);
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
                        options = elem._draggerData.dragger.options;
                    data.onStartComplit = false;
                    data.handle.style.cursor = data.cursor;
                    this._dragging = null;

                    if(typeof options.onMouseUp == 'function'){
                        options.onMouseUp(e, elem);
                    }

                    if(toClone){
                        elem.remove();
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