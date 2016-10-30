var $do = window.$do?$do:{};
$do.templateMapper = {_name:'do.templateMapper'};

$do.templateMapper.Options = function(obj){


    if(obj){
        for(var k in obj)
            if (this[k]!=undefined)
                this[k] = obj[k];
    }
}
$do.templateMapper.Object = function(_options){
    this.options = new $do.templateMapper.Options();
    for(var option in this.options)
        this.options[option] = _options && _options[option] !==undefined  ? _options[option] : this.options[option];
	
	/** PRIVATE */
	var recursion = '__recursion__',
		_this = this;
	
	function prepareTemplate(_class, parentNode){
		parentNode = parentNode ? parentNode : document;
		var tmpl = parentNode.querySelector('.'+_class);
		if(tmpl==null) throw new Error('Not found element with the class name: "'+_class+'"');
		
		var j, tmpls = parentNode.querySelectorAll('.'+_class);
		for(j=tmpls.length-1;j>0;j--)
			tmpls[j].remove();
		
		return tmpl;
	}

	function applyObjToClass(obj, _class){
		var tmpl = prepareTemplate(_class);
		
		for(var i in obj){// i = 0, 1,...N
			var item = obj[i],
				clone = tmpl.cloneNode(true);// Block of elements
			applyObjToBlock(item, clone, _class);
			insertElem(clone, tmpl, _class);
		}
		hideTemplate(tmpl, _class);
	}
	
	function applyObjToBlock(obj, block, _class){
		for(var p in obj){// p = name, price...
			if(p == recursion) continue;
			
			var targetElem = block.querySelector('.'+p);
			if(targetElem==null) 
					throw new Error('Not found element with the class name: "'+p+
								  '" inside an element with the class name: "'+_class+'"');
			var tObj = obj[p];
			applyObjToElem(tObj, targetElem);
		}
	}
	
	function applyObjToElem(tObj, targetElem){
		if(typeof tObj == 'string'){
			targetElem.textContent = tObj;
		}else{
			for(var q in tObj){
				targetElem[q] = tObj[q];
			}
		}
	}
	
	function insertElem(clone, tmpl, _class){
		tmpl.parentNode.insertBefore(clone, tmpl);
	}
	
	function hideTemplate(tmpl, _class){
		tmpl.remove();
	}
	
	/** PUBLIC */
	this.applyData = function (data){
		for(var _class in data){
			applyObjToClass(data[_class], _class);
		}
	}
	
	this.applyObjToClassRecursive = function (obj, outerClass, innerClass /*recursive params*/, outerTmpl, parentElem){
		
		if(!outerTmpl){// первый проход
			outerTmpl = prepareTemplate(outerClass);
		}
		var j, i, innerTmpl = outerTmpl.querySelector('.'+innerClass),
			outerElem = outerTmpl.cloneNode(false);
			
		if(parentElem){
			parentElem.appendChild(outerElem);
		}else{
			insertElem(outerElem, outerTmpl, outerClass);
		}
		
		if(obj instanceof Array){
			for(j=0;j<obj.length;j++){
				var item = obj[j],
					innerBlock = innerTmpl.cloneNode(true);
				applyObjToBlock(item, innerBlock, innerClass);
				outerElem.appendChild(innerBlock);
				
				if(item[recursion]){
					this.applyObjToClassRecursive(item[recursion], outerClass, innerClass, outerTmpl, innerBlock);
				}
			}
		}else{
			var item = obj,
				innerBlock = innerTmpl.cloneNode(true);
			applyObjToBlock(item, innerBlock, innerClass);
			outerElem.appendChild(innerBlock);
		}
		
		hideTemplate(outerTmpl, outerClass);
	}
	
}	
