<table class="table table-hover table-striped table-condensed table-data">
	<thead>
		<tr>
			{%- for col in column -%}
				<th class="{{ col[3] }} {% if col[2] %}rotate{% endif %}" {% if col[0] %}data-filter="{{col[0]}}"{% endif %}><span>{{ col[1] }}</span></th>
			{%- endfor -%}
		</tr>
	</thead>
	<tbody>
		{% for data in dataList %}
			<tr>
				{% for item in data %}
					{% set col = column[loop.index0] %}
					{% set valueList = col[5] || col[4] %}
					{% if valueList %}
						<td class="{{col[3]}}" data-value="{{item}}" data-sort="{{item}}">
							{{valueList[item]|safe|default('')}}
						</td>
					{% else %}
						<td class="{{col[3]}}">{{item|safe}}</td>
					{% endif %}
				{% endfor %}
			</tr>
		{% endfor %}
	</tbody>
</table>