{{- define "server-manager.name" -}}
{{- default .Chart.Name .Values.nameOverride | lower | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "server-manager.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | lower | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride | lower -}}
{{- if contains $name (lower .Release.Name) -}}
{{- .Release.Name | lower | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | lower | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "server-manager.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" -}}
{{- end -}}

{{- define "server-manager.labels" -}}
helm.sh/chart: {{ include "server-manager.chart" . }}
{{ include "server-manager.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "server-manager.selectorLabels" -}}
app.kubernetes.io/name: {{ include "server-manager.name" . }}
app.kubernetes.io/instance: {{ .Release.Name | lower }}
{{- end -}}

{{- define "server-manager.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "server-manager.fullname" .) (.Values.serviceAccount.name | lower) -}}
{{- else -}}
{{- default "default" (.Values.serviceAccount.name | lower) -}}
{{- end -}}
{{- end -}}

{{- define "server-manager.secretName" -}}
{{- if .Values.secrets.create -}}
{{- default (printf "%s-secret" (include "server-manager.fullname" .)) (.Values.secrets.name | lower) -}}
{{- else -}}
{{- if .Values.secrets.existingName -}}
{{- .Values.secrets.existingName | lower -}}
{{- else -}}
{{- default (printf "%s-secret" (include "server-manager.fullname" .)) (.Values.secrets.name | lower) -}}
{{- end -}}
{{- end -}}
{{- end -}}

