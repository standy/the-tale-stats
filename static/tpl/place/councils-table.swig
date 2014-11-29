<div class="row">
	<div class="col-lg-4">
		<ul class="list-group">
		{% for council in councils %}
			<li class="list-group-item">
				{% if council.councilHtml %}
					<span class="badge" title="влиятельность">
						{{ council.inf }}%
					</span>
				{% endif %}

				<div data-toggle="collapse" data-target="#c-{{loop.key}}">
					<span class="caret"></span>
					{% if council.councilHtml -%}
						{{ council.councilHtml|safe -}}
					{%- else -%}
						{{ council.townHtml|safe -}}
					{%- endif -%}
					<br>
					<span class="text-muted">
						<span class="{% if council.friends.length %}text-success{% else %}text-muted{% endif %}">{{ council.friends.length|default(0) }}</span>
						{{- '/' -}}
						<span class="{% if council.enemies.length %}text-danger{% else %}text-muted{% endif %}">{{ council.enemies.length|default(0) }}</span>,
						бонусы:
						<span class="{% if council.plus %}text-success{% else %}text-muted{% endif %}">{{ council.plus }}%</span>
						{{- ' / ' -}}
						<span class="{% if council.minus %}text-danger{% else %}text-muted{% endif %}">{{ council.minus }}%</span>
					</span>
				</div>
				<div id="c-{{loop.key}}" class="panel-collapse collapse">
					<!--<div class="panel-body">-->
					<br>
					<ul class="list-unstyled">
						{% for relation in ['friends', 'enemies'] %}
							{% if council[relation] %}
								<li class="list-group-item1">
									{% if relation === 'friends' %}
										<span class="text-success">Друзья</span>
									{% else %}
										<span class="text-danger">Враги</span>
									{% endif %}
								</li>
								{% for data in council[relation] %}
									<li class="list-group-item1">
										<small class="pull-right">{{ data.daysStr }}</small>
										{{ data.html|safe }}
									</li>
								{% endfor %}
							{% endif %}
						{% endfor %}
						<!--{% if !council.enemies && !council.friends %}
							<li class="list-group-item1">нет</li>
						{% endif %}-->
					</ul>
					{% if council.councilModifiers %}
						<br>
						<span class="text-info" title="В скобках указано значение при наличии постройки">Специализация при полном влиянии:</span>
						<br>
						{% for modifier in council.councilModifiers %}
							{{ modifier.name }}: {{ modifier.value }}
							{#% if modifier.value != modifier.valueB %#}
								({{ modifier.valueB }})
							{#% endif %#}
							<br>
						{% endfor %}
					{#
					{% elif council.totalModifiers %}
						{% set total = 0 %}
						{% for councilModifier in council.totalModifiers %}
							{% if loop.index0 %} + {% endif %}
							{{ councilModifier.inf }}% * {{ councilModifier.modifier.value }}
							{% set total = total + councilModifier.inf * councilModifier.modifier.value / 100 %}
						{% endfor %}
						= {{ total }}
					#}
					{% endif %}
				</div>
			</li>
		{% endfor %}
		</ul>
	</div>
	<div class="col-lg-8">
		<div class="chart" id="chart-councils" style="width: 100%; height: 400px;" ></div>
	</div>
</div>