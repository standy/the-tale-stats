<div class="row">
	<div class="col-lg-4">
		{% for council in data %}
			<div class="panel panel-default">
				<div class="panel-heading" data-toggle="collapse" data-target="#c-{{loop.key}}">
					<span class="caret"></span>
					{% if council.councilHtml -%}
						{{ council.councilHtml|safe -}}
					{%- else -%}
						{{ council.townHtml|safe -}}
					{%- endif -%}
					<br>
					{{ council.friends.length|default(0) }}/{{ council.enemies.length|default(0) }},
					{% if council.councilHtml %}
						влиятельность:
						{{ council.inf }}%,
					{% endif %}
					бонусы:
					{{ council.plus }}% / {{ council.minus }}%
				</div>
				<div id="c-{{loop.key}}" class="panel-collapse collapse">
					<!--<div class="panel-body">-->
						<ul class="list-group">
							{% if council.friends %}
								<li class="list-group-item"><span class="text-success">Друзья</span></li>
								<li class="list-group-item">{{council.friendsHtmls|safe|join('</li><li class="list-group-item">')}}</li>
							{% endif %}
							{% if council.enemies %}
								<li class="list-group-item"><span class="text-danger">Враги</span></li>
								<li class="list-group-item">{{council.enemiesHtmls|safe|join('</li><li class="list-group-item">')}}</li>
							{% endif %}
							{% if !council.enemies && !council.friends %}
								<li class="list-group-item">нет</li>
							{% endif %}
						</ul>
					<!--</div>-->
				</div>
			</div>
		{% endfor %}
	</div>
	<div class="col-lg-8">
		<div class="chart" id="chart-councils" style="width: 100%; height: 400px;" ></div>
	</div>
</div>