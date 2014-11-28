<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
	<title>Сказочная статистика</title>
	<meta name="description" content="">
	<meta name="viewport" content="width=device-width, initial-scale=1">

	<link rel="stylesheet" href="static/css/vendor/bootstrap.css">
	<link rel="stylesheet" href="static/css/vendor/jquery.custom-scroll.css">
	<link rel="stylesheet" href="static/css/main.css">
</head>
<body>
<div class="navbar navbar-default" role="navigation">
	<div class="container">
		<div class="navbar-header">
			<a class="navbar-brand" href="#">Сказочная статистика <sup>[beta]</sup></a>
		</div>
		<ul class="nav navbar-nav" id="nav-top">
			<li><a data-type="place" href="#!places">Города</a></li>
			<li><a data-type="council" href="#!councils">Советники</a></li>
			<li><a data-type="player" href="#!players">Игроки</a></li>
			<li><a data-type="clan" href="#!clans">Кланы</a></li>
		</ul>
	</div>
</div>

<div class="container">
	<nav id="nav-places" class="">
		<ul class="list-inline">
			{% for place in places -%}
				<li><a data-id="{{ place.id }}" href="#!place/{{ place.id }}" >{{ place.name }}</a></li>
			{%- endfor %}
		</ul>
	</nav>

	<h1 id="header"></h1>


	<ol class="breadcrumb" id="breadcrumb"><li><a href="#">Сказочная статистика</a></li></ol>

	<div id="content">Подождите...</div>

	<hr>

	<footer>
		<p>standy &copy; 2014</p>
	</footer>
</div>
<!-- /container -->
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<script>window.jQuery || document.write('<script src="static/js/vendor/jquery.min.js"><\/script>')</script>
<script src="static/js/vendor/canvasjs.min.js"></script>
<script src="static/js/vendor/bootstrap.js"></script>
<script src="static/js/vendor/moment.js"></script>
<script src="static/js/vendor/swig.min.js"></script>
<script src="static/js/vendor/jquery.custom-scroll.js"></script>
<script src="static/js/vendor/minivents.min.js"></script>
<script src="static/js/utils/tables.js"></script>

<script src="static/js/app.js"></script>
<script src="static/js/index.js"></script>
<script src="static/js/place.js"></script>
<script src="static/js/places.js"></script>
<script src="static/js/council.js"></script>
<script src="static/js/councils.js"></script>
<script src="static/js/player.js"></script>
<script src="static/js/players.js"></script>
<script src="static/js/clan.js"></script>
<script src="static/js/clans.js"></script>


<script>
(function(s,t,a,n,d,y){s.GoogleAnalyticsObject=n;s[n]||(s[n]=
function(){(s[n].q=s[n].q||[]).push(arguments)});s[n].l=+new Date;
d=t.createElement(a);y=t.getElementsByTagName(a)[0];
d.src='//www.google-analytics.com/analytics.js';
y.parentNode.insertBefore(d,y)}(window,document,'script','ga'));
ga('create','UA-33261217-5','auto');//ga('send','pageview');
</script>
<!--<script>
var ga = function() {
	var args = Array.prototype.slice.call(arguments);
	args.unshift('ga:');
	console.log.apply(console, args);
}
</script>-->
</body>
</html>
