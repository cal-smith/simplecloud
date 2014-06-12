SC.initialize({
	client_id: "f7c4666dc24c5902042fef97122e2f41",
	redirect_uri: "http://test.reallyawesomedomain.com/callback.html",
});
var tracks = [];
var trackindex = 0;

tracks.push("http://soundcloud.com/iamwillking/chvrches-do-i-wanna-know");
tracks.push("http://soundcloud.com/theglitchmob/whitestripesremix");

function playback(next_song, track){
	if (track) {
		trackindex = tracks.indexOf(track);
		if (trackindex === -1) {
			console.log("array doesnt contain. likely malformed url");
		};
	}
	SC.get('/resolve', { url: tracks[trackindex] }, function(track) {
		console.log(track);
		SC.stream(track.id, function(sound) {
			var button = document.getElementById('play');
			var image;
			if (track.artwork_url != null){
				image = track.artwork_url;
			} else {
				image = track.user.avatar_url;
			}
			image = image.replace('large', 'original');
			document.body.style.backgroundImage = 'url('+image+')';

			var smopts = {
				whileplaying: function(){
					progress(this);
				},
				onfinish: function(){
					if (trackindex !== tracks.length - 1){
						trackindex++;
						playback(true);
						//sound.destruct();
					} else{
						button.innerText = "Play";
					}
				},
				onpause: function(){
					button.innerText = "Play";
				},
				onplay: function(){
					button.innerText = "Pause";
				}
			}

			if(next_song){
				soundManager.destroySound(soundManager.soundIDs[0]);
				sound.play(smopts);
			}

			sound.load(smopts);

			button.addEventListener('click', function(){ sound.togglePause(); });
		});
	});
}


function progress(sound){
	var duration = sound.durationEstimate;
	var position = sound.position;
	document.getElementById('progress').style.width = position / duration * 100 + '%';
}

function now_playing(){
	for (var i = 0; i < tracks.length; i++) {
		SC.get('/resolve', { url: tracks[i] }, function(track) {
			var permalink = "'"+track.permalink_url+"'";
			var li = '<li onclick="playback(true, ' + permalink + ')"><span>' + track.title + '</span> // <span>' + track.user.username + '</span></li>';
			document.getElementById('now_ul').insertAdjacentHTML('beforeend', li);
		});
	}
}

function loadplaylist(id){
	SC.get('/playlists/'+id, function(playlist){
		console.log(playlist);
		for (var i = 0; i < playlist.tracks.length; i++) {
			tracks.push(playlist.tracks[i].permalink_url)
		}
		now_playing();
	});
}

function userload(){
	SC.connect(function(){
		SC.get('/me/playlists', function(playlist){
			console.log(playlist);
			for (var i = 0; i < playlist.length; i++) {
				var li = '<li onclick="loadplaylist('+playlist[i].id+')"><span>' + playlist[i].title + '</span><span> (' + playlist[i].tracks.length + 'songs)</span></li>'
			};
			document.getElementById('songs_ul').insertAdjacentHTML('beforeend', li);
		});
	});
}

document.addEventListener("DOMContentLoaded", function(event) {
	var menu = false
	var signin = false;
	document.getElementById('menu').addEventListener('click', function(){
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

	now_playing();
	playback();
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