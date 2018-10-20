// dependencies
if(!window.jQuery){
  throw new Error( 'jQuery 3.0+ is required');
}
if(typeof history.pushState !== 'function'){
  throw new Error( 'HTML5-History-API is required, visit https://github.com/devote/HTML5-History-API');
}

$do = window.$do?$do:{};
/** $do dependences */
if(!$do.cache || typeof $do.cache.Object!=='function'){
  throw new Error( '$do.cache is required, visit https://github.com/denisorlov');
}
$do.application = {_name:'do.application'};

/** Options of $do.application.Object */
$do.application.Options = function(obj) {
  this.js_root = '/public/js';
  this.modules_dir = '/modules/';

  for(var k in this)// переопределяем
    this[k] = obj && obj[k]!==undefined ? obj[k] : this[k];
};
/**
 * @author Денис Орлов http://denisorlovmusic.ru/
 * @param _options $do.application.Options
 * @constructor
 */
$do.application.Object = function(_options) {
  $do.application.Options.call(this);// наследуем настройки
  for(var k in this)// переопределяем
    this[k] = _options && _options[k]!==undefined ? _options[k] : this[k];

  this.modules = {};
};
$do.application.Object.prototype = {
  console_log: true, // only for developing
  route: function(_path){
    var app = this, path = _path || '',
      pPath = this.parsePath(path),
      module = pPath.module,
      action = pPath.action
    ;
    if(!app.modules[module]){
      var scrpath = this.js_root+this.modules_dir+module+'.js';
      $.getScript( scrpath )
        .done(function( script, textStatus ) {
          app.runAction(path);
        })
        .fail(function( jqxhr, settings, exception ) {
          throw new Error( 'Failed getScript ' + scrpath);
        });
    }else{
      app.runAction(path);
    }
  },
  runAction: function(path){
    var pPath = this.parsePath(path);
    if(!this.modules[pPath.module]){
      throw new Error( 'Application has not module "'+pPath.module+'"');
    }else
    if(typeof this.modules[pPath.module][pPath.action] !== 'function'){
      throw new Error( 'Module "'+pPath.module+'" has not method '+pPath.action);
    }else{
      //setTimeout((function(_this, _pPath, _path){
        //return function(){_this.modules[_pPath.module][_pPath.action](_path);}
      //}(this, pPath, path)), 2000);
      this.modules[pPath.module][pPath.action](path);
    }
  },
  parsePath: function(path){
    var i, res = {},
      aPath = path.split('/');
    res.module = aPath[0] || 'index';
    res.action = aPath[1] || 'index';
    for (i=2;i<aPath.length;i+=2){
      res[aPath[i]] = aPath[i+1] || null;
    }
    return res;
  },
  _current_ajax_query: '',
  /**  */
  ajax: function(url, data, dataType, params, successFn, failFn){
    params = params || {};
    params.method = params.method || "GET";
    params.no_cache = params.no_cache || false;
    url =  url || '/';
    data = data || {};
    dataType  = dataType || 'json';// тип загружаемых данных

    var doApp = this,
      cacheKey = null;

    var doneFn = function(data, textStatus, jqXHR) {
      if(typeof successFn === 'function'){
        successFn.apply(null, [].slice.call(arguments));
      }else{
        throw new Error('Not defined ajax success method.');
      }
    };

    if(!params.no_cache){
      try{
        var cacheKeyOb = [
          url, data, dataType, params
        ];
        cacheKey = JSON.stringify(cacheKeyOb);
        if(cacheKey === this._current_ajax_query){
          if(this.console_log) {console.log('current_ajax_query already is '+cacheKey)};
          return;
        }
        var cacheData = this.cacheAjax.get(cacheKey);
        if(cacheData) {
          doneFn(cacheData); if(this.console_log) {console.log('gotten from cacheAjax')};
          return;
        }
      }catch(_e_){
      }
    }

    if(cacheKey){
		this._current_ajax_query = cacheKey; if(this.console_log) {console.log('current_ajax_query is '+cacheKey+'...')};
	}	
    $.ajax({
      method: params.method,
      url: url,
      data: data,
      cache: false, /* special for IE */
      dataType : dataType
    }).done(function(data, textStatus, jqXHR) {
      if(cacheKey){
        doApp.cacheAjax.add(cacheKey, data); if(doApp.console_log) {console.log('added to cacheAjax')};
      }
      doneFn.apply(null, [].slice.call(arguments));
    }).fail(function(jqXHR, textStatus, errorThrown ) {
      if(typeof failFn === 'function'){
        failFn.apply(null, [].slice.call(arguments));
      } else {
        var errMsg = jqXHR.responseJSON && jqXHR.responseJSON.error ? jqXHR.responseJSON.error : jqXHR.status +' '+ jqXHR.statusText;
        doApp.alert('Response from "'+url+'": '+errMsg);
      }
    }).always(function(data, textStatus, jqXHR) {
	    doApp._current_ajax_query = null;
    })
    ;
  },

  alert: function(mess){
    alert(mess);
  }
};
/// create application
var doApp = new $do.application.Object({
  js_root:      '/public/js',
  modules_dir:  '/modules/'
});
doApp.cacheAjax = new $do.cache.Object({
  max_length: 10000, // max length of data, not count of store array
  default_life_time_sec: 10
});

$( document ).ready(function() {
  $( document ).bind( 'click', function( event ) {
    if(event.target.tagName === 'A'){
      var link = event.target;
      if(window.location.host === link.host){
        history.pushState(null, null, link.href);
        // тут можете вызвать подгрузку данных и т.п.
        var _pathname = link.pathname.substr(1); // without /
        doApp.route(_pathname);
        // не даем выполнить действие по умолчанию
        return false;
      }
    }
  });
  // вешаем событие на popstate которое срабатывает при нажатии back/forward в браузере
  $(window).on('popstate', function(e) {
    // тут можете вызвать подгрузку данных и т.п.
    var _pathname = location.pathname.substr(1); // without /
    doApp.route(_pathname);
  });

  doApp.route(window.location.pathname.substr(1)); // without /
});