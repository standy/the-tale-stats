{{ player|safe }}
{% if councilId %}
	{% if isAdded && isFriend %}
		<span class="text-success">начал помогать</span>
	{% elif !isAdded && isFriend %}
		<span class="text-warning">перестал помогать</span>
	{% elif isAdded && !isFriend %}
		<span class="text-danger">начал мешать</span>
	{% elif !isAdded && !isFriend %}
		<span class="text-info">перестал мешать</span>
	{% endif %}

	{% if council %}
		советнику:
		{{ council|safe -}}
	{%- endif -%}

	{%- if place -%}
		, из города
		{{ place|safe }}
	{% endif %}
{% else %}
	{% if isAdded %}
		<span class="text-success">поселился в городе</span>
	{% else %}
		<span class="text-warning">ушел из города</span>
	{% endif %}

	{% if place %}
		{{ place|safe }}
	{% endif %}

{% endif %}



