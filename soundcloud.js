SC.initialize({
	client_id: "f7c4666dc24c5902042fef97122e2f41",
	redirect_uri: "http://test.reallyawesomedomain.com/callback.html",
});

var tracks = [];
var trackindex = 0;

tracks.push({"url":"http://soundcloud.com/iamwillking/chvrches-do-i-wanna-know"});
tracks.push({"url":"http://soundcloud.com/theglitchmob/whitestripesremix"});

function playback(next_song, track){
	if (track) {//sets trackindex to the selected track. lets us start playing from any arbitrary point in the now playing list.
		trackindex = tracks.map(function(x){
			return x.url
		}).indexOf(track);
		if (trackindex === -1) {
			console.log("array doesnt contain. likely malformed url");
		};
	}
	SC.stream(tracks[trackindex].id, function(sound) {
		loading(true);
		console.log(tracks[trackindex]);
		track = tracks[trackindex];
		var button = document.getElementById('play');
		var image;
		if (track.art != null){
			image = track.art;
		} else {
			image = track.avatar;
		}
		image = image.replace('large', 'original');
		document.body.style.backgroundImage = 'url('+image+')';
		loading(false);
		var smopts = {//common sound manager options. lets us set various event handlers no matter now we create the sound object
			whileplaying: function(){
				progress(this);
			},
			onfinish: function(){
				if (trackindex !== tracks.length - 1){
					trackindex++;
					playback(true);
				} else{
					button.textContent = "Play";
				}
			},
			onpause: function(){
				button.textContent = "Play";
				document.getElementsByTagName('title')[0].textContent = "[=] // SimpleCloud";
			},
			onplay: function(){
				button.textContent = "Pause";
				document.getElementsByTagName('title')[0].textContent = "[>] // SimpleCloud";
			}
		}

		if(next_song){//destroys the old sound object, then plays the new object.
			soundManager.destroySound(soundManager.soundIDs[0]);
			sound.play(smopts);
		}

		sound.load(smopts);

		button.addEventListener('click', function(){ sound.togglePause(); });
	});
}


function progress(sound){//calculates progress in the song as a %
	var duration = sound.durationEstimate;
	var position = sound.position;
	document.getElementById('progress').style.width = position / duration * 100 + '%';
}

function metadata(onload){//populates metadata
	var count = 0;
	for (var i = 0; i < tracks.length; i++) {
		SC.get('/resolve', { url: tracks[i].url }, function(track) {//async. everything was returning out of order because of this. somehow get the data from soundcloud, but keep it in the correct order
			count++;
			index = tracks.map(function(x){
				return x.url;
			}).indexOf(track.permalink_url);
			tracks[index].title = track.title;
			tracks[index].user = track.user.username;
			tracks[index].id = track.id;
			tracks[index].art = track.artwork_url;
			tracks[index].avatar = track.user.avatar_url;
			if (count == tracks.length){
				console.log(index, count, "loaded metadata");
			}
		});
	}
}

function append_now(){
	document.getElementById('now_ul').innerHTML = "";//just empty the element for now. should stop any weird mismatches in playlists.
	var now_frag = document.createDocumentFragment();
	for (var i = 0; i < tracks.length; i++) {
		tracks[i]
		var permalink = "'"+tracks[i].url+"'";
		var li = document.createElement("li");
		var text = tracks[i].title + ' /\/ ' + tracks[i].user;
		li.setAttribute('onclick', 'playback(true, ' + permalink + ')');
		li.textContent = text;
		now_frag.appendChild(li);
	}
	document.getElementById('now_ul').appendChild(now_frag.cloneNode(true));
}

function loadplaylist(id){//puts the contents of playlists into the tracks array, and uses now_playing to recreate the now playing list
						//(currently recreates the whole list, might need to swap to simpler partial recreation[ie. append new entrys])
	loading(true);
	SC.get('/playlists/'+id, function(playlist){
		console.log(playlist);
		for (var i = 0; i < playlist.tracks.length; i++) {
			tracks.push(playlist.tracks[i].permalink_url)
		}
		metadata();//regenerate metadata
		loading(false);
	});
}

function userload(){//connects a user, and loads their playlists
	append_now();//generate now playing the first time we open the menu
	if (SC.isConnected()) {
		connect();
	} else{
		SC.connect(function(){
			connect();
		});
	}
	function connect(){
		SC.get('/me/playlists', function(playlist){
			console.log(playlist);
			for (var i = 0; i < playlist.length; i++) {
				var li = '<li onclick="loadplaylist('+playlist[i].id+')"><span>' + playlist[i].title + '</span><span> (' + playlist[i].tracks.length + 'songs)</span></li>'
			};
			document.getElementById('songs_ul').insertAdjacentHTML('beforeend', li);
		});
	}
}

function loading(state){//loading "notification"
	if (state) {
		document.getElementById('loading').textContent = "Loading...";
		document.getElementById('loading').style.display ="block";
	} else if (!state) {
		document.getElementById('loading').textContent = "Loaded!";
		window.setTimeout(function(){
			document.getElementById('loading').style.display ="none";
		}, 1000);
	}
}

document.addEventListener("DOMContentLoaded", function(event) {
	var menu = false
	var signin = false;
	document.getElementById('menu').addEventListener('click', function(){//event handler for menu clicks
		if (!signin) {userload(); signin = true;}
		if (!menu){
			menu = true;
			document.getElementById('overlay').style.top ="0";
			document.getElementById('menu').style.color ="#fff";
		} else {
			menu = false;
			document.getElementById('overlay').style.top ="-100%";
			document.getElementById('menu').style.color ="#000";
		}
	});

	document.getElementById('now').addEventListener('click', function(){switchtab('now_box');});
	document.getElementById('songs').addEventListener('click', function(){switchtab('songs_box');});
	document.getElementById('search').addEventListener('click', function(){switchtab('search_box');});
	
	function switchtab(tab){
		document.getElementById('now_box').style.display ="none";
		document.getElementById('songs_box').style.display ="none";
		document.getElementById('search_box').style.display ="none";
		document.getElementById(tab).style.display = "block";
	}
	metadata();
	function load_listen(){
		userload();
		document.getElementById('play').textContent = "Play";
		playback();
		document.getElementById('play').removeEventListener('click', load_listen);
	}
	document.getElementById('play').addEventListener('click', load_listen);
});
//sometimes songs get duplicated for no reason. 
//volume adjust D:
//<back goes to start of song, then back one when clicked again
// forward> goes to next song
//add soundcloud sign in
/*add song selection screen with ios7 like tabs (now playing|songs|search)
now playing: sortable list of songs (sort hangle // song title(artist) // delete)
songs: list of user playlists and artist following -> songs: (song title(artist) // add)
search: uses soundcloud search -> results (song title(artist) // add)
(add songs from user stuff + sortablelist of songs)
*/
//add attribution in accordance with soundcloud's rules
//object.watch polyfill
// object.watch
if (!Object.prototype.watch) {
	Object.defineProperty(Object.prototype, "watch", {
		enumerable: false,
		configurable: true,
		writable: false,
		value: function (prop, handler) {
			var
			oldval = this[prop],
			newval = oldval,
			getter = function () {
				return newval;
			},
			setter = function (val) {
				oldval = newval;
				return newval = handler.call(this, prop, oldval, val);
			};
			if (delete this[prop]) { // can't watch constants
				Object.defineProperty(this, prop, {
					get: getter,
					set: setter,
					enumerable: true,
					configurable: true
				});
			}
		}
	});
}
 
// object.unwatch
if (!Object.prototype.unwatch) {
	Object.defineProperty(Object.prototype, "unwatch", {
		enumerable: false,
		configurable: true,
		writable: false,
		value: function (prop) {
			var val = this[prop];
			delete this[prop]; // remove accessors
			this[prop] = val;
		}
	});
}