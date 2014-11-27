{{gender}}-{{race}} <a href="#player={{id}}">{{hero}}</a> {{level}},
покровитель: <a target="_blank" href="http://the-tale.org/game/heroes/{{id}}">{{name}}</a>
{% if clanId -%}
<a href="#clan={{clanId}}">{{clan}}</a>
{%- endif -%}

{#{{gender}}-{{race}} <a target="_blank" href="http://the-tale.org/game/heroes/{{id}}">{{hero}}</a> {{level}},
покровитель: <a target="_blank" href="http://the-tale.org/accounts/{{id}}">{{name}}</a>
{% if clanId -%}
	<a target="_blank" href="http://the-tale.org/game/clans/{{clanId}}">{{clan}}</a>
{%- endif -%}#}