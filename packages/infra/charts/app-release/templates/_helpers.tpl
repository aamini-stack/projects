{{- define "app-release.name" -}}
{{- .Values.app.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
