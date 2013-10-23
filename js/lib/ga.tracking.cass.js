var addon = function()
	{
    var startListening = function(obj, evnt, func)
    	{
        if (obj.addEventListener) obj.addEventListener(evnt, func, false);
        else if (obj.attachEvent) obj.attachEvent("on" + evnt, func);
    	}
    
  
    var trackExternalLink = function(evnt)
    	{
        var elmnt = evnt.srcElement;
        if (elmnt) {while (elmnt.tagName!= "A") elmnt = elmnt.parentNode;}
        else elmnt = this;
        
        if (/(http|https)/.test(elmnt.protocol)) {
        	_gaq.push(['_trackPageview','/outbound/'+elmnt.hostname+'/'+elmnt.pathname+elmnt.search]);
        }
        
    	}

	var trackMailtoLink = function(evnt) {
		var elmnt = evnt.srcElement;
        if (elmnt) {while (elmnt.tagName!= "A") elmnt = elmnt.parentNode;}
        else elmnt = this;
        
		if (/mailto/.test(elmnt.href)) {
        	_gaq.push(['_trackEvent', 'Links', 'mailto', elmnt.href.substring(7)]);
        } 
	}

    if (document.getElementsByTagName) 
    	{
        var links = document.getElementsByTagName('a');
        for (var l=0, m=links.length; l<m; l++) 
        	{
	        	if (/mailto/.test(links[l].href)) { 
	        		startListening(links[l],"click",trackMailtoLink) 
	        	} else if ( !(/cass.city.ac.uk/.test(links[l].hostname)) && !(/bunhill.city.ac.uk/.test(links[l].hostname)) ) {
	        		startListening(links[l], "click", trackExternalLink);
	        	}
        	}
    	}
	}
if (window.addEventListener) window.addEventListener('load', function(){addon()}, false);
else if (window.attachEvent) window.attachEvent('onload', function(){addon()});