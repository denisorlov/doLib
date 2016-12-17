/*
Create HTML table from object

example:
	tabler = new $do.tabler.Object();
	document.body.appendChild(tabler.objToTable(jsResult));
	
@author Денис Орлов http://denisorlovmusic.ru/
*/
//!window.$do?alert("Требуется do.common.js"):$do.tabler = {_name:'do.tabler'};
/** dependences */
//$do.tabler.dependences = ['$do.elementUtils', '$do.eventUtils'];
//$do.common.checkDependences($do.tabler);
var $do = window.$do?$do:{}; $do.tabler = {_name:'do.tabler'};

$do.tabler.Options = function(obj){
	/** change styles or only toggle classes, used in private method chgStyle() */
	this.changeStyles = true;
}
$do.tabler.Object = function(_options){
	this.options = new $do.tabler.Options();
    for(var option in this.options)
        this.options[option] = _options && _options[option] !==undefined  ? _options[option] : this.options[option];
	
	//PRIVATE
	var self = this;
	function isNotObj(obj){
		return typeof obj in {'string':0,'number':0,'boolean':0,'function':0};
	}
	/*private*/ function chgStyle(elem, styleName, value){
		if(self.options.changeStyles){
			elem.style[styleName] = value;
		}
	}
	function wrapperCollapse(wr){
		wr.classList.remove('expanded');
		wr.classList.add('collapsed');
		chgStyle(wr,'whiteSpace','nowrap');
		chgStyle(wr,'maxWidth','150px');
		chgStyle(wr,'maxHeight','3em');
	}
	function wrapperExpand(wr){
		wr.classList.remove('collapsed');
		wr.classList.add('expanded');
		chgStyle(wr,'whiteSpace','normal');
		chgStyle(wr,'maxWidth','none');
		chgStyle(wr,'maxHeight','none');
	}
	
	//PUBLIC
	/*public*/ this.objToTable = function(obj){
		if(isNotObj(obj)){
			return obj;
		}
		var k, table = document.createElement('TABLE'),
			thead = document.createElement('THEAD'),
			tbody = document.createElement('TBODY');
			table.appendChild(thead);
			table.appendChild(tbody);
		if(obj instanceof Array){
			for(var i=0; i<=obj.length; i++){
				if(i==0){
					thead.appendChild(this.objToTh(obj[i]));
				}
				var tr = this.objToTr(obj[i]);
				tr.classList.add( i%2==0 ? (chgStyle(tr,'backgroundColor','AliceBlue'), 'even') : 'odd' );
				tbody.appendChild(tr);
			}
		}else{
			thead.appendChild(this.objToTh(obj));
			tbody.appendChild(this.objToTr(obj));
		}
		table.classList.add('objectTable');	
		return table;
	}
	this.objToTr = function(obj){
		var k, tr = document.createElement('TR');
		if(isNotObj(obj)){
			var td = this.buildTd(obj);
			tr.appendChild(td);
			return tr;
		}
		for(k in obj){
			var td = this.buildTd(obj[k], k);
			tr.appendChild(td);
		}
		return tr;
	}
	
	this.wrapperPrepare = function(wr, val, key){
		if(typeof val in {'number':0,'boolean':0}){
			wr.style.fontWeight='bold';
		}
		wr.classList.add(typeof val);
		val === null || val === '' ? (wr.classList.add('empty'), chgStyle(wr, 'opacity', 0.5)) : 
			typeof val == 'number' ? chgStyle(wr, 'color', 'maroon') :
			typeof val == 'boolean' ? chgStyle(wr, 'color', (val?'green':'red')) :
			/^\d{4}-\d{2}-\d{2}/.test(val) ? (wr.classList.add('date'), chgStyle(wr, 'color', 'brown')) : // date
			/^a:\d{1,}:{.*/.test(val) ? (wr.classList.add('serialized'), chgStyle(wr, 'color', 'darkviolet')) : // serialized
			/^<[^<>]+>/.test(val) ? (wr.classList.add('markup'), chgStyle(wr, 'color', 'MediumVioletRed')) : // xml, html
			typeof val == 'string' ? chgStyle(wr, 'color', 'blue') : 0;
		wr.title = (key?key+': ':'')+(val+'').replace(/"/g, "''");
	}
	this.wrapperTreatValue = function(wr, val){
		val === null ? val = 'null' :
			val === '' ? val = 'empty string' : val = (val+'').
				replace(/</g, '&lt;').
				replace(/\n( *)(&lt;)/g, function(s, p1, p2){
					return '</br>'+(new Array(p1.length+1).join('&nbsp;'))+p2;//&nbsp;
				});
		wr.innerHTML = val;
	}

	this.buildTd = function(val, key){
		var td = document.createElement('TD'),
			wrapper = document.createElement('DIV');
		wrapperCollapse(wrapper);
		wrapper.ondblclick = function(){
			if(this.classList.contains('collapsed')){
				wrapperExpand(this);
			}else{
				wrapperCollapse(this);
			}
		}
		if(typeof val == 'object' && val!= null){
			wrapper.appendChild(this.objToTable(val));
		}else{
			this.wrapperPrepare(wrapper, val, key);
			this.wrapperTreatValue(wrapper, val);	
		}
		
		td.appendChild(wrapper);
		return td;
	}

	this.objToTh = function(obj){
		var k, tr = document.createElement('TR');
		if(isNotObj(obj)){
			var th = document.createElement('TH');
			tr.appendChild(th);
			return tr;
		}
		for(k in obj){
			var th = document.createElement('TH');
			th.appendChild(document.createTextNode(k));	
			tr.appendChild(th);	
		}
		return tr;
	}	
}