blacktiger-web
==============

The HTML/JavaScript/CSS client for blacktiger.

This project is purely client code for a modern HTML Browser. It does not have ANY server specific code, but the client can communicate with a blacktiger server - or be run standalone for testing purposes using mocked API's.
The easiest way to run this locally for testing is to use pythons builtin Http server. Simply go to directory holding the index.html in a commandline and type:
```
// Python 2.x
python -m SimpleHTTPServer

// Python 3.x
python -m http.server
```
(On Windows you will of course need to install Python first)
Or... simply go to http://drb-it.github.io/blacktiger-web to see the current edition.


Tests
--------------------
![Build status](https://api.travis-ci.org/DRB-IT/blacktiger-web.png)
