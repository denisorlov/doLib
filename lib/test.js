var colCnt = 6, j;
testBigArray = [];
for (var i = 0; i<10520; i++) {
    for(var arr=[], j = 0; j<colCnt; j++){
        var content = j==0?(i+1):(i+1)+' '+(j+1);
        arr.push(content);
    }
    testBigArray.push(arr);
    if(i%100==0){
        console.time('Pushed '+i);
        console.timeEnd('Pushed '+i);
    }
}

console.info('testBigArray test!');

function freeze(millis){
    var date = new Date();
    var curDate = null;
    do { curDate = new Date(); }
    while(curDate-date < millis);
}