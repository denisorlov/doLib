var $do = window.$do?$do:{};
$do.common = {_name:'do.common'};
$do.common.checkDependences = function(cls){
    if(!cls.dependences) return;

    var i, need=[];
    for(i=0;i<cls.dependences.length;i++){
        var j, obj = window, lib = cls.dependences[i], arr =lib.split('\.');
        for(j=0;j<arr.length;j++){
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
