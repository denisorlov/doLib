!window.$do?alert("Требуется do.common.js")/* or $do:{}*/:$do.table = {_name:'do.table'};
/** dependences */
$do.table.dependences = ['$do.elementUtils', '$do.eventUtils', '$do.resizer', '$do.dragger'];
$do.common.checkDependences($do.table);

$do.table.Options = function(obj){
    this.defaultColumnWidth = 100;
    //this.tableWidth='100%';//TODO ???
    this.fetchSize=25;

    this.getAndOutData = null;
    this.createRowsArray = null;

    this.thResizerOptions = new $do.resizer.Options({resizeY:false,leftHandleW:5});
    this.thDraggerOptions = new $do.dragger.Options({dragY:false});

    for(var k in this)// переопределяем
        this[k] = obj && obj[k]!=undefined ? obj[k] : this[k];
}
$do.table.Object = function(tableId, _options){
    $do.table.Options.call(this);// наследуем настройки
    for(var k in this)// переопределяем
        this[k] = _options && _options[k]!=undefined ? _options[k] : this[k];


    var _this = this,// for private methods
        tableId = tableId,
		table = document.getElementById(tableId),
        height=300,// высота всего компонента
		columnWidth = {},

        rowCount,
        lastRowStart, lastRowCount,
        scrollToAfterOutRows=-1,// скролировать после вывода строк

        cellClassName = 'doTableCell',
        defaultGroupId = 'doTableDefaultGroupId',
        dragThSourceClassName = 'doTableDragThSource',
        dragThTargetClassName = 'doTableDragThTarget',

        thResizer = new $do.resizer.Object(this.thResizerOptions),
        thDragger = new $do.dragger.Object(this.thDraggerOptions),

        /** индекс колонки, для связи с заголовком при изменения ширины и перетаскивании */
        columnIndexAttrName = 'data-column-index',
        groupIdAttrName = 'data-group-id',
        headLevelAttrName = 'data-head-level',

		outerDiv, headTable, mainDiv, scrollBarDiv, scrollDiv,

        sbObj = $do.elementUtils.getScrollBarWHObj(),
        scrollBarWidth = sbObj.w, scrollBarHeight = sbObj.h
	;
	
	{// public functions
		this.clearTBodies = function(){
			while (table.tBodies[0]) {
				table.removeChild(table.tBodies[0]);
			}
		}
		this.clearTHead = function(){
			while(getTHead().firstChild){
				table.tHead.removeChild(table.tHead.firstChild);
			}
		}

        this.outRows = function(data){
            var i, rows = _this.createRowsArray(data),
                headMap = getColumnIndexMap(getTHead().querySelectorAll('th['+columnIndexAttrName+']')),
                fragment = document.createDocumentFragment();
            for(i in rows){
                setColumnIndexAttrs(rows[i].querySelectorAll('td'));
                orderCells(rows[i], headMap);
                fragment.appendChild(rows[i]);
            }
            lastRowCount = rows.length;
            _this.clearTBodies();
            _this.getTBody().appendChild(fragment);

            _this.fixSize();

            if(scrollToAfterOutRows>-1){
                _this.scrollTo(scrollToAfterOutRows);
                scrollToAfterOutRows=-1;
            }
        }
        /**
         * добавление строки заголовка
         * @param tr
         * @param setIndices {boolean} расстановка индексов - привязок к колонкам {@link columnIndexAttrName}
         */
        this.headAppendRow = function(tr, setIndices){
            var head = getTHead(), i,
                trCnt = head.querySelectorAll('tr').length,
                thColl = tr.querySelectorAll('th');
            tr.setAttribute(headLevelAttrName, trCnt);
            for(i in thColl)
                if(thColl[i] instanceof HTMLElement) thColl[i].setAttribute(headLevelAttrName, trCnt);

            if(setIndices) setColumnIndexAttrs(thColl);
            head.appendChild(tr);
            this.fixSize();
        }

        /** общее кол-во строк запроса для отрисовки таблицы */
        this.setTotalRowCount = function(totalRowCount){
            rowCount = totalRowCount;
        };

        this.init = function(){
            if(!checkInit()) return;

            outerDiv  = document.getElementById(tableId+'_'+'outerDiv');
            if(outerDiv){// очищаем если уже создавали обертку
                outerDiv.parentNode.insertBefore(table, outerDiv);
                outerDiv.parentNode.removeChild(outerDiv);
            }

            var _template =
                '<div class="doTable" id=">tableId<_outerDiv" style="overflow-x: auto;overflow-y: hidden;/*height: tableHeightPx;*/border:solid 1px gray;position: relative;">'+
                '    <table id=">tableId<_headTable"></table>'+
                '    <div id=">tableId<_mainDiv" style="overflow: hidden;/*width = tableMain W+scrollBar W */">'+
                //'        <!--tableMain style="box-sizing: border-box;"-->'+
                '    </div>'+
                '    <div id=">tableId<_scrollBarDiv" style="overflow-x: hidden;overflow-y: auto;position: absolute;right: 0;top: 0;">'+
                '        <div id=">tableId<_scrollDiv" style="width: 1px;"></div>'+
                '    </div>'+
                '</div>',
                template = _template.replace(/>tableId</g, tableId),
                tmp = document.createElement('DIV');
            tmp.innerHTML = template;

            outerDiv = tmp.firstChild;//document.createElement('DIV');
            outerDiv.style.height = height+'px';
            $do.eventUtils.addEvent(outerDiv, 'scroll', (function(){//closure
                return function(){
                    scrollBarDiv.style.right = -this.scrollLeft+'px';
                }
            }())
            );
            table.parentNode.insertBefore(outerDiv, table);
            var fixSize = (function(){
                return function(){_this.fixSize()};
            }());
            $do.eventUtils.addEvent(outerDiv, 'scroll', fixSize);
            $do.eventUtils.addEvent(window, 'resize', fixSize);

            headTable = outerDiv.querySelector('#'+tableId+'_headTable');//document.createElement('TABLE');
//            headTable.id = tableId+'_headTable';
//            outerDiv.appendChild(headTable);

            mainDiv = outerDiv.querySelector('#'+tableId+'_mainDiv');//document.createElement('DIV');
            //mainDiv.style.width = this.tableWidth; // TODO
            //outerDiv.appendChild(mainDiv);

            //table.style.float = 'left';
            table.style.boxSizing = 'border-box';
            table.style.marginTop = '0px';// сбрасываем возможный "скролл"
            mainDiv.appendChild(table);

            scrollBarDiv = outerDiv.querySelector('#'+tableId+'_scrollBarDiv');//document.createElement('DIV');
            //scrollBarDiv.id = tableId+'_scrollBarDiv';
            //scrollBarDiv.style.float = 'left';
            scrollBarDiv.style.width = scrollBarWidth+'px'//'17px' ширина скролл-бара
            //mainDiv.appendChild(scrollBarDiv);

            scrollDiv = scrollBarDiv.querySelector('#'+tableId+'_scrollDiv');//document.createElement('DIV');
            //scrollBarDiv.appendChild(scrollDiv);

            // прокрутка руками
            $do.eventUtils.addEvent(scrollBarDiv, 'mousedown', (function(){//closure
                    return function(){
                        scrollBarDiv.scrollBarMouseDown = true;
                    }
                }())
            );
            $do.eventUtils.addEvent(document, 'mouseup', (function(){//closure
                    return function(){
                        if(scrollBarDiv.scrollBarMouseDown){
                            scrollBarDiv.scrollBarMouseDown = false;
                            _this.scrollTo(scrollBarDiv.scrollTop+1);
                        }
                    }
                }())
            );
            // срабатывает при любом изменении scrollTop, но если прокрутка руками - на выход
            $do.eventUtils.addEvent(scrollBarDiv, 'scroll', (function(){//closure
                return function(){
                    scrollBarDiv.title = scrollBarDiv.scrollTop+1;
                    if(!scrollBarDiv.scrollBarMouseDown){
                        _this.scrollTo(scrollBarDiv.scrollTop+1);
                    }
                }
            }())
            );

            var wheelListener = (function(scrollBarDiv){// замыкание
                return function (e){
                    var delta = $do.eventUtils.getWheelDelta(e);
                    if (delta){
                        scrollBarDiv.scrollTop+=delta;
                    }
                    e.preventDefault ? e.preventDefault():e.returnValue = false;
                }
            }(scrollBarDiv));
            $do.eventUtils.addEvent(outerDiv, 'DOMMouseScroll', wheelListener);
            outerDiv.onmousewheel = wheelListener;

            createStyle();

            initDragger();
            initResizer();

            console.assert(scrollBarDiv.scrollTop == 0, "scrollBarDiv.scrollTop != 0");
            lastRowStart = scrollBarDiv.scrollTop+1;/*0+1*/
            this.getAndOutData(lastRowStart, scrollBarDiv.scrollTop+this.fetchSize);
        }

        this.scrollTo = function(rowNumber){
            //lastRowStart, lastRowCount, this.tableHeightPx
            var tableHeight = parseInt($do.elementUtils.getStyle(table).height),//высота всех строк
                rowHeight = Math.floor(tableHeight/lastRowCount),// ~высота строки
                visibleHeight = getVisibleHeight(),
                visibleRowCnt = Math.floor(visibleHeight/rowHeight),// видимая область/высота строки
                loadedToEnd = lastRowStart+lastRowCount-1==rowCount, // загружено до конца строк
            // нижн. предел: загружено до конца ? последн.строка, иначе - по видимым строкам
                bottomLimit = loadedToEnd? rowCount : lastRowStart+lastRowCount-1-visibleRowCnt+1
            ;
            if(rowNumber<lastRowStart || rowNumber>bottomLimit){// вышли за пределы загруженного
                if(rowNumber>rowCount-this.fetchSize+1){
                    lastRowStart = Math.max(1, rowCount-this.fetchSize+1);// выбираем дынные до конца в пределах fetchSize
                    scrollToAfterOutRows = rowNumber;//  а потом скролируем в outRows до нужной строки
                    this.getAndOutData(lastRowStart, rowCount);// запускаем...
                }else{
                    if(rowNumber>1 && this.fetchSize>visibleRowCnt*2){
                        var diff = this.fetchSize-visibleRowCnt,
                            upMargin = Math.floor(diff/2);// верхний запас над видимым диапазоном
                        lastRowStart = Math.max(1, rowNumber-upMargin);// грузим от него
                        scrollToAfterOutRows = rowNumber;//  а потом скролируем в outRows до нужной строки
                        this.getAndOutData(lastRowStart, lastRowStart-1+this.fetchSize);// запускаем...
                    }else{
                        lastRowStart = rowNumber;
                        this.getTable().style.marginTop = '0px';// сбрасываем "скролл"
                        this.getAndOutData(lastRowStart, lastRowStart-1+this.fetchSize);
                    }
                }
            }else{
                var marginCnt = rowNumber-lastRowStart,// сколько строк нужно проскролить
                    i, coll = this.getTBody().querySelectorAll('tr'),
                    rowsHeight=0;// общая высота строк, кот. нужно проскролить
                for(i=0;i<marginCnt;i++){
                    if(coll[i] instanceof Element)
                        rowsHeight+=parseInt($do.elementUtils.getStyle(coll[i]).height);
                }
                clog('scroll Table: '+rowNumber+'  -'+rowsHeight);//(rowNumber-lastRowStart)*rowHeight
                this.getTable().style.marginTop = '-'+rowsHeight+'px';
            }
        }


        /**
         * @param content
         * @param TH boolean &lt;td&gt; or &lt;th&gt;
         * @returns {HTMLElement} &lt;td&gt;(or &lt;th&gt;)&lt;div&gt;[content]&lt;/div&gt;&lt;/td&gt;
         */
        this.createCell = function(content, TH){
            var td = document.createElement(TH ? 'TH':'TD'),
                div = document.createElement('DIV')
            ;

            div.classList.add(cellClassName);

            div.appendChild(content instanceof Node ? content : document.createTextNode(content));
            td.appendChild(div);
            return td
        }

        this.createCellTH = function(content, groupId, resize, drag){
            var th = this.createCell(content, true),
                div = getCellDiv(th),
                _this = this;

            groupId = groupId!=undefined ? groupId : defaultGroupId;
            th.setAttribute(groupIdAttrName, groupId);

            if(resize){
                div.style.borderRight = 'double 3px #BCBCBC';
                div.style.boxSizing  = 'border-box';

                thResizer.apply(div);
            }
            if(drag){
                thDragger.apply(th, div, true);
            }

            return th;
        }

        this.fixSize = function(){
            mainDiv.style.width = parseInt($do.elementUtils.getStyle(table).width)+scrollBarWidth+'px';

            var tableHeight = parseInt($do.elementUtils.getStyle(table).height),//высота всех строк
                visibleHeight = getVisibleHeight(),
                scrollBarDivHeight = height-scrollBarHeight;

            scrollBarDiv.style.height = scrollBarDivHeight+'px';
            if(rowCount==undefined) throw new Error('в getAndOutData необходимо вызвать setRowCount( общее_количество_строк )');
            if(tableHeight<visibleHeight && rowCount<=this.fetchSize){
                scrollDiv.style.height = '0px';
            }else{
                scrollDiv.style.height = (rowCount-1/*scrollTop from 0*/+scrollBarDivHeight)+'px';
            }
        }
    }
	
	{// private functions
		var
        clog = function(){
            if(!window.console) return;
            for(var i in arguments){
                typeof arguments[i] == 'object' ? console.dir(arguments[i]) : console.log(arguments[i]);
            }
        },

        getTHead = function(){
            return headTable.tHead ? headTable.tHead : headTable.appendChild(document.createElement('THEAD')), headTable.tHead;
        },

        /** карта позиций к индексам колонок { order( от нуля): columnIndex [,...]} */
        getColumnIndexMap = function(nodeList){
            var res = {}, i;
            for(i=0;i<nodeList.length;i++){
                res[i] = nodeList[i].getAttribute(columnIndexAttrName);
            }

            return res;
        },
        /** карта индексов ячеек в строке к позициям { columnIndex: order( от нуля) [,...]} */
        getOrderMap = function(nodeList){
            var res = {}, i;
            for(i=0;i<nodeList.length;i++){
                res[i] = nodeList[i].getAttribute(columnIndexAttrName);
            }

            return res;
        },

        /** see {@link getColumnIndexMap()} */
        orderCells = function(row, headMap){
            var rowMap = getColumnIndexMap(row.querySelectorAll('td['+columnIndexAttrName+']'));
            for(var o in headMap){
                if(headMap[o]!=rowMap[o]){
                    moveCell(row, headMap[o], o);//console.log(headMap[o],' --> ',o)// console.dir(headMap); console.dir(rowMap);
                }
                rowMap = getColumnIndexMap(row.querySelectorAll('td['+columnIndexAttrName+']'))
            }
        },
        /**
         * расстановка аттрибута {@link columnIndexAttrName}
         * @param {NodeList} list of TD or TH
         * */
        setColumnIndexAttrs = function(nodeList){
            for(i=0;i<nodeList.length;i++){
                var cell = nodeList[i], div = getCellDiv(cell);
                cell.setAttribute(columnIndexAttrName, i);// columnIndex
                div.setAttribute(columnIndexAttrName, i);
                div.style.width = calcColumnWidth(i)+'px';
            }
        },

        checkInit = function(){
            if(typeof _this.getAndOutData != 'function'){
                alert("Для объекта $do.table не определен метод \n" +
                    " getAndOutData(firstRow, lastRow) - получение и вывод данных, где \n" +
                    "    firstRow - от 1, lastRow - включительно\n" +
                    "    через this доступен текущий объект doTable\n"+
                    " ВАЖНО: в конце метода необходимо вызвать методы: \n"+
                    " this.setRowCount( общее_количество_строк ) - для построения скролл-бара\n"+
                    " this.outRows( data/*полученные данные*/ ) - для построения массива строк в методе createRowsArray(data)"
                );
                return false;
            }
            if(typeof _this.createRowsArray != 'function'){
                alert("Для объекта $do.table не определен метод \n" +
                    " createRowsArray(data) - создание массива строк из данных, где \n" +
                    "    data - данные, полученные внутри getAndOutData(firstRow, lastRow)");
                return false;
            }
            return true;
        },

        initDragger = function(){
            var onStart = thDragger.options.onStart;
            thDragger.options.onStart = function(event, th){
                var nodeList = getSameLevelGroupTh(th);
                for(var i=0;i<nodeList.length;i++){
                    var ind1 = getCellDiv(nodeList[i]).getAttribute(columnIndexAttrName),
                        ind2 = getCellDiv(th).getAttribute(columnIndexAttrName);
                    if(ind1==ind2){// та, что тащим
                        nodeList[i].classList.add(dragThSourceClassName);
                    }else{// куда тащим
                        nodeList[i].classList.add(dragThTargetClassName);
                    }
                }

                if(typeof onStart == 'function'){
                    onStart.apply(thDragger, arguments);
                }
            };

            var onEnd = thDragger.options.onEnd;
            thDragger.options.onEnd = function(event, th){
                var pageX = event.pageX,
                    nodeList = getSameLevelGroupTh(th);
                for(var i=0;i<nodeList.length;i++){
                    nodeList[i].classList.remove(dragThSourceClassName);
                    nodeList[i].classList.remove(dragThTargetClassName);

                    var coords = $do.elementUtils.getCoords(nodeList[i]);
                    if(coords.left<=pageX && coords.right>=pageX){
                        var tr = nodeList[i].parentNode,
                            sidx = getCellDiv(th).getAttribute(columnIndexAttrName),
                            tidx = getCellDiv(nodeList[i]).getAttribute(columnIndexAttrName),
                            orderMap = getOrderMap(tr.querySelectorAll('TH'));
                        //console.log(sidx, orderMap[sidx], tidx, orderMap[tidx]);
                        moveColumn(orderMap[sidx], orderMap[tidx]);
                    }
                }

                if(typeof onEnd == 'function'){
                    onEnd.apply(thDragger, arguments);
                }
            }
        },

        initResizer = function(){
            var onResize = thResizer.options.onResize;
            thResizer.options.onResize = function(event, div){
                var colIndex = div.getAttribute(columnIndexAttrName),
                    th = getDivCell(div),
                    groupId = th.getAttribute(groupIdAttrName),
                    level = th.getAttribute(headLevelAttrName);
                if(colIndex) _this.setColumnWidth(colIndex, div.style.width);

                if(level>0){// ровняем вышестоящий заголовок
                    var w = getSameLevelGroupThWidth(th),
                        grHeader = getTHead().querySelector('th['+headLevelAttrName+'="'+(level-1)+'"]'+
                                '['+groupIdAttrName+'="'+groupId+'"]');
                    if(grHeader!=null){
                        getCellDiv(grHeader).style.width = w+'px';
                    }
                }

                _this.fixSize();

                if(typeof onResize == 'function'){
                    onResize.apply(thResizer, arguments);
                }
            };
        },

        moveColumn = function(sIdx, fIdx) {
            var i=table.rows.length, h = headTable.rows.length;
            while (i--){
                moveCell(table.rows[i], sIdx, fIdx);
            }
            moveCell(headTable.rows[h-1], sIdx, fIdx);
        },

        moveCell = function(row, sIdx, fIdx) {
            var x = row.removeChild(row.cells[sIdx]);
            if (fIdx < row.cells.length) {
                row.insertBefore(x, row.cells[fIdx]);
            } else {
                row.appendChild(x);
            }
        },

        createStyle = function(){
            var cssText =
            '.'+cellClassName+'{\n'+
                '\twhite-space: nowrap; overflow: hidden;text-overflow: ellipsis;\n'+
            '}\n'
//            '#'+outerDiv.id+' th.'+dragThTargetClassName+'{\n'+
//                '\tbackground-color: #F1F1F1;\n'+
//            '}\n'+
//            '#'+outerDiv.id+' th.'+dragThSourceClassName+'{\n'+
//                '\topacity: 0.3;\n'+
//            '}\n'
            ;
            $do.elementUtils.headAppendStyle(cssText);
        },

        /** видимая область = всё - заголовки */
        getVisibleHeight = function(){
            return height - parseInt($do.elementUtils.getStyle(headTable).height);
        },
//		createRowsInFragment = function(rowsArray, forTHead){
//			var i, fragment = document.createDocumentFragment();
//			for(i in rowsArray){
//				var tr = createRow(rowsArray[i]);
//				fragment.appendChild(tr);
//			}
//
//			return fragment;
//		},
		
//		createRow = function(rowArray, forTHead){
//			var j,
//				tr = document.createElement('TR');
//			for(j in rowArray){
//				var td = document.createElement(forTHead?'TH':'TD'),
//					div = document.createElement('DIV')
//				;
//				div.style.whiteSpace= 'nowrap';
//				div.style.overflow= 'hidden';
//				div.style.textOverflow= 'ellipsis';
//
//				tr.appendChild(td);
//				td.appendChild(div);
//				div.appendChild(document.createTextNode('' + rowArray[j]));
//			}
//
//			return tr;
//		},
		
		calcColumnWidth = function(ind){
			return columnWidth[ind] ? columnWidth[ind]:_this.defaultColumnWidth;
        },

        setStyleForCollection = function(collection, name, value){
            var i, c = collection;
            for(i in c){
                if(c[i].style) c[i].style.width=value;
            }
        },
        /** div контейнер содержимого ячейки cell(td или th) */
        getCellDiv = function(cell){
            return cell.querySelector('.'+cellClassName);
        },
        getDivCell = function(div){
            return div.parentNode;
        },
        /** Получить все(NodeList) TH этого уровня(TR) и группы */
        getSameLevelGroupTh = function(th){
            var groupId = th.getAttribute(groupIdAttrName),
                level = th.getAttribute(headLevelAttrName);
            return document.querySelectorAll('#'+outerDiv.id+
                    ' tr['+headLevelAttrName+'="'+level+'"]  th['+groupIdAttrName+'="'+groupId+'"]');
        },
        getSameLevelGroupThWidth = function(th){
            var i, w = 0, c = getSameLevelGroupTh(th);
            for(i=0;i< c.length;c++){
                w+=parseInt(getCellDiv(c[i]).style.width);
            }
            return w;
        }
		;
	}
	
	{// accessors
		this.getTableId = function(){ return tableId };
		this.getTable = function(){ return table };
		this.getTFoot = function(){
			return table.tFoot ? table.tFoot : table.appendChild(document.createElement('TFOOT')), table.tFoot;
		}
		this.getTBody = function(){
			return table.tBodies[0] ? table.tBodies[0] :
                table.insertBefore(document.createElement('TBODY'), this.getTFoot()), table.tBodies[0];
		}
		this.setColumnWidth = function(ind, w){
			columnWidth[ind] = parseInt(w);
            if(outerDiv)// можно просетить до иници-ции обертки
                setStyleForCollection(this.getCells(ind), 'width', columnWidth[ind]+'px');
		}
        this.setHeight = function(table_height){
            height = parseInt(table_height);
        }
        this.getCells = function(ind){
            return document.querySelectorAll('#'+outerDiv.id+' ['+columnIndexAttrName+'="'+ind+'"]');
        }
	}

	return this;
}