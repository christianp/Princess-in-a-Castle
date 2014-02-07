paper.install(window);

var defaultCastles = {"Four rooms in a line":{"rooms":{"1":{"x":58,"y":204,"links":["2"]},"2":{"x":144,"y":203,"links":["1","3"]},"3":{"x":232,"y":203,"links":["2","4"]},"4":{"x":321,"y":204,"links":["3"]}},"name":"Four rooms in a line"},"Five rooms in a line":{"rooms":{"1":{"x":42,"y":201,"links":["2"]},"2":{"x":103,"y":200,"links":["1","3"]},"3":{"x":163,"y":200,"links":["2","4"]},"4":{"x":230,"y":201,"links":["3","5"]},"5":{"x":309,"y":200,"links":["4"]}},"name":"Five rooms in a line"},"Three spokes of length 1":{"rooms":{"1":{"x":191,"y":202,"links":["2","3","4"]},"2":{"x":184,"y":148,"links":["1"]},"3":{"x":253,"y":206,"links":["1"]},"4":{"x":158,"y":250,"links":["1"]}},"name":"Three spokes of length 1"},"Three spokes of length 2":{"rooms":{"1":{"x":191,"y":202,"links":["2","3","4"]},"2":{"x":184,"y":148,"links":["1","5"]},"3":{"x":249,"y":208,"links":["1","6"]},"4":{"x":158,"y":250,"links":["1","7"]},"5":{"x":178,"y":96,"links":["2"]},"6":{"x":305,"y":216,"links":["3"]},"7":{"x":129,"y":295,"links":["4"]}},"name":"Three spokes of length 2"},"Three spokes of length 3":{"rooms":{"1":{"x":191,"y":202,"links":["2","3","4"]},"2":{"x":184,"y":148,"links":["1","5"]},"3":{"x":249,"y":208,"links":["1","6"]},"4":{"x":158,"y":250,"links":["1","7"]},"5":{"x":178,"y":96,"links":["2","8"]},"6":{"x":305,"y":216,"links":["3","9"]},"7":{"x":129,"y":295,"links":["4","10"]},"8":{"x":171,"y":53,"links":["5"]},"9":{"x":350,"y":224,"links":["6"]},"10":{"x":102,"y":337,"links":["7"]}},"name":"Three spokes of length 3"},"Binary tree - 4 deep":{"rooms":{"1":{"x":198,"y":64,"links":["2","3"]},"2":{"x":106,"y":125,"links":["1","4","5"]},"3":{"x":281,"y":122,"links":["1","6","7"]},"4":{"x":60,"y":185,"links":["2","8","9"]},"5":{"x":139,"y":187,"links":["2","10","11"]},"6":{"x":243,"y":175,"links":["3","12","13"]},"7":{"x":344,"y":175,"links":["3","14","15"]},"8":{"x":14,"y":242,"links":["4"]},"9":{"x":62,"y":251,"links":["4"]},"10":{"x":116,"y":248,"links":["5"]},"11":{"x":168,"y":251,"links":["5"]},"12":{"x":222,"y":249,"links":["6"]},"13":{"x":255,"y":246,"links":["6"]},"14":{"x":324,"y":249,"links":["7"]},"15":{"x":365,"y":246,"links":["7"]}},"name":"Binary tree - 4 deep"},"Binary tree - 3 deep":{"rooms":{"1":{"x":198,"y":64,"links":["2","3"]},"2":{"x":106,"y":125,"links":["1","4","5"]},"3":{"x":281,"y":122,"links":["1","6","7"]},"4":{"x":60,"y":185,"links":["2"]},"5":{"x":139,"y":187,"links":["2"]},"6":{"x":243,"y":175,"links":["3"]},"7":{"x":344,"y":175,"links":["3"]}},"name":"Binary tree - 3 deep"}};

var state;
var castles;
try{
	castles = JSON.parse(localStorage.castles || '');
}
catch(e)
{
	castles = {};
}
for(var x in defaultCastles)
	castles[x] = defaultCastles[x];
var lastName;
var labelacc = 1;
var layers = {};
var anim, animTime = 25;
var strategy = [];
var automorphisms;
var doingloads = false;

function graphVizCastle() {
	var s = '\
graph rooms {\n\
	rankdir = RL;\n\
	node [shape=circle];\n\
	';
	for(var x in rooms) {
		s+=x+';';
	}
	s+='\n';
	for(var x in rooms) {
		for(var y in rooms[x].links) {
			if(x<y) {
				s+='\t'+x+' -- '+y+';\n';
			}
		}
	}
	s+='}';

	var BlobBuilder = window.WebKitBlobBuilder || window.BlobBuilder;
	var bb = new BlobBuilder();
	bb.append(s);

	var URL = window.webkitURL || window.URL;

	var a = document.createElement('a');
	a.download = (lastName || 'castle')+'.gv';
	var url = URL.createObjectURL(bb.getBlob('text/plain'));;
	if(url)
	{
		$('a.downloadGraph').remove();
		a.href = url;
		$(a).text('Download castle').addClass('downloadGraph').click(function() {$(this).remove()});
		$('#graphviz').after(a);
	}
	else	//createObjectURL returns undefined when page is on local filesystem
	{
		window.open('data:text/plain;charset=utf-8,'+encodeURI(s));
	}
}

function makeCastle(name)
{
	var castle = {rooms: {}};
	for(var x in rooms) {
		var room = {}
		room.x = rooms[x].position.x;
		room.y = rooms[x].position.y;
		room.links = [];
		for(var y in rooms[x].links)
		{
			room.links.push(y);
		}
		castle.rooms[x] = room;
	}
	castle.name = name;
	return castle;
}

function makeCastleList()
{
	$('#savedCastles #list').empty();
	for(var x in castles)
	{
		$('#savedCastles #list').append($('<div class="name"/>').html(x));
	}
}

function saveCastle(name,castle)
{
	castles[name] = castle;
	localStorage.castles = JSON.stringify(castles);
	makeCastleList();
	setHash(castle);
}

function loadCastle(castle)
{
	doingloads = true;

	if(typeof(castle)=='string')
	{
		lastName = castle;
		castle = castles[castle];
	}

	anim = null;
	for(var i=0;i<paper.project.layers.length;i++)
	{
		paper.project.layers[i].removeChildren();
	}

	rooms = {};
	for(var label in castle.rooms)
	{
		var data = castle.rooms[label];
		var room = new Room(new Point(data.x,data.y),label);
	}
	for(var label in castle.rooms)
	{
		for(var i=0;i<castle.rooms[label].links.length;i++)
		{
			var label2 = castle.rooms[label].links[i];
			if(!(label2 in rooms[label].links))
				new Link(rooms[label],rooms[label2]);
		}
	}

	setHash(castle);

	doingloads = false;
	graphChanged();
}

function setHash(castle)
{
	document.location.hash = btoa(JSON.stringify(castle));
}

function resetStrategy()
{
	for(var x in rooms)
	{
		rooms[x].toggle(true);
	}
	strategy = [];
	$('#strategy .move').remove();
	saveMove('start');
}

function saveMove(room)
{
	strategy.splice((strategy.lastMove || 0)+1);
	var state = {rooms:{}}
	var safe=false;
	for(var label in rooms)
	{
		state.rooms[label] = rooms[label].occupiable;
		safe |= rooms[label].occupiable;
	}

	var states = [];
	if(automorphisms)
	{
		for(var i=0;i<automorphisms.length;i++)
		{
			var s2 = {rooms:{}}
			var p = automorphisms[i];
			for(var label in rooms)
			{
				s2.rooms[label] = state.rooms[p[label]];
			}
			states.push(s2);
		}
	}
	else
	{
		states = [state];
	}

	var equal = false;
	for(var i=0;i<strategy.length && !equal;i++)
	{
		for(var j=0;j<states.length;j++)
		{
			if(statesEqual(states[j],strategy[i]))
			{
				equal = true;
				break;
			}
		}
	}

	$('#strategy .move').eq(strategy.lastMove).nextAll().remove();

	strategy.push(state);

	var move = $('<span class="move real"></span>').html(room);
	if(equal){ move.addClass('repeat'); }
	$('#strategy').append(move);
	if(!safe)
	{
		strategy.done = state.done = true;
		$('#strategy').append($('<span class="move done">Done in '+(strategy.length-1)+' moves!</span>'));
	}
	setCurrentMove(strategy.length-1);
}

function statesEqual(s1,s2)
{
	for(var label in s1.rooms)
	{
		if(s1.rooms[label]!=s2.rooms[label])
			return false;
	}
	return true;
}

function backtrack(i)
{
	var state = strategy[i];
	for(var label in state.rooms)
		rooms[label].toggle(state.rooms[label]);
	strategy.done = state.done;

	setCurrentMove(i);
}
function setCurrentMove(i)
{
	$('#strategy .move').removeClass('backtracked current');

	var move = $('#strategy .move').eq(i);
	move.nextAll('.real').addClass('backtracked');
	move.addClass('current');
	strategy.lastMove = i;
}

var sortLists = function(a,b) {
	if(a.length!=b.length)
	{
		return a.length>b.length ? 1 : -1;
	}
	for(var i=0;i<a.length;i++)
	{
		var d = sortLists(a[i],b[i]);
		if(d!=0)
			return d;
	}
	return 0;
}
function equivalenceClasses(dict,cmp)
{
	if(cmp===undefined)
		cmp=sortLists;

	var classes = [];
	for(var x in dict)
	{
		var got = false;
		for(var i=0;i<classes.length;i++)
		{
			if(cmp(dict[x],classes[i][0])==0)
			{
				classes[i].push(dict[x]);
				got=true;
				break;
			}
		}
		if(!got)
		{
			classes.push([dict[x]]);
		}
	}
	return classes;
}

function isTree()
{
	function check(label,checked,from){
		if(checked===undefined)
			checked=[];
		checked.push(label);
		for(var x in rooms[label].links)
		{
			if(x!=from && (checked.indexOf(x)>=0 || check(x,checked,label)==false))
				return false;
		}
		return true;
	}
	var root = (function(){for(var x in rooms){return x}})();
	if(root)
		return check(root);
}

function symmetries()
{
	if(!isTree())
		return;

	for(var x in rooms)
		rooms[x].canonicals={};
	var generators = [];
	for(var x in rooms)
	{
		var c = {};
		for(var y in rooms[x].links)
		{
			c[y]=rooms[y].canonise(x);
			if(x>y && sortLists(rooms[x].canonise(),rooms[y].canonise())==0)
			{
				//reflection in edge x--y
				generators.push(new Permutation(rooms[x].canonise(y),rooms[y].canonise(x)));
			}
		}
		var rc = equivalenceClasses(c).filter(function(i){return i.length>1});
		for(var i=0;i<rc.length;i++)
		{
			for(var j=0;j<rc[i].length;j++)
			{
				for(var k=j+1;k<rc[i].length;k++)
				{
					//swap rc[i][j] and rc[i][k] around x
					generators.push(new Permutation(rc[i][j],rc[i][k]));
				}
			}
		}
	}
	return closePermutations(generators);
}

function Permutation(c1,c2,nofill)
{
	if(!nofill)
	{
		for(var x in rooms)
			this[x]=x;
	}
	if(!c1)
		return;

	this[c1.label] = c2.label;
	this[c2.label] = c1.label;
	for(var i=0;i<c1.length;i++)
	{
		Permutation.apply(this,[c1[i],c2[i],true]);
	}
}
Permutation.prototype = {
	eq: function(p2)
	{
		for(var x in this)
		{
			if(p2[x]!=this[x])
				return false;
		}
		return true;
	},

	mul: function(p2)
	{
		var p3 = new Permutation();
		for(var x in rooms)
		{
			p3[x] = p2[this[x]];
		}
		return p3;
	},
	toString: function()
	{
		var labels = [];
		var cycles = [];
		for(var label in rooms)
		{
			if(labels.indexOf(label)==-1)
			{
				var cycle = [label];
				labels.push(label);
				cycles.push(cycle);
				var c = this[label];
				while(c!=label)
				{
					labels.push(c);
					cycle.push(c);
					c=this[c];
				}	
			}
		}
		return '('+cycles.join(') (')+')';
	}
}

function closePermutations(gens)
{
	if(gens.length==0)
		return [new Permutation()];

	var perms = [new Permutation(),gens[0]];
	for(var i=1;i<gens.length;i++)
	{
		perms = perms.concat(perms.map(function(p){return gens[i].mul(p);}));
	}
	/*
	for(var i=0;i<perms.length;i++)
	{
		for(var j=i;j<perms.length;j++)
		{
			var p3 = perms[i].mul(perms[j]);
			var got = false;
			for(var k=0;k<perms.length;k++)
			{
				steps++;
				if(p3.eq(perms[k]))
				{
					got=true;
					break;
				}
			}
			if(!got)
				perms.push(p3);
		}
	}
	console.log(steps,' steps in closing permutation group');
	*/
	return perms;
}

function graphChanged()
{
	if(doingloads)
		return;
	automorphisms = symmetries();
	resetStrategy();
}

var rooms = {};
function Room(position,label)
{
	this.position = position;
	labelacc++;
	for(var i=1;i<labelacc;i++)
	{
		if(!rooms[i])
		{
			this.label = i;
			break;
		}
	}
	rooms[this.label] = this;

	this.symbol = this.symbol.clone();
	this.symbol.children['text 1'].content = this.label;
	this.symbol.position = this.position;
	this.symbol.visible = true;
	layers.room.addChild(this.symbol); 

	this.links = {};

	graphChanged();
}
Room.prototype = {
	occupiable: true,
	canonicals: {},

	move: function(position)
	{
		this.position = this.symbol.position = position;
		for(var x in this.links)
		{
			this.links[x].update();
		}
	},

	look: function() 
	{
		this.toggle(false);
		Room.animate(this.label);
	},

	toggle: function(state)
	{
		if(state!==undefined)
		{
			this.occupiable = state;
		}
		else
		{
			this.occupiable = !this.occupiable;
		}
		this.symbol.children.circle.fillColor.gray = this.occupiable ? 1 : 0.5;
	},

	die: function()
	{
		delete rooms[this.label];
		this.symbol.remove();
		for(var x in this.links)
		{
			this.links[x].die();
		}
		graphChanged();
	},

	canonise: function(from) {
		if(from in this.canonicals)
			return this.canonicals[from];
		var kids = [];
		for(var x in this.links)
		{
			if(x!=from)
			{
				kids.push(rooms[x].canonise(this.label));
			}
		}
		kids.sort(sortLists);
		kids.label = this.label;
		this.canonicals[from] = kids;
		return kids;
	},
}
Room.radius = 15;
Room.pick = function(pos)
{
	var min=Room.radius;
	var picked;
	for(var x in rooms)
	{
		var r = rooms[x];
		var delta = r.position.subtract(pos).length;
		r.symbol.selected = false;
		if(delta<min)
		{
			min = delta;
			picked = r;
		}
	}
	if(picked)
	{
		picked.symbol.selected = true;
		return picked;
	}
}

Room.animate = function(moved) {
	for(var x in rooms)
	{
		rooms[x].occupiable2 = false;
	}

	var princesses = [];
	for(var x in rooms)
	{
		var room = rooms[x];
		if(room.occupiable)
		{
			for(var y in room.links)
			{
				rooms[y].occupiable2 = true;
				princesses.push(new Princess(room,rooms[y]));
			}
		}
	}
	var t = 0;
	anim = function(event) {
		for(var x in rooms)
		{
			var g1 = rooms[x].occupiable ? 1 : .5;
			var g2 = rooms[x].occupiable2 ? 1 : .5;
			rooms[x].symbol.children.circle.fillColor.gray = g1*(1-t)+g2*t;
			if(x==2)
				console.log(g1,g2);
		}
		for(var i=0;i<princesses.length;i++)
		{
			princesses[i].update(t);
		}
		t += 1/animTime;
		if(t>1)
		{
			anim = null;
			for(var x in rooms)
			{
				rooms[x].toggle(rooms[x].occupiable2);
			}
			for(var i=0;i<princesses.length;i++)
			{
				princesses[i].die();
			}
			saveMove(moved);
		}
	}
}

function Link(room1,room2)
{
	this.room1 = room1;
	this.room2 = room2;
	room1.links[room2.label] = this;
	room2.links[room1.label] = this;
	var path = this.path = new Path();
	path.strokeColor = 'black';
	path.add(room1.position);
	path.add(room2.position);
	layers.link.addChild(path);

	graphChanged();
}
Link.prototype = {
	update: function()
	{
		this.path.firstSegment.point = this.room1.position;
		this.path.lastSegment.point = this.room2.position;
	},

	die: function() {
		delete this.room1.links[this.room2.label];
		delete this.room2.links[this.room1.label];
		this.path.remove();

		graphChanged();
	}
};

function Princess(room1,room2)
{
	this.room1 = room1;
	this.room2 = room2;
	this.symbol = Princess.symbol.place();
	layers.princess.addChild(this.symbol);
}
Princess.prototype = {
	update: function(t) {
		this.symbol.position.x = this.room1.position.x*(1-t) + this.room2.position.x*t;
		this.symbol.position.y = this.room1.position.y*(1-t) + this.room2.position.y*t;
	},

	die: function() {
		this.symbol.remove();
	}
};


$(window).ready(function() {
	//paper.js canvas stuff
	paper.setup('graphCanvas');

	layers.link = new Layer();
	layers.princess = new Layer();
	layers.room = new Layer();
	layers.edit = new Layer();

	var circle = new Path.Circle(new Point(),Room.radius);
	circle.strokeColor = 'black';
	circle.fillColor = 'white';
	circle.name = 'circle';
	var text = new PointText(new Point(0,5),0);
	text.name = 'text';
	text.paragraphStyle.justification = 'center';
	var symbol = Room.prototype.symbol = new Group([circle,text]);
	symbol.visible = false;

	var circle = new Path.Circle(new Point(),3);
	circle.fillColor = 'red';
	Princess.symbol = new Symbol(circle);

	var tools = {};

	var addRoomTool = tools.addroom = new Tool();
	addRoomTool.onMouseMove = function(event) {
		Room.pick(event.point);
	}
	addRoomTool.onMouseDown = function(event) {
		var room = Room.pick(event.point);
		if(!room)
		{
			room = new Room(event.point);
		}
		addRoomTool.room = room;
	}
	addRoomTool.onMouseDrag = function(event) {
		addRoomTool.room.move(event.point);
	}

	var removeRoomTool = tools.removeroom = new Tool();
	removeRoomTool.onMouseMove = function(event) {
		Room.pick(event.point);
	}
	removeRoomTool.onMouseUp = function(event) {
		var room = Room.pick(event.point);
		if(room)
			room.die();
	}



	var linkRoomTool = tools.linkrooms = new Tool();
	linkRoomTool.onMouseMove = function(event) {
		Room.pick(event.point);
	}
	linkRoomTool.onMouseDown = function(event) {
		var room = linkRoomTool.room = Room.pick(event.point);
		if(!room)
			return;
		var path = linkRoomTool.path = new Path();
		path.strokeColor = 'black';
		path.dashArray = [5,6];
		path.add(room.position);
		path.add(new Point(room.position));
	}
	linkRoomTool.onMouseDrag = function(event) {
		if(!linkRoomTool.room)
			return;
		linkRoomTool.path.lastSegment.point = event.point;
	}
	linkRoomTool.onMouseUp = function(event) {
		var room1 = linkRoomTool.room;
		if(!room1)
			return;
		linkRoomTool.path.remove();

		var room2 = Room.pick(event.point);
		if(!room2 || room2==room1)
		{
			return;
		}

		if(room2.label in room1.links)
			room1.links[room2.label].die();
		else
			var link = new Link(room1,room2);
	}

	var lookTool = tools.look = new Tool()
	lookTool.onMouseMove = function(event) {
		Room.pick(event.point);
	}
	lookTool.onMouseUp = function(event) {
		if(strategy.done)
			return;
		if(anim)
			return;
		var room = Room.pick(event.point);
		if(!room)
			return;

		room.look();
	}

	var toggleTool = tools.toggle = new Tool()
	toggleTool.onMouseMove = function(event) {
		Room.pick(event.point);
	}
	toggleTool.onMouseUp = function(event) {
		var room = Room.pick(event.point);
		if(!room)
			return;

		room.toggle();
	}

	paper.view.onFrame = function(event)
	{
		if(anim)
			anim(event);
	}


	//buttons
	$('#buttons button.tool').click(function() {
		state = $(this).attr('id');
		$('#buttons button').removeClass('selected');
		$(this).addClass('selected');
		tools[state].activate();
	});

	$('#buttons #look').click();

	$('#buttons #reset').click(function() {
		resetStrategy();
	});
	$('#buttons #clear').click(function() {
		doingloads = true;
		for(var x in rooms)
		{
			rooms[x].die();
		}
		doingloads = false;
		graphChanged();
	});

	$('#buttons #save').click(function() {
		var name = prompt('Name your castle',lastName || 'my castle');
		if(!name) { return; }
		lastName = name;
		var castle = makeCastle(name);
		saveCastle(name,castle);
	});

	$('#buttons #animtime').change(function() {
		animTime = 100-$(this).val();
	});

	$('#savedCastles .name').live('click',function() {
		var name = $(this).html();
		loadCastle(name);
	});

	$('#strategy .move.real').live('click',function() {
		var i = $('#strategy .move.real').index(this);
		backtrack(i);
	});

	$('#snapshot').click(function() {
		var img = $('#graphCanvas')[0].toDataURL().replace('image/png','image/octet-stream');
		var w = window.open(img,'_blank');
	});
	$('#snapshots').click(function() {
		var lastMove = strategy.lastMove;
		for(var i=0;i<strategy.length;i++)
		{
			backtrack(i);
			view.draw();
			var img = $('#graphCanvas')[0].toDataURL().replace('image/png','image/octet-stream');
			var w = window.open(img,'_blank');
		}
		backtrack(lastMove);
	});
	$('#graphviz').click(graphVizCastle);

	makeCastleList();

	$('#animtime').val(100-animTime);

	if(document.location.hash)
	{
		var castle = JSON.parse(atob(document.location.hash.slice(1)));
		castles[castle.name] = castle;
		loadCastle(castle);
		saveCastle(castle.name,castle);
	}
	else
	{
		loadCastle('Four rooms in a line');
	}
});
