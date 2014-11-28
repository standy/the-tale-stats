app.pages.index = (function() {
	app.dom.title('Обзор');
	app.dom.header('Обзор');
	app.dom.breadcrumb();
	var content = [
		'<a href="' + app.url('places') + '">Города</a>',
		'<a href="' + app.url('councils') + '">Советники</a>',
		'<a href="' + app.url('players') + '">Игроки</a>',
		'<a href="' + app.url('clans') + '">Кланы</a>'
	];
	app.dom.content(content.join('<br>'));
	app.dom.nav();

});

//console.log(app)
