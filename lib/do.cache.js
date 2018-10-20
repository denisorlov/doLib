$do = window.$do?$do:{};
$do.cache = {_name:'do.cache'};

$do.cache.Options = function(obj){
  /** max length of stringified data (not count of items of store array!) */
  this.max_length = 10000;
  /** default life time in sec */
  this.default_life_time_sec = 600;

  for(var k in this)// переопределяем
    this[k] = obj && obj[k]!==undefined ? obj[k] : this[k];
}
/**
 * FrontEnd cache.
 * @author Денис Орлов http://denisorlovmusic.ru/
 *
 * example: <pre>
 var cache = new $do.cache.Object({
    max_length: 10000, // max length of stringified data (not count of items of store array!)
    default_life_time_sec: 600 // 10 min
  });

 cache.add('some_key_1', value1 ); // for default_life_time_sec
 cache.add('some_key_2', value2 , 120); // for 2 min
 var v = cache.get('some_key');

 if(cache_not_needed){
    cache.clear();
 }
 </pre>
 * @param  _options $do.cache.Options
 * @constructor
 */
$do.cache.Object = function(_options) {
  $do.cache.Options.call(this);// наследуем настройки
  for(var k in this)// переопределяем
    this[k] = _options && _options[k]!==undefined ? _options[k] : this[k];
};
$do.cache.Object.prototype = {
  store:[],
  getStore: function(){
    return this.store;
  },
  add: function(key, value, life_time_sec){
    var life_time = life_time_sec || this.default_life_time_sec,
      vlength = null;
    try{
      vlength = this._getLength(value);
    }catch(_e_){
    }
    if(!vlength){
      return false;
    }else{
      this._cutExpires();
      var oldItem, oldLength = 0, ind = this._getIndBykey(key);// find ind by key - есть ли заменяемая запись
      if(ind && (oldItem = this._getItem(key))){
        oldLength = oldItem.length ? oldItem.length : 0;
      }
      // режем кэш, учитывая длинну заменяемой записи, если есть заменяемая
      this._cutToMaxLength(vlength - oldLength);
      var item = {
        key: key,
        value: value,
        length: vlength,
        expires: new Date((new Date()).getTime()+life_time*1000)
      };
      if(ind){
        this.store[ind] = item;
      }else{
        this.store.push(item);
      }
      return true;
    }
  },
  get: function(key){
    var item = this._getItem(key);
    return item ? item.value : null;
  },
  clear: function(){
    this.store = [];
  },
  _getItem: function(key){
    var k, item;
    for(k in this.store){
      item = this.store[k];
      if(item.key && item.key===key){
        if(item.expires && new Date().getTime()<item.expires.getTime()){
          return item;
        }else{
          this.store.splice(k,1);
        }
      }
    }
    return null;
  },
  _getIndBykey: function(key){
    var k;
    for(k in this.store){
      if(this.store[k].key && this.store[k].key===key){
        return k;
      }
    }
    return null;
  },
  _cutToMaxLength: function(new_length){
    var length = this.length();
    while (length>0 && length+new_length>this.max_length){
      this.store = this.store.slice(1);
      length = this.length();
    }
  },
  _cutExpires: function(){
    for(var k in this.store){
      if(new Date().getTime()>this.store[k].expires.getTime()){
        this.store.splice(k,1);
      }
    }
    return this.store.length;
  },
  /**
   *
   * @param value
   * @returns {number}
   * @private
   * @throws Error
   */
  _getLength: function(value){
    if(typeof value === 'string'){
      return value.length;
    }else{
      return JSON.stringify(value).length;
    }
  },
  /**
   * length of stringified data, not count of store array!
   * @returns {number}
   */
  length: function(){
    var k, length = 0;
    for(k in this.store){
      if(this.store[k].length){
        length+=this.store[k].length;
      }
    }
    return length;
  }

};