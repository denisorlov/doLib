var $do = window.$do?$do:{};
$do.common = {_name:'do.common'};
$do.common.checkDependences = function(cls){
    if(!cls.dependences) return;

    var i, need=[];
    for(i in cls.dependences){
        var j, obj = window, lib = cls.dependences[i], arr =lib.split('\.');
        for(j in arr){
            if(!obj[arr[j]]){
                need.push(lib);
                break;
            }
            obj = obj[arr[j]];
        }
    }

    if(need.length>0){
        alert('Для работы "'+cls._name+
            '" необходимо подключить:\n'+need.join('\n'));
    }
};
