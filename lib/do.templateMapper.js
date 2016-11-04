var $do = window.$do?$do:{};
$do.templateMapper = {_name:'do.templateMapper'};
/** dependences */
$do.templateMapper.dependences = ['$do.elementUtils'];
$do.common.checkDependences($do.templateMapper);

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
		
	function notFoundElem(_class, parentNode){
		console && console.dir? console.dir(parentNode) :0;
		throw new Error( $do.templateMapper._name+': Unable to find an element with the class "'+_class+
			'" inside the element '+parentNode.nodeName.toLowerCase()+
			(parentNode.id?'#'+parentNode.id: (parentNode.className?'.'+parentNode.className:''))
		);
	}
	
	function prepareTemplate(_class, parentNode){
		parentNode = parentNode ? parentNode : document;
		var tmpl = parentNode.querySelector('.'+_class);
		if(tmpl==null) {
			notFoundElem(_class, parentNode);
		}
		
		var j, tmpls = parentNode.querySelectorAll('.'+_class);
		for(j=tmpls.length-1;j>0;j--)
			tmpls[j].remove();
		
		return tmpl;
	}

	function applyObjToClass(obj, _class, parentNode){
		parentNode = parentNode ? parentNode : document;
		var tmpl = prepareTemplate(_class, parentNode);
		
		for(var i in obj){// i = 0, 1,...N
			var item = obj[i],
				clone = tmpl.cloneNode(true);// Block of elements
			applyObjToBlock(item, clone, parentNode);
			insertElem(clone, tmpl, _class);
		}
		hideTemplate(tmpl, _class);
	}
	
	function applyObjToBlock(obj, block, parentNode){
		for(var _class in obj){// _class = name, price... 
			if(_class == recursion) continue;// ... or __recursion__ (not className)
			
			var targetElem = block.querySelector('.'+_class);
			if(targetElem==null){
				notFoundElem(_class, parentNode);
			}

			var tObj = obj[_class];
			applyObjToElem(tObj, targetElem);
		}
	}
	
	function applyObjToElem(tObj, targetElem){
		if(typeof tObj == 'string'){
			targetElem.textContent = tObj;
		}else{
			for(var q in tObj){
				if(q=='class' && !$do.elementUtils.hasClass(targetElem, tObj[q])){
					$do.elementUtils.addClass(targetElem, tObj[q]);
				}else{
					targetElem[q] = tObj[q];
				}
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
	this.applyData = function (data, parentNode){
		for(var _class in data){
			applyObjToClass(data[_class], _class, parentNode);
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
				applyObjToBlock(item, innerBlock, outerTmpl);
				outerElem.appendChild(innerBlock);
				
				if(item[recursion]){
					this.applyObjToClassRecursive(item[recursion], outerClass, innerClass, outerTmpl, innerBlock);
				}
			}
		}else{
			var item = obj,
				innerBlock = innerTmpl.cloneNode(true);
			applyObjToBlock(item, innerBlock, outerTmpl);
			outerElem.appendChild(innerBlock);
		}
		
		hideTemplate(outerTmpl, outerClass);
	}
	
}	
