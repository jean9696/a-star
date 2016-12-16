

var row = Vue.extend({
    template: '<span> \
        <span  v-for="(value,index) in tab" class="case" :class="{\
        obstacle : value.state==\'wall\',\
        start : value.state==\'start\',\
        end : value.state==\'end\',\
        isVisited: value.state==\'isVisited\',\
        visited: value.state==\'visited\',\
        way: value.state==\'way\',\
        current: value.state==\'current\'\
        }" \
        @click="setCase(index)">\
        <span v-if="showvalue">{{value.value}}</span>\
        </span>\
    </span>',
    props: {
        tab: Object,
        size: Object,
        rowNumber: Number,
        showvalue: Boolean
    },
    methods: {
        setCase: function(index){
            this.$parent.$parent.setCase(this.rowNumber,index);
        }
    }
});


var maze = Vue.extend({
    template: '<div><div v-for="(rowTab,index) in tab"><row :size="size" :tab.sync="rowTab" :rowNumber="parseInt(index)" :showvalue="showvalue"></row></div></div>',
    props: {
        size: Object,
        tab: Object,
        showvalue: Boolean
    },
    components: {
        'row': row
    }

});

function getRandomVal(min, max, obs) {
    min = Math.ceil(min);
    max = Math.floor(max);
    var val = Math.floor(Math.random() * (max - min)) + min;
    return val < obs ? 'wall' : 'empty';
}



new Vue({
    el: '#app',
    data: function(){
            return {
                tab: {},
                obstacles: 40,
                size: {
                    x: 0,
                    y: 0
                },
                current : {
                    x: 1,
                    y: 1
                },
                end : {
                    x: 1,
                    y: 1
                },
                start : {
                    x: 1,
                    y: 1
                },
                open : [],
                close: [],
                way: [],
                state: 'null',
                step: 0,
                showvalue: false
            }
    },
    methods: {
        initTab: function(){
            this.step=0;
            this.state = 'start';
            this.tab =  {};
            this.open = [];
            this.close = [];
            for(var i=0;i<this.size.y;i++){
                this.tab[i] = {};
                for(var j=0;j<this.size.x;j++){
                    this.tab[i][j] = {};
                    this.tab[i][j].value = 0;
                    this.tab[i][j].state = getRandomVal(0,100,this.obstacles)
                }
            }
        },
        refreshTab: function(tab){
            this.tab =  {};
            for(var i=0;i<this.size.y;i++){
                this.tab[i] = {};
                for(var j=0;j<this.size.x;j++){
                    this.tab[i][j] = tab[i][j];
                }
            }
        },
        pathFindingInstant: function(){
            var that = this;
            while(this.state!='found'){
                that.pathFinding();
                this.next(this.tab);
                this.goToNext();
                this.step++;
            }
            this.refreshTab(this.tab);
        },
        stop: function(){
          this.state = 'found';
        },
        pathFindingInOne: function(){
            var that = this;
            if(this.state!='found'){
                setTimeout(function(){
                    that.pathFinding();
                    that.pathFindingInOne();
                },10)
            }
        },
        pathFinding: function(){
                this.next(this.tab);
                this.refreshTab(this.tab);
                this.goToNext();
                this.step++;
        },
        setCase: function(x,y){
            if(this.state!='finding'&&this.state!='found'){
                if(this.tab[x][y].state=='empty'){
                    this.tab[x][y].state=this.state;
                    this.refreshTab(this.tab);
                    if(this.state=='end'){
                        this.end.x = parseInt(x);
                        this.end.y = parseInt(y);
                        this.state='finding';
                    }
                    if(this.state=='start'){
                        this.current.x = parseInt(x);
                        this.current.y = parseInt(y);
                        this.close.push(this.current);
                        this.state='end';
                    }
                }
            }
            if(this.state=='finding'){
                if(this.tab[x][y].state=='empty') {
                    this.tab[x][y].state = 'wall';
                }else if(this.tab[x][y].state=='wall'){
                    this.tab[x][y].state = 'empty';
                }

                this.refreshTab(this.tab);
            }
        },


        heuristic: function(a){
            return this.distance(a,this.end);
        },
        distance: function(a,b){
            return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
        },
        next: function(tab){
            var current = this.current;
            for(var i=-1;i<2;i++){
                for(var j=-1;j<2;j++){
                    if(tab[current.x+i]!=undefined&&
                        tab[current.x+i][current.y+j]!=undefined&&
                        tab[current.x+i][current.y+j].state!='wall'&&
                        tab[current.x+i][current.y+j].state!='visited'&&
                        tab[current.x+i][current.y+j].state!='start'&&
                        (i!=0||j!=0)){
                        this.addToOpen({x: current.x+i, y: current.y+j},this.distance(this.current,{x: current.x+i, y: current.y+j}) + this.heuristic({x : current.x+i, y : current.y+j}));
                        tab[current.x+i][current.y+j].value = this.distance(this.current,{x: current.x+i, y: current.y+j}) + this.heuristic({x : current.x+i, y : current.y+j});
                    }
                }
            }
        },
        goToNext: function(){
            var tab = this.open;
            for(var i= 0 ; i < tab.length; i++){
                for(var j=i+1; j < tab.length; j++){
                    if(this.tab[tab[i].x][tab[i].y].value > this.tab[tab[j].x][tab[j].y].value){
                        var temp = tab[i];
                        tab[i]=tab[j];
                        tab[j]=temp;
                    }
                }
            }
            if( this.tab[tab[0].x][tab[0].y].state=='end'){
                this.state = 'found';
                while(this.tab[this.current.x][this.current.y].state!='start'){
                    this.tab[this.current.x][this.current.y].state = 'way';
                    this.current = this.tab[this.current.x][this.current.y].parent;
                }
            }

            this.setToClose(this.current);
            if(tab.length<1){
                alert('Y a pas solution');
                this.state='found';
            }
            this.tab[tab[0].x][tab[0].y].state = 'current';
            this.current = tab[0];
        },
        setToClose: function(coord){
            var open = this.open;
            var tab = this.tab;
            for(var i in open){
                if(open[i].x==coord.x&&open[i].y==coord.y){
                    open.splice(i,1);
                    tab[coord.x][coord.y].state = "visited";
                    this.close.push(coord);
                }
            }
        },
        addToOpen: function(coord,value){
            var open = this.open;
            var isIn = false;
            var tab = this.tab;
            var parent = this.current;
            for(var i in open){
                if(open[i].x==coord.x&&open[i].y==coord.y){
                    if(tab[open[i].x][open[i].y].value>value){
                        tab[open[i].x][open[i].y].value = value;
                        tab[open[i].x][open[i].y].parent = parent;
                    }
                    isIn = true;
                }
            }
            if(!isIn){
                this.open.push(coord);
                tab[coord.x][coord.y].parent = parent;
                if(tab[coord.x][coord.y].state!='end'){
                    tab[coord.x][coord.y].state = 'isVisited';
                }
            }
        }
    },
    components: {
        'maze': maze,
        'row': row
    }

});