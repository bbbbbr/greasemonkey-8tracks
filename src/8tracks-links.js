// ==UserScript==
// @name        8tracks download links
// @namespace   http://8tracks.com/*
// @description No longer works. :) Traverse 8tracks playlists and create download links for each song present
// @include     http://*.8tracks.com/*
// @include     http://8tracks.com/*
// @grant       none
// @version     1.0.0
// ==/UserScript==


//
//  Add a link to trigger downloading the current playlist
//
function addMixLinkToPlaylistView (onload) {
    // Find the mix ID
    var elMixIdSource = document.getElementById('review_mix_id');
    var mixID = elMixIdSource.value;
    
    // Find the sidebar div we will attach the playlist entries to
    var elSidebar = document.getElementById('sidebar');
  
    // Create a download link
    var mixLink = document.createElement('a');
        mixLink.href = '#';
        mixLink.setAttribute('data-id',mixID);
        mixLink.setAttribute('id', 'mix-start-dl-link-' + mixID);
        mixLink.onclick = function () {
            // Request a playlist start (indicated by a trackCount of zero)
            trackCount = 0;  
            playlistRequestAction(this.dataset.id, trackCount);
            return(false);
        };
    
    var mixLinkText = document.createTextNode('✿ extract mix ' + mixID);
    mixLink.appendChild(mixLinkText);
    mixLink.style.color = 'deeppink';
    
    // Append the download link
    elSidebar.appendChild(document.createElement('br'));
    elSidebar.appendChild(mixLink);
    elSidebar.appendChild(document.createElement('br'));
        
}


//
// Add a download link for a given track
//
function appendTrackLink (objTrack, mixID, trackCount) 
{  
    // Find the mix download link
    var mixDownloadLink = document.getElementById('mix-start-dl-link-' + mixID);
    mixDownloadLink.style.color = 'deepskyblue';
    
    // Append the Track link (use downloadurl attrib to attempt auto renaming at time of download)
    var trackExtension = objTrack.downloadUrl.split('.').pop();
    if (trackExtension != 'm4a') { trackExtension = 'mp3'; }
    
    var trackLinkText  = document.createTextNode(trackCount + ': ' + objTrack.artist + ' - ' + objTrack.title);
    var trackLink      = document.createElement('a');
        trackLink.href = objTrack.downloadUrl;
        trackLink.setAttribute('download', objTrack.artist + ' - ' + objTrack.title + '.' + trackExtension);
        trackLink.appendChild(trackLinkText);
        
    // Append the newly created Track link to the parent div of the download link
    mixDownloadLink.parentNode.appendChild(document.createElement('br'));
    mixDownloadLink.parentNode.appendChild(trackLink);
}


//
// Extract and use track info returned from a playlist action request, then request the next track if available
//
function handlePlayListResponse(xhrResponse, mixID, trackCount)
{
    // alert(mixID);
    // alert(xhrResponse.responseText);
    
    var jsonResponse = JSON.parse(xhrResponse.responseText);
    
    // Request tracks up until the end of the playlist, and then 
    // request once more to close out the playlist.    
    if (jsonResponse.set.at_end != true) {           
        trackCount = trackCount + 1;
        
        var objTrack = new Object();
        objTrack.num         = trackCount;
        objTrack.title       = jsonResponse.set.track.name;
        objTrack.artist      = jsonResponse.set.track.performer;
        objTrack.album       = jsonResponse.set.track.release_name;
        objTrack.downloadUrl = jsonResponse.set.track.track_file_stream_url;
    
    	appendTrackLink(objTrack, mixID, trackCount);

    	// Wait briefly before pulling in the next track
        setTimeout(function() { playlistRequestAction(mixID, trackCount); }, 1000);
    }
}


//
// Send a Start or NextTrack request to 8tracks, hands off the result for processing
//
function playlistRequestAction(mixID, trackCount)
{    
    // alert(mixID);
    var playlistStartURL = '';
    
    if (trackCount == 0) {
        // This is a request to start playing the mix
    	playlistStartURL = 'http://8tracks.com/sets/' + mixID + '/play?player=sm&include=track%5Bfaved%2Bannotation%2Byoutube%5D&mix_id=' + mixID + '&format=jsonh';
    } else {
        // Otherwise it is a request to advance to the next track
        playlistStartURL = 'http://8tracks.com/sets/' + mixID + '/next?player=sm&include=track%5Bfaved%2Bannotation%2Byoutube%5D&mix_id=' + mixID + '&format=jsonh';
    }
    
    var xhr_playlistAction = new XMLHttpRequest();
    xhr_playlistAction.open("GET", playlistStartURL);
    xhr_playlistAction.onreadystatechange=function() {
        if (this.readyState==4) {
            if (this.status === 200) {
                handlePlayListResponse(this, mixID, trackCount);
            }
            else
            {
                alert('Uh oh, we can\'t play this now! Try again later. \n\n(or clear cookies and browser local storage)\n(result = ' + this.status + ')');
            }
        }
    }
   xhr_playlistAction.send();   
}


// ----------------------------------------------------------------


//
// Append a link to start track extraction for the current playlist
//
addMixLinkToPlaylistView();


//
// Half-hearted fix for dealing with non-page-loading HTML5/AJAX navigation
// (addition of the download link was failing to trigger when navigating within the 8tracks site)
//
(function (old) {
    window.history.pushState = function () {
        old.apply(window.history, arguments);
        // alert(window.location.href);
        
         setTimeout(function() { addMixLinkToPlaylistView(); }, 2000);
    }
})(window.history.pushState); 
