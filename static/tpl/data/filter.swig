<form role="form" id="filter" class="filter form-horizontal">
	{% for group in filter %}
		<div class="form-group" data-filter="{{group.filter}}">
			<label class="control-label col-sm-1">{{group.label}}</label>
			<div class="col-sm-11">
				{% for input in group.inputs %}
					<label class="{{group.type}}-inline">
						<input type="{{group.type}}" name="filter-{{group.filter}}" data-value="{{input.value}}"> {{input.text}}
					</label>
				{% endfor %}
			</div>
		</div>
	{% endfor %}
</form>
<div id="filter-count"></div>