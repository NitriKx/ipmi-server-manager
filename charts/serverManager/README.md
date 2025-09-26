# server-manager Helm Chart

This chart deploys the [`danielv123/servermanager`](https://github.com/Danielv123/serverManager) application on Kubernetes. It packages the backend service together with the built frontend and runs the published container image from `ghcr.io/danielv123/servermanager:latest`.

## Values Reference

### Top-level
| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `replicaCount` | int | `1` | Number of pod replicas. |
| `controller.kind` | string | `Deployment` | Controller type: `Deployment` or `StatefulSet`. |
| `controller.updateStrategy` | object | `{}` | Custom update strategy for the chosen controller. |
| `image.repository` | string | `ghcr.io/danielv123/servermanager` | Container image repository. |
| `image.tag` | string | `latest` | Image tag. |
| `image.pullPolicy` | string | `IfNotPresent` | Image pull policy. |
| `image.pullSecrets` | list | `[]` | Image pull secret references. |
| `nameOverride` | string | `""` | Override for chart name. |
| `fullnameOverride` | string | `""` | Override for full resource names. |

### Service Account & Security
| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `serviceAccount.create` | bool | `true` | Whether to create a ServiceAccount. |
| `serviceAccount.name` | string | `""` | Custom ServiceAccount name. |
| `serviceAccount.annotations` | object | `{}` | Annotations for ServiceAccount. |
| `podAnnotations` | object | `{}` | Pod annotations. |
| `podLabels` | object | `{}` | Extra pod labels. |
| `podSecurityContext` | object | `{}` | Pod-level security context. |
| `securityContext` | object | `{}` | Container security context. |

### Service & Ingress
| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `service.type` | string | `ClusterIP` | Service type. |
| `service.port` | int | `8080` | Service port. |
| `service.annotations` | object | `{}` | Service annotations. |
| `service.labels` | object | `{}` | Additional Service labels. |
| `service.loadBalancerIP` | string | `""` | Static LoadBalancer IP. |
| `service.externalTrafficPolicy` | string | `""` | External traffic policy for LoadBalancer or NodePort. |
| `service.clusterIP` | string | `""` | Override clusterIP; blank for default, `None` for headless. |
| `ingress.enabled` | bool | `false` | Enable ingress resource. |
| `ingress.className` | string | `""` | Ingress class name. |
| `ingress.annotations` | object | `{}` | Ingress annotations. |
| `ingress.labels` | object | `{}` | Extra ingress labels. |
| `ingress.hosts` | list | see values | Host and path routing configuration. |
| `ingress.tls` | list | `[]` | TLS configuration. |

### Probes & Resources
| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `resources` | object | `{}` | Resource requests and limits. |
| `livenessProbe` | object | HTTP probe config | Liveness probe options; include `enabled` flag. |
| `readinessProbe` | object | HTTP probe config | Readiness probe options; include `enabled` flag. |

### Environment & Secrets
| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `env` | list | `[]` | Additional environment variables. |
| `envFrom` | list | `[]` | Extra `envFrom` sources. |
| `secrets.create` | bool | `false` | Create a Secret from provided data. |
| `secrets.name` | string | `""` | Name for generated Secret. |
| `secrets.existingName` | string | `""` | Reference to existing Secret. |
| `secrets.type` | string | `Opaque` | Secret type. |
| `secrets.annotations` | object | `{}` | Secret annotations. |
| `secrets.data` | object | `{}` | Key/value entries for managed Secret (base64 encoded automatically). |

### Persistence
| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `persistence.enabled` | bool | `false` | Enable persistent storage. |
| `persistence.accessModes` | list | `[ReadWriteOnce]` | PVC access modes. |
| `persistence.size` | string | `1Gi` | Requested storage size. |
| `persistence.storageClass` | string | `""` | Storage class name. |
| `persistence.existingClaim` | string | `""` | Use an existing PVC instead of creating one. |
| `persistence.annotations` | object | `{}` | PVC annotations. |
| `persistence.labels` | object | `{}` | PVC labels. |
| `persistence.mountPath` | string | `/data` | Container mount path. |

### Scheduling
| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `nodeSelector` | object | `{}` | Node selector rules. |
| `tolerations` | list | `[]` | Pod tolerations. |
| `affinity` | object | `{}` | Affinity rules. |
| `topologySpreadConstraints` | list | `[]` | Topology spread constraints. |

### Extensions
| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `extraVolumeMounts` | list | `[]` | Additional volume mounts. |
| `extraVolumes` | list | `[]` | Additional volumes. |
| `extraManifests` | list | `[]` | Extra Kubernetes manifests or templated YAML snippets to render alongside the release. |

## Usage
```bash
helm dependency update charts/serverManager
helm install my-servermanager charts/serverManager
```

Override values with `-f custom-values.yaml` or `--set key=value`. Use `controller.kind=StatefulSet` with persistence for stable storage, or provide `persistence.existingClaim` when reusing an existing PVC.
