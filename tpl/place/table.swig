<h2>{{ verbose.translate[type] }}</h2>
<div class="row">
	<div class="col-lg-3">
		<table class="table table-striped table-hover">
			<!--<thead>
				<tr>
					<th colspan="2">{{ verbose.translate[type] }}</th>
				</tr>
			</thead>-->
			<tbody>
				{%- for item in data -%}
					<tr>
						<th>{{ item.key }}</th>
						<td>{{ item.value }}</td>
					</tr>
				{%- endfor -%}
			</tbody>
		</table>
	</div>
	<div class="col-lg-9">
		<div class="chart" id="chart-{{type}}" style="height: 400px; width: 100%;"></div>
	</div>
</div>