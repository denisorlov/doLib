var $do = window.$do?$do:{};
$do.loader = {_name:'do.loader'};

$do.loader.appendScript = function (scriptSrc, onLoad, onError){
    var script = document.createElement('script');
    script.src = scriptSrc;//'http://yandex.st/jquery/1.7.2/jquery.js';
    if(typeof onLoad == 'function'){
        script.onload = onLoad;
    }
    script.onerror = (function(onError){// closure
        return function(){
            if(typeof onError == 'function'){
                onError();
            }
            document.getElementsByTagName('head')[0].removeChild(script);
        }
    }(onError));

    document.getElementsByTagName('head')[0].appendChild(script);
}

$do.loader.loadScripts = function(srcArray, onLoad/*last*/, onError, onLoadForAll){
    var i, f;

    for (i=srcArray.length-1;i>-1;i--){
        f = (function(srcArray, i, onLoad, onError, onLoadForAll){// closure
            var src = srcArray[i], fname=src.split('/').pop().split('?').shift();
            return function(){
                if(document.querySelector("script[src='"+src+"']")){
                    console.info('Скрипт по адресу %s уже загружен.', src);

                  if(typeof onLoadForAll == 'function') onLoadForAll(srcArray, i);
                  if(typeof onLoad == 'function') onLoad(srcArray, i);
                }else{
                    console.log('Загрузка скрипта %s по адресу %s...', i+1, src);
                    console.time('Время загрузки скрипта '+fname);
                    $do.loader.appendScript( src,
                        function(){
                            console.timeEnd('Время загрузки скрипта '+fname);
                            i==srcArray.length-1?console.info('Загрузка окончена.'):0;

                          if(typeof onLoadForAll == 'function') onLoadForAll(srcArray, i);
                          if(typeof onLoad == 'function') onLoad(srcArray, i);
                        },
                        function(){// ошибку отобразит сам браузер
                            if(typeof onError == 'function') onError(srcArray, i);
                        }
                    );
                }
            }
        }(srcArray, i, onLoad, onError, onLoadForAll));
        onLoad = f;
    }
    f();
}
